import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/security/jwt";
import { verifyDeleteStoreOtp } from "@/lib/services/otp-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/v1/stores/delete
 * Verifies Email OTP and securely deletes a secondary store
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
    const { storeId, otpCode, email } = body;

    if (!storeId || !otpCode) {
      return NextResponse.json(
        { success: false, error: "storeId et code OTP obligatoires." },
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

    // 2. Prevent deleting the last store
    const remainingStores = await prisma.store.findMany({
      where: {
        tenantId: session.tenantId,
        id: { not: storeId },
      },
      orderBy: { createdAt: "asc" },
    });

    if (remainingStores.length === 0) {
      return NextResponse.json(
        { success: false, error: "Impossible de supprimer la seule boutique active de votre compte." },
        { status: 400 }
      );
    }

    const fallbackStoreId = remainingStores[0].id;

    // 3. Find Owner User & Email
    const ownerUser = await prisma.user.findFirst({
      where: {
        tenantId: session.tenantId,
        role: "OWNER",
        isActive: true,
      },
    });

    const targetEmail = email?.trim().toLowerCase() || ownerUser?.email?.trim().toLowerCase() || session.email;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: "Adresse e-mail du propriétaire introuvable." },
        { status: 400 }
      );
    }

    // 4. Verify OTP
    const verifyRes = await verifyDeleteStoreOtp({
      tenantId: session.tenantId,
      identifier: targetEmail,
      otpCode: String(otpCode).trim(),
    });

    if (!verifyRes.success) {
      return NextResponse.json(
        { success: false, error: verifyRes.error || "Code OTP incorrect ou expiré." },
        { status: 400 }
      );
    }

    // 5. Reassign items / users attached to this store to the fallback store
    await prisma.$transaction(async (tx) => {
      // Reassign products
      await tx.product.updateMany({
        where: { storeId: store.id },
        data: { storeId: fallbackStoreId },
      });

      // Reassign sales
      await tx.sale.updateMany({
        where: { storeId: store.id },
        data: { storeId: fallbackStoreId },
      });

      // Reassign customers
      await tx.customer.updateMany({
        where: { storeId: store.id },
        data: { storeId: fallbackStoreId },
      });

      // Delete the store
      await tx.store.delete({
        where: { id: store.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Boutique "${store.name}" supprimée avec succès. Les données ont été transférées vers "${remainingStores[0].name}".`,
      fallbackStoreId,
    });
  } catch (error: any) {
    console.error("[Delete Store Route Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la suppression de la boutique" },
      { status: 500 }
    );
  }
}
