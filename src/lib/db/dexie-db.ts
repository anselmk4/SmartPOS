import Dexie, { type Table } from "dexie";
import type {
  Tenant,
  User,
  Subscription,
  Store,
  Product,
  Customer,
  Sale,
  SaleItem,
  DebtPayment,
  Expense,
  StockTransfer,
  CashClosing,
  SyncQueueItem,
  PaymentMethod,
  StockDeltaPayload,
  PaymentSplit,
  HeldOrder,
} from "@/lib/shared/types";

export class MicroERPDatabase extends Dexie {
  tenants!: Table<Tenant, string>;
  users!: Table<User, string>;
  subscriptions!: Table<Subscription, string>;
  stores!: Table<Store, string>;
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  sales!: Table<Sale, string>;
  saleItems!: Table<SaleItem, string>;
  debtPayments!: Table<DebtPayment, string>;
  expenses!: Table<Expense, string>;
  stockTransfers!: Table<StockTransfer, string>;
  cashClosings!: Table<CashClosing, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  heldOrders!: Table<HeldOrder, string>;

  constructor() {
    super("MicroERPDb");
    this.version(6).stores({
      tenants: "id, slug, plan, planStatus, countryCode, currency, updatedAt",
      users: "id, tenantId, storeId, phone, email, role, pinCode, updatedAt",
      subscriptions: "id, tenantId, plan, paymentStatus, createdAt",
      stores: "id, tenantId, name, currency, countryCode, managerId, updatedAt",
      products: "id, tenantId, storeId, name, category, stockQuantity, minStockAlert, updatedAt, isSynced",
      customers: "id, tenantId, storeId, name, phone, currentDebtBalance, updatedAt, isSynced",
      sales: "id, tenantId, storeId, customerId, userId, paymentMethod, status, createdAt, updatedAt, isSynced",
      saleItems: "id, saleId, productId, createdAt",
      debtPayments: "id, tenantId, storeId, customerId, createdAt, isSynced",
      expenses: "id, tenantId, storeId, category, expenseDate, createdAt, isSynced",
      stockTransfers: "id, tenantId, fromStoreId, toStoreId, productId, createdAt",
      cashClosings: "id, tenantId, storeId, userId, createdAt",
      syncQueue: "id, tenantId, storeId, entity, action, status, createdAt",
      heldOrders: "id, storeId, label, customerId, createdAt",
    });
  }
}

export const db = new MicroERPDatabase();

/**
 * Utility to generate standard UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const DEFAULT_TENANT_ID = "00000000-0000-4000-8000-000000000000";
export const DEFAULT_STORE_ID = "00000000-0000-4000-8000-000000000001";
export const DEFAULT_USER_ID = "00000000-0000-4000-8000-000000000002";

/**
 * Ensures default tenant, user and store exist in local Dexie DB
 */
