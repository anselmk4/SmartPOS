import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SessionPayload } from "@/lib/security/jwt";

export function verifySuperAdmin(req: NextRequest): { authenticated: boolean; payload?: SessionPayload; error?: string } {
  // 1. Try cookie first
  let token = req.cookies.get("kuettu_admin_token")?.value;

  // 2. Try authorization header
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  // 3. Try custom header if sent from admin client
  if (!token) {
    const customHeader = req.headers.get("x-admin-token");
    if (customHeader) {
      token = customHeader.trim();
    }
  }

  if (!token) {
    return { authenticated: false, error: "Non authentifié (token super-admin manquant)" };
  }

  const payload = verifySessionToken(token);
  if (!payload || payload.role !== "SUPER_ADMIN") {
    return { authenticated: false, error: "Accès refusé : privilèges Super Administrateur requis" };
  }

  return { authenticated: true, payload };
}

export function unauthorizedAdminResponse(message = "Accès non autorisé"): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}
