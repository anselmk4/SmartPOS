"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie-db";
import { getTenantTrialInfo } from "@/lib/constants/plans";
import { PawaPayModal } from "@/components/billing/pawapay-modal";
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  Smartphone,
  Sparkles,
  Lock,
} from "lucide-react";

export function PersistentPlanBanner() {
  const pathname = usePathname();
  const { tenant, isAuthenticated, updateTenantPlan } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

  // Do not display on public landing, auth, or admin pages
  if (
    !isAuthenticated ||
    pathname === "/" ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/catalog")
  ) {
    return null;
  }

  const trialInfo = getTenantTrialInfo(tenant, Boolean(activeSubscription));
  const {
    isFreePlan,
    isPaidPlan,
    isTrialExpired,
    daysRemaining,
    hoursRemaining,
    isPaymentRequired,
    formattedExpiry,
  } = trialInfo;

  // Case 1: Trial has expired or payment is pending/required -> Persistent NON-DISMISSIBLE urgent banner
  if (isPaymentRequired || isTrialExpired) {
    return (
      <>
        <div
          role="alert"
          aria-live="assertive"
          className="sticky top-0 z-40 w-full bg-gradient-to-r from-rose-700 via-red-600 to-rose-800 text-white shadow-lg border-b border-rose-500/40 px-3 sm:px-6 py-2.5 sm:py-3 animate-in slide-in-from-top duration-300"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-xs font-sans">
            <div className="flex items-center gap-2.5 text-center sm:text-left min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-300 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-sm tracking-tight flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    Paiement Exigé
                  </span>
                  <span>
                    {isTrialExpired
                      ? "Votre essai gratuit de 7 jours est terminé."
                      : "Paiement de votre abonnement en attente."}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-rose-100 font-medium truncate sm:whitespace-normal">
                  L&apos;accès à la caisse tactile et aux fonctionnalités de gestion est suspendu tant que le paiement n&apos;est pas effectué.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-rose-950 hover:bg-rose-50 font-black text-xs shadow-md transition-all touch-press flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-rose-600" />
                <span>Payer mon forfait maintenant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {pathname !== "/billing" && (
                <Link
                  href="/billing"
                  className="hidden md:inline-flex px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs transition-colors"
                >
                  Voir les forfaits
                </Link>
              )}
            </div>
          </div>
        </div>

        {isPaymentModalOpen && (
          <PawaPayModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            plan={tenant?.plan && tenant.plan !== "FREE" ? tenant.plan : "PRO"}
            onSuccess={async (paidPlan) => {
              setIsPaymentModalOpen(false);
              await updateTenantPlan(paidPlan);
            }}
          />
        )}
      </>
    );
  }

  // Case 2: On FREE plan and trial is active (e.g. 1 to 7 days remaining) -> Persistent warning banner
  if (isFreePlan) {
    const isUrgent = daysRemaining <= 2;
    return (
      <div
        role="status"
        className={`sticky top-0 z-40 w-full text-white shadow-sm border-b px-3 sm:px-6 py-2 sm:py-2.5 transition-colors ${
          isUrgent
            ? "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 border-amber-500/40"
            : "bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-blue-500/20"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-sans">
          <div className="flex items-center gap-2.5 min-w-0 text-center sm:text-left">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                isUrgent ? "bg-white/20 text-white" : "bg-blue-500/20 text-blue-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs block sm:inline">
                Essai Gratuit :{" "}
                <b className="underline decoration-amber-400">
                  {daysRemaining > 0
                    ? `il vous reste ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`
                    : `il vous reste ${hoursRemaining} heure${hoursRemaining > 1 ? "s" : ""}`}
                </b>{" "}
                (expire le {formattedExpiry}).
              </span>
              <span className="text-[11px] text-slate-300 sm:ml-1 hidden md:inline">
                Activez votre forfait dès aujourd&apos;hui pour ne pas risquer de bloquer vos encaissements.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/billing"
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all touch-press flex items-center gap-1 shadow-sm ${
                isUrgent
                  ? "bg-white text-orange-950 hover:bg-orange-50"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
              }`}
            >
              <span>Choisir un forfait</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
