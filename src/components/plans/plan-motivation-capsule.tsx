"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import { getPlanPriceInfo } from "@/lib/constants/plans";
import { PLAN_CONFIGS } from "@/lib/shared/types";
import {
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowRight,
  Crown,
} from "lucide-react";

export function PlanMotivationCapsule() {
  const pathname = usePathname();
  const { tenant, plan, isAuthenticated } = useAuth();
  const { rawCurrency } = useSync();
  const [isDismissed, setIsDismissed] = useState(false);
  // Default to collapsed in POS so it never blocks the checkout button
  const isPosPage = pathname === "/pos";
  const [isCollapsed, setIsCollapsed] = useState(isPosPage);

  // Count sales made this month for quota check
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const monthlySalesCount =
    useLiveQuery(
      async () => {
        if (!tenant?.id) return 0;
        return await db.sales
          .filter((s) => (s.tenantId === tenant.id || !s.tenantId) && s.createdAt >= startOfMonth)
          .count();
      },
      [tenant?.id, startOfMonth]
    ) || 0;

  // Don't show on admin, landing, auth pages, billing, or if dismissed
  if (
    !isAuthenticated ||
    isDismissed ||
    pathname === "/" ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/auth") ||
    pathname === "/billing"
  ) {
    return null;
  }

  const currentConfig = PLAN_CONFIGS[plan] || PLAN_CONFIGS.FREE;
  const maxSales = currentConfig.maxSalesPerMonth;
  const percentUsed = maxSales ? Math.min(Math.round((monthlySalesCount / maxSales) * 100), 100) : 0;

  // Target next plan
  const nextPlan = plan === "FREE" ? "BASIC" : plan === "BASIC" ? "PRO" : plan === "PRO" ? "BUSINESS" : null;
  if (!nextPlan) return null; // Already on top business plan

  const nextConfig = PLAN_CONFIGS[nextPlan];
  const nextPriceInfo = getPlanPriceInfo(nextPlan, rawCurrency);

  return (
    <aside
      aria-label="Statut Forfait et Quotas"
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 font-sans pointer-events-auto"
    >
      {isCollapsed ? (
        /* Retracted Tab on Right Edge */
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="bg-slate-950/95 hover:bg-slate-900 text-white pl-3.5 pr-2 py-3 rounded-l-2xl shadow-2xl border-y border-l border-slate-700/80 backdrop-blur-md flex items-center gap-2 transition-all hover:translate-x-[-4px] group"
          title="Ouvrir le suivi de forfait et quotas"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          </div>

          <div className="flex flex-col text-left pr-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-blue-400 transition-colors">
              Forfait
            </span>
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
              {currentConfig.name}
            </span>
          </div>

          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <ChevronLeft className="w-3.5 h-3.5" />
          </div>
        </button>
      ) : (
        /* Expanded Floating Card at Right-Middle */
        <div className="mr-3 sm:mr-4 w-[310px] sm:w-[340px] bg-slate-950/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-slate-800 text-xs space-y-3 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2 font-black text-slate-100">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-black">Forfait {currentConfig.name}</span>
                <span className="block text-[10px] text-slate-400 font-normal">Quota & Évolution</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Retract to the right */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-medium"
                title="Rétracter sur le côté droit"
              >
                <span className="hidden sm:inline text-[10px]">Rétracter</span>
                <ChevronRight className="w-4 h-4 text-blue-400" />
              </button>

              {/* Dismiss */}
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title="Masquer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Usage Quota Bar (if limited) */}
          {maxSales ? (
            <div className="space-y-1.5 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Ventes ce mois :</span>
                <span className="font-bold text-sky-400 font-mono">
                  {monthlySalesCount} / {maxSales} ({percentUsed}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    percentUsed > 80 ? "bg-amber-500" : "bg-gradient-to-r from-blue-500 to-emerald-400"
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-emerald-400 bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-500/20 font-medium">
              ✨ Ventes et encaissements illimités sur votre compte.
            </div>
          )}

          {/* Value Prop for next tier */}
          <div className="p-2.5 bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900 rounded-2xl border border-blue-500/20 text-[11px] text-slate-200 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="leading-snug">
              {nextPlan === "BASIC" && `Passez au Basic (${nextPriceInfo.formatted}) : 1 000 ventes & 10 caissiers.`}
              {nextPlan === "PRO" && `Passez au Pro (${nextPriceInfo.formatted}) : Ventes illimitées & WhatsApp auto.`}
              {nextPlan === "BUSINESS" && `Passez au Business (${nextPriceInfo.formatted}) : Multi-Commerces & Dépôts.`}
            </span>
          </div>

          {/* CTA */}
          <Link
            href="/billing"
            className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-center flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all touch-press"
          >
            <span>Passer à {nextConfig.name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </aside>
  );
}
