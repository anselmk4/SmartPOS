import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationOtp } from "@/lib/services/otp-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, code } = body;

    if (!identifier || !code) {
      return NextResponse.json(
        { success: false, error: "Identifiant (téléphone/email) et code de confirmation à 6 chiffres requis" },
        { status: 400 }
      );
    }

    const cleanCode = code.toString().trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { success: false, error: "Le code de confirmation doit comporter exactement 6 chiffres" },
        { status: 400 }
      );
    }

    const result = await verifyRegistrationOtp(identifier, cleanCode);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Code invalide ou expiré" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      tenant: result.tenant,
      user: result.user,
      stores: result.stores,
      message: "Commerce confirmé et activé avec succès !",
    });
  } catch (error: any) {
    console.error("[Auth Verify OTP API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la vérification du code" },
      { status: 500 }
    );
  }
}
