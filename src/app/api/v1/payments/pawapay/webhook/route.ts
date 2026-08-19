import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@/lib/shared/types";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getPawaPayWebhookSecret(): string {
  const secret = process.env.PAWAPAY_WEBHOOK_SECRET || process.env.PAWAPAY_API_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Security Critical] PAWAPAY_WEBHOOK_SECRET est obligatoire en production.");
    }
    return "kuettu_pawapay_webhook_secret_key_2026";
  }
  return secret;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-pawapay-signature") || req.headers.get("authorization");
    const secret = getPawaPayWebhookSecret();

    // Cryptographic signature validation
    if (!signatureHeader) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Signature de webhook manquante (401 Unauthorized)" },
          { status: 401 }
        );
      }
    } else {
      const expectedHmac = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const cleanProvided = signatureHeader.replace(/^Bearer\s+/i, "").replace(/^sha256=/i, "").trim();

      const provBuffer = Buffer.from(cleanProvided);
      const expBuffer = Buffer.from(expectedHmac);
      const secretBuffer = Buffer.from(secret);

      const isValidHmac =
        provBuffer.length === expBuffer.length && crypto.timingSafeEqual(provBuffer, expBuffer);
      const isValidBearer =
        provBuffer.length === secretBuffer.length && crypto.timingSafeEqual(provBuffer, secretBuffer);

      if (!isValidHmac && !isValidBearer) {
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
