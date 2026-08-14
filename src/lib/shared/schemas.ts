import { z } from "zod";

export const UserRoleSchema = z.enum(["OWNER", "MANAGER", "CASHIER"]);

export const SubscriptionPlanSchema = z.enum(["FREE", "PRO", "BUSINESS"]);

export const SubscriptionStatusSchema = z.enum(["ACTIVE", "PAST_DUE", "CANCELLED", "TRIAL"]);

export const PaymentMethodSchema = z.enum([
  "CASH",
  "MPESA",
  "AIRTEL_MONEY",
  "ORANGE_MONEY",
  "AFRIMONEY",
  "WAVE",
  "MTN_MOMO",
  "MOOV_MONEY",
  "CREDIT",
  "CARD",
  "MIXED",
]);

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Le nom de l'organisation est obligatoire"),
  slug: z.string(),
  phone: z.string().optional(),
  countryCode: z.string().default("CD"),
  currency: z.string().default("CDF"),
  plan: SubscriptionPlanSchema.default("FREE"),
  planStatus: SubscriptionStatusSchema.default("ACTIVE"),
  planExpiresAt: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1, "Le nom est obligatoire"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  pinCode: z.string().length(4, "Le code PIN doit comporter 4 chiffres").optional(),
  role: UserRoleSchema.default("CASHIER"),
  isActive: z.boolean().default(true),
  lastLoginAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Veuillez saisir votre numéro de téléphone ou email"),
  pinOrPassword: z.string().min(1, "Veuillez saisir votre code PIN ou mot de passe"),
});

export const RegisterMerchantSchema = z.object({
  storeName: z.string().min(2, "Le nom de la boutique est requis"),
  ownerName: z.string().min(2, "Le nom du gérant est requis"),
  phone: z.string().min(6, "Le numéro de téléphone est requis"),
  countryCode: z.string().default("CD"),
  currency: z.string().default("CDF"),
  pinCode: z.string().length(4, "Le code PIN caisse doit contenir 4 chiffres").default("1234"),
  plan: SubscriptionPlanSchema.default("PRO"),
});

export const StoreSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  name: z.string().min(1, "Le nom de la boutique est obligatoire"),
  currency: z.string().default("CDF"),
  phone: z.string().optional(),
  address: z.string().optional(),
  ownerName: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  storeId: z.string().uuid(),
  name: z.string().min(1, "Le nom du produit est requis"),
  unitPrice: z.number().min(0, "Le prix unitaire ne peut pas être négatif"),
  costPrice: z.number().min(0).default(0),
  stockQuantity: z.number().default(0),
  minStockAlert: z.number().min(0).default(5),
  category: z.string().default("Général"),
  barcode: z.string().optional(),
  imageUrl: z.string().optional(),
  isSynced: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  storeId: z.string().uuid(),
  name: z.string().min(1, "Le nom du client est requis"),
  phone: z.string().optional(),
  currentDebtBalance: z.number().default(0),
  isSynced: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SaleItemSchema = z.object({
  id: z.string().uuid(),
  saleId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().positive("La quantité doit être supérieure à 0"),
  unitPrice: z.number().min(0),
  costPrice: z.number().min(0).default(0),
  createdAt: z.string(),
});

export const SaleSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  storeId: z.string().uuid(),
  customerId: z.string().uuid().nullable().optional(),
  userId: z.string().uuid().nullable().optional(),
  totalAmount: z.number().min(0),
  amountPaid: z.number().min(0),
  debtAmount: z.number().min(0).default(0),
  paymentMethod: PaymentMethodSchema,
  status: z.enum(["COMPLETED", "CANCELLED", "PENDING"]).default("COMPLETED"),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  isSynced: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(SaleItemSchema).optional(),
});

export const DebtPaymentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  storeId: z.string().uuid(),
  customerId: z.string().uuid(),
  amount: z.number().positive("Le montant du versement doit être supérieur à 0"),
  paymentMethod: PaymentMethodSchema.default("CASH"),
  notes: z.string().optional(),
  isSynced: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const StockDeltaSchema = z.object({
  productId: z.string().uuid(),
  storeId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  deltaQuantity: z.number(),
  reason: z.enum(["SALE", "RESTOCK", "INVENTORY_CORRECTION"]),
  referenceId: z.string().optional(),
});

export const SyncMutationSchema = z.object({
  id: z.string().uuid(),
  entity: z.enum(["tenant", "user", "store", "product", "customer", "sale", "debt_payment", "subscription"]),
  action: z.enum(["CREATE", "UPDATE", "DELETE", "STOCK_DELTA"]),
  data: z.any(),
  clientTimestamp: z.string(),
});

export const SyncPushRequestSchema = z.object({
  tenantId: z.string().uuid().optional(),
  storeId: z.string().uuid(),
  lastPulledAt: z.string().optional(),
  mutations: z.array(SyncMutationSchema),
});
