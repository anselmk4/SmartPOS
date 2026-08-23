"use client";

import React, { useState, useMemo } from "react";
import type { HeldOrder, Customer } from "@/lib/shared/types";
import {
  Clock,
  Trash2,
  ArrowRight,
  Play,
  Utensils,
  X,
  Plus,
  AlertCircle,
  FileText,
  Printer,
  Search,
  Receipt,
} from "lucide-react";

interface HoldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrder[];
  onRestoreHeldOrder: (order: HeldOrder) => void;
  onDeleteHeldOrder: (orderId: string) => void;
  onSaveCurrentAsHold: (label: string, notes?: string) => void;
  onSaveAndPrint?: (label: string, notes?: string) => void;
  canSaveCurrent: boolean;
  formatMoney: (amount: number) => string;
  selectedCustomer?: Customer | null;
  businessType?: string;
}

export function HoldOrdersModal({
  isOpen,
  onClose,
  heldOrders,
  onRestoreHeldOrder,
  onDeleteHeldOrder,
  onSaveCurrentAsHold,
  onSaveAndPrint,
  canSaveCurrent,
  formatMoney,
  selectedCustomer,
  businessType,
}: HoldOrdersModalProps) {
  const [activeTab, setActiveTab] = useState<"LIST" | "NEW">(canSaveCurrent ? "NEW" : "LIST");
  const [tableLabel, setTableLabel] = useState("");
  const [holdNotes, setHoldNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const isHorecaOrDepot = useMemo(() => {
    if (!businessType) return false;
    const lower = businessType.toLowerCase();
    return (
      lower.includes("restaurant") ||
      lower.includes("bar") ||
      lower.includes("lounge") ||
      lower.includes("pub") ||
      lower.includes("terrasse") ||
      lower.includes("café") ||
      lower.includes("cafe") ||
      lower.includes("snack") ||
      lower.includes("fastfood") ||
      lower.includes("fast-food") ||
      lower.includes("traiteur") ||
      lower.includes("boisson") ||
      lower.includes("depot") ||
      lower.includes("dépôt") ||
      lower.includes("brasserie")
    );
  }, [businessType]);

  if (!isOpen) return null;

  const defaultGeneratedLabel = selectedCustomer
    ? `Facture ${selectedCustomer.name}`
    : isHorecaOrDepot
    ? `Table ${heldOrders.length + 1}`
    : `Facture #${heldOrders.length + 1}`;

  const handleSaveOnly = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalLabel = tableLabel.trim() || defaultGeneratedLabel;
    onSaveCurrentAsHold(finalLabel, holdNotes.trim() || undefined);
    setTableLabel("");
    setHoldNotes("");
    setActiveTab("LIST");
    onClose();
  };

  const handleSaveAndPrint = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalLabel = tableLabel.trim() || defaultGeneratedLabel;
    if (onSaveAndPrint) {
      onSaveAndPrint(finalLabel, holdNotes.trim() || undefined);
    } else {
      onSaveCurrentAsHold(finalLabel, holdNotes.trim() || undefined);
    }
    setTableLabel("");
    setHoldNotes("");
    setActiveTab("LIST");
    onClose();
  };

  const quickSuggestions = isHorecaOrDepot
    ? [
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
        "Client Dépôt",
      ]
    : [
        "Client Comptoir",
        "Commande Rapide",
        "Livraison",
        "Devis / En Attente",
        "Client Fidélisé",
        "À Préparer",
        "Réservation",
        "Grossiste",
      ];

  const filteredHeldOrders = heldOrders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.label.toLowerCase().includes(q) ||
      (order.customerName && order.customerName.toLowerCase().includes(q)) ||
      (order.notes && order.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-xs ${
                isHorecaOrDepot
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-blue-50 text-blue-600 border-blue-200"
              }`}
            >
              {isHorecaOrDepot ? <Utensils className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {isHorecaOrDepot
                  ? "Factures à Payer & Tables en Attente"
                  : "Factures & Commandes en Attente"}
              </h3>
              <p className="text-xs text-slate-500">
                {heldOrders.length} facture{heldOrders.length > 1 ? "s" : ""} en cours de règlement
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
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab("LIST")}
            className={`py-2 rounded-lg transition-all ${
              activeTab === "LIST"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Factures en Attente ({heldOrders.length})
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
            <span>Facture à Payer (Nouveau)</span>
          </button>
        </div>

        {/* Search bar on List tab */}
        {activeTab === "LIST" && heldOrders.length > 3 && (
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une table, client, n° facture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {activeTab === "LIST" ? (
            filteredHeldOrders.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  {searchQuery ? "Aucune facture trouvée pour cette recherche" : "Aucune facture en attente"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Générez une facture à payer pour un client ou une table pour continuer à servir les autres.
                </p>
                {canSaveCurrent && (
                  <button
                    onClick={() => setActiveTab("NEW")}
                    className="mt-4 px-4 py-2 text-white bg-amber-500 hover:bg-amber-600 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
                  >
                    Générer la facture à payer du panier actuel
                  </button>
                )}
              </div>
            ) : (
              filteredHeldOrders.map((order) => {
                const totalQty = order.items.reduce((sum, it) => sum + it.quantity, 0);
                const timeStr = new Date(order.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={order.id}
                    className={`border rounded-2xl p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                      isHorecaOrDepot
                        ? "bg-slate-50 hover:bg-amber-50/50 border-slate-200 hover:border-amber-300"
                        : "bg-slate-50 hover:bg-blue-50/50 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5">
                          {isHorecaOrDepot ? (
                            <Utensils className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <Receipt className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>{order.label}</span>
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

                      <div
                        className={`text-xs font-bold mt-1 ${
                          isHorecaOrDepot ? "text-amber-700" : "text-blue-700"
                        }`}
                      >
                        Total à Payer : {formatMoney(order.totalAmount)} •{" "}
                        <span className="text-slate-500 font-normal">
                          {totalQty} article{totalQty > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onDeleteHeldOrder(order.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Annuler cette facture"
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
                        <span>Encaisser</span>
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <form className="space-y-4 py-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {isHorecaOrDepot
                    ? "Table, Emplacement ou Nom du Client (Optionnel)"
                    : "Référence ou Intitulé de la Facture (Optionnel)"}
                </label>
                <input
                  type="text"
                  placeholder={
                    isHorecaOrDepot
                      ? `Ex: Table 4, Terrasse, M. Amadou... (défaut: ${defaultGeneratedLabel})`
                      : `Ex: M. Amadou, Commande #12... (défaut: ${defaultGeneratedLabel})`
                  }
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                  className={`w-full p-3 bg-slate-50 rounded-xl text-sm font-semibold border border-slate-200 focus:bg-white outline-none ${
                    isHorecaOrDepot
                      ? "focus:ring-2 focus:ring-amber-500"
                      : "focus:ring-2 focus:ring-blue-500"
                  }`}
                  autoFocus
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
                  Suggestions Rapides
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setTableLabel(sug)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                        tableLabel === sug
                          ? isHorecaOrDepot
                            ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                            : "bg-blue-600 text-white border-blue-600 shadow-xs"
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
                  Notes ou Remarques pour le service (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Servir après l'entrée, boisson fraîche..."
                  value={holdNotes}
                  onChange={(e) => setHoldNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white outline-none"
                />
              </div>

              {selectedCustomer && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>
                    Le client <b>{selectedCustomer.name}</b> sera rattaché à cette facture.
                  </span>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSaveAndPrint}
                  disabled={!canSaveCurrent}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all touch-press"
                >
                  <Printer className="w-4 h-4" />
                  <span>Sauver & Imprimer la Facture à Payer</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("LIST")}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOnly}
                    disabled={!canSaveCurrent}
                    className="flex-1 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold disabled:opacity-50"
                  >
                    Sauver sans imprimer
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
