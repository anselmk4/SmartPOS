import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initiatePawaPayDeposit } from "@/lib/payments/pawapay-client";
import {
  getCountryPaymentConfig,
  formatToMsisdn,
  PLAN_PRICES,
} from "@/lib/payments/pawapay-config";
import type { SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      plan = "PRO",
      currency = "CDF",
      countryCode = "CD",
      operator = "MPESA",
      rawPhoneNumber,
    } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Identifiant de boutique (tenantId) manquant" },
        { status: 400 }
      );
    }

    if (!rawPhoneNumber || rawPhoneNumber.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: "Veuillez saisir un numéro de téléphone valide" },
        { status: 400 }
      );
    }

    const countryConfig = getCountryPaymentConfig(countryCode);
    const selectedOp = countryConfig.operators.find((o) => o.id === operator) || countryConfig.operators[0];
    const msisdn = formatToMsisdn(countryConfig.callingCode, rawPhoneNumber);

    // Calculate plan amount
    const planKey = (plan as SubscriptionPlan) || "PRO";
    const expectedAmount = PLAN_PRICES[planKey]?.[currency] ?? (currency === "USD" ? 15 : 40000);

    const depositId = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days validity

    // Initiate payment with PawaPay (or sandbox simulation)
    const pawaRes = await initiatePawaPayDeposit({
      depositId,
      amount: expectedAmount,
      currency,
      country: countryConfig.pawapayCountry,
      correspondent: selectedOp.correspondent,
      phoneNumber: msisdn,
      statementDescription: `Kuettu Global POS Forfait ${planKey}`,
      metadata: {
        tenantId,
        plan: planKey,
      },
    });

    if (pawaRes.status === "FAILED" || pawaRes.status === "REJECTED") {
      return NextResponse.json(
        {
          success: false,
          error: pawaRes.error || "Le paiement Mobile Money a échoué. Veuillez réessayer.",
        },
        { status: 400 }
      );
    }

    // If completed (or simulated), activate the tenant plan immediately
    if (pawaRes.status === "COMPLETED" || pawaRes.isSimulated) {
      // 1. Update Tenant in PostgreSQL
      try {
        await prisma.tenant.upsert({
          where: { id: tenantId },
          update: {
            plan: planKey,
            planStatus: "ACTIVE",
            planExpiresAt: periodEnd,
            updatedAt: now,
          },
          create: {
            id: tenantId,
            name: "Organisation Client",
            slug: `tenant-${tenantId.substring(0, 8)}`,
            countryCode,
            currency,
            plan: planKey,
            planStatus: "ACTIVE",
            planExpiresAt: periodEnd,
            createdAt: now,
            updatedAt: now,
          },
        });

        // 2. Create Subscription log in PostgreSQL
        await prisma.subscription.create({
          data: {
            tenantId,
            plan: planKey,
            amount: expectedAmount,
            currency,
            paymentMethod: selectedOp.id as PaymentMethod,
            paymentStatus: "ACTIVE",
            transactionId: pawaRes.pawapayReference || depositId,
            periodStart: now,
            periodEnd,
          },
        });
      } catch (dbErr: any) {
        console.warn("[PawaPay Initiate] DB recording warning:", dbErr.message);
      }

      return NextResponse.json({
        success: true,
        activated: true,
        isSimulated: pawaRes.isSimulated,
        plan: planKey,
        planStatus: "ACTIVE",
        planExpiresAt: periodEnd.toISOString(),
        transactionId: pawaRes.pawapayReference || depositId,
        message: pawaRes.message || `Félicitations ! Votre forfait ${planKey} est désormais actif pour 30 jours.`,
      });
    }

    // If asynchronous (Push USSD sent to customer phone)
    return NextResponse.json({
      success: true,
      activated: false,
      isSimulated: false,
      depositId,
      transactionId: pawaRes.pawapayReference,
      message: "Veuillez valider le paiement Mobile Money (Push USSD) sur votre téléphone.",
    });
  } catch (error: any) {
    console.error("[PawaPay Initiate Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne lors du traitement du paiement" },
      { status: 500 }
    );
  }
}
