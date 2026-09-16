import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyFreeSubscriptionMonth } from "@/lib/services/affiliate-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { affiliateId, tenantId, rewardId } = body;

    let targetAffiliateId = affiliateId;

    if (!targetAffiliateId && tenantId) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { tenantId },
      });
      if (affiliate) {
        targetAffiliateId = affiliate.id;
      }
    }

    if (!targetAffiliateId) {
      return NextResponse.json(
        { success: false, error: "Identifiant affilié (affiliateId) manquant." },
        { status: 400 }
      );
    }

    const result = await applyFreeSubscriptionMonth(targetAffiliateId, rewardId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      newPlanExpiresAt: result.newPlanExpiresAt?.toISOString(),
    });
  } catch (error: any) {
    console.error("[Claim Reward API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'application de la récompense" },
      { status: 500 }
    );
  }
}
