import type { SubscriptionPlan } from "@/lib/shared/types";

export interface PlanPriceInfo {
  amount: number;
  currency: string;
  formatted: string;
  period: string;
  rawPriceStr: string;
}

export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  CDF: 2300,
  XOF: 620,
  XAF: 620,
  GNF: 8600,
  RWF: 1400,
  EUR: 0.92,
};

export const FREE_TRIAL_DAYS = 7;
export const FREE_TRIAL_MS = FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000;

export const PLAN_PRICING_TABLE: Record<
  SubscriptionPlan,
  Record<string, { amount: number; formatted: string }>
> = {
  FREE: {
    CDF: { amount: 0, formatted: "Gratuit (7j)" },
    USD: { amount: 0, formatted: "Gratuit (7j)" },
    XOF: { amount: 0, formatted: "Gratuit (7j)" },
    XAF: { amount: 0, formatted: "Gratuit (7j)" },
    GNF: { amount: 0, formatted: "Gratuit (7j)" },
    RWF: { amount: 0, formatted: "Gratuit (7j)" },
    EUR: { amount: 0, formatted: "Gratuit (7j)" },
  },
  BASIC: {
    CDF: { amount: 15000, formatted: "15 000 FC" },
    USD: { amount: 6.5, formatted: "6,50 $" },
    XOF: { amount: 3500, formatted: "3 500 FCFA" },
    XAF: { amount: 3500, formatted: "3 500 FCFA" },
    GNF: { amount: 45000, formatted: "45 000 GNF" },
    RWF: { amount: 7500, formatted: "7 500 FRw" },
    EUR: { amount: 5, formatted: "5,00 €" },
  },
  PRO: {
    CDF: { amount: 30000, formatted: "30 000 FC" },
    USD: { amount: 13, formatted: "13 $" },
    XOF: { amount: 7000, formatted: "7 000 FCFA" },
    XAF: { amount: 7000, formatted: "7 000 FCFA" },
    GNF: { amount: 90000, formatted: "90 000 GNF" },
    RWF: { amount: 15000, formatted: "15 000 FRw" },
    EUR: { amount: 10, formatted: "10,00 €" },
  },
  BUSINESS: {
    CDF: { amount: 100000, formatted: "100 000 FC" },
    USD: { amount: 43.5, formatted: "43,50 $" },
    XOF: { amount: 22000, formatted: "22 000 FCFA" },
    XAF: { amount: 22000, formatted: "22 000 FCFA" },
    GNF: { amount: 300000, formatted: "300 000 GNF" },
    RWF: { amount: 49000, formatted: "49 000 FRw" },
    EUR: { amount: 32, formatted: "32 €" },
  },
};

/**
 * Returns localized pricing according to the given currency code (e.g. CDF, USD, XOF, XAF, GNF)
 */
export function getPlanPriceInfo(
  plan: SubscriptionPlan,
  currencyCode: string = "CDF"
): PlanPriceInfo {
  const normCurrency = currencyCode.toUpperCase();
  const planTable = PLAN_PRICING_TABLE[plan] || PLAN_PRICING_TABLE.FREE;
  const pricing = planTable[normCurrency] || planTable.CDF || { amount: 0, formatted: "0" };

  const period = plan === "FREE" ? "Essai 7 jours" : "/ mois";
  const rawPriceStr = plan === "FREE" ? "Essai Gratuit 7 jours" : `${pricing.formatted} ${period}`;

  return {
    amount: pricing.amount,
    currency: normCurrency,
    formatted: pricing.formatted,
    period,
    rawPriceStr,
  };
}

export interface TenantTrialInfo {
  isFreePlan: boolean;
  isPaidPlan: boolean;
  isTrialExpired: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  expiryDate: Date | null;
  isPaymentRequired: boolean;
  formattedExpiry: string;
}

/**
 * Calculates trial and subscription status for a tenant
 */
export function getTenantTrialInfo(
  tenant: {
    plan?: string | null;
    planStatus?: string | null;
    planExpiresAt?: string | Date | null;
    createdAt?: string | Date | null;
  } | null | undefined,
  hasActiveSubscription: boolean = false
): TenantTrialInfo {
  if (!tenant) {
    return {
      isFreePlan: false,
      isPaidPlan: false,
      isTrialExpired: false,
      daysRemaining: 0,
      hoursRemaining: 0,
      expiryDate: null,
      isPaymentRequired: false,
      formattedExpiry: "",
    };
  }

  const isFreePlan = (tenant.plan || "FREE") === "FREE";
  const isPaidPlan = !isFreePlan;
  const planStatus = tenant.planStatus || "ACTIVE";

  // If user has an active paid subscription on record, no payment is required
  if (hasActiveSubscription) {
    return {
      isFreePlan: false,
      isPaidPlan: true,
      isTrialExpired: false,
      daysRemaining: 999,
      hoursRemaining: 999,
      expiryDate: null,
      isPaymentRequired: false,
      formattedExpiry: "",
    };
  }

  // Calculate expiry date
  let expiryDate: Date | null = null;
  if (tenant.planExpiresAt) {
    expiryDate = new Date(tenant.planExpiresAt);
  } else if (tenant.createdAt) {
    // Fall back to 7 days after tenant creation date
    expiryDate = new Date(new Date(tenant.createdAt).getTime() + FREE_TRIAL_MS);
  } else {
    expiryDate = new Date(Date.now() + FREE_TRIAL_MS);
  }

  const now = Date.now();
  const diffMs = expiryDate.getTime() - now;
  const isTrialExpired = isFreePlan && diffMs <= 0;
  const isPaidExpired = isPaidPlan && expiryDate.getTime() < now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  const hoursRemaining = Math.max(0, Math.ceil(diffMs / (60 * 60 * 1000)));

  // Payment is strictly required if:
  // 1) Free 7-day trial has expired
  // 2) On paid plan awaiting payment (planStatus !== "ACTIVE") or paid plan expired
  // 3) planStatus is PAST_DUE or CANCELLED
  const isPaymentRequired =
    (isFreePlan && isTrialExpired) ||
    (isPaidPlan && (planStatus !== "ACTIVE" || isPaidExpired)) ||
    planStatus === "PAST_DUE" ||
    planStatus === "CANCELLED";

  const formattedExpiry = expiryDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return {
    isFreePlan,
    isPaidPlan,
    isTrialExpired,
    daysRemaining,
    hoursRemaining,
    expiryDate,
    isPaymentRequired,
    formattedExpiry,
  };
}

/**
 * Converts any financial amount from one currency to another using official market exchange rates
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (!amount || fromCurrency === toCurrency) return amount || 0;

  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1;
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()] || 1;

  // Step 1: Base USD conversion
  const inUSD = amount / fromRate;

  // Step 2: Target currency conversion
  const result = inUSD * toRate;

  if (toCurrency.toUpperCase() === "USD" || toCurrency.toUpperCase() === "EUR") {
    return Math.round(result * 100) / 100;
  }

  return Math.round(result);
}
