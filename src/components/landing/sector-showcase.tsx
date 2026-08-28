"use client";

import React, { useState } from "react";
import {
  UtensilsCrossed,
  ShoppingCart,
  Hammer,
  Printer,
  Shirt,
  Beer,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useLandingTheme } from "./landing-theme-context";

interface Sector {
  id: string;
  title: string;
  shortName: string;
  icon: any;
  badge: string;
  tagline: string;
  desc: string;
  features: string[];
  gradientDark: string;
  gradientLight: string;
  accentDark: string;
  accentLight: string;
  statNumber: string;
  statLabel: string;
}

const SECTORS: Sector[] = [
  {
    id: "supermarket",
    title: "Alimentations, Supérettes & Épiceries",
    shortName: "Alimentations",
    icon: ShoppingCart,
    badge: "Très Populaire",
    tagline: "Ventes ultra-rapides, articles multiples et rendu de monnaie instantané",
    desc: "Encaissez en moins de 3 secondes par client avec douchette code-barre, gestion des devises doubles (CDF / USD) et contrôle strict du tiroir-caisse.",
    features: [
      "Lecteur code-barre USB & Bluetooth sans pilote",
      "Calcul automatique de la monnaie à rendre en Francs et Dollars",
      "Alertes de stock minimum pour ne jamais tomber en rupture",
      "Clôture de caisse quotidienne (Ticket Z) avec contrôle des écarts",
    ],
    gradientDark: "from-emerald-500/20 via-teal-500/10 to-slate-950",
    gradientLight: "from-emerald-50 via-teal-50 to-white",
    accentDark: "text-emerald-400 border-emerald-500/40 bg-emerald-950/60",
    accentLight: "text-emerald-800 border-emerald-300 bg-emerald-100",
    statNumber: "3 sec",
    statLabel: "Temps moyen par encaissement",
  },
  {
    id: "restaurant",
    title: "Restaurants, Bars & Terrasses",
    shortName: "Resto & Bars",
    icon: UtensilsCrossed,
    badge: "Spécial Tables",
    tagline: "Additions proforma, tables en attente (Hold) et encaissements fractionnés",
    desc: "Gérez les commandes en attente par table, imprimez des additions proforma avant règlement et encaissez en plusieurs modes (Cash + Mobile Money).",
    features: [
      "Mise en attente des commandes par numéro de table ou serveur",
      "Impression directe des additions de table avant paiement",
      "Partage d'addition et paiements mixtes (Cash + M-Pesa)",
      "Gestion des fûts, casiers de boissons et ingrédients de cuisine",
    ],
    gradientDark: "from-amber-500/20 via-orange-500/10 to-slate-950",
    gradientLight: "from-amber-50 via-orange-50 to-white",
    accentDark: "text-amber-400 border-amber-500/40 bg-amber-950/60",
    accentLight: "text-amber-800 border-amber-300 bg-amber-100",
    statNumber: "0 oubli",
    statLabel: "Tables et verres non facturés évités",
  },
  {
    id: "hardware",
    title: "Quincailleries, Matériaux & BTP",
    shortName: "Quincailleries",
    icon: Hammer,
    badge: "Spécial Crédit",
    tagline: "Carnet de dettes fournisseurs & suivi rigoureux des crédits chantiers",
    desc: "Suivez les livraisons de ciment, fers à béton, tôles et outillage. Envoyez des récapitulatifs de créances par WhatsApp aux entrepreneurs en 1 clic.",
    features: [
      "Suivi des gros montants et des acomptes échelonnés par client",
      "Relance automatique WhatsApp avec solde restant exact",
      "Gestion des unités de mesure multiples (sacs, barres, mètres, pièces)",
      "Bons de livraison imprimables et exportables en PDF",
    ],
    gradientDark: "from-blue-500/20 via-indigo-500/10 to-slate-950",
    gradientLight: "from-blue-50 via-indigo-50 to-white",
    accentDark: "text-blue-400 border-blue-500/40 bg-blue-950/60",
    accentLight: "text-blue-800 border-blue-300 bg-blue-100",
    statNumber: "+38%",
    statLabel: "Taux de recouvrement des crédits",
  },
  {
    id: "fashion",
    title: "Magasins Prêt-à-porter, Mode & Chaussures",
    shortName: "Mode & Vêtements",
    icon: Shirt,
    badge: "Visuel & Photos",
    tagline: "Catalogue visuel haute définition et suivi des tailles / coloris",
    desc: "Caisse tactile visuelle avec photos haute définition des vêtements, sacs et chaussures pour une expérience client moderne et sans erreur de stock.",
    features: [
      "Grille de caisse tactile visuelle avec photos d'articles",
      "Gestion des variantes de tailles (S, M, L, XL, 42, 44) et couleurs",
      "Historique d'achat par client fidèle pour offres personnalisées",
      "Impression de tickets de caisse personnalisés avec logo de votre boutique",
    ],
    gradientDark: "from-purple-500/20 via-pink-500/10 to-slate-950",
    gradientLight: "from-purple-50 via-pink-50 to-white",
    accentDark: "text-purple-400 border-purple-500/40 bg-purple-950/60",
    accentLight: "text-purple-800 border-purple-300 bg-purple-100",
    statNumber: "100%",
    statLabel: "Visibilité sur le stock de variantes",
  },
  {
    id: "beverage",
    title: "Dépôts de Boissons & Grossistes",
    shortName: "Dépôts Boissons",
    icon: Beer,
    badge: "Multi-Dépôts",
    tagline: "Gestion des casiers consignés, fûts et transferts inter-dépôts",
    desc: "Gérez vos casiers, cartons et fûts avec alertes de seuil critique, encaissements Mobile Money et consolidation multi-points de vente sous un seul compte.",
    features: [
      "Gestion des emballages consignés (casiers vides, bouteilles)",
      "Transferts de stock sécurisés d'un dépôt central vers les succursales",
      "Tarification en gros et demi-gros paramétrable",
      "Export comptable Excel et rapports de rentabilité par camion/dépôt",
    ],
    gradientDark: "from-cyan-500/20 via-sky-500/10 to-slate-950",
    gradientLight: "from-cyan-50 via-sky-50 to-white",
    accentDark: "text-cyan-400 border-cyan-500/40 bg-cyan-950/60",
    accentLight: "text-cyan-800 border-cyan-300 bg-cyan-100",
    statNumber: "10 shops",
    statLabel: "Supervisés sous un seul compte gérant",
  },
  {
    id: "services",
    title: "Services d'Impression, Bureautique & Cyber",
    shortName: "Services & Bureaux",
    icon: Printer,
    badge: "Facturation & Devis",
    tagline: "Facturation de prestations, devis instantanés et photocopies",
    desc: "Générez des factures professionnelles pour tirages, impressions grand format, saisie et fournitures de bureau avec remises négociées.",
    features: [
      "Facturation de prestations de services sans contrainte de stock",
      "Génération immédiate de devis et factures proforma en Francs ou $",
      "Application de remises négociées au pourcentage ou montant fixe",
      "Suivi des clients professionnels en compte régulier",
    ],
    gradientDark: "from-indigo-500/20 via-teal-500/10 to-slate-950",
    gradientLight: "from-indigo-50 via-teal-50 to-white",
    accentDark: "text-indigo-400 border-indigo-500/40 bg-indigo-950/60",
    accentLight: "text-indigo-800 border-indigo-300 bg-indigo-100",
    statNumber: "0 erreur",
    statLabel: "Sur les prestations et remises",
  },
];

