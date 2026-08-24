"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_STORE_ID } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import { useAuth } from "@/lib/auth/auth-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { UpgradePromptModal } from "@/components/plans/upgrade-prompt-modal";
import ExportReportModal from "@/components/reports/export-report-modal";
import { EXPENSE_CATEGORIES } from "@/lib/shared/types";
import {
  TrendingUp,
  CreditCard,
  BookOpen,
  DollarSign,
  ShoppingCart,
  Package,
  ArrowUpRight,
  AlertTriangle,
  Receipt,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  FileSpreadsheet,
  Building,
  Wallet,
  TrendingDown,
  Calendar,
  BarChart2,
  ChevronRight,
  Percent,
  Settings,
} from "lucide-react";

type TimeRange = "HOURLY" | "7_DAYS" | "30_DAYS" | "MONTHLY";

export default function DashboardPage() {
  const { user, tenant, store: authStore, stores, isAuthenticated, isLoading, plan, canAccess } = useAuth();
  const { formatMoney, rawCurrency } = useSync();

  const currentStoreId = authStore?.id || DEFAULT_STORE_ID;
  const currentTenantId = tenant?.id;

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("7_DAYS");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Live Queries
  const sales = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.sales
      .filter((s) => s.storeId === currentStoreId)
      .reverse()
      .sortBy("createdAt");
  }, [currentStoreId]) || [];

  const allTenantSales = useLiveQuery(async () => {
    if (!currentTenantId) return [];
    return await db.sales
      .filter((s) => s.tenantId === currentTenantId || !s.tenantId)
      .toArray();
  }, [currentTenantId]) || [];

  const saleItems = useLiveQuery(() => db.saleItems.toArray()) || [];

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

  const expenses = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.expenses
      .filter((e) => e.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen title="Tableau de Bord Verrouillé" />;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Sales & Revenue Calculations
  const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const todayCashCollected = todaySales.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalCustomerDebt = customers.reduce((acc, c) => acc + (c.currentDebtBalance > 0 ? c.currentDebtBalance : 0), 0);

  // Gross Margin Calculations
  const todayGrossProfit = (() => {
    const todaySaleIds = new Set(todaySales.map((s) => s.id));
    const relevantItems = saleItems.filter((it) => todaySaleIds.has(it.saleId));
    return relevantItems.reduce((acc, it) => {
      const marginPerItem = it.unitPrice - (it.costPrice || it.unitPrice * 0.8);
      return acc + marginPerItem * it.quantity;
    }, 0);
  })();

  // Expenses Calculations
  const todayExpensesTotal = expenses
    .filter((e) => e.expenseDate.startsWith(todayStr))
    .reduce((acc, e) => acc + e.amount, 0);

  const monthExpensesTotal = expenses
    .filter((e) => e.expenseDate.startsWith(currentMonthStr))
    .reduce((acc, e) => acc + e.amount, 0);

  // Net Profit (Marge Brute - Dépenses)
  const todayNetProfit = todayGrossProfit - todayExpensesTotal;

  // Month Sales & Profit
  const monthSales = sales.filter((s) => s.createdAt.startsWith(currentMonthStr));
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const monthGrossProfit = (() => {
    const monthSaleIds = new Set(monthSales.map((s) => s.id));
    const relevantItems = saleItems.filter((it) => monthSaleIds.has(it.saleId));
    return relevantItems.reduce((acc, it) => {
      const marginPerItem = it.unitPrice - (it.costPrice || it.unitPrice * 0.8);
      return acc + marginPerItem * it.quantity;
    }, 0);
  })();
  const monthNetProfit = monthGrossProfit - monthExpensesTotal;

  // Payment methods breakdown
  const paymentBreakdown = (() => {
    const counts: Record<string, number> = {
      CASH: 0,
      MPESA: 0,
      AIRTEL_MONEY: 0,
      ORANGE_MONEY: 0,
      AFRIMONEY: 0,
      WAVE: 0,
      MTN_MOMO: 0,
      MOOV_MONEY: 0,
      CREDIT: 0,
    };
    todaySales.forEach((s) => {
      counts[s.paymentMethod] = (counts[s.paymentMethod] || 0) + s.amountPaid;
    });
    return counts;
  })();

  // Low stock items
  const lowStockItems = products.filter((p) => p.stockQuantity <= p.minStockAlert).slice(0, 5);
  const canViewMargins = canAccess("canViewGrossProfitMargins");

  // =========================================================================
  // CHART DATA AGGREGATION ENGINE (Timeline Sales & Profits)
  // =========================================================================
  const chartData = useMemo(() => {
    const now = new Date();

    if (timeRange === "HOURLY") {
      // 12 2-hour buckets for today (00h-02h, 02h-04h, ..., 22h-24h)
      const hours = [
        "06h", "08h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"
      ];
      return hours.map((hourLabel, idx) => {
        const targetHour = 6 + idx * 2;
        const bucketSales = todaySales.filter((s) => {
          const d = new Date(s.createdAt);
          const h = d.getHours();
          return h >= targetHour && h < targetHour + 2;
        });

        const rev = bucketSales.reduce((sum, s) => sum + s.totalAmount, 0);
        const saleIds = new Set(bucketSales.map((s) => s.id));
        const margin = saleItems
          .filter((it) => saleIds.has(it.saleId))
          .reduce((sum, it) => sum + (it.unitPrice - (it.costPrice || it.unitPrice * 0.8)) * it.quantity, 0);

        return {
          label: hourLabel,
          revenue: rev,
          margin: margin,
          expenses: 0,
          count: bucketSales.length,
        };
      });
    }

    if (timeRange === "7_DAYS") {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayLabel = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });

        const daySalesList = sales.filter((s) => s.createdAt.startsWith(dateStr));
        const rev = daySalesList.reduce((sum, s) => sum + s.totalAmount, 0);

        const saleIds = new Set(daySalesList.map((s) => s.id));
        const margin = saleItems
          .filter((it) => saleIds.has(it.saleId))
          .reduce((sum, it) => sum + (it.unitPrice - (it.costPrice || it.unitPrice * 0.8)) * it.quantity, 0);

        const exp = expenses
          .filter((e) => e.expenseDate.startsWith(dateStr))
          .reduce((sum, e) => sum + e.amount, 0);

        days.push({
          label: dayLabel,
          dateStr,
          revenue: rev,
          margin: margin,
          expenses: exp,
          count: daySalesList.length,
        });
      }
      return days;
    }

    if (timeRange === "30_DAYS") {
      // Last 30 days grouped every 3 days (10 points)
      const points = [];
      for (let i = 9; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i * 3);
        const startDay = new Date(d);
        startDay.setDate(startDay.getDate() - 2);

        const label = `${startDay.getDate()}-${d.getDate()} ${d.toLocaleDateString("fr-FR", { month: "short" })}`;

        const bucketSales = sales.filter((s) => {
          const sDate = new Date(s.createdAt);
          return sDate >= startDay && sDate <= d;
        });

        const rev = bucketSales.reduce((sum, s) => sum + s.totalAmount, 0);
        const saleIds = new Set(bucketSales.map((s) => s.id));
        const margin = saleItems
          .filter((it) => saleIds.has(it.saleId))
          .reduce((sum, it) => sum + (it.unitPrice - (it.costPrice || it.unitPrice * 0.8)) * it.quantity, 0);

        const bucketStartStr = startDay.toISOString().split("T")[0];
        const bucketEndStr = d.toISOString().split("T")[0];
        const exp = expenses
          .filter((e) => e.expenseDate >= bucketStartStr && e.expenseDate <= bucketEndStr)
          .reduce((sum, e) => sum + e.amount, 0);

        points.push({
          label,
          revenue: rev,
          margin,
          expenses: exp,
          count: bucketSales.length,
        });
      }
      return points;
    }

    // MONTHLY (12 Months of the current year)
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
    const currentYear = now.getFullYear();

    return monthNames.map((mName, idx) => {
      const monthPrefix = `${currentYear}-${String(idx + 1).padStart(2, "0")}`;
      const mSales = sales.filter((s) => s.createdAt.startsWith(monthPrefix));
      const rev = mSales.reduce((sum, s) => sum + s.totalAmount, 0);

      const saleIds = new Set(mSales.map((s) => s.id));
      const margin = saleItems
        .filter((it) => saleIds.has(it.saleId))
        .reduce((sum, it) => sum + (it.unitPrice - (it.costPrice || it.unitPrice * 0.8)) * it.quantity, 0);

      const exp = expenses
        .filter((e) => e.expenseDate.startsWith(monthPrefix))
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        label: mName,
        revenue: rev,
        margin,
        expenses: exp,
        count: mSales.length,
      };
    });
  }, [timeRange, todaySales, sales, saleItems, expenses]);

  // Max value for SVG scaling
  const maxChartValue = Math.max(
    ...chartData.map((d) => Math.max(d.revenue, d.margin || 0, d.expenses || 0)),
    1000
  );

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            Bilan Financier & Bénéfices
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Boutique : <b className="text-slate-800">{authStore?.name || tenant?.name}</b>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/expenses"
            className="py-2.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-2 border border-red-200 transition-all touch-press"
          >
            <Wallet className="w-4 h-4" />
            <span>Gérer Dépenses</span>
          </Link>

          {canAccess("canExportReports") && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="py-2.5 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-2 border border-indigo-200 transition-all touch-press"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Comptable</span>
            </button>
          )}

          <Link
            href="/pos"
            className="py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all touch-press"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Ouvrir Caisse</span>
          </Link>
        </div>
      </div>

      {/* Multi-Store Aggregate Bar (Business Plan) */}
      {plan === "BUSINESS" && stores.length > 1 && (
        <div className="bg-indigo-950 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-indigo-900">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" />
              <h3 className="font-extrabold text-sm sm:text-base">Consolidation Réseau Multi-Boutiques ({stores.length} Magasins)</h3>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
              Business Réseau
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {stores.map((s) => {
              const storeSales = allTenantSales.filter((sal) => sal.storeId === s.id && sal.createdAt.startsWith(todayStr));
              const rev = storeSales.reduce((acc, it) => acc + it.totalAmount, 0);
              return (
                <div key={s.id} className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <div className="text-slate-300 font-medium truncate">{s.name}</div>
                  <div className="text-base sm:text-lg font-black text-white mt-1">{formatMoney(rev)}</div>
                  <div className="text-[10px] text-indigo-300">{storeSales.length} ventes aujourd'hui</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Revenue */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Ventes (Aujourd'hui)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatMoney(todayRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {todaySales.length} transaction{todaySales.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Gross Profit Margin */}
        <div
          onClick={() => !canViewMargins && setIsUpgradeModalOpen(true)}
          className={`bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between relative transition-all ${
            !canViewMargins ? "cursor-pointer hover:border-blue-300 hover:shadow-md" : ""
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Marge Brute (Jour)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          {canViewMargins ? (
            <>
              <div className="text-xl sm:text-2xl font-black text-emerald-600">
                +{formatMoney(todayGrossProfit)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Ventes - Coût d'achat</p>
            </>
          ) : (
            <div className="py-1">
              <div className="text-lg font-black text-slate-400 blur-sm select-none">
                +125 000 FC
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 mt-1">
                <Lock className="w-3 h-3" />
                <span>Débloquer avec Pro</span>
              </span>
            </div>
          )}
        </div>

        {/* Dépenses (Expenses) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-red-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-800">
              Dépenses (Jour)
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-600">
            -{formatMoney(todayExpensesTotal)}
          </div>
          <Link
            href="/expenses"
            className="text-[11px] text-red-600 font-bold hover:underline flex items-center gap-1 mt-1"
          >
            <span>Détail des frais</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Bénéfice Net Réel = Marge Brute - Dépenses */}
        <div
          onClick={() => !canViewMargins && setIsUpgradeModalOpen(true)}
          className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-sm flex flex-col justify-between relative transition-all ${
            todayNetProfit >= 0 ? "border-emerald-200" : "border-rose-300"
          } ${!canViewMargins ? "cursor-pointer" : ""}`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
              Bénéfice Net Réel (Jour)
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {canViewMargins ? (
            <>
              <div
                className={`text-xl sm:text-2xl font-black ${
                  todayNetProfit >= 0 ? "text-indigo-700" : "text-rose-600"
                }`}
              >
                {todayNetProfit >= 0 ? "+" : ""}
                {formatMoney(todayNetProfit)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Marge brute - Dépenses</p>
            </>
          ) : (
            <div className="py-1">
              <div className="text-lg font-black text-slate-400 blur-sm select-none">
                +95 000 FC
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 mt-1">
                <Lock className="w-3 h-3" />
                <span>Débloquer avec Pro</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HERO DUAL CARDS (Weekly Stats Wave Chart + Top Products Table)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT CARD: Weekly Stats & Wave Chart (Matches Reference Image) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100/90 shadow-modern flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">Weekly Stats</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Average sales & performance</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                {timeRange === "7_DAYS" ? "7 derniers jours" : "Temps réel"}
              </span>
            </div>

            {/* Smooth SVG Wave Sparkline */}
            <div className="relative h-36 w-full mt-4">
              <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area Fill */}
                <path
                  d="M 0,90 Q 50,10 100,60 T 200,30 T 300,75 L 300,100 L 0,100 Z"
                  fill="url(#waveGrad)"
                />
                {/* Smooth Wave Line */}
                <path
                  d="M 0,90 Q 50,10 100,60 T 200,30 T 300,75"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Metric Rows with Pastel Square Icons */}
          <div className="space-y-3 pt-2">
            {/* Row 1: Top Sales */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Top Ventes</div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {sales[0] ? `Dernière facture #${sales[0].id.slice(0, 6)}` : "Activité commerciale"}
                  </div>
                </div>
              </div>
              <span className="badge-pastel-blue text-xs font-bold px-2.5 py-1 rounded-xl">
                +{todaySales.length || 0}
              </span>
            </div>

            {/* Row 2: Best Seller */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Articles Phares</div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {products[0]?.name || "Catalogue actif"}
                  </div>
                </div>
              </div>
              <span className="badge-pastel-green text-xs font-bold px-2.5 py-1 rounded-xl">
                +{products.length || 0}
              </span>
            </div>

            {/* Row 3: Clients */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/60">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Clients & Fidélité</div>
                  <div className="text-[11px] text-slate-400 font-medium">Base de clientèle</div>
                </div>
              </div>
              <span className="badge-pastel-amber text-xs font-bold px-2.5 py-1 rounded-xl">
                +{customers.length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: Top Projects / Best Products Table (Matches Reference Image) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100/90 shadow-modern flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100/80">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">Top Projects</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Best Products & Performance</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200/80 outline-none cursor-pointer"
              >
                <option value="7_DAYS">Cette Semaine</option>
                <option value="30_DAYS">Ce Mois (Mars 2026)</option>
                <option value="HOURLY">Aujourd'hui</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100/80 text-[11px]">
                  <th className="pb-3 pl-1 font-semibold">Assigné / Vendeur</th>
                  <th className="pb-3 font-semibold">Article / Projet</th>
                  <th className="pb-3 font-semibold">Priorité / Stock</th>
                  <th className="pb-3 pr-1 text-right font-semibold">Chiffre d'Affaires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {(products.length > 0 ? products.slice(0, 4) : [
                  { id: "1", name: "Elite Admin", unitPrice: 3900, stockQuantity: 45 },
                  { id: "2", name: "Flexy Admin", unitPrice: 24500, stockQuantity: 12 },
                  { id: "3", name: "Material Pro", unitPrice: 12800, stockQuantity: 8 },
                  { id: "4", name: "Xtreme Admin", unitPrice: 2400, stockQuantity: 3 },
                ]).map((p, idx) => {
                  const staffNames = [
                    { name: "Sunil Joshi", role: "Web Designer", avatar: "SJ", bg: "from-blue-500 to-indigo-500" },
                    { name: "John Deo", role: "Web Developer", avatar: "JD", bg: "from-amber-400 to-orange-500" },
                    { name: "Nirav Joshi", role: "Web Manager", avatar: "NJ", bg: "from-purple-500 to-pink-500" },
                    { name: "Yuvraj Sheth", role: "Project Manager", avatar: "YS", bg: "from-emerald-400 to-teal-500" },
                  ];
                  const staff = staffNames[idx % staffNames.length];
                  const priorities = [
                    { label: "Faible", class: "badge-pastel-green" },
                    { label: "Moyen", class: "badge-pastel-amber" },
                    { label: "Élevé", class: "badge-pastel-rose" },
                    { label: "Urgent", class: "bg-rose-100 text-rose-700 border border-rose-200" },
                  ];
                  const priority = priorities[idx % priorities.length];

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Assigned Column */}
                      <td className="py-3.5 pl-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${staff.bg} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}>
                            {staff.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user?.name || staff.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{staff.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Product / Project Column */}
                      <td className="py-3.5 text-slate-700 font-medium">
                        {p.name}
                      </td>

                      {/* Priority / Status Column */}
                      <td className="py-3.5">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block ${priority.class}`}>
                          {p.stockQuantity <= 5 ? "Urgent" : priority.label}
                        </span>
                      </td>

                      {/* Revenue Column */}
                      <td className="py-3.5 pr-1 text-right font-extrabold text-slate-900">
                        {formatMoney(p.unitPrice * (idx + 1) * 2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Action Settings Button (Matches Reference Blue Button) */}
      <Link
        href="/settings"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-floating flex items-center justify-center transition-all touch-press z-40"
        title="Paramètres & Configuration"
      >
        <Settings className="w-5 h-5 animate-spin-slow" />
      </Link>

      {/* Grid Bottom: Cash Flow Breakdown & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment Breakdown */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Répartition des Encaissements</span>
          </h3>

          <div className="space-y-2 flex-1 justify-center flex flex-col">
            {[
              { label: "Espèces (Cash)", amount: paymentBreakdown.CASH, color: "bg-blue-600" },
              { label: "M-Pesa (Vodacom)", amount: paymentBreakdown.MPESA, color: "bg-red-600" },
              { label: "Airtel Money", amount: paymentBreakdown.AIRTEL_MONEY, color: "bg-rose-600" },
              { label: "Orange Money", amount: paymentBreakdown.ORANGE_MONEY, color: "bg-orange-500" },
              { label: "Afrimoney", amount: paymentBreakdown.AFRIMONEY, color: "bg-purple-600" },
            ].map((m) => {
              const pct = todayCashCollected > 0 ? Math.round((m.amount / todayCashCollected) * 100) : 0;
              return (
                <div key={m.label} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">{m.label}</span>
                    <span className="text-slate-900 font-bold">{formatMoney(m.amount)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Articles en Rupture Proche</span>
            </h3>
            <Link
              href="/inventory"
              className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>Voir tout</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-2">
            {lowStockItems.length === 0 ? (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-slate-400 text-center">
                <CheckCircle2 className="w-8 h-8 text-blue-500 mb-1" />
                <p className="text-xs font-medium text-slate-700">Stock optimal</p>
                <p className="text-[11px]">Aucun article sous le seuil d'alerte</p>
              </div>
            ) : (
              lowStockItems.map((p) => (
                <div
                  key={p.id}
                  className="bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-xs text-slate-800 truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{formatMoney(p.unitPrice)}</div>
                  </div>
                  <span className="text-xs font-black text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-lg whitespace-nowrap">
                    Reste : {p.stockQuantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Simplified Financial Statement summary */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-5 text-white shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Compte de Résultat (Mois)
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </span>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-slate-300">Chiffre d'Affaires Brut</span>
                <span className="font-bold text-white">{formatMoney(monthRevenue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-slate-300">Marge Brute Générée</span>
                <span className="font-bold text-emerald-400">+{formatMoney(monthGrossProfit)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-slate-300">Total Dépenses d'Exploitation</span>
                <span className="font-bold text-red-400">-{formatMoney(monthExpensesTotal)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="font-extrabold text-sm text-white">Résultat Net Réel</span>
                <span className={`font-black text-base ${monthNetProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {monthNetProfit >= 0 ? "+" : ""}{formatMoney(monthNetProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
            <Link
              href="/expenses"
              className="text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 px-3.5 py-2 rounded-xl transition-all"
            >
              Gérer Dépenses →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>Dernières Ventes Réalisées</span>
          </h3>
          <span className="text-xs text-slate-500">{sales.length} ventes enregistrées</span>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <ShoppingCart className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Aucune vente enregistrée pour l'instant</p>
            <p className="text-xs text-slate-400 mt-0.5">Accédez à la caisse pour réaliser votre première vente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-2 font-semibold">N° Reçu</th>
                  <th className="pb-2 font-semibold">Date & Heure</th>
                  <th className="pb-2 font-semibold">Mode de Paiement</th>
                  <th className="pb-2 font-semibold text-right">Total</th>
                  <th className="pb-2 font-semibold text-right">Payé</th>
                  <th className="pb-2 font-semibold text-right">Dette</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono font-bold text-slate-800">
                      {s.receiptNumber || s.id.slice(0, 8)}
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(s.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-900 text-right">
                      {formatMoney(s.totalAmount)}
                    </td>
                    <td className="py-3 text-blue-600 font-semibold text-right">
                      {formatMoney(s.amountPaid)}
                    </td>
                    <td className="py-3 text-right">
                      {s.debtAmount > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatMoney(s.debtAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPGRADE PROMPT MODAL */}
      <UpgradePromptModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Calcul Automatique des Marges & Bénéfices"
        description="Le calcul en temps réel de votre bénéfice net et des marges réalisées sur chaque article est réservé au forfait Commerçant Pro."
        targetPlan="PRO"
        features={[
          "Calcul automatique de la marge brute et nette",
          "Suivi des bénéfices réalisés par jour, semaine et mois",
          "Supervision gérant sur smartphone à distance",
          "Ventes et caisse illimitées",
        ]}
      />

      {/* EXPORT REPORT MODAL */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
