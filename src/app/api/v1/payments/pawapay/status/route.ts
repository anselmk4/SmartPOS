import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPawaPayDepositStatus } from "@/lib/payments/pawapay-client";
import type { SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const depositId = searchParams.get("depositId");
    const tenantId = searchParams.get("tenantId");
    const plan = (searchParams.get("plan") || "PRO") as SubscriptionPlan;
    const operatorParam = searchParams.get("operator");

    if (!depositId) {
      return NextResponse.json(
        { success: false, error: "Identifiant de dépôt (depositId) manquant" },
        { status: 400 }
      );
    }

    const checkRes = await checkPawaPayDepositStatus(depositId);
    const status = String(checkRes.status || "").toUpperCase();

    // Detect actual provider from PawaPay response data or client param
    const detectedProvider =
      checkRes.raw?.data?.payer?.accountDetails?.provider ||
      checkRes.raw?.payer?.accountDetails?.provider ||
      checkRes.raw?.data?.correspondent ||
      checkRes.raw?.correspondent ||
      operatorParam;

    const paymentMethod = mapProviderToPaymentMethod(detectedProvider);

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // If completed / success
    if (status === "COMPLETED" || status === "SUCCESS") {
      if (tenantId) {
        try {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              plan,
              planStatus: "ACTIVE",
              planExpiresAt: periodEnd,
              updatedAt: now,
            },
          });

          const existingSub = await prisma.subscription.findFirst({
            where: { transactionId: depositId },
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
                amount: Number(checkRes.amount || checkRes.raw?.data?.amount || 0),
                currency: checkRes.currency || checkRes.raw?.data?.currency || "CDF",
                paymentMethod,
                paymentStatus: "ACTIVE",
                transactionId: depositId,
                periodStart: now,
                periodEnd,
              },
            });
          }
        } catch (dbErr: any) {
          console.warn("[PawaPay Status Check] DB update error:", dbErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        completed: true,
        failed: false,
        status,
        paymentMethod,
        planExpiresAt: periodEnd.toISOString(),
        message: `Paiement Mobile Money confirmé ! Forfait ${plan} activé avec succès.`,
      });
    }

    // If failed / rejected
    if (status === "FAILED" || status === "REJECTED" || status === "EXPIRED") {
      if (tenantId) {
        try {
          await prisma.subscription.updateMany({
            where: {
              tenantId,
              transactionId: depositId,
            },
            data: {
              paymentStatus: "PAST_DUE",
            },
          });
        } catch (dbErr) {
          // ignore
        }
      }

      return NextResponse.json({
        success: false,
        completed: false,
        failed: true,
        status,
        error: checkRes.error || "Le paiement Mobile Money a été rejeté ou a expiré sur votre mobile.",
      });
    }

    // Still processing (SUBMITTED, ACCEPTED, IN_RECONCILIATION)
    return NextResponse.json({
      success: true,
      completed: false,
      failed: false,
      status,
      paymentMethod,
      message: "En attente de saisie de votre code PIN sur votre mobile...",
    });
  } catch (error: any) {
    console.error("[PawaPay Status API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la vérification du paiement" },
      { status: 500 }
    );
  }
}
