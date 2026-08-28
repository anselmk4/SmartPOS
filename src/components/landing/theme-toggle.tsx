"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useLandingTheme } from "./landing-theme-context";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme } = useLandingTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 ${
        isDark
          ? "bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-400/40"
          : "bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 shadow-xs"
      } ${className}`}
      title={isDark ? "Passer en Mode Clair" : "Passer en Mode Sombre"}
      aria-label="Basculer le thème"
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline text-[11px]">Mode Clair</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline text-[11px]">Mode Sombre</span>
        </>
      )}
    </button>
  );
}
