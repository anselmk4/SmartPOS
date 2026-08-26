"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie-db";
import { getPlanPriceInfo } from "@/lib/constants/plans";
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
} from "lucide-react";

export function PlanPaymentGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenant, user, isAuthenticated, updateTenantPlan } = useAuth();
  const { rawCurrency } = useSync();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);

  // Check if active subscription exists in Dexie
  const activeSubscription = useLiveQuery(
    async () => {
      if (!tenant?.id) return null;
      const now = new Date().toISOString();
      return await db.subscriptions
        .where("tenantId")
        .equals(tenant.id)
        .filter((s) => s.paymentStatus === "ACTIVE" && (!s.periodEnd || s.periodEnd >= now))
        .first();
    },
    [tenant?.id]
  );

  // If active subscription found locally, ensure tenant planStatus is synced to ACTIVE
  useEffect(() => {
    if (activeSubscription && tenant && tenant.planStatus !== "ACTIVE") {
      updateTenantPlan(activeSubscription.plan || tenant.plan);
    }
  }, [activeSubscription, tenant, updateTenantPlan]);

  // Exempt public pages, admin, auth, and billing
  const isExemptPath =
    pathname === "/" ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/auth") ||
    pathname === "/billing";

  // Check if tenant has a paid plan awaiting payment
  const currentPlan = tenant?.plan || "FREE";
  const planStatus = tenant?.planStatus || "ACTIVE";
  const isPaidPlan = currentPlan === "BASIC" || currentPlan === "PRO" || currentPlan === "BUSINESS";
  const hasActivePayment = Boolean(activeSubscription);
  const isPaymentPending = isPaidPlan && planStatus !== "ACTIVE" && !hasActivePayment;

  const handleDowngradeToFree = async () => {
    if (!tenant) return;
    setIsDowngrading(true);
    try {
      await updateTenantPlan("FREE");
      setIsPaymentModalOpen(false);
    } catch (err) {
      console.error("Failed to downgrade plan:", err);
    } finally {
      setIsDowngrading(false);
    }
  };

  if (!isAuthenticated || isExemptPath || !isPaymentPending) {
    return <>{children}</>;
  }

  const planConfig = PLAN_CONFIGS[currentPlan] || PLAN_CONFIGS.FREE;
  const priceInfo = getPlanPriceInfo(currentPlan, rawCurrency || tenant?.currency || "CDF");

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
          <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Paiement Requis pour Activer l'Accès</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            Activez votre Forfait {planConfig.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
            Votre compte a été vérifié par SMS. Pour débloquer l'accès à la caisse tactile et au tableau de bord, veuillez effectuer le règlement de votre forfait.
          </p>
        </div>

        {/* Plan Summary Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">
              Forfait Souscrit
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
              Accès Pro
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {/* Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold text-center">
            Le paiement Mobile Money des forfaits payants est temporairement indisponible. Activez le Forfait Gratuit pour accéder immédiatement à votre caisse.
          </div>

          {/* Primary: Continue with Free Plan */}
          <button
            type="button"
            onClick={handleDowngradeToFree}
            disabled={isDowngrading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 touch-press"
          >
            {isDowngrading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Activation du Forfait Gratuit...</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>Continuer Immédiatement avec le Forfait Gratuit (0 FC)</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Accès immédiat et sécurisé sans frais</span>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PawaPayModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          plan={currentPlan}
          onSuccess={async () => {
            setIsPaymentModalOpen(false);
            await updateTenantPlan(currentPlan);
          }}
        />
      )}
    </div>
  );
}
