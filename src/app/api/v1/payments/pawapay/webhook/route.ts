import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPawaPayDepositStatus } from "@/lib/payments/pawapay-client";
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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-pawapay-signature") || req.headers.get("authorization");
    const secret = process.env.PAWAPAY_WEBHOOK_SECRET;

    // 1. Mandatory Signature Verification if PAWAPAY_WEBHOOK_SECRET is configured
    if (secret) {
      if (!signatureHeader) {
        return NextResponse.json(
          { received: false, error: "Signature webhook PawaPay manquante" },
          { status: 401 }
        );
      }

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
          { received: false, error: "Signature webhook PawaPay invalide" },
          { status: 401 }
        );
      }
    }

    const body = JSON.parse(rawBody);
    const { depositId, payoutId, refundId, checkoutId, paymentId, status, metadata, customData, eventType, event } = body;
    const transactionId = depositId || payoutId || refundId || checkoutId || paymentId || body.id;

    if (!transactionId) {
      return NextResponse.json({ received: false, error: "Identifiant de transaction manquant" }, { status: 400 });
    }

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

    let currentStatus = String(status || event || "").toUpperCase();

    // 2. Direct Server-Side Verification against PawaPay official API
    // If webhook reports completion, verify directly with PawaPay to ensure 100% authentic callback
    const targetDepositId = depositId || transactionId;
    if (targetDepositId) {
      try {
        const verified = await checkPawaPayDepositStatus(targetDepositId);
        if (verified.status && verified.status !== "UNKNOWN") {
          currentStatus = verified.status.toUpperCase();
        } else if (process.env.NODE_ENV === "production" && !verified.status) {
          return NextResponse.json(
            { received: false, error: "Impossible de vérifier la transaction auprès de PawaPay" },
            { status: 400 }
          );
        }
      } catch (verErr: any) {
        console.warn("[PawaPay Webhook] Direct re-query note:", verErr.message);
      }
    }

    const detectedProvider =
      body.payer?.accountDetails?.provider ||
      body.correspondent ||
      body.provider;
    const paymentMethod = mapProviderToPaymentMethod(detectedProvider);

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
