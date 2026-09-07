"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight, Check, Zap, Crown } from "lucide-react";
import type { SubscriptionPlan } from "@/lib/shared/types";

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  targetPlan?: SubscriptionPlan;
  features: string[];
}

export function UpgradePromptModal({
  isOpen,
  onClose,
  title,
  description,
  targetPlan = "PRO",
  features,
}: UpgradePromptModalProps) {
  if (!isOpen) return null;

  const isBusiness = targetPlan === "BUSINESS";
  const isBasic = targetPlan === "BASIC";

  const planLabel = isBusiness
    ? "Business Multi-Magasins"
    : isBasic
    ? "Commerçant Basic (15 000 FC)"
    : "Commerçant Pro (30 000 FC)";

  const planShort = isBusiness ? "Business" : isBasic ? "Basic (15 000 FC)" : "Pro (30 000 FC)";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center absolute top-4 right-4 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isBusiness
                ? "bg-indigo-100 text-indigo-700"
                : isBasic
                ? "bg-emerald-100 text-emerald-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {isBusiness ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
          </div>
          <div>
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                isBusiness
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : isBasic
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              Forfait {planLabel}
            </span>
          </div>
        </div>

        <h3 className="font-black text-slate-900 text-lg sm:text-xl leading-tight mb-1.5">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
          {description}
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5">
          <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Débloqué à partir du Forfait {planShort} :</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    isBusiness
                      ? "bg-indigo-100 text-indigo-700"
                      : isBasic
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Plus tard
          </button>
          <Link
            href={`/billing?plan=${targetPlan}`}
            className={`flex-1 py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-md touch-press transition-all ${
              isBusiness
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                : isBasic
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
            }`}
          >
            <span>Passer à {isBusiness ? "Business" : isBasic ? "Basic (15k FC)" : "Pro"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
