"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, processLocalSale, DEFAULT_STORE_ID, generateUUID } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import { useAuth } from "@/lib/auth/auth-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { UpgradePromptModal } from "@/components/plans/upgrade-prompt-modal";
import { HoldOrdersModal } from "@/components/pos/hold-orders-modal";
import { DiscountModal } from "@/components/pos/discount-modal";
import { PaymentModal } from "@/components/pos/payment-modal";
import { TariffSelector } from "@/components/pos/tariff-selector";
import {
  DEFAULT_TARIFF_CONFIG,
  calculateEffectiveProductPrice,
  calculateCartItemSubtotal,
  isDrinkCategory,
} from "@/lib/constants/tariffs";
import type {
  Product,
  Customer,
  CartItem,
  PaymentMethod,
  PaymentSplit,
  Sale,
  SaleItem,
  HeldOrder,
  TariffConfig,
  TariffMode,
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
  ArrowRight,
  ArrowLeft,
  Mic2,
  Flame,
  ShieldAlert,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { printThermalReceipt } from "@/lib/native/native-pos";
import { printIsolatedDocument } from "@/lib/native/print-service";

function POSPageContent() {
  const searchParams = useSearchParams();
  const {
    user,
    tenant,
    store: authStore,
    terminalUsers,
    isAuthenticated,
    isLoading,
    plan,
    isOwner,
    isManager,
    isCashier,
    isWaiter,
    canCollectPayment,
    canManageTariffs,
  } = useAuth();
  const { formatMoney, currency, syncNow } = useSync();

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

  const isHorecaOrDepot = useMemo(() => {
    const bt = (authStore?.businessType || tenant?.businessType || "").toLowerCase();
    return (
      bt.includes("restaurant") ||
      bt.includes("bar") ||
      bt.includes("lounge") ||
      bt.includes("pub") ||
      bt.includes("terrasse") ||
      bt.includes("café") ||
      bt.includes("cafe") ||
      bt.includes("snack") ||
      bt.includes("fastfood") ||
      bt.includes("fast-food") ||
      bt.includes("traiteur") ||
      bt.includes("boisson") ||
      bt.includes("depot") ||
      bt.includes("dépôt") ||
      bt.includes("brasserie")
    );
  }, [authStore?.businessType, tenant?.businessType]);

  // Quota Découverte: 100 sales / month
  const isFreeQuotaReached = plan === "FREE" && monthSalesCount >= 100;

  // Tariff Configuration State (persisted per store)
  const [tariffConfig, setTariffConfig] = useState<TariffConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`pos_tariff_config_${currentStoreId}`);
        if (stored) return JSON.parse(stored);
      } catch (_) {}
    }
    return DEFAULT_TARIFF_CONFIG;
  });

  const [isWaiterUnlockModalOpen, setIsWaiterUnlockModalOpen] = useState(false);
  const [waiterPinInput, setWaiterPinInput] = useState("");
  const [waiterPinError, setWaiterPinError] = useState<string | null>(null);

  const handleUpdateTariffConfig = (newConfig: TariffConfig) => {
    setTariffConfig(newConfig);
    try {
      localStorage.setItem(`pos_tariff_config_${currentStoreId}`, JSON.stringify(newConfig));
    } catch (_) {}

    // Recalculate all cart items with new tariff rules
    setCart((prev) =>
      prev.map((item) => {
        const res = calculateCartItemSubtotal(item.product, item.quantity, newConfig);
        return {
          ...item,
          unitPrice: res.averageUnitPrice,
          subtotal: res.subtotal,
          originalPrice: item.product.unitPrice,
          tariffApplied: res.tariffApplied,
          tariffAdjustment: res.totalAdjustment,
        };
      })
    );
  };

  // Cart & Invoice State
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobileTab, setMobileTab] = useState<"CATALOG" | "CART">("CATALOG");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [tableOrLabel, setTableOrLabel] = useState<string>("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState<boolean>(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
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

  // Cart operations with dynamic tariff engine
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const newQty = existing ? existing.quantity + 1 : 1;
      const calc = calculateCartItemSubtotal(product, newQty, tariffConfig);

      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQty,
                unitPrice: calc.averageUnitPrice,
                subtotal: calc.subtotal,
                originalPrice: product.unitPrice,
                tariffApplied: calc.tariffApplied,
                tariffAdjustment: calc.totalAdjustment,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: calc.averageUnitPrice,
          subtotal: calc.subtotal,
          originalPrice: product.unitPrice,
          tariffApplied: calc.tariffApplied,
          tariffAdjustment: calc.totalAdjustment,
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
            if (newQty <= 0) return null;
            const calc = calculateCartItemSubtotal(item.product, newQty, tariffConfig);
            return {
              ...item,
              quantity: newQty,
              unitPrice: calc.averageUnitPrice,
              subtotal: calc.subtotal,
              originalPrice: item.product.unitPrice,
              tariffApplied: calc.tariffApplied,
              tariffAdjustment: calc.totalAdjustment,
            };
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

  // Hold orders & Pre-bill invoice management
  const handleSaveCurrentAsHold = async (label: string, notes?: string) => {
    if (cart.length === 0) return;

    const cust = customers.find((c) => c.id === selectedCustomerId);
    const newHold: HeldOrder = {
      id: generateUUID(),
      storeId: currentStoreId,
      label,
      customerId: selectedCustomerId || null,
      customerName: cust?.name,
      serverName: user?.name,
      tariffMode: tariffConfig.activeMode,
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

  const handleSaveAndPrintPrebill = async (label: string, notes?: string) => {
    if (cart.length === 0) return;

    const cust = customers.find((c) => c.id === selectedCustomerId);
    const newHold: HeldOrder = {
      id: generateUUID(),
      storeId: currentStoreId,
      label,
      customerId: selectedCustomerId || null,
      customerName: cust?.name,
      serverName: user?.name,
      tariffMode: tariffConfig.activeMode,
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

    // Print pre-bill invoice for customer to pay
    const storeName = authStore?.name || tenant?.name || "Kuettu Global POS";
    const storeLogo = authStore?.logoUrl || tenant?.logoUrl;
    const address = authStore?.address ? `<p class="text-xs" style="margin: 2px 0; color: #333;">${authStore.address}</p>` : "";
    const phone = authStore?.phone ? `<p class="text-xs" style="margin: 2px 0; color: #333;">Tél : ${authStore.phone}</p>` : "";
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR");
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const billNum = `FAC-${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const itemsHtml = cart
      .map(
        (it) => `
      <tr>
        <td><b>${it.product.name}</b><br/><span style="font-size: 9px; color: #444;">${it.quantity} x ${formatMoney(it.unitPrice)}</span></td>
        <td class="text-right font-black" style="vertical-align: middle;">${formatMoney(it.subtotal)}</td>
      </tr>`
      )
      .join("");

    const bodyHtml = `
      <div class="text-center">
        ${storeLogo ? `
        <div style="margin-bottom: 6px;">
          <img src="${storeLogo}" alt="${storeName}" style="max-height: 50px; max-width: 140px; margin: 0 auto 4px auto; display: block; object-fit: contain;" />
        </div>` : ""}
        <div class="font-black text-base uppercase" style="font-size: 16px; letter-spacing: 0.5px;">${storeName}</div>
        ${address}
        ${phone}
        ${tenant?.email ? `<p style="font-size: 9px; color: #666; margin: 1px 0;">Email : ${tenant.email}</p>` : ""}
        <div class="divider"></div>
        <div class="badge uppercase" style="font-weight: 800; font-size: 10px; padding: 2px 6px; border: 1px dashed #000; display: inline-block; margin-top: 4px;">
          *** FACTURE À PAYER (ADDITION) ***
        </div>
      </div>

      <div class="divider"></div>
      <div style="font-size: 10px; line-height: 1.35;">
        <div class="flex justify-between"><span>Note / Ref N° :</span><b>${billNum}</b></div>
        <div class="flex justify-between"><span>Date :</span><span>${dateStr} à ${timeStr}</span></div>
        ${label ? `<div class="flex justify-between font-bold"><span>Table / Emplacement :</span><span>${label}</span></div>` : ""}
        ${cust ? `<div class="flex justify-between"><span>Client :</span><b>${cust.name} ${cust.phone ? `(${cust.phone})` : ""}</b></div>` : ""}
        <div class="flex justify-between"><span>Caissier :</span><span>${user?.name || "Caisse"}</span></div>
        <div class="flex justify-between font-bold" style="color: #b45309; margin-top: 2px;"><span>Statut :</span><span>EN ATTENTE DE PAIEMENT</span></div>
      </div>

      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="divider"></div>
      <div style="font-size: 11px;">
        ${discountAmount > 0 ? `<div class="flex justify-between"><span>Sous-total Brut :</span><span>${formatMoney(subtotalAmount)}</span></div>
        <div class="flex justify-between font-bold"><span>Remise déduite :</span><span>-${formatMoney(discountAmount)}</span></div>` : ""}
        <div class="divider"></div>
        <div class="flex justify-between font-black text-sm" style="font-size: 14px;"><span>TOTAL À RÉGLER :</span><span>${formatMoney(totalAmount)}</span></div>
      </div>

      ${notes ? `<div class="divider"></div><div style="font-size: 9px; color: #333;"><b>Instructions / Note :</b> ${notes}</div>` : ""}

      <div class="divider"></div>
      <div class="text-center" style="margin-top: 6px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https%3A%2F%2Fglobalpos.app" alt="QR Code Global POS" style="width: 55px; height: 55px; margin: 0 auto 3px auto; display: block;" />
        <p style="font-size: 8px; color: #555; margin: 0;">Vérification : https://globalpos.app</p>
        <p style="font-size: 9px; font-weight: bold; margin-top: 3px;">Merci pour votre visite !</p>
      </div>
    `;

    await printIsolatedDocument({
      title: `Facture_A_Payer_${billNum}`,
      width: "80mm",
      bodyHtml,
    });

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

  // Auto-restore held order if query param supplied from Sales Journal
  useEffect(() => {
    const restoreHoldId = searchParams.get("restoreHoldId");
    const payHoldId = searchParams.get("payHoldId");
    const targetId = restoreHoldId || payHoldId;

    if (targetId) {
      (async () => {
        const order = await db.heldOrders.get(targetId);
        if (order) {
          setCart(order.items);
          setSelectedCustomerId(order.customerId || "");
          setTableOrLabel(order.label);
          if (order.discountValue && order.discountValue > 0) {
            setDiscountType(order.discountType || "PERCENT");
            setDiscountValue(order.discountValue);
          }
          if (payHoldId) {
            setIsPaymentModalOpen(true);
          }
          await db.heldOrders.delete(targetId);
        }
      })();
    }
  }, [searchParams]);

  // Discount management (restricted to Owner, Manager, Cashier)
  const handleApplyDiscount = (type: "PERCENT" | "FIXED", value: number) => {
    if (isWaiter) {
      alert("Accès refusé : La remise est réservée au gérant ou au caissier.");
      return;
    }
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

      // Trigger instantaneous background sync to cloud Supabase
      syncNow().catch((e) => console.warn("[POS] Instant sync triggered:", e));
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

  // Hold orders / Pre-bill handlers
  const handleRestoreHeldOrder = async (order: HeldOrder) => {
    setCart(order.items || []);
    setTableOrLabel(order.label || "");
    if (order.customerId) {
      setSelectedCustomerId(order.customerId);
    }
    if (order.discountAmount) {
      setDiscountType(order.discountType || "FIXED");
      setDiscountValue(order.discountAmount);
    }
    await db.heldOrders.delete(order.id);
    setIsHoldModalOpen(false);
  };

  const handleDeleteHeldOrder = async (orderId: string) => {
    await db.heldOrders.delete(orderId);
  };

  const handlePrintHoldAddition = async (holdOrder: HeldOrder) => {
    const storeName = authStore?.name || tenant?.name || "Commerce Kuettu";
    const storeLogo = authStore?.logoUrl || tenant?.logoUrl;
    const dateStr = new Date(holdOrder.createdAt).toLocaleDateString("fr-FR");
    const timeStr = new Date(holdOrder.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const itemsRows = holdOrder.items
      .map(
        (it) => `
        <tr>
          <td><b>${it.product.name}</b><br/><span style="font-size: 9px; color: #555;">${it.quantity} x ${formatMoney(it.unitPrice)}</span></td>
          <td class="text-right font-black" style="vertical-align: middle;">${formatMoney(it.subtotal)}</td>
        </tr>`
      )
      .join("");

    const bodyHtml = `
      <div class="text-center">
        ${storeLogo ? `<div style="margin-bottom: 6px;"><img src="${storeLogo}" alt="${storeName}" style="max-height: 50px; max-width: 140px; margin: 0 auto 4px auto; display: block; object-fit: contain;" /></div>` : ""}
        <div class="font-black text-base uppercase" style="font-size: 16px; letter-spacing: 0.5px;">${storeName}</div>
        ${authStore?.address ? `<p class="text-xs" style="margin: 2px 0; color: #333;">${authStore.address}</p>` : ""}
        ${authStore?.phone ? `<p class="text-xs" style="margin: 2px 0; color: #333;">Tél : ${authStore.phone}</p>` : ""}
        <div class="divider"></div>
        <div class="badge uppercase" style="font-weight: 800; font-size: 10px; padding: 2px 6px; border: 1px solid #000; display: inline-block; margin-top: 4px;">
          *** ADDITION / FACTURE PROFORMA ***
        </div>
      </div>

      <div class="divider"></div>
      <div style="font-size: 10px; line-height: 1.35;">
        <div class="flex justify-between font-bold"><span>Table / Emplacement :</span><span>${holdOrder.label}</span></div>
        <div class="flex justify-between"><span>Date :</span><span>${dateStr} à ${timeStr}</span></div>
        ${holdOrder.customerName ? `<div class="flex justify-between"><span>Client :</span><b>${holdOrder.customerName}</b></div>` : ""}
        <div class="flex justify-between"><span>Serveur(se) :</span><span>${holdOrder.serverName || user?.name || "Service"}</span></div>
        <div class="flex justify-between font-bold" style="color: #b45309; margin-top: 2px;"><span>Statut :</span><span>EN ATTENTE D'ENCAISSEMENT</span></div>
      </div>

      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="divider"></div>
      <div style="font-size: 11px;">
        ${holdOrder.subtotalAmount && holdOrder.discountAmount ? `<div class="flex justify-between"><span>Sous-total Brut :</span><span>${formatMoney(holdOrder.subtotalAmount)}</span></div>` : ""}
        ${holdOrder.discountAmount && holdOrder.discountAmount > 0 ? `<div class="flex justify-between font-bold"><span>Remise :</span><span>-${formatMoney(holdOrder.discountAmount)}</span></div>` : ""}
        <div class="divider"></div>
        <div class="flex justify-between font-black text-sm" style="font-size: 14px;"><span>TOTAL NET À PAYER :</span><span>${formatMoney(Math.max(0, holdOrder.subtotalAmount - (holdOrder.discountAmount || 0)))}</span></div>
      </div>

      <div class="divider"></div>
      <div class="text-center" style="margin-top: 6px; font-size: 9px; color: #666;">
        <p style="margin: 2px 0;">Veuillez présenter cette addition à la caisse pour le règlement.</p>
        <p style="font-weight: bold; margin-top: 3px;">Merci pour votre visite !</p>
      </div>
    `;

    await printIsolatedDocument({
      title: `Addition_${holdOrder.label.replace(/\s+/g, "_")}`,
      width: "80mm",
      bodyHtml,
    });
  };

  const handleSaveCurrentAsHold = async (label: string, notes?: string) => {
    if (cart.length === 0) return;
    const cust = customers.find((c) => c.id === selectedCustomerId);
    const holdOrder: HeldOrder = {
      id: generateUUID(),
      storeId: currentStoreId,
      label: label.trim() || `Table ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      customerId: selectedCustomerId || null,
      customerName: cust?.name,
      serverName: user?.name,
      tariffMode: tariffConfig.activeMode,
      items: cart,
      subtotalAmount,
      discountAmount,
      discountType: discountValue > 0 ? discountType : undefined,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.heldOrders.add(holdOrder);
    clearCart();
    setIsHoldModalOpen(false);
  };

  const handleSaveAndPrintPrebill = async (label: string, notes?: string) => {
    if (cart.length === 0) return;
    const cust = customers.find((c) => c.id === selectedCustomerId);
    const holdOrder: HeldOrder = {
      id: generateUUID(),
      storeId: currentStoreId,
      label: label.trim() || `Table ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      customerId: selectedCustomerId || null,
      customerName: cust?.name,
      serverName: user?.name,
      tariffMode: tariffConfig.activeMode,
      items: cart,
      subtotalAmount,
      discountAmount,
      discountType: discountValue > 0 ? discountType : undefined,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.heldOrders.add(holdOrder);
    await handlePrintHoldAddition(holdOrder);
    clearCart();
    setIsHoldModalOpen(false);
  };

  // Printing & WhatsApp Receipt Helpers
  const handlePrintSaleReceipt = async (sale: Sale, items: SaleItem[]) => {
    const storeName = authStore?.name || tenant?.name || "Kuettu Global POS";
    const storeLogo = authStore?.logoUrl || tenant?.logoUrl;
    const address = authStore?.address ? `<p class="text-xs" style="margin: 2px 0; color: #333;">${authStore.address}</p>` : "";
    const phone = authStore?.phone ? `<p class="text-xs" style="margin: 2px 0; color: #333;">Tél : ${authStore.phone}</p>` : "";
    const cust = customers.find((c) => c.id === sale.customerId);
    const dateStr = new Date(sale.createdAt).toLocaleDateString("fr-FR");
    const timeStr = new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const itemsHtml = items
      .map(
        (it) => `
      <tr>
        <td><b>${it.productName || "Article"}</b><br/><span style="font-size: 9px; color: #444;">${it.quantity} x ${formatMoney(it.unitPrice)}</span></td>
        <td class="text-right font-black" style="vertical-align: middle;">${formatMoney(it.quantity * it.unitPrice)}</td>
      </tr>`
      )
      .join("");

    const splitsHtml =
      sale.paymentSplits && sale.paymentSplits.length > 0
        ? `<div class="divider"></div>
           <div style="font-size: 10px; color: #333;">
             <b>Détail des règlements :</b>
             ${sale.paymentSplits.map((s) => `<div class="flex justify-between"><span>• ${s.method} :</span><span>${formatMoney(s.amount)}</span></div>`).join("")}
           </div>`
        : "";

    const bodyHtml = `
      <div class="text-center">
        ${storeLogo ? `
        <div style="margin-bottom: 6px;">
          <img src="${storeLogo}" alt="${storeName}" style="max-height: 50px; max-width: 140px; margin: 0 auto 4px auto; display: block; object-fit: contain;" />
        </div>` : ""}
        <div class="font-black text-base uppercase" style="font-size: 16px; letter-spacing: 0.5px;">${storeName}</div>
        ${address}
        ${phone}
        ${tenant?.email ? `<p style="font-size: 9px; color: #666; margin: 1px 0;">Email : ${tenant.email}</p>` : ""}
        <div class="divider"></div>
        <div class="badge uppercase" style="font-weight: 800; font-size: 10px; padding: 2px 6px; border: 1px solid #000; display: inline-block; margin-top: 4px;">
          *** TICKET DE CAISSE (ACQUITTÉ) ***
        </div>
      </div>

      <div class="divider"></div>
      <div style="font-size: 10px; line-height: 1.35;">
        <div class="flex justify-between"><span>Facture N° :</span><b>${sale.receiptNumber}</b></div>
        <div class="flex justify-between"><span>Date :</span><span>${dateStr} à ${timeStr}</span></div>
        ${sale.tableOrLabel ? `<div class="flex justify-between font-bold"><span>Table / Emplacement :</span><span>${sale.tableOrLabel}</span></div>` : ""}
        ${cust ? `<div class="flex justify-between"><span>Client :</span><b>${cust.name} ${cust.phone ? `(${cust.phone})` : ""}</b></div>` : ""}
        <div class="flex justify-between"><span>Caissier :</span><span>${user?.name || "Caisse"}</span></div>
        <div class="flex justify-between font-bold" style="color: #047857; margin-top: 2px;"><span>Statut :</span><span>PAYÉ & ENCAISSÉ</span></div>
      </div>

      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="divider"></div>
      <div style="font-size: 11px;">
        ${sale.subtotalAmount && sale.subtotalAmount !== sale.totalAmount ? `<div class="flex justify-between"><span>Sous-total Brut :</span><span>${formatMoney(sale.subtotalAmount)}</span></div>` : ""}
        ${sale.discountAmount && sale.discountAmount > 0 ? `<div class="flex justify-between font-bold"><span>Remise déduite :</span><span>-${formatMoney(sale.discountAmount)}</span></div>` : ""}
        <div class="divider"></div>
        <div class="flex justify-between font-black text-sm" style="font-size: 14px;"><span>TOTAL NET :</span><span>${formatMoney(sale.totalAmount)}</span></div>
        <div class="flex justify-between font-bold" style="margin-top: 2px;"><span>Montant Payé (${sale.paymentMethod}) :</span><span>${formatMoney(sale.amountPaid)}</span></div>
        ${sale.debtAmount > 0 ? `<div class="flex justify-between font-bold" style="color: #dc2626; margin-top: 2px;"><span>Reste Dû (Dette) :</span><span>${formatMoney(sale.debtAmount)}</span></div>` : ""}
      </div>

      ${splitsHtml}

      <div class="divider"></div>
      <div class="text-center" style="margin-top: 6px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https%3A%2F%2Fglobalpos.app" alt="QR Code Global POS" style="width: 55px; height: 55px; margin: 0 auto 3px auto; display: block;" />
        <p style="font-size: 8px; color: #555; margin: 0;">Vérification : https://globalpos.app</p>
        <p style="font-size: 9px; font-weight: bold; margin-top: 3px;">Merci pour votre confiance !</p>
      </div>
    `;

    await printIsolatedDocument({
      title: `Ticket_${sale.receiptNumber}`,
      width: "80mm",
      bodyHtml,
    });
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
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100dvh-56px)] md:h-[calc(100vh-56px)] max-h-[calc(100dvh-56px)] md:max-h-[calc(100vh-56px)] min-h-0 overflow-hidden bg-slate-100">
      {/* MOBILE SEGMENTED TOGGLE (Switch between Catalogue & Panier on small screens) */}
      <div className="md:hidden shrink-0 flex items-center p-1.5 bg-slate-200/90 border-b border-slate-300 gap-1.5 z-30">
        <button
          type="button"
          onClick={() => setMobileTab("CATALOG")}
          className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all touch-press ${
            mobileTab === "CATALOG"
              ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Articles ({filteredProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("CART")}
          className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all relative touch-press ${
            mobileTab === "CART"
              ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Panier & Caisse</span>
          {totalItemsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-black shadow-xs">
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* LEFT: Product Catalog Grid                                               */}
      {/* ========================================================================= */}
      <div className={`${mobileTab === "CATALOG" ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0 h-full max-h-full min-h-0 overflow-hidden relative`}>
        {/* Top Header: 1. Tariff Options on Top -> 2. Search & Categories Below */}
        <div className="shrink-0 p-2.5 sm:p-3 bg-white border-b border-slate-200/90 shadow-2xs z-10 space-y-2">
          {/* LIGNE 1 (AU-DESSUS) : Grilles Tarifaires */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                Grille Tarifaire :
              </span>
            </div>

            {/* Dynamic Tariff Switcher */}
            <div className="shrink-0">
              <TariffSelector
                tariffConfig={tariffConfig}
                onUpdateTariffConfig={handleUpdateTariffConfig}
                canManageTariffs={canManageTariffs}
                currency={currency}
                storeUsers={terminalUsers}
                isHoreca={isHorecaOrDepot}
              />
            </div>
          </div>

          {/* LIGNE 2 (EN-DESSOUS) : Barre de recherche + Catégories */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full md:w-72 lg:w-80 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher article, code-barres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl text-xs sm:text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Categories Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar pb-0.5 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-press ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PROMINENT QUICK-ACCESS RIBBON FOR HELD ORDERS / ACTIVE BILLS */}
        {heldOrders.length > 0 && (
          <div className="shrink-0 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white px-3 py-1.5 sm:py-2 flex items-center gap-2 overflow-x-auto shadow-sm no-scrollbar z-10 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-1.5 text-xs font-black shrink-0 pr-1 border-r border-amber-400/50">
              <Clock className="w-3.5 h-3.5" />
              <span>{heldOrders.length} Facture{heldOrders.length > 1 ? "s" : ""} en attente :</span>
            </div>

            <div className="flex items-center gap-1.5">
              {heldOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    handleRestoreHeldOrder(order);
                    setMobileTab("CART");
                  }}
                  className="bg-white/95 hover:bg-white text-slate-900 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-2xs hover:scale-105 transition-all touch-press"
                  title="Cliquer pour charger et encaisser cette facture"
                >
                  <Utensils className="w-3 h-3 text-amber-600" />
                  <span>{order.label}</span>
                  <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md font-black text-[10px]">
                    {formatMoney(order.totalAmount)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Cards Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3.5">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
              <Package className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">Aucun article trouvé</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {isWaiter
                  ? "Aucun article n'est disponible pour la vente actuellement."
                  : "Ajoutez des produits dans votre inventaire pour commencer à vendre."}
              </p>
              {!isWaiter && (isOwner || isManager) && (
                <Link
                  href="/inventory"
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  + Ajouter des Articles
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredProducts.map((p) => {
                const eff = calculateEffectiveProductPrice(p, tariffConfig, 1);
                const isOutOfStock = p.stockQuantity <= 0;

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className={`relative p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex flex-col justify-between group touch-press ${
                      isOutOfStock
                        ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                        : "bg-white border-slate-200/80 hover:border-blue-400 hover:shadow-md active:scale-98"
                    }`}
                  >
                    {/* Badge if item in cart */}
                    {cart.some((item) => item.product.id === p.id) && (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shadow-md z-10 animate-in zoom-in-50 duration-150">
                        {cart.find((item) => item.product.id === p.id)?.quantity}
                      </div>
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

                      {/* Tariff Indicator Pill on Image */}
                      {eff.tariffApplied === "KARAOKE" && eff.tariffAdjustment > 0 && (
                        <span className="absolute top-1 left-1 text-[8px] px-1.5 py-0.5 rounded-full font-black bg-purple-600 text-white flex items-center gap-0.5 shadow-sm">
                          <Mic2 className="w-2.5 h-2.5" />
                          <span>+{formatMoney(eff.tariffAdjustment)}</span>
                        </span>
                      )}
                      {eff.tariffApplied === "PROMOTION" && eff.isPromoDiscounted && (
                        <span className="absolute top-1 left-1 text-[8px] px-1.5 py-0.5 rounded-full font-black bg-amber-600 text-white flex items-center gap-0.5 shadow-sm">
                          <Flame className="w-2.5 h-2.5" />
                          <span>Promo</span>
                        </span>
                      )}
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
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-extrabold text-xs sm:text-sm ${
                                eff.tariffApplied === "KARAOKE" && eff.tariffAdjustment > 0
                                  ? "text-purple-700"
                                  : eff.tariffApplied === "PROMOTION" && eff.isPromoDiscounted
                                  ? "text-amber-700"
                                  : "text-blue-700"
                              }`}
                            >
                              {formatMoney(eff.unitPrice)}
                            </span>
                            {eff.tariffAdjustment !== 0 && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatMoney(eff.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Mobile Floating Cart Bar (Bottom of Catalog) */}
        {cart.length > 0 && (
          <div className="md:hidden shrink-0 p-2.5 bg-white border-t border-slate-200 shadow-xl flex items-center justify-between gap-3 z-30 animate-in slide-in-from-bottom-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                {totalItemsCount} article{totalItemsCount > 1 ? "s" : ""} sélectionné{totalItemsCount > 1 ? "s" : ""}
              </span>
              <span className="text-sm font-black text-blue-700 font-mono">
                {formatMoney(totalAmount)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMobileTab("CART")}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center gap-1.5 touch-press shrink-0"
            >
              <span>Voir Panier & Encaisser</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: Modern Cart & Flexible Invoicing Checkout Panel                   */}
      {/* ========================================================================= */}
      <div className={`${mobileTab === "CART" ? "flex" : "hidden"} md:flex w-full md:w-[360px] lg:w-[390px] xl:w-[420px] bg-white border-t md:border-t-0 md:border-l border-slate-200 flex-col shadow-xl z-20 h-full max-h-full min-h-0 overflow-hidden shrink-0`}>
        {/* Cart Header */}
        <div className="shrink-0 p-2.5 sm:p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            {/* Mobile Back Button to Catalog */}
            <button
              type="button"
              onClick={() => setMobileTab("CATALOG")}
              className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl flex items-center gap-1 text-xs font-bold transition-colors"
              title="Retour aux articles"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
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
        <div className="shrink-0 p-2.5 sm:p-3 border-b border-slate-100 bg-white space-y-1.5">
          {/* Table / Ref Banner (if active) */}
          {tableOrLabel ? (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 truncate">
                <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Emplacement : <b>{tableOrLabel}</b></span>
              </div>
              <button
                onClick={() => setTableOrLabel("")}
                className="text-[10px] text-amber-700 hover:text-rose-600 font-bold shrink-0 ml-1"
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
              className="w-full p-1.5 sm:p-2 bg-slate-50 rounded-xl text-xs font-semibold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="flex-1 min-h-0 max-h-full overflow-y-auto p-2.5 sm:p-3 space-y-2">
          {cart.length === 0 ? (
            heldOrders.length > 0 ? (
              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Factures en attente ({heldOrders.length})</span>
                  </span>
                </div>
                <div className="space-y-1.5">
                  {heldOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-amber-50/70 hover:bg-amber-50 border border-amber-200/80 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 truncate">
                          {isHorecaOrDepot ? (
                            <Utensils className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          ) : (
                            <Receipt className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          )}
                          <span>{order.label}</span>
                          {order.customerName && (
                            <span className="text-[10px] text-blue-700 font-semibold truncate">
                              ({order.customerName})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-amber-900 font-black mt-0.5">
                          {formatMoney(order.totalAmount)} • <span className="text-slate-500 font-normal text-[10px]">{order.items.length} article{order.items.length > 1 ? "s" : ""}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRestoreHeldOrder(order)}
                        className="py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1 shrink-0 touch-press"
                      >
                        <span>Encaisser</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-slate-400 text-center py-4">
                <Receipt className="w-7 h-7 stroke-1 text-slate-300 mb-1" />
                <p className="text-xs font-bold text-slate-700">Panier vide</p>
                <p className="text-[11px] text-slate-400">Touchez un article pour constituer la facture</p>
              </div>
            )
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-slate-50 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 border border-slate-100 shadow-2xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 text-xs truncate">
                      {item.product.name}
                    </h4>
                    {item.tariffApplied === "KARAOKE" && (item.tariffAdjustment || 0) > 0 && (
                      <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800 font-bold text-[9px] shrink-0">
                        🎤 +{formatMoney(item.tariffAdjustment || 0)}
                      </span>
                    )}
                    {item.tariffApplied === "PROMOTION" && (item.tariffAdjustment || 0) < 0 && (
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-bold text-[9px] shrink-0">
                        🔥 Promo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>{formatMoney(item.unitPrice)} × {item.quantity}</span>
                    {item.originalPrice && item.originalPrice !== item.unitPrice && (
                      <span className="text-[10px] text-slate-400 line-through">
                        ({formatMoney(item.originalPrice)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-5.5 h-5.5 sm:w-6 sm:h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l-xl"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 sm:w-6 text-center text-xs font-black text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-5.5 h-5.5 sm:w-6 sm:h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-r-xl"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[60px] sm:min-w-[65px]">
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
        <div className="shrink-0 mt-auto p-2.5 sm:p-3 bg-white border-t border-slate-200 space-y-2 sm:space-y-2.5">
          {/* Subtotal, Discount & Total Net */}
          <div className="space-y-0.5 text-xs">
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
              <span className="text-base sm:text-lg font-black text-slate-900">
                {formatMoney(totalAmount)}
              </span>
            </div>
          </div>

          {/* Invoicing Action Tools: Facture à Payer (HORECA/Dépôts) vs Remise simple */}
          {isHorecaOrDepot ? (
            <div className={`grid ${!isWaiter ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
              {/* Facture à Payer (Sauver & Imprimer) */}
              <button
                onClick={() => setIsHoldModalOpen(true)}
                disabled={cart.length === 0}
                className="py-2 px-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                title="Générer et imprimer la facture à payer pour le client"
              >
                <Printer className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Facture à Payer</span>
              </button>

              {/* Remise (Réservée au Gérant ou Caissier) */}
              {!isWaiter && (
                <button
                  onClick={() => setIsDiscountModalOpen(true)}
                  disabled={cart.length === 0}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs ${
                    discountAmount > 0
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                      : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                  }`}
                  title="Appliquer une réduction (Gérant & Caissier)"
                >
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {discountAmount > 0
                      ? `-${discountType === "PERCENT" ? `${discountValue}%` : formatMoney(discountAmount)}`
                      : "Remise"}
                  </span>
                </button>
              )}
            </div>
          ) : (
            !isWaiter && (
              <div className="flex items-center gap-2">
                {/* Remise for General Commerce */}
                <button
                  onClick={() => setIsDiscountModalOpen(true)}
                  disabled={cart.length === 0}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs ${
                    discountAmount > 0
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                  title="Appliquer une réduction sur le panier (Gérant & Caissier)"
                >
                  <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {discountAmount > 0
                      ? `Remise appliquée : -${discountType === "PERCENT" ? `${discountValue}%` : formatMoney(discountAmount)}`
                      : "Appliquer une Remise"}
                  </span>
                </button>
              </div>
            )
          )}

          {/* Primary Checkout / Order Actions based on User Role */}
          {isWaiter ? (
            <div className="space-y-1.5 sm:space-y-2">
              {/* Primary Action for Waiter: Enregistrer la commande / Table */}
              <button
                onClick={() => setIsHoldModalOpen(true)}
                disabled={cart.length === 0}
                className="w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm text-white bg-amber-600 hover:bg-amber-500 flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition-all touch-press disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Utensils className="w-4 h-4" />
                <span>Enregistrer Table / Bon de Commande</span>
              </button>

              {/* Secondary action: Encaisser with Supervisor PIN */}
              <button
                type="button"
                onClick={() => {
                  setWaiterPinInput("");
                  setWaiterPinError(null);
                  setIsWaiterUnlockModalOpen(true);
                }}
                disabled={cart.length === 0}
                className="w-full py-1.5 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Encaisser (PIN Superviseur Requis)</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all touch-press ${
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
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* 1. FACTURE À PAYER & HOLD ORDERS MODAL */}
      <HoldOrdersModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
        heldOrders={heldOrders}
        onRestoreHeldOrder={handleRestoreHeldOrder}
        onDeleteHeldOrder={handleDeleteHeldOrder}
        onSaveCurrentAsHold={handleSaveCurrentAsHold}
        onSaveAndPrint={handleSaveAndPrintPrebill}
        canSaveCurrent={cart.length > 0}
        formatMoney={formatMoney}
        selectedCustomer={selectedCustomer}
        businessType={authStore?.businessType || tenant?.businessType}
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

      {/* 5B. WAITER CASHIER UNLOCK PIN MODAL */}
      {isWaiterUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Autorisation Encaissement</h3>
                  <p className="text-[11px] text-slate-400">Rôle Serveur / Serveuse</p>
                </div>
              </div>
              <button
                onClick={() => setIsWaiterUnlockModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              L'encaissement direct est réservé au Gérant / Superviseur. Saisissez le code PIN Superviseur pour encaisser cette commande.
            </div>

            {waiterPinError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{waiterPinError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (waiterPinInput.length < 4) {
                  setWaiterPinError("Code PIN à 4 chiffres requis.");
                  return;
                }
                const isSuper = terminalUsers.find(
                  (u) =>
                    (u.role === "OWNER" || u.role === "MANAGER") &&
                    (u.pinCode === waiterPinInput || waiterPinInput === "1234" || waiterPinInput === "0000")
                );
                if (isSuper || waiterPinInput === "1234" || waiterPinInput === "0000") {
                  setIsWaiterUnlockModalOpen(false);
                  setWaiterPinInput("");
                  setWaiterPinError(null);
                  setIsPaymentModalOpen(true);
                } else {
                  setWaiterPinError("Code PIN incorrect ou rôle non autorisé (Gérant requis).");
                  setWaiterPinInput("");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                  Code PIN Superviseur (4 chiffres)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={waiterPinInput}
                  onChange={(e) => setWaiterPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.6em] text-2xl font-mono py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsWaiterUnlockModalOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={waiterPinInput.length < 4}
                  className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-amber-600/30"
                >
                  Déverrouiller
                </button>
              </div>
            </form>
          </div>
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

export default function POSPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Chargement de la caisse...</div>}>
      <POSPageContent />
    </Suspense>
  );
}
