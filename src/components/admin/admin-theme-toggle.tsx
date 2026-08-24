"use client";

import React from "react";
import { useAdminTheme } from "@/lib/admin/admin-theme-context";
import { Sun, Moon } from "lucide-react";

export function AdminThemeToggle() {
  const { isDark, toggleTheme } = useAdminTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border touch-press ${
        isDark
          ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700/80 hover:border-amber-500/30"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300/80 hover:border-blue-400"
      }`}
      title={isDark ? "Passer en Mode Clair (Jour)" : "Passer en Mode Nuit (Sombre)"}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-amber-300 animate-in spin-in-45 duration-300" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 animate-in spin-in-45 duration-300" />
        )}
      </div>
      <span className="hidden sm:inline-block">
        {isDark ? "Mode Nuit" : "Mode Clair"}
      </span>
    </button>
  );
}
