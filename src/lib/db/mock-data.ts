import { db, generateUUID, DEFAULT_STORE_ID, enqueueSync } from "./dexie-db";
import type { Product, Customer } from "@/lib/shared/types";

export const SAMPLE_PRODUCTS: Omit<Product, "id" | "storeId" | "createdAt" | "updatedAt" | "isSynced">[] = [
  {
    name: "Sac de Riz Parfumé Lion 25kg",
    unitPrice: 65000,
    costPrice: 58000,
    stockQuantity: 18,
    minStockAlert: 5,
    category: "Alimentation",
    barcode: "6001001",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Huile Végétale Simba 5L",
    unitPrice: 28000,
    costPrice: 24500,
    stockQuantity: 24,
    minStockAlert: 6,
    category: "Alimentation",
    barcode: "6001002",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Lait Concentré Bonnet Rouge 410g",
    unitPrice: 3500,
    costPrice: 2900,
    stockQuantity: 4, // Low stock!
    minStockAlert: 10,
    category: "Alimentation",
    barcode: "6001003",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Sucre Blanc Kwilu Ngongo 1kg",
    unitPrice: 4500,
    costPrice: 3800,
    stockQuantity: 40,
    minStockAlert: 10,
    category: "Alimentation",
    barcode: "6001004",
    imageUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Spaghetti Régal 500g",
    unitPrice: 2000,
    costPrice: 1600,
    stockQuantity: 65,
    minStockAlert: 15,
    category: "Alimentation",
    barcode: "6001005",
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Savon de Ménage Brilliant 250g",
    unitPrice: 1500,
    costPrice: 1100,
    stockQuantity: 2, // Very low stock!
    minStockAlert: 12,
    category: "Hygiène & Entretien",
    barcode: "6001006",
    imageUrl: "https://images.unsplash.com/photo-1607006314774-72643a6d4ee2?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Eau Minérale Swissta 1.5L (Pack 6)",
    unitPrice: 9000,
    costPrice: 7500,
    stockQuantity: 15,
    minStockAlert: 4,
    category: "Boissons",
    barcode: "6001007",
    imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Boisson Gazeuse Bralima 33cl",
    unitPrice: 2000,
    costPrice: 1500,
    stockQuantity: 30,
    minStockAlert: 10,
    category: "Boissons",
    barcode: "6001008",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Café de l'Est Moulu 250g",
    unitPrice: 5500,
    costPrice: 4200,
    stockQuantity: 20,
    minStockAlert: 5,
    category: "Alimentation",
    barcode: "6001009",
    imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Farine de Froment Midema 1kg",
    unitPrice: 3000,
    costPrice: 2400,
    stockQuantity: 35,
    minStockAlert: 8,
    category: "Alimentation",
    barcode: "6001010",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Omo Lessive Poudre 500g",
    unitPrice: 4000,
    costPrice: 3200,
    stockQuantity: 14,
    minStockAlert: 5,
    category: "Hygiène & Entretien",
    barcode: "6001011",
    imageUrl: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Recharge Téléphonique 5000 FC (Vodacom/Airtel/Orange)",
    unitPrice: 5000,
    costPrice: 4800,
    stockQuantity: 100,
    minStockAlert: 20,
    category: "Services & Crédit",
    barcode: "6001012",
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80",
  },
];

export const SAMPLE_CUSTOMERS: Omit<Customer, "id" | "storeId" | "createdAt" | "updatedAt" | "isSynced">[] = [
  {
    name: "Mme Mamie Kapinga",
    phone: "+243810123456",
    currentDebtBalance: 35000,
  },
  {
    name: "Trésor Mbuyi (Menuisier)",
    phone: "+243990234567",
    currentDebtBalance: 75000,
  },
  {
    name: "Maman Fifi (Vendeuse Marché)",
    phone: "+243890345678",
    currentDebtBalance: 20000,
  },
  {
    name: "Patrick Lumbala",
    phone: "+243820456789",
    currentDebtBalance: 0,
  },
  {
    name: "Grace Kalala",
    phone: "+243970567890",
    currentDebtBalance: 15000,
  },
];

/**
 * Seeds initial demo data into IndexedDB if database is empty
 */
export async function seedDemoDataIfEmpty(): Promise<boolean> {
  const count = await db.products.count();
  if (count > 0) return false;

  const now = new Date().toISOString();

  // 1. Products
  const products: Product[] = SAMPLE_PRODUCTS.map((p) => ({
    ...p,
    id: generateUUID(),
    storeId: DEFAULT_STORE_ID,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
  }));

  await db.products.bulkAdd(products);

  for (const prod of products) {
    await enqueueSync({
      storeId: DEFAULT_STORE_ID,
      entity: "product",
      action: "CREATE",
      payload: JSON.stringify(prod),
    });
  }

  // 2. Customers
  const customers: Customer[] = SAMPLE_CUSTOMERS.map((c) => ({
    ...c,
    id: generateUUID(),
    storeId: DEFAULT_STORE_ID,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
  }));

  await db.customers.bulkAdd(customers);

  for (const cust of customers) {
    await enqueueSync({
      storeId: DEFAULT_STORE_ID,
      entity: "customer",
      action: "CREATE",
      payload: JSON.stringify(cust),
    });
  }

  return true;
}

/**
 * Reset and force reseed for testing
 */
export async function resetAndSeedDatabase(): Promise<void> {
  await db.transaction("rw", [db.products, db.customers, db.sales, db.saleItems, db.debtPayments, db.syncQueue], async () => {
    await db.products.clear();
    await db.customers.clear();
    await db.sales.clear();
    await db.saleItems.clear();
    await db.debtPayments.clear();
    await db.syncQueue.clear();
  });
  await seedDemoDataIfEmpty();
}
