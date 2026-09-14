"use client";

import React from "react";
import {
  WifiOff,
  MessageCircle,
  Smartphone,
  Store,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  EyeOff,
  CheckCircle2,
  Lock,
  Coins,
} from "lucide-react";
import WhatsappSimulator from "./whatsapp-simulator";
import { useLandingTheme } from "./landing-theme-context";

export default function BentoFeatures() {
  const { isDark } = useLandingTheme();

  return (
    <section
      id="features"
      className={`py-20 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-white border-slate-800/80" : "bg-slate-50/70 text-slate-900 border-slate-200"
      }`}
    >
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold shadow-sm ${
              isDark
                ? "bg-slate-900 border border-emerald-500/30 text-emerald-400"
                : "bg-white border border-emerald-300 text-emerald-800 shadow-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Architecture Moderne & Conçue pour le Terrain</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Tout ce dont votre commerce a besoin.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400">
              Sans compromis.
            </span>
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Une technologie de pointe réunissant la puissance d'un Micro-ERP et la simplicité d'une caisse tactile ultra-rapide.
          </p>
        </div>

        {/* Dynamic Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ========================================================================= */}
          {/* Bento Card 1 (Large 7 Cols): 100% Hors-Ligne & DexieDB Engine              */}
          {/* ========================================================================= */}
          <div
            className={`lg:col-span-7 rounded-3xl border p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 shadow-xl ${
              isDark
                ? "bg-slate-900/70 border-slate-800 hover:border-emerald-500/40 hover:shadow-emerald-950/20"
                : "bg-white border-slate-200 hover:border-emerald-400 shadow-slate-200"
            }`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-inner">
                  <WifiOff className="w-6 h-6" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black border ${
                    isDark
                      ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-400"
                      : "bg-emerald-100 border-emerald-300 text-emerald-800"
                  }`}
                >
                  Offline-First 0.0ms
                </span>
              </div>

              <div>
                <h3 className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                  Mode Hors-Ligne Résistant & Synchronisation Cloud
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed mt-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Coupures de courant ou panne réseau ? Votre caisse ne s'arrête jamais. Les ventes et tickets s'impriment en local puis se synchronisent au retour de connexion.
                </p>
              </div>

              {/* Offline Graphic Dashboard */}
              <div
                className={`p-4 rounded-2xl border space-y-3 font-mono text-xs ${
                  isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className={`flex items-center justify-between border-b pb-2 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <div className={`flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Statut Moteur de Caisse :</span>
                  </div>
                  <span className="text-emerald-500 font-bold">100% AUTONOME</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className={`p-2.5 rounded-xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                    <p className="text-slate-400 text-[10px]">Latence saisie</p>
                    <p className={`font-bold text-sm mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>0.0 ms</p>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                    <p className="text-slate-400 text-[10px]">Base Embarquée</p>
                    <p className="font-bold text-teal-400 text-sm mt-0.5">Dexie / IndexedDB</p>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                    <p className="text-slate-400 text-[10px]">Sauvegarde</p>
                    <p className="font-bold text-emerald-500 text-sm mt-0.5">Cloud Auto-Sync</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-emerald-500 group-hover:opacity-80 transition-opacity">
              <span>Technologie hors-ligne sécurisée</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Bento Card 2 (5 Cols): Mobile Money & Double Devise                        */}
          {/* ========================================================================= */}
          <div
            className={`lg:col-span-5 rounded-3xl border p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 shadow-xl ${
              isDark
                ? "bg-slate-900/70 border-slate-800 hover:border-amber-500/40 hover:shadow-amber-950/20"
                : "bg-white border-slate-200 hover:border-amber-400 shadow-slate-200"
            }`}
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black border ${
                    isDark
                      ? "bg-amber-950/70 border-amber-500/40 text-amber-400"
                      : "bg-amber-100 border-amber-300 text-amber-800"
                  }`}
                >
                  Paiements RDC & Afrique
                </span>
              </div>

              <div>
                <h3 className={`text-xl sm:text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                  Mobile Money & Double Tiroir Espèces
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed mt-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Acceptez instantanément tous les opérateurs et gérez séparément vos espèces en Francs Congolais (CDF) et Dollars ($).
                </p>
              </div>

              {/* Operator Badges Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${isDark ? "bg-slate-950 border-red-500/30" : "bg-red-50/50 border-red-200"}`}>
                  <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center font-black text-[10px]">
                    MP
                  </div>
                  <div>
                    <p className={`text-[11px] font-bold leading-none ${isDark ? "text-white" : "text-slate-900"}`}>M-Pesa</p>
                    <p className="text-[9px] text-slate-500">Vodacom</p>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${isDark ? "bg-slate-950 border-orange-500/30" : "bg-orange-50/50 border-orange-200"}`}>
                  <div className="w-6 h-6 rounded-lg bg-orange-600/20 text-orange-500 flex items-center justify-center font-black text-[10px]">
                    OM
                  </div>
                  <div>
                    <p className={`text-[11px] font-bold leading-none ${isDark ? "text-white" : "text-slate-900"}`}>Orange Money</p>
                    <p className="text-[9px] text-slate-500">Orange RDC</p>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${isDark ? "bg-slate-950 border-rose-500/30" : "bg-rose-50/50 border-rose-200"}`}>
                  <div className="w-6 h-6 rounded-lg bg-rose-600/20 text-rose-500 flex items-center justify-center font-black text-[10px]">
                    AM
                  </div>
                  <div>
                    <p className={`text-[11px] font-bold leading-none ${isDark ? "text-white" : "text-slate-900"}`}>Airtel Money</p>
                    <p className="text-[9px] text-slate-500">Airtel Africa</p>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${isDark ? "bg-slate-950 border-purple-500/30" : "bg-purple-50/50 border-purple-200"}`}>
                  <div className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-500 flex items-center justify-center font-black text-[10px]">
                    AF
                  </div>
                  <div>
                    <p className={`text-[11px] font-bold leading-none ${isDark ? "text-white" : "text-slate-900"}`}>Afrimoney</p>
                    <p className="text-[9px] text-slate-500">Africell</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-2 text-xs font-bold text-amber-500 group-hover:opacity-80 transition-opacity">
              <span>Double tiroir-caisse étanche</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Bento Card 3 (6 Cols): Carnet de Dettes & WhatsApp Simulator               */}
          {/* ========================================================================= */}
          <div
            className={`lg:col-span-6 rounded-3xl border p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 shadow-xl ${
              isDark
                ? "bg-slate-900/70 border-slate-800 hover:border-emerald-500/40 hover:shadow-emerald-950/20"
                : "bg-white border-slate-200 hover:border-emerald-400 shadow-slate-200"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-inner">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black border ${
                    isDark
                      ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-400"
                      : "bg-emerald-100 border-emerald-300 text-emerald-800"
                  }`}
                >
                  +38% Recouvrement
                </span>
              </div>

              <div>
                <h3 className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                  Carnet de Dettes & Relance WhatsApp 1-Clic
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed mt-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Fini les cahiers déchirés et les créances perdues. Relancez vos clients avec un message pré-rempli contenant le solde exact en CDF ou USD.
                </p>
              </div>

              {/* Embedded Live Interactive WhatsApp Simulator */}
              <WhatsappSimulator />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Bento Card 4 (6 Cols): Multi-Magasins & Sécurité Marges                    */}
          {/* ========================================================================= */}
          <div
            className={`lg:col-span-6 rounded-3xl border p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 shadow-xl ${
              isDark
                ? "bg-slate-900/70 border-slate-800 hover:border-indigo-500/40 hover:shadow-indigo-950/20"
                : "bg-white border-slate-200 hover:border-indigo-400 shadow-slate-200"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Store className="w-6 h-6" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black border ${
                    isDark
                      ? "bg-indigo-950/70 border-indigo-500/40 text-indigo-400"
                      : "bg-indigo-100 border-indigo-300 text-indigo-800"
                  }`}
                >
                  Multi-Boutiques & Dépôts
                </span>
              </div>

              <div>
                <h3 className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                  Supervision Multi-Magasins & Marges Sécurisées
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed mt-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Pilotez jusqu'à 10 succursales depuis votre téléphone. Les caissiers utilisent leur PIN 4 chiffres sans jamais voir vos marges ni vos prix d'achat.
                </p>
              </div>

              {/* Visual Multi-store Hub */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className={`flex items-center justify-between pb-2 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Compte Propriétaire (Gérance)</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isDark
                        ? "text-emerald-400 bg-emerald-950/60"
                        : "text-emerald-800 bg-emerald-100"
                    }`}
                  >
                    Vue Consolidée
                  </span>
                </div>

                <div className="space-y-2">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏬</span>
                      <div>
                        <p className={`font-bold text-[11px] ${isDark ? "text-white" : "text-slate-900"}`}>Boutique 1 - Kinshasa Gombe</p>
                        <p className="text-[10px] text-slate-500">Gérant : Christian M. (PIN actif)</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-500">1 420 000 FC</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏢</span>
                      <div>
                        <p className={`font-bold text-[11px] ${isDark ? "text-white" : "text-slate-900"}`}>Dépôt 2 - Lubumbashi Centre</p>
                        <p className="text-[10px] text-slate-500">Gérant : Patrick K. (PIN actif)</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-500">890 000 FC</span>
                  </div>

                  <div className={`p-2 rounded-xl border flex items-center justify-between text-[11px] ${isDark ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-900"}`}>
                    <div className="flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Marges nettes et prix d'achat masqués aux caissiers</span>
                    </div>
                    <span className="font-bold">100% Protégé</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2 text-xs font-bold text-indigo-400 group-hover:opacity-80 transition-opacity">
              <span>Gestion multi-magasins intégrée</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
