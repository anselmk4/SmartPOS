import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const result = await reconcileTenantsData(prisma);
    return NextResponse.json({
      success: true,
      message: "Réconciliation des données effectuée avec succès.",
      data: result,
    });
  } catch (err: any) {
    console.error("[Reconcile Tenants Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erreur de réconciliation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await reconcileTenantsData(prisma);
    return NextResponse.json({
      success: true,
      message: "Réconciliation des données effectuée avec succès.",
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function reconcileTenantsData(prismaClient: typeof prisma) {
  const now = new Date();

  // 1. Find Catalina Cosmetics & Wake Up Restaurant tenants
  const allTenants = await prismaClient.tenant.findMany({
    include: { stores: true },
  });

  const catalinaTenant = allTenants.find(
    (t) =>
      t.name.toLowerCase().includes("catalina") ||
      t.slug.toLowerCase().includes("catalina")
  );

  const wakeUpTenant = allTenants.find(
    (t) =>
      t.name.toLowerCase().includes("wake") ||
      t.slug.toLowerCase().includes("wake")
  );

  let catalinaUpdated = false;
  let wakeUpUpdated = false;
  let productsReassignedToCatalina = 0;
  let productsReassignedToWakeUp = 0;

  // Ensure Catalina Cosmetics has USD currency
  if (catalinaTenant) {
    await prismaClient.tenant.update({
      where: { id: catalinaTenant.id },
      data: {
        currency: "USD",
        businessType: "Cosmétiques, Parfumerie, Beauté & Soins",
        updatedAt: now,
      },
    });

    if (catalinaTenant.stores && catalinaTenant.stores.length > 0) {
      await prismaClient.store.updateMany({
        where: { tenantId: catalinaTenant.id },
        data: {
          currency: "USD",
          businessType: "Cosmétiques, Parfumerie, Beauté & Soins",
          updatedAt: now,
        },
      });
    }
    catalinaUpdated = true;
  }

  // Ensure Wake Up Restaurant has CDF currency
  if (wakeUpTenant) {
    await prismaClient.tenant.update({
      where: { id: wakeUpTenant.id },
      data: {
        currency: "CDF",
        businessType: "Bar, Lounge, Pub & Terrasse",
        updatedAt: now,
      },
    });

    if (wakeUpTenant.stores && wakeUpTenant.stores.length > 0) {
      await prismaClient.store.updateMany({
        where: { tenantId: wakeUpTenant.id },
        data: {
          currency: "CDF",
          businessType: "Bar, Lounge, Pub & Terrasse",
          updatedAt: now,
        },
      });
    }
    wakeUpUpdated = true;
  }

  // If both tenants exist, reassign misplaced products
  if (catalinaTenant && wakeUpTenant) {
    const catalinaStoreId = catalinaTenant.stores[0]?.id || catalinaTenant.id;
    const wakeUpStoreId = wakeUpTenant.stores[0]?.id || wakeUpTenant.id;

    const allProducts = await prismaClient.product.findMany();

    const cosmeticKeywords = [
      "lotion", "parfum", "crème", "creme", "éclat", "eclat", "polo",
      "miss light", "fw exclusive", "bio pure", "savon", "huile", "soin",
      "beauté", "beaute", "rouge", "gloss", "lait", "pommade", "gommage",
      "gel douche", "shampoing", "fond de teint", "poudre", "mascara",
      "vernis", "mèche", "meche", "perruque", "cosmétique", "cosmetique"
    ];

    const restaurantKeywords = [
      "amarula", "amstel", "baileys", "baron", "banane", "bière", "biere",
      "sucré", "sucre", "vin", "liqueur", "cognac", "whisky", "vodka",
      "champagne", "bralima", "brasimba", "bralirwa", "brarudi", "primus",
      "skol", "mutzig", "turbo", "castel", "beaufort", "doppel", "guinness",
      "heineken", "coca", "fanta", "sprite", "vitalo", "tonic", "grillade",
      "poisson", "viande", "poulet", "plat", "chikwangue", "frites", "salade",
      "tapas", "brochette", "capitaine", "malangwa", "riz", "kosa"
    ];

    for (const prod of allProducts) {
      const lowerName = (prod.name || "").toLowerCase();
      const lowerCat = (prod.category || "").toLowerCase();

      const isCosmetic =
        cosmeticKeywords.some((k) => lowerName.includes(k) || lowerCat.includes(k)) ||
        lowerCat.includes("hygiène") ||
        lowerCat.includes("beauté") ||
        lowerCat.includes("cosmétique");

      const isRestaurant =
        restaurantKeywords.some((k) => lowerName.includes(k) || lowerCat.includes(k)) ||
        lowerCat.includes("boisson") ||
        lowerCat.includes("alimentation") ||
        lowerCat.includes("restaurant") ||
        lowerCat.includes("bar");

      if (isCosmetic && prod.tenantId !== catalinaTenant.id) {
        await prismaClient.product.update({
          where: { id: prod.id },
          data: {
            tenantId: catalinaTenant.id,
            storeId: catalinaStoreId,
            updatedAt: now,
          },
        });
        productsReassignedToCatalina++;
      } else if (isRestaurant && prod.tenantId !== wakeUpTenant.id) {
        await prismaClient.product.update({
          where: { id: prod.id },
          data: {
            tenantId: wakeUpTenant.id,
            storeId: wakeUpStoreId,
            updatedAt: now,
          },
        });
        productsReassignedToWakeUp++;
      }
    }
  }

  return {
    catalinaUpdated,
    wakeUpUpdated,
    catalinaId: catalinaTenant?.id,
    wakeUpId: wakeUpTenant?.id,
    productsReassignedToCatalina,
    productsReassignedToWakeUp,
  };
}