export async function getOrCreateDefaultStore(): Promise<{ tenant: Tenant; store: Store; user: User }> {
  let tenant = await db.tenants.get(DEFAULT_TENANT_ID);
  if (!tenant) {
    tenant = {
      id: DEFAULT_TENANT_ID,
      name: "Établissement Victoire (Kinshasa)",
      slug: "victoire-rdc",
      phone: "+243 81 000 11 22",
      countryCode: "CD",
      currency: "CDF",
      plan: "PRO",
      planStatus: "ACTIVE",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.tenants.put(tenant);
  }

  let store = await db.stores.get(DEFAULT_STORE_ID);
  if (!store) {
    store = {
      id: DEFAULT_STORE_ID,
      tenantId: DEFAULT_TENANT_ID,
      name: "Boutique Victoire - Gombe",
      currency: "CDF",
      phone: "+243 81 000 11 22",
      address: "Avenue du Commerce, Gombe, Kinshasa",
      ownerName: "Dieudonné Kasongo",
      managerId: DEFAULT_USER_ID,
      managerName: "Dieudonné Kasongo",
      managerPhone: "+243 81 000 11 22",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.stores.put(store);

    await enqueueSync({
      tenantId: DEFAULT_TENANT_ID,
      storeId: store.id,
      entity: "store",
      action: "CREATE",
      payload: JSON.stringify(store),
    });
  }

  let user = await db.users.get(DEFAULT_USER_ID);
  if (!user) {
    user = {
      id: DEFAULT_USER_ID,
      tenantId: DEFAULT_TENANT_ID,
      storeId: DEFAULT_STORE_ID,
      name: "Dieudonné Kasongo (Gérant)",
      phone: "+243 81 000 11 22",
      email: "dieudonne@victoire.cd",
      pinCode: "1234",
      role: "OWNER",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.users.put(user);
  }

  return { tenant, store, user };
}

/**
 * Enqueue an operation into local SyncQueue
 */
export async function enqueueSync(item: {
  tenantId?: string;
  storeId: string;
  entity: SyncQueueItem["entity"];
  action: "CREATE" | "UPDATE" | "DELETE" | "STOCK_DELTA";
  payload: string;
}): Promise<string> {
  const queueId = generateUUID();
  const queueItem: SyncQueueItem = {
    id: queueId,
    tenantId: item.tenantId || DEFAULT_TENANT_ID,
    storeId: item.storeId,
    entity: item.entity,
    action: item.action,
    payload: item.payload,
    status: "PENDING",
    retryCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.syncQueue.add(queueItem);
  return queueId;
}

/**
 * Atomically process a completed Sale offline in Dexie IndexedDB
 */
export async function processLocalSale(params: {
  tenantId?: string;
  storeId: string;
  customerId?: string | null;
  userId?: string | null;
  items: Array<{ product: Product; quantity: number; unitPrice: number }>;
  paymentMethod: PaymentMethod;
  paymentSplits?: PaymentSplit[];
  amountPaid: number;
  discountAmount?: number;
  discountType?: "PERCENT" | "FIXED";
  discountValue?: number;
  tableOrLabel?: string;
  notes?: string;
}): Promise<{ sale: Sale; items: SaleItem[] }> {
  const {
    tenantId = DEFAULT_TENANT_ID,
    storeId,
    customerId,
    userId,
    items,
    paymentMethod,
    paymentSplits,
    amountPaid,
    discountAmount = 0,
    discountType,
    discountValue,
    tableOrLabel,
    notes,
  } = params;
  const now = new Date().toISOString();

  const subtotalAmount = items.reduce(
    (acc, it) => acc + it.quantity * it.unitPrice,
    0
  );
  const totalAmount = Math.max(0, subtotalAmount - discountAmount);
  const debtAmount = Math.max(0, totalAmount - amountPaid);
  const saleId = generateUUID();
  const receiptNumber = `TK-${Date.now().toString().slice(-6)}`;

  const sale: Sale = {
    id: saleId,
    tenantId,
    storeId,
    customerId: customerId || null,
    userId: userId || null,
    subtotalAmount,
    discountAmount,
    discountType,
    discountValue,
    totalAmount,
    amountPaid,
    debtAmount,
    paymentMethod,
    paymentSplits: paymentSplits && paymentSplits.length > 0 ? paymentSplits : undefined,
    status: "COMPLETED",
    receiptNumber,
    tableOrLabel,
    notes,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
  };

  const saleItems: SaleItem[] = items.map((it) => ({
    id: generateUUID(),
    saleId,
    productId: it.product.id,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    costPrice: it.product.costPrice || 0,
    productName: it.product.name,
    createdAt: now,
  }));

  await db.transaction("rw", [db.sales, db.saleItems, db.products, db.customers, db.syncQueue], async () => {
    // 1. Add Sale
    await db.sales.add(sale);

    // 2. Add Sale Items
    await db.saleItems.bulkAdd(saleItems);

    // 3. Decrement Product Stock locally & enqueue stock deltas
    for (const item of items) {
      const currentProd = await db.products.get(item.product.id);
      if (currentProd) {
        const newStock = Math.max(0, currentProd.stockQuantity - item.quantity);
        await db.products.update(item.product.id, {
          stockQuantity: newStock,
          updatedAt: now,
          isSynced: false,
        });

        const stockDelta: StockDeltaPayload = {
          productId: item.product.id,
          storeId,
          tenantId,
          deltaQuantity: -item.quantity,
          reason: "SALE",
          referenceId: saleId,
        };

        const deltaQueueItem: SyncQueueItem = {
          id: generateUUID(),
          tenantId,
          storeId,
          entity: "product",
          action: "STOCK_DELTA",
          payload: JSON.stringify(stockDelta),
          status: "PENDING",
          retryCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        await db.syncQueue.add(deltaQueueItem);
      }
    }

    // 4. Update Customer Debt if debtAmount > 0
    if (customerId && debtAmount > 0) {
      const cust = await db.customers.get(customerId);
      if (cust) {
        const newBalance = cust.currentDebtBalance + debtAmount;
        await db.customers.update(customerId, {
          currentDebtBalance: newBalance,
          updatedAt: now,
          isSynced: false,
        });

        const custQueueItem: SyncQueueItem = {
          id: generateUUID(),
          tenantId,
          storeId,
          entity: "customer",
          action: "UPDATE",
          payload: JSON.stringify({
            id: customerId,
            name: cust.name,
            phone: cust.phone,
            currentDebtBalance: newBalance,
            updatedAt: now,
          }),
          status: "PENDING",
          retryCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        await db.syncQueue.add(custQueueItem);
      }
    }

    // 5. Enqueue Sale Creation mutation
    const salePayload = {
      ...sale,
      items: saleItems,
    };
    const saleQueueItem: SyncQueueItem = {
      id: generateUUID(),
      tenantId,
      storeId,
      entity: "sale",
      action: "CREATE",
      payload: JSON.stringify(salePayload),
      status: "PENDING",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.syncQueue.add(saleQueueItem);
  });

  return { sale, items: saleItems };
}

/**
 * Record a Debt Repayment offline
 */
export async function processDebtRepayment(params: {
  tenantId?: string;
  storeId: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}): Promise<DebtPayment> {
  const { tenantId = DEFAULT_TENANT_ID, storeId, customerId, amount, paymentMethod, notes } = params;
  const now = new Date().toISOString();
  const paymentId = generateUUID();

  const payment: DebtPayment = {
    id: paymentId,
    tenantId,
    storeId,
    customerId,
    amount,
    paymentMethod,
    notes,
    isSynced: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction("rw", [db.customers, db.debtPayments, db.syncQueue], async () => {
    const cust = await db.customers.get(customerId);
    if (!cust) throw new Error("Client introuvable");

    const newBalance = Math.max(0, cust.currentDebtBalance - amount);
    await db.customers.update(customerId, {
      currentDebtBalance: newBalance,
      updatedAt: now,
      isSynced: false,
    });

    await db.debtPayments.add(payment);

    await db.syncQueue.add({
      id: generateUUID(),
      tenantId,
      storeId,
      entity: "customer",
      action: "UPDATE",
      payload: JSON.stringify({
        id: customerId,
        name: cust.name,
        phone: cust.phone,
        currentDebtBalance: newBalance,
        updatedAt: now,
      }),
      status: "PENDING",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    await db.syncQueue.add({
      id: generateUUID(),
      tenantId,
      storeId,
      entity: "debt_payment",
      action: "CREATE",
      payload: JSON.stringify(payment),
      status: "PENDING",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  });

  return payment;
}

/**
 * Inter-Store Stock Transfer (Business Plan Exclusive)
 */
export async function processStockTransfer(params: {
  tenantId?: string;
  fromStoreId: string;
  toStoreId: string;
  productId: string;
  quantity: number;
  notes?: string;
  userId?: string;
  userName?: string;
}): Promise<StockTransfer> {
  const { tenantId = DEFAULT_TENANT_ID, fromStoreId, toStoreId, productId, quantity, notes, userId, userName } = params;
  const now = new Date().toISOString();
  const transferId = generateUUID();

  const sourceProduct = await db.products.get(productId);
  if (!sourceProduct) throw new Error("Produit source introuvable");
  if (sourceProduct.stockQuantity < quantity) {
    throw new Error(`Stock insuffisant dans le magasin source (Disponible: ${sourceProduct.stockQuantity})`);
  }

  const transfer: StockTransfer = {
    id: transferId,
    tenantId,
    fromStoreId,
    toStoreId,
    productId,
    productName: sourceProduct.name,
    quantity,
    notes,
    performedByUserId: userId,
    performedByName: userName,
    createdAt: now,
  };

  await db.transaction("rw", [db.products, db.stockTransfers, db.syncQueue], async () => {
    // 1. Decrement source product
    await db.products.update(productId, {
      stockQuantity: sourceProduct.stockQuantity - quantity,
      updatedAt: now,
    });

    // 2. Increment or create target product in destination store
    const targetProduct = await db.products
      .filter((p) => p.storeId === toStoreId && p.name.toLowerCase() === sourceProduct.name.toLowerCase())
      .first();

    if (targetProduct) {
      await db.products.update(targetProduct.id, {
        stockQuantity: targetProduct.stockQuantity + quantity,
        updatedAt: now,
      });
    } else {
      const newTargetProd: Product = {
        ...sourceProduct,
        id: generateUUID(),
        storeId: toStoreId,
        stockQuantity: quantity,
        createdAt: now,
        updatedAt: now,
        isSynced: false,
      };
      await db.products.add(newTargetProd);
    }

    // 3. Record transfer log
    await db.stockTransfers.add(transfer);

    // 4. Enqueue sync
    await db.syncQueue.add({
      id: generateUUID(),
      tenantId,
      storeId: fromStoreId,
      entity: "stock_transfer",
      action: "CREATE",
      payload: JSON.stringify(transfer),
      status: "PENDING",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  });

  return transfer;
}

/**
 * Record Daily Cash Reconciliation (Ticket Z Closing)
 */
export async function processCashClosing(params: {
  tenantId?: string;
  storeId: string;
  userId?: string;
  userName?: string;
  openingCash: number;
  totalSalesCash: number;
  totalDebtRepaymentsCash: number;
  actualCashCounted: number;
  notes?: string;
}): Promise<CashClosing> {
  const { tenantId = DEFAULT_TENANT_ID, storeId, userId, userName, openingCash, totalSalesCash, totalDebtRepaymentsCash, actualCashCounted, notes } = params;
  const now = new Date().toISOString();
  const closingId = generateUUID();

  const expectedCash = openingCash + totalSalesCash + totalDebtRepaymentsCash;
  const variance = actualCashCounted - expectedCash;

  const closing: CashClosing = {
    id: closingId,
    tenantId,
    storeId,
    userId,
    userName,
    openingCash,
    totalSalesCash,
    totalDebtRepaymentsCash,
    expectedCash,
    actualCashCounted,
    variance,
    notes,
    createdAt: now,
  };

  await db.transaction("rw", [db.cashClosings, db.syncQueue], async () => {
    await db.cashClosings.add(closing);

    await db.syncQueue.add({
      id: generateUUID(),
      tenantId,
      storeId,
      entity: "cash_closing",
      action: "CREATE",
      payload: JSON.stringify(closing),
      status: "PENDING",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  });

  return closing;
}

/**
 * Create a new store under a tenant (Business Plan Multi-Stores)
 */
export async function createStoreForTenant(params: {
  tenantId: string;
  name: string;
  currency?: string;
  phone?: string;
  address?: string;
  ownerName?: string;
  managerId?: string;
  managerName?: string;
  managerPhone?: string;
}): Promise<Store> {
  const now = new Date().toISOString();
  const storeId = generateUUID();

  const newStore: Store = {
    id: storeId,
    tenantId: params.tenantId,
    name: params.name.trim(),
    currency: params.currency || "CDF",
    phone: params.phone?.trim(),
    address: params.address?.trim(),
    ownerName: params.ownerName?.trim(),
    managerId: params.managerId,
    managerName: params.managerName?.trim(),
    managerPhone: params.managerPhone?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  await db.stores.add(newStore);

  await enqueueSync({
    tenantId: params.tenantId,
    storeId,
    entity: "store",
    action: "CREATE",
    payload: JSON.stringify(newStore),
  });

  return newStore;
}

/**
 * Assign or update a store manager
 */
export async function assignManagerToStore(
  storeId: string,
  manager: {
    managerId?: string;
    managerName?: string;
    managerPhone?: string;
  }
): Promise<void> {
  const store = await db.stores.get(storeId);
  if (!store) throw new Error("Magasin introuvable");

  const now = new Date().toISOString();
  const updatedStore: Store = {
    ...store,
    managerId: manager.managerId || store.managerId,
    managerName: manager.managerName?.trim() || store.managerName,
    managerPhone: manager.managerPhone?.trim() || store.managerPhone,
    updatedAt: now,
  };

  await db.stores.put(updatedStore);

  await enqueueSync({
    tenantId: store.tenantId,
    storeId,
    entity: "store",
    action: "UPDATE",
    payload: JSON.stringify(updatedStore),
  });
}

/**
 * Creates a new business expense in local Dexie DB and queues for sync
 */
export async function createExpense(data: {
  tenantId?: string;
  storeId: string;
  category: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptUrl?: string;
  expenseDate?: string;
}): Promise<Expense> {
  const now = new Date().toISOString();
  const expense: Expense = {
    id: generateUUID(),
    tenantId: data.tenantId,
    storeId: data.storeId,
    category: data.category,
    amount: data.amount,
    currency: data.currency,
    paymentMethod: data.paymentMethod,
    notes: data.notes?.trim() || undefined,
    receiptUrl: data.receiptUrl,
    expenseDate: data.expenseDate || now.split("T")[0],
    isSynced: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.expenses.add(expense);

  await enqueueSync({
    tenantId: data.tenantId,
    storeId: data.storeId,
    entity: "expense",
    action: "CREATE",
    payload: JSON.stringify(expense),
  });

  return expense;
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  const exp = await db.expenses.get(expenseId);
  if (!exp) return;

  await db.expenses.delete(expenseId);

  await enqueueSync({
    tenantId: exp.tenantId,
    storeId: exp.storeId,
    entity: "expense",
    action: "DELETE",
    payload: JSON.stringify({ id: expenseId }),
  });
}

/**
 * Update store branding (logo, country, currency, contact)
 */
export async function updateStoreBranding(
  storeId: string,
  data: {
    name?: string;
    businessType?: string;
    logoUrl?: string;
    countryCode?: string;
    currency?: string;
    phone?: string;
    email?: string;
    address?: string;
    ownerName?: string;
  }
): Promise<Store> {
  const store = await db.stores.get(storeId);
  if (!store) throw new Error("Magasin introuvable");

  const now = new Date().toISOString();
  const updatedStore: Store = {
    ...store,
    name: data.name !== undefined ? data.name.trim() : store.name,
    businessType: data.businessType !== undefined ? data.businessType.trim() : store.businessType,
    logoUrl: data.logoUrl !== undefined ? data.logoUrl : store.logoUrl,
    countryCode: data.countryCode !== undefined ? data.countryCode : store.countryCode,
    currency: data.currency !== undefined ? data.currency : store.currency,
    phone: data.phone !== undefined ? data.phone.trim() : store.phone,
    email: data.email !== undefined ? data.email.trim().toLowerCase() : store.email,
    address: data.address !== undefined ? data.address.trim() : store.address,
    ownerName: data.ownerName !== undefined ? data.ownerName.trim() : store.ownerName,
    updatedAt: now,
  };

  await db.stores.put(updatedStore);

  // If tenant exists, synchronize tenant currency and logo
  if (store.tenantId) {
    const tenant = await db.tenants.get(store.tenantId);
    if (tenant) {
      const updatedTenant: Tenant = {
        ...tenant,
        name: updatedStore.name,
        businessType: updatedStore.businessType,
        logoUrl: updatedStore.logoUrl,
        phone: updatedStore.phone,
        email: updatedStore.email,
        address: updatedStore.address,
        countryCode: updatedStore.countryCode || tenant.countryCode,
        currency: updatedStore.currency || tenant.currency,
        updatedAt: now,
      };
      await db.tenants.put(updatedTenant);
    }
  }

  await enqueueSync({
    tenantId: store.tenantId,
    storeId,
    entity: "store",
    action: "UPDATE",
    payload: JSON.stringify(updatedStore),
  });

  return updatedStore;
}

/**
 * Update user / staff member (PIN, name, phone, role, store)
 */
export async function updateStaffUser(
  userId: string,
  data: {
    name?: string;
    phone?: string;
    pinCode?: string;
    role?: "OWNER" | "MANAGER" | "CASHIER";
    storeId?: string;
    isActive?: boolean;
  }
): Promise<User> {
  const user = await db.users.get(userId);
  if (!user) throw new Error("Utilisateur introuvable");

  const now = new Date().toISOString();
  const updatedUser: User = {
    ...user,
    name: data.name !== undefined ? data.name.trim() : user.name,
    phone: data.phone !== undefined ? data.phone.trim() : user.phone,
    pinCode: data.pinCode !== undefined ? data.pinCode.trim() : user.pinCode,
    role: data.role !== undefined ? data.role : user.role,
    storeId: data.storeId !== undefined ? data.storeId : user.storeId,
    isActive: data.isActive !== undefined ? data.isActive : user.isActive,
    updatedAt: now,
  };

  await db.users.put(updatedUser);

  await enqueueSync({
    tenantId: user.tenantId,
    storeId: user.storeId || DEFAULT_STORE_ID,
    entity: "user",
    action: "UPDATE",
    payload: JSON.stringify(updatedUser),
  });

  return updatedUser;
}

/**
 * Delete a user / staff member
 */
export async function deleteStaffUser(userId: string): Promise<void> {
  const user = await db.users.get(userId);
  if (!user) return;

  await db.users.delete(userId);

  await enqueueSync({
    tenantId: user.tenantId,
    storeId: user.storeId || DEFAULT_STORE_ID,
    entity: "user",
    action: "DELETE",
    payload: JSON.stringify({ id: userId }),
  });
}

/**
 * Standard baseline prices map for sample products (CDF)
 */
export const ORIGINAL_SAMPLE_PRICE_MAP: Record<string, { unitPrice: number; costPrice: number }> = {
  "Sac de Riz Parfumé Lion 25kg": { unitPrice: 65000, costPrice: 58000 },
  "Huile Végétale Simba 5L": { unitPrice: 28000, costPrice: 24500 },
  "Lait Concentré Bonnet Rouge 410g": { unitPrice: 3500, costPrice: 2900 },
  "Sucre Blanc Kwilu Ngongo 1kg": { unitPrice: 4500, costPrice: 3800 },
  "Spaghetti Régal 500g": { unitPrice: 2000, costPrice: 1600 },
  "Savon de Ménage Brilliant 250g": { unitPrice: 1500, costPrice: 1100 },
  "Eau Minérale Swissta 1.5L (Pack 6)": { unitPrice: 9000, costPrice: 7500 },
  "Boisson Gazeuse Bralima 33cl": { unitPrice: 2000, costPrice: 1500 },
  "Café de l'Est Moulu 250g": { unitPrice: 5500, costPrice: 4200 },
  "Farine de Froment Midema 1kg": { unitPrice: 3000, costPrice: 2400 },
  "Savon Poudre Omo 500g": { unitPrice: 4000, costPrice: 3200 },
  "Boîte Allumettes Papillon (Paquet 10)": { unitPrice: 1500, costPrice: 1000 },
};

/**
 * Automatically repairs and resets all over-inflated product prices to sensible retail values.
 */
export async function repairAndRestoreStandardProductPrices(): Promise<number> {
  let repairedCount = 0;
  const products = await db.products.toArray();
  const now = new Date().toISOString();

  for (const prod of products) {
    let correctedUnitPrice = prod.unitPrice;
    let correctedCostPrice = prod.costPrice;
    let needsFix = false;

    // Check if name matches any known catalog item
    const matchedKnown = Object.entries(ORIGINAL_SAMPLE_PRICE_MAP).find(
      ([key]) =>
        prod.name.toLowerCase().includes(key.toLowerCase().slice(0, 10)) ||
        key.toLowerCase().includes(prod.name.toLowerCase().slice(0, 10))
    );

    if (matchedKnown && (prod.unitPrice > 100000 || prod.unitPrice < 500 || prod.unitPrice > matchedKnown[1].unitPrice * 2)) {
      correctedUnitPrice = matchedKnown[1].unitPrice;
      correctedCostPrice = matchedKnown[1].costPrice;
      needsFix = true;
    } else if (prod.unitPrice > 300000) {
      // Over-inflated by conversion multiplier -> reduce by factor 2850
      while (correctedUnitPrice > 150000) {
        correctedUnitPrice = Math.round(correctedUnitPrice / 2850);
        if (correctedCostPrice) correctedCostPrice = Math.round(correctedCostPrice / 2850);
      }
      needsFix = true;
    }

    if (needsFix && (correctedUnitPrice !== prod.unitPrice || correctedCostPrice !== prod.costPrice)) {
      await db.products.update(prod.id, {
        unitPrice: correctedUnitPrice,
        costPrice: correctedCostPrice,
        updatedAt: now,
      });
      repairedCount++;
    }
  }

  // Sanitize debts if over-inflated
  const customers = await db.customers.toArray();
  for (const cust of customers) {
    if (cust.currentDebtBalance > 500000) {
      let balance = cust.currentDebtBalance;
      while (balance > 100000) {
        balance = Math.round(balance / 2850);
      }
      await db.customers.update(cust.id, {
        currentDebtBalance: balance,
        updatedAt: now,
      });
    }
  }

  return repairedCount;
}

