import type { Product, TariffConfig, TariffMode } from "@/lib/shared/types";

export const DEFAULT_TARIFF_CONFIG: TariffConfig = {
  activeMode: "NORMAL",
  karaokeDrinkSurcharge: 500, // 500 FC de majoration fixe par boisson
  promoDiscountAmount: 1000, // 1 000 FC de remise unitaire en promo
  promoQuotaPerProduct: 10, // Max 10 unités par produit éligibles à la remise
  updatedAt: new Date().toISOString(),
};

/**
 * Détecte si un produit appartient à la famille des boissons (Bars, Restaurants, Lounges)
 */
export function isDrinkCategory(category?: string, productName?: string): boolean {
  const cat = (category || "").toLowerCase();
  const name = (productName || "").toLowerCase();
  const drinkKeywords = [
    "boisson",
    "drink",
    "bière",
    "biere",
    "beer",
    "vin",
    "wine",
    "spiritueux",
    "whisky",
    "whiskey",
    "vodka",
    "liqueur",
    "rhum",
    "gin",
    "champagne",
    "jus",
    "juice",
    "soda",
    "eau",
    "water",
    "cocktail",
    "alcool",
    "brasserie",
    "sucré",
    "gazeuse",
    "boissons",
    "canette",
    "bouteille",
    "heineken",
    "skol",
    "primus",
    "mutzig",
    "turbo",
    "castel",
    "doppel",
    "guinness",
    "vitalo",
    "fanta",
    "coca",
    "sprite",
    "malt",
  ];
  return drinkKeywords.some((kw) => cat.includes(kw) || name.includes(kw));
}

export interface CalculatedPrice {
  unitPrice: number;
  originalPrice: number;
  tariffAdjustment: number;
  tariffApplied: TariffMode;
  isPromoDiscounted: boolean;
  notes?: string;
}

/**
 * Calcule le prix effectif unitaire d'un produit selon la grille tarifaire active
 */
export function calculateEffectiveProductPrice(
  product: Product,
  tariffConfig: TariffConfig,
  currentUnitIndex: number = 1
): CalculatedPrice {
  const basePrice = Number(product.unitPrice || 0);
  const mode = tariffConfig?.activeMode || "NORMAL";

  // 1. Grille Karaoké & Événements Spéciaux : Majoration sur les boissons
  if (mode === "KARAOKE") {
    const isDrink = isDrinkCategory(product.category, product.name);
    if (isDrink) {
      const surcharge = Number(tariffConfig.karaokeDrinkSurcharge || 0);
      return {
        unitPrice: basePrice + surcharge,
        originalPrice: basePrice,
        tariffAdjustment: surcharge,
        tariffApplied: "KARAOKE",
        isPromoDiscounted: false,
        notes: `Majoration Karaoké (+${surcharge.toLocaleString("fr-FR")})`,
      };
    }
  }

  // 2. Grille Promotion : Remise sur les N premières unités (quota 10 unités)
  if (mode === "PROMOTION") {
    const quota = Math.max(1, Number(tariffConfig.promoQuotaPerProduct || 10));
    const discount = Math.min(basePrice, Math.max(0, Number(tariffConfig.promoDiscountAmount || 0)));

    if (currentUnitIndex <= quota && discount > 0) {
      return {
        unitPrice: Math.max(0, basePrice - discount),
        originalPrice: basePrice,
        tariffAdjustment: -discount,
        tariffApplied: "PROMOTION",
        isPromoDiscounted: true,
        notes: `Remise Promo (-${discount.toLocaleString("fr-FR")}, quota ${quota}u)`,
      };
    }
  }

  // 3. Grille Standard / Normal
  return {
    unitPrice: basePrice,
    originalPrice: basePrice,
    tariffAdjustment: 0,
    tariffApplied: "NORMAL",
    isPromoDiscounted: false,
  };
}

/**
 * Calcule le sous-total d'une ligne d'article avec gestion intelligente du quota promotionnel
 * (Ex: Si 12 unités ajoutées avec promo de 1000 FC sur 10u max : 10u à prix réduit + 2u à prix normal)
 */
export function calculateCartItemSubtotal(
  product: Product,
  quantity: number,
  tariffConfig: TariffConfig
): {
  subtotal: number;
  averageUnitPrice: number;
  originalSubtotal: number;
  totalAdjustment: number;
  tariffApplied: TariffMode;
} {
  const basePrice = Number(product.unitPrice || 0);
  const mode = tariffConfig?.activeMode || "NORMAL";
  const qty = Math.max(1, Number(quantity || 1));
  const originalSubtotal = basePrice * qty;

  if (mode === "KARAOKE") {
    const isDrink = isDrinkCategory(product.category, product.name);
    if (isDrink) {
      const surcharge = Number(tariffConfig.karaokeDrinkSurcharge || 0);
      const unitPrice = basePrice + surcharge;
      const subtotal = unitPrice * qty;
      return {
        subtotal,
        averageUnitPrice: unitPrice,
        originalSubtotal,
        totalAdjustment: surcharge * qty,
        tariffApplied: "KARAOKE",
      };
    }
  }

  if (mode === "PROMOTION") {
    const quota = Math.max(1, Number(tariffConfig.promoQuotaPerProduct || 10));
    const discount = Math.min(basePrice, Math.max(0, Number(tariffConfig.promoDiscountAmount || 0)));

    const promoUnits = Math.min(qty, quota);
    const standardUnits = Math.max(0, qty - quota);

    const discountedUnitPrice = Math.max(0, basePrice - discount);
    const subtotal = promoUnits * discountedUnitPrice + standardUnits * basePrice;
    const totalAdjustment = -(promoUnits * discount);

    return {
      subtotal,
      averageUnitPrice: subtotal / qty,
      originalSubtotal,
      totalAdjustment,
      tariffApplied: "PROMOTION",
    };
  }

  return {
    subtotal: originalSubtotal,
    averageUnitPrice: basePrice,
    originalSubtotal,
    totalAdjustment: 0,
    tariffApplied: "NORMAL",
  };
}
