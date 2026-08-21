"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  Crown,
  Store,
  Calendar,
  DollarSign,
  ChevronRight,
  Flame,
  ArrowUpRight,
  Award,
  Sparkles,
  BarChart3,
  Layers,
  CheckCircle2,
  Package,
  ShoppingBag,
  Coins,
  Globe,
  Wallet,
} from "lucide-react";

export type Timeframe = "DAY" | "WEEK" | "MONTH" | "YEAR";

interface SubscriptionItem {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  createdAt: string;
  tenant?: {
    name: string;
    slug: string;
  };
}

interface MerchantItem {
  rank: number;
  tenantId: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  salesCount: number;
  totalGmv: number;
  avgBasket: number;
  productsCount: number;
  storesCount: number;
}

interface Props {
  subscriptions: SubscriptionItem[];
  topMerchants: MerchantItem[];
  formatMoney: (amount: number, currency?: string) => string;
}

const CURRENCY_INFO: Record<string, { label: string; flag: string; symbol: string }> = {
  ALL: { label: "Toutes les devises", flag: "🌍", symbol: "Devises" },
  CDF: { label: "Franc Congolais (CDF)", flag: "🇨🇩", symbol: "FC" },
  XOF: { label: "Franc CFA UEMOA (XOF)", flag: "🇨🇮", symbol: "FCFA" },
  XAF: { label: "Franc CFA CEMAC (XAF)", flag: "🇨🇲", symbol: "FCFA" },
  USD: { label: "Dollar Américain (USD)", flag: "🇺🇸", symbol: "$" },
  GNF: { label: "Franc Guinéen (GNF)", flag: "🇬🇳", symbol: "FG" },
};

