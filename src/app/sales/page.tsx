"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_STORE_ID } from "@/lib/db/dexie-db";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { printIsolatedDocument } from "@/lib/native/print-service";
import type { Sale, SaleItem, Customer } from "@/lib/shared/types";
import {
  Receipt,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  FileText,
  MessageCircle,
  Eye,
  X,
  Layers,
  Banknote,
  Smartphone,
  BookOpen,
  ArrowUpDown,
  Download,
  Utensils,
  ChevronDown,
  ShoppingBag,
  Lock,
} from "lucide-react";

export default function SalesHistoryPage() {
  const { user, tenant, store, stores, isAuthenticated, isLoading, isCashier, isWaiter } = useAuth();
  const { formatMoney, currency } = useSync();

  const currentStoreId = store?.id || DEFAULT_STORE_ID;

  // 1. Data queries
  const sales =
    useLiveQuery(async () => {
      if (!currentStoreId) return [];
      return await db.sales
        .filter((s) => s.storeId === currentStoreId)
        .reverse()
        .sortBy("createdAt");
    }, [currentStoreId]) || [];

  const saleItems =
    useLiveQuery(async () => {
      return await db.saleItems.toArray();
    }, []) || [];

  const products =
    useLiveQuery(async () => {
      return await db.products.toArray();
    }, []) || [];

  const customers =
    useLiveQuery(async () => {
      if (!currentStoreId) return [];
      return await db.customers.filter((c) => c.storeId === currentStoreId).toArray();
    }, [currentStoreId]) || [];

  // Build product ID -> Name lookup map
  const productsMap = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.id && p.name) map.set(p.id, p.name);
    });
    return map;
  }, [products]);

  const getProductName = (it: SaleItem) => {
    if (it.productName && it.productName !== "Article" && it.productName !== "Produit synchronisé") {
      return it.productName;
    }
    if (it.productId && productsMap.has(it.productId)) {
      return productsMap.get(it.productId)!;
    }
    return it.productName || "Article";
  };

  // Auto-backfill missing productNames in Dexie saleItems
  React.useEffect(() => {
    if (products.length === 0 || saleItems.length === 0) return;
    (async () => {
      for (const item of saleItems) {
        if ((!item.productName || item.productName === "Article" || item.productName === "Produit synchronisé") && item.productId) {
          const foundProd = productsMap.get(item.productId);
          if (foundProd) {
            await db.saleItems.update(item.id, { productName: foundProd }).catch(() => {});
          }
        }
      }
    })();
  }, [products.length, saleItems.length, productsMap]);

  // Filter States
  const [timeFilter, setTimeFilter] = useState<"TODAY" | "WEEK" | "MONTH" | "YEAR" | "ALL">("TODAY");
  const [customDate, setCustomDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PARTIAL" | "UNPAID">("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State for Sale Details
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Today dates strings
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const currentMonthStr = todayStr.slice(0, 7);
  const currentYearStr = todayStr.slice(0, 4);

  // Filtered Sales Calculation
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = sale.createdAt.split("T")[0];

      // 1. Time Filter
      if (timeFilter === "TODAY") {
        if (customDate) {
          if (saleDate !== customDate) return false;
        } else {
          if (saleDate !== todayStr) return false;
        }
      } else if (timeFilter === "WEEK") {
        const saleDateObj = new Date(sale.createdAt);
        const diffDays = (today.getTime() - saleDateObj.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (timeFilter === "MONTH") {
        if (!saleDate.startsWith(currentMonthStr)) return false;
      } else if (timeFilter === "YEAR") {
        if (!saleDate.startsWith(currentYearStr)) return false;
      }

      // 2. Payment Status Filter
      if (statusFilter === "PAID") {
        if (sale.debtAmount > 0) return false;
      } else if (statusFilter === "PARTIAL") {
        if (sale.amountPaid <= 0 || sale.debtAmount <= 0) return false;
      } else if (statusFilter === "UNPAID") {
        if (sale.amountPaid > 0) return false;
      }

      // 3. Payment Method Filter
      if (methodFilter !== "ALL") {
        if (methodFilter === "SPLIT") {
          if (!sale.paymentSplits || sale.paymentSplits.length === 0) return false;
        } else {
          if (sale.paymentMethod !== methodFilter) return false;
        }
      }

      // 4. Search Query (Receipt Number, Customer, Table)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cust = customers.find((c) => c.id === sale.customerId);
        const matchReceipt = sale.receiptNumber?.toLowerCase().includes(q);
        const matchCust = cust?.name?.toLowerCase().includes(q);
        const matchTable = sale.tableOrLabel?.toLowerCase().includes(q);
        const matchNotes = sale.notes?.toLowerCase().includes(q);
        if (!matchReceipt && !matchCust && !matchTable && !matchNotes) return false;
      }

      return true;
    });
  }, [
    sales,
    timeFilter,
    customDate,
    statusFilter,
    methodFilter,
    searchQuery,
    customers,
    today,
    todayStr,
    currentMonthStr,
    currentYearStr,
  ]);

  // Financial KPIs on filtered data
  const totalVolume = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [filteredSales]);

  const totalCollected = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.amountPaid, 0);
  }, [filteredSales]);

  const totalDebts = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.debtAmount, 0);
  }, [filteredSales]);

  const averageBasket = useMemo(() => {
    if (filteredSales.length === 0) return 0;
    return totalVolume / filteredSales.length;
  }, [filteredSales, totalVolume]);

  // Selected Sale Details
  const selectedSaleItems = useMemo(() => {
    if (!selectedSale) return [];
    return saleItems.filter((it) => it.saleId === selectedSale.id);
  }, [selectedSale, saleItems]);

  const selectedSaleCustomer = useMemo(() => {
    if (!selectedSale?.customerId) return null;
    return customers.find((c) => c.id === selectedSale.customerId);
  }, [selectedSale, customers]);

  // Print helper for historic POS ticket (80mm)
  const handlePrintHistoricSale = async (sale: Sale, items: SaleItem[]) => {
    const storeName = store?.name || tenant?.name || "Kuettu Global POS";
    const storeLogo = store?.logoUrl || tenant?.logoUrl;
    const cust = customers.find((c) => c.id === sale.customerId);
    const dateStr = new Date(sale.createdAt).toLocaleDateString("fr-FR");
    const timeStr = new Date(sale.createdAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const itemsHtml = items
      .map(
        (it) => `
      <tr>
        <td><b>${getProductName(it)}</b><br/><span style="font-size: 9px; color: #444;">${it.quantity} x ${formatMoney(it.unitPrice)}</span></td>
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
        ${store?.address ? `<p class="text-xs" style="margin: 2px 0; color: #333;">${store.address}</p>` : ""}
        ${store?.phone ? `<p class="text-xs" style="margin: 2px 0; color: #333;">Tél : ${store.phone}</p>` : ""}
        ${tenant?.email ? `<p style="font-size: 9px; color: #666; margin: 1px 0;">Email : ${tenant.email}</p>` : ""}
        <div class="divider"></div>
        <div class="badge uppercase" style="font-weight: 800; font-size: 10px; padding: 2px 6px; border: 1px solid #000; display: inline-block; margin-top: 4px;">
          *** DUPLICATA TICKET DE CAISSE ***
        </div>
      </div>

      <div class="divider"></div>
      <div style="font-size: 10px; line-height: 1.35;">
        <div class="flex justify-between"><span>Facture N° :</span><b>${sale.receiptNumber}</b></div>
        <div class="flex justify-between"><span>Date :</span><span>${dateStr} à ${timeStr}</span></div>
        ${sale.tableOrLabel ? `<div class="flex justify-between font-bold"><span>Table / Emplacement :</span><span>${sale.tableOrLabel}</span></div>` : ""}
        ${cust ? `<div class="flex justify-between"><span>Client :</span><b>${cust.name} ${cust.phone ? `(${cust.phone})` : ""}</b></div>` : ""}
        <div class="flex justify-between font-bold" style="color: #047857; margin-top: 2px;"><span>Statut :</span><span>ACQUITTÉ (DUPLICATA)</span></div>
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
        ${sale.debtAmount > 0 ? `<div class="flex justify-between font-bold" style="color: #b91c1c; margin-top: 2px;"><span>Reste Dû (Dette) :</span><span>${formatMoney(sale.debtAmount)}</span></div>` : ""}
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

  // Print A4 Pro PDF Invoice
  const handlePrintA4Invoice = async (sale: Sale, items: SaleItem[]) => {
    const storeName = store?.name || tenant?.name || "Kuettu Global POS";
    const storeLogo = store?.logoUrl || tenant?.logoUrl;
    const cust = customers.find((c) => c.id === sale.customerId);
    const dateStr = new Date(sale.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const timeStr = new Date(sale.createdAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const itemsRows = items
      .map(
        (it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 10px 8px;">
          <b style="color: #0f172a;">${getProductName(it)}</b>
        </td>
        <td style="padding: 10px 8px; text-align: center;">${it.quantity}</td>
        <td style="padding: 10px 8px; text-align: right;">${formatMoney(it.unitPrice)}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #0f172a;">${formatMoney(it.quantity * it.unitPrice)}</td>
      </tr>`
      )
      .join("");

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" style="max-height: 55px; max-width: 180px; object-fit: contain; margin-bottom: 8px;" />` : ""}
            <h1 style="font-size: 22px; font-weight: 900; margin: 0; text-transform: uppercase; color: #1e3a8a;">${storeName}</h1>
            ${store?.address ? `<p style="margin: 3px 0; font-size: 11px; color: #475569;">📍 ${store.address}</p>` : ""}
            ${store?.phone ? `<p style="margin: 3px 0; font-size: 11px; color: #475569;">📞 Tél : ${store.phone}</p>` : ""}
            ${tenant?.email ? `<p style="margin: 3px 0; font-size: 11px; color: #475569;">✉️ Email : ${tenant.email}</p>` : ""}
          </div>
          <div style="text-align: right;">
            <div style="background: #eff6ff; color: #1d4ed8; padding: 6px 14px; border-radius: 8px; font-weight: 900; font-size: 14px; display: inline-block; margin-bottom: 6px; border: 1px solid #bfdbfe;">
              FACTURE N° ${sale.receiptNumber}
            </div>
            <p style="margin: 2px 0; font-size: 11px; color: #64748b;">Date d'émission : <b>${dateStr} à ${timeStr}</b></p>
            <p style="margin: 2px 0; font-size: 11px; color: #64748b;">Statut : <b style="color: ${sale.debtAmount > 0 ? '#b91c1c' : '#15803d'};">${sale.debtAmount > 0 ? 'PARTIELLEMENT PAYÉE (DETTE)' : 'RÉGLÉE / ACQUITTÉE'}</b></p>
            ${sale.tableOrLabel ? `<p style="margin: 2px 0; font-size: 11px; color: #b45309;">Emplacement / Ref : <b>${sale.tableOrLabel}</b></p>` : ""}
          </div>
        </div>

        <!-- Client & Facturation Info Box -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
          <div>
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Facturé à :</span>
            <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 4px;">${cust?.name || "Client Comptant (Passager)"}</div>
            ${cust?.phone ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">Tél : ${cust.phone}</div>` : ""}
            ${cust?.address ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">Adresse : ${cust.address}</div>` : ""}
          </div>
          <div>
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Modalités & Caisse :</span>
            <div style="font-size: 11px; color: #334155; margin-top: 4px;">Mode de règlement : <b>${sale.paymentMethod}</b></div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">Vendeur / Caissier : <b>${user?.name || "Caisse Principale"}</b></div>
            ${sale.notes ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">Note : ${sale.notes}</div>` : ""}
          </div>
        </div>

        <!-- Articles Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #1e3a8a; color: #ffffff; text-align: left;">
              <th style="padding: 10px 8px; width: 40px; text-align: center; border-top-left-radius: 6px;">#</th>
              <th style="padding: 10px 8px;">Désignation de l'article</th>
              <th style="padding: 10px 8px; width: 80px; text-align: center;">Qté</th>
              <th style="padding: 10px 8px; width: 110px; text-align: right;">Prix Unitaire</th>
              <th style="padding: 10px 8px; width: 120px; text-align: right; border-top-right-radius: 6px;">Montant Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Totals & Payment Summary -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
          <div style="width: 300px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; font-size: 12px;">
            ${sale.subtotalAmount && sale.subtotalAmount !== sale.totalAmount ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569;">
                <span>Sous-total Brut :</span>
                <span>${formatMoney(sale.subtotalAmount)}</span>
              </div>` : ""}
            ${sale.discountAmount && sale.discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #15803d; font-weight: bold;">
                <span>Remise déduite :</span>
                <span>-${formatMoney(sale.discountAmount)}</span>
              </div>` : ""}
            <div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 2px solid #cbd5e1; font-size: 15px; font-weight: 900; color: #1e3a8a;">
              <span>TOTAL NET :</span>
              <span>${formatMoney(sale.totalAmount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 6px; font-weight: bold; color: #047857;">
              <span>Montant Payé (${sale.paymentMethod}) :</span>
              <span>${formatMoney(sale.amountPaid)}</span>
            </div>
            ${sale.debtAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 4px; border-top: 1px solid #fecdd3; font-weight: 900; color: #b91c1c;">
                <span>Reste en Dette :</span>
                <span>${formatMoney(sale.debtAmount)}</span>
              </div>` : ""}
          </div>
        </div>

        <!-- Signatures & Official Validation Stamp -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
          <div style="text-align: center; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; height: 100px; display: flex; flex-direction: column; justify-content: space-between;">
            <span style="font-size: 11px; font-weight: bold; color: #64748b;">Signature & Cachet Client</span>
            <div style="border-bottom: 1px dashed #cbd5e1; width: 60%; margin: 0 auto;"></div>
          </div>
          <div style="text-align: center; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; height: 100px; display: flex; flex-direction: column; justify-content: space-between;">
            <span style="font-size: 11px; font-weight: bold; color: #64748b;">Signature & Cachet Caisse / Direction</span>
            <div style="border-bottom: 1px dashed #cbd5e1; width: 60%; margin: 0 auto;"></div>
          </div>
        </div>

        <!-- Footer with QR Code & Platform Verification -->
        <div style="border-top: 2px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b;">
          <div>
            <p style="margin: 0; font-weight: bold; color: #0f172a;">Facture générée numériquement par Kuettu Global POS</p>
            <p style="margin: 2px 0;">Vérification d'authenticité et gestion : <a href="https://globalpos.app" target="_blank" style="color: #2563eb; text-decoration: none;">https://globalpos.app</a></p>
            <p style="margin: 2px 0;">Merci pour votre confiance !</p>
          </div>
          <div style="text-align: center;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https%3A%2F%2Fglobalpos.app" alt="QR Code Global POS" style="width: 60px; height: 60px; display: block; margin: 0 auto 2px auto;" />
            <span style="font-size: 8px; color: #94a3b8;">Scanner pour vérifier</span>
          </div>
        </div>
      </div>
    `;

    await printIsolatedDocument({
      title: `Facture_A4_${sale.receiptNumber}`,
      width: "a4",
      bodyHtml,
    });
  };

  // WhatsApp helper
  const getWhatsAppShareUrl = (sale: Sale, items: SaleItem[], cust?: Customer | null) => {
    const storeName = store?.name || tenant?.name || "Kuettu Global POS";
    let text = `🧾 *${storeName.toUpperCase()} - FACTURE N° ${sale.receiptNumber}*\n`;
    text += `📅 Date : ${new Date(sale.createdAt).toLocaleDateString("fr-FR")} à ${new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}\n`;
    if (sale.tableOrLabel) text += `📍 Table / Ref : ${sale.tableOrLabel}\n`;
    if (cust) text += `👤 Client : ${cust.name}\n`;
    text += `--------------------------------\n`;

    items.forEach((it) => {
      text += `• ${getProductName(it)} x${it.quantity} = ${formatMoney(it.quantity * it.unitPrice)}\n`;
    });

    text += `--------------------------------\n`;
    text += `*TOTAL NET : ${formatMoney(sale.totalAmount)}*\n`;
    text += `Montant Payé : ${formatMoney(sale.amountPaid)}\n`;
    if (sale.debtAmount > 0) {
      text += `⚠️ *Reste en Dette : ${formatMoney(sale.debtAmount)}*\n`;
    }
    text += `\n_Merci pour votre confiance !_`;

    const phone = cust?.phone?.replace(/\D/g, "") || "";
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement du journal des ventes...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen title="Accès Réservé au Gérant" />;
  }

  if (isWaiter) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-100">
        <div className="max-w-md w-full p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Accès Restreint</h3>
          <p className="text-xs text-slate-500">
            Le journal et l'historique des ventes sont réservés aux caissiers et gérants.
          </p>
          <Link
            href="/pos"
            className="inline-block py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            Retourner à la Caisse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* 1. Header with Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold mb-1">
            <Receipt className="w-4 h-4" />
            <span>Gestion Commerciale & Supervision Gérant</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Journal & Historique des Ventes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi en temps réel des encaissements, dettes accordées et paiements partiels.
          </p>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Volume */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Chiffre d'Affaires ({filteredSales.length} ventes)
          </span>
          <div className="text-lg sm:text-2xl font-black text-slate-900">
            {formatMoney(totalVolume)}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">
            Panier Moyen : {formatMoney(averageBasket)}
          </div>
        </div>

        {/* Collected */}
        <div className="bg-emerald-50/70 p-4 rounded-3xl border border-emerald-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
            Total Encaissé (Cash / Mobile)
          </span>
          <div className="text-lg sm:text-2xl font-black text-emerald-700">
            {formatMoney(totalCollected)}
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold mt-1">
            Taux d'encaissement : {totalVolume > 0 ? Math.round((totalCollected / totalVolume) * 100) : 100}%
          </div>
        </div>

        {/* Debts */}
        <div className="bg-rose-50/70 p-4 rounded-3xl border border-rose-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block mb-1">
            Ventes à Crédit / Dettes
          </span>
          <div className="text-lg sm:text-2xl font-black text-rose-700">
            {formatMoney(totalDebts)}
          </div>
          <div className="text-[11px] text-rose-800 font-semibold mt-1">
            Créances à recouvrer
          </div>
        </div>

        {/* Fully Paid Ratio */}
        <div className="bg-indigo-50/70 p-4 rounded-3xl border border-indigo-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 block mb-1">
            Statut des Transactions
          </span>
          <div className="text-lg sm:text-2xl font-black text-indigo-900">
            {filteredSales.filter((s) => s.debtAmount === 0).length} / {filteredSales.length}
          </div>
          <div className="text-[11px] text-indigo-700 font-semibold mt-1">
            Factures 100% Soldées
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Filter Toolbar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        {/* Top Filter Row: Time Period Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Time Tabs */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold max-w-md">
            {[
              { id: "TODAY", label: "Jour" },
              { id: "WEEK", label: "Semaine" },
              { id: "MONTH", label: "Mois" },
              { id: "YEAR", label: "Année" },
              { id: "ALL", label: "Tout" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setTimeFilter(tab.id as any);
                  if (tab.id !== "TODAY") setCustomDate("");
                }}
                className={`py-2 rounded-xl transition-all text-center ${
                  timeFilter === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Optional Specific Date Picker (when Jour is selected) */}
          {timeFilter === "TODAY" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Date précise :</span>
              <input
                type="date"
                value={customDate || todayStr}
                onChange={(e) => setCustomDate(e.target.value)}
                className="p-1.5 px-3 bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Second Filter Row: Payment Status & Method & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher reçu, client, table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-2 bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">📋 Tous les statuts de paiement</option>
              <option value="PAID">🟢 Totalement Payée (Soldée)</option>
              <option value="PARTIAL">🟡 Paiement Partiel (Acompte + Dette)</option>
              <option value="UNPAID">🔴 Non Payée (100% Crédit)</option>
            </select>
          </div>

          {/* Payment Method Filter Dropdown */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">💳 Tous les modes de règlement</option>
              <option value="CASH">💵 Espèces (Cash)</option>
              <option value="MPESA">📱 M-Pesa</option>
              <option value="AIRTEL_MONEY">🔴 Airtel Money</option>
              <option value="ORANGE_MONEY">🍊 Orange Money</option>
              <option value="AFRIMONEY">🟣 Afrimoney</option>
              <option value="ILLICOCASH">🏦 IlliCo Cash</option>
              <option value="EQUITY_BCDC">🏛️ Equity BCDC</option>
              <option value="PEPELE_MOBILE">📲 Pepele Mobile</option>
              <option value="CARD">💳 Carte Bancaire</option>
              <option value="CREDIT">📖 Dette (Crédit)</option>
              <option value="SPLIT">🥞 Multi-Paiements (Fractionné)</option>
            </select>
          </div>

          {/* Quick Result Counter */}
          <div className="flex items-center justify-end text-xs text-slate-500 font-medium pr-2">
            <span>{filteredSales.length} transaction{filteredSales.length > 1 ? "s" : ""} trouvée{filteredSales.length > 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* 4. Sales History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Receipt className="w-12 h-12 stroke-1 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Aucune vente enregistrée pour cette sélection</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Modifiez la période ou les filtres de statut de paiement pour afficher les transactions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-3">N° Facture</th>
                  <th className="py-3 px-3">Table / Ref</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Mode Règlement</th>
                  <th className="py-3 px-3 text-right">Total Net</th>
                  <th className="py-3 px-3 text-right">Payé</th>
                  <th className="py-3 px-3 text-right">Reste Dette</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSales.map((sale) => {
                  const cust = customers.find((c) => c.id === sale.customerId);
                  const isFullyPaid = sale.debtAmount === 0;
                  const isPartial = sale.amountPaid > 0 && sale.debtAmount > 0;
                  const isUnpaid = sale.amountPaid === 0;

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {new Date(sale.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(sale.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Receipt */}
                      <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {sale.receiptNumber}
                      </td>

                      {/* Table / Ref */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {sale.tableOrLabel ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px]">
                            <Utensils className="w-3 h-3 text-amber-600" />
                            <span>{sale.tableOrLabel}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {cust ? (
                          <div>
                            <div className="font-bold text-slate-900">{cust.name}</div>
                            {cust.phone && (
                              <div className="text-[10px] text-slate-400">{cust.phone}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Comptant (Passager)</span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {sale.paymentSplits && sale.paymentSplits.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                            <Layers className="w-3 h-3" />
                            <span>Multi ({sale.paymentSplits.length})</span>
                          </span>
                        ) : (
                          <span className="text-slate-800 font-bold text-xs">
                            {sale.paymentMethod}
                          </span>
                        )}
                      </td>

                      {/* Total Net */}
                      <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatMoney(sale.totalAmount)}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {formatMoney(sale.amountPaid)}
                      </td>

                      {/* Debt Amount */}
                      <td className="py-3 px-3 text-right font-black whitespace-nowrap">
                        {sale.debtAmount > 0 ? (
                          <span className="text-rose-600">-{formatMoney(sale.debtAmount)}</span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isFullyPaid && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Payée</span>
                          </span>
                        )}
                        {isPartial && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            <span>Partiel</span>
                          </span>
                        )}
                        {isUnpaid && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Non Payée</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold flex items-center gap-1 mx-auto transition-all shadow-2xs"
                          title="Voir le détail de la facture"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Détail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. SALE DETAIL MODAL */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-white w-full max-w-md max-h-[90vh] rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Facture N° {selectedSale.receiptNumber}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    {new Date(selectedSale.createdAt).toLocaleDateString("fr-FR")} à{" "}
                    {new Date(selectedSale.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Receipt Body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {/* Table / Customer Info */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                {selectedSale.tableOrLabel && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Emplacement :</span>
                    <b className="text-amber-800">📍 {selectedSale.tableOrLabel}</b>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Client :</span>
                  <b>{selectedSaleCustomer ? selectedSaleCustomer.name : "Comptant (Passager)"}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode Règlement :</span>
                  <b className="text-blue-700">{selectedSale.paymentMethod}</b>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div className="font-bold text-slate-400 uppercase text-[10px] pb-1 border-b border-slate-200">
                  Articles ({selectedSaleItems.length})
                </div>
                {selectedSaleItems.map((it) => (
                  <div key={it.id} className="flex justify-between items-start text-slate-800">
                    <div className="flex-1 pr-2">
                      <div className="font-bold truncate">{getProductName(it)}</div>
                      <div className="text-[10px] text-slate-500">
                        {it.quantity} × {formatMoney(it.unitPrice)}
                      </div>
                    </div>
                    <div className="font-black text-slate-900">
                      {formatMoney(it.quantity * it.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1 font-mono">
                {selectedSale.subtotalAmount && selectedSale.subtotalAmount !== selectedSale.totalAmount && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Sous-total Brut :</span>
                    <span>{formatMoney(selectedSale.subtotalAmount)}</span>
                  </div>
                )}

                {selectedSale.discountAmount && selectedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold text-[11px]">
                    <span>Remise déduite :</span>
                    <span>- {formatMoney(selectedSale.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-200 text-sm">
                  <span>TOTAL NET :</span>
                  <span className="text-blue-700">{formatMoney(selectedSale.totalAmount)}</span>
                </div>

                <div className="flex justify-between text-slate-700 text-xs font-bold">
                  <span>Montant Payé :</span>
                  <span>{formatMoney(selectedSale.amountPaid)}</span>
                </div>

                {selectedSale.debtAmount > 0 && (
                  <div className="flex justify-between font-black text-rose-600 text-xs pt-1 border-t border-rose-200">
                    <span>Reste en Dette :</span>
                    <span>{formatMoney(selectedSale.debtAmount)}</span>
                  </div>
                )}
              </div>

              {/* Splits details */}
              {selectedSale.paymentSplits && selectedSale.paymentSplits.length > 0 && (
                <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200 text-[11px] space-y-1">
                  <span className="font-bold text-indigo-900 block mb-0.5">Détail des règlements fractionnés :</span>
                  {selectedSale.paymentSplits.map((s, idx) => (
                    <div key={idx} className="flex justify-between text-indigo-800">
                      <span>• {s.method} :</span>
                      <span className="font-bold">{formatMoney(s.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 space-y-2 border-t border-slate-100 mt-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handlePrintHistoricSale(selectedSale, selectedSaleItems)}
                  className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex flex-col sm:flex-row items-center justify-center gap-1 shadow-md shadow-slate-900/20 text-center"
                  title="Imprimer ticket de caisse thermique (80mm)"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>Ticket POS</span>
                </button>

                <button
                  onClick={() => handlePrintA4Invoice(selectedSale, selectedSaleItems)}
                  className="py-2.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex flex-col sm:flex-row items-center justify-center gap-1 shadow-md shadow-blue-600/20 text-center"
                  title="Générer et imprimer facture format A4 / PDF"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Facture A4</span>
                </button>

                <a
                  href={getWhatsAppShareUrl(selectedSale, selectedSaleItems, selectedSaleCustomer)}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex flex-col sm:flex-row items-center justify-center gap-1 shadow-md shadow-emerald-600/20 text-center"
                  title="Partager le reçu par WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <button
                onClick={() => setSelectedSale(null)}
                className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
