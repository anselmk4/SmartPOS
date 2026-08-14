"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, RefreshCw, WifiOff } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn("[Global Error Handled]:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <WifiOff className="w-8 h-8 text-blue-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
            Mode Hors-Ligne Actif
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
            Vos données de boutique sont conservées localement dans la mémoire de votre appareil. Vous pouvez continuer à enregistrer vos ventes.
          </p>

          <div className="space-y-2.5">
            <a
              href="/pos"
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Accéder à la Caisse Tactile</span>
            </a>

            <button
              onClick={() => reset()}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
