import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, resetRateLimit } from "@/lib/security/rate-limiter";
import { createSessionToken } from "@/lib/security/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@kuettu.com";
const SUPER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Password1!";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await req.json();
    const { email, password } = body;

    // Rate Limit: 5 attempts per 10 minutes per IP
    const rateLimit = checkRateLimit(`admin-login:${ip}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: rateLimit.message },
        { status: 429 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const isMatch =
      email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() &&
      password === SUPER_ADMIN_PASSWORD;

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Identifiants super-administrateur incorrects",
          remainingAttempts: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful authentication
    resetRateLimit(`admin-login:${ip}`);

    const token = createSessionToken({
      userId: "super-admin-root",
      tenantId: "global-platform-admin",
      role: "SUPER_ADMIN",
    });

    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        email: SUPER_ADMIN_EMAIL,
        name: "Super Administrateur Kuettu",
        role: "SUPER_ADMIN",
        loginAt: new Date().toISOString(),
      },
      message: "Connexion SuperAdmin réussie",
    });

    // Set secure HTTP-only cookie
    response.cookies.set("kuettu_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Admin Auth API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
