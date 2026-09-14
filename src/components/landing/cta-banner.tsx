"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles, ShieldCheck, Zap, Store } from "lucide-react";
import { useLandingTheme } from "./landing-theme-context";

export default function CtaBanner() {
  const { isDark } = useLandingTheme();

  return (
    <section
      className={`py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"
      }`}
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-gradient-to-r from-emerald-600/15 via-teal-600/15 to-amber-600/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div
          className={`rounded-[36px] border p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden transition-all duration-300 ${
            isDark
              ? "bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border-slate-800"
              : "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-slate-800 shadow-slate-300"
          }`}
        >
          {/* Subtle top light bar */}
          <div className="absolute top-0 inset-x-20 h-px bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent" />

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/90 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Démarrage Immédiat • 0 Frais d'Installation</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Transformez la Gestion de Votre Commerce{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                Dès Aujourd'hui.
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Rejoignez les centaines de commerçants, gérants et entrepreneurs qui ont éliminé les pertes de caisse et récupéré leurs créances grâce à Kuettu Global POS.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95"
              >
                <span>Créer mon Commerce Gratuitement</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="https://wa.me/243990387237?text=Bonjour%20Kuettu%20Global%20POS,%20j%27aimerais%20une%20assistance%20directe%20pour%20mon%20commerce."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] font-bold text-sm border border-[#25D366]/40 flex items-center justify-center gap-2.5 backdrop-blur transition-all active:scale-95 shadow-lg shadow-[#25D366]/10"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Assistance WhatsApp (+243 990 387 237)</span>
              </a>
            </div>

            {/* Quick Commitments */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Fonctionnel Hors-Ligne</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Prêt à l'emploi en 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-teal-400" />
                <span>Compatible smartphones & tablettes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
