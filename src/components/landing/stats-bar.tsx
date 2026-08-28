"use client";

import React from "react";
import { Zap, MessageCircle, WifiOff, Coins, ArrowUpRight } from "lucide-react";

export default function StatsBar() {
  const stats = [
    {
      value: "0ms",
      label: "Latence Locale",
      desc: "Ventes instantanées sans aucune interruption réseau.",
      icon: Zap,
      accent: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
      badge: "Vitesse Pure",
    },
    {
      value: "+38%",
      label: "Taux de Recouvrement",
      desc: "Rappels de dettes WhatsApp pré-remplis en 1 clic.",
      icon: MessageCircle,
      accent: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
      badge: "Fintech Cash",
    },
    {
      value: "100%",
      label: "Hors-Ligne & Résilient",
      desc: "Fonctionne sans Internet ni électricité continue.",
      icon: WifiOff,
      accent: "from-teal-500/20 to-cyan-500/20 text-teal-400 border-teal-500/30",
      badge: "Offline-First",
    },
    {
      value: "CDF & USD",
      label: "Multi-Devises Strict",
      desc: "Taux du jour paramétrable et double tiroir-caisse.",
      icon: Coins,
      accent: "from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30",
      badge: "Afrique / RDC",
    },
  ];

  return (
    <section className="relative bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="group relative p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 hover:border-slate-700 hover:shadow-xl hover:shadow-emerald-950/20 transition-all duration-300 backdrop-blur"
              >
                {/* Subtle top gradient line */}
                <div className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent group-hover:via-emerald-500/60 transition-all" />

                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stat.accent} border flex items-center justify-center shadow-inner`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
                    {stat.badge}
                  </span>
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-1">
                    <span>{stat.value}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 mt-1">{stat.label}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{stat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
