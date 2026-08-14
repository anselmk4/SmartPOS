"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Store,
  KeyRound,
  Phone,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Delete,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPin, user, tenant } = useAuth();

  const [mode, setMode] = useState<"pin" | "phone">("pin");
  const [pinCode, setPinCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle keypad click
  const handleDigitClick = async (digit: string) => {
    if (pinCode.length >= 4) return;
    const newPin = pinCode + digit;
    setPinCode(newPin);
    setErrorMsg(null);

    if (newPin.length === 4) {
      setIsLoading(true);
      const res = await loginWithPin(newPin);
      setIsLoading(false);
      if (res.success) {
        router.push("/pos");
      } else {
        setErrorMsg(res.message);
        setTimeout(() => setPinCode(""), 800);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPinCode((prev) => prev.slice(0, -1));
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;

    setIsLoading(true);
    const res = await login(identifier, password || "1234");
    setIsLoading(false);

    if (res.success) {
      router.push("/pos");
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-61px)] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-blue-500/25">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {tenant?.name || "Kuettu SMART POS"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Connexion au terminal de vente & supervision
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode("pin");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === "pin" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"
            }`}
          >
            Code PIN Caissier
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("phone");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === "phone" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"
            }`}
          >
            Gérant (Téléphone)
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MODE PIN KEYPAD */}
        {mode === "pin" ? (
          <div>
            <div className="flex items-center justify-center gap-3 my-4">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    pinCode.length > idx
                      ? "bg-blue-600 border-blue-600 scale-110"
                      : "border-slate-300 bg-white"
                  }`}
                />
              ))}
            </div>

            <div className="text-center text-[11px] text-slate-400 mb-3">
              Tapez le code PIN (Démo : <b className="text-slate-600">1234</b> pour Gérant ou <b className="text-slate-600">0000</b> pour Caissier)
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitClick(num)}
                  className="py-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-lg rounded-2xl border border-slate-200/80 transition-all touch-press"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handleDigitClick("0")}
                className="py-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-lg rounded-2xl border border-slate-200/80 transition-all touch-press"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDeleteDigit}
                className="py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-lg rounded-2xl border border-slate-200/80 flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* MODE PHONE / PASSWORD */
          <form onSubmit={handlePhoneSubmit} className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Numéro WhatsApp ou Email
              </label>
              <input
                type="text"
                required
                placeholder="+243 81 000 11 22"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Code PIN ou Mot de passe
              </label>
              <input
                type="password"
                placeholder="Code à 4 chiffres ou mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 touch-press"
            >
              <span>Se Connecter</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer: Register link */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-2">
            Nouveau commerçant ?
          </p>
          <Link
            href="/auth/register"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center justify-center gap-1"
          >
            <span>Créer un compte boutique SaaS gratuitement</span>
            <Sparkles className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
