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
  CDF: 2850,
  XOF: 620,
  XAF: 620,
  GNF: 8600,
  RWF: 1400,
  EUR: 0.92,
};

export const PLAN_PRICING_TABLE: Record<
  SubscriptionPlan,
  Record<string, { amount: number; formatted: string }>
> = {
  FREE: {
    CDF: { amount: 0, formatted: "Gratuit" },
    USD: { amount: 0, formatted: "Gratuit" },
    XOF: { amount: 0, formatted: "Gratuit" },
    XAF: { amount: 0, formatted: "Gratuit" },
    GNF: { amount: 0, formatted: "Gratuit" },
    RWF: { amount: 0, formatted: "Gratuit" },
    EUR: { amount: 0, formatted: "Gratuit" },
  },
  BASIC: {
    CDF: { amount: 20000, formatted: "20 000 FC" },
    USD: { amount: 7, formatted: "7 $" },
    XOF: { amount: 4500, formatted: "4 500 FCFA" },
    XAF: { amount: 4500, formatted: "4 500 FCFA" },
    GNF: { amount: 60000, formatted: "60 000 GNF" },
    RWF: { amount: 9800, formatted: "9 800 FRw" },
    EUR: { amount: 6.5, formatted: "6,50 €" },
  },
  PRO: {
    CDF: { amount: 50000, formatted: "50 000 FC" },
    USD: { amount: 18, formatted: "18 $" },
    XOF: { amount: 11000, formatted: "11 000 FCFA" },
    XAF: { amount: 11000, formatted: "11 000 FCFA" },
    GNF: { amount: 150000, formatted: "150 000 GNF" },
    RWF: { amount: 25000, formatted: "25 000 FRw" },
    EUR: { amount: 16.5, formatted: "16,50 €" },
  },
  BUSINESS: {
    CDF: { amount: 100000, formatted: "100 000 FC" },
    USD: { amount: 35, formatted: "35 $" },
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

  const period = plan === "FREE" ? "Gratuit à vie" : "/ mois";
  const rawPriceStr = plan === "FREE" ? "Gratuit" : `${pricing.formatted} ${period}`;

  return {
    amount: pricing.amount,
    currency: normCurrency,
    formatted: pricing.formatted,
    period,
    rawPriceStr,
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
