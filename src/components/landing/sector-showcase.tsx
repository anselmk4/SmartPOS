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
  ShieldCheck,
  Zap,
} from "lucide-react";

interface Sector {
  id: string;
  title: string;
  shortName: string;
  icon: any;
  badge: string;
  tagline: string;
  desc: string;
  features: string[];
  gradient: string;
  accentColor: string;
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
    gradient: "from-emerald-500/20 via-teal-500/10 to-slate-950",
    accentColor: "text-emerald-400 border-emerald-500/40 bg-emerald-950/60",
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
    gradient: "from-amber-500/20 via-orange-500/10 to-slate-950",
    accentColor: "text-amber-400 border-amber-500/40 bg-amber-950/60",
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
    gradient: "from-blue-500/20 via-indigo-500/10 to-slate-950",
    accentColor: "text-blue-400 border-blue-500/40 bg-blue-950/60",
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
    gradient: "from-purple-500/20 via-pink-500/10 to-slate-950",
    accentColor: "text-purple-400 border-purple-500/40 bg-purple-950/60",
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
    gradient: "from-cyan-500/20 via-sky-500/10 to-slate-950",
    accentColor: "text-cyan-400 border-cyan-500/40 bg-cyan-950/60",
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
    gradient: "from-indigo-500/20 via-teal-500/10 to-slate-950",
    accentColor: "text-indigo-400 border-indigo-500/40 bg-indigo-950/60",
    statNumber: "0 erreur",
    statLabel: "Sur les prestations et remises",
  },
];

export default function SectorShowcase() {
  const [activeSector, setActiveSector] = useState<Sector>(SECTORS[0]);

  return (
    <section id="types" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white relative border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Adapté à Chaque Métier du Commerce</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Un Micro-ERP pensé pour votre{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-300">
              secteur d'activité.
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
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
                    ? "bg-slate-800 text-white border-emerald-500/50 shadow-lg shadow-emerald-950/40 scale-105"
                    : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{sector.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Active Sector Dynamic Showcase Card */}
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Col: Details & Checklist */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${activeSector.accentColor}`}>
                  {activeSector.badge}
                </span>
                <span className="text-xs text-slate-400 font-medium">Secteur Spécialisé</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">{activeSector.title}</h3>
                <p className="text-sm font-semibold text-emerald-400 mt-1">{activeSector.tagline}</p>
                <p className="text-sm text-slate-300 leading-relaxed mt-3">{activeSector.desc}</p>
              </div>

              {/* Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {activeSector.features.map((feat, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-200 leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Metric Highlight & CTA */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Impact Mesuré sur le Terrain
                </p>
                <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-300">
                  {activeSector.statNumber}
                </div>
                <p className="text-xs font-semibold text-slate-300">{activeSector.statLabel}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Configuration instantanée</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Activez les modules spécifiques (tables, variantes, codes-barres) en un clic dans vos paramètres.
                </p>
              </div>

              <a
                href="/auth/register"
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all"
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
