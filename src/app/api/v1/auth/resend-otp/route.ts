import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerRegistrationOtp } from "@/lib/services/otp-service";
import { formatPhoneNumberE164 } from "@/lib/services/sms-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier } = body;

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Identifiant (téléphone ou e-mail) requis" },
        { status: 400 }
      );
    }

    const cleanInput = identifier.trim();
    const isEmail = cleanInput.includes("@");
    const formattedPhone = isEmail ? null : formatPhoneNumberE164(cleanInput);

    // Find User & Tenant
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: cleanInput.toLowerCase() }
        : {
            OR: [
              { phone: cleanInput },
              { phone: formattedPhone || undefined },
            ],
          },
      include: {
        tenant: true,
      },
    });

    if (!user || !user.tenant) {
      return NextResponse.json(
        { success: false, error: "Aucun compte en attente trouvé pour cet identifiant" },
        { status: 404 }
      );
    }

    // Rate-limiting check: ensure at least 30s elapsed since last OTP creation
    const recentOtp = await prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
        createdAt: { gt: new Date(Date.now() - 30 * 1000) },
      },
    });

    if (recentOtp) {
      return NextResponse.json(
        { success: false, error: "Veuillez patienter 30 secondes avant de demander un nouveau code" },
        { status: 429 }
      );
    }

    const otpRes = await triggerRegistrationOtp({
      tenantId: user.tenant.id,
      userId: user.id,
      phone: user.phone || cleanInput,
      email: user.email,
      storeName: user.tenant.name,
      ownerName: user.name,
    });

    if (!otpRes.success) {
      return NextResponse.json(
        { success: false, error: otpRes.error || "Erreur lors de l'envoi du code" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      verificationMethod: otpRes.verificationMethod,
      identifier: otpRes.identifier,
      isSimulated: otpRes.isSimulated,
      simulatedCode: otpRes.simulatedCode,
      message: `Nouveau code envoyé par ${otpRes.verificationMethod === "EMAIL" ? "e-mail" : "SMS"}.`,
    });
  } catch (error: any) {
    console.error("[Auth Resend OTP API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors du renvoi du code" },
      { status: 500 }
    );
  }
}
