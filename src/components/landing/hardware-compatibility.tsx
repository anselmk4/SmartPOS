"use client";

import React from "react";
import {
  Smartphone,
  Tablet,
  Laptop,
  Printer,
  Barcode,
  Sparkles,
  Bluetooth,
  Usb,
  Wifi,
} from "lucide-react";
import { useLandingTheme } from "./landing-theme-context";

export default function HardwareCompatibility() {
  const { isDark } = useLandingTheme();

  const hardwareItems = [
    {
      title: "Smartphones (Android & iOS)",
      desc: "Installez l'APK Android direct ou l'application Web PWA sur n'importe quel téléphone moderne.",
      icon: Smartphone,
      accentDark: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40",
      accentLight: "text-emerald-800 border-emerald-300 bg-emerald-100",
      tags: ["Android 8.0+", "iOS Safari PWA", "0 Go d'espace lourd"],
    },
    {
      title: "Tablettes Tactiles",
      desc: "Transformez n'importe quelle tablette en véritable terminal de caisse enregistreuse tactile 0ms.",
      icon: Tablet,
      accentDark: "text-teal-400 border-teal-500/30 bg-teal-950/40",
      accentLight: "text-teal-800 border-teal-300 bg-teal-100",
      tags: ["iPad", "Samsung Tab", "Tablettes POS dédiées"],
    },
    {
      title: "Ordinateurs PC & Mac",
      desc: "Utilisable sur Windows, macOS et Linux via Chrome ou Edge avec raccourcis clavier de caisse rapide.",
      icon: Laptop,
      accentDark: "text-blue-400 border-blue-500/30 bg-blue-950/40",
      accentLight: "text-blue-800 border-blue-300 bg-blue-100",
      tags: ["Windows 10/11", "Mac Apple Silicon", "Raccourcis Clavier"],
    },
    {
      title: "Imprimantes Thermiques (58/80mm)",
      desc: "Impression ultra-rapide des reçus clients, additions de tables et tickets Z de clôture de caisse.",
      icon: Printer,
      accentDark: "text-amber-400 border-amber-500/30 bg-amber-950/40",
      accentLight: "text-amber-800 border-amber-300 bg-amber-100",
      tags: ["ESC/POS Standard", "Bluetooth & USB", "Rouleaux 58mm & 80mm"],
    },
    {
      title: "Scanners & Lecteurs Code-Barres",
      desc: "Scannez vos articles instantanément avec n'importe quelle douchette 1D/2D filaire ou sans fil.",
      icon: Barcode,
      accentDark: "text-purple-400 border-purple-500/30 bg-purple-950/40",
      accentLight: "text-purple-800 border-purple-300 bg-purple-100",
      tags: ["Douchettes USB Plug & Play", "Scanners Bluetooth", "Codes QR"],
    },
  ];

  return (
    <section
      className={`py-20 px-4 sm:px-6 lg:px-8 relative border-b transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-white border-slate-800/80" : "bg-slate-50/70 text-slate-900 border-slate-200"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold shadow-md ${
              isDark
                ? "bg-slate-900 border border-teal-500/30 text-teal-400"
                : "bg-teal-50 border border-teal-300 text-teal-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Écosystème Matériel 100% Ouvert</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Compatible avec votre matériel existant.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-500 dark:from-teal-400 dark:via-emerald-300 dark:to-amber-300">
              Aucun achat forcé.
            </span>
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Pas besoin de terminaux propriétaires coûteux. Kuettu Global POS fonctionne sur vos smartphones, tablettes et imprimantes du commerce.
          </p>
        </div>

        {/* Hardware Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hardwareItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
                  isDark
                    ? "bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-slate-800 hover:border-slate-700 hover:shadow-xl"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg shadow-slate-200"
                }`}
              >
                <div className="space-y-4">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner ${
                      isDark ? item.accentDark : item.accentLight
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{item.title}</h3>
                    <p className={`text-xs leading-relaxed mt-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item.desc}</p>
                  </div>
                </div>

                <div
                  className={`pt-6 mt-4 border-t flex flex-wrap gap-1.5 ${
                    isDark ? "border-slate-800/80" : "border-slate-200"
                  }`}
                >
                  {item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold border ${
                        isDark
                          ? "bg-slate-950 text-slate-400 border-slate-800"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Connection Protocol Box */}
          <div
            className={`p-6 rounded-3xl border flex flex-col justify-between ${
              isDark
                ? "bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/30"
                : "bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-200 shadow-sm"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>Protocoles Pris en Charge</span>
              </div>
              <h3 className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}>Connexions Sans Pilote</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Appairez en 10 secondes vos imprimantes et lecteurs grâce aux standards universels.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4">
              <div className={`p-2.5 rounded-2xl border text-center ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                <Bluetooth className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                <p className={`text-[10px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Bluetooth</p>
              </div>
              <div className={`p-2.5 rounded-2xl border text-center ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                <Usb className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className={`text-[10px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>USB Direct</p>
              </div>
              <div className={`p-2.5 rounded-2xl border text-center ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                <Wifi className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className={`text-[10px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>Wi-Fi / LAN</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
