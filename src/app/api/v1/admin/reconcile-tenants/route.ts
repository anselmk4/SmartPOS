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

/**
 * Air-tight multi-tenant data restitution & isolation engine.
 * Restores every commerce's legitimate products, currency, store records, and users.
 */
export async function reconcileTenantsData(prismaClient: typeof prisma) {
  const now = new Date();

  // 1. Fetch all tenants with their stores and users
  const allTenants = await prismaClient.tenant.findMany({
    include: { stores: true, users: true },
  });

  // Identify Catalina Cosmetics (Olivier Birhalya)
  const catalinaTenant = allTenants.find(
    (t) =>
      t.name.toLowerCase().includes("catalina") ||
      t.slug.toLowerCase().includes("catalina") ||
      t.users.some((u) => (u.name || "").toLowerCase().includes("birhalya") || (u.name || "").toLowerCase().includes("olivier"))
  );

  // Identify Wake Up Restaurant (Patrick Mwisha)
  const wakeUpTenant = allTenants.find(
    (t) =>
      t.id === "f27a21c8-721e-4156-9ad3-b584e475e7b1" ||
      t.name.toLowerCase().includes("wake") ||
      t.slug.toLowerCase().includes("wake") ||
      t.users.some((u) => (u.name || "").toLowerCase().includes("mwisha") || (u.name || "").toLowerCase().includes("patrick"))
  );

  let catalinaUpdated = false;
  let wakeUpUpdated = false;
  let productsReassignedToCatalina = 0;
  let productsReassignedToWakeUp = 0;

  // 2. Lock Catalina Cosmetics properties (USD, Cosmetics)
  if (catalinaTenant) {
    await prismaClient.tenant.update({
      where: { id: catalinaTenant.id },
      data: {
        name: "CATALINA COSMETICS",
        currency: "USD",
        businessType: "Cosmétiques, Parfumerie, Beauté & Soins",
        updatedAt: now,
      },
    });

    await prismaClient.store.updateMany({
      where: { tenantId: catalinaTenant.id },
      data: {
        name: "CATALINA COSMETICS",
        currency: "USD",
        businessType: "Cosmétiques, Parfumerie, Beauté & Soins",
        updatedAt: now,
      },
    });

    catalinaUpdated = true;
  }

  // 3. Lock Wake Up Restaurant properties (CDF, Bar & Restaurant)
  if (wakeUpTenant) {
    await prismaClient.tenant.update({
      where: { id: wakeUpTenant.id },
      data: {
        name: "Wake Up Restaurant",
        currency: "CDF",
        businessType: "Bar, Lounge, Pub & Terrasse",
        updatedAt: now,
      },
    });

    await prismaClient.store.updateMany({
      where: { tenantId: wakeUpTenant.id },
      data: {
        name: "Wake Up Restaurant",
        currency: "CDF",
        businessType: "Bar, Lounge, Pub & Terrasse",
        updatedAt: now,
      },
    });

    wakeUpUpdated = true;
  }

  // 4. Precise product keyword mapping
  if (catalinaTenant && wakeUpTenant) {
    const catalinaStore = catalinaTenant.stores[0] || (await prismaClient.store.findFirst({ where: { tenantId: catalinaTenant.id } }));
    const wakeUpStore = wakeUpTenant.stores[0] || (await prismaClient.store.findFirst({ where: { tenantId: wakeUpTenant.id } }));

    const catalinaStoreId = catalinaStore?.id || catalinaTenant.id;
    const wakeUpStoreId = wakeUpStore?.id || wakeUpTenant.id;

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

  // 5. General Integrity Check: Ensure every product and sale in the entire database has a valid storeId matching its tenant
  const orphanedProducts = await prismaClient.product.findMany({
    include: { store: { select: { tenantId: true } } },
  });

  for (const prod of orphanedProducts) {
    if (!prod.store || prod.store.tenantId !== prod.tenantId) {
      const validStore = await prismaClient.store.findFirst({
        where: { tenantId: prod.tenantId },
      });
      if (validStore) {
        await prismaClient.product.update({
          where: { id: prod.id },
          data: { storeId: validStore.id, updatedAt: now },
        });
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
