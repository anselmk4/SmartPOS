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
    CDF: { amount: 15000, formatted: "15 000 FC" },
    USD: { amount: 5.5, formatted: "5,50 $" },
    XOF: { amount: 3500, formatted: "3 500 FCFA" },
    XAF: { amount: 3500, formatted: "3 500 FCFA" },
    GNF: { amount: 45000, formatted: "45 000 GNF" },
    RWF: { amount: 7500, formatted: "7 500 FRw" },
    EUR: { amount: 5, formatted: "5,00 €" },
  },
  PRO: {
    CDF: { amount: 30000, formatted: "30 000 FC" },
    USD: { amount: 11, formatted: "11 $" },
    XOF: { amount: 7000, formatted: "7 000 FCFA" },
    XAF: { amount: 7000, formatted: "7 000 FCFA" },
    GNF: { amount: 90000, formatted: "90 000 GNF" },
    RWF: { amount: 15000, formatted: "15 000 FRw" },
    EUR: { amount: 10, formatted: "10,00 €" },
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
