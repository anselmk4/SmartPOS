"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import type { SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";
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
} from "lucide-react";

export default function BillingPage() {
  const { tenant, updateTenantPlan } = useAuth();
  const { formatMoney } = useSync();

  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<SubscriptionPlan | null>(null);
  const [paymentOperator, setPaymentOperator] = useState<PaymentMethod>("MPESA");
  const [phoneNumber, setPhoneNumber] = useState(tenant?.phone || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const currentPlan = tenant?.plan || "FREE";

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
      price: 15000,
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
      price: 45000,
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
    if (plan === currentPlan) return;
    if (plan === "FREE") {
      updateTenantPlan("FREE");
      setSuccessToast("Passage au forfait Gratuit effectué !");
      setTimeout(() => setSuccessToast(null), 3500);
      return;
    }
    setSelectedPlanToBuy(plan);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanToBuy || isProcessing) return;

    setIsProcessing(true);
    // Simulate Mobile Money USSD push / API processing
    setTimeout(async () => {
      await updateTenantPlan(selectedPlanToBuy);
      setIsProcessing(false);
      setSelectedPlanToBuy(null);
      setSuccessToast(`Abonnement ${selectedPlanToBuy} activé avec succès via ${paymentOperator} !`);
      setTimeout(() => setSuccessToast(null), 4000);
    }, 1500);
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Abonnement SaaS Kuettu SMART POS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Tarifs Clairs & Fonctionnalités Différenciées
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Payez facilement chaque mois par M-Pesa, Airtel Money, Orange Money ou Afrimoney sans carte bancaire obligatoire.
        </p>
      </div>

      {successToast && (
        <div className="max-w-md mx-auto w-full bg-blue-600 text-white p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.id;
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
                    <span>Basculer vers {p.name}</span>
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
                <th className="py-3 font-bold text-center text-blue-700">Commerçant Pro (15 000 FC)</th>
                <th className="py-3 font-bold text-center text-indigo-700">Business (45 000 FC)</th>
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

      {/* MODAL: Mobile Money Subscription Payment */}
      {selectedPlanToBuy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmPayment}
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Règlement de l'Abonnement SaaS
                </h3>
                <p className="text-xs text-slate-500">
                  Forfait : <b className="text-blue-600">{selectedPlanToBuy}</b> (
                  {selectedPlanToBuy === "PRO" ? formatMoney(15000) : formatMoney(45000)}/mois)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanToBuy(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Operator selection */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-600 block mb-2">
                Choisissez votre Moyen de Paiement Mobile Money
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "MPESA", name: "M-Pesa (Vodacom)", color: "border-red-500 bg-red-50 text-red-800" },
                  { id: "AIRTEL_MONEY", name: "Airtel Money", color: "border-rose-600 bg-rose-50 text-rose-800" },
                  { id: "ORANGE_MONEY", name: "Orange Money", color: "border-orange-500 bg-orange-50 text-orange-800" },
                  { id: "AFRIMONEY", name: "Afrimoney", color: "border-purple-600 bg-purple-50 text-purple-800" },
                ].map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setPaymentOperator(op.id as PaymentMethod)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center touch-press ${
                      paymentOperator === op.id
                        ? `${op.color} ring-2 ring-offset-1 font-black`
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {op.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone input */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Numéro Mobile Money RDC pour le débit
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+243 81 000 11 22"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Une notification push de confirmation USSD sera envoyée sur votre téléphone.
              </p>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 touch-press"
            >
              {isProcessing ? (
                <span>Validation du transfert Mobile Money...</span>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  <span>
                    Valider le paiement (
                    {selectedPlanToBuy === "PRO" ? formatMoney(15000) : formatMoney(45000)})
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
