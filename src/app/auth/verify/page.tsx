"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/db/dexie-db";
import {
  ShieldCheck,
  Smartphone,
  Mail,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Store,
  KeyRound,
  Lock,
} from "lucide-react";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const phoneParam = searchParams?.get("phone") || "";
  const emailParam = searchParams?.get("email") || "";
  const methodParam = searchParams?.get("method") || "SMS";
  const initialSimCode = searchParams?.get("simCode") || "";

  const identifier = methodParam === "EMAIL" ? emailParam || phoneParam : phoneParam || emailParam;

  // 6 digits OTP array
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resend cooldown timer (60s)
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(initialSimCode || null);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // If sim code provided in params, auto-fill hint
  useEffect(() => {
    if (initialSimCode && initialSimCode.length === 6) {
      setSimulatedCode(initialSimCode);
    }
  }, [initialSimCode]);

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    const newDigits = [...digits];

    if (clean.length > 1) {
      // Pasted full 6-digit code
      const pasted = clean.slice(0, 6).split("");
      pasted.forEach((d, i) => {
        newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();

      if (pasted.length === 6) {
        verifyCode(newDigits.join(""));
      }
      return;
    }

    newDigits[index] = clean;
    setDigits(newDigits);

    // Auto move to next input
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If completed 6 digits, auto submit
    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && !newDigits.includes("")) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) {
      setErrorMsg("Veuillez saisir les 6 chiffres du code");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          code: codeToVerify,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Code de confirmation incorrect");
        setIsLoading(false);
        return;
      }

      // Update local storage and Dexie so the user is immediately authenticated
      if (data.token && typeof window !== "undefined") {
        localStorage.setItem("kuettu_session_token", data.token);
      }
      if (data.user) {
        await db.users.put(data.user);
        if (typeof window !== "undefined") localStorage.setItem("micro_erp_auth_user_id", data.user.id);
      }
      const savedBt = (typeof window !== "undefined" ? localStorage.getItem("pos_store_business_type") : null) || undefined;
      if (data.tenant) {
        const existingT = await db.tenants.get(data.tenant.id);
        await db.tenants.put({
          ...existingT,
          ...data.tenant,
          businessType: existingT?.businessType || savedBt,
        });
        if (typeof window !== "undefined") localStorage.setItem("micro_erp_auth_tenant_id", data.tenant.id);
      }
      if (data.stores && data.stores.length > 0) {
        for (const s of data.stores) {
          const existingS = await db.stores.get(s.id);
          await db.stores.put({
            ...existingS,
            ...s,
            businessType: existingS?.businessType || savedBt,
          });
        }
        if (typeof window !== "undefined") localStorage.setItem("micro_erp_auth_store_id", data.stores[0].id);
      }

      const tenantPlan = data.tenant?.plan || searchParams?.get("plan") || "FREE";
      const isPaidPlan = tenantPlan === "BASIC" || tenantPlan === "PRO" || tenantPlan === "BUSINESS";

      if (isPaidPlan) {
        setSuccessMsg(`Code SMS validé ! Redirection vers le règlement du forfait ${tenantPlan}...`);
        setTimeout(() => {
          window.location.href = `/billing?plan=${tenantPlan}&checkout=true&required=true`;
        }, 900);
      } else {
        setSuccessMsg("Commerce confirmé avec succès ! Redirection vers votre caisse...");
        setTimeout(() => {
          window.location.href = "/pos";
        }, 900);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion lors de la vérification");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Impossible de renvoyer le code");
      } else {
        setSuccessMsg("Un nouveau code a été envoyé !");
        setResendCooldown(60);
        if (data.isSimulated && data.simulatedCode) {
          setSimulatedCode(data.simulatedCode);
        }
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du renvoi du code");
    } finally {
      setIsResending(false);
    }
  };

  const handleFillSimulatedCode = () => {
    if (simulatedCode && simulatedCode.length === 6) {
      const splitted = simulatedCode.split("");
      setDigits(splitted);
      verifyCode(simulatedCode);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
          {methodParam === "EMAIL" ? <Mail className="w-7 h-7" /> : <Smartphone className="w-7 h-7" />}
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white">
          Confirmation de Compte
        </h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Nous avons envoyé un code de vérification à 6 chiffres par{" "}
          <b className="text-slate-200">{methodParam === "EMAIL" ? "e-mail" : "SMS"}</b> à :
        </p>
        <div className="inline-block px-3 py-1 bg-slate-800 rounded-full text-xs font-mono font-bold text-blue-400 border border-slate-700">
          {identifier || "Votre numéro"}
        </div>
      </div>

      {/* Simulation Banner (Helpful for dev/sandbox until Twilio keys provided) */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-xs text-amber-300 space-y-1.5 animate-in fade-in">
        <div className="flex items-center justify-between font-bold">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Mode Sandbox / Test</span>
          </span>
          <span className="font-mono text-sm text-white bg-amber-500/20 px-2 py-0.5 rounded-lg">
            {simulatedCode || "123456"}
          </span>
        </div>
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
          En attendant la configuration de vos clés Twilio SMS, utilisez le code de test <b>{simulatedCode || "123456"}</b> (ou <b>111111</b>) pour valider votre compte.
        </p>
        <button
          type="button"
          onClick={() => {
            const code = simulatedCode || "123456";
            setDigits(code.split(""));
            verifyCode(code);
          }}
          className="text-[11px] font-bold text-white bg-amber-600/70 hover:bg-amber-600 px-3 py-1.5 rounded-xl transition-all w-full flex items-center justify-center gap-1.5 shadow-sm touch-press"
        >
          <span>Remplir et Valider automatiquement ({simulatedCode || "123456"})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Error / Success Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 6 Digit Input Boxes */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verifyCode(digits.join(""));
        }}
        className="space-y-6"
      >
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={isLoading}
              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black text-white bg-slate-800 border-2 border-slate-700 rounded-2xl focus:border-blue-500 focus:bg-slate-800/80 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
            />
          ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || digits.includes("")}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-all touch-press flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Validation en cours...</span>
            </>
          ) : (
            <>
              <span>Confirmer et Ouvrir ma Caisse</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Resend Code Section */}
      <div className="pt-2 text-center text-xs text-slate-400 space-y-2 border-t border-slate-800/80">
        <p>Vous n'avez pas reçu de code ?</p>
        {resendCooldown > 0 ? (
          <p className="text-slate-500 font-mono">
            Renvoyer un code dans <b className="text-blue-400">{resendCooldown}s</b>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
          >
            {isResending ? "Renvoi en cours..." : "Renvoyer un nouveau code"}
          </button>
        )}
      </div>

      {/* Help Link */}
      <div className="text-center pt-2">
        <Link
          href="/auth/login"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Retour à la page de connexion
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-center items-center p-4 sm:p-6 text-white font-sans">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-xs text-slate-400 font-bold">Chargement de la confirmation...</p>
          </div>
        }
      >
        <VerifyOtpContent />
      </Suspense>
    </div>
  );
}
