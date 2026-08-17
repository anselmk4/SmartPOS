"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import type { SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";
import {
  PAWAPAY_COUNTRY_CONFIGS,
  PLAN_PRICES,
  getCountryPaymentConfig,
  formatToMsisdn,
  type MobileMoneyOperator,
} from "@/lib/payments/pawapay-config";
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Coins,
  Crown,
  Sparkles,
} from "lucide-react";

interface PawaPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
  onSuccess?: (plan: SubscriptionPlan) => void;
}

export function PawaPayModal({ isOpen, onClose, plan, onSuccess }: PawaPayModalProps) {
  const { tenant, updateTenantPlan } = useAuth();
  const { countryCode: defaultCountryCode } = useSync();

  const [selectedCountry, setSelectedCountry] = useState<string>(
    tenant?.countryCode || defaultCountryCode || "CD"
  );
  const [selectedCurrency, setSelectedCurrency] = useState<string>("CDF");
  const [selectedOperator, setSelectedOperator] = useState<PaymentMethod>("MPESA");
  const [phoneNumber, setPhoneNumber] = useState<string>(
    tenant?.phone ? tenant.phone.replace(/^\+\d+/, "").replace(/\s/g, "") : ""
  );

  const [step, setStep] = useState<"FORM" | "PROCESSING" | "SUCCESS" | "ERROR">("FORM");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const countryConfig = getCountryPaymentConfig(selectedCountry);

  // Set default currency & operator when country changes
  useEffect(() => {
    if (countryConfig.currencies.length > 0) {
      // For DRC, keep current selection if valid, or default to CDF
      const hasCurrent = countryConfig.currencies.some((c) => c.code === selectedCurrency);
      if (!hasCurrent) {
        setSelectedCurrency(countryConfig.currencies[0].code);
      }
    }
    if (countryConfig.operators.length > 0) {
      const hasOp = countryConfig.operators.some((o) => o.id === selectedOperator);
      if (!hasOp) {
        setSelectedOperator(countryConfig.operators[0].id);
      }
    }
  }, [selectedCountry, countryConfig]);

  if (!isOpen) return null;

  const planAmount = PLAN_PRICES[plan]?.[selectedCurrency] ?? (selectedCurrency === "USD" ? 15 : 40000);
  const currencySymbol =
    countryConfig.currencies.find((c) => c.code === selectedCurrency)?.symbol || selectedCurrency;

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    if (!phoneNumber || phoneNumber.trim().length < 4) {
      setErrorMessage("Veuillez saisir votre numéro de téléphone Mobile Money.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setStep("PROCESSING");

    try {
      const isNative = typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.());
      const apiUrl = isNative
        ? "https://smart-pos-azure-pi.vercel.app/api/v1/payments/pawapay/initiate"
        : "/api/v1/payments/pawapay/initiate";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          plan,
          currency: selectedCurrency,
          countryCode: selectedCountry,
          operator: selectedOperator,
          rawPhoneNumber: phoneNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Échec de l'initiation du paiement");
      }

      // If activated instantly (simulation or instant confirmation)
      if (data.activated) {
        await updateTenantPlan(plan);
        setSuccessMessage(data.message || `Votre forfait ${plan} a été activé avec succès !`);
        setStep("SUCCESS");
        if (onSuccess) onSuccess(plan);
      } else {
        setSuccessMessage(
          data.message || "Veuillez valider le paiement Mobile Money (Push USSD) sur votre téléphone."
        );
        setStep("SUCCESS");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue lors de la communication avec PawaPay");
      setStep("ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Crown className="w-4 h-4" />
            </div>
            <span className="text-xs uppercase tracking-widest font-black text-blue-400">
              Paiement Sécurisé Mobile Money
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            Souscription Forfait {plan === "BASIC" ? "Commerçant Basic" : plan === "PRO" ? "Commerçant Pro" : "Business Multi-Magasins"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Activation instantanée via PawaPay • Sans engagement
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {step === "FORM" && (
            <form onSubmit={handleInitiatePayment} className="space-y-5">
              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-700 font-semibold block">Montant à régler</span>
                  <div className="text-2xl sm:text-3xl font-black text-blue-950">
                    {planAmount.toLocaleString("fr-FR")} {currencySymbol}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ mois</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    30 Jours
                  </span>
                </div>
              </div>

              {/* RDC Dual Currency Selector */}
              {selectedCountry === "CD" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    1. Choisissez votre devise de règlement
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {countryConfig.currencies.map((curr) => (
                      <button
                        type="button"
                        key={curr.code}
                        onClick={() => setSelectedCurrency(curr.code)}
                        className={`p-3 rounded-2xl border text-left font-bold text-xs sm:text-sm transition-all flex items-center justify-between ${
                          selectedCurrency === curr.code
                            ? "border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-600/20"
                            : "border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-blue-600" />
                          <span>{curr.name}</span>
                        </div>
                        {selectedCurrency === curr.code && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Money Operator Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  {selectedCountry === "CD" ? "2." : "1."} Sélectionnez votre opérateur Mobile Money
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {countryConfig.operators.map((op) => {
                    const isSelected = selectedOperator === op.id;
                    return (
                      <button
                        type="button"
                        key={op.id}
                        onClick={() => setSelectedOperator(op.id)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/25 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm"
                            style={{ backgroundColor: op.color }}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 leading-tight">
                              {op.name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Ex: {op.samplePrefix}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-blue-600">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phone Number with VISIBLE LOCKED Country Prefix */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  {selectedCountry === "CD" ? "3." : "2."} Numéro de téléphone pour le débit
                </label>

                <div className="relative flex items-center rounded-2xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 bg-white overflow-hidden shadow-sm">
                  {/* Fixed Country Code Badge */}
                  <div className="px-3.5 py-3.5 bg-slate-100 border-r border-slate-200 flex items-center gap-1.5 text-xs font-black text-slate-800 select-none">
                    <span>{countryConfig.flag}</span>
                    <span>{countryConfig.callingCode}</span>
                  </div>

                  {/* Clean number input */}
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="ex: 81 234 56 78"
                    className="w-full px-3.5 py-3.5 text-slate-900 font-bold text-sm sm:text-base outline-none placeholder:text-slate-400 placeholder:font-normal"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Saisissez le numéro sans l'indicatif ({countryConfig.callingCode}), il est déjà appliqué.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 touch-press disabled:opacity-50"
              >
                <span>Payer {planAmount.toLocaleString("fr-FR")} {currencySymbol} par Mobile Money</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Passerelle PawaPay Sécurisée
                </span>
                <span>•</span>
                <span>Sans engagement</span>
                <span>•</span>
                <span>Annulation à tout moment</span>
              </div>
            </form>
          )}

          {step === "PROCESSING" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center animate-pulse">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Paiement Mobile Money en cours...
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                Simulation et validation du forfait en cours via la passerelle PawaPay.
              </p>
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
            </div>
          )}

          {step === "SUCCESS" && (
            <div className="py-6 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Forfait {plan} Activé avec Succès !
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                  {successMessage}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs font-semibold text-left space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Avantages débloqués immédiatement :
                </div>
                <p>• Ventes et caisses illimitées sans coupure</p>
                <p>• Sauvegarde continue en direct sur Supabase Cloud</p>
                <p>• Supervision gérant et relances WhatsApp intelligentes</p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all touch-press"
              >
                Continuer vers l'application
              </button>
            </div>
          )}

          {step === "ERROR" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Échec du Paiement
              </h3>
              <p className="text-xs sm:text-sm text-red-600 max-w-sm mx-auto">
                {errorMessage}
              </p>

              <button
                onClick={() => setStep("FORM")}
                className="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                Réessayer le paiement
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
