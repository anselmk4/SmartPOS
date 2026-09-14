"use client";

import React from "react";
import { Zap, MessageCircle, WifiOff, Coins } from "lucide-react";
import { useLandingTheme } from "./landing-theme-context";

export default function StatsBar() {
  const { isDark } = useLandingTheme();

  const stats = [
    {
      value: "0ms",
      label: "Latence Locale",
      desc: "Ventes instantanées sans aucune interruption réseau.",
      icon: Zap,
      accentDark: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
      accentLight: "from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200",
      badge: "Vitesse Pure",
    },
    {
      value: "+38%",
      label: "Taux de Recouvrement",
      desc: "Rappels de dettes WhatsApp pré-remplis en 1 clic.",
      icon: MessageCircle,
      accentDark: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
      accentLight: "from-amber-100 to-orange-100 text-amber-700 border-amber-200",
      badge: "Fintech Cash",
    },
    {
      value: "100%",
      label: "Hors-Ligne & Résilient",
      desc: "Fonctionne sans Internet ni électricité continue.",
      icon: WifiOff,
      accentDark: "from-teal-500/20 to-cyan-500/20 text-teal-400 border-teal-500/30",
      accentLight: "from-teal-100 to-cyan-100 text-teal-700 border-teal-200",
      badge: "Offline-First",
    },
    {
      value: "CDF & USD",
      label: "Multi-Devises Strict",
      desc: "Taux du jour paramétrable et double tiroir-caisse.",
      icon: Coins,
      accentDark: "from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30",
      accentLight: "from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200",
      badge: "Afrique / RDC",
    },
  ];

  return (
    <section
      className={`relative py-12 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-300 ${
        isDark ? "bg-slate-950 border-slate-800/80 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className={`group relative p-5 rounded-3xl border transition-all duration-300 backdrop-blur ${
                  isDark
                    ? "bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-slate-800/90 hover:border-slate-700 hover:shadow-xl hover:shadow-emerald-950/20"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200"
                }`}
              >
                {/* Top gradient highlight */}
                <div
                  className={`absolute top-0 inset-x-6 h-px transition-all ${
                    isDark
                      ? "bg-gradient-to-r from-transparent via-slate-700 to-transparent group-hover:via-emerald-500/60"
                      : "bg-gradient-to-r from-transparent via-slate-300 to-transparent group-hover:via-emerald-500/60"
                  }`}
                />

                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${
                      isDark ? stat.accentDark : stat.accentLight
                    } border flex items-center justify-center shadow-inner`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      isDark
                        ? "text-slate-400 bg-slate-800/80 border-slate-700/60"
                        : "text-slate-600 bg-white border-slate-200 shadow-xs"
                    }`}
                  >
                    {stat.badge}
                  </span>
                </div>

                <div>
                  <div
                    className={`text-2xl sm:text-3xl font-black font-mono tracking-tight flex items-baseline gap-1 ${
                      isDark ? "text-white" : "text-slate-950"
                    }`}
                  >
                    <span>{stat.value}</span>
                  </div>
                  <h3
                    className={`text-sm font-bold mt-1 ${
                      isDark ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    {stat.label}
                  </h3>
                  <p
                    className={`text-xs leading-relaxed mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {stat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
