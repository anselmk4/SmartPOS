import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@/lib/shared/types";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAWAPAY_WEBHOOK_SECRET = process.env.PAWAPAY_WEBHOOK_SECRET || process.env.PAWAPAY_API_KEY || "kuettu_pawapay_webhook_secret_key_2026";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-pawapay-signature") || req.headers.get("authorization");

    // Cryptographic validation (if secret is configured in production)
    if (process.env.NODE_ENV === "production" && process.env.PAWAPAY_WEBHOOK_SECRET) {
      if (!signatureHeader) {
        return NextResponse.json(
          { success: false, error: "Signature de webhook manquante (401 Unauthorized)" },
          { status: 401 }
        );
      }

      const expectedHmac = crypto
        .createHmac("sha256", PAWAPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      const cleanProvided = signatureHeader.replace(/^Bearer\s+/i, "").replace(/^sha256=/i, "");

      if (cleanProvided !== expectedHmac && cleanProvided !== PAWAPAY_WEBHOOK_SECRET) {
        return NextResponse.json(
          { success: false, error: "Signature de webhook invalide" },
          { status: 401 }
        );
      }
    }

    const body = JSON.parse(rawBody);
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
