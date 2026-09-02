"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type { UserRole } from "@/lib/shared/types";
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
  Users,
  Lock,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    loginStaffWithPin,
    terminalTenant,
    terminalUsers,
    unlinkTerminal,
    tenant,
    isAuthenticated,
  } = useAuth();

  const activeTenant = terminalTenant || tenant;
  const isTerminalLinked = Boolean(activeTenant);

  const [mode, setMode] = useState<"pin" | "phone">(isTerminalLinked ? "pin" : "phone");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [pinCode, setPinCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-switch mode based on terminal association
  useEffect(() => {
    if (!isTerminalLinked) {
      setMode("phone");
    } else {
      setMode("pin");
      if (terminalUsers.length > 0 && !selectedStaffId) {
        // Preselect if only one staff
        if (terminalUsers.length === 1) {
          setSelectedStaffId(terminalUsers[0].id);
        }
      }
    }
  }, [isTerminalLinked, terminalUsers, selectedStaffId]);

  const selectedStaff = terminalUsers.find((u) => u.id === selectedStaffId);

  // Handle keypad click for staff member
  const handleDigitClick = async (digit: string) => {
    if (!selectedStaffId) {
      setErrorMsg("Veuillez d'abord sélectionner votre profil dans la liste.");
      return;
    }

    if (pinCode.length >= 4) return;
    const newPin = pinCode + digit;
    setPinCode(newPin);
    setErrorMsg(null);

    if (newPin.length === 4) {
      setIsLoading(true);
      const res = await loginStaffWithPin(selectedStaffId, newPin);
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
    setErrorMsg(null);
    const res = await login(identifier, password || "1234");
    setIsLoading(false);

    if (res.success) {
      router.push("/pos");
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleUnlink = async () => {
    if (confirm("Voulez-vous dissocier ce terminal de la boutique actuelle ?")) {
      await unlinkTerminal();
      setSelectedStaffId(null);
      setPinCode("");
      setMode("phone");
      setErrorMsg(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "OWNER":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">GÉRANT</span>;
      case "MANAGER":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">MANAGER</span>;
      case "CASHIER":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">CAISSIER</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">STAFF</span>;
    }
  };

  return (
    <div className="min-h-[calc(100vh-61px)] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xl">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <img
              src="/images/logo.png"
              alt="Kuettu Global POS"
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </div>

          <h2 className="text-xl font-black text-slate-900 leading-tight">
            {activeTenant ? activeTenant.name : "Kuettu Global POS"}
          </h2>

          <p className="text-xs text-slate-500 mt-0.5">
            {activeTenant
              ? "Terminal de vente & Caisse enregistreuse"
              : "Association & Connexion du Terminal"}
          </p>

          {activeTenant && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Boutique identifiée
              </span>
              <button
                type="button"
                onClick={handleUnlink}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1"
                title="Dissocier ce terminal"
              >
                <span>Changer</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode("pin");
              setErrorMsg(null);
            }}
            disabled={!isTerminalLinked}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "pin"
                ? "bg-white text-blue-700 shadow-sm"
                : !isTerminalLinked
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Code PIN Équipe</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("phone");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "phone" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Gérant (Téléphone / Email)</span>
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-semibold mb-4 flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MODE 1: PIN CODE WITH STAFF LIST */}
        {mode === "pin" && isTerminalLinked && (
          <div>
            {!selectedStaffId ? (
              /* Staff Selection List */
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Sélectionnez votre profil :</span>
                  </div>
                  {terminalUsers.length > 0 && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      {terminalUsers.length} profil{terminalUsers.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-[55vh] sm:max-h-[360px] overflow-y-auto overscroll-contain pr-1 touch-pan-y scrollbar-thin scrollbar-thumb-slate-300">
                  {terminalUsers.length > 0 ? (
                    terminalUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaffId(u.id);
                          setPinCode("");
                          setErrorMsg(null);
                        }}
                        className="w-full p-2.5 sm:p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 bg-white transition-all text-left flex items-center justify-between group touch-press shadow-xs active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs shrink-0">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-700 truncate">
                              {u.name}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              {getRoleBadge(u.role)}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                      Aucun caissier configuré sur cette boutique.
                    </div>
                  )}
                </div>

                {terminalUsers.length > 3 && (
                  <div className="text-center text-[10px] text-slate-400 font-medium pt-1">
                    ↓ Faites défiler pour voir tous les utilisateurs ({terminalUsers.length})
                  </div>
                )}
              </div>
            ) : (
              /* Selected Staff Keypad */
              <div>
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {selectedStaff?.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{selectedStaff?.name}</div>
                      <div className="text-[10px] text-slate-500">{selectedStaff && getRoleBadge(selectedStaff.role)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaffId(null);
                      setPinCode("");
                      setErrorMsg(null);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline px-2 py-1"
                  >
                    Changer
                  </button>
                </div>

                {/* PIN Code Dots Indicator */}
                <div className="flex items-center justify-center gap-3 my-3">
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
                  Saisissez votre code PIN à 4 chiffres
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleDigitClick(num)}
                      className="py-3.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-lg rounded-2xl border border-slate-200/80 transition-all touch-press disabled:opacity-50"
                    >
                      {num}
                    </button>
                  ))}
                  <div />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleDigitClick("0")}
                    className="py-3.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-lg rounded-2xl border border-slate-200/80 transition-all touch-press disabled:opacity-50"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteDigit}
                    className="py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-lg rounded-2xl border border-slate-200/80 flex items-center justify-center touch-press"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                {/* Forgot PIN link for PIN Mode */}
                <div className="text-center mt-2 mb-3">
                  <Link
                    href="/auth/forgot-pin"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Code PIN ou mot de passe oublié ?
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: PHONE / EMAIL + PIN (Gérant & Terminal Setup) */}
        {mode === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="space-y-3.5 mb-4">
            {!isTerminalLinked && (
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Connectez-vous avec votre numéro ou email de Gérant pour activer et associer ce terminal à votre boutique.
                </span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Numéro WhatsApp ou Email du Gérant *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ex: +243 99 203 69 94 ou email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm font-semibold border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Code PIN ou Mot de passe *
                </label>
                <Link
                  href="/auth/forgot-pin"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Code oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Code à 4 chiffres ou mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm font-semibold border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 touch-press disabled:opacity-50"
            >
              {isLoading ? (
                <span>Vérification & Synchronisation...</span>
              ) : (
                <>
                  <span>{isTerminalLinked ? "Se Connecter" : "Activer ce Terminal & Se Connecter"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer: Register link */}
        {!isTerminalLinked && (
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-1.5">
              Nouvelle boutique ?
            </p>
            <Link
              href="/auth/register"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              <span>Créer un compte boutique SaaS gratuitement</span>
              <Sparkles className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
