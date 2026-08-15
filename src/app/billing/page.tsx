"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import { PawaPayModal } from "@/components/billing/pawapay-modal";
import type { SubscriptionPlan } from "@/lib/shared/types";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Building,
  Smartphone,
  Check,
  ArrowRight,
  X,
  Phone,
  Coins,
  Crown,
  Receipt,
  FileSpreadsheet,
  ArrowRightLeft,
  Lock,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from "lucide-react";

export default function BillingPage() {
  const { tenant, updateTenantPlan, cancelSubscription } = useAuth();
  const { formatMoney } = useSync();

  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<SubscriptionPlan | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const currentPlan = tenant?.plan || "FREE";
  const planStatus = tenant?.planStatus || "ACTIVE";
  const isPaidPlan = currentPlan === "PRO" || currentPlan === "BUSINESS";
  const isCancelled = planStatus === "CANCELLED";

  const plans = [
    {
      id: "FREE" as SubscriptionPlan,
      name: "Découverte",
      price: 0,
      period: "Gratuit à vie",
      badge: "Pour débuter",
      features: [
        "1 Caisse tactile rapide",
        "Limité à 100 ventes / mois",
        "Carnet de dettes (max 5 clients)",
        "100% Fonctionnement Hors-ligne",
        "Pas de sauvegarde Cloud",
        "Pas d'espace gérant ni marges",
      ],
      color: "border-slate-200",
      btnColor: "bg-slate-800 text-white hover:bg-slate-700",
    },
    {
      id: "PRO" as SubscriptionPlan,
      name: "Commerçant Pro",
      price: 40000,
      period: "/ mois (15$)",
      badge: "Le plus populaire",
      popular: true,
      features: [
        "Ventes et caisse illimitées (sans quota)",
        "Relances WhatsApp intelligentes (3 modèles)",
        "Supervision gérant à distance sur smartphone",
        "Sauvegarde Cloud automatique continue",
        "Calcul des marges nettes & bénéfices en direct",
        "Clôture de caisse quotidienne (Ticket Z)",
        "Alertes de stock personnalisables",
      ],
      color: "border-blue-500 ring-2 ring-blue-500/20 shadow-xl",
      btnColor: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30",
    },
    {
      id: "BUSINESS" as SubscriptionPlan,
      name: "Business Multi-Magasins",
      price: 120000,
      period: "/ mois (45$)",
      badge: "Réseaux & Dépôts",
      features: [
        "Tout le forfait Pro inclus",
        "Multi-Boutiques & Multi-Caisses (jusqu'à 10)",
        "Transferts de stocks inter-magasins traçables",
        "Export comptable complet Excel (CSV) & PDF",
        "Gestion multi-utilisateurs & codes PIN caissiers",
        "Consolidation réseau en temps réel",
        "Support technique prioritaire WhatsApp dédié",
      ],
      color: "border-indigo-500",
      btnColor: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30",
    },
  ];

  const comparisonFeatures = [
    { title: "Caisse tactile & impression tickets", free: "1 caisse", pro: "Illimité", biz: "Illimité" },
    { title: "Limite de ventes mensuelles", free: "100 ventes / mois", pro: "Illimité", biz: "Illimité" },
    { title: "Carnet de dettes clients", free: "Max 5 débiteurs", pro: "Illimité", biz: "Illimité" },
    { title: "Relances WhatsApp intelligentes (Modèles)", free: false, pro: true, biz: true },
    { title: "Calcul des marges & bénéfice net en direct", free: false, pro: true, biz: true },
    { title: "Clôture de caisse journalière (Ticket Z)", free: false, pro: true, biz: true },
    { title: "Sauvegarde Cloud automatique continue", free: false, pro: true, biz: true },
    { title: "Supervision Gérant sur smartphone", free: false, pro: true, biz: true },
    { title: "Multi-Boutiques & Dépôts connectés", free: "1 seule", pro: "1 seule", biz: "Jusqu'à 10 points" },
    { title: "Transferts de stock inter-magasins", free: false, pro: false, biz: true },
    { title: "Export comptable Excel (CSV) & PDF", free: false, pro: false, biz: true },
    { title: "Support prioritaire WhatsApp", free: "Communautaire", pro: "Standard", biz: "Dédié VIP" },
  ];

  const handleOpenPayment = (plan: SubscriptionPlan) => {
    if (plan === currentPlan && !isCancelled) return;
    if (plan === "FREE") {
      updateTenantPlan("FREE");
      setSuccessToast("Passage au forfait Gratuit effectué !");
      setTimeout(() => setSuccessToast(null), 3500);
      return;
    }
    setSelectedPlanToBuy(plan);
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    const res = await cancelSubscription();
    setIsCancelling(false);
    setIsCancelModalOpen(false);
    if (res.success) {
      setSuccessToast(res.message);
      setTimeout(() => setSuccessToast(null), 4000);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Abonnement SaaS SmartPOS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Tarifs Clairs & Paiements Mobile Money PawaPay
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Payez facilement chaque mois par M-Pesa, Airtel Money, Orange Money, Wave ou Afrimoney sans carte bancaire obligatoire.
        </p>
      </div>

      {successToast && (
        <div className="max-w-md mx-auto w-full bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Current Subscription Status Banner */}
      {isPaidPlan && (
        <div
          className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
            isCancelled
              ? "bg-amber-50/70 border-amber-200 text-amber-900"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-950"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
                isCancelled ? "bg-amber-100 text-amber-700" : "bg-blue-600 text-white"
              }`}
            >
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Forfait Actuel : {currentPlan === "PRO" ? "Commerçant Pro" : "Business Multi-Magasins"}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    isCancelled
                      ? "bg-amber-200 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isCancelled ? "Résiliation programmée" : "Actif"}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isCancelled
                  ? "Vous conservez tous vos accès Pro/Business jusqu'à la fin de la période en cours."
                  : "Votre abonnement est actif avec sauvegarde Cloud continue et fonctionnalités débloquées."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!isCancelled ? (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs shadow-sm transition-all touch-press flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Résilier l'abonnement</span>
              </button>
            ) : (
              <button
                onClick={() => handleOpenPayment(currentPlan)}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all touch-press flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Réactiver le forfait</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.id && !isCancelled;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-3xl p-6 border flex flex-col justify-between relative transition-all ${p.color}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-md">
                  {p.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-lg">{p.name}</h3>
                  {isCurrent && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Actif
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-black text-slate-900">
                    {formatMoney(p.price)}
                  </span>
                  <span className="text-xs text-slate-500">{p.period}</span>
                </div>

                <ul className="space-y-2.5 my-5 text-xs text-slate-600">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleOpenPayment(p.id)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-2xl font-bold text-xs shadow-md transition-all touch-press flex items-center justify-center gap-2 ${
                  isCurrent
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    : p.btnColor
                }`}
              >
                {isCurrent ? (
                  <span>Forfait Actif</span>
                ) : (
                  <>
                    <span>Souscrire via Mobile Money</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl mb-1">
          Tableau Comparatif Détaillé des Forfaits
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Toutes les fonctionnalités sont nativement exécutables en mode Offline-First.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 font-bold">Fonctionnalité</th>
                <th className="py-3 font-bold text-center">Découverte (Gratuit)</th>
                <th className="py-3 font-bold text-center text-blue-700">Commerçant Pro (40 000 FC / 15$)</th>
                <th className="py-3 font-bold text-center text-indigo-700">Business (120 000 FC / 45$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonFeatures.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 font-semibold text-slate-800">{row.title}</td>

                  {/* Free */}
                  <td className="py-3 text-center text-slate-600">
                    {typeof row.free === "boolean" ? (
                      row.free ? (
                        <Check className="w-4 h-4 text-blue-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )
                    ) : (
                      <span>{row.free}</span>
                    )}
                  </td>

                  {/* Pro */}
                  <td className="py-3 text-center text-blue-700 font-bold bg-blue-50/30">
                    {typeof row.pro === "boolean" ? (
                      row.pro ? (
                        <Check className="w-4 h-4 text-blue-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )
                    ) : (
                      <span>{row.pro}</span>
                    )}
                  </td>

                  {/* Business */}
                  <td className="py-3 text-center text-indigo-700 font-bold bg-indigo-50/30">
                    {typeof row.biz === "boolean" ? (
                      row.biz ? (
                        <Check className="w-4 h-4 text-indigo-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )
                    ) : (
                      <span>{row.biz}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PawaPay Mobile Money Payment Modal */}
      {selectedPlanToBuy && (
        <PawaPayModal
          isOpen={true}
          plan={selectedPlanToBuy}
          onClose={() => setSelectedPlanToBuy(null)}
          onSuccess={(activatedPlan) => {
            setSelectedPlanToBuy(null);
            setSuccessToast(`Félicitations ! Votre forfait ${activatedPlan} est actif.`);
            setTimeout(() => setSuccessToast(null), 4000);
          }}
        />
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2">
              Confirmer la résiliation de l'abonnement ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6">
              Votre forfait restera actif jusqu'à la fin du mois en cours. Après cette date, votre compte basculera automatiquement sur le forfait gratuit Découverte.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Conserver mon forfait
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                {isCancelling ? <span>Résiliation...</span> : <span>Oui, résilier</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
