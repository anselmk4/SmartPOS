"use client";

import React, { useState, useEffect } from "react";
import type { PaymentMethod, PaymentSplit, Customer } from "@/lib/shared/types";
import {
  CreditCard,
  Coins,
  Check,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Layers,
  Banknote,
  Smartphone,
  BookOpen,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  selectedCustomer?: Customer | null;
  formatMoney: (amount: number) => string;
  currency: string;
  isProcessing: boolean;
  onConfirmPayment: (params: {
    paymentMethod: PaymentMethod;
    amountPaid: number;
    paymentSplits?: PaymentSplit[];
    notes?: string;
  }) => void;
}

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string; icon: string; color: string }> = [
  { id: "CASH", label: "Espèces (Cash)", icon: "💵", color: "border-blue-500 bg-blue-50/70 text-blue-700" },
  { id: "MPESA", label: "M-Pesa", icon: "📱", color: "border-red-500 bg-red-50/70 text-red-700" },
  { id: "AIRTEL_MONEY", label: "Airtel Money", icon: "🔴", color: "border-rose-600 bg-rose-50/70 text-rose-700" },
  { id: "ORANGE_MONEY", label: "Orange Money", icon: "🍊", color: "border-orange-500 bg-orange-50/70 text-orange-700" },
  { id: "AFRIMONEY", label: "Afrimoney", icon: "🟣", color: "border-purple-600 bg-purple-50/70 text-purple-700" },
  { id: "CARD", label: "Carte Bancaire", icon: "💳", color: "border-indigo-500 bg-indigo-50/70 text-indigo-700" },
  { id: "CREDIT", label: "Carnet Dette (Crédit)", icon: "📖", color: "border-amber-600 bg-amber-50/70 text-amber-700" },
];

