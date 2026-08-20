"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, processLocalSale, DEFAULT_STORE_ID, generateUUID } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import { useAuth } from "@/lib/auth/auth-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { UpgradePromptModal } from "@/components/plans/upgrade-prompt-modal";
import { HoldOrdersModal } from "@/components/pos/hold-orders-modal";
import { DiscountModal } from "@/components/pos/discount-modal";
import { ProformaInvoiceModal } from "@/components/pos/proforma-invoice-modal";
import { PaymentModal } from "@/components/pos/payment-modal";
import type {
  Product,
  Customer,
  CartItem,
  PaymentMethod,
  PaymentSplit,
  Sale,
  SaleItem,
  HeldOrder,
} from "@/lib/shared/types";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Check,
  ShoppingBag,
  CreditCard,
  UserPlus,
  User,
  CheckCircle2,
  Printer,
  MessageCircle,
  Sparkles,
  AlertTriangle,
  Receipt,
  X,
  Phone,
  Coins,
  PackagePlus,
  Lock,
  Package,
  Image as ImageIcon,
  Tag,
  Clock,
  FileText,
  PauseCircle,
  Utensils,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { printThermalReceipt } from "@/lib/native/native-pos";

export default function POSPage() {
  const { user, tenant, store: authStore, isAuthenticated, isLoading, plan } = useAuth();
  const { formatMoney, currency } = useSync();

  const currentStoreId = authStore?.id || DEFAULT_STORE_ID;

  // 1. Data queries
  const products =
    useLiveQuery(async () => {
      if (!currentStoreId) return [];
      return await db.products.filter((p) => p.storeId === currentStoreId).toArray();
    }, [currentStoreId]) || [];

  const customers =
    useLiveQuery(async () => {
      if (!currentStoreId) return [];
      return await db.customers.filter((c) => c.storeId === currentStoreId).toArray();
    }, [currentStoreId]) || [];

  const allSales =
    useLiveQuery(async () => {
      if (!currentStoreId) return [];
      return await db.sales.filter((s) => s.storeId === currentStoreId).toArray();
    }, [currentStoreId]) || [];

  const heldOrders =
    useLiveQuery(async () => {
      if (!currentStoreId) return [];
      return await db.heldOrders.filter((h) => h.storeId === currentStoreId).toArray();
    }, [currentStoreId]) || [];

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const monthSalesCount = useMemo(() => {
    return allSales.filter((s) => s.createdAt.startsWith(currentMonthStr)).length;
  }, [allSales, currentMonthStr]);

  // Quota Découverte: 100 sales / month
  const isFreeQuotaReached = plan === "FREE" && monthSalesCount >= 100;

  // Cart & Invoice State
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [tableOrLabel, setTableOrLabel] = useState<string>("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState<boolean>(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [isProformaModalOpen, setIsProformaModalOpen] = useState<boolean>(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<{ sale: Sale; items: SaleItem[] } | null>(null);

  // New Customer Form State
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>(["Tous"]);
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === "Tous" || p.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Financial calculations
  const subtotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === "PERCENT") {
      return (subtotalAmount * discountValue) / 100;
    }
    return Math.min(subtotalAmount, discountValue);
  }, [subtotalAmount, discountType, discountValue]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotalAmount - discountAmount);
  }, [subtotalAmount, discountAmount]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: product.unitPrice,
          subtotal: product.unitPrice,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomerId("");
    setTableOrLabel("");
    setDiscountValue(0);
  };

  // Hold orders management
  const handleSaveCurrentAsHold = async (label: string, notes?: string) => {
    if (cart.length === 0) return;

    const cust = customers.find((c) => c.id === selectedCustomerId);
    const newHold: HeldOrder = {
      id: generateUUID(),
      storeId: currentStoreId,
      label,
      customerId: selectedCustomerId || null,
      customerName: cust?.name,
      items: cart,
      subtotalAmount,
      discountAmount,
      discountType,
      discountValue,
      totalAmount,
      notes,
      createdAt: new Date().toISOString(),
    };

    await db.heldOrders.add(newHold);
    clearCart();
  };

  const handleRestoreHeldOrder = async (heldOrder: HeldOrder) => {
    setCart(heldOrder.items);
    setSelectedCustomerId(heldOrder.customerId || "");
    setTableOrLabel(heldOrder.label);
    if (heldOrder.discountValue && heldOrder.discountValue > 0) {
      setDiscountType(heldOrder.discountType || "PERCENT");
      setDiscountValue(heldOrder.discountValue);
    } else {
      setDiscountValue(0);
    }
    await db.heldOrders.delete(heldOrder.id);
  };

  const handleDeleteHeldOrder = async (orderId: string) => {
    await db.heldOrders.delete(orderId);
  };

  // Discount management
  const handleApplyDiscount = (type: "PERCENT" | "FIXED", value: number) => {
    setDiscountType(type);
    setDiscountValue(value);
  };

  const handleRemoveDiscount = () => {
    setDiscountValue(0);
  };

  // Payment Confirmation
  const handleConfirmPayment = async (params: {
    paymentMethod: PaymentMethod;
    amountPaid: number;
    paymentSplits?: PaymentSplit[];
    notes?: string;
  }) => {
    if (cart.length === 0 || isProcessingSale) return;

    if (isFreeQuotaReached) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsProcessingSale(true);
    try {
      const result = await processLocalSale({
        tenantId: tenant?.id,
        storeId: currentStoreId,
        customerId: selectedCustomerId || null,
        userId: user?.id || null,
        items: cart.map((c) => ({
          product: c.product,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
        })),
        paymentMethod: params.paymentMethod,
        paymentSplits: params.paymentSplits,
        amountPaid: params.amountPaid,
        discountAmount,
        discountType: discountValue > 0 ? discountType : undefined,
        discountValue: discountValue > 0 ? discountValue : undefined,
        tableOrLabel: tableOrLabel.trim() || undefined,
        notes: params.notes,
      });

      setCompletedSale(result);
      setIsPaymentModalOpen(false);
      clearCart();
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement de la vente: " + err.message);
    } finally {
      setIsProcessingSale(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    const newId = generateUUID();
    const newCust: Customer = {
      id: newId,
      tenantId: tenant?.id,
      storeId: currentStoreId,
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || undefined,
      currentDebtBalance: 0,
      isSynced: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.customers.add(newCust);
    setSelectedCustomerId(newId);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setIsNewCustomerModalOpen(false);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Printing & WhatsApp Receipt Helpers
  const handlePrintSaleReceipt = async (sale: Sale, items: SaleItem[]) => {
    const storeName = authStore?.name || tenant?.name || "KUETTU GLOBAL POS";
    const cust = customers.find((c) => c.id === sale.customerId);

    const printLines = [
      storeName,
      authStore?.address || "Kinshasa / RDC",
      `Tel: ${authStore?.phone || tenant?.phone || ""}`,
      "--------------------------------",
      "*** TICKET DE CAISSE ***",
      `Facture N: ${sale.receiptNumber}`,
      `Date: ${new Date(sale.createdAt).toLocaleDateString("fr-FR")} ${new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      sale.tableOrLabel ? `Table/Ref: ${sale.tableOrLabel}` : "",
      cust ? `Client: ${cust.name}` : "",
      `Caissier: ${user?.name || "Caisse"}`,
      "--------------------------------",
      ...items.map(
        (it) =>
          `${it.productName || "Article"} x${it.quantity} = ${formatMoney(it.quantity * it.unitPrice)}`
      ),
      "--------------------------------",
      sale.subtotalAmount ? `Sous-total: ${formatMoney(sale.subtotalAmount)}` : "",
      sale.discountAmount && sale.discountAmount > 0
        ? `Remise: -${formatMoney(sale.discountAmount)}`
        : "",
      `TOTAL PAYE: ${formatMoney(sale.amountPaid)}`,
      sale.debtAmount > 0 ? `Reste Dette: ${formatMoney(sale.debtAmount)}` : "",
      "--------------------------------",
      sale.paymentSplits && sale.paymentSplits.length > 0
        ? `Reglement: ${sale.paymentSplits.map((s) => `${s.method} (${formatMoney(s.amount)})`).join(", ")}`
        : `Reglement: ${sale.paymentMethod}`,
      "Merci de votre visite !",
      "https://globalpos.app",
    ].filter(Boolean);

    const printed = await printThermalReceipt(printLines);
    if (!printed && typeof window !== "undefined") {
      window.print();
    }
  };

  const getWhatsAppReceiptUrl = (sale: Sale, items: SaleItem[]) => {
    const cust = customers.find((c) => c.id === sale.customerId);
    const storeName = authStore?.name || tenant?.name || "Kuettu Global POS";

    let text = `🧾 *FACTURE / TICKET DE CAISSE*\n`;
    text += `🏬 *${storeName.toUpperCase()}*\n`;
    if (authStore?.address) text += `📍 ${authStore.address}\n`;
    if (authStore?.phone) text += `📞 ${authStore.phone}\n`;
    text += `--------------------------------\n`;
    text += `N° Facture: ${sale.receiptNumber}\n`;
    if (sale.tableOrLabel) text += `📍 Table / Ref: ${sale.tableOrLabel}\n`;
    text += `Date: ${new Date(sale.createdAt).toLocaleDateString("fr-FR")} à ${new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}\n`;
    text += `Caissier: ${user?.name || "Caisse"}\n`;
    if (cust) text += `Client: ${cust.name}\n`;
    text += `--------------------------------\n`;

    items.forEach((it) => {
      text += `• ${it.productName || "Article"} x${it.quantity} = ${formatMoney(it.quantity * it.unitPrice)}\n`;
    });

    if (sale.subtotalAmount && sale.subtotalAmount !== sale.totalAmount) {
      text += `\nSous-total Brut : ${formatMoney(sale.subtotalAmount)}\n`;
      if (sale.discountAmount && sale.discountAmount > 0) {
        text += `Remise déduite : -${formatMoney(sale.discountAmount)}\n`;
      }
    }

    text += `*TOTAL NET : ${formatMoney(sale.totalAmount)}*\n`;
    text += `Montant Réglé : ${formatMoney(sale.amountPaid)}\n`;

    if (sale.debtAmount > 0) {
      text += `⚠️ *Reste en Dette : ${formatMoney(sale.debtAmount)}*\n`;
    }

    text += `\n_Merci pour votre confiance !_`;

    const encoded = encodeURIComponent(text);
    const phoneToUse = cust?.phone?.replace(/\D/g, "") || "";
    return `https://wa.me/${phoneToUse}?text=${encoded}`;
  };

  // If loading or not authenticated
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement de la caisse Kuettu Global POS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen title="Caisse Verrouillée" />;
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden bg-slate-100">
      {/* ========================================================================= */}
      {/* LEFT: Product Catalog Grid                                               */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Filter & Search Bar */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs z-10">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher article, code-barres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl text-xs sm:text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-press ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
              <Package className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">Aucun article trouvé</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Ajoutez des produits dans votre inventaire pour commencer à vendre.
              </p>
              <Link
                href="/inventory"
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                + Ajouter des Articles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3">
              {filteredProducts.map((p) => {
                const inCart = cart.find((item) => item.product.id === p.id);
                const isOutOfStock = p.stockQuantity <= 0;

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`bg-white rounded-2xl p-2.5 sm:p-3 border text-left flex flex-col justify-between transition-all relative overflow-hidden shadow-2xs hover:shadow-md touch-press group ${
                      inCart
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-slate-200/80 hover:border-blue-300"
                    }`}
                  >
                    {/* In-cart quantity badge */}
                    {inCart && (
                      <span className="absolute top-2 right-2 z-10 w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                        {inCart.quantity}
                      </span>
                    )}

                    {/* Product Image / Icon */}
                    <div className="w-full aspect-square rounded-xl bg-slate-50 border border-slate-100 mb-2 overflow-hidden flex items-center justify-center relative">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-300" />
                      )}

                      {/* Stock level badge */}
                      <span
                        className={`absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          isOutOfStock
                            ? "bg-rose-500 text-white"
                            : p.stockQuantity <= p.minStockAlert
                            ? "bg-amber-500 text-white"
                            : "bg-black/60 text-white backdrop-blur-xs"
                        }`}
                      >
                        {isOutOfStock ? "Épuisé" : `Stock: ${p.stockQuantity}`}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">
                          {p.name}
                        </h3>
                        {p.category && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {p.category}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="font-extrabold text-blue-700 text-xs sm:text-sm">
                          {formatMoney(p.unitPrice)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: Modern Cart & Flexible Invoicing Checkout Panel                   */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[400px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-xl z-20">
        {/* Cart Header */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <h2 className="font-extrabold text-slate-900 text-sm">Panier & Facture</h2>
            {totalItemsCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {totalItemsCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Hold orders drawer button with badge */}
            <button
              onClick={() => setIsHoldModalOpen(true)}
              className="p-1.5 px-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1 transition-all"
              title="Gérer les tickets et tables en attente"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hold</span>
              {heldOrders.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center">
                  {heldOrders.length}
                </span>
              )}
            </button>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Vider le panier"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table / Reference / Customer Selector */}
        <div className="p-3 border-b border-slate-100 bg-white space-y-2">
          {/* Table / Ref Banner (if active) */}
          {tableOrLabel ? (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                <span>Emplacement : <b>{tableOrLabel}</b></span>
              </div>
              <button
                onClick={() => setTableOrLabel("")}
                className="text-[10px] text-amber-700 hover:text-rose-600 font-bold"
              >
                Retirer
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Table / Note (ex: Table 4, Terrasse)..."
                value={tableOrLabel}
                onChange={(e) => setTableOrLabel(e.target.value)}
                className="w-full p-1.5 px-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Client (optionnel / carnet dette)</span>
              </label>
              <button
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Nouveau</span>
              </button>
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-2 bg-slate-50 rounded-xl text-xs font-semibold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Client Comptant (Passager) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.currentDebtBalance > 0 ? `(Dette: ${formatMoney(c.currentDebtBalance)})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-56 lg:max-h-none">
          {cart.length === 0 ? (
            <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-slate-400 text-center py-6">
              <Receipt className="w-8 h-8 stroke-1 text-slate-300 mb-1" />
              <p className="text-xs font-bold text-slate-700">Panier vide</p>
              <p className="text-[11px] text-slate-400">Touchez un article pour constituer la facture</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-slate-50 rounded-2xl p-2.5 flex items-center justify-between gap-2 border border-slate-100 shadow-2xs"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate">
                    {item.product.name}
                  </h4>
                  <div className="text-[11px] text-slate-500">
                    {formatMoney(item.unitPrice)} × {item.quantity}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-xl"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-black text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-xl"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[65px]">
                    <div className="font-black text-xs text-slate-900">
                      {formatMoney(item.subtotal)}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Financial Summary & Action Toolbar */}
        <div className="p-3.5 bg-white border-t border-slate-200 space-y-3">
          {/* Subtotal, Discount & Total Net */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Sous-total Brut :</span>
              <span className="font-semibold">{formatMoney(subtotalAmount)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-bold">
                <span>
                  Remise ({discountType === "PERCENT" ? `${discountValue}%` : "Fixe"}) :
                </span>
                <span>- {formatMoney(discountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-xs text-slate-700 font-bold">Net à Payer :</span>
              <span className="text-lg font-black text-slate-900">
                {formatMoney(totalAmount)}
              </span>
            </div>
          </div>

          {/* Invoicing Action Tools (Hold, Proforma, Discount) */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Hold Button */}
            <button
              onClick={() => setIsHoldModalOpen(true)}
              disabled={cart.length === 0}
              className="py-2 px-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mettre la commande en attente (Hold / Table)"
            >
              <PauseCircle className="w-4 h-4 text-amber-600" />
              <span>Hold (Pause)</span>
            </button>

            {/* Proforma / Addition Pre-bill Button */}
            <button
              onClick={() => setIsProformaModalOpen(true)}
              disabled={cart.length === 0}
              className="py-2 px-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Imprimer ou présenter l'addition provisoire au client"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Addition Note</span>
            </button>

            {/* Discount Button */}
            <button
              onClick={() => setIsDiscountModalOpen(true)}
              disabled={cart.length === 0}
              className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                discountAmount > 0
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                  : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
              }`}
              title="Appliquer une réduction"
            >
              <Tag className="w-4 h-4" />
              <span>
                {discountAmount > 0
                  ? `-${discountType === "PERCENT" ? `${discountValue}%` : formatMoney(discountAmount)}`
                  : "Remise"}
              </span>
            </button>
          </div>

          {/* Primary Checkout Button */}
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            disabled={cart.length === 0}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all touch-press ${
              cart.length > 0
                ? isFreeQuotaReached
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"
                : "bg-slate-300 cursor-not-allowed shadow-none"
            }`}
          >
            {isFreeQuotaReached ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Quota 100 ventes atteint (Passer à Pro)</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Encaisser ({formatMoney(totalAmount)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* 1. HOLD ORDERS MODAL */}
      <HoldOrdersModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
        heldOrders={heldOrders}
        onRestoreHeldOrder={handleRestoreHeldOrder}
        onDeleteHeldOrder={handleDeleteHeldOrder}
        onSaveCurrentAsHold={handleSaveCurrentAsHold}
        canSaveCurrent={cart.length > 0}
        formatMoney={formatMoney}
        selectedCustomer={selectedCustomer}
      />

      {/* 2. DISCOUNT MODAL */}
      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        subtotalAmount={subtotalAmount}
        currentDiscountType={discountType}
        currentDiscountValue={discountValue}
        onApplyDiscount={handleApplyDiscount}
        onRemoveDiscount={handleRemoveDiscount}
        formatMoney={formatMoney}
        currency={currency}
      />

      {/* 3. PROFORMA / ADDITION INVOICE MODAL */}
      <ProformaInvoiceModal
        isOpen={isProformaModalOpen}
        onClose={() => setIsProformaModalOpen(false)}
        items={cart}
        subtotalAmount={subtotalAmount}
        discountAmount={discountAmount}
        totalAmount={totalAmount}
        tableOrLabel={tableOrLabel}
        selectedCustomer={selectedCustomer}
        store={authStore}
        tenant={tenant}
        cashierName={user?.name}
        formatMoney={formatMoney}
        currency={currency}
      />

      {/* 4. ENHANCED PAYMENT MODAL (SINGLE + SPLIT) */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        subtotalAmount={subtotalAmount}
        discountAmount={discountAmount}
        totalAmount={totalAmount}
        selectedCustomer={selectedCustomer}
        formatMoney={formatMoney}
        currency={currency}
        isProcessing={isProcessingSale}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* 5. NEW CUSTOMER MODAL */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomer}
            className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Ajouter un Client</h3>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Nom complet / Surnom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: M. Jean-Paul Bakayoko"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Numéro WhatsApp / Téléphone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="ex: +243 81 234 56 78"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. COMPLETED SALE RECEIPT MODAL */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-white w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl p-5 shadow-2xl border border-slate-100 text-center">
            {authStore?.logoUrl ? (
              <img
                src={authStore.logoUrl}
                alt="Logo Boutique"
                className="w-14 h-14 rounded-2xl object-cover mx-auto mb-2 border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            )}

            {/* Store Header Info */}
            <div className="font-black text-slate-900 text-sm uppercase tracking-wide">
              {authStore?.name || tenant?.name || "Kuettu Global POS"}
            </div>
            {(authStore?.businessType || tenant?.businessType) && (
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                {authStore?.businessType || tenant?.businessType}
              </div>
            )}
            {(authStore?.address || tenant?.address) && (
              <div className="text-[10px] text-slate-500 mt-0.5">
                📍 {authStore?.address || tenant?.address}
              </div>
            )}
            <div className="text-[10px] text-slate-500 flex items-center justify-center gap-2 mt-0.5">
              {(authStore?.phone || tenant?.phone) && (
                <span>📞 {authStore?.phone || tenant?.phone}</span>
              )}
            </div>

            <div className="my-2 border-t border-dashed border-slate-200" />

            <h3 className="font-extrabold text-slate-900 text-base mb-0.5">Ticket de Vente</h3>
            <div className="text-[11px] text-slate-500 mb-2.5 flex items-center justify-between px-1">
              <span>N° {completedSale.sale.receiptNumber}</span>
              <span>
                {new Date(completedSale.sale.createdAt).toLocaleDateString("fr-FR")}{" "}
                {new Date(completedSale.sale.createdAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {completedSale.sale.tableOrLabel && (
              <div className="mb-2 text-xs font-bold text-amber-800 bg-amber-50 py-1 px-2 rounded-lg border border-amber-200">
                📍 Table / Ref : {completedSale.sale.tableOrLabel}
              </div>
            )}

            {/* Line Items */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left text-xs mb-3 space-y-1.5 font-mono">
              <div className="space-y-1 pb-1.5 border-b border-slate-200">
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                    <span className="truncate max-w-[150px]">
                      {it.productName || "Article"} (x{it.quantity})
                    </span>
                    <span className="font-semibold">{formatMoney(it.quantity * it.unitPrice)}</span>
                  </div>
                ))}
              </div>

              {completedSale.sale.subtotalAmount &&
                completedSale.sale.subtotalAmount !== completedSale.sale.totalAmount && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Sous-total Brut :</span>
                    <span>{formatMoney(completedSale.sale.subtotalAmount)}</span>
                  </div>
                )}

              {completedSale.sale.discountAmount && completedSale.sale.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold text-[11px]">
                  <span>Remise déduite :</span>
                  <span>- {formatMoney(completedSale.sale.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL NET :</span>
                <span className="text-blue-700">{formatMoney(completedSale.sale.totalAmount)}</span>
              </div>

              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Montant Réglé :</span>
                <span className="font-bold">{formatMoney(completedSale.sale.amountPaid)}</span>
              </div>

              {/* Payment Splits Detail */}
              {completedSale.sale.paymentSplits && completedSale.sale.paymentSplits.length > 0 && (
                <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-600 space-y-0.5">
                  <span className="font-bold block text-slate-700">Détail des règlements :</span>
                  {completedSale.sale.paymentSplits.map((split, i) => (
                    <div key={i} className="flex justify-between pl-1">
                      <span>• {split.method} :</span>
                      <span>{formatMoney(split.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {completedSale.sale.debtAmount > 0 && (
                <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-rose-200">
                  <span>Reste Dû (Dette) :</span>
                  <span>{formatMoney(completedSale.sale.debtAmount)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <a
                href={getWhatsAppReceiptUrl(completedSale.sale, completedSale.items)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Envoyer le reçu sur WhatsApp</span>
              </a>

              <button
                onClick={() => handlePrintSaleReceipt(completedSale.sale, completedSale.items)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-slate-900/20"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le ticket</span>
              </button>

              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Passer à la vente suivante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. UPGRADE PROMPT MODAL */}
      <UpgradePromptModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Quota de 100 Ventes Mensuelles Atteint"
        description="Vous avez utilisé vos 100 ventes gratuites pour ce mois. Passez au forfait Commerçant Pro pour débloquer les ventes illimitées, la gestion multi-caisses et les relances WhatsApp automatiques."
        targetPlan="PRO"
        features={[
          "Ventes et caisse illimitées (sans quota)",
          "Gestion des additions, remises et paiements fractionnés",
          "Relances WhatsApp illimitées avec modèles personnalisés",
          "Sauvegarde Cloud automatique continue",
        ]}
      />
    </div>
  );
}
