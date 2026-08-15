"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie-db";
import { PLAN_CONFIGS } from "@/lib/shared/types";
import {
  Sparkles,
  Zap,
  ChevronUp,
  ChevronDown,
  X,
  ArrowRight,
  TrendingUp,
  Crown,
  Lock,
} from "lucide-react";

export function PlanMotivationCapsule() {
  const pathname = usePathname();
  const { tenant, plan, isOwner, isAuthenticated } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  // Don't show on admin, landing or auth pages, or if dismissed
  if (!isAuthenticated || isDismissed || pathname === "/" || pathname?.startsWith("/admin") || pathname?.startsWith("/auth") || pathname === "/billing") {
    return null;
  }

  const currentConfig = PLAN_CONFIGS[plan] || PLAN_CONFIGS.FREE;
  const maxSales = currentConfig.maxSalesPerMonth;
  const percentUsed = maxSales ? Math.min(Math.round((monthlySalesCount / maxSales) * 100), 100) : 0;

  // Target next plan
  const nextPlan = plan === "FREE" ? "BASIC" : plan === "BASIC" ? "PRO" : plan === "PRO" ? "BUSINESS" : null;
  if (!nextPlan) return null; // Already on top business plan

  const nextConfig = PLAN_CONFIGS[nextPlan];

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-in slide-in-from-bottom duration-300 font-sans">
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 rounded-full shadow-xl flex items-center gap-2 hover:scale-105 transition-all text-xs font-bold border border-white/20"
          title="Voir votre statut Forfait & Quota"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="hidden sm:inline">Statut Forfait : {currentConfig.name}</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-800 max-w-xs sm:max-w-sm w-full text-xs space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-black text-slate-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Forfait {currentConfig.name}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                title="Réduire"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                title="Fermer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Usage Quota Bar (if limited) */}
          {maxSales ? (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Ventes ce mois :</span>
                <span className="font-bold text-sky-400">
                  {monthlySalesCount} / {maxSales} ({percentUsed}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    percentUsed > 80 ? "bg-amber-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">
              Ventes illimitées actives sur ce terminal.
            </div>
          )}

          {/* Value Prop for next tier */}
          <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-[11px] text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {nextPlan === "BASIC" && "Passez au Basic (15.000 FC) : 1 000 ventes & 10 caissiers."}
              {nextPlan === "PRO" && "Passez au Pro (30.000 FC) : Ventes illimitées & WhatsApp auto."}
              {nextPlan === "BUSINESS" && "Passez au Business (60.000 FC) : Multi-Boutiques & Dépôts."}
            </span>
          </div>

          {/* CTA */}
          <Link
            href="/billing"
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-center flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all touch-press"
          >
            <span>Passer à {nextConfig.name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
