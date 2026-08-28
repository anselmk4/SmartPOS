"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  PlayCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  WifiOff,
  CheckCircle2,
  Lock,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import PosInteractiveMockup from "./pos-interactive-mockup";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#070d18] to-slate-950 text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60">
      {/* Dynamic Background Glow & Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Ambient Lighting Cones */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-emerald-500/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-12 right-1/4 translate-x-1/2 w-[550px] h-[320px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-blue-600/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copywriting & CTAs */}
          <div className="lg:col-span-6 xl:col-span-7 text-left space-y-6">
            {/* Top Pill Animated Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold backdrop-blur shadow-lg shadow-emerald-950/50 hover:border-emerald-400 transition-all">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>100% Hors-Ligne • Caisse Tactile 0ms & Relance WhatsApp</span>
            </div>

            {/* Main Headline with Gradient Text */}
            <h1 className="text-3xl sm:text-5xl lg:text-[46px] xl:text-[54px] font-black tracking-tight leading-[1.12]">
              Pilotez votre Caisse, vos Stocks et vos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                Dettes.
              </span>{" "}
              Même sans Internet.
            </h1>

            {/* Subtitle with High B2B African Context */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              La solution Micro-ERP tout-en-un pour les commerces en Afrique :{" "}
              <strong className="text-white font-semibold">caisse tactile 0ms</strong> sans
              latence, relance des crédits clients par{" "}
              <strong className="text-emerald-300 font-semibold">WhatsApp en 1 clic</strong>,
              supervision <strong className="text-white font-semibold">multi-magasins</strong> et
              encaissement direct{" "}
              <strong className="text-amber-300 font-semibold">
                M-Pesa, Orange Money, Airtel Money & Afrimoney
              </strong>
              .
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              {/* Primary Glow CTA */}
              <Link
                href="/auth/register"
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Créer mon Commerce Gratuitement</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary Demo CTA */}
              <Link
                href="/pos"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-bold text-sm border border-slate-700 hover:border-slate-500 shadow-lg backdrop-blur transition-all active:scale-[0.98]"
              >
                <PlayCircle className="w-4 h-4 text-emerald-400" />
                <span>Tester la Caisse Démo</span>
              </Link>
            </div>

            {/* Trust Signals & Key Selling Points Mini Bar */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sans engagement ni carte bancaire</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Données chiffrées & Cloud Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Installation en 2 minutes</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive POS Terminal & Floating Badges */}
          <div className="lg:col-span-6 xl:col-span-5 relative">
            {/* Top Floating Badge */}
            <div className="absolute -top-4 -left-3 sm:-left-6 z-20 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl border border-emerald-500/30 flex items-center gap-2.5 shadow-xl animate-float">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                ⚡
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-white leading-tight">Zéro Coupure Réseau</p>
                <p className="text-[10px] text-emerald-400 font-medium">Caisse 100% active hors-ligne</p>
              </div>
            </div>

            {/* Bottom Floating Badge */}
            <div className="absolute -bottom-4 -right-3 sm:-right-4 z-20 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl border border-amber-500/30 flex items-center gap-2.5 shadow-xl animate-float-delayed">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                💬
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-amber-300 leading-tight">+38% Recouvrement</p>
                <p className="text-[10px] text-slate-300 font-medium">Relances WhatsApp 1-clic</p>
              </div>
            </div>

            {/* Interactive Component */}
            <PosInteractiveMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
