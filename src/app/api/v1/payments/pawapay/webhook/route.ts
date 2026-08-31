import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function mapProviderToPaymentMethod(providerOrOp?: string | null): PaymentMethod {
  if (!providerOrOp) return "MPESA";
  const p = providerOrOp.toUpperCase();

  if (p.includes("AIRTEL")) return "AIRTEL_MONEY";
  if (p.includes("ORANGE")) return "ORANGE_MONEY";
  if (p.includes("AFRICELL") || p.includes("AFRIMONEY")) return "AFRIMONEY";
  if (p.includes("WAVE")) return "WAVE";
  if (p.includes("MTN")) return "MTN_MOMO";
  if (p.includes("MOOV")) return "MOOV_MONEY";
  if (p.includes("MPESA") || p.includes("VODACOM")) return "MPESA";
  if (p.includes("ILLICO")) return "ILLICOCASH";

  return (providerOrOp as PaymentMethod) || "MPESA";
}

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
    const { depositId, payoutId, refundId, checkoutId, paymentId, status, metadata, customData, eventType, event } = body;
    const transactionId = depositId || payoutId || refundId || checkoutId || paymentId || body.id;

    console.log("[PawaPay Webhook Received]:", {
      transactionId,
      status: status || event,
      eventType,
      metadata: metadata || customData,
    });

    let tenantId = metadata?.tenantId || customData?.tenantId;
    let plan = (metadata?.plan || customData?.plan || "PRO") as SubscriptionPlan;

    // Handle array metadata format [{ tenantId: "..." }, { plan: "..." }]
    if (Array.isArray(metadata)) {
      for (const item of metadata) {
        if (item.tenantId) tenantId = item.tenantId;
        if (item.plan) plan = item.plan as SubscriptionPlan;
        if (item.name === "tenantId" || item.fieldName === "tenantId") tenantId = item.value || item.fieldValue;
        if (item.name === "plan" || item.fieldName === "plan") plan = (item.value || item.fieldValue) as SubscriptionPlan;
      }
    }

    // Fallback: look up pending subscription by transactionId
    if (!tenantId && transactionId) {
      const pendingSub = await prisma.subscription.findFirst({
        where: { transactionId },
      });
      if (pendingSub) {
        tenantId = pendingSub.tenantId;
        plan = pendingSub.plan;
      }
    }

    const detectedProvider =
      body.payer?.accountDetails?.provider ||
      body.correspondent ||
      body.provider;
    const paymentMethod = mapProviderToPaymentMethod(detectedProvider);

    // If it's a deposit or checkout completion
    const currentStatus = String(status || event || "").toUpperCase();

    if (tenantId) {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (currentStatus === "COMPLETED" || currentStatus === "SUCCESS" || currentStatus === "DEPOSIT_COMPLETED") {
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

        // Update or create subscription record
        if (transactionId) {
          const existingSub = await prisma.subscription.findFirst({
            where: { transactionId },
          });

          if (existingSub) {
            await prisma.subscription.update({
              where: { id: existingSub.id },
              data: {
                paymentStatus: "ACTIVE",
                paymentMethod,
                periodStart: now,
                periodEnd,
              },
            });
          } else {
            await prisma.subscription.create({
              data: {
                tenantId,
                plan,
                amount: Number(body.amount || 0),
                currency: body.currency || "CDF",
                paymentMethod,
                paymentStatus: "ACTIVE",
                transactionId,
                periodStart: now,
                periodEnd,
              },
            });
          }
        }
      } else if (
        currentStatus === "FAILED" ||
        currentStatus === "REJECTED" ||
        currentStatus === "EXPIRED" ||
        currentStatus === "CANCELLED"
      ) {
        if (transactionId) {
          await prisma.subscription.updateMany({
            where: {
              tenantId,
              transactionId,
            },
            data: {
              paymentStatus: "PAST_DUE",
            },
          });
        }
      }
    }

    return NextResponse.json({
      received: true,
      processedStatus: currentStatus,
      paymentMethod,
      transactionId,
    });
  } catch (error: any) {
    console.error("[PawaPay Webhook Error]:", error);
    return NextResponse.json(
      { received: false, error: error.message },
      { status: 500 }
    );
  }
}
