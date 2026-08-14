// Universal shared types for Micro-ERP SaaS Multi-Tenant (Web & Expo/React Native)

export type UserRole = "OWNER" | "MANAGER" | "CASHIER";

export type SubscriptionPlan = "FREE" | "PRO" | "BUSINESS";

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIAL";

export type PaymentMethod =
  | "CASH"
  | "MPESA"
  | "AIRTEL_MONEY"
  | "ORANGE_MONEY"
  | "AFRIMONEY"
  | "WAVE"
  | "MTN_MOMO"
  | "MOOV_MONEY"
  | "CREDIT"
  | "CARD"
  | "MIXED";

export type SyncAction = "CREATE" | "UPDATE" | "DELETE" | "STOCK_DELTA";

export type SyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone?: string;
  countryCode: string;
  currency: string; // XOF, XAF, GNF, CDF, USD, etc.
  plan: SubscriptionPlan;
  planStatus: SubscriptionStatus;
  planExpiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  storeId?: string;
  name: string;
  phone?: string;
  email?: string;
  pinCode?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: SubscriptionStatus;
  transactionId?: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface Store {
  id: string;
  tenantId?: string;
  name: string;
  currency: string;
  phone?: string;
  address?: string;
  ownerName?: string;
  managerId?: string;
  managerName?: string;
  managerPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId?: string;
  storeId: string;
  name: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  minStockAlert: number;
  category: string;
  barcode?: string;
  imageUrl?: string;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  tenantId?: string;
  storeId: string;
  name: string;
  phone?: string;
  currentDebtBalance: number;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  createdAt: string;
  productName?: string;
}

export interface Sale {
  id: string;
  tenantId?: string;
  storeId: string;
  customerId?: string | null;
  userId?: string | null;
  totalAmount: number;
  amountPaid: number;
  debtAmount: number;
  paymentMethod: PaymentMethod;
  status: "COMPLETED" | "CANCELLED" | "PENDING";
  receiptNumber?: string;
  notes?: string;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
  items?: SaleItem[];
}

export interface DebtPayment {
  id: string;
  tenantId?: string;
  storeId: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransfer {
  id: string;
  tenantId?: string;
  fromStoreId: string;
  toStoreId: string;
  productId: string;
  productName: string;
  quantity: number;
  notes?: string;
  performedByUserId?: string;
  performedByName?: string;
  createdAt: string;
}

export interface CashClosing {
  id: string;
  tenantId?: string;
  storeId: string;
  userId?: string;
  userName?: string;
  openingCash: number;
  totalSalesCash: number;
  totalDebtRepaymentsCash: number;
  expectedCash: number;
  actualCashCounted: number;
  variance: number; // actualCashCounted - expectedCash (positive = surplus, negative = deficit)
  notes?: string;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  tenantId?: string;
  storeId: string;
  entity: "tenant" | "user" | "store" | "product" | "customer" | "sale" | "debt_payment" | "subscription" | "stock_transfer" | "cash_closing";
  action: SyncAction;
  payload: string;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockDeltaPayload {
  productId: string;
  storeId: string;
  tenantId?: string;
  deltaQuantity: number;
  reason: "SALE" | "RESTOCK" | "INVENTORY_CORRECTION" | "TRANSFER_IN" | "TRANSFER_OUT";
  referenceId?: string;
}

export interface SyncPushRequest {
  tenantId?: string;
  storeId: string;
  lastPulledAt?: string;
  mutations: Array<{
    id: string;
    entity: "tenant" | "user" | "store" | "product" | "customer" | "sale" | "debt_payment" | "subscription" | "stock_transfer" | "cash_closing";
    action: SyncAction;
    data: any;
    clientTimestamp: string;
  }>;
}

export interface SyncPushResponse {
  success: boolean;
  syncedIds: string[];
  failedIds?: Array<{ id: string; error: string }>;
  serverTime: string;
  updates?: {
    products?: Product[];
    customers?: Customer[];
    sales?: Sale[];
    debtPayments?: DebtPayment[];
    users?: User[];
    tenant?: Tenant;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Plan Limits & Feature Capabilities
export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  monthlyPriceCDF: number;
  maxSalesPerMonth: number | null; // null = unlimited
  maxStores: number;
  maxDebtors: number | null; // null = unlimited
  canAccessOwnerDashboard: boolean;
  canViewGrossProfitMargins: boolean;
  canUseWhatsAppTemplates: boolean;
  canExportReports: boolean;
  canTransferStock: boolean;
  canCreateMultipleCashiers: boolean;
  canUseCloudSync: boolean;
  canPerformCashClosing: boolean;
}

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Découverte",
    monthlyPriceCDF: 0,
    maxSalesPerMonth: 100,
    maxStores: 1,
    maxDebtors: 5,
    canAccessOwnerDashboard: false,
    canViewGrossProfitMargins: false,
    canUseWhatsAppTemplates: false,
    canExportReports: false,
    canTransferStock: false,
    canCreateMultipleCashiers: false,
    canUseCloudSync: false,
    canPerformCashClosing: false,
  },
  PRO: {
    id: "PRO",
    name: "Commerçant Pro",
    monthlyPriceCDF: 15000,
    maxSalesPerMonth: null, // Unlimited
    maxStores: 1,
    maxDebtors: null, // Unlimited
    canAccessOwnerDashboard: true,
    canViewGrossProfitMargins: true,
    canUseWhatsAppTemplates: true,
    canExportReports: false,
    canTransferStock: false,
    canCreateMultipleCashiers: false,
    canUseCloudSync: true,
    canPerformCashClosing: true,
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business Multi-Magasins",
    monthlyPriceCDF: 45000,
    maxSalesPerMonth: null, // Unlimited
    maxStores: 10, // Multi-stores
    maxDebtors: null, // Unlimited
    canAccessOwnerDashboard: true,
    canViewGrossProfitMargins: true,
    canUseWhatsAppTemplates: true,
    canExportReports: true,
    canTransferStock: true,
    canCreateMultipleCashiers: true,
    canUseCloudSync: true,
    canPerformCashClosing: true,
  },
};
