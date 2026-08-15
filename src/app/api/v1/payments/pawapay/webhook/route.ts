import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@/lib/shared/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { depositId, status, metadata, customData } = body;

    console.log("[PawaPay Webhook Received]:", { depositId, status, metadata });

    const tenantId = metadata?.tenantId || customData?.tenantId;
    const plan = (metadata?.plan || customData?.plan || "PRO") as SubscriptionPlan;

    if (!tenantId) {
      return NextResponse.json({ received: true, warning: "No tenantId in metadata" });
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (status === "COMPLETED") {
      // Activate tenant plan
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan,
          planStatus: "ACTIVE",
          planExpiresAt: periodEnd,
          updatedAt: now,
        },
      });

      // Update subscription status
      await prisma.subscription.updateMany({
        where: {
          tenantId,
          transactionId: depositId,
        },
        data: {
          paymentStatus: "ACTIVE",
          periodStart: now,
          periodEnd,
        },
      });
    } else if (status === "FAILED" || status === "REJECTED") {
      await prisma.subscription.updateMany({
        where: {
          tenantId,
          transactionId: depositId,
        },
        data: {
          paymentStatus: "PAST_DUE",
        },
      });
    }

    return NextResponse.json({ received: true, processedStatus: status });
  } catch (error: any) {
    console.error("[PawaPay Webhook Error]:", error);
    return NextResponse.json(
      { received: false, error: error.message },
      { status: 500 }
    );
  }
}
