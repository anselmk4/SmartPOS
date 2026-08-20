"use client";

import React, { useState } from "react";
import type { HeldOrder, Customer } from "@/lib/shared/types";
import { Clock, Trash2, ArrowRight, Play, Utensils, X, Plus, AlertCircle } from "lucide-react";

interface HoldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrder[];
  onRestoreHeldOrder: (order: HeldOrder) => void;
  onDeleteHeldOrder: (orderId: string) => void;
  onSaveCurrentAsHold: (label: string, notes?: string) => void;
  canSaveCurrent: boolean;
  formatMoney: (amount: number) => string;
  selectedCustomer?: Customer | null;
}

export function HoldOrdersModal({
  isOpen,
  onClose,
  heldOrders,
  onRestoreHeldOrder,
  onDeleteHeldOrder,
  onSaveCurrentAsHold,
  canSaveCurrent,
  formatMoney,
  selectedCustomer,
}: HoldOrdersModalProps) {
  const [activeTab, setActiveTab] = useState<"LIST" | "NEW">("LIST");
  const [tableLabel, setTableLabel] = useState("");
  const [holdNotes, setHoldNotes] = useState("");

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableLabel.trim()) return;
    onSaveCurrentAsHold(tableLabel.trim(), holdNotes.trim() || undefined);
    setTableLabel("");
    setHoldNotes("");
    setActiveTab("LIST");
    onClose();
  };

  const quickTableSuggestions = [
    "Table 1",
    "Table 2",
    "Table 3",
    "Table 4",
    "Table 5",
    "Table 6",
    "Table 7",
    "Table 8",
    "Comptoir",
    "Terrasse",
    "VIP Lounge",
    "À Emporter",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Tickets & Tables en Attente (Hold)
              </h3>
              <p className="text-xs text-slate-500">
                {heldOrders.length} commande{heldOrders.length > 1 ? "s" : ""} en cours
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab("LIST")}
            className={`py-2 rounded-lg transition-all ${
              activeTab === "LIST"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Commandes en Attente ({heldOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("NEW")}
            disabled={!canSaveCurrent}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === "NEW"
                ? "bg-white text-slate-900 shadow-xs"
                : !canSaveCurrent
                ? "text-slate-400 cursor-not-allowed opacity-60"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mettre le panier en attente</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {activeTab === "LIST" ? (
            heldOrders.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Aucune commande en attente</p>
                <p className="text-xs text-slate-400 mt-1">
                  Mettez un panier en pause pour servir un autre client ou gérer une table de restaurant.
                </p>
                {canSaveCurrent && (
                  <button
                    onClick={() => setActiveTab("NEW")}
                    className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
                  >
                    Mettre le panier actuel en attente
                  </button>
                )}
              </div>
            ) : (
              heldOrders.map((order) => {
                const totalQty = order.items.reduce((sum, it) => sum + it.quantity, 0);
                const timeStr = new Date(order.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={order.id}
                    className="bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-300 rounded-2xl p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                          {order.label}
                        </span>
                        {order.customerName && (
                          <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold">
                            👤 {order.customerName}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          🕒 {timeStr}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1.5 line-clamp-1">
                        {order.items.map((it) => `${it.product.name} (x${it.quantity})`).join(", ")}
                      </div>

                      <div className="text-xs font-bold text-amber-700 mt-1">
                        Total : {formatMoney(order.totalAmount)} • <span className="text-slate-500 font-normal">{totalQty} article{totalQty > 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onDeleteHeldOrder(order.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Supprimer ce ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          onRestoreHeldOrder(order);
                          onClose();
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                      >
                        <span>Reprendre</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <form onSubmit={handleSave} className="space-y-4 py-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Nom de la Table ou Référence du Ticket *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Table 4, Terrasse, M. Amadou..."
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl text-sm font-semibold border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
                  autoFocus
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
                  Suggestions Rapides
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickTableSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setTableLabel(sug)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                        tableLabel === sug
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Notes ou Remarques (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Servir après l'entrée, sans piment..."
                  value={holdNotes}
                  onChange={(e) => setHoldNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
                />
              </div>

              {selectedCustomer && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>Le client <b>{selectedCustomer.name}</b> sera rattaché à ce ticket.</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("LIST")}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!tableLabel.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Mettre en Attente
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