export default function SectorShowcase() {
  const { isDark } = useLandingTheme();
  const [activeSector, setActiveSector] = useState<Sector>(SECTORS[0]);

  return (
    <section
      id="types"
      className={`py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative border-b transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-white border-slate-800/80" : "bg-white text-slate-900 border-slate-200"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold shadow-md ${
              isDark
                ? "bg-slate-900 border border-amber-500/30 text-amber-400"
                : "bg-amber-50 border border-amber-300 text-amber-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Adapté à Chaque Métier du Commerce</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Un Micro-ERP pensé pour votre{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 dark:from-amber-400 dark:via-orange-300 dark:to-emerald-300">
              secteur d'activité.
            </span>
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Que vous dirigiez une supérette, un bar-terrasse, une quincaillerie de chantier ou un dépôt de gros, Kuettu s'adapte à vos flux opérationnels réels.
          </p>
        </div>

        {/* Interactive Sector Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none justify-start lg:justify-center">
          {SECTORS.map((sector) => {
            const Icon = sector.icon;
            const isActive = activeSector.id === sector.id;
            return (
              <button
                key={sector.id}
                onClick={() => setActiveSector(sector)}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2.5 shrink-0 transition-all border ${
                  isActive
                    ? isDark
                      ? "bg-slate-800 text-white border-emerald-500/50 shadow-lg shadow-emerald-950/40 scale-105"
                      : "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/30 scale-105"
                    : isDark
                    ? "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-300" : "text-slate-400"}`} />
                <span>{sector.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Active Sector Dynamic Showcase Card */}
        <div
          className={`rounded-3xl border p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-300 ${
            isDark
              ? "bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800"
              : "bg-slate-50 border-slate-200 shadow-slate-200"
          }`}
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Col: Details & Checklist */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isDark ? activeSector.accentDark : activeSector.accentLight
                  }`}
                >
                  {activeSector.badge}
                </span>
                <span className="text-xs text-slate-500 font-medium">Secteur Spécialisé</span>
              </div>

              <div>
                <h3 className={`text-2xl sm:text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                  {activeSector.title}
                </h3>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  {activeSector.tagline}
                </p>
                <p className={`text-sm leading-relaxed mt-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {activeSector.desc}
                </p>
              </div>

              {/* Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {activeSector.features.map((feat, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                      isDark ? "bg-slate-950/80 border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className={`text-xs leading-snug ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Metric Highlight & CTA */}
            <div
              className={`lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 ${
                isDark
                  ? "bg-slate-950/90 border-slate-800"
                  : "bg-white border-slate-200 shadow-slate-200"
              }`}
            >
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Impact Mesuré sur le Terrain
                </p>
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-amber-500 dark:from-emerald-400 dark:to-amber-300">
                  {activeSector.statNumber}
                </div>
                <p className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {activeSector.statLabel}
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isDark ? "bg-slate-900/80 border-slate-800/80" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className={`flex items-center gap-2 text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Configuration instantanée</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Activez les modules spécifiques (tables, variantes, codes-barres) en un clic dans vos paramètres.
                </p>
              </div>

              <a
                href="/auth/register"
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition-all"
              >
                <span>Démarrer pour {activeSector.shortName}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
