"use client";

import React from "react";
import Link from "next/link";
import { Check, ArrowRight, Trash2 } from "lucide-react";
import RevealOnScroll from "./reveal-on-scroll";

export default function PosStockShowcase() {
  return (
    <section
      id="pos-stock-showcase"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-slate-100 bg-white text-slate-900 relative overflow-hidden"
    >
      {/* Soft ambient background glow */}
      <div className="absolute top-1/2 right-0 w-[550px] h-[550px] bg-blue-500/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-indigo-500/5 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-28 sm:space-y-36 relative z-10">
        {/* Main Section Header */}
        <RevealOnScroll direction="up">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              FONCTIONNALITÉS ESSENTIELLES
            </p>

            <h2 className="text-3xl sm:text-5xl lg:text-[50px] font-extrabold tracking-tight text-slate-900 leading-tight">
              Votre Partenaire de Confiance<br />
              pour la Croissance de Votre Commerce
            </h2>
          </div>
        </RevealOnScroll>

        {/* ========================================================================= */}
        {/* Section 1: Navigation Fluide & Panier POS (Text Left, Mockup Right)       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Copywriting & 3 Checkmarks */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <RevealOnScroll direction="up" delay={100}>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
                Navigation Fluide &<br />Panier Intelligent
              </h3>

              <p className="text-sm sm:text-base text-slate-500 mt-4 leading-relaxed">
                Encaissez chaque client en moins de 3 secondes grâce à une interface conçue pour la rapidité.
                Basculez entre Francs Congolais (CDF) et Dollars ($) sans risque d'erreur de rendu de monnaie.
              </p>

              <div className="pt-2">
                <Link
                  href="/pos"
                  className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:gap-2 transition-all"
                >
                  <span>En savoir plus sur la caisse</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </RevealOnScroll>

            {/* 3 Blue Circle Checkmarks */}
            <div className="space-y-3.5 pt-2">
              <RevealOnScroll direction="up" delay={200}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    Encaissement Ultra-Rapide (0ms de latence locale)
                  </span>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={250}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    Double Devise Automatique (CDF & USD en direct)
                  </span>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={300}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    Interface Tactile Intuitive (zéro formation nécessaire)
                  </span>
                </div>
              </RevealOnScroll>
            </div>
          </div>

          {/* Right Column: Zoomed High-Fidelity POS Mockup */}
          <div className="lg:col-span-7">
            <RevealOnScroll direction="up" delay={150}>
              <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-2xl overflow-hidden relative group hover:shadow-blue-500/10 transition-shadow">
                <div className="grid grid-cols-12 gap-4">
                  {/* Left: Product grid preview */}
                  <div className="col-span-7 space-y-3 border-r border-slate-100 pr-3">
                    <div className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-400 text-xs flex items-center gap-2">
                      <span className="text-xs">🔍</span>
                      <span>Rechercher un article...</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs text-left">
                      <div className="p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center hover:bg-white transition-colors">
                        <span className="text-2xl mb-1">🍺</span>
                        <p className="font-bold text-[11px] truncate w-full">Primus 72cl</p>
                        <span className="text-[10px] text-blue-600 font-bold mt-0.5">4 500 FC</span>
                      </div>

                      <div className="p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center hover:bg-white transition-colors">
                        <span className="text-2xl mb-1">🍚</span>
                        <p className="font-bold text-[11px] truncate w-full">Sucre 1kg</p>
                        <span className="text-[10px] text-blue-600 font-bold mt-0.5">3 200 FC</span>
                      </div>

                      <div className="p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center hover:bg-white transition-colors">
                        <span className="text-2xl mb-1">🌻</span>
                        <p className="font-bold text-[11px] truncate w-full">Huile 1L</p>
                        <span className="text-[10px] text-blue-600 font-bold mt-0.5">6 500 FC</span>
                      </div>

                      <div className="p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center hover:bg-white transition-colors">
                        <span className="text-2xl mb-1">🥤</span>
                        <p className="font-bold text-[11px] truncate w-full">Coca-Cola 33cl</p>
                        <span className="text-[10px] text-blue-600 font-bold mt-0.5">2 500 FC</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Order details drawer */}
                  <div className="col-span-5 flex flex-col justify-between text-xs space-y-2 text-left">
                    <div>
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100">
                        <h4 className="font-bold text-xs text-slate-900">Détails Panier</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                          3 articles
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="truncate max-w-[90px]">Primus 72cl</span>
                          <span className="font-bold text-slate-800">x2 • 9 000 FC</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="truncate max-w-[90px]">Sucre 1kg</span>
                          <span className="font-bold text-slate-800">x1 • 3 200 FC</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="truncate max-w-[90px]">Huile 1L</span>
                          <span className="font-bold text-slate-800">x1 • 6 500 FC</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Total (CDF)</span>
                        <span className="font-black text-slate-900 text-xs">18 700 FC</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Équivaut à</span>
                        <span className="font-bold text-blue-600 font-mono">$6.68 USD</span>
                      </div>
                      <div className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-[11px] text-center shadow-md shadow-blue-500/25">
                        Encaisser la Vente (0ms)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Section 2: Gestion des Stocks & Dépôts (Mockup Left, Text Right)          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Product Stock Form Mockup */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <RevealOnScroll direction="up" delay={150}>
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-2xl relative text-left">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
                  {/* Edit Form Modal Card */}
                  <div className="sm:col-span-7 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg space-y-3">
                    {/* Image & Product badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl">
                          🍚
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800">sac_riz_25kg.png</p>
                          <p className="text-[9px] text-slate-400">Alimentation • 124 KB</p>
                        </div>
                      </div>
                      <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-rose-500 transition-colors" />
                    </div>

                    {/* Item Name */}
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Nom de l'article *</label>
                      <div className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50">
                        Riz Blanc Super 25kg
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Description & Conditionnement</label>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                        Sac scellé de première qualité pour vente au détail et demi-gros. Suivi des numéros de lot et alerte rupture.
                      </p>
                    </div>

                    {/* Status toggle & Stock count */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-4 rounded-full bg-blue-600 relative flex items-center">
                          <span className="w-3 h-3 rounded-full bg-white ml-3.5 shadow-xs" />
                        </div>
                        <span className="text-[10px] font-bold text-blue-600">Actif en caisse</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 text-[10px]">Stock disponible :</span>
                        <span className="font-mono font-bold text-slate-900">48 Sacs</span>
                      </div>
                    </div>
                  </div>

                  {/* Aside Stock List Table */}
                  <div className="sm:col-span-5 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Inventaire en Direct
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[11px] text-slate-800">Sucre 50kg</p>
                          <p className="text-[9px] text-slate-400">Dépôt Central</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono text-[11px] text-slate-900">120 Sacs</span>
                          <span className="block text-[8px] text-emerald-600 font-bold">Actif</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[11px] text-slate-800">Huile Végétale 5L</p>
                          <p className="text-[9px] text-slate-400">Rayon Épicerie</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono text-[11px] text-slate-900">65 Bidons</span>
                          <span className="block text-[8px] text-emerald-600 font-bold">Actif</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[11px] text-slate-800">Savon Le Coq</p>
                          <p className="text-[9px] text-slate-400">Ménage & Hygiène</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono text-[11px] text-slate-900">250 Pcs</span>
                          <span className="block text-[8px] text-emerald-600 font-bold">Actif</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right Column: Copywriting & Learn More */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-4 text-left">
            <RevealOnScroll direction="up" delay={100}>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
                Gestion Robuste des<br />Stocks & Dépôts
              </h3>

              <p className="text-sm sm:text-base text-slate-500 leading-relaxed mt-4">
                Gardez un contrôle permanent sur votre stock avec des données fiables et à jour.
                Anticipez les ruptures grâce aux alertes de seuil critique et éliminez le surstockage coûteux.
              </p>

              <div className="pt-2">
                <Link
                  href="/inventory"
                  className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:gap-2 transition-all"
                >
                  <span>Gérer vos stocks et réassorts</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
