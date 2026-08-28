"use client";

import React, { useState } from "react";
import { MessageCircle, Send, CheckCheck } from "lucide-react";
import { useLandingTheme } from "./landing-theme-context";

interface CustomerDebt {
  name: string;
  phone: string;
  amountCDF: number;
  amountUSD: number;
  lastPurchase: string;
}

const SAMPLE_CUSTOMERS: CustomerDebt[] = [
  {
    name: "M. Jean-Pierre Kabamba",
    phone: "+243 81 234 5678",
    amountCDF: 85000,
    amountUSD: 30,
    lastPurchase: "Il y a 4 jours",
  },
  {
    name: "Mme Marie-Claire Tshilolo",
    phone: "+243 99 876 5432",
    amountCDF: 42000,
    amountUSD: 15,
    lastPurchase: "Hier",
  },
  {
    name: "Entreprise BTP Gombe",
    phone: "+243 82 555 0192",
    amountCDF: 320000,
    amountUSD: 115,
    lastPurchase: "Il y a 10 jours",
  },
];

export default function WhatsappSimulator() {
  const { isDark } = useLandingTheme();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt>(SAMPLE_CUSTOMERS[0]);
  const [currency, setCurrency] = useState<"CDF" | "USD">("CDF");
  const [tone, setTone] = useState<"polite" | "standard" | "urgent">("polite");
  const [isSent, setIsSent] = useState(false);

  const formattedAmount =
    currency === "CDF"
      ? `${selectedCustomer.amountCDF.toLocaleString()} FC`
      : `$${selectedCustomer.amountUSD}`;

  const getMessageContent = () => {
    switch (tone) {
      case "polite":
        return `Bonjour ${selectedCustomer.name}, nous espérons que vous allez bien. Petit rappel amical concernant votre solde de ${formattedAmount} enregistré chez Kuettu Global Shop. Merci de nous indiquer votre disponibilité pour le règlement. Belle journée !`;
      case "standard":
        return `Bonjour ${selectedCustomer.name}, sauf erreur de notre part, votre compte présente un solde restant de ${formattedAmount} suite à vos derniers achats. Merci de procéder à la régularisation par Cash ou Mobile Money (M-Pesa / Orange / Airtel).`;
      case "urgent":
        return `URGENT : M. / Mme ${selectedCustomer.name}, nous vous informons que votre créance de ${formattedAmount} est arrivée à échéance. Merci de nous contacter d'ici aujourd'hui pour convenir du paiement. Cordialement, la Gérance.`;
    }
  };

  const handleSimulatedSend = () => {
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
  };

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-5 shadow-2xl relative overflow-hidden transition-colors duration-300 ${
        isDark
          ? "bg-slate-950/90 border-slate-800 text-slate-100"
          : "bg-white border-slate-200 text-slate-900 shadow-slate-200"
      }`}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div
        className={`flex items-center justify-between pb-3 mb-3 border-b ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold">Relance WhatsApp 1-Clic</h4>
            <p className="text-[10px] text-slate-500">Testez la génération de message</p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isDark
              ? "text-emerald-400 bg-emerald-950/60 border-emerald-800/60"
              : "text-emerald-800 bg-emerald-100 border-emerald-300"
          }`}
        >
          En direct
        </span>
      </div>

      {/* Customer Selector */}
      <div className="space-y-3 text-xs">
        <div>
          <label className="text-[11px] font-semibold text-slate-500 block mb-1">
            Sélectionner un Client Endetté :
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {SAMPLE_CUSTOMERS.map((cust) => (
              <button
                key={cust.name}
                onClick={() => setSelectedCustomer(cust)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  selectedCustomer.name === cust.name
                    ? isDark
                      ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-sm"
                      : "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm font-semibold"
                    : isDark
                    ? "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <p className="font-bold text-[11px] truncate">{cust.name}</p>
                <p className="text-[10px] text-slate-500">
                  Dette :{" "}
                  {currency === "CDF" ? `${cust.amountCDF.toLocaleString()} FC` : `$${cust.amountUSD}`}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Tone and Currency Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}
          >
            <button
              onClick={() => setTone("polite")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                tone === "polite"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Courtois
            </button>
            <button
              onClick={() => setTone("standard")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                tone === "standard"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setTone("urgent")}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                tone === "urgent"
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Urgent
            </button>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <span>Devise :</span>
            <button
              onClick={() => setCurrency(currency === "CDF" ? "USD" : "CDF")}
              className="font-bold text-emerald-600 dark:text-emerald-400 underline hover:opacity-80"
            >
              {currency} (Basculer)
            </button>
          </div>
        </div>

        {/* Realistic WhatsApp Chat Bubble */}
        <div className="mt-2 p-3.5 rounded-2xl bg-[#0b141a] border border-[#222e35] shadow-inner relative text-white">
          <div className="flex items-center justify-between text-[10px] text-[#8696a0] pb-2 mb-2 border-b border-[#222e35]">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {selectedCustomer.name} ({selectedCustomer.phone})
            </span>
            <span>Aujourd'hui</span>
          </div>

          <div className="bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-sm text-[11px] leading-relaxed shadow-sm relative">
            <p>{getMessageContent()}</p>
            <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0] mt-1.5">
              <span>12:45</span>
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 italic">
              * Ouvre directement WhatsApp
            </span>
            <button
              onClick={handleSimulatedSend}
              className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all"
            >
              <Send className="w-3 h-3" />
              <span>{isSent ? "Message Envoyé !" : "Relancer le Client"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
