"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie-db";
import { getPlanPriceInfo, getTenantTrialInfo } from "@/lib/constants/plans";
import { PLAN_CONFIGS, type SubscriptionPlan } from "@/lib/shared/types";
import { PawaPayModal } from "@/components/billing/pawapay-modal";
import {
  Lock,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Coins,
  ArrowDownCircle,
  RefreshCw,
  Smartphone,
  Calendar,
  Clock,
} from "lucide-react";

export function PlanPaymentGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenant, user, isAuthenticated, updateTenantPlan } = useAuth();
  const { rawCurrency } = useSync();

  const [selectedPlanToPay, setSelectedPlanToPay] = useState<SubscriptionPlan>("PRO");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);

  // Check if active subscription exists in Dexie
  const activeSubscription = useLiveQuery(
    async () => {
      try {
        if (typeof window === "undefined" || !tenant?.id) return null;
        const now = new Date().toISOString();
        return await db.subscriptions
          .where("tenantId")
          .equals(tenant.id)
          .filter((s) => s.paymentStatus === "ACTIVE" && (!s.periodEnd || s.periodEnd >= now))
          .first();
      } catch {
        return null;
      }
    },
    [tenant?.id]
  );

  // If active subscription found locally, ensure tenant planStatus is synced to ACTIVE
  useEffect(() => {
    if (activeSubscription && tenant && tenant.planStatus !== "ACTIVE") {
      updateTenantPlan(activeSubscription.plan || tenant.plan);
    }
  }, [activeSubscription, tenant, updateTenantPlan]);

  // Sync selectedPlanToPay when tenant plan changes
  useEffect(() => {
    if (tenant?.plan && tenant.plan !== "FREE") {
      setSelectedPlanToPay(tenant.plan);
    }
  }, [tenant?.plan]);

  // Exempt public pages, admin, auth, and billing
  const isExemptPath =
    pathname === "/" ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/auth") ||
    pathname === "/billing";

  // Check trial and payment status
  const trialInfo = getTenantTrialInfo(tenant, Boolean(activeSubscription));
  const { isFreePlan, isTrialExpired, isPaymentRequired, formattedExpiry } = trialInfo;

  const currentPlan = tenant?.plan || "FREE";
  const planConfig = PLAN_CONFIGS[selectedPlanToPay] || PLAN_CONFIGS.PRO;
  const priceInfo = getPlanPriceInfo(selectedPlanToPay, rawCurrency || tenant?.currency || "CDF");

  // If authenticated, not exempt, and payment is required (7-day trial expired or paid plan pending)
  if (!isAuthenticated || isExemptPath || !isPaymentRequired) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Blurred background preview */}
      <div className="absolute inset-0 filter blur-md opacity-30 pointer-events-none overflow-hidden select-none">
        {children}
      </div>

      {/* Blocking Gateway Card */}
      <div className="relative z-30 max-w-lg w-full bg-slate-950/95 text-white border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 animate-in zoom-in-95 duration-300">
        {/* Top Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-black uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>
              {isTrialExpired
                ? "Période d'Essai de 7 Jours Expirée"
                : "Paiement Requis pour Activer l'Accès"}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isTrialExpired
              ? "Souscrivez à un forfait pour continuer"
              : `Activez votre Forfait ${planConfig.name}`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
            {isTrialExpired
              ? `Votre période d'essai gratuit de 7 jours est arrivée à expiration. Pour continuer à encaisser et piloter votre boutique "${tenant?.name || ""}", veuillez régler votre abonnement.`
              : "Pour débloquer l'accès à la caisse tactile et au tableau de bord, veuillez effectuer le règlement de votre forfait."}
          </p>
        </div>

        {/* Plan Selector if Free or expired */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Choisissez votre Forfait :
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "BASIC" as SubscriptionPlan, name: "Basic", tag: "15 000 FC" },
              { id: "PRO" as SubscriptionPlan, name: "Pro", tag: "30 000 FC", popular: true },
              { id: "BUSINESS" as SubscriptionPlan, name: "Business", tag: "100 000 FC" },
            ].map((p) => {
              const isSelected = selectedPlanToPay === p.id;
              const pPrice = getPlanPriceInfo(p.id, rawCurrency || tenant?.currency || "CDF");
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlanToPay(p.id)}
                  className={`p-3 rounded-2xl border text-center transition-all relative ${
                    isSelected
                      ? "bg-blue-600/30 border-blue-500 ring-2 ring-blue-500/50 text-white shadow-lg"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                      Recommandé
                    </span>
                  )}
                  <span className="block text-xs font-black">{p.name}</span>
                  <span className="block text-[10px] font-bold mt-0.5 text-sky-400 font-mono">
                    {pPrice.formatted}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Plan Summary Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">
              Forfait Sélectionné
            </span>
            <div className="text-base sm:text-lg font-black text-white">
              {planConfig.name}
            </div>
            <span className="text-xs font-mono font-bold text-sky-300">
              {priceInfo.formatted} / mois
            </span>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-black shadow-sm">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              Accès Immédiat
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {/* Primary: Pay with Mobile Money */}
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 touch-press"
          >
            <Smartphone className="w-4 h-4 text-white" />
            <span>Payer {priceInfo.formatted} par Mobile Money</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary: View detailed plans & billing */}
          <Link
            href="/billing"
            className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-2 text-center"
          >
            <span>Consulter le comparatif détaillé & factures sur la page Forfaits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Paiement sécurisé instantané PawaPay (M-Pesa, Airtel, Orange, Afrimoney)</span>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PawaPayModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          plan={selectedPlanToPay}
          onSuccess={async (paidPlan) => {
            setIsPaymentModalOpen(false);
            await updateTenantPlan(paidPlan);
          }}
        />
      )}
    </div>
  );
}
