"use client";

import React from "react";
import { Zap, MessageCircle, WifiOff, Coins, ArrowUpRight, Activity } from "lucide-react";
import { useLandingTheme } from "./landing-theme-context";

export default function StatsBar() {
  const { isDark } = useLandingTheme();

  const stats = [
    {
      value: "0.0ms",
      label: "Latence Locale",
      desc: "Encaissement instantané sur base DexieDB.",
      icon: Zap,
      accentDark: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
      accentLight: "from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200",
      badge: "Zéro Attente",
      metricNote: "Mesuré sur terminal",
    },
    {
      value: "+38%",
      label: "Recouvrement Dettes",
      desc: "Rappels WhatsApp pré-remplis en 1 clic.",
      icon: MessageCircle,
      accentDark: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
      accentLight: "from-amber-100 to-orange-100 text-amber-700 border-amber-200",
      badge: "Fintech Cash",
      metricNote: "Moyenne marchands RDC",
    },
    {
      value: "100%",
      label: "Offline-First",
      desc: "Tourne sans Internet ni courant continu.",
      icon: WifiOff,
      accentDark: "from-teal-500/20 to-cyan-500/20 text-teal-400 border-teal-500/30",
      accentLight: "from-teal-100 to-cyan-100 text-teal-700 border-teal-200",
      badge: "Résilience Terrain",
      metricNote: "Auto-sync Cloud",
    },
    {
      value: "CDF & USD",
      label: "Multi-Devises Strict",
      desc: "Taux du jour et double tiroir-caisse étanche.",
      icon: Coins,
      accentDark: "from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30",
      accentLight: "from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200",
      badge: "RDC / Afrique",
      metricNote: "M-Pesa / Orange / Airtel",
    },
  ];

  return (
    <section
      className={`relative py-10 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-300 ${
        isDark ? "bg-slate-950 border-slate-800/80 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className={`group relative p-5 rounded-3xl border transition-all duration-300 backdrop-blur hover:-translate-y-0.5 ${
                  isDark
                    ? "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:shadow-xl hover:shadow-emerald-950/20"
                    : "bg-slate-50/90 border-slate-200/90 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60"
                }`}
              >
                {/* Top glowing line on hover */}
                <div
                  className={`absolute top-0 inset-x-8 h-px transition-all ${
                    isDark
                      ? "bg-gradient-to-r from-transparent via-slate-700 to-transparent group-hover:via-emerald-500/60"
                      : "bg-gradient-to-r from-transparent via-slate-300 to-transparent group-hover:via-emerald-500/60"
                  }`}
                />

                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${
                      isDark ? stat.accentDark : stat.accentLight
                    } border flex items-center justify-center shadow-inner`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
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
                    className={`text-xs font-bold mt-1 ${
                      isDark ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    {stat.label}
                  </h3>

                  <p
                    className={`text-[11px] leading-snug mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {stat.desc}
                  </p>
                </div>

                <div
                  className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[10px] ${
                    isDark ? "border-slate-800/60 text-slate-500" : "border-slate-200/80 text-slate-400"
                  }`}
                >
                  <span>{stat.metricNote}</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
