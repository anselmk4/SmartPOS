"use client";

import React, { useState, useEffect } from "react";
import { Percent, DollarSign, Check, X, Tag } from "lucide-react";

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotalAmount: number;
  currentDiscountType?: "PERCENT" | "FIXED";
  currentDiscountValue?: number;
  onApplyDiscount: (type: "PERCENT" | "FIXED", value: number) => void;
  onRemoveDiscount: () => void;
  formatMoney: (amount: number) => string;
  currency: string;
}

export function DiscountModal({
  isOpen,
  onClose,
  subtotalAmount,
  currentDiscountType = "PERCENT",
  currentDiscountValue = 0,
  onApplyDiscount,
  onRemoveDiscount,
  formatMoney,
  currency,
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">(currentDiscountType);
  const [discountValue, setDiscountValue] = useState<number>(currentDiscountValue);

  useEffect(() => {
    setDiscountType(currentDiscountType);
    setDiscountValue(currentDiscountValue);
  }, [currentDiscountType, currentDiscountValue, isOpen]);

  if (!isOpen) return null;

  const calculatedDiscountAmount =
    discountType === "PERCENT"
      ? (subtotalAmount * (discountValue || 0)) / 100
      : Math.min(subtotalAmount, discountValue || 0);

  const finalTotal = Math.max(0, subtotalAmount - calculatedDiscountAmount);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountValue <= 0) {
      onRemoveDiscount();
    } else {
      onApplyDiscount(discountType, discountValue);
    }
    onClose();
  };

  const percentPresets = [5, 10, 15, 20, 25, 50];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <form
        onSubmit={handleApply}
        className="bg-white w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Appliquer une Remise</h3>
              <p className="text-xs text-slate-500">Sous-total : {formatMoney(subtotalAmount)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type Toggle: Percentage vs Fixed Amount */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setDiscountType("PERCENT");
              if (discountType === "FIXED") setDiscountValue(10);
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              discountType === "PERCENT"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Pourcentage (%)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDiscountType("FIXED");
              if (discountType === "PERCENT") setDiscountValue(0);
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              discountType === "FIXED"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Montant Fixe ({currency})</span>
          </button>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            {discountType === "PERCENT" ? "Pourcentage de réduction" : "Montant déduit de la facture"}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max={discountType === "PERCENT" ? "100" : subtotalAmount}
              step={discountType === "PERCENT" ? "1" : "0.01"}
              value={discountValue || ""}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              placeholder="0"
              className="w-full p-3 bg-slate-50 rounded-xl text-lg font-black text-slate-900 border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              autoFocus
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-black text-sm text-slate-400">
              {discountType === "PERCENT" ? "%" : currency}
            </span>
          </div>
        </div>

        {/* Percentage Presets */}
        {discountType === "PERCENT" && (
          <div className="mb-4">
            <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
              Raccourcis
            </label>
            <div className="grid grid-cols-6 gap-1">
              {percentPresets.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountValue(pct)}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    discountValue === pct
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-5 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Total Brut :</span>
            <span className="font-semibold">{formatMoney(subtotalAmount)}</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-bold">
            <span>Remise accordée :</span>
            <span>- {formatMoney(calculatedDiscountAmount)}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-200 flex justify-between text-slate-900 text-sm font-black">
            <span>Net à Payer :</span>
            <span className="text-emerald-700">{formatMoney(finalTotal)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {currentDiscountValue > 0 && (
            <button
              type="button"
              onClick={() => {
                onRemoveDiscount();
                onClose();
              }}
              className="py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
            >
              Supprimer
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Valider</span>
          </button>
        </div>
      </form>
    </div>
  );
}
