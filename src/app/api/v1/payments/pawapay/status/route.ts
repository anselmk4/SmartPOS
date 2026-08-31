import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPawaPayDepositStatus } from "@/lib/payments/pawapay-client";
import type { SubscriptionPlan } from "@/lib/shared/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const depositId = searchParams.get("depositId");
    const tenantId = searchParams.get("tenantId");
    const plan = (searchParams.get("plan") || "PRO") as SubscriptionPlan;

    if (!depositId) {
      return NextResponse.json(
        { success: false, error: "Identifiant de dépôt (depositId) manquant" },
        { status: 400 }
      );
    }

    const checkRes = await checkPawaPayDepositStatus(depositId);
    const status = String(checkRes.status || "").toUpperCase();

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
                periodStart: now,
                periodEnd,
              },
            });
          } else {
            await prisma.subscription.create({
              data: {
                tenantId,
                plan,
                amount: Number(checkRes.amount || 0),
                currency: checkRes.currency || "CDF",
                paymentMethod: "MPESA",
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
