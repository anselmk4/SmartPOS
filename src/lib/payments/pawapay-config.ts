import type { SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";

export interface MobileMoneyOperator {
  id: PaymentMethod;
  name: string;
  correspondent: string;
  color: string;
  bgLight: string;
  textColor: string;
  iconName: string;
  samplePrefix: string;
}

export interface CountryPaymentConfig {
  countryCode: string; // ISO 2 (CD, CI, SN, etc.)
  pawapayCountry: string; // ISO 3 (COD, CIV, SEN, etc.)
  name: string;
  flag: string;
  callingCode: string; // +243, +225, etc.
  phoneDigits: number; // expected digits after calling code (e.g. 9 for RDC)
  currencies: Array<{
    code: string;
    symbol: string;
    name: string;
  }>;
  operators: MobileMoneyOperator[];
}

export const PAWAPAY_COUNTRY_CONFIGS: Record<string, CountryPaymentConfig> = {
  CD: {
    countryCode: "CD",
    pawapayCountry: "COD",
    name: "RDC (RD Congo)",
    flag: "🇨🇩",
    callingCode: "+243",
    phoneDigits: 9,
    currencies: [
      { code: "CDF", symbol: "FC", name: "Franc Congolais (CDF)" },
      { code: "USD", symbol: "$", name: "Dollar Américain (USD)" },
    ],
    operators: [
      {
        id: "MPESA",
        name: "Vodacom M-Pesa",
        correspondent: "MPESA_COD",
        color: "#E60000",
        bgLight: "bg-red-50 border-red-200 text-red-700",
        textColor: "text-red-600",
        iconName: "Vodacom",
        samplePrefix: "81, 82, 83",
      },
      {
        id: "AIRTEL_MONEY",
        name: "Airtel Money",
        correspondent: "AIRTEL_COD",
        color: "#FF0000",
        bgLight: "bg-red-50 border-red-200 text-red-700",
        textColor: "text-red-600",
        iconName: "Airtel",
        samplePrefix: "97, 98, 99",
      },
      {
        id: "ORANGE_MONEY",
        name: "Orange Money",
        correspondent: "ORANGE_COD",
        color: "#FF7900",
        bgLight: "bg-orange-50 border-orange-200 text-orange-700",
        textColor: "text-orange-600",
        iconName: "Orange",
        samplePrefix: "84, 85, 89",
      },
      {
        id: "AFRIMONEY",
        name: "Afrimoney (Africell)",
        correspondent: "AFRICELL_COD",
        color: "#990099",
        bgLight: "bg-purple-50 border-purple-200 text-purple-700",
        textColor: "text-purple-600",
        iconName: "Africell",
        samplePrefix: "90, 91",
      },
    ],
  },
  CI: {
    countryCode: "CI",
    pawapayCountry: "CIV",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    callingCode: "+225",
    phoneDigits: 10,
    currencies: [{ code: "XOF", symbol: "FCFA", name: "Franc CFA (XOF)" }],
    operators: [
      {
        id: "WAVE",
        name: "Wave Côte d'Ivoire",
        correspondent: "WAVE_CIV",
        color: "#1DC3FE",
        bgLight: "bg-sky-50 border-sky-200 text-sky-700",
        textColor: "text-sky-600",
        iconName: "Wave",
        samplePrefix: "01, 05, 07",
      },
      {
        id: "ORANGE_MONEY",
        name: "Orange Money",
        correspondent: "ORANGE_CIV",
        color: "#FF7900",
        bgLight: "bg-orange-50 border-orange-200 text-orange-700",
        textColor: "text-orange-600",
        iconName: "Orange",
        samplePrefix: "07, 08",
      },
      {
        id: "MTN_MOMO",
        name: "MTN Mobile Money",
        correspondent: "MTN_MOMO_CIV",
        color: "#FFCC00",
        bgLight: "bg-amber-50 border-amber-200 text-amber-700",
        textColor: "text-amber-600",
        iconName: "MTN",
        samplePrefix: "05, 04",
      },
      {
        id: "MOOV_MONEY",
        name: "Moov Money",
        correspondent: "MOOV_CIV",
        color: "#005BA6",
        bgLight: "bg-blue-50 border-blue-200 text-blue-700",
        textColor: "text-blue-600",
        iconName: "Moov",
        samplePrefix: "01, 02",
      },
    ],
  },
  SN: {
    countryCode: "SN",
    pawapayCountry: "SEN",
    name: "Sénégal",
    flag: "🇸🇳",
    callingCode: "+221",
    phoneDigits: 9,
    currencies: [{ code: "XOF", symbol: "FCFA", name: "Franc CFA (XOF)" }],
    operators: [
      {
        id: "WAVE",
        name: "Wave Sénégal",
        correspondent: "WAVE_SEN",
        color: "#1DC3FE",
        bgLight: "bg-sky-50 border-sky-200 text-sky-700",
        textColor: "text-sky-600",
        iconName: "Wave",
        samplePrefix: "77, 78, 76",
      },
      {
        id: "ORANGE_MONEY",
        name: "Orange Money",
        correspondent: "ORANGE_SEN",
        color: "#FF7900",
        bgLight: "bg-orange-50 border-orange-200 text-orange-700",
        textColor: "text-orange-600",
        iconName: "Orange",
        samplePrefix: "77, 78",
      },
    ],
  },
  CM: {
    countryCode: "CM",
    pawapayCountry: "CMR",
    name: "Cameroun",
    flag: "🇨🇲",
    callingCode: "+237",
    phoneDigits: 9,
    currencies: [{ code: "XAF", symbol: "FCFA", name: "Franc CFA (XAF)" }],
    operators: [
      {
        id: "MTN_MOMO",
        name: "MTN MoMo Cameroun",
        correspondent: "MTN_MOMO_CMR",
        color: "#FFCC00",
        bgLight: "bg-amber-50 border-amber-200 text-amber-700",
        textColor: "text-amber-600",
        iconName: "MTN",
        samplePrefix: "67, 68",
      },
      {
        id: "ORANGE_MONEY",
        name: "Orange Money Cameroun",
        correspondent: "ORANGE_CMR",
        color: "#FF7900",
        bgLight: "bg-orange-50 border-orange-200 text-orange-700",
        textColor: "text-orange-600",
        iconName: "Orange",
        samplePrefix: "69, 65",
      },
    ],
  },
  CG: {
    countryCode: "CG",
    pawapayCountry: "COG",
    name: "Congo-Brazzaville",
    flag: "🇨🇬",
    callingCode: "+242",
    phoneDigits: 9,
    currencies: [{ code: "XAF", symbol: "FCFA", name: "Franc CFA (XAF)" }],
    operators: [
      {
        id: "MTN_MOMO",
        name: "MTN Mobile Money",
        correspondent: "MTN_MOMO_COG",
        color: "#FFCC00",
        bgLight: "bg-amber-50 border-amber-200 text-amber-700",
        textColor: "text-amber-600",
        iconName: "MTN",
        samplePrefix: "06",
      },
      {
        id: "AIRTEL_MONEY",
        name: "Airtel Money",
        correspondent: "AIRTEL_COG",
        color: "#FF0000",
        bgLight: "bg-red-50 border-red-200 text-red-700",
        textColor: "text-red-600",
        iconName: "Airtel",
        samplePrefix: "05, 04",
      },
    ],
  },
  GA: {
    countryCode: "GA",
    pawapayCountry: "GAB",
    name: "Gabon",
    flag: "🇬🇦",
    callingCode: "+241",
    phoneDigits: 8,
    currencies: [{ code: "XAF", symbol: "FCFA", name: "Franc CFA (XAF)" }],
    operators: [
      {
        id: "AIRTEL_MONEY",
        name: "Airtel Money Gabon",
        correspondent: "AIRTEL_GAB",
        color: "#FF0000",
        bgLight: "bg-red-50 border-red-200 text-red-700",
        textColor: "text-red-600",
        iconName: "Airtel",
        samplePrefix: "07, 04",
      },
      {
        id: "MOOV_MONEY",
        name: "Moov Money Gabon",
        correspondent: "MOOV_GAB",
        color: "#005BA6",
        bgLight: "bg-blue-50 border-blue-200 text-blue-700",
        textColor: "text-blue-600",
        iconName: "Moov",
        samplePrefix: "06, 02",
      },
    ],
  },
  GN: {
    countryCode: "GN",
    pawapayCountry: "GIN",
    name: "Guinée (Conakry)",
    flag: "🇬🇳",
    callingCode: "+224",
    phoneDigits: 9,
    currencies: [{ code: "GNF", symbol: "FG", name: "Franc Guinéen (GNF)" }],
    operators: [
      {
        id: "ORANGE_MONEY",
        name: "Orange Money Guinée",
        correspondent: "ORANGE_GIN",
        color: "#FF7900",
        bgLight: "bg-orange-50 border-orange-200 text-orange-700",
        textColor: "text-orange-600",
        iconName: "Orange",
        samplePrefix: "62, 61",
      },
      {
        id: "MTN_MOMO",
        name: "MTN Mobile Money Guinée",
        correspondent: "MTN_MOMO_GIN",
        color: "#FFCC00",
        bgLight: "bg-amber-50 border-amber-200 text-amber-700",
        textColor: "text-amber-600",
        iconName: "MTN",
        samplePrefix: "66",
      },
    ],
  },
  RW: {
    countryCode: "RW",
    pawapayCountry: "RWA",
    name: "Rwanda",
    flag: "🇷🇼",
    callingCode: "+250",
    phoneDigits: 9,
    currencies: [{ code: "RWF", symbol: "FRw", name: "Franc Rwandais (RWF)" }],
    operators: [
      {
        id: "MTN_MOMO",
        name: "MTN MoMo Rwanda",
        correspondent: "MTN_MOMO_RWA",
        color: "#FFCC00",
        bgLight: "bg-amber-50 border-amber-200 text-amber-700",
        textColor: "text-amber-600",
        iconName: "MTN",
        samplePrefix: "078",
      },
      {
        id: "AIRTEL_MONEY",
        name: "Airtel Money Rwanda",
        correspondent: "AIRTEL_RWA",
        color: "#FF0000",
        bgLight: "bg-red-50 border-red-200 text-red-700",
        textColor: "text-red-600",
        iconName: "Airtel",
        samplePrefix: "073, 072",
      },
    ],
  },
  KE: {
    countryCode: "KE",
    pawapayCountry: "KEN",
    name: "Kenya",
    flag: "🇰🇪",
    callingCode: "+254",
    phoneDigits: 9,
    currencies: [{ code: "KES", symbol: "KSh", name: "Shilling Kenyan (KES)" }],
    operators: [
      {
        id: "MPESA",
        name: "Safaricom M-Pesa",
        correspondent: "MPESA_KEN",
        color: "#00A651",
        bgLight: "bg-emerald-50 border-emerald-200 text-emerald-700",
        textColor: "text-emerald-600",
        iconName: "Safaricom",
        samplePrefix: "07, 01",
      },
      {
        id: "AIRTEL_MONEY",
        name: "Airtel Money Kenya",
        correspondent: "AIRTEL_KEN",
        color: "#FF0000",
        bgLight: "bg-red-50 border-red-200 text-red-700",
        textColor: "text-red-600",
        iconName: "Airtel",
        samplePrefix: "073, 078",
      },
    ],
  },
  UG: {
    countryCode: "UG",
    pawapayCountry: "UGA",
    name: "Ouganda",
    flag: "🇺🇬",
    callingCode: "+256",
    phoneDigits: 9,
    currencies: [{ code: "UGX", symbol: "USh", name: "Shilling Ougandais (UGX)" }],
    operators: [
      {
        id: "MTN_MOMO",
        name: "MTN MoMo Uganda",
        correspondent: "MTN_MOMO_UGA",
        color: "#FFCC00",
        bgLight: "bg-amber-50 border-amber-200 text-amber-700",
        textColor: "text-amber-600",
        iconName: "MTN",
        samplePrefix: "077, 078",
      },
      {
        id: "AIRTEL_MONEY",
        name: "Airtel Money Uganda",
        correspondent: "AIRTEL_UGA",
        color: "#FF0000",
        bgLight: "bg-red-50 border-red-200 text-red-700",
        textColor: "text-red-600",
        iconName: "Airtel",
        samplePrefix: "070, 075",
      },
    ],
  },
};

/**
 * Plan Pricing definitions per plan and currency
 */
export const PLAN_PRICES: Record<SubscriptionPlan, Record<string, number>> = {
  FREE: {
    CDF: 0,
    USD: 0,
    XOF: 0,
    XAF: 0,
    GNF: 0,
    KES: 0,
    UGX: 0,
    RWF: 0,
    EUR: 0,
  },
  PRO: {
    CDF: 40000,
    USD: 15,
    XOF: 10000,
    XAF: 10000,
    GNF: 130000,
    KES: 2000,
    UGX: 55000,
    RWF: 18000,
    EUR: 15,
  },
  BUSINESS: {
    CDF: 120000,
    USD: 45,
    XOF: 30000,
    XAF: 30000,
    GNF: 390000,
    KES: 6000,
    UGX: 165000,
    RWF: 55000,
    EUR: 45,
  },
};

/**
 * Format phone number into clean MSISDN format (e.g., 243810001122)
 */
export function formatToMsisdn(callingCode: string, rawInput: string): string {
  // Strip non-digit characters
  let cleanDigits = rawInput.replace(/\D/g, "");
  const cleanCode = callingCode.replace(/\D/g, "");

  // If starts with the country code already, keep it
  if (cleanDigits.startsWith(cleanCode)) {
    return cleanDigits;
  }

  // If starts with 0, remove the leading 0 (e.g., 081 -> 81)
  if (cleanDigits.startsWith("0")) {
    cleanDigits = cleanDigits.substring(1);
  }

  return `${cleanCode}${cleanDigits}`;
}

/**
 * Get country payment config by countryCode with fallback to RDC (CD)
 */
export function getCountryPaymentConfig(countryCode: string = "CD"): CountryPaymentConfig {
  return PAWAPAY_COUNTRY_CONFIGS[countryCode] || PAWAPAY_COUNTRY_CONFIGS.CD;
}
