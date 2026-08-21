import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/shared/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, plan, planStatus = "ACTIVE" } = body;

    if (!tenantId || !plan) {
      return NextResponse.json(
        { success: false, error: "Identifiants tenantId et plan requis" },
        { status: 400 }
      );
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: plan as SubscriptionPlan,
        planStatus: planStatus as SubscriptionStatus,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Forfait ${plan} mis à jour avec succès.`,
    });
  } catch (error: any) {
    console.error("[Update Plan API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la mise à jour du forfait" },
      { status: 500 }
    );
  }
}
