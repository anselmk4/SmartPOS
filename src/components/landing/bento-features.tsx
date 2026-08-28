"use client";

import React from "react";
import Link from "next/link";
import {
  WifiOff,
  Cloud,
  MessageCircle,
  Smartphone,
  Store,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  Lock,
  ArrowRightLeft,
  CheckCircle2,
  TrendingUp,
  Receipt,
  EyeOff,
} from "lucide-react";
import WhatsappSimulator from "./whatsapp-simulator";

export default function BentoFeatures() {
  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-950 text-white relative overflow-hidden border-b border-slate-800/80">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Architecture Moderne & Conçue pour le Terrain</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Tout ce dont votre commerce a besoin.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              Sans compromis.
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Une technologie de pointe réunissant la puissance d'un Micro-ERP et la simplicité d'une caisse tactile ultra-rapide.
          </p>
        </div>

        {/* Dynamic Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ========================================================================= */}
          {/* Bento Card 1 (Large 7 Cols): 100% Hors-Ligne & Cloud Sync                  */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                  <WifiOff className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-xs font-black">
                  Offline-First 0ms
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">
                  Mode Hors-Ligne Résistant & Synchronisation Cloud
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-2">
                  Coupures de courant, panne d'antenne ou manque de forfait Internet ? Votre caisse
                  continue de tourner à 100%. Le stock se décompte, les tickets s'impriment en 58mm/80mm et
                  les ventes sont enregistrées localement sur votre appareil.
                </p>
              </div>

              {/* Interactive Offline Simulation Graphic */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Statut Moteur de Caisse :</span>
                  </div>
                  <span className="text-emerald-400 font-bold">100% AUTONOME</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
                    <p className="text-slate-400 text-[10px]">Latence saisie</p>
                    <p className="font-bold text-white text-sm mt-0.5">0.0 ms</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
                    <p className="text-slate-400 text-[10px]">Base Embarquée</p>
                    <p className="font-bold text-teal-300 text-sm mt-0.5">Dexie / IndexedDB</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
                    <p className="text-slate-400 text-[10px]">Synchronisation</p>
                    <p className="font-bold text-emerald-400 text-sm mt-0.5">Cloud Auto-Sync</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
              <span>Découvrir le fonctionnement hors-ligne</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Bento Card 2 (5 Cols): Mobile Money & Double Devise                        */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300 shadow-xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-400 text-xs font-black">
                  Paiements RDC & Afrique
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Encaissement Mobile Money & Double Tiroir Cash
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-2">
                  Acceptez instantanément M-Pesa, Orange Money, Airtel Money et Afrimoney. Gérez
                  séparément les espèces en Francs Congolais (CDF) et Dollars ($) sans erreurs de monnaie.
                </p>
              </div>

              {/* Operator Badges Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-red-500/30 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-black text-[10px]">
                    MP
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white leading-none">M-Pesa</p>
                    <p className="text-[9px] text-slate-400">Vodacom</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-orange-500/30 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center font-black text-[10px]">
                    OM
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white leading-none">Orange Money</p>
                    <p className="text-[9px] text-slate-400">Orange RDC</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/30 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center font-black text-[10px]">
                    AM
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white leading-none">Airtel Money</p>
                    <p className="text-[9px] text-slate-400">Airtel Africa</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-purple-500/30 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-black text-[10px]">
                    AF
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white leading-none">Afrimoney</p>
                    <p className="text-[9px] text-slate-400">Africell</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
              <span>Voir les options de règlement</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Bento Card 3 (6 Cols): Carnet de Dettes & WhatsApp Simulator               */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-xs font-black">
                  +38% Recouvrement
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">
                  Carnet de Dettes & Relance WhatsApp 1-Clic
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-2">
                  Fini les cahiers déchirés et les créances oubliées. Enregistrez les dettes au moment de la
                  vente et relancez les clients avec un message WhatsApp professionnel et pré-rempli.
                </p>
              </div>

              {/* Embedded Live Interactive WhatsApp Simulator */}
              <WhatsappSimulator />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Bento Card 4 (6 Cols): Multi-Magasins & Sécurité Marges                    */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Store className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/40 text-indigo-400 text-xs font-black">
                  Multi-Boutiques & Dépôts
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">
                  Supervision Multi-Magasins & Marges Sécurisées
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-2">
                  Pilotez jusqu'à 10 boutiques ou dépôts depuis votre téléphone personnel. Les caissiers
                  encaissent avec leur PIN 4 chiffres sans jamais voir vos prix d'achat ni vos marges.
                </p>
              </div>

              {/* Visual Multi-Shop Hierarchy Frame */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Compte Propriétaire (Gérance)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                    Vue Consolidée
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏬</span>
                      <div>
                        <p className="font-bold text-white text-[11px]">Boutique 1 - Kinshasa Gombe</p>
                        <p className="text-[10px] text-slate-400">Gérant : Christian M. (PIN actif)</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-400">1 420 000 FC</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏢</span>
                      <div>
                        <p className="font-bold text-white text-[11px]">Dépôt 2 - Lubumbashi Centre</p>
                        <p className="text-[10px] text-slate-400">Gérant : Patrick K. (PIN actif)</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-400">890 000 FC</span>
                  </div>

                  <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-[11px] text-indigo-300">
                    <div className="flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Marges nettes et prix d'achat masqués aux caissiers</span>
                    </div>
                    <span className="font-bold">100% Protégé</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
              <span>Explorer la gestion multi-magasins</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
