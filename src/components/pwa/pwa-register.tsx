"use client";

import React, { useEffect, useState } from "react";
import { Download, Sparkles, X, CheckCircle2, WifiOff, RefreshCw } from "lucide-react";

export function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [swRegistered, setSwRegistered] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local");

      // In local dev mode, unregister SW to avoid dev CSS and HMR caching conflicts
      if (isLocalhost && process.env.NODE_ENV !== "production") {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
        if (window.caches) {
          caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
          });
        }
        return;
      }

      // In production / PWA mode, register the Service Worker
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[PWA] Service Worker registered with scope:", registration.scope);
          setSwRegistered(true);

          // Check for SW updates
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[PWA] New content is available; please refresh.");
                }
              });
            }
          });

          // Preload & warm cache for all critical POS routes
          const routesToPreload = [
            "/pos",
            "/debts",
            "/expenses",
            "/inventory",
            "/dashboard",
            "/owner",
            "/billing",
            "/settings",
            "/auth/login",
          ];

          routesToPreload.forEach((route) => {
            fetch(route, { cache: "force-cache" }).catch(() => {});
          });
        })
        .catch((error) => {
          console.warn("[PWA] Service Worker registration failed:", error);
        });

      // 3. Check if already installed in standalone mode
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      ) {
        setIsInstalled(true);
      }

      // 4. Capture beforeinstallprompt event for 1-click installation
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        const dismissed = localStorage.getItem("kuettu_pwa_install_dismissed");
        if (!dismissed) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      window.addEventListener("appinstalled", () => {
        setIsInstalled(true);
        setShowInstallBanner(false);
        setDeferredPrompt(null);
        console.log("[PWA] Kuettu SMART POS installed as desktop/mobile app!");
      });

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Pour installer cette application hors-ligne : cliquez sur le menu de votre navigateur (les 3 points en haut à droite) puis sélectionnez 'Installer l'application' ou 'Ajouter à l'écran d'accueil'.");
      return;
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("kuettu_pwa_install_dismissed", "true");
  };

  if (isInstalled || !showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-slate-700/80 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white leading-tight">
              Installer Kuettu SMART POS
            </h4>
            <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>100% Fonctionnel Hors-Ligne</span>
            </span>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-300 mb-3 leading-relaxed">
        Installez l'application sur votre appareil pour vendre et imprimer vos tickets même sans aucune connexion Internet.
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all touch-press"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installer l'App</span>
        </button>

        <button
          onClick={handleDismiss}
          className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
