import type { SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";

export interface PawaPayDepositRequest {
  depositId: string; // UUID v4
  amount: number;
  currency: string;
  country: string; // ISO 3 (COD, CIV, etc.)
  correspondent: string; // VODACOM_MPESA_COD, ORANGE_CIV, etc.
  phoneNumber: string; // MSISDN (e.g. 243810001122)
  statementDescription?: string;
  metadata?: Record<string, string>;
}

export interface PawaPayDepositResponse {
  depositId: string;
  status: "ACCEPTED" | "COMPLETED" | "SUBMITTED" | "FAILED" | "REJECTED" | "IN_RECONCILIATION";
  isSimulated: boolean;
  message?: string;
  pawapayReference?: string;
  error?: string;
  raw?: any;
}

export interface PawaPayStatusResponse {
  depositId: string;
  status: "ACCEPTED" | "COMPLETED" | "SUBMITTED" | "FAILED" | "REJECTED" | "IN_RECONCILIATION" | "UNKNOWN";
  amount?: string;
  currency?: string;
  error?: string;
  raw?: any;
}

const PAWAPAY_API_TOKEN = process.env.PAWAPAY_API_TOKEN || "";
const PAWAPAY_ENV = process.env.PAWAPAY_ENVIRONMENT || "sandbox"; // 'sandbox' | 'production'
const PAWAPAY_BASE_URL =
  PAWAPAY_ENV === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.io";

/**
 * Initiates a Mobile Money payment deposit through PawaPay v2 API
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
    metadata,
  } = params;

  // 1. Check API Token
  const token = PAWAPAY_API_TOKEN.trim();
  if (!token || token.length < 10) {
    console.warn("[PawaPay Client] ⚠️ PAWAPAY_API_TOKEN manquant");
    return {
      depositId,
      status: "FAILED",
      isSimulated: false,
      error: "Clé API PawaPay non configurée. Veuillez renseigner PAWAPAY_API_TOKEN.",
    };
  }

  // 2. Real PawaPay v2 API Call
  try {
    const metaArray = metadata
      ? Object.entries(metadata).map(([k, v]) => ({ name: k, value: String(v) }))
      : [{ name: "plan", value: "PRO" }];

    const payload = {
      depositId,
      amount: String(amount),
      currency,
      payer: {
        type: "MMO",
        accountDetails: {
          phoneNumber,
          provider: correspondent,
        },
      },
      metadata: metaArray,
    };

    console.log(`[PawaPay Client] Calling POST ${PAWAPAY_BASE_URL}/v2/deposits`, {
      depositId,
      amount,
      currency,
      provider: correspondent,
      phoneNumber,
    });

    const res = await fetch(`${PAWAPAY_BASE_URL}/v2/deposits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[PawaPay API Error]:", res.status, data);
      const errMsg =
        data.failureReason?.failureMessage ||
        data.errorMessage ||
        data.message ||
        `Erreur passerelle PawaPay (${res.status})`;

      return {
        depositId,
        status: data.status || "FAILED",
        isSimulated: false,
        error: errMsg,
        raw: data,
      };
    }

    const currentStatus = data.status || "ACCEPTED";

    return {
      depositId: data.depositId || depositId,
      status: currentStatus,
      isSimulated: false,
      pawapayReference: data.depositId || depositId,
      message:
        currentStatus === "COMPLETED"
          ? "Paiement Mobile Money validé avec succès !"
          : "Demande de paiement envoyée au téléphone. Veuillez composer votre code PIN sur votre mobile pour valider.",
      raw: data,
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

/**
 * Checks the status of a deposit on PawaPay v2 API
 */
export async function checkPawaPayDepositStatus(
  depositId: string
): Promise<PawaPayStatusResponse> {
  const token = PAWAPAY_API_TOKEN.trim();
  if (!token) {
    return {
      depositId,
      status: "UNKNOWN",
      error: "Clé API PawaPay non configurée",
    };
  }

  try {
    const res = await fetch(`${PAWAPAY_BASE_URL}/v2/deposits/${depositId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        depositId,
        status: "FAILED",
        error: data.failureReason?.failureMessage || data.message || `Erreur (${res.status})`,
        raw: data,
      };
    }

    // PawaPay v2 response data is inside `data.data` or at root `data`
    const depositData = data.data || data;
    const currentStatus = depositData.status || "UNKNOWN";

    return {
      depositId: depositData.depositId || depositId,
      status: currentStatus,
      amount: depositData.amount,
      currency: depositData.currency,
      raw: data,
    };
  } catch (err: any) {
    console.error("[PawaPay Check Status Error]:", err);
    return {
      depositId,
      status: "UNKNOWN",
      error: err.message,
    };
  }
}
