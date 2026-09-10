import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/security/jwt";
import { triggerDeleteStoreOtp } from "@/lib/services/otp-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/v1/stores/delete-otp
 * Triggers an OTP code sent to the Owner's email before allowing store deletion
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.replace(/^Bearer\s+/i, "");
    const cookieToken = req.cookies.get("kuettu_session_token")?.value;
    const token = bearerToken || cookieToken || "";

    const session = token ? verifySessionToken(token) : null;
    if (!session || !session.userId || !session.tenantId) {
      return NextResponse.json(
        { success: false, error: "Non autorisé. Veuillez vous reconnecter." },
        { status: 401 }
      );
    }

    if (session.role !== "OWNER" && session.tenantId !== "global-platform-admin") {
      return NextResponse.json(
        { success: false, error: "Action réservée exclusivement au Propriétaire du compte." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "Identifiant de boutique (storeId) manquant." },
        { status: 400 }
      );
    }

    // 1. Fetch store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store || store.tenantId !== session.tenantId) {
      return NextResponse.json(
        { success: false, error: "Boutique introuvable dans votre organisation." },
        { status: 404 }
      );
    }

    // 2. Ensure the tenant has more than 1 store (cannot delete the only store)
    const storesCount = await prisma.store.count({
      where: { tenantId: session.tenantId },
    });

    if (storesCount <= 1) {
      return NextResponse.json(
        { success: false, error: "Impossible de supprimer la seule boutique active de votre compte." },
        { status: 400 }
      );
    }

    // 3. Find Owner User & Email
    const ownerUser = await prisma.user.findFirst({
      where: {
        tenantId: session.tenantId,
        role: "OWNER",
        isActive: true,
      },
    });

    const targetEmail = ownerUser?.email || session.email;

    if (!targetEmail || !targetEmail.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucune adresse e-mail valide n'est configurée pour le propriétaire de ce compte. Veuillez ajouter un e-mail dans vos paramètres.",
        },
        { status: 400 }
      );
    }

    // 4. Trigger OTP
    const otpRes = await triggerDeleteStoreOtp({
      tenantId: session.tenantId,
      userId: ownerUser?.id || session.userId,
      storeId: store.id,
      storeName: store.name,
      ownerEmail: targetEmail,
      ownerName: ownerUser?.name || "Propriétaire",
    });

    if (!otpRes.success) {
      return NextResponse.json(
        { success: false, error: otpRes.error || "Échec de l'envoi du code OTP par e-mail." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Code de confirmation envoyé avec succès à l'adresse e-mail : ${targetEmail}`,
      email: targetEmail,
      simulatedCode: otpRes.simulatedCode,
    });
  } catch (error: any) {
    console.error("[Delete Store OTP Route Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