export default function AdminPaymentAnalytics({
  subscriptions,
  topMerchants,
  formatMoney,
}: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>("MONTH");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("ALL");
  const [metricType, setMetricType] = useState<"AMOUNT" | "COUNT">("AMOUNT");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Discover all currencies present in subscriptions
  const availableCurrencies = useMemo(() => {
    const list = new Set<string>();
    subscriptions.forEach((s) => {
      if (s.currency) list.add(s.currency.toUpperCase());
    });
    return Array.from(list);
  }, [subscriptions]);

  // Breakdown of all revenue by currency
  const currencyBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number; plans: Record<string, number> }> = {};

    subscriptions.forEach((s) => {
      const cur = (s.currency || "CDF").toUpperCase();
      if (!map[cur]) {
        map[cur] = { total: 0, count: 0, plans: { BASIC: 0, PRO: 0, BUSINESS: 0 } };
      }
      map[cur].total += s.amount || 0;
      map[cur].count += 1;
      if (map[cur].plans[s.plan] !== undefined) {
        map[cur].plans[s.plan] += 1;
      }
    });

    return map;
  }, [subscriptions]);

  // Filter subscriptions based on selected timeframe and currency
  const filteredData = useMemo(() => {
    const now = new Date();

    return subscriptions.filter((s) => {
      // Currency filter
      if (selectedCurrency !== "ALL" && (s.currency || "CDF").toUpperCase() !== selectedCurrency) {
        return false;
      }

      // Timeframe filter
      const date = new Date(s.createdAt);
      const diffMs = now.getTime() - date.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (timeframe === "DAY") return diffDays <= 1;
      if (timeframe === "WEEK") return diffDays <= 7;
      if (timeframe === "MONTH") return diffDays <= 30;
      if (timeframe === "YEAR") return diffDays <= 365;
      return true;
    });
  }, [subscriptions, timeframe, selectedCurrency]);

  const activeCurrencySymbol =
    selectedCurrency === "ALL" ? "Unités" : CURRENCY_INFO[selectedCurrency]?.symbol || selectedCurrency;

  // Aggregate time series chart buckets
  const chartSeries = useMemo(() => {
    const buckets: Array<{ label: string; amount: number; count: number; dateStr: string }> = [];
    const now = new Date();

    if (timeframe === "DAY") {
      // 6 time blocks across the day (4h intervals)
      for (let i = 5; i >= 0; i--) {
        const hour = (now.getHours() - i * 4 + 24) % 24;
        const label = `${hour.toString().padStart(2, "0")}:00`;
        buckets.push({ label, amount: 0, count: 0, dateStr: label });
      }

      filteredData.forEach((s) => {
        const d = new Date(s.createdAt);
        const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
        const idx = Math.min(5, Math.max(0, Math.floor((24 - diffHours) / 4)));
        if (buckets[idx]) {
          buckets[idx].amount += s.amount || 0;
          buckets[idx].count += 1;
        }
      });
    } else if (timeframe === "WEEK") {
      // 7 days
      const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const label = days[d.getDay()];
        const dateStr = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
        buckets.push({ label, amount: 0, count: 0, dateStr });
      }

      filteredData.forEach((s) => {
        const d = new Date(s.createdAt);
        const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
        const idx = 6 - diffDays;
        if (idx >= 0 && idx < buckets.length) {
          buckets[idx].amount += s.amount || 0;
          buckets[idx].count += 1;
        }
      });
    } else if (timeframe === "MONTH") {
      // 4 weeks of the month
      for (let i = 3; i >= 0; i--) {
        const label = `Semaine ${4 - i}`;
        buckets.push({ label, amount: 0, count: 0, dateStr: label });
      }

      filteredData.forEach((s) => {
        const d = new Date(s.createdAt);
        const diffDays = (now.getTime() - d.getTime()) / 86400000;
        const idx = Math.min(3, Math.max(0, Math.floor((30 - diffDays) / 7.5)));
        if (buckets[idx]) {
          buckets[idx].amount += s.amount || 0;
          buckets[idx].count += 1;
        }
      });
    } else {
      // 12 Months
      const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = months[d.getMonth()];
        const dateStr = `${label} ${d.getFullYear()}`;
        buckets.push({ label, amount: 0, count: 0, dateStr });
      }

      filteredData.forEach((s) => {
        const d = new Date(s.createdAt);
        const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        const idx = 11 - monthDiff;
        if (idx >= 0 && idx < buckets.length) {
          buckets[idx].amount += s.amount || 0;
          buckets[idx].count += 1;
        }
      });
    }

    return buckets;
  }, [filteredData, timeframe]);

  // Max value for SVG scale
  const maxMetricValue = useMemo(() => {
    const values = chartSeries.map((b) => (metricType === "AMOUNT" ? b.amount : b.count));
    const max = Math.max(...values, 1);
    return max * 1.15; // 15% top padding
  }, [chartSeries, metricType]);

  // Compute Best Selling Plan (Section Plan le plus vendu)
  const bestSellingPlanStats = useMemo(() => {
    const planCounts: Record<string, { count: number; totalAmount: number }> = {
      BUSINESS: { count: 0, totalAmount: 0 },
      PRO: { count: 0, totalAmount: 0 },
      BASIC: { count: 0, totalAmount: 0 },
      FREE: { count: 0, totalAmount: 0 },
    };

    const targetList = filteredData.length > 0 ? filteredData : subscriptions;

    targetList.forEach((s) => {
      if (planCounts[s.plan]) {
        planCounts[s.plan].count += 1;
        planCounts[s.plan].totalAmount += s.amount || 0;
      }
    });

    const totalSubs = Object.values(planCounts).reduce((acc, p) => acc + p.count, 0) || 1;

    let bestPlan = "PRO";
    let highestScore = -1;

    Object.entries(planCounts).forEach(([planKey, val]) => {
      const score = val.count * 10000 + val.totalAmount;
      if (score > highestScore && val.count > 0) {
        highestScore = score;
        bestPlan = planKey;
      }
    });

    const bestData = planCounts[bestPlan];
    const percentage = Math.round((bestData.count / totalSubs) * 100);

    return {
      bestPlan,
      bestData,
      percentage,
      totalSubs,
      allPlans: planCounts,
    };
  }, [filteredData, subscriptions]);

  // Top Performing Merchant #1
  const topRank1Merchant = topMerchants[0] || null;

  return (
    <div className="space-y-6">
      {/* 0. Multi-Currency Summary Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Paiements des Forfaits par Devise
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            {Object.keys(currencyBreakdown).length} devise(s) active(s)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* All Currencies Pill */}
          <button
            type="button"
            onClick={() => setSelectedCurrency("ALL")}
            className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
              selectedCurrency === "ALL"
                ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/30"
                : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span>🌍 Toutes Devises</span>
              {selectedCurrency === "ALL" && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
            <div className="text-base font-black font-mono">
              {subscriptions.length} <span className="text-xs font-normal">paiements</span>
            </div>
            <span className="text-[10px] opacity-80 block mt-0.5">Vue globale consolidée</span>
          </button>

          {/* Individual Currencies */}
          {Object.entries(currencyBreakdown).map(([cur, data]) => {
            const isSelected = selectedCurrency === cur;
            const info = CURRENCY_INFO[cur] || { flag: "💵", symbol: cur, label: cur };

            return (
              <button
                type="button"
                key={cur}
                onClick={() => setSelectedCurrency(cur)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/30"
                    : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <span>{info.flag}</span>
                    <span>{cur}</span>
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </div>

                <div className="text-base font-black font-mono">
                  {data.total.toLocaleString("fr-FR")} {info.symbol}
                </div>

                <div className="text-[10px] opacity-80 flex items-center justify-between mt-0.5">
                  <span>{data.count} abonnement(s)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Main Analytics & Graph Header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold mb-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analyse Graphique des Encaissements SaaS</span>
            </div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span>Évolution des Paiements</span>
              <span className="text-sm px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                {selectedCurrency === "ALL" ? "Toutes Devises" : `${selectedCurrency} (${CURRENCY_INFO[selectedCurrency]?.symbol || ""})`}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Graphique temps réel des revenus d'abonnements générés par les boutiques.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Toggle */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => setMetricType("AMOUNT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  metricType === "AMOUNT"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Montant ({activeCurrencySymbol})
              </button>
              <button
                onClick={() => setMetricType("COUNT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  metricType === "COUNT"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Volume (Nb)
              </button>
            </div>

            {/* Timeframe Selector */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              {(["DAY", "WEEK", "MONTH", "YEAR"] as Timeframe[]).map((tf) => {
                const labels: Record<Timeframe, string> = {
                  DAY: "Jour",
                  WEEK: "Semaine",
                  MONTH: "Mois",
                  YEAR: "Année",
                };
                const isActive = timeframe === tf;
                return (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {labels[tf]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Modern Interactive SVG Line/Bar Chart */}
        <div className="pt-6">
          <div className="h-64 sm:h-72 w-full relative">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 700 240"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="adminChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#6366f1" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="adminLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 60, 120, 180].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="700"
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                  opacity="0.4"
                />
              ))}

              {/* Area & Polyline */}
              {chartSeries.length > 1 && (
                <>
                  {/* Area Fill */}
                  <polygon
                    points={`
                      0,200 
                      ${chartSeries
                        .map((b, i) => {
                          const x = (i / (chartSeries.length - 1)) * 700;
                          const val = metricType === "AMOUNT" ? b.amount : b.count;
                          const y = 200 - (val / maxMetricValue) * 180;
                          return `${x},${y}`;
                        })
                        .join(" ")} 
                      700,200
                    `}
                    fill="url(#adminChartGradient)"
                  />

                  {/* Smooth Line */}
                  <polyline
                    fill="none"
                    stroke="url(#adminLineGradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartSeries
                      .map((b, i) => {
                        const x = (i / (chartSeries.length - 1)) * 700;
                        const val = metricType === "AMOUNT" ? b.amount : b.count;
                        const y = 200 - (val / maxMetricValue) * 180;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  {/* Interactive Points */}
                  {chartSeries.map((b, i) => {
                    const x = (i / (chartSeries.length - 1)) * 700;
                    const val = metricType === "AMOUNT" ? b.amount : b.count;
                    const y = 200 - (val / maxMetricValue) * 180;
                    const isHovered = hoveredPointIndex === i;

                    return (
                      <g key={i} className="cursor-pointer">
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? "7" : "4.5"}
                          className={`transition-all duration-200 ${
                            isHovered
                              ? "fill-white stroke-blue-500 stroke-[3]"
                              : "fill-blue-500 stroke-slate-900 stroke-2"
                          }`}
                          onMouseEnter={() => setHoveredPointIndex(i)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                        />

                        {/* Interactive Tooltip on Hover */}
                        {isHovered && (
                          <g>
                            <rect
                              x={Math.max(10, Math.min(580, x - 60))}
                              y={Math.max(10, y - 50)}
                              width="120"
                              height="40"
                              rx="8"
                              fill="#0f172a"
                              stroke="#475569"
                              strokeWidth="1"
                              className="shadow-xl"
                            />
                            <text
                              x={Math.max(70, Math.min(640, x))}
                              y={Math.max(26, y - 34)}
                              textAnchor="middle"
                              fill="#94a3b8"
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {b.dateStr}
                            </text>
                            <text
                              x={Math.max(70, Math.min(640, x))}
                              y={Math.max(42, y - 18)}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="12"
                              fontWeight="900"
                              fontFamily="monospace"
                            >
                              {metricType === "AMOUNT"
                                ? `${b.amount.toLocaleString("fr-FR")} ${activeCurrencySymbol}`
                                : `${b.count} souscription(s)`}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 pt-3 px-1">
            {chartSeries.map((b, i) => (
              <span key={i} className="text-center">
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Two Special Focus Cards: "Plan le Plus Vendu" & "Commerce avec le Plus de Ventes" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Focus 1: Plan le Plus Vendu */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 rounded-3xl p-6 border border-indigo-500/20 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Forfait N°1 le Plus Vendu
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {timeframe === "DAY" ? "Aujourd'hui" : timeframe === "WEEK" ? "Cette Semaine" : timeframe === "MONTH" ? "Ce Mois" : "Cette Année"}
              </span>
            </div>

            <div>
              <h4 className="text-2xl font-black text-white flex items-center gap-2">
                <span>
                  {bestSellingPlanStats.bestPlan === "PRO" && "Commerçant Pro"}
                  {bestSellingPlanStats.bestPlan === "BUSINESS" && "Business Multi-Magasins"}
                  {bestSellingPlanStats.bestPlan === "BASIC" && "Commerçant Basic"}
                  {bestSellingPlanStats.bestPlan === "FREE" && "Découverte Gratuit"}
                </span>
                <Crown className="w-5 h-5 text-amber-400 shrink-0" />
              </h4>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-400 font-mono">
                  {bestSellingPlanStats.percentage}%
                </span>
                <span className="text-xs text-slate-300">
                  des abonnements enregistrés ({bestSellingPlanStats.bestData.count} sur {bestSellingPlanStats.totalSubs})
                </span>
              </div>
            </div>

            {/* Distribution bars */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">Répartition par Forfaits</span>
                <span className="text-slate-400 font-mono">
                  Total : {bestSellingPlanStats.bestData.totalAmount.toLocaleString("fr-FR")} {activeCurrencySymbol}
                </span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-3 flex overflow-hidden p-0.5 gap-0.5">
                <div
                  style={{
                    width: `${Math.round(
                      (bestSellingPlanStats.allPlans.PRO.count / bestSellingPlanStats.totalSubs) * 100
                    )}%`,
                  }}
                  className="bg-blue-500 rounded-l-full"
                  title={`Pro: ${bestSellingPlanStats.allPlans.PRO.count}`}
                />
                <div
                  style={{
                    width: `${Math.round(
                      (bestSellingPlanStats.allPlans.BUSINESS.count / bestSellingPlanStats.totalSubs) * 100
                    )}%`,
                  }}
                  className="bg-indigo-500"
                  title={`Business: ${bestSellingPlanStats.allPlans.BUSINESS.count}`}
                />
                <div
                  style={{
                    width: `${Math.round(
                      (bestSellingPlanStats.allPlans.BASIC.count / bestSellingPlanStats.totalSubs) * 100
                    )}%`,
                  }}
                  className="bg-emerald-500 rounded-r-full"
                  title={`Basic: ${bestSellingPlanStats.allPlans.BASIC.count}`}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Pro ({bestSellingPlanStats.allPlans.PRO.count})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> Business ({bestSellingPlanStats.allPlans.BUSINESS.count})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Basic ({bestSellingPlanStats.allPlans.BASIC.count})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Focus 2: Commerce avec le Plus de Ventes */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 border border-emerald-500/20 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Commerce N°1 des Ventes (GMV)
              </span>
              <span className="text-xs text-slate-400 font-bold">Top Performance</span>
            </div>

            {topRank1Merchant ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-2xl font-black text-white flex items-center gap-2">
                      <span>{topRank1Merchant.name}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                        Forfait {topRank1Merchant.plan}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      ID: {topRank1Merchant.tenantId.substring(0, 12)}...
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 font-bold block">Volume Total Encaissé</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {topRank1Merchant.totalGmv.toLocaleString("fr-FR")} FC
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 font-bold block">Nombre de Ventes</span>
                    <span className="text-lg font-black text-white font-mono">
                      {topRank1Merchant.salesCount} tickets
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                  <span>Panier Moyen : <b>{topRank1Merchant.avgBasket.toLocaleString("fr-FR")} FC</b></span>
                  <span>Articles au catalogue : <b>{topRank1Merchant.productsCount}</b></span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                Aucune vente enregistrée pour le moment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
