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
  Users,
  Flame,
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
  const isPaidPlan = currentPlan === "BASIC" || currentPlan === "PRO" || currentPlan === "BUSINESS";
  const isCancelled = planStatus === "CANCELLED";

  const plans = [
    {
      id: "FREE" as SubscriptionPlan,
      name: "Découverte",
      priceCDF: 0,
      priceUSD: 0,
      period: "Gratuit à vie",
      badge: "Pour tester",
      features: [
        "1 Caisse tactile locale",
        "100 ventes par mois",
        "Carnet de dettes (max 10 clients)",
        "Fonctionne 100% hors-ligne",
        "Pas de sauvegarde Cloud",
      ],
      color: "border-slate-200",
      btnColor: "bg-slate-800 text-white hover:bg-slate-700",
    },
    {
      id: "BASIC" as SubscriptionPlan,
      name: "Commerçant Basic",
      priceCDF: 15000,
      priceUSD: 6,
      period: "/ mois",
      badge: "Accessible & Efficace",
      popular: false,
      features: [
        "1 000 ventes par mois",
        "Jusqu'à 10 Caisses & Caissiers",
        "Carnet de dettes (100 clients)",
        "Relances WhatsApp en 1 clic",
        "Sauvegarde Cloud automatique",
        "Clôture de caisse quotidienne (Ticket Z)",
        "Export des rapports de base",
      ],
      color: "border-emerald-400 bg-emerald-50/20",
      btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30",
    },
    {
      id: "PRO" as SubscriptionPlan,
      name: "Commerçant Pro",
      priceCDF: 30000,
      priceUSD: 12,
      period: "/ mois",
      badge: "Le plus populaire",
      popular: true,
      features: [
        "Ventes et caisse illimitées (sans quota)",
        "Caisses et caissiers illimités",
        "Carnet de dettes clients illimité",
        "Relances WhatsApp automatiques (3 modèles)",
        "Calcul des marges nettes & bénéfice en direct",
        "Supervision gérant à distance sur smartphone",
        "Sauvegarde Cloud automatique continue",
        "Clôture de caisse Ticket Z avancée",
      ],
      color: "border-blue-500 ring-2 ring-blue-500/20 shadow-xl",
      btnColor: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30",
    },
    {
      id: "BUSINESS" as SubscriptionPlan,
      name: "Business Multi-Magasins",
      priceCDF: 60000,
      priceUSD: 25,
      period: "/ mois",
      badge: "Réseaux & Dépôts",
      features: [
        "Tout le forfait Pro inclus",
        "Multi-Boutiques & Dépôts (jusqu'à 10)",
        "Transferts de stocks inter-magasins traçables",
        "Gérants de boutiques dédiés avec PIN",
        "Export comptable complet Excel (CSV) & PDF",
        "Consolidation réseau en temps réel",
        "Support technique prioritaire WhatsApp dédié",
      ],
      color: "border-indigo-500",
      btnColor: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30",
    },
  ];

  const comparisonFeatures = [
    { title: "Limite de ventes mensuelles", free: "100 ventes", basic: "1 000 ventes", pro: "Illimité", biz: "Illimité" },
    { title: "Nombre de caisses & caissiers", free: "1 caisse", basic: "10 caisses", pro: "Illimité", biz: "Illimité" },
    { title: "Carnet de dettes clients", free: "10 clients", basic: "100 clients", pro: "Illimité", biz: "Illimité" },
    { title: "Relances WhatsApp intelligentes", free: false, basic: true, pro: true, biz: true },
    { title: "Sauvegarde Cloud automatique continue", free: false, basic: true, pro: true, biz: true },
    { title: "Clôture de caisse journalière (Ticket Z)", free: false, basic: true, pro: true, biz: true },
    { title: "Calcul des marges & bénéfice net en direct", free: false, basic: false, pro: true, biz: true },
    { title: "Supervision Gérant sur smartphone", free: false, basic: false, pro: true, biz: true },
    { title: "Multi-Boutiques & Dépôts connectés", free: "1 seule", basic: "1 seule", pro: "1 seule", biz: "Jusqu'à 10 points" },
    { title: "Transferts de stock inter-magasins", free: false, basic: false, pro: false, biz: true },
    { title: "Export comptable Excel (CSV) & PDF", free: false, basic: true, pro: true, biz: true },
    { title: "Support prioritaire WhatsApp", free: "Communautaire", basic: "Standard", pro: "Prioritaire", biz: "Dédié VIP" },
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
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Abonnement SaaS Kuettu Global POS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Forfaits Clairs & Paiements Mobile Money PawaPay
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Payez instantanément par <b>M-Pesa</b>, <b>Airtel Money</b>, <b>Orange Money</b> ou <b>Afrimoney</b> en Francs Congolais (CDF) ou Dollars (USD).
        </p>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Current Subscription Status Badge */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
            <Crown className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">Forfait Actif de votre Boutique</div>
            <div className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>{plans.find((p) => p.id === currentPlan)?.name || currentPlan}</span>
              <span
                className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                  isCancelled
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                }`}
              >
                {isCancelled ? "Résilié" : "Actif"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {tenant?.planExpiresAt && (
            <div className="text-right text-xs text-slate-500">
              <span className="block text-[10px] uppercase text-slate-400">Prochaine échéance</span>
              <span className="font-bold text-slate-700">
                {new Date(tenant.planExpiresAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          )}

          {isPaidPlan && !isCancelled && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all"
            >
              Résilier
            </button>
          )}
        </div>
      </div>

      {/* Pricing Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.id && !isCancelled;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-3xl p-5 border flex flex-col justify-between transition-all relative ${
                p.color
              } ${p.popular ? "shadow-xl border-blue-500" : "shadow-xs"}`}
            >
              {p.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs ${
                    p.popular
                      ? "bg-blue-600 text-white"
                      : p.id === "BASIC"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {p.badge}
                </div>
              )}

              <div>
                <h3 className="font-black text-slate-900 text-base">{p.name}</h3>

                <div className="mt-3 mb-4">
                  <div className="text-2xl font-black text-slate-900">
                    {p.priceCDF === 0 ? "Gratuit" : `${p.priceCDF.toLocaleString("fr-FR")} FC`}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {p.priceUSD === 0 ? "Sans engagement" : `soit ${p.priceUSD}$ ${p.period}`}
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {p.features.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100">
                <button
                  disabled={isCurrent}
                  onClick={() => handleOpenPayment(p.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 touch-press ${
                    isCurrent
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : p.btnColor
                  }`}
                >
                  {isCurrent ? (
                    <span>Forfait Actuel</span>
                  ) : (
                    <>
                      <span>{p.id === "FREE" ? "Choisir Gratuit" : "S'abonner via Mobile Money"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm">
        <h3 className="font-black text-slate-900 text-base mb-4">Tableau Comparatif Détaillé des Forfaits</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black">
                <th className="py-2.5 px-3">Fonctionnalité</th>
                <th className="py-2.5 px-3 text-center">Gratuit</th>
                <th className="py-2.5 px-3 text-center text-emerald-700 bg-emerald-50/40">Basic (15k FC)</th>
                <th className="py-2.5 px-3 text-center text-blue-700 bg-blue-50/40">Pro (30k FC)</th>
                <th className="py-2.5 px-3 text-center text-indigo-700 bg-indigo-50/40">Business (60k FC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {comparisonFeatures.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{row.title}</td>

                  {/* Free */}
                  <td className="py-2.5 px-3 text-center">
                    {typeof row.free === "boolean" ? (
                      row.free ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                    ) : (
                      <span>{row.free}</span>
                    )}
                  </td>

                  {/* Basic */}
                  <td className="py-2.5 px-3 text-center bg-emerald-50/20 font-bold text-emerald-800">
                    {typeof row.basic === "boolean" ? (
                      row.basic ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                    ) : (
                      <span>{row.basic}</span>
                    )}
                  </td>

                  {/* Pro */}
                  <td className="py-2.5 px-3 text-center bg-blue-50/20 font-bold text-blue-800">
                    {typeof row.pro === "boolean" ? (
                      row.pro ? <Check className="w-4 h-4 text-blue-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                    ) : (
                      <span>{row.pro}</span>
                    )}
                  </td>

                  {/* Business */}
                  <td className="py-2.5 px-3 text-center bg-indigo-50/20 font-bold text-indigo-800">
                    {typeof row.biz === "boolean" ? (
                      row.biz ? <Check className="w-4 h-4 text-indigo-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
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

      {/* PawaPay Payment Modal */}
      {selectedPlanToBuy && (
        <PawaPayModal
          isOpen={Boolean(selectedPlanToBuy)}
          onClose={() => setSelectedPlanToBuy(null)}
          plan={selectedPlanToBuy}
          onSuccess={() => {
            setSelectedPlanToBuy(null);
            setSuccessToast(`Félicitations ! Votre forfait ${selectedPlanToBuy} est désormais actif.`);
            setTimeout(() => setSuccessToast(null), 5000);
          }}
        />
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-lg">Résilier votre abonnement ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Votre accès aux fonctionnalités avancées restera valide jusqu'à la fin de votre période payée, puis votre boutique basculera sur le forfait Gratuit.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Garder mon forfait
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                {isCancelling ? "Résiliation..." : "Confirmer l'arrêt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
