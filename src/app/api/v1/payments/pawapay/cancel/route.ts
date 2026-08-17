import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, reason = "Demande d'annulation utilisateur" } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Identifiant de boutique (tenantId) requis" },
        { status: 400 }
      );
    }

    const now = new Date();

    // 1. Update Tenant in PostgreSQL to FREE plan with CANCELLED status
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: "FREE",
        planStatus: "CANCELLED",
        updatedAt: now,
      },
    });

    // 2. Mark active subscriptions as CANCELLED
    await prisma.subscription.updateMany({
      where: {
        tenantId,
        paymentStatus: "ACTIVE",
      },
      data: {
        paymentStatus: "CANCELLED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Votre abonnement a été annulé avec succès. Vous conservez vos accès jusqu'à la fin de la période en cours.",
      planStatus: "CANCELLED",
    });
  } catch (error: any) {
    console.error("[PawaPay Cancel Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'annulation de l'abonnement" },
      { status: 500 }
    );
  }
}
