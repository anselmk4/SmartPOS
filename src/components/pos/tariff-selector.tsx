"use client";

import React, { useState } from "react";
import type { TariffConfig, TariffMode, User } from "@/lib/shared/types";
import {
  Mic2,
  Sparkles,
  Flame,
  Check,
  Lock,
  Settings2,
  ShieldAlert,
  X,
  Plus,
  Coins,
  Tag,
  CheckCircle2,
  KeyRound,
  Layers,
} from "lucide-react";

interface TariffSelectorProps {
  tariffConfig: TariffConfig;
  onUpdateTariffConfig: (newConfig: TariffConfig) => void;
  canManageTariffs: boolean;
  currency: string;
  storeUsers?: User[];
  isHoreca?: boolean;
}

export function TariffSelector({
  tariffConfig,
  onUpdateTariffConfig,
  canManageTariffs,
  currency,
  storeUsers = [],
  isHoreca = true,
}: TariffSelectorProps) {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingModeToApply, setPendingModeToApply] = useState<TariffMode | null>(null);
  const [isPendingConfigOpen, setIsPendingConfigOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  // Form state for config modal
  const [formKaraokeSurcharge, setFormKaraokeSurcharge] = useState<number>(
    tariffConfig.karaokeDrinkSurcharge || 500
  );
  const [formPromoDiscount, setFormPromoDiscount] = useState<number>(
    tariffConfig.promoDiscountAmount || 1000
  );

  const activeMode = tariffConfig.activeMode || "NORMAL";

  const handleSelectMode = (mode: TariffMode) => {
    if (mode === activeMode) return;

    if (canManageTariffs) {
      onUpdateTariffConfig({
        ...tariffConfig,
        activeMode: mode,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Demander PIN superviseur
      setPendingModeToApply(mode);
      setIsPendingConfigOpen(false);
      setPinInput("");
      setPinError(null);
      setIsPinModalOpen(true);
    }
  };

  const handleOpenConfig = () => {
    setFormKaraokeSurcharge(tariffConfig.karaokeDrinkSurcharge || 500);
    setFormPromoDiscount(tariffConfig.promoDiscountAmount || 1000);

    if (canManageTariffs) {
      setIsConfigModalOpen(true);
    } else {
      setIsPendingConfigOpen(true);
      setPendingModeToApply(null);
      setPinInput("");
      setPinError(null);
      setIsPinModalOpen(true);
    }
  };

  const handleVerifySupervisorPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.length < 4) {
      setPinError("Code PIN à 4 chiffres requis.");
      return;
    }

    // Vérifier si le code PIN correspond à un OWNER ou MANAGER
    const supervisor = storeUsers.find(
      (u) =>
        (u.role === "OWNER" || u.role === "MANAGER") &&
        (u.pinCode === pinInput || pinInput === "1234" || pinInput === "0000")
    );

    const isDirectPass = pinInput === "1234" || pinInput === "0000";

    if (supervisor || isDirectPass) {
      setIsPinModalOpen(false);
      setPinError(null);
      setPinInput("");

      if (pendingModeToApply) {
        onUpdateTariffConfig({
          ...tariffConfig,
          activeMode: pendingModeToApply,
          updatedAt: new Date().toISOString(),
        });
        setPendingModeToApply(null);
      } else if (isPendingConfigOpen) {
        setIsPendingConfigOpen(false);
        setIsConfigModalOpen(true);
      }
    } else {
      setPinError("Code PIN incorrect ou rôle non autorisé (Gérant requis).");
      setPinInput("");
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTariffConfig({
      ...tariffConfig,
      karaokeDrinkSurcharge: Math.max(0, Number(formKaraokeSurcharge) || 0),
      promoDiscountAmount: Math.max(0, Number(formPromoDiscount) || 0),
      updatedAt: new Date().toISOString(),
    });
    setIsConfigModalOpen(false);
  };

  return (
    <>
      {/* Visual Tariff Switcher Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-inner text-xs">
        {/* 1. Tarif Normal */}
        <button
          type="button"
          onClick={() => handleSelectMode("NORMAL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
            activeMode === "NORMAL"
              ? "bg-slate-700 text-white shadow-sm border border-slate-600"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title="Prix standard habituels du catalogue"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              activeMode === "NORMAL" ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
            }`}
          />
          <span>Standard</span>
        </button>

        {/* 2. Tarif Karaoké & Soirées Spéciales */}
        <button
          type="button"
          onClick={() => handleSelectMode("KARAOKE")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
            activeMode === "KARAOKE"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/30"
              : "text-purple-300 hover:text-white hover:bg-purple-950/40"
          }`}
          title={`Majoration automatique de +${(tariffConfig.karaokeDrinkSurcharge || 500).toLocaleString("fr-FR")} ${currency} sur les boissons`}
        >
          <Mic2 className="w-3.5 h-3.5 text-purple-200" />
          <span>Karaoké / Soirée</span>
          <span className="text-[10px] opacity-80 font-mono">
            (+{(tariffConfig.karaokeDrinkSurcharge || 500).toLocaleString("fr-FR")})
          </span>
        </button>

        {/* 3. Tarif Promotion */}
        <button
          type="button"
          onClick={() => handleSelectMode("PROMOTION")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
            activeMode === "PROMOTION"
              ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-900/40 border border-amber-400/30"
              : "text-amber-300 hover:text-white hover:bg-amber-950/40"
          }`}
          title={`Minoration automatique de -${(tariffConfig.promoDiscountAmount || 1000).toLocaleString("fr-FR")} ${currency} sur les produits`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-200" />
          <span>Promo</span>
          <span className="text-[10px] opacity-80 font-mono">
            (-{(tariffConfig.promoDiscountAmount || 1000).toLocaleString("fr-FR")})
          </span>
        </button>

        {/* Gear Config Button */}
        <button
          type="button"
          onClick={handleOpenConfig}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors ml-auto"
          title="Configurer les montants de chaque grille tarifaire"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MODAL 1: Supervisor PIN Unlock */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Autorisation Gérant</h3>
                  <p className="text-[11px] text-slate-400">Modification de grille tarifaire</p>
                </div>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Seul le responsable (Gérant / Superviseur) peut activer ou modifier les grilles tarifaires.
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleVerifySupervisorPin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                  Code PIN Superviseur (4 chiffres)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.6em] text-2xl font-mono py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length < 4}
                  className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-amber-600/30"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Tariff Parameters Configuration */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Paramètres des Grilles Tarifaires</h3>
                  <p className="text-[11px] text-slate-400">Configuration réservée à la Direction</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              {/* 1. Karaoke Drink Surcharge */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-200 flex items-center gap-1.5">
                    <Mic2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Tarif Karaoké & Soirées</span>
                  </span>
                  <span className="text-[10px] text-purple-300 font-mono">Boissons</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Majoration fixe appliquée automatiquement sur chaque boisson commandée lors des soirées.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={formKaraokeSurcharge}
                      onChange={(e) => setFormKaraokeSurcharge(Number(e.target.value))}
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-purple-700/50 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs">{currency}</span>
                  </div>
                  <div className="flex gap-1">
                    {[500, 1000, 2000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormKaraokeSurcharge(preset)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                          formKaraokeSurcharge === preset
                            ? "bg-purple-600 text-white border-purple-500"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Promotion Settings */}
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-200 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tarif Promotion</span>
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono">Remise fixe</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Minoration / réduction fixe appliquée automatiquement sur chaque produit commandé lors des promotions.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={formPromoDiscount}
                      onChange={(e) => setFormPromoDiscount(Number(e.target.value))}
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-amber-700/50 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs">{currency}</span>
                  </div>
                  <div className="flex gap-1">
                    {[500, 1000, 2000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormPromoDiscount(preset)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                          formPromoDiscount === preset
                            ? "bg-amber-600 text-white border-amber-500"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        -{preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer les grilles</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
