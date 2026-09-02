import type { Product, TariffConfig, TariffMode } from "@/lib/shared/types";

export const DEFAULT_TARIFF_CONFIG: TariffConfig = {
  activeMode: "NORMAL",
  karaokeDrinkSurcharge: 500, // 500 FC de majoration fixe par boisson
  promoDiscountAmount: 1000, // 1 000 FC de minoration fixe en promo
  promoProductId: "ALL",
  promoMinQuantity: 1,
  updatedAt: new Date().toISOString(),
};

/**
 * Détecte si un produit appartient à la famille des aliments / repas (Cuisine, Restauration)
 */
export function isFoodCategory(category?: string, productName?: string): boolean {
  const cat = (category || "").toLowerCase();
  const name = (productName || "").toLowerCase();
  const foodKeywords = [
    "repas",
    "plat",
    "aliment",
    "nourriture",
    "cuisine",
    "chawarma",
    "shawarma",
    "burger",
    "pizza",
    "poulet",
    "viande",
    "poisson",
    "riz",
    "frites",
    "makemba",
    "chikwangue",
    "foufou",
    "fufu",
    "pondu",
    "madesu",
    "kamundele",
    "ntaba",
    "brochette",
    "grillade",
    "soupe",
    "salade",
    "pain",
    "sandwich",
    "dessert",
    "gateau",
    "gâteau",
    "beignet",
    "omelette",
    "sauce",
    "snack",
    "repas chaud",
    "porc",
    "boeuf",
    "chèvre",
    "chevre",
    "matsiembu",
    "capitaine",
    "tilapia",
    "malangwa",
    "kosa",
  ];
  return foodKeywords.some((kw) => cat.includes(kw) || name.includes(kw));
}

/**
 * Détecte si un produit appartient strictement à la famille des boissons (Bars, Lounges, Boissons)
 */
export function isDrinkCategory(category?: string, productName?: string): boolean {
  if (isFoodCategory(category, productName)) return false;

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
    "bavaria",
    "beaufort",
    "tembo",
    "nkoyi",
    "legend",
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
  quantity: number = 1
): CalculatedPrice {
  const basePrice = Number(product.unitPrice || 0);
  const mode = tariffConfig?.activeMode || "NORMAL";

  // 1. Grille Karaoké & Événements Spéciaux : Majoration STRICTE sur les boissons uniquement
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

  // 2. Grille Promotion : Minoration fixe sur les articles ciblés selon quantité minimum
  if (mode === "PROMOTION") {
    const isTargetProduct =
      !tariffConfig.promoProductId ||
      tariffConfig.promoProductId === "ALL" ||
      tariffConfig.promoProductId === product.id;

    const minQty = Math.max(1, Number(tariffConfig.promoMinQuantity || 1));
    const isQtyEligible = quantity >= minQty;

    if (isTargetProduct && isQtyEligible) {
      const discount = Math.min(basePrice, Math.max(0, Number(tariffConfig.promoDiscountAmount || 0)));
      if (discount > 0) {
        return {
          unitPrice: Math.max(0, basePrice - discount),
          originalPrice: basePrice,
          tariffAdjustment: -discount,
          tariffApplied: "PROMOTION",
          isPromoDiscounted: true,
          notes: `Remise Promo (-${discount.toLocaleString("fr-FR")})`,
        };
      }
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
 * Calcule le sous-total d'une ligne d'article avec minoration fixe en promo selon quantité seuil
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
    const isTargetProduct =
      !tariffConfig.promoProductId ||
      tariffConfig.promoProductId === "ALL" ||
      tariffConfig.promoProductId === product.id;

    const minQty = Math.max(1, Number(tariffConfig.promoMinQuantity || 1));
    const isQtyEligible = qty >= minQty;

    if (isTargetProduct && isQtyEligible) {
      const discount = Math.min(basePrice, Math.max(0, Number(tariffConfig.promoDiscountAmount || 0)));
      const discountedUnitPrice = Math.max(0, basePrice - discount);
      const subtotal = discountedUnitPrice * qty;
      const totalAdjustment = -(discount * qty);

      return {
        subtotal,
        averageUnitPrice: discountedUnitPrice,
        originalSubtotal,
        totalAdjustment,
        tariffApplied: "PROMOTION",
      };
    }
  }

  return {
    subtotal: originalSubtotal,
    averageUnitPrice: basePrice,
    originalSubtotal,
    totalAdjustment: 0,
    tariffApplied: "NORMAL",
  };
}

/**
 * Détermine avec précision si un commerce est strictement un Bar, Restaurant, Lounge, Pub ou Fast-Food (HORECA).
 * Exclut formellement les imprimeries, cybercafés, quincailleries, alimentations, boutiques, etc.
 */
export function isHorecaBusiness(businessType?: string | null): boolean {
  if (!businessType) return false;
  const bt = businessType.toLowerCase().trim();

  // Exclusions explicites pour commerces non-HORECA
  if (
    bt.includes("cyber") ||
    bt.includes("imprimerie") ||
    bt.includes("sérigraphie") ||
    bt.includes("serigraphie") ||
    bt.includes("coiffure") ||
    bt.includes("barbier") ||
    bt.includes("esthétique") ||
    bt.includes("esthetique") ||
    bt.includes("quincaillerie") ||
    bt.includes("pharmacie") ||
    bt.includes("médical") ||
    bt.includes("medical") ||
    bt.includes("prêt-à-porter") ||
    bt.includes("pret-a-porter") ||
    bt.includes("habillement") ||
    bt.includes("chaussure") ||
    bt.includes("bijouterie") ||
    bt.includes("électronique") ||
    bt.includes("electronique") ||
    bt.includes("librairie") ||
    bt.includes("papeterie") ||
    bt.includes("meuble") ||
    bt.includes("blanchisserie") ||
    bt.includes("pressing") ||
    bt.includes("alimentation") ||
    bt.includes("superette") ||
    bt.includes("supérette") ||
    bt.includes("épicerie") ||
    bt.includes("epicerie") ||
    bt.includes("optique") ||
    bt.includes("auto") ||
    bt.includes("moto")
  ) {
    return false;
  }

  // Mots-clés stricts de Restauration, Bars, Lounges et Boîtes de nuit
  const horecaKeywords = [
    "restaurant",
    "fast-food",
    "fastfood",
    "bar, lounge",
    "bar & lounge",
    "lounge",
    "pub & terrasse",
    "pub",
    "terrasse",
    "snack",
    "brasserie",
    "karaoke",
    "karaoké",
    "discothèque",
    "discotheque",
    "night-club",
    "nightclub",
    "boîte de nuit",
    "boite de nuit",
  ];

  return (
    horecaKeywords.some((k) => bt.includes(k)) ||
    /\b(bar|resto|restaurant|lounge|pub|snack)\b/i.test(bt)
  );
}

