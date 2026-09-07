import { NextRequest, NextResponse } from "next/server";
import { verifySuperAdmin, unauthorizedAdminResponse, validateAdminPassword } from "@/lib/admin/admin-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/v1/admin/auth/verify-password
 * Checks if the provided admin password is valid for sensitive operations
 */
export async function POST(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await req.json().catch(() => ({}));
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Mot de passe administrateur requis" },
        { status: 400 }
      );
    }

    const isValid = validateAdminPassword(password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Mot de passe administrateur incorrect" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Mot de passe administrateur validé",
    });
  } catch (error: any) {
    console.error("[Admin Verify Password Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
