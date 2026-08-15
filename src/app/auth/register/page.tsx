"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type { SubscriptionPlan } from "@/lib/shared/types";
import {
  Store,
  CheckCircle2,
  Sparkles,
  Phone,
  User,
  KeyRound,
  Globe,
  ArrowRight,
  ShieldCheck,
  Mail,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { registerMerchant } = useAuth();

  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("+243 ");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("CD");
  const [currency, setCurrency] = useState("CDF");
  const [pinCode, setPinCode] = useState("1234");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("PRO");

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
      if (!phone.startsWith("+")) {
        setPhone(found.prefix + " ");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !ownerName.trim() || !phone.trim()) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsLoading(true);
    const res = await registerMerchant({
      storeName,
      ownerName,
      phone,
      email: email.trim() || undefined,
      countryCode,
      currency,
      pinCode,
      plan: selectedPlan,
    });
    setIsLoading(false);

    if (res.success) {
      router.push("/pos");
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-61px)] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl my-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-blue-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Créer votre Boutique SaaS
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Démarrez en 30 secondes • Fonctionne 100% hors-ligne & sauvegarde Cloud
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Store Name & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Nom du Commerce / Boutique *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ex: Alimentation Victoire"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Nom du Propriétaire / Gérant *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ex: Dieudonné Kasongo"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Country & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Pays d'activité
              </label>
              <select
                value={countryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Téléphone WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+243 81 000 11 22"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Adresse Email (Optionnelle pour connexion multi-appareils)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="ex: contact@maboutique.cd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* PIN code */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Code PIN pour déverrouiller la Caisse (4 chiffres)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={4}
                required
                placeholder="1234"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm font-mono font-bold tracking-widest border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Plan selection */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-2">
              Forfait SaaS sélectionné (14 jours d'essai gratuit)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "FREE", name: "Gratuit", price: "0 FC", desc: "1 Caisse" },
                { id: "PRO", name: "Pro", price: "15.000 FC/m", desc: "Illimité + Mobile" },
                { id: "BUSINESS", name: "Business", price: "45.000 FC/m", desc: "Multi-boutiques" },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id as SubscriptionPlan)}
                  className={`p-2.5 rounded-2xl border cursor-pointer transition-all text-center ${
                    selectedPlan === p.id
                      ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{p.name}</div>
                  <div className="font-black text-[11px] text-blue-600 mt-0.5">{p.price}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 touch-press"
          >
            {isLoading ? (
              <span>Création de votre boutique...</span>
            ) : (
              <>
                <span>Créer ma Boutique & Ouvrir la Caisse</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center mt-4">
          <p className="text-xs text-slate-500">
            Déjà inscrit ?{" "}
            <Link href="/auth/login" className="font-bold text-blue-600 hover:underline">
              Se connecter ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
