"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db/dexie-db";
import {
  KeyRound,
  ShieldCheck,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Lock,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

export default function ForgotPinPage() {
  const router = useRouter();

  // Steps: 1 = Request Code, 2 = Verify Code & Set New PIN, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [identifier, setIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPinCode, setNewPinCode] = useState("");
  const [confirmPinCode, setConfirmPinCode] = useState("");

  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Step 1: Request OTP Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg("Veuillez saisir votre numéro de téléphone ou votre adresse email");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/auth/forgot-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_CODE",
          identifier: identifier.trim(),
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Compte introuvable avec ces coordonnées");
        return;
      }

      setSimulatedOtp(data.codePreview || null);
      setUserName(data.userName || null);
      setTenantName(data.tenantName || null);
      setMaskedPhone(data.maskedIdentifier || identifier);
      setStep(2);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || "Erreur de connexion au serveur");
    }
  };

  // Step 2: Verify OTP and Reset PIN
  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMsg("Veuillez saisir le code de vérification à 6 chiffres");
      return;
    }

    if (!newPinCode || newPinCode.trim().length < 4) {
      setErrorMsg("Le nouveau code PIN doit comporter au moins 4 chiffres");
      return;
    }

    if (newPinCode !== confirmPinCode) {
      setErrorMsg("La confirmation du code PIN ne correspond pas");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/forgot-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_AND_RESET",
          identifier: identifier.trim(),
          code: otpCode.trim(),
          newPinCode: newPinCode.trim(),
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Code de vérification invalide ou expiré");
        return;
      }

      // Update local Dexie DB for offline synchronization
      if (data.user?.id) {
        const localUser = await db.users.get(data.user.id);
        if (localUser) {
          await db.users.update(data.user.id, {
            pinCode: newPinCode.trim(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      setSuccessMsg(data.message || "Votre code PIN a été réinitialisé !");
      setStep(3);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || "Erreur lors de la mise à jour");
    }
  };

  const copyOtpToInput = () => {
    if (simulatedOtp) {
      setOtpCode(simulatedOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-[calc(100vh-61px)] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl my-4">
        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-blue-500/25">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Récupération de Code PIN
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sécurité renforcée • Réinitialisez votre PIN en toute simplicité
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl mb-4 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: IDENTIFIER FORM */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Identification du compte marchand</span>
              </span>
              <p className="text-[11px] text-blue-800/80">
                Saisissez le numéro de téléphone ou l'adresse email associé à votre boutique pour recevoir votre code de sécurité à 6 chiffres.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Numéro WhatsApp ou Email du Gérant *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ex: +243 992 036 994 ou email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all touch-press disabled:opacity-50"
            >
              {isLoading ? (
                <span>Recherche du compte...</span>
              ) : (
                <>
                  <span>Envoyer le Code de Sécurité</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP & ENTER NEW PIN */}
        {step === 2 && (
          <form onSubmit={handleResetPin} className="space-y-4 animate-in fade-in">
            {/* Account Info Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Compte identifié : {userName}</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {tenantName}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Un code de vérification à 6 chiffres a été généré pour <b>{maskedPhone}</b>.
              </p>
            </div>

            {/* Simulated OTP Display Helper */}
            {simulatedOtp && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Code de vérification (Sécurité)</span>
                  <span className="font-mono text-base font-black tracking-widest text-amber-950">{simulatedOtp}</span>
                </div>
                <button
                  type="button"
                  onClick={copyOtpToInput}
                  className="py-1.5 px-3 rounded-xl bg-amber-200/70 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Inséré !" : "Insérer"}</span>
                </button>
              </div>
            )}

            {/* 6-Digit OTP Field */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Code de Vérification (6 chiffres) *
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="ex: 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono font-bold tracking-widest text-center focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* New PIN Field */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Nouveau Code PIN Secret (4 chiffres) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="ex: 2201"
                  value={newPinCode}
                  onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono font-bold tracking-widest text-center focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Confirm PIN Field */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Confirmez le Nouveau Code PIN *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="ex: 2201"
                  value={confirmPinCode}
                  onChange={(e) => setConfirmPinCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono font-bold tracking-widest text-center focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition-all touch-press"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all touch-press ml-auto disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Enregistrement...</span>
                ) : (
                  <>
                    <span>Valider mon Nouveau PIN</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {step === 3 && (
          <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                Code PIN Réinitialisé avec Succès !
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {successMsg || "Votre nouveau code PIN est actif. Vous pouvez maintenant vous connecter à votre caisse."}
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all touch-press"
              >
                <span>Se Connecter au Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100">
          <Link
            href="/auth/login"
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à l'écran de connexion</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
