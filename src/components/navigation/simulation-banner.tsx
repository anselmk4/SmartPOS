"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Crown, Sparkles, X, ArrowRight, ShieldCheck, Lock, AlertTriangle, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export function SimulationBanner() {
  const router = useRouter();
  const { user, isOwner, role, isSimulating, restoreOwnerRole, terminalUsers } = useAuth();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if terminal has an owner account or if simulation is active
  const hasOwnerProfile =
    isSimulating ||
    terminalUsers.some((u) => u.role === "OWNER") ||
    (typeof window !== "undefined" && sessionStorage.getItem("kuettu_is_simulating") === "true");

  // Show banner only when logged in, NOT currently OWNER, and an owner account exists or was simulated
  if (!user || isOwner || !hasOwnerProfile || isDismissed) {
    return null;
  }

  const roleName =
    role === "WAITER"
      ? "Serveur / Serveuse"
      : role === "CASHIER"
      ? "Caissier / Caissière"
      : "Manager";

  const handleDirectRestore = async () => {
    setIsRestoring(true);
    const res = await restoreOwnerRole();
    setIsRestoring(false);

    if (res.success) {
      router.push("/owner");
    } else {
      // If PIN is needed, open PIN prompt
      setPinInput("");
      setPinError(null);
      setIsPinModalOpen(true);
    }
  };

  const handleVerifyPinAndRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4) {
      setPinError("Code PIN à 4 chiffres requis.");
      return;
    }

    setIsRestoring(true);
    const res = await restoreOwnerRole(pinInput);
    setIsRestoring(false);

    if (res.success) {
      setIsPinModalOpen(false);
      router.push("/owner");
    } else {
      setPinError(res.message || "Code PIN incorrect.");
      setPinInput("");
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 shadow-md relative z-30 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-amber-100 animate-pulse" />
          </div>
          <div className="text-xs">
            <span className="font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md mr-2 text-[10px]">
              Mode Simulation
            </span>
            <span className="font-medium text-amber-50">
              Vous naviguez actuellement avec la vue restreinte : <b>{roleName}</b>.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDirectRestore}
            disabled={isRestoring}
            className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:bg-amber-50 hover:scale-102 transition-all touch-press disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Restaurer l'accès Propriétaire</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Masquer ce bandeau temporairement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PIN Verification Modal if PIN is required */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Restaurer Compte Propriétaire</h3>
                  <p className="text-[11px] text-slate-400">Accès total au tableau de bord</p>
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
              Veuillez saisir votre code PIN Propriétaire / Gérant pour réactiver immédiatement vos privilèges administrateur.
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPinAndRestore} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                  Code PIN Propriétaire (4 chiffres)
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
                  disabled={pinInput.length < 4 || isRestoring}
                  className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-amber-600/30"
                >
                  {isRestoring ? "Vérification..." : "Déverrouiller"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
