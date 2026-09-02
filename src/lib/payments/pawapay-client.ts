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

function getPawaPayBaseUrl(): string {
  const env = process.env.PAWAPAY_ENVIRONMENT || "sandbox";
  return env === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.io";
}

function getPawaPayToken(): string {
  return (process.env.PAWAPAY_API_TOKEN || "").trim();
}

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
  const token = getPawaPayToken();
  if (!token || token.length < 10) {
    console.warn("[PawaPay Client] ⚠️ PAWAPAY_API_TOKEN manquant");
    return {
      depositId,
      status: "FAILED",
      isSimulated: false,
      error: "Clé API PawaPay non configurée sur le serveur. Veuillez définir PAWAPAY_API_TOKEN dans les variables d'environnement.",
    };
  }

  // 2. Real PawaPay v2 API Call
  try {
    // In PawaPay v2, metadata must be an array of unique-key objects like [{ tenantId: "..." }, { plan: "PRO" }]
    const metaArray = metadata
      ? Object.entries(metadata).map(([k, v]) => ({ [k]: String(v) }))
      : [{ plan: "PRO" }];

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

    const baseUrl = getPawaPayBaseUrl();
    console.log(`[PawaPay Client] Calling POST ${baseUrl}/v2/deposits`, {
      depositId,
      amount,
      currency,
      provider: correspondent,
      phoneNumber,
    });

    const res = await fetch(`${baseUrl}/v2/deposits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[PawaPay API Error Response]:", res.status, data);
      const rawErrMsg =
        data.failureReason?.failureMessage ||
        data.errorMessage ||
        data.message ||
        `Erreur passerelle PawaPay (${res.status})`;

      const formattedError = formatPawaPayErrorMessage(rawErrMsg);

      return {
        depositId,
        status: data.status || "FAILED",
        isSimulated: false,
        error: formattedError,
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
  const token = getPawaPayToken();
  if (!token) {
    return {
      depositId,
      status: "UNKNOWN",
      error: "Clé API PawaPay non configurée",
    };
  }

  try {
    const baseUrl = getPawaPayBaseUrl();
    const res = await fetch(`${baseUrl}/v2/deposits/${depositId}`, {
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

/**
 * Traduit et formate les messages d'erreur techniques de PawaPay en explications claires en français
 */
export function formatPawaPayErrorMessage(rawError?: string, operatorName?: string): string {
  if (!rawError) return "Une erreur est survenue lors de l'initiation du paiement Mobile Money.";

  const err = rawError.toLowerCase();

  if (err.includes("not been configured to make deposits using") || err.includes("not configured")) {
    return `L'opérateur Mobile Money ${operatorName ? `"${operatorName}"` : "sélectionné"} n'est pas encore activé sur ce compte PawaPay. Veuillez choisir un autre moyen de paiement disponible (Orange Money, MTN MoMo, Moov Money, Vodacom M-Pesa, Airtel) ou demander son activation auprès du support PawaPay.`;
  }

  if (err.includes("insufficient") || err.includes("balance")) {
    return "Solde Mobile Money insuffisant sur votre compte pour régler ce forfait.";
  }

  if (err.includes("invalid") && (err.includes("phone") || err.includes("msisdn") || err.includes("number"))) {
    return "Le numéro de téléphone saisi est invalide pour cet opérateur Mobile Money. Veuillez vérifier l'indicatif et les chiffres du numéro.";
  }

  if (err.includes("timeout") || err.includes("timed out") || err.includes("expired")) {
    return "Le délai de validation USSD sur votre téléphone a expiré. Veuillez relancer la demande de paiement.";
  }

  if (err.includes("cancelled") || err.includes("rejected") || err.includes("declined")) {
    return "La transaction a été refusée ou annulée depuis le combiné mobile.";
  }

  return rawError;
}

