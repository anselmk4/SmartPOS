"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, processCashClosing, DEFAULT_STORE_ID } from "@/lib/db/dexie-db";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import {
  Coins,
  X,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface CashReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CashReconciliationModal({ isOpen, onClose }: CashReconciliationModalProps) {
  const { user, tenant, store } = useAuth();
  const { formatMoney, currency } = useSync();

  const currentStoreId = store?.id || DEFAULT_STORE_ID;
  const currentTenantId = tenant?.id;

  const todayStr = new Date().toISOString().split("T")[0];

  // Load today's cash sales
  const sales = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.sales
      .filter((s) => s.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  const debtPayments = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.debtPayments
      .filter((d) => d.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  const todayCashSales = useMemo(() => {
    return sales
      .filter((s) => s.createdAt.startsWith(todayStr) && s.paymentMethod === "CASH")
      .reduce((sum, s) => sum + s.amountPaid, 0);
  }, [sales, todayStr]);

  const todayCashDebtRepayments = useMemo(() => {
    return debtPayments
      .filter((d) => d.createdAt.startsWith(todayStr) && d.paymentMethod === "CASH")
      .reduce((sum, d) => sum + d.amount, 0);
  }, [debtPayments, todayStr]);

  const [openingCash, setOpeningCash] = useState<number>(0);
  const [actualCashCounted, setActualCashCounted] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedZ, setCompletedZ] = useState<any | null>(null);

  const expectedCash = openingCash + todayCashSales + todayCashDebtRepayments;
  const variance = actualCashCounted - expectedCash;

  if (!isOpen) return null;

  const handleSaveClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const closing = await processCashClosing({
        tenantId: tenant?.id,
        storeId: currentStoreId,
        userId: user?.id,
        userName: user?.name,
        openingCash,
        totalSalesCash: todayCashSales,
        totalDebtRepaymentsCash: todayCashDebtRepayments,
        actualCashCounted,
        notes: notes.trim() || undefined,
      });

      setCompletedZ(closing);
    } catch (err: any) {
      alert("Erreur lors de la clôture : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Clôture de Caisse Journalière (Ticket Z)
              </h3>
              <p className="text-xs text-slate-500">Contrôle des espèces et vérification des écarts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {completedZ ? (
          <div className="text-center py-2 space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h4 className="font-black text-slate-900 text-xl">Clôture Enregistrée avec Succès !</h4>
            <p className="text-xs text-slate-500">
              Date : {new Date(completedZ.createdAt).toLocaleDateString("fr-FR")} à{" "}
              {new Date(completedZ.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>

            {/* Ticket Z Print Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
                <span>Fond de caisse initial :</span>
                <span>{formatMoney(completedZ.openingCash)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>+ Ventes Espèces (Jour) :</span>
                <span>{formatMoney(completedZ.totalSalesCash)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
                <span>+ Remboursements Dettes :</span>
                <span>{formatMoney(completedZ.totalDebtRepaymentsCash)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1">
                <span>TOTAL THÉORIQUE ATTENDU :</span>
                <span>{formatMoney(completedZ.expectedCash)}</span>
              </div>
              <div className="flex justify-between font-bold text-blue-700">
                <span>ESPÈCES PHYSIQUES COMPTÉES :</span>
                <span>{formatMoney(completedZ.actualCashCounted)}</span>
              </div>
              <div
                className={`flex justify-between font-black text-sm pt-2 border-t border-slate-200 ${
                  completedZ.variance === 0
                    ? "text-blue-700"
                    : completedZ.variance > 0
                    ? "text-blue-600"
                    : "text-rose-600"
                }`}
              >
                <span>ÉCART DE CAISSE :</span>
                <span>
                  {completedZ.variance > 0 ? "+" : ""}
                  {formatMoney(completedZ.variance)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Ticket Z</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20"
              >
                Terminer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveClosing} className="space-y-4">
            {/* Calculation summary */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Ventes Espèces encaissées aujourd'hui :</span>
                <b className="text-slate-900">{formatMoney(todayCashSales)}</b>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Remboursements dettes reçus en espèces :</span>
                <b className="text-slate-900">{formatMoney(todayCashDebtRepayments)}</b>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Fond de caisse d'ouverture ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={openingCash || ""}
                  onChange={(e) => setOpeningCash(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-900 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Espèces physiques comptées ({currency}) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={actualCashCounted || ""}
                  onChange={(e) => setActualCashCounted(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-black text-blue-700 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Variance Calculation */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              variance === 0
                ? "bg-blue-50 border-blue-200 text-blue-800"
                : variance > 0
                ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider">
                  {variance === 0 ? "Caisse Équilibrée" : variance > 0 ? "Excédent de Caisse" : "Déficit / Manquant de Caisse"}
                </div>
                <div className="text-xs opacity-80">
                  Théorique : {formatMoney(expectedCash)}
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black">
                {variance > 0 ? "+" : ""}
                {formatMoney(variance)}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Remarques / Justification (optionnel)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ex: Monnaie manquée sur billet de 10 000 FC..."
                className="w-full p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 touch-press"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? "Enregistrement..." : "Valider la Clôture de Caisse"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
