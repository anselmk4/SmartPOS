"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  WifiOff,
  CheckCircle2,
  Store,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import PosInteractiveMockup from "./pos-interactive-mockup";
import ThemeToggle from "./theme-toggle";
import { useLandingTheme } from "./landing-theme-context";

export default function HeroSection() {
  const { isDark } = useLandingTheme();

  return (
    <section
      className={`relative overflow-hidden pt-4 pb-20 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-white border-slate-800/80"
          : "bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 border-slate-200"
      }`}
    >
      {/* Background Decorative Grid & Gradients */}
      <div
        className={`absolute inset-0 bg-[size:36px_36px] pointer-events-none ${
          isDark
            ? "bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_70%,transparent_100%)]"
            : "bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_80%,transparent_100%)]"
        }`}
      />

      {/* Ambient Lighting Cones */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 -translate-y-1/3 w-[650px] h-[400px] bg-emerald-500/12 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-20 right-1/4 translate-x-1/3 w-[550px] h-[350px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Floating Glass Navigation Bar */}
        <header
          className={`mb-10 p-2 sm:p-2.5 rounded-full border backdrop-blur-xl transition-all shadow-lg flex items-center justify-between gap-2 ${
            isDark
              ? "bg-slate-900/80 border-slate-800 text-slate-200 shadow-slate-950/40"
              : "bg-white/85 border-slate-200 text-slate-800 shadow-slate-200/50"
          }`}
        >
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 pl-3 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <Store className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-sm font-black tracking-tight leading-none block">
                Kuettu <span className="text-emerald-500">POS</span>
              </span>
              <span className="text-[9px] text-slate-400 font-medium tracking-wide">
                Micro-ERP Afrique
              </span>
            </div>
          </Link>

          {/* Nav Quick Anchors */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            <a
              href="#features"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                isDark ? "hover:text-emerald-400 hover:bg-slate-800/60" : "hover:text-emerald-600 hover:bg-slate-100"
              }`}
            >
              Fonctionnalités
            </a>
            <a
              href="#types"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                isDark ? "hover:text-emerald-400 hover:bg-slate-800/60" : "hover:text-emerald-600 hover:bg-slate-100"
              }`}
            >
              Métiers
            </a>
            <a
              href="#hardware"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                isDark ? "hover:text-emerald-400 hover:bg-slate-800/60" : "hover:text-emerald-600 hover:bg-slate-100"
              }`}
            >
              Matériel
            </a>
            <a
              href="#pricing"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                isDark ? "hover:text-emerald-400 hover:bg-slate-800/60" : "hover:text-emerald-600 hover:bg-slate-100"
              }`}
            >
              Tarifs
            </a>
            <a
              href="#faq"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                isDark ? "hover:text-emerald-400 hover:bg-slate-800/60" : "hover:text-emerald-600 hover:bg-slate-100"
              }`}
            >
              FAQ
            </a>
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-2 pr-1">
            <Link
              href="/auth/login"
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Connexion
            </Link>

            <Link
              href="/auth/register"
              className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all hidden sm:inline-flex items-center gap-1.5"
            >
              <span>Créer mon Compte</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            <div className="pl-1 border-l border-slate-700/40">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copywriting & Value Propositions */}
          <div className="lg:col-span-6 xl:col-span-7 text-left space-y-6">
            {/* Live Status Pill Badge */}
            <div
              className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur shadow-sm transition-all ${
                isDark
                  ? "bg-slate-900/90 border border-emerald-500/40 text-emerald-300 shadow-emerald-950/40 hover:border-emerald-400"
                  : "bg-white border border-emerald-300 text-emerald-800 shadow-slate-200 hover:border-emerald-500"
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>100% Offline-First • Latence 0ms • Relance WhatsApp</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[46px] xl:text-[54px] font-black tracking-tight leading-[1.12]">
              Pilotez votre Caisse, vos Stocks et vos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400">
                Dettes.
              </span>{" "}
              Même sans Internet.
            </h1>

            {/* Strategic Value Proposition: Condensed Chips Grid */}
            <p
              className={`text-sm sm:text-base leading-relaxed max-w-2xl font-normal ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Le Micro-ERP tout-en-un conçu pour le terrain en Afrique : encaissement ultra-rapide,
              gestion stricte du double tiroir <strong>CDF & USD</strong>, recouvrement des crédits par <strong>WhatsApp</strong> et paiements <strong>Mobile Money</strong>.
            </p>

            {/* Key Value Props Pill Badges (Reduced Text Burden) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div
                className={`p-2.5 rounded-2xl border transition-all ${
                  isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-500 font-black text-xs">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>0.0 ms</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">
                  Latence locale
                </p>
              </div>

              <div
                className={`p-2.5 rounded-2xl border transition-all ${
                  isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-500 font-black text-xs">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>+38%</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">
                  Recouvrement Dettes
                </p>
              </div>

              <div
                className={`p-2.5 rounded-2xl border transition-all ${
                  isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-1.5 text-teal-500 font-black text-xs">
                  <WifiOff className="w-3.5 h-3.5 shrink-0" />
                  <span>100%</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">
                  Hors-Ligne Actif
                </p>
              </div>

              <div
                className={`p-2.5 rounded-2xl border transition-all ${
                  isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-1.5 text-indigo-500 font-black text-xs">
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span>CDF & USD</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">
                  Double Devise & M-Pesa
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/auth/register"
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Créer mon Commerce Gratuitement</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="https://wa.me/243990387237?text=Bonjour%20Kuettu%20Global%20POS,%20j%27aimerais%20une%20assistance%20directe%20pour%20mon%20commerce."
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-sm border shadow-lg backdrop-blur transition-all active:scale-[0.98] ${
                  isDark
                    ? "bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border-[#25D366]/30 shadow-[#25D366]/10"
                    : "bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border-[#25D366]/30"
                }`}
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Assistance WhatsApp (+243 990 387 237)</span>
              </a>
            </div>

            {/* Trust Signals */}
            <div
              className={`pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs border-t ${
                isDark ? "text-slate-400 border-slate-800/80" : "text-slate-600 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sans engagement ni carte bancaire</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Données chiffrées & Cloud Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Prêt en 2 minutes</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive POS Terminal & Floating Badges */}
          <div className="lg:col-span-6 xl:col-span-5 relative">
            {/* Top Floating Badge */}
            <div
              className={`absolute -top-4 -left-3 sm:-left-6 z-20 px-3.5 py-2 rounded-2xl border flex items-center gap-2.5 shadow-xl backdrop-blur-md transition-all hover:scale-105 ${
                isDark
                  ? "bg-slate-900/95 text-white border-emerald-500/30"
                  : "bg-white text-slate-900 border-emerald-300"
              }`}
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-500 font-bold text-xs">
                ⚡
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold leading-tight">Zéro Coupure Réseau</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Caisse 100% active hors-ligne
                </p>
              </div>
            </div>

            {/* Bottom Floating Badge */}
            <div
              className={`absolute -bottom-4 -right-3 sm:-right-4 z-20 px-3.5 py-2.5 rounded-2xl border flex items-center gap-2.5 shadow-xl backdrop-blur-md transition-all hover:scale-105 ${
                isDark
                  ? "bg-slate-900/95 text-white border-amber-500/30"
                  : "bg-white text-slate-900 border-amber-300"
              }`}
            >
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 font-bold text-xs">
                💬
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-300 leading-tight">
                  +38% Recouvrement
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                  Relances WhatsApp 1-clic
                </p>
              </div>
            </div>

            {/* Interactive POS Component */}
            <PosInteractiveMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
