import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, resetRateLimit } from "@/lib/security/rate-limiter";
import { createSessionToken } from "@/lib/security/jwt";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSuperAdminCredentials() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[Security Critical] Les variables ADMIN_EMAIL et ADMIN_PASSWORD doivent être configurées en production."
      );
    }
    return {
      email: email || "info@kuettu.com",
      password: password || "Password1!",
    };
  }

  return { email, password };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await req.json();
    const { email, password } = body;

    // Strict Rate Limit: 5 attempts per 15 minutes per IP
    const rateLimit = checkRateLimit(`admin-login:${ip}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
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

    const { email: superAdminEmail, password: superAdminPassword } = getSuperAdminCredentials();

    const cleanInputEmail = email.trim().toLowerCase();
    const cleanSuperEmail = superAdminEmail.trim().toLowerCase();

    const emailMatch = cleanInputEmail === cleanSuperEmail;

    // Timing safe comparison for password
    const inputPassBuffer = Buffer.from(String(password));
    const superPassBuffer = Buffer.from(String(superAdminPassword));

    const passwordMatch =
      inputPassBuffer.length === superPassBuffer.length &&
      crypto.timingSafeEqual(inputPassBuffer, superPassBuffer);

    if (!emailMatch || !passwordMatch) {
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
        email: cleanSuperEmail,
        name: "Super Administrateur Kuettu Global POS",
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
