"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Lock,
  Delete,
  Store,
  Sparkles,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  LogOut,
} from "lucide-react";

export function PinLockScreen({ title = "Caisse Verrouillée" }: { title?: string }) {
  const router = useRouter();
  const { loginWithPin, tenant, store, logout } = useAuth();
  const [pinCode, setPinCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDigitClick = async (digit: string) => {
    if (pinCode.length >= 4 || isLoading) return;
    const newPin = pinCode + digit;
    setPinCode(newPin);
    setErrorMsg(null);

    if (newPin.length === 4) {
      setIsLoading(true);
      const res = await loginWithPin(newPin);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.message);
        setTimeout(() => setPinCode(""), 700);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPinCode((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-61px)] flex items-center justify-center p-4 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      <div className="w-full max-w-sm bg-slate-800/90 rounded-3xl p-6 sm:p-7 border border-slate-700 shadow-2xl backdrop-blur text-center animate-in fade-in zoom-in-95">
        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/10">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-black text-white">{title}</h2>
        <p className="text-xs text-slate-400 mt-1">
          {tenant?.name || "Boutique"} • Saisissez votre code PIN à 4 chiffres pour accéder aux menus et à la caisse
        </p>

        {errorMsg && (
          <div className="mt-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PIN indicator circles */}
        <div className="flex items-center justify-center gap-3 my-5">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pinCode.length > idx
                  ? "bg-blue-400 border-blue-400 scale-110 shadow-lg shadow-blue-400/50"
                  : "border-slate-600 bg-slate-700/50"
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitClick(num)}
              className="py-3.5 bg-slate-700/80 hover:bg-slate-600 text-white font-bold text-xl rounded-2xl border border-slate-600/80 transition-all touch-press active:scale-95"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigitClick("0")}
            className="py-3.5 bg-slate-700/80 hover:bg-slate-600 text-white font-bold text-xl rounded-2xl border border-slate-600/80 transition-all touch-press active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDeleteDigit}
            className="py-3.5 bg-slate-700/80 hover:bg-slate-600 text-slate-300 font-bold text-xl rounded-2xl border border-slate-600/80 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Help Links */}
        <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={handleLogout}
            className="hover:text-rose-400 transition-colors flex items-center gap-1 font-medium"
            title="Fermer la session actuelle"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
          <Link
            href="/auth/register"
            className="text-blue-400 font-bold hover:underline flex items-center gap-0.5"
          >
            <span>Créer un commerce</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
