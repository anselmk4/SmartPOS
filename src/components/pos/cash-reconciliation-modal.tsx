"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, processCashClosing, DEFAULT_STORE_ID } from "@/lib/db/dexie-db";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import { printIsolatedDocument } from "@/lib/native/print-service";
import type { CashClosing } from "@/lib/shared/types";
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
  Calendar,
  History,
  Search,
  Eye,
  ArrowLeft,
  Filter,
  Check,
  FileSpreadsheet,
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

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [historySearch, setHistorySearch] = useState("");
  const [viewingClosing, setViewingClosing] = useState<CashClosing | null>(null);

  // Load sales & debt payments for the store
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

  // Load all past cash closings from Dexie
  const pastClosings = useLiveQuery(async () => {
    if (!currentStoreId && !currentTenantId) return [];
    const list = await db.cashClosings
      .filter((c) => (Boolean(currentStoreId) && c.storeId === currentStoreId) || (Boolean(currentTenantId) && c.tenantId === currentTenantId))
      .toArray();
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [currentStoreId, currentTenantId]) || [];

  // Filtered sales and debt repayments for the SELECTED date
  const selectedCashSales = useMemo(() => {
    return sales
      .filter((s) => s.createdAt.startsWith(selectedDate) && s.paymentMethod === "CASH")
      .reduce((sum, s) => sum + s.amountPaid, 0);
  }, [sales, selectedDate]);

  const selectedCashDebtRepayments = useMemo(() => {
    return debtPayments
      .filter((d) => d.createdAt.startsWith(selectedDate) && d.paymentMethod === "CASH")
      .reduce((sum, d) => sum + d.amount, 0);
  }, [debtPayments, selectedDate]);

  // Form states
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [actualCashCounted, setActualCashCounted] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedZ, setCompletedZ] = useState<CashClosing | null>(null);

  const expectedCash = openingCash + selectedCashSales + selectedCashDebtRepayments;
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
        totalSalesCash: selectedCashSales,
        totalDebtRepaymentsCash: selectedCashDebtRepayments,
        actualCashCounted,
        notes: notes.trim() || undefined,
        closingDate: selectedDate,
      });

      setCompletedZ(closing);
    } catch (err: any) {
      alert("Erreur lors de la clôture : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const printTicketZ = async (closing: CashClosing) => {
    const storeName = store?.name || tenant?.name || "Kuettu Global POS";
    const dateObj = new Date(closing.createdAt);
    const dateStr = dateObj.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const bodyHtml = `
      <div class="text-center">
        <div class="font-black text-base uppercase">${storeName}</div>
        <div class="divider"></div>
        <div class="badge uppercase">*** CLÔTURE DE CAISSE (TICKET Z) ***</div>
      </div>

      <div class="divider"></div>
      <div style="font-size: 10px; line-height: 1.3;">
        <div class="flex justify-between"><span>Date Clôture :</span><span>${dateStr} à ${timeStr}</span></div>
        <div class="flex justify-between"><span>Gérant / Opérateur :</span><b>${closing.userName || user?.name || "Caisse"}</b></div>
      </div>

      <div class="divider"></div>
      <div style="font-size: 11px; line-height: 1.4;">
        <div class="flex justify-between"><span>Fond de caisse d'ouverture :</span><span>${formatMoney(closing.openingCash)}</span></div>
        <div class="flex justify-between"><span>+ Ventes Espèces (Jour) :</span><span>${formatMoney(closing.totalSalesCash)}</span></div>
        <div class="flex justify-between"><span>+ Remboursements Dettes (Cash) :</span><span>${formatMoney(closing.totalDebtRepaymentsCash)}</span></div>
        <div class="divider"></div>
        <div class="flex justify-between font-bold"><span>TOTAL THÉORIQUE ATTENDU :</span><span>${formatMoney(closing.expectedCash)}</span></div>
        <div class="flex justify-between font-black" style="font-size: 12px; margin-top: 3px;"><span>ESPÈCES REELLEMENT COMPTÉES :</span><span>${formatMoney(closing.actualCashCounted)}</span></div>
        <div class="divider"></div>
        <div class="flex justify-between font-black" style="font-size: 13px;">
          <span>ÉCART DE CAISSE :</span>
          <span>${closing.variance > 0 ? "+" : ""}${formatMoney(closing.variance)}</span>
        </div>
      </div>

      ${closing.notes ? `<div class="divider"></div><div style="font-size: 9px; color: #444;"><b>Notes / Justification :</b> ${closing.notes}</div>` : ""}

      <div class="divider"></div>
      <div class="text-center text-xs" style="color: #444; font-size: 9px; margin-top: 5px;">
        <p>Rapport certifié conforme • Kuettu Global POS</p>
        <p>https://globalpos.app</p>
      </div>
    `;

    await printIsolatedDocument({
      title: `Ticket_Z_${dateStr}`,
      width: "80mm",
      bodyHtml,
    });
  };

  const filteredPastClosings = pastClosings.filter((c) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    const dateStr = new Date(c.createdAt).toLocaleDateString("fr-FR");
    return (
      dateStr.includes(q) ||
      (c.userName && c.userName.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Clôture de Caisse Journalière (Ticket Z)
              </h3>
              <p className="text-xs text-slate-500">Contrôle des espèces, vérification des écarts & historique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        {!completedZ && !viewingClosing && (
          <div className="flex bg-slate-100 p-1 rounded-2xl my-3 shrink-0">
            <button
              onClick={() => setActiveTab("new")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "new"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Effectuer une Clôture</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "history"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historique des Tickets Z ({pastClosings.length})</span>
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 pt-1">
          {/* VIEW A: Single Completed Ticket Z View */}
          {(completedZ || viewingClosing) ? (
            (() => {
              const activeZ = completedZ || viewingClosing!;
              const dateObj = new Date(activeZ.createdAt);
              const dateStr = dateObj.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
              const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

              return (
                <div className="text-center py-2 space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-lg">
                      {completedZ ? "Clôture Enregistrée avec Succès !" : "Détail du Rapport Ticket Z"}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Date : <b className="text-slate-800">{dateStr}</b> à {timeStr} • Par <b className="text-slate-800">{activeZ.userName || "Caisse"}</b>
                    </p>
                  </div>

                  {/* Ticket Z Print Summary Card */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs font-mono space-y-2">
                    <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
                      <span>Fond de caisse initial :</span>
                      <span>{formatMoney(activeZ.openingCash)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>+ Ventes Espèces (Jour) :</span>
                      <span>{formatMoney(activeZ.totalSalesCash)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
                      <span>+ Remboursements Dettes :</span>
                      <span>{formatMoney(activeZ.totalDebtRepaymentsCash)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1">
                      <span>TOTAL THÉORIQUE ATTENDU :</span>
                      <span>{formatMoney(activeZ.expectedCash)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-blue-700">
                      <span>ESPÈCES PHYSIQUES COMPTÉES :</span>
                      <span>{formatMoney(activeZ.actualCashCounted)}</span>
                    </div>
                    <div
                      className={`flex justify-between font-black text-sm pt-2 border-t border-slate-200 ${
                        activeZ.variance === 0
                          ? "text-blue-700"
                          : activeZ.variance > 0
                          ? "text-blue-600"
                          : "text-rose-600"
                      }`}
                    >
                      <span>ÉCART DE CAISSE :</span>
                      <span>
                        {activeZ.variance > 0 ? "+" : ""}
                        {formatMoney(activeZ.variance)}
                      </span>
                    </div>
                    {activeZ.notes && (
                      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-sans">
                        <b>Remarques :</b> {activeZ.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={() => printTicketZ(activeZ)}
                      className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>Imprimer Ticket Z (Thermique 58/80mm)</span>
                    </button>

                    <button
                      onClick={() => {
                        setCompletedZ(null);
                        setViewingClosing(null);
                      }}
                      className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                    >
                      <span>Retour</span>
                    </button>
                  </div>
                </div>
              );
            })()
          ) : activeTab === "history" ? (
            /* VIEW B: History of past Ticket Z closings */
            <div className="space-y-3 animate-in fade-in">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par date (ex: 15/09/2026), caissier ou note..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {filteredPastClosings.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Aucun Ticket Z enregistré</p>
                  <p className="text-[11px] text-slate-400">
                    Les clôtures de caisse validées apparaîtront ici avec la date et le calcul des écarts.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPastClosings.map((closing) => {
                    const dateObj = new Date(closing.createdAt);
                    const formattedDate = dateObj.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                    const formattedTime = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

                    return (
                      <div
                        key={closing.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{formattedDate}</span>
                            <span className="text-[10px] text-slate-400 font-mono">à {formattedTime}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                              {closing.userName || "Caisse"}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                            <span>
                              Théorique : <b className="text-slate-800">{formatMoney(closing.expectedCash)}</b>
                            </span>
                            <span>
                              Compté : <b className="text-blue-700">{formatMoney(closing.actualCashCounted)}</b>
                            </span>
                            <span
                              className={`font-bold ${
                                closing.variance === 0
                                  ? "text-blue-600"
                                  : closing.variance > 0
                                  ? "text-blue-600"
                                  : "text-rose-600"
                              }`}
                            >
                              Écart : {closing.variance > 0 ? "+" : ""}
                              {formatMoney(closing.variance)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setViewingClosing(closing)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                            title="Consulter le détail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => printTicketZ(closing)}
                            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                            title="Imprimer le Ticket Z"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* VIEW C: New Cash Closing Form with Date Picker */
            <form onSubmit={handleSaveClosing} className="space-y-4">
              {/* Date Selector for Past / Specific Date Reconciliation */}
              <div className="bg-blue-50/70 rounded-2xl p-3.5 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Date de la Clôture / Réconciliation :</span>
                  </label>
                  {selectedDate !== todayStr && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayStr)}
                      className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Revenir à aujourd'hui
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <input
                    type="date"
                    value={selectedDate}
                    max={todayStr}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 bg-white rounded-xl text-xs font-bold text-slate-800 border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-1.5 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayStr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedDate === todayStr
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Aujourd'hui
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        setSelectedDate(yesterday.toISOString().split("T")[0]);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Hier
                    </button>
                  </div>
                </div>
              </div>

              {/* Calculation summary for the selected date */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    Ventes Espèces encaissées ({new Date(selectedDate).toLocaleDateString("fr-FR")}) :
                  </span>
                  <b className="text-slate-900">{formatMoney(selectedCashSales)}</b>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Remboursements dettes reçus en espèces :</span>
                  <b className="text-slate-900">{formatMoney(selectedCashDebtRepayments)}</b>
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
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  variance === 0
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : variance > 0
                    ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider">
                    {variance === 0
                      ? "Caisse Équilibrée"
                      : variance > 0
                      ? "Excédent de Caisse"
                      : "Déficit / Manquant de Caisse"}
                  </div>
                  <div className="text-xs opacity-80">
                    Total Théorique : {formatMoney(expectedCash)}
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
                  placeholder="ex: Clôture différée pour le shift de la veille, justification..."
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 touch-press cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? "Enregistrement..." : "Valider la Clôture de Caisse (Ticket Z)"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
