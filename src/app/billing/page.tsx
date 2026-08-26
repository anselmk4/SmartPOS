"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie-db";
import { PawaPayModal } from "@/components/billing/pawapay-modal";
import { getPlanPriceInfo } from "@/lib/constants/plans";
import type { SubscriptionPlan, Subscription } from "@/lib/shared/types";
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
  History,
  Clock,
  Download,
  AlertCircle,
} from "lucide-react";

function BillingPageContent() {
  const { tenant, updateTenantPlan, cancelSubscription } = useAuth();
  const { formatMoney, rawCurrency } = useSync();
  const searchParams = useSearchParams();

  const planParam = searchParams?.get("plan") as SubscriptionPlan | null;
  const isRequired = searchParams?.get("required") === "true";
  const isCheckout = searchParams?.get("checkout") === "true";

  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<SubscriptionPlan | null>(null);
  const [unavailablePlan, setUnavailablePlan] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [displayCurrency, setDisplayCurrency] = useState<string>(rawCurrency || "CDF");
  const [cloudSubscriptions, setCloudSubscriptions] = useState<Subscription[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Local Dexie subscriptions for reactive offline-first tracking
  const localSubscriptions =
    useLiveQuery(
      async () => {
        if (!tenant?.id) return [];
        return await db.subscriptions
          .where("tenantId")
          .equals(tenant.id)
          .reverse()
          .sortBy("createdAt");
      },
      [tenant?.id]
    ) || [];

  // Fetch Cloud Subscriptions from PostgreSQL on mount
  useEffect(() => {
    if (tenant?.id) {
      setIsLoadingHistory(true);
      fetch(`/api/v1/payments/subscriptions?tenantId=${tenant.id}`)
        .then((res) => res.json())
        .then(async (data) => {
          if (data.success && data.subscriptions) {
            setCloudSubscriptions(data.subscriptions);
            // Save to Dexie without duplicates
            for (const sub of data.subscriptions) {
              if (sub.transactionId) {
                const existing = await db.subscriptions.where("transactionId").equals(sub.transactionId).toArray();
                for (const old of existing) {
                  if (old.id !== sub.id) {
                    await db.subscriptions.delete(old.id);
                  }
                }
              }
              await db.subscriptions.put(sub);
            }
          }
        })
        .catch((err) => console.warn("[Billing] Subscriptions fetch error:", err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [tenant?.id]);

  // Show unavailable modal if redirected with plan parameter
  useEffect(() => {
    if (planParam && (planParam === "BASIC" || planParam === "PRO" || planParam === "BUSINESS")) {
      const names: Record<string, string> = {
        BASIC: "Commerçant Basic",
        PRO: "Commerçant Pro",
        BUSINESS: "Business Multi-Magasins",
      };
      setUnavailablePlan(names[planParam] || planParam);
    }
  }, [planParam]);

  const currentPlan = tenant?.plan || "FREE";
  const planStatus = tenant?.planStatus || "ACTIVE";
  const isPaidPlan = currentPlan === "BASIC" || currentPlan === "PRO" || currentPlan === "BUSINESS";
  const isCancelled = planStatus === "CANCELLED";

  // Merge subscriptions (Dexie + Cloud deduplicated strictly by transactionId)
  const allSubscriptionsMap = new Map<string, any>();
  [...cloudSubscriptions, ...localSubscriptions].forEach((s) => {
    const key = (s.transactionId && s.transactionId.trim()) || s.id;
    if (key) {
      allSubscriptionsMap.set(key, s);
    }
  });
  const allSubscriptions = Array.from(allSubscriptionsMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const plans = [
    {
      id: "FREE" as SubscriptionPlan,
      name: "Découverte",
      priceInfo: getPlanPriceInfo("FREE", displayCurrency),
      badge: "Pour démarrer",
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
      priceInfo: getPlanPriceInfo("BASIC", displayCurrency),
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
      priceInfo: getPlanPriceInfo("PRO", displayCurrency),
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
      priceInfo: getPlanPriceInfo("BUSINESS", displayCurrency),
      badge: "Réseaux & Dépôts",
      features: [
        "Tout le forfait Pro inclus",
        "Multi-Commerces & Dépôts (jusqu'à 10)",
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
    { title: "Multi-Commerces & Dépôts connectés", free: "1 seul", basic: "1 seul", pro: "1 seul", biz: "Jusqu'à 10 points" },
    { title: "Transferts de stock inter-magasins", free: false, basic: false, pro: false, biz: true },
    { title: "Export comptable Excel (CSV) & PDF", free: false, basic: true, pro: true, biz: true },
    { title: "Support prioritaire WhatsApp", free: "Communautaire", basic: "Standard", pro: "Prioritaire", biz: "Dédié VIP" },
  ];

  const handleOpenPayment = (plan: SubscriptionPlan) => {
    if (plan === currentPlan && !isCancelled) return;
    if (plan === "FREE") {
      updateTenantPlan("FREE");
      setSuccessToast("Vous êtes maintenant sur le forfait Gratuit Découverte.");
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }
    const names: Record<string, string> = {
      BASIC: "Commerçant Basic",
      PRO: "Commerçant Pro",
      BUSINESS: "Business Multi-Magasins",
    };
    setUnavailablePlan(names[plan] || plan);
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Onboarding Requirement Banner */}
      {isRequired && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider">
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Dernière étape : Activation de votre Forfait</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              Règlement du Forfait {planParam === "BASIC" ? "Commerçant Basic" : planParam === "PRO" ? "Commerçant Pro" : planParam === "BUSINESS" ? "Business Multi-Magasins" : "Sélectionné"}
            </h3>
            <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
              Votre compte a été vérifié par SMS avec succès ! Pour débloquer l'accès complet à votre caisse tactile et à votre tableau de bord, veuillez régler votre forfait par Mobile Money.
            </p>
          </div>

          <button
            type="button"
            onClick={() => planParam && setSelectedPlanToBuy(planParam)}
            className="px-6 py-3.5 rounded-2xl bg-white text-blue-950 hover:bg-blue-50 font-black text-xs shadow-lg shrink-0 flex items-center gap-2 transition-all touch-press"
          >
            <span>Payer maintenant</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      )}

      {/* Current Subscription Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-black">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Abonnement Micro-ERP Actif</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>Forfait Actuel :</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                {currentPlan === "FREE" && "Découverte (Gratuit)"}
                {currentPlan === "BASIC" && "Commerçant Basic"}
                {currentPlan === "PRO" && "Commerçant Pro"}
                {currentPlan === "BUSINESS" && "Business Multi-Magasins"}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Boutique : <b>{tenant?.name || "Votre Boutique"}</b> • Devise principale : <b>{displayCurrency}</b>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isPaidPlan && !isCancelled && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-all"
              >
                Résilier l'abonnement
              </button>
            )}

            {isCancelled && (
              <span className="px-3.5 py-1.5 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
                Résiliation programmée en fin de période
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📜 HISTORIQUE DES PAIEMENTS & SOUSCRIPTIONS EFFECTUÉS */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Historique de vos Paiements & Souscriptions
              </h3>
              <p className="text-xs text-slate-500">
                Retrouvez tous les règlements Mobile Money effectués pour votre compte.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (tenant?.id) {
                fetch(`/api/v1/payments/subscriptions?tenantId=${tenant.id}`)
                  .then((res) => res.json())
                  .then((d) => d.success && setCloudSubscriptions(d.subscriptions));
              }
            }}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Actualiser l'historique"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin text-blue-600" : ""}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {allSubscriptions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">Aucun paiement enregistré pour l'instant</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Lorsque vous effectuez un paiement par Mobile Money pour activer un forfait, votre reçu et l'historique complet s'afficheront ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Forfait Activé</th>
                  <th className="py-3 px-3">Montant Réglé</th>
                  <th className="py-3 px-3">Opérateur & Mode</th>
                  <th className="py-3 px-3">Réf. Transaction</th>
                  <th className="py-3 px-3">Période de Validité</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allSubscriptions.map((sub, idx) => {
                  const dateStr = sub.createdAt
                    ? new Date(sub.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  const startStr = sub.periodStart
                    ? new Date(sub.periodStart).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
                    : "—";

                  const endStr = sub.periodEnd
                    ? new Date(sub.periodEnd).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                    : "—";

                  const planLabel =
                    sub.plan === "BASIC"
                      ? "Commerçant Basic"
                      : sub.plan === "PRO"
                      ? "Commerçant Pro"
                      : sub.plan === "BUSINESS"
                      ? "Business Multi-Magasins"
                      : "Découverte";

                  return (
                    <tr key={sub.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block">{planLabel}</span>
                        <span className="text-[10px] text-slate-400 font-medium">30 Jours d'accès</span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3 font-mono font-black text-slate-900 whitespace-nowrap">
                        {Number(sub.amount || 0).toLocaleString("fr-FR")} {sub.currency || "CDF"}
                      </td>

                      {/* Operator */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                          <Smartphone className="w-3 h-3 text-blue-600" />
                          <span>{sub.paymentMethod || "Mobile Money"}</span>
                        </span>
                      </td>

                      {/* Ref */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                        <span className="truncate max-w-[120px] block" title={sub.transactionId}>
                          {sub.transactionId || "—"}
                        </span>
                      </td>

                      {/* Period */}
                      <td className="py-3.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                        Du <b>{startStr}</b> au <b>{endStr}</b>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Payé & Actif</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pricing Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Abonnement SaaS Kuettu Global POS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Forfaits Clairs & Paiements Mobile Money Directs
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Payez instantanément par <b>M-Pesa</b>, <b>Airtel Money</b>, <b>Orange Money</b>, <b>MTN MoMo</b> ou <b>Wave</b> selon votre devise locale.
        </p>

        {/* Currency Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold w-fit mx-auto mt-4">
          {[
            { code: "CDF", label: "🇨🇩 Franc Congolais (FC)" },
            { code: "USD", label: "🇺🇸 Dollar US ($)" },
            { code: "XOF", label: "🇸🇳/🇨🇮 Franc CFA (XOF)" },
            { code: "XAF", label: "🇨🇲/🇬🇦 Franc CFA (XAF)" },
            { code: "GNF", label: "🇬🇳 Franc Guinéen (FG)" },
          ].map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setDisplayCurrency(c.code)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                displayCurrency === c.code
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.id && !isCancelled;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-3xl p-6 border-2 transition-all flex flex-col justify-between relative shadow-sm hover:shadow-xl ${p.color}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-300" />
                  <span>Recommandé</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {p.badge}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Actif
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-slate-900">{p.name}</h3>

                <div className="mt-3 mb-6">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {p.priceInfo.formatted}
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {p.id === "FREE" ? "Gratuit à vie" : "Facturé chaque mois"}
                  </span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenPayment(p.id)}
                  disabled={isCurrent}
                  className={`w-full py-3 px-4 rounded-2xl font-black text-xs transition-all touch-press flex items-center justify-center gap-1.5 shadow-md ${
                    isCurrent ? "bg-slate-100 text-slate-400 cursor-default shadow-none" : p.btnColor
                  }`}
                >
                  {isCurrent ? (
                    <span>Forfait Actuel</span>
                  ) : (
                    <>
                      <span>Choisir {p.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            Comparatif Détaillé des Fonctionnalités
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Comparez en détail ce que chaque forfait apporte à la gestion de votre commerce.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Fonctionnalité</th>
                <th className="py-3 px-3 text-center">Découverte (0 FC)</th>
                <th className="py-3 px-3 text-center">Basic (15 000 FC)</th>
                <th className="py-3 px-3 text-center text-blue-600 bg-blue-50/50 rounded-t-xl">Pro (30 000 FC)</th>
                <th className="py-3 px-3 text-center text-indigo-600 bg-indigo-50/50 rounded-t-xl">Business (100 000 FC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonFeatures.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-slate-800">{row.title}</td>

                  {/* Free */}
                  <td className="py-2.5 px-3 text-center text-slate-600">
                    {typeof row.free === "boolean" ? (
                      row.free ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                    ) : (
                      <span>{row.free}</span>
                    )}
                  </td>

                  {/* Basic */}
                  <td className="py-2.5 px-3 text-center text-slate-700 font-medium">
                    {typeof row.basic === "boolean" ? (
                      row.basic ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                    ) : (
                      <span>{row.basic}</span>
                    )}
                  </td>

                  {/* Pro */}
                  <td className="py-2.5 px-3 text-center bg-blue-50/20 font-bold text-blue-900">
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
          onClose={() => {
            setSelectedPlanToBuy(null);
            if (isRequired) {
              window.location.href = "/pos";
            }
          }}
          plan={selectedPlanToBuy}
          onSuccess={() => {
            setSelectedPlanToBuy(null);
            setSuccessToast(`Félicitations ! Votre forfait ${selectedPlanToBuy} est désormais actif.`);
            setTimeout(() => {
              window.location.href = "/pos";
            }, 1200);
          }}
        />
      )}

      {/* Temporarily Unavailable Paid Plan Modal */}
      {unavailablePlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 text-center relative">
            <button
              type="button"
              onClick={() => setUnavailablePlan(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <AlertCircle className="w-7 h-7 text-amber-600" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Service Temporairement Indisponible
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-2.5">
                Paiement du {unavailablePlan} indisponible
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                Le paiement en ligne pour ce forfait est <b>temporairement indisponible</b> en attendant la validation finale des clés API de la passerelle de paiement Mobile Money.
                <br /><br />
                Pour éviter tout dysfonctionnement, l'accès payant sans règlement effectif a été désactivé. Vous pouvez continuer d'utiliser librement toutes les fonctions avec le <b>Forfait Gratuit Découverte</b>.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  updateTenantPlan("FREE");
                  setUnavailablePlan(null);
                  setSuccessToast("Vous utilisez le Forfait Gratuit Découverte.");
                  setTimeout(() => {
                    window.location.href = "/pos";
                  }, 800);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 touch-press"
              >
                <span>Continuer avec le Forfait Gratuit Découverte (0 FC)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setUnavailablePlan(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
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

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold">Chargement des forfaits...</p>
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
