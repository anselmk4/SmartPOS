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

export default function AdminPaymentAnalytics({
  subscriptions,
  topMerchants,
  formatMoney,
}: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>("MONTH");
  const [metricType, setMetricType] = useState<"AMOUNT" | "COUNT">("AMOUNT");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Filter subscriptions based on selected timeframe
  const filteredData = useMemo(() => {
    const now = new Date();

    return subscriptions.filter((s) => {
      const date = new Date(s.createdAt);
      const diffMs = now.getTime() - date.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (timeframe === "DAY") return diffDays <= 1;
      if (timeframe === "WEEK") return diffDays <= 7;
      if (timeframe === "MONTH") return diffDays <= 30;
      if (timeframe === "YEAR") return diffDays <= 365;
      return true;
    });
  }, [subscriptions, timeframe]);

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
      // Weighted score: count * 1000 + totalAmount
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
      {/* 1. Main Analytics & Graph Header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold mb-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analyse Graphique des Encaissements SaaS</span>
            </div>
            <h3 className="text-xl font-black text-white">
              Évolution des Paiements d'Abonnements par Période
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Graphique temps réel des revenus souscriptions générés par les commerces.
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
                Revenus (CDF)
              </button>
              <button
                onClick={() => setMetricType("COUNT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  metricType === "COUNT"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Nb Transactions
              </button>
            </div>

            {/* Timeframe Buttons */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              {(
                [
                  { key: "DAY", label: "Jour" },
                  { key: "WEEK", label: "Semaine" },
                  { key: "MONTH", label: "Mois" },
                  { key: "YEAR", label: "Année" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTimeframe(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    timeframe === t.key
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Interactive SVG Area/Bar Graph */}
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold">
              Volume total ({timeframe.toLowerCase()}) :{" "}
              <b className="text-white">
                {metricType === "AMOUNT"
                  ? formatMoney(filteredData.reduce((acc, s) => acc + (s.amount || 0), 0))
                  : `${filteredData.length} transaction(s)`}
              </b>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Survolez les colonnes pour inspecter
            </span>
          </div>

          <div className="relative h-64 w-full bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between overflow-hidden">
            {/* Grid horizontal lines */}
            <div className="absolute inset-0 px-4 py-6 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-dashed border-slate-600 w-full" />
              <div className="border-b border-dashed border-slate-600 w-full" />
              <div className="border-b border-dashed border-slate-600 w-full" />
              <div className="border-b border-dashed border-slate-600 w-full" />
            </div>

            {/* Bars & Interactive Columns */}
            <div className="relative z-10 flex-1 flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6">
              {chartSeries.map((bucket, idx) => {
                const val = metricType === "AMOUNT" ? bucket.amount : bucket.count;
                const heightPercent = Math.min(100, Math.max(8, (val / maxMetricValue) * 100));
                const isHovered = hoveredPointIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-12 z-30 bg-slate-800 text-white text-[11px] px-3 py-1.5 rounded-xl border border-slate-700 shadow-2xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                        <div className="font-bold">{bucket.dateStr}</div>
                        <div className="text-emerald-400 font-mono font-black">
                          {formatMoney(bucket.amount)} • {bucket.count} souscription(s)
                        </div>
                      </div>
                    )}

                    {/* Value Badge above Bar on high value */}
                    {val > 0 && !isHovered && (
                      <span className="text-[10px] font-mono text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {metricType === "AMOUNT" ? `${Math.round(val / 1000)}k` : val}
                      </span>
                    )}

                    {/* Animated Bar with Gradient */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                        isHovered
                          ? "bg-gradient-to-t from-blue-600 via-indigo-500 to-emerald-400 shadow-lg shadow-indigo-500/40"
                          : val > 0
                          ? "bg-gradient-to-t from-blue-700/80 to-indigo-500 hover:from-blue-600 hover:to-indigo-400"
                          : "bg-slate-800/40"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Bottom X-Axis Labels */}
            <div className="relative z-10 flex items-center justify-between gap-2 px-2 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
              {chartSeries.map((bucket, idx) => (
                <div
                  key={idx}
                  className={`flex-1 text-center truncate ${
                    hoveredPointIndex === idx ? "text-white font-bold" : ""
                  }`}
                >
                  {bucket.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TWO COLUMNS: BEST-SELLING PLAN & TOP MERCHANT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* LEFT: PLAN LE PLUS VENDU SELON LE TEMPS (5 Cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                <Crown className="w-3.5 h-3.5" />
                <span>Performance des Forfaits</span>
              </div>

              <span className="text-[11px] text-slate-400 font-mono uppercase font-bold">
                Filtre : {timeframe}
              </span>
            </div>

            <h3 className="text-lg font-black text-white mb-1">
              Forfait le Plus Vendu
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Plan générant la plus forte adoption et le plus grand volume d'encaissement.
            </p>

            {/* Star Plan Hero Box */}
            <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-800/80 p-5 rounded-2xl border border-blue-500/30 relative mb-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
                    Leader du Réseau
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 flex items-center gap-2">
                    <span>Plan {bestSellingPlanStats.bestPlan}</span>
                    <Flame className="w-6 h-6 text-amber-400" />
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">
                    {bestSellingPlanStats.percentage}%
                  </div>
                  <span className="text-[10px] text-slate-400">Part de marché</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-blue-500/20 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Souscriptions :</span>
                  <div className="font-bold text-white">
                    {bestSellingPlanStats.bestData.count} contrat(s)
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Volume Encaissé :</span>
                  <div className="font-bold text-emerald-400 font-mono">
                    {formatMoney(bestSellingPlanStats.bestData.totalAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Ranking of all plans */}
            <div className="space-y-2.5">
              {[
                { key: "BUSINESS", name: "BUSINESS", desc: "45 000 CDF / mois", color: "bg-indigo-500" },
                { key: "PRO", name: "PRO", desc: "15 000 CDF / mois", color: "bg-blue-500" },
                { key: "BASIC", name: "BASIC", desc: "5 000 CDF / mois", color: "bg-emerald-500" },
                { key: "FREE", name: "FREE (Gratuit)", desc: "Découverte", color: "bg-slate-600" },
              ].map((p) => {
                const item = bestSellingPlanStats.allPlans[p.key] || { count: 0, totalAmount: 0 };
                const pct = bestSellingPlanStats.totalSubs > 0
                  ? Math.round((item.count / bestSellingPlanStats.totalSubs) * 100)
                  : 0;

                return (
                  <div
                    key={p.key}
                    className="bg-slate-800/40 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white">{p.name}</span>
                        <span className="text-slate-400 font-mono">
                          {item.count} vente(s) • {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full ${p.color}`}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-emerald-400">
                        {formatMoney(item.totalAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/admin/subscriptions"
            className="mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Gérer tous les abonnements</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ========================================================= */}
        {/* RIGHT: LE COMMERCE AVEC PLUS DE VENTES (7 Cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold mb-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Classement des Commerces</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Commerces avec le Plus de Ventes (Top GMV)
                </h3>
                <p className="text-xs text-slate-400">
                  Boutiques générant le plus de volume d'affaires et de transactions caisse.
                </p>
              </div>

              <Link
                href="/admin/tenants"
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
              >
                <span>Voir les boutiques</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* #1 Top Merchant Highlight */}
            {topRank1Merchant && (
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-800 to-indigo-950/30 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-xl shrink-0 shadow-lg">
                    🥇
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-white text-base truncate max-w-[200px] sm:max-w-[260px]">
                        {topRank1Merchant.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/20 text-blue-300">
                        {topRank1Merchant.plan}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {topRank1Merchant.storesCount} point(s) de vente • {topRank1Merchant.productsCount} articles référencés
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Volume Total GMV
                  </span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {formatMoney(topRank1Merchant.totalGmv)}
                  </span>
                  <span className="text-[11px] text-slate-300 block font-semibold">
                    {topRank1Merchant.salesCount} vente(s) enregistrée(s)
                  </span>
                </div>
              </div>
            )}

            {/* Leaderboard Table / Cards */}
            <div className="space-y-2">
              {topMerchants.slice(0, 5).map((m, idx) => {
                const rankMedal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                const topGmv = topMerchants[0]?.totalGmv || 1;
                const progressPct = Math.max(5, Math.min(100, Math.round((m.totalGmv / topGmv) * 100)));

                return (
                  <div
                    key={m.tenantId}
                    className="bg-slate-800/50 hover:bg-slate-800 p-3 rounded-2xl border border-slate-700/50 transition-colors flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="font-black text-sm w-7 text-center shrink-0">
                        {rankMedal}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate">{m.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300">
                            {m.plan}
                          </span>
                        </div>
                        <div className="w-full bg-slate-700/60 rounded-full h-1 mt-1.5 overflow-hidden">
                          <div
                            style={{ width: `${progressPct}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-emerald-400 font-mono">
                        {formatMoney(m.totalGmv)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {m.salesCount} vente(s) • Panier: {formatMoney(m.avgBasket)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/admin/tenants"
            className="mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Accéder à toutes les boutiques ({topMerchants.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