export function PaymentModal({
  isOpen,
  onClose,
  subtotalAmount,
  discountAmount,
  totalAmount,
  selectedCustomer,
  formatMoney,
  currency,
  isProcessing,
  onConfirmPayment,
}: PaymentModalProps) {
  const [paymentMode, setPaymentMode] = useState<"SINGLE" | "SPLIT">("SINGLE");

  // Single payment state
  const [singleMethod, setSingleMethod] = useState<PaymentMethod>("CASH");
  const [cashGiven, setCashGiven] = useState<number>(totalAmount);
  const [amountPaidInput, setAmountPaidInput] = useState<number>(totalAmount);
  const [notes, setNotes] = useState<string>("");

  // Split payment state
  const [splits, setSplits] = useState<PaymentSplit[]>([
    { method: "CASH", amount: Math.ceil(totalAmount / 2) },
    { method: "AIRTEL_MONEY", amount: totalAmount - Math.ceil(totalAmount / 2) },
  ]);

  useEffect(() => {
    setCashGiven(totalAmount);
    setAmountPaidInput(totalAmount);
    setSplits([
      { method: "CASH", amount: Math.ceil(totalAmount / 2) },
      { method: "AIRTEL_MONEY", amount: totalAmount - Math.ceil(totalAmount / 2) },
    ]);
  }, [totalAmount, isOpen]);

  if (!isOpen) return null;

  // Split calculations
  const totalSplitPaid = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const splitRemaining = totalAmount - totalSplitPaid;
  const isSplitExact = Math.abs(splitRemaining) < 0.01;

  const handleAddSplitRow = () => {
    const defaultAmount = Math.max(0, splitRemaining);
    setSplits((prev) => [...prev, { method: "CASH", amount: defaultAmount }]);
  };

  const handleRemoveSplitRow = (index: number) => {
    setSplits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSplitChange = (index: number, field: keyof PaymentSplit, value: any) => {
    setSplits((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMode === "SINGLE") {
      if (singleMethod === "CREDIT" && !selectedCustomer) {
        alert("Veuillez sélectionner un client dans la caisse avant d'enregistrer une dette.");
        return;
      }
      onConfirmPayment({
        paymentMethod: singleMethod,
        amountPaid: singleMethod === "CREDIT" ? amountPaidInput : totalAmount,
        notes: notes.trim() || undefined,
      });
    } else {
      // Split payment mode
      if (!isSplitExact) {
        alert(`Le montant réparti (${formatMoney(totalSplitPaid)}) ne correspond pas au total dû (${formatMoney(totalAmount)}). Ajustez les montants.`);
        return;
      }
      const hasCredit = splits.some((s) => s.method === "CREDIT");
      if (hasCredit && !selectedCustomer) {
        alert("Veuillez sélectionner un client dans la caisse pour la part mise à crédit.");
        return;
      }

      const totalCashAndOnline = splits
        .filter((s) => s.method !== "CREDIT")
        .reduce((sum, s) => sum + s.amount, 0);

      onConfirmPayment({
        paymentMethod: splits[0]?.method || "CASH",
        amountPaid: totalCashAndOnline,
        paymentSplits: splits,
        notes: notes.trim() || undefined,
      });
    }
  };

  // Quick cash given presets
  const quickCashPresets = [
    totalAmount,
    Math.ceil(totalAmount / 1000) * 1000,
    Math.ceil(totalAmount / 5000) * 5000,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 20000) * 20000,
    Math.ceil(totalAmount / 50000) * 50000,
  ].filter((val, idx, arr) => val >= totalAmount && arr.indexOf(val) === idx);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Règlement de la Vente
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span>Total : <b className="text-blue-600 font-bold">{formatMoney(totalAmount)}</b></span>
              {discountAmount > 0 && (
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                  Remise: -{formatMoney(discountAmount)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle: Paiement Simple vs Paiement Multiple */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setPaymentMode("SINGLE")}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              paymentMode === "SINGLE"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Paiement Direct (Unique)</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode("SPLIT")}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              paymentMode === "SPLIT"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Paiement Multiple (Fractionné)</span>
          </button>
        </div>

        {paymentMode === "SINGLE" ? (
          /* ======================================================== */
          /* SINGLE PAYMENT MODE                                      */
          /* ======================================================== */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Choisir le mode d'encaissement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSingleMethod(m.id);
                      if (m.id !== "CREDIT") setAmountPaidInput(totalAmount);
                    }}
                    className={`p-2.5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center gap-2 touch-press ${
                      singleMethod === m.id
                        ? `${m.color} ring-2 ring-blue-500 shadow-xs`
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    <span className="truncate">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash specific details */}
            {singleMethod === "CASH" && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-blue-600" />
                    <span>Espèces reçues du client</span>
                  </label>
                  <span className="text-xs">
                    Monnaie à rendre :{" "}
                    <b className={cashGiven >= totalAmount ? "text-emerald-700 font-extrabold text-sm" : "text-slate-400 font-bold"}>
                      {formatMoney(Math.max(0, cashGiven - totalAmount))}
                    </b>
                  </span>
                </div>

                <input
                  type="number"
                  step="any"
                  value={cashGiven || ""}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  className="w-full p-3 bg-white rounded-xl text-xl font-black text-slate-900 border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />

                {/* Quick cash presets */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">
                    Raccourcis Billets
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickCashPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCashGiven(preset)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                          cashGiven === preset
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {formatMoney(preset)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Credit specific details */}
            {singleMethod === "CREDIT" && (
              <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>Vente à Crédit / Dette Enregistrée</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Acompte versé maintenant
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={totalAmount}
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(Math.min(totalAmount, Number(e.target.value)))}
                      className="w-full p-2.5 bg-white rounded-xl text-sm font-black text-slate-900 border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Reste inscrit en dette
                    </label>
                    <div className="p-2.5 bg-rose-100 rounded-xl text-sm font-black text-rose-700 border border-rose-200">
                      {formatMoney(Math.max(0, totalAmount - amountPaidInput))}
                    </div>
                  </div>
                </div>

                {!selectedCustomer ? (
                  <p className="text-xs text-rose-700 font-bold bg-white/80 p-2 rounded-xl border border-rose-200">
                    ⚠️ Aucun client sélectionné. Veuillez fermer et choisir un client dans la caisse pour inscrire la dette.
                  </p>
                ) : (
                  <p className="text-xs text-slate-600">
                    Client débiteur : <b>{selectedCustomer.name}</b> (Solde actuel : {formatMoney(selectedCustomer.currentDebtBalance)})
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* SPLIT / MULTIPLE PAYMENT MODE                            */
          /* ======================================================== */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Répartition des modes de règlement</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  isSplitExact
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}
              >
                {isSplitExact
                  ? "✓ Montant total équilibré (100%)"
                  : `Reste à affecter : ${formatMoney(splitRemaining)}`}
              </span>
            </div>

            <div className="space-y-2.5">
              {splits.map((split, index) => (
                <div
                  key={index}
                  className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center gap-2"
                >
                  {/* Method Select */}
                  <select
                    value={split.method}
                    onChange={(e) =>
                      handleSplitChange(index, "method", e.target.value as PaymentMethod)
                    }
                    className="p-2 bg-white rounded-xl text-xs font-bold border border-slate-200 outline-none max-w-[140px]"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.icon} {m.label}
                      </option>
                    ))}
                  </select>

                  {/* Amount Input */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={split.amount || ""}
                      onChange={(e) =>
                        handleSplitChange(index, "amount", Number(e.target.value))
                      }
                      placeholder="0"
                      className="w-full p-2 bg-white rounded-xl text-sm font-black text-slate-900 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      {currency}
                    </span>
                  </div>

                  {/* Delete row */}
                  {splits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSplitRow(index)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddSplitRow}
              className="w-full py-2 border-2 border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un mode de paiement supplémentaire</span>
            </button>

            {/* Split summary table */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Total Facture :</span>
                <span className="font-bold">{formatMoney(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Total Réparti :</span>
                <span className="font-bold">{formatMoney(totalSplitPaid)}</span>
              </div>
              <div
                className={`flex justify-between pt-1 border-t border-slate-200 font-black ${
                  isSplitExact ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                <span>Écart / Reste :</span>
                <span>{formatMoney(splitRemaining)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Optional Notes */}
        <div className="mt-3">
          <input
            type="text"
            placeholder="Note ou référence sur la facture (optionnel)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:bg-white outline-none"
          />
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={
              isProcessing ||
              (paymentMode === "SINGLE" && singleMethod === "CREDIT" && !selectedCustomer) ||
              (paymentMode === "SPLIT" && !isSplitExact)
            }
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all touch-press disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span>Enregistrement...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Valider l'Encaissement ({formatMoney(totalAmount)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
