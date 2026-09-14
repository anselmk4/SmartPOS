"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { useLandingTheme } from "./landing-theme-context";

export default function PricingSection() {
  const { isDark } = useLandingTheme();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [currency, setCurrency] = useState<"CDF" | "USD">("CDF");

  const plans = [
    {
      id: "FREE",
      name: "Découverte",
      tagline: "Pour tester et lancer son premier commerce sans frais.",
      priceCDFMonthly: 0,
      priceUSDMonthly: 0,
      priceCDFAnnual: 0,
      priceUSDAnnual: 0,
      badge: "100% Gratuit",
      isPopular: false,
      isBusiness: false,
      features: [
        "1 Caisse tactile 0ms (Offline-First)",
        "Jusqu'à 100 ventes / mois",
        "Carnet de dettes (10 clients max)",
        "Export comptable Excel (CSV) & PDF",
        "Factures en attente & Additions proforma",
        "Calcul de monnaie CDF & USD",
        "Support communautaire",
      ],
      ctaText: "Démarrer Gratuitement",
      ctaHref: "/auth/register?plan=FREE",
      btnClassDark: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",
      btnClassLight: "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200",
    },
    {
      id: "BASIC",
      name: "Basic",
      tagline: "Pour les petits commerces, boutiques et alimentations de quartier.",
      priceCDFMonthly: 15000,
      priceUSDMonthly: 6.5,
      priceCDFAnnual: 150000,
      priceUSDAnnual: 65,
      badge: "Commerce Actif",
      isPopular: false,
      isBusiness: false,
      features: [
        "1 Caisse tactile ultra-rapide",
        "Jusqu'à 1 000 ventes / mois",
        "Jusqu'à 10 profils caissiers (PIN dédié)",
        "Relance WhatsApp 1-clic illimitée",
        "Encaissement Mobile Money & Cash",
        "Export comptable complet Excel & PDF",
        "Sauvegarde Cloud automatique continue",
      ],
      ctaText: "Choisir Basic",
      ctaHref: "/auth/register?plan=BASIC",
      btnClassDark: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",
      btnClassLight: "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200",
    },
    {
      id: "PRO",
      name: "Pro",
      tagline: "Pour les commerces à fort trafic, restos-bars et quincailleries.",
      priceCDFMonthly: 30000,
      priceUSDMonthly: 13,
      priceCDFAnnual: 300000,
      priceUSDAnnual: 130,
      badge: "Le Plus Populaire",
      isPopular: true,
      isBusiness: false,
      features: [
        "Ventes & Transactions ILLIMITÉES",
        "Caisses & Caissiers ILLIMITÉS (PIN)",
        "Bilan Personnalisé & Synthèse Fiscale A4",
        "Tarifs Dynamiques (Soirée Karaoké & Promos)",
        "Factures en attente & Additions serveurs",
        "Filtres de dates & Classement personnel",
        "Calcul des marges nettes & bénéfices réels",
        "Supervision à distance par le patron",
        "Support WhatsApp prioritaire 6j/7",
      ],
      ctaText: "Passer en Pro",
      ctaHref: "/auth/register?plan=PRO",
      btnClassDark: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-950",
      btnClassLight: "bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-600/30",
    },
    {
      id: "BUSINESS",
      name: "Business Multi-Magasins",
      tagline: "Pour les propriétaires de plusieurs boutiques, dépôts et franchises.",
      priceCDFMonthly: 100000,
      priceUSDMonthly: 43.5,
      priceCDFAnnual: 1000000,
      priceUSDAnnual: 435,
      badge: "Multi-Boutiques",
      isPopular: false,
      isBusiness: true,
      features: [
        "Tout le forfait Pro inclus",
        "Jusqu'à 10 Boutiques & Dépôts inclus",
        "Gestion de la Paie & Bulletins de Salaire",
        "Gestion des Congés & Absences personnel",
        "Bilan Personnalisé consolidé & Déclaration A4",
        "Transferts de stock inter-magasins traçables",
        "Gérants dédiés par boutique (PIN)",
        "Vue consolidée du réseau en temps réel",
        "Support VIP dédié WhatsApp 7j/7",
      ],
      ctaText: "Choisir Multi-Magasins",
      ctaHref: "/auth/register?plan=BUSINESS",
      btnClassDark: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-lg shadow-amber-950",
      btnClassLight: "bg-amber-500 hover:bg-amber-600 text-white font-black shadow-lg shadow-amber-500/30",
    },
  ];

  return (
    <section
      id="pricing"
      className={`py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative border-b transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-white border-slate-800/80" : "bg-white text-slate-900 border-slate-200"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold shadow-md ${
              isDark
                ? "bg-slate-900 border border-emerald-500/30 text-emerald-400"
                : "bg-emerald-50 border border-emerald-300 text-emerald-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tarifs Transparents & Sans Frais Cachés</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Un investissement rentabilisé dès le{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 dark:from-emerald-400 dark:via-teal-300 dark:to-amber-300">
              premier mois.
            </span>
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Choisissez le forfait adapté à la taille de votre commerce. Changez de formule à tout moment en 1 clic.
          </p>

          {/* Controls: Billing Cycle & Currency Switcher */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
            {/* Billing Cycle Pill */}
            <div
              className={`inline-flex items-center p-1 rounded-2xl border ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
              }`}
            >
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  billingCycle === "monthly"
                    ? isDark
                      ? "bg-slate-800 text-white shadow-sm"
                      : "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Paiement Mensuel
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span>Annuel</span>
                <span className="text-[10px] bg-slate-950 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                  2 mois offerts
                </span>
              </button>
            </div>

            {/* Currency Switcher */}
            <div
              className={`inline-flex items-center p-1 rounded-2xl border ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
              }`}
            >
              <button
                onClick={() => setCurrency("CDF")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  currency === "CDF"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Franc Congolais (FC)
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  currency === "USD"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Dollars ($)
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const isMonthly = billingCycle === "monthly";
            const priceCDF = isMonthly ? plan.priceCDFMonthly : plan.priceCDFAnnual;
            const priceUSD = isMonthly ? plan.priceUSDMonthly : plan.priceUSDAnnual;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative transition-all duration-300 ${
                  plan.isPopular
                    ? isDark
                      ? "bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-950/60 lg:-translate-y-2"
                      : "bg-gradient-to-b from-white to-emerald-50/40 border-2 border-emerald-500 shadow-xl shadow-emerald-200/50 lg:-translate-y-2"
                    : plan.isBusiness
                    ? isDark
                      ? "bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 shadow-xl shadow-amber-950/40"
                      : "bg-gradient-to-b from-white to-amber-50/40 border-2 border-amber-500/80 shadow-lg shadow-amber-200/40"
                    : isDark
                    ? "bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-lg"
                    : "bg-white border border-slate-200 hover:border-slate-300 shadow-md shadow-slate-200"
                }`}
              >
                {/* Popular / Business Badges */}
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    ⭐ Plus Populaire
                  </div>
                )}
                {plan.isBusiness && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    🏢 Multi-Magasins
                  </div>
                )}

                <div>
                  {/* Title & Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        plan.isPopular
                          ? isDark
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : plan.isBusiness
                          ? isDark
                            ? "bg-amber-950 text-amber-300 border border-amber-700"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                          : isDark
                          ? "bg-slate-800 text-slate-300"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-6">{plan.tagline}</p>

                  {/* Price Display */}
                  <div className={`pb-6 mb-6 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-3xl sm:text-4xl font-black font-mono ${
                          isDark ? "text-white" : "text-slate-950"
                        }`}
                      >
                        {currency === "CDF"
                          ? priceCDF === 0
                            ? "0 FC"
                            : `${priceCDF.toLocaleString()} FC`
                          : priceUSD === 0
                          ? "$0"
                          : `$${priceUSD.toFixed(2)}`}
                      </span>
                      <span className="text-xs text-slate-500">
                        {priceCDF === 0 ? "/ à vie" : isMonthly ? "/ mois" : "/ an"}
                      </span>
                    </div>
                    {priceCDF > 0 && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        {currency === "CDF"
                          ? `Équivaut à env. ~$${priceUSD.toFixed(2)}`
                          : `Équivaut à env. ~${priceCDF.toLocaleString()} FC`}
                      </p>
                    )}
                  </div>

                  {/* Features Checklist */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className={`flex items-start gap-2.5 text-xs ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            plan.isPopular
                              ? "text-emerald-500"
                              : plan.isBusiness
                              ? "text-amber-500"
                              : "text-slate-400"
                          }`}
                        />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Link
                  href={plan.ctaHref}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
                    isDark ? plan.btnClassDark : plan.btnClassLight
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
