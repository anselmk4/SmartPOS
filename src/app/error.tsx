"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, RefreshCw, AlertTriangle, WifiOff, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn("[App Error Handled]:", error);
  }, [error]);

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
          {isOffline ? <WifiOff className="w-8 h-8 text-blue-400" /> : <AlertTriangle className="w-8 h-8 text-amber-400" />}
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
          {isOffline ? "Mode Caisse Hors-Ligne" : "Affichage Récupéré"}
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
          {isOffline
            ? "Votre connexion Internet est coupée. Toutes vos données locales et votre caisse tactile restent 100% opérationnelles."
            : "Une petite interruption de chargement est survenue. Cliquez ci-dessous pour revenir directement à la caisse."}
        </p>

        <div className="space-y-2.5">
          <Link
            href="/pos"
            className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all touch-press"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Ouvrir la Caisse Tactile</span>
          </Link>

          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser la page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
