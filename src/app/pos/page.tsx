"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, processLocalSale, DEFAULT_STORE_ID, generateUUID } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import { useAuth } from "@/lib/auth/auth-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { UpgradePromptModal } from "@/components/plans/upgrade-prompt-modal";
import type { Product, Customer, CartItem, PaymentMethod, Sale, SaleItem } from "@/lib/shared/types";
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
} from "lucide-react";
import Link from "next/link";

export default function POSPage() {
  const { user, tenant, store: authStore, isAuthenticated, isLoading, plan, planConfig } = useAuth();
  const { formatMoney, currency } = useSync();

  const currentStoreId = authStore?.id || DEFAULT_STORE_ID;
  const currentTenantId = tenant?.id;

  // Filter products, customers and sales strictly by the active store
  const products = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.products
      .filter((p) => p.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  const customers = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.customers
      .filter((c) => c.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  const allSales = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.sales
      .filter((s) => s.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const monthSalesCount = useMemo(() => {
    return allSales.filter((s) => s.createdAt.startsWith(currentMonthStr)).length;
  }, [allSales, currentMonthStr]);

  // Quota Découverte: 100 sales / month
  const isFreeQuotaReached = plan === "FREE" && monthSalesCount >= 100;

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<{ sale: Sale; items: SaleItem[] } | null>(null);

  // New Customer Form State
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [amountPaidInput, setAmountPaidInput] = useState<number>(0);
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

  // If session is loading, show loading skeleton
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement de la caisse Smart POS...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, require 4-digit PIN!
  if (!isAuthenticated) {
    return <PinLockScreen title="Caisse Verrouillée" />;
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) return;

    if (isFreeQuotaReached) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setCashGiven(totalAmount);
    setAmountPaidInput(totalAmount);
    setPaymentMethod("CASH");
    setIsPaymentModalOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    // Check free plan debtor limit
    if (plan === "FREE" && customers.length >= 5) {
      setIsUpgradeModalOpen(true);
      return;
    }

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

  const handleCompleteSale = async () => {
    if (cart.length === 0 || isProcessingSale) return;

    if (isFreeQuotaReached) {
      setIsUpgradeModalOpen(true);
      return;
    }

    const finalAmountPaid = paymentMethod === "CREDIT" ? amountPaidInput : totalAmount;
    const debtAmount = Math.max(0, totalAmount - finalAmountPaid);

    if (debtAmount > 0 && !selectedCustomerId) {
      alert("Veuillez sélectionner ou créer un client pour enregistrer une vente à crédit (dette).");
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
        paymentMethod,
        amountPaid: finalAmountPaid,
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

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const getWhatsAppReceiptUrl = (sale: Sale, items: SaleItem[]) => {
    const cust = customers.find((c) => c.id === sale.customerId);
    const storeName = authStore?.name || tenant?.name || "Kuettu Shop";
    const activity = authStore?.businessType || tenant?.businessType;
    const address = authStore?.address || tenant?.address;
    const storePhone = authStore?.phone || tenant?.phone;
    const storeEmail = authStore?.email || tenant?.email;

    let text = `🧾 *FACTURE / TICKET DE CAISSE*\n`;
    text += `🏬 *${storeName.toUpperCase()}*\n`;
    if (activity) text += `📌 ${activity}\n`;
    if (address) text += `📍 ${address}\n`;
    if (storePhone) text += `📞 ${storePhone}\n`;
    if (storeEmail) text += `✉️ ${storeEmail}\n`;
    text += `--------------------------------\n`;
    text += `N° Facture: ${sale.receiptNumber}\n`;
    text += `Date: ${new Date(sale.createdAt).toLocaleDateString("fr-FR")} à ${new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}\n`;
    text += `Caissier: ${user?.name || "Caisse"}\n`;
    if (cust) text += `Client: ${cust.name}\n`;
    text += `--------------------------------\n`;

    items.forEach((it) => {
      text += `• ${it.productName || "Article"} x${it.quantity} = ${formatMoney(it.quantity * it.unitPrice)}\n`;
    });

    text += `--------------------------------\n`;
    text += `*TOTAL TTC : ${formatMoney(sale.totalAmount)}*\n`;
    text += `Mode de paiement : ${sale.paymentMethod}\n`;
    text += `Montant Payé : ${formatMoney(sale.amountPaid)}\n`;
    if (sale.debtAmount > 0) {
      text += `⚠️ *Reste à payer (Dette) : ${formatMoney(sale.debtAmount)}*\n`;
    }
    text += `--------------------------------\n`;
    text += `Merci pour votre confiance !\n`;
    text += `_kuettu Smart Pro • Système de Caisse & Gestion_`;

    const phone = cust?.phone ? cust.phone.replace(/[^0-9]/g, "") : "";
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden bg-slate-100">
      {/* LEFT: Product Catalog */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-3 lg:p-4">
        {/* Search, Category Filter & Plan Quota Banner */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80 mb-3">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un article en rayon ou scanner code-barre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200/60 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Free Plan Quota Pill (100 sales) */}
            {plan === "FREE" && (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                  isFreeQuotaReached
                    ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                    : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                }`}
                title="Quota de ventes mensuel"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{monthSalesCount}/100 ventes ce mois</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all touch-press ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid with Images */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white rounded-3xl border border-slate-200">
              <ShoppingBag className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">Aucun produit en rayon</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Votre boutique commence avec un inventaire propre. Ajoutez vos premiers articles avec photos pour commencer à vendre.
              </p>
              <Link
                href="/inventory"
                className="mt-4 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Ajouter mes Produits</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-20 lg:pb-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                const isOutOfStock = product.stockQuantity <= 0;
                const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.minStockAlert;

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`relative bg-white rounded-2xl p-2.5 sm:p-3 border transition-all flex flex-col justify-between cursor-pointer select-none touch-press overflow-hidden ${
                      inCart
                        ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20"
                        : "border-slate-200/80 hover:border-blue-300 hover:shadow-md"
                    } ${isOutOfStock ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                  >
                    {/* Top image or category emblem */}
                    <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden mb-2 bg-slate-100 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center justify-center">
                          <Package className="w-8 h-8 stroke-1" />
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mt-1">
                            {product.category}
                          </span>
                        </div>
                      )}

                      {/* Stock Pill floating over image */}
                      <span
                        className={`absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-lg shadow-sm backdrop-blur ${
                          isOutOfStock
                            ? "bg-rose-600 text-white"
                            : isLowStock
                            ? "bg-amber-500 text-white"
                            : "bg-slate-900/70 text-white"
                        }`}
                      >
                        {isOutOfStock ? "Épuisé" : `x${product.stockQuantity}`}
                      </span>

                      {/* Category tag floating top-left */}
                      <span className="absolute top-1.5 left-1.5 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-white/90 text-slate-700 shadow-sm backdrop-blur">
                        {product.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 mb-1.5 leading-snug">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-100">
                      <div className="font-black text-slate-900 text-xs sm:text-sm">
                        {formatMoney(product.unitPrice)}
                      </div>

                      {inCart ? (
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                          {inCart.quantity}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-lg z-20">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">Panier en cours</h2>
            {totalItemsCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItemsCount}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider</span>
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Client (optionnel ou dette)</span>
            </label>
            <button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Nouveau</span>
            </button>
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full p-2 bg-slate-50 rounded-xl text-xs sm:text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Client Comptant (Passager) --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.currentDebtBalance > 0 ? `(Dette: ${formatMoney(c.currentDebtBalance)})` : ""}
              </option>
            ))}
          </select>
          {selectedCustomer && selectedCustomer.currentDebtBalance > 0 && (
            <div className="mt-1.5 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>Dette existante : <b>{formatMoney(selectedCustomer.currentDebtBalance)}</b></span>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-56 lg:max-h-none">
          {cart.length === 0 ? (
            <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-slate-400 text-center">
              <Receipt className="w-8 h-8 stroke-1 text-slate-300 mb-1" />
              <p className="text-xs font-medium">Panier vide</p>
              <p className="text-[11px] text-slate-400">Cliquez sur un article pour l'ajouter</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between gap-2 border border-slate-100"
              >
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {item.product.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-800 text-xs truncate">
                      {item.product.name}
                    </h4>
                    <div className="text-[11px] text-slate-500">
                      {formatMoney(item.unitPrice)} × {item.quantity}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-lg"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-lg"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[65px]">
                    <div className="font-bold text-xs text-slate-900">
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

        {/* Cart Checkout Footer */}
        <div className="p-3 bg-white border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">Net à Payer</span>
            <span className="text-lg font-black text-slate-900">
              {formatMoney(totalAmount)}
            </span>
          </div>

          <button
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all touch-press ${
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

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Règlement de la Vente</h3>
                <p className="text-xs text-slate-500">
                  Total : <span className="font-bold text-blue-600">{formatMoney(totalAmount)}</span>
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-600 block mb-2">
                Mode de Règlement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "CASH", label: "Espèces (Cash)", color: "border-blue-500 bg-blue-50/50 text-blue-700" },
                  { id: "MPESA", label: "M-Pesa", color: "border-red-500 bg-red-50/50 text-red-700" },
                  { id: "AIRTEL_MONEY", label: "Airtel Money", color: "border-rose-600 bg-rose-50/50 text-rose-700" },
                  { id: "ORANGE_MONEY", label: "Orange Money", color: "border-orange-500 bg-orange-50/50 text-orange-700" },
                  { id: "AFRIMONEY", label: "Afrimoney", color: "border-purple-600 bg-purple-50/50 text-purple-700" },
                  { id: "CREDIT", label: "Carnet Dette", color: "border-slate-500 bg-slate-50/50 text-slate-700" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as PaymentMethod);
                      if (m.id !== "CREDIT") setAmountPaidInput(totalAmount);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center touch-press ${
                      paymentMethod === m.id
                        ? `${m.color} ring-2 ring-offset-1`
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "CASH" && (
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-slate-500" />
                    <span>Espèces reçues du client</span>
                  </label>
                  <span className="text-xs text-slate-500">
                    Monnaie à rendre :{" "}
                    <b className={cashGiven >= totalAmount ? "text-blue-600 font-bold" : "text-slate-400"}>
                      {formatMoney(Math.max(0, cashGiven - totalAmount))}
                    </b>
                  </span>
                </div>
                <input
                  type="number"
                  value={cashGiven || ""}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  placeholder={totalAmount.toString()}
                  className="w-full p-2.5 bg-white rounded-xl text-base font-bold text-slate-900 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-2"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(currency === "$" ? [5, 10, 20, 50, 100] : [500, 1000, 5000, 10000, 20000]).map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setCashGiven(bill)}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg shadow-sm touch-press"
                    >
                      {currency === "$" ? `$${bill}` : `${bill.toLocaleString("fr-FR")} FC`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashGiven(totalAmount)}
                    className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg ml-auto"
                  >
                    Montant exact
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === "CREDIT" && (
              <div className="bg-rose-50/70 rounded-2xl p-3.5 border border-rose-200 mb-4">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">Vente à Crédit (Carnet de Dettes)</h4>
                    <p className="text-[11px] text-rose-700">
                      Un acompte peut être versé aujourd'hui. Le solde sera automatiquement ajouté au carnet du client.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Acompte payé aujourd'hui
                    </label>
                    <input
                      type="number"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(Math.max(0, Number(e.target.value)))}
                      className="w-full p-2 bg-white rounded-xl text-sm font-bold text-slate-900 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Reste en dette
                    </label>
                    <div className="p-2 bg-rose-100/60 rounded-xl text-sm font-black text-rose-700 border border-rose-200">
                      {formatMoney(Math.max(0, totalAmount - amountPaidInput))}
                    </div>
                  </div>
                </div>

                {!selectedCustomerId && (
                  <p className="text-[11px] text-rose-600 font-bold mt-2">
                    ⚠️ Veuillez fermer ce modal et choisir un client dans la caisse avant de valider le crédit.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleCompleteSale}
              disabled={isProcessingSale || (paymentMethod === "CREDIT" && !selectedCustomerId)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all touch-press disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isProcessingSale ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Valider la Vente ({formatMoney(totalAmount)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
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
                  placeholder="ex: Mme Awa Kouamé"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
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

      {/* RECEIPT MODAL */}
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
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            )}

            {/* Store Header Info */}
            <div className="font-black text-slate-900 text-sm uppercase tracking-wide">
              {authStore?.name || tenant?.name || "Kuettu SMART POS"}
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
              {(authStore?.email || tenant?.email) && (
                <span>✉️ {authStore?.email || tenant?.email}</span>
              )}
            </div>

            <div className="my-2 border-t border-dashed border-slate-200" />

            <h3 className="font-extrabold text-slate-900 text-base mb-0.5">Facture de Vente</h3>
            <div className="text-[11px] text-slate-500 mb-2.5 flex items-center justify-between px-1">
              <span>N° {completedSale.sale.receiptNumber}</span>
              <span>{new Date(completedSale.sale.createdAt).toLocaleDateString("fr-FR")} {new Date(completedSale.sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>

            {/* Line Items */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left text-xs mb-3 space-y-1.5 font-mono">
              <div className="space-y-1 pb-1.5 border-b border-slate-200">
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                    <span className="truncate max-w-[150px]">{it.productName || "Article"} (x{it.quantity})</span>
                    <span className="font-semibold">{formatMoney(it.quantity * it.unitPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-slate-900 pt-1">
                <span>TOTAL TTC :</span>
                <span className="text-blue-700">{formatMoney(completedSale.sale.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Payé ({completedSale.sale.paymentMethod}) :</span>
                <span>{formatMoney(completedSale.sale.amountPaid)}</span>
              </div>
              {completedSale.sale.debtAmount > 0 && (
                <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-rose-200">
                  <span>Reste Dû (Dette) :</span>
                  <span>{formatMoney(completedSale.sale.debtAmount)}</span>
                </div>
              )}
            </div>

            {/* Footer platform brand */}
            <div className="mb-3 text-[10px] text-slate-400 font-medium">
              Merci pour votre confiance !
              <div className="font-black text-slate-600 tracking-wider uppercase text-[9px] mt-0.5">
                kuettu Smart Pro
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={getWhatsAppReceiptUrl(completedSale.sale, completedSale.items)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Envoyer le reçu sur WhatsApp</span>
              </a>

              <button
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le ticket</span>
              </button>

              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                Passer à la vente suivante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE PROMPT MODAL */}
      <UpgradePromptModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Quota de 100 Ventes Mensuelles Atteint"
        description="Vous avez utilisé vos 100 ventes gratuites pour ce mois. Passez au forfait Commerçant Pro pour débloquer les ventes illimitées, la sauvegarde Cloud et les relances WhatsApp automatiques."
        targetPlan="PRO"
        features={[
          "Ventes et caisse illimitées (sans quota)",
          "Relances WhatsApp illimitées avec modèles personnalisés",
          "Calcul des marges bénéficiaires et bénéfice net",
          "Sauvegarde Cloud automatique continue",
        ]}
      />
    </div>
  );
}
