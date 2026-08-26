import type { SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";

export interface PawaPayDepositRequest {
  depositId: string;
  amount: number;
  currency: string;
  country: string; // ISO 3 (COD, CIV, etc.)
  correspondent: string; // MPESA_COD, WAVE_CIV, etc.
  phoneNumber: string; // MSISDN (e.g. 243810001122)
  statementDescription?: string;
  metadata?: Record<string, string>;
}

export interface PawaPayDepositResponse {
  depositId: string;
  status: "ACCEPTED" | "COMPLETED" | "SUBMITTED" | "FAILED" | "REJECTED";
  isSimulated: boolean;
  message?: string;
  pawapayReference?: string;
  error?: string;
}

const PAWAPAY_API_TOKEN = process.env.PAWAPAY_API_TOKEN || "";
const PAWAPAY_ENV = process.env.PAWAPAY_ENVIRONMENT || "sandbox"; // 'sandbox' | 'production'
const PAWAPAY_BASE_URL =
  PAWAPAY_ENV === "production"
    ? "https://api.pawapay.cloud"
    : "https://api.sandbox.pawapay.cloud";

/**
 * Initiates a Mobile Money payment deposit through PawaPay or Sandbox Simulation
 */
export async function initiatePawaPayDeposit(
  params: PawaPayDepositRequest
): Promise<PawaPayDepositResponse> {
  const {
    depositId,
    amount,
    currency,
    country,
    correspondent,
    phoneNumber,
    statementDescription = "Abonnement Kuettu Global POS",
    metadata,
  } = params;

  // 1. Temporarily unavailable if no API Token is set yet (Waiting for official PawaPay keys)
  if (!PAWAPAY_API_TOKEN || PAWAPAY_API_TOKEN.includes("dummy") || PAWAPAY_API_TOKEN.length < 10) {
    console.log("[PawaPay Client] ⚠️ Clés API non configurées - Paiement temporairement indisponible.");

    return {
      depositId,
      status: "FAILED",
      isSimulated: true,
      error: "Le paiement en ligne des forfaits payants est temporairement indisponible en attendant la validation des clés d'accès de la passerelle. Veuillez utiliser le forfait Gratuit Découverte.",
    };
  }

  // 2. Real PawaPay API Call
  try {
    const payload = {
      depositId,
      amount: amount.toFixed(2),
      currency,
      country,
      correspondent,
      payer: {
        type: "MSISDN",
        address: {
          value: phoneNumber,
        },
      },
      customerTimestamp: new Date().toISOString(),
      statementDescription: statementDescription.substring(0, 30),
      metadata: metadata || {},
    };

    const res = await fetch(`${PAWAPAY_BASE_URL}/deposits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAWAPAY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[PawaPay API Error]:", data);
      return {
        depositId,
        status: "FAILED",
        isSimulated: false,
        error: data.errorMessage || data.message || `Erreur PawaPay (${res.status})`,
      };
    }

    return {
      depositId,
      status: data.status || "ACCEPTED",
      isSimulated: false,
      pawapayReference: data.pawapayId || data.id,
      message: "Demande de paiement envoyée au téléphone du client (Push USSD).",
    };
  } catch (err: any) {
    console.error("[PawaPay Client Network Error]:", err);
    return {
      depositId,
      status: "FAILED",
      isSimulated: false,
      error: err.message || "Erreur de communication avec la passerelle PawaPay",
    };
  }
}
