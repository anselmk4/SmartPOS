"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { BUSINESS_ACTIVITIES } from "@/lib/constants/business-activities";
import { getPlanPriceInfo } from "@/lib/constants/plans";
import { PLAN_CONFIGS, type SubscriptionPlan } from "@/lib/shared/types";
import { CaptchaChallenge, type CaptchaValidationState } from "@/components/auth/captcha-challenge";
import {
  Store,
  CheckCircle2,
  Sparkles,
  Phone,
  User,
  KeyRound,
  Globe,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Mail,
  MapPin,
  Briefcase,
  ChevronDown,
  Coins,
  Crown,
  Zap,
  Check,
  AlertCircle,
} from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerMerchant } = useAuth();

  // Wizard Step: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields
  // Step 1: Commerce & Activité
  const [storeName, setStoreName] = useState("");
  const [businessActivityId, setBusinessActivityId] = useState("retail_grocery");
  const [customActivity, setCustomActivity] = useState("");

  // Step 2: Localisation & Devise
  const [countryCode, setCountryCode] = useState("CD");
  const [currency, setCurrency] = useState("CDF");
  const [address, setAddress] = useState("");

  // Step 3: Gérant & Contacts
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("+243 ");
  const [email, setEmail] = useState("");

  // Step 4: Sécurité, Anti-Bot & Forfait (Gratuit par défaut)
  const [pinCode, setPinCode] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("FREE");
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [captchaState, setCaptchaState] = useState<CaptchaValidationState>({
    isValid: false,
    captchaToken: "",
    captchaAnswer: "",
    honeypot: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const countries = [
    { code: "CD", name: "RD Congo (CDF / USD)", currency: "CDF", prefix: "+243" },
    { code: "CI", name: "Côte d'Ivoire (FCFA)", currency: "XOF", prefix: "+225" },
    { code: "SN", name: "Sénégal (FCFA)", currency: "XOF", prefix: "+221" },
    { code: "CM", name: "Cameroun (FCFA)", currency: "XAF", prefix: "+237" },
    { code: "GN", name: "Guinée (GNF)", currency: "GNF", prefix: "+224" },
    { code: "ML", name: "Mali (FCFA)", currency: "XOF", prefix: "+223" },
    { code: "BF", name: "Burkina Faso (FCFA)", currency: "XOF", prefix: "+226" },
  ];

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    const found = countries.find((c) => c.code === code);
    if (found) {
      setCurrency(found.currency);
      if (!phone.startsWith("+") || phone.trim() === "+243") {
        setPhone(found.prefix + " ");
      }
    }
  };

  const selectedActivityObj = BUSINESS_ACTIVITIES.find((a) => a.id === businessActivityId);
  const resolvedBusinessType =
    businessActivityId === "other_activity"
      ? customActivity.trim() || "Autre Commerce"
      : selectedActivityObj?.name || "Commerce Général";

  // Step Validation
  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (currentStep === 1) {
      if (!storeName.trim()) {
        setErrorMsg("Veuillez saisir le nom de votre boutique");
        return;
      }
      if (businessActivityId === "other_activity" && !customActivity.trim()) {
        setErrorMsg("Veuillez préciser la nature de votre activité");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!ownerName.trim()) {
        setErrorMsg("Veuillez renseigner le nom du gérant ou propriétaire");
        return;
      }
      const cleanDigits = phone.replace(/\D/g, "");
      if (cleanDigits.length < 6) {
        setErrorMsg("Veuillez saisir un numéro de téléphone valide");
        return;
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (currentStep !== 4) {
      handleNextStep();
      return;
    }

    if (!pinCode || pinCode.trim().length < 4) {
      setErrorMsg("Veuillez saisir un code PIN secret à 4 chiffres (ex: 1234)");
      return;
    }

    if (!captchaState.isValid) {
      setErrorMsg("Veuillez résoudre le calcul de sécurité anti-robot pour valider la création de votre boutique.");
      return;
    }

    setIsLoading(true);
    const res = await registerMerchant({
      storeName: storeName.trim(),
      ownerName: ownerName.trim(),
      businessType: resolvedBusinessType,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      countryCode,
      currency,
      pinCode: pinCode.trim(),
      plan: "FREE",
      captchaToken: captchaState.captchaToken,
      captchaAnswer: captchaState.captchaAnswer,
      honeypot: captchaState.honeypot,
    });
    setIsLoading(false);

    if (res.success) {
      if (res.requiresVerification) {
        const query = new URLSearchParams();
        if (phone.trim()) query.set("phone", phone.trim());
        if (email.trim()) query.set("email", email.trim());
        query.set("plan", "FREE");
        if (res.verificationMethod) query.set("method", res.verificationMethod);
        if (res.simCode) query.set("simCode", res.simCode);
        router.push(`/auth/verify?${query.toString()}`);
      } else {
        router.push("/pos");
      }
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentStep < 4) {
        handleNextStep();
      } else {
        handleFinalSubmit();
      }
    }
  };

  const stepTitles = [
    { num: 1, title: "Commerce", desc: "Nom & Activité" },
    { num: 2, title: "Localisation", desc: "Pays & Adresse" },
    { num: 3, title: "Contacts", desc: "Gérant & WhatsApp" },
    { num: 4, title: "Sécurité", desc: "Code PIN & Forfait" },
  ];

  return (
    <div className="min-h-[calc(100vh-61px)] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl my-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/images/logo.png"
              alt="Kuettu Global POS"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Créer votre Commerce
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configuration rapide en 4 étapes • 100% Hors-ligne & Cloud
          </p>
        </div>

        {/* Wizard Multi-Step Progress Indicator */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {stepTitles.map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div key={step.num} className="text-center">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full mx-auto flex items-center justify-center text-xs font-black transition-all ${
                      isDone
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-md"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <span
                    className={`block text-[10px] font-bold mt-1.5 truncate ${
                      isCurrent ? "text-blue-600" : isDone ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl mb-4 flex items-center gap-2 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Multi-Step Wizard Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (currentStep < 4) {
              handleNextStep(e);
            } else {
              handleFinalSubmit(e);
            }
          }}
          onKeyDown={handleKeyDown}
          className="space-y-4"
        >
          {/* STEP 1: Commerce & Activité (2 Champs) */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/80 mb-2">
                <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span>Étape 1 sur 4 : Identité de votre Commerce</span>
                </span>
              </div>

              {/* Field 1: Nom du Commerce */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Nom de votre Commerce / Établissement *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ex: GENESIS SHOP, Ets Victoire..."
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Field 2: Type d'Activité */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Type d'Activité Commerciale *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={businessActivityId}
                    onChange={(e) => setBusinessActivityId(e.target.value)}
                    className="w-full pl-10 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    {BUSINESS_ACTIVITIES.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.icon} {act.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {businessActivityId === "other_activity" && (
                  <div className="mt-2.5 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="Précisez votre activité (ex: Salon de thé, Animalerie...)"
                      value={customActivity}
                      onChange={(e) => setCustomActivity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Localisation & Devise (2 Champs) */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/80 mb-2">
                <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Étape 2 sur 4 : Localisation & Devise Principale</span>
                </span>
              </div>

              {/* Field 1: Pays & Devise */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Pays & Monnaie d'Encaissement *
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={countryCode}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full pl-10 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Field 2: Adresse Physique */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Adresse Physique / Ville & Commune
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ex: Avenue du Commerce n°14, Gombe, Kinshasa"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Cette adresse figurera sur l'en-tête de vos tickets et factures imprimées.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Gérant & Contacts (2 Champs) */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/80 mb-2">
                <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Étape 3 sur 4 : Propriétaire & Coordonnées</span>
                </span>
              </div>

              {/* Field 1: Nom du Propriétaire / Gérant */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Nom Complet du Propriétaire / Gérant *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ex: Ansel Makomo"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Field 2: Téléphone & Email */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Numéro de Téléphone / WhatsApp Principal *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="+243 992 036 994"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Adresse Email (Optionnelle)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="contact@genesis.cd"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Sécurité & Forfait (2 Champs) */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/80 mb-2">
                <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Étape 4 sur 4 : Code PIN Caisse & Forfait</span>
                </span>
              </div>

              {/* Field 1: Code PIN */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Code PIN Secret du Gérant (4 chiffres) *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="ex: 2201"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono tracking-widest text-center font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block text-center">
                  Sert à verrouiller et déverrouiller instantanément votre caisse sur le terminal.
                </span>
              </div>

              {/* Field 2: Choix du Forfait */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Sélectionnez votre Forfait de démarrage ({currency})
                </label>

                {planNotice && (
                  <div className="mb-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{planNotice}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "FREE" as SubscriptionPlan, name: "Gratuit", isAvailable: true },
                    { id: "BASIC" as SubscriptionPlan, name: "Basic", popular: false, isAvailable: false },
                    { id: "PRO" as SubscriptionPlan, name: "Pro", popular: true, isAvailable: false },
                    { id: "BUSINESS" as SubscriptionPlan, name: "Business", isAvailable: false },
                  ].map((p) => {
                    const isSelected = selectedPlan === p.id;
                    const priceInfo = getPlanPriceInfo(p.id, currency);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => {
                          if (!p.isAvailable) {
                            setSelectedPlan("FREE");
                            setPlanNotice("Les forfaits payants sont temporairement indisponibles. Le forfait Gratuit Découverte est sélectionné.");
                          } else {
                            setSelectedPlan("FREE");
                            setPlanNotice(null);
                          }
                        }}
                        className={`p-2.5 rounded-2xl border text-center transition-all relative ${
                          isSelected
                            ? "bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20 text-blue-900 shadow-xs"
                            : p.isAvailable
                            ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            : "bg-slate-50/60 border-slate-200 text-slate-400 hover:bg-slate-100/80"
                        }`}
                      >
                        {!p.isAvailable && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[7px] font-black uppercase px-1.5 py-0.2 rounded-full whitespace-nowrap">
                            Bientôt
                          </span>
                        )}
                        {p.isAvailable && p.popular && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full">
                            Top
                          </span>
                        )}
                        <span className="block text-xs font-black">{p.name}</span>
                        <span className="block text-[10px] text-slate-500 font-bold mt-0.5">
                          {p.isAvailable ? priceInfo.formatted : "Indisponible"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 3: Anti-Bot Security Captcha */}
              <CaptchaChallenge onValidationChange={setCaptchaState} className="mt-2" />
            </div>
          )}

          {/* Navigation Controls: Précédent & Suivant / Créer */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition-all touch-press"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all touch-press ml-auto"
              >
                <span>Étape Suivante</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all touch-press ml-auto disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Création de votre boutique...</span>
                ) : (
                  <>
                    <span>Créer ma Boutique & Ouvrir la Caisse</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Vous avez déjà une boutique enregistrée ?{" "}
            <Link
              href="/auth/login"
              className="font-bold text-blue-600 hover:underline"
            >
              Se connecter au terminal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Chargement...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
