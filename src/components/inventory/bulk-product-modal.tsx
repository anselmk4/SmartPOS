"use client";

import React, { useState, useEffect, useRef } from "react";
import { db, generateUUID, DEFAULT_STORE_ID, DEFAULT_TENANT_ID } from "@/lib/db/dexie-db";
import type { Product, SyncQueueItem } from "@/lib/shared/types";
import {
  Layers,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  CornerDownLeft,
  ArrowRight,
  Boxes,
} from "lucide-react";

export interface BulkProductRow {
  id: string;
  name: string;
  category: string;
  unitPrice: number | "";
  costPrice: number | "";
  stockQuantity: number | "";
  minStockAlert: number | "";
  barcode: string;
}

const DEFAULT_CATEGORIES = [
  "Bières",
  "Sucrés",
  "Vins",
  "Liqueurs / Cognacs",
  "Bralima",
  "Brasimba",
  "Grillades",
  "Poissons",
  "Viandes",
  "Accompagnements",
  "Légumes",
  "Plats complets",
  "Snacks",
  "Petit-déjeuner",
  "Alimentation",
  "Boissons",
  "Hygiène & Entretien",
  "Services & Crédit",
  "Divers",
];

const createEmptyRow = (defaultCategory: string = "Alimentation"): BulkProductRow => ({
  id: generateUUID(),
  name: "",
  category: defaultCategory,
  unitPrice: "",
  costPrice: "",
  stockQuantity: 1,
  minStockAlert: 5,
  barcode: "",
});

interface BulkProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
  onSwitchToSingle?: () => void;
  tenantId?: string;
  storeId: string;
  currency: string;
  existingCategories?: string[];
}

export function BulkProductModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToSingle,
  tenantId,
  storeId,
  currency,
  existingCategories = [],
}: BulkProductModalProps) {
  const [rows, setRows] = useState<BulkProductRow[]>([
    createEmptyRow("Alimentation"),
    createEmptyRow("Alimentation"),
    createEmptyRow("Alimentation"),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bulkCategory, setBulkCategory] = useState<string>("");

  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 150);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Available categories merged & sorted alphabetically
  const availableCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...existingCategories.filter((c) => c && c !== "Tous")])
  ).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

  const handleAddRow = (category: string = "Alimentation") => {
    setRows((prev) => [...prev, createEmptyRow(category)]);
  };

  const handleAddMultipleRows = (count: number) => {
    setRows((prev) => {
      const lastCat = prev[prev.length - 1]?.category || "Alimentation";
      const newRows: BulkProductRow[] = [];
      for (let i = 0; i < count; i++) {
        newRows.push(createEmptyRow(lastCat));
      }
      return [...prev, ...newRows];
    });
  };

  const handleDuplicateRow = (index: number) => {
    setRows((prev) => {
      const target = prev[index];
      const duplicated: BulkProductRow = {
        ...target,
        id: generateUUID(),
        name: target.name ? `${target.name} (Copie)` : "",
        barcode: "", // reset barcode for duplicate
      };
      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      return next;
    });
  };

  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) {
      // Reset the single row
      setRows([createEmptyRow()]);
      return;
    }
    setRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = <K extends keyof BulkProductRow>(
    index: number,
    field: K,
    value: BulkProductRow[K]
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleApplyCategoryToAll = (newCat: string) => {
    if (!newCat) return;
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        category: newCat,
      }))
    );
    setBulkCategory("");
  };

  // Keyboard shortcut: pressing Enter or Tab in the last barcode input adds a new row
  const handleKeyDownLastInput = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && index === rows.length - 1) {
      e.preventDefault();
      handleAddRow(rows[index]?.category || "Alimentation");
    }
  };

  // Validation stats
  const validRows = rows.filter((r) => r.name.trim().length > 0 && Number(r.unitPrice) >= 0 && r.unitPrice !== "");
  const totalStockQty = validRows.reduce((acc, r) => acc + (Number(r.stockQuantity) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Filter only rows that have at least a name
    const activeRows = rows.filter((r) => r.name.trim().length > 0);

    if (activeRows.length === 0) {
      setErrorMessage("Veuillez saisir au moins un article avec un nom et un prix de vente.");
      return;
    }

    // Verify all active rows have a valid price
    const invalidRows = activeRows.filter((r) => r.unitPrice === "" || isNaN(Number(r.unitPrice)) || Number(r.unitPrice) < 0);
    if (invalidRows.length > 0) {
      setErrorMessage(
        `L'article "${invalidRows[0].name}" a un prix de vente manquant ou invalide. Veuillez spécifier un prix (ex: 0 ou plus).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const currentTenantId = tenantId || DEFAULT_TENANT_ID;
      const currentStoreId = storeId || DEFAULT_STORE_ID;

      const newProducts: Product[] = [];
      const syncItems: SyncQueueItem[] = [];

      for (const row of activeRows) {
        const prodId = generateUUID();
        const unitPrice = Number(row.unitPrice) || 0;
        const costPrice = row.costPrice !== "" ? Number(row.costPrice) : undefined;
        const stockQuantity = row.stockQuantity !== "" ? Math.max(0, Number(row.stockQuantity)) : 0;
        const minStockAlert = row.minStockAlert !== "" ? Math.max(1, Number(row.minStockAlert)) : 5;

        const product: Product = {
          id: prodId,
          tenantId: currentTenantId,
          storeId: currentStoreId,
          name: row.name.trim(),
          category: row.category || "Alimentation",
          unitPrice,
          costPrice,
          stockQuantity,
          minStockAlert,
          barcode: row.barcode.trim() || undefined,
          isSynced: false,
          createdAt: now,
          updatedAt: now,
        };

        newProducts.push(product);

        const syncItem: SyncQueueItem = {
          id: generateUUID(),
          tenantId: currentTenantId,
          storeId: currentStoreId,
          entity: "product",
          action: "CREATE",
          payload: JSON.stringify(product),
          status: "PENDING",
          retryCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        syncItems.push(syncItem);
      }

      // Perform atomic bulk save in Dexie IndexedDB
      await db.transaction("rw", [db.products, db.syncQueue], async () => {
        await db.products.bulkAdd(newProducts);
        await db.syncQueue.bulkAdd(syncItems);
      });

      onSuccess(newProducts.length);
      onClose();
    } catch (err: any) {
      console.error("[BulkProductModal Error]:", err);
      setErrorMessage("Erreur lors de la création groupée : " + (err.message || "Erreur inconnue"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Création d'Articles en Masse
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                  ⚡ Saisie Rapide
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Saisissez rapidement plusieurs articles ligne par ligne. Les lignes vides sont automatiquement ignorées.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onSwitchToSingle && (
              <button
                type="button"
                onClick={onSwitchToSingle}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors touch-press flex items-center gap-1.5"
                title="Basculer vers le formulaire unitaire avec photo"
              >
                <span>Fiche Unitaire (Photo)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action bar / Quick tools */}
        <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAddRow()}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1.5 border border-blue-200 transition-colors touch-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 1 Ligne</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddMultipleRows(5)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors touch-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 5 Lignes</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddMultipleRows(10)}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold items-center gap-1.5 transition-colors touch-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 10 Lignes</span>
            </button>

            {/* Apply category to all */}
            <div className="flex items-center gap-1.5 ml-0 sm:ml-2 pl-0 sm:pl-2 border-t sm:border-t-0 sm:border-l border-slate-200">
              <span className="text-slate-400 font-medium hidden md:inline">Appliquer catégorie :</span>
              <select
                value={bulkCategory}
                onChange={(e) => handleApplyCategoryToAll(e.target.value)}
                className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Choisir une catégorie --</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c} (à toutes les lignes)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
            <CornerDownLeft className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Astuce : Touche Entrée sur le dernier champ pour ajouter une ligne</span>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-4 sm:mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-rose-700 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Interactive Grid Table */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-5">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 sticky top-0 bg-white shadow-sm z-10">
                  <th className="pb-3 px-2 w-10 text-center">#</th>
                  <th className="pb-3 px-2 min-w-[220px]">Nom de l'article *</th>
                  <th className="pb-3 px-2 min-w-[150px]">Catégorie</th>
                  <th className="pb-3 px-2 min-w-[120px]">Prix Vente ({currency}) *</th>
                  <th className="pb-3 px-2 min-w-[120px]">Prix Achat ({currency})</th>
                  <th className="pb-3 px-2 w-24">Stock Init.</th>
                  <th className="pb-3 px-2 w-20">Alerte</th>
                  <th className="pb-3 px-2 min-w-[130px]">Code-barres</th>
                  <th className="pb-3 px-2 w-16 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {rows.map((row, index) => {
                  const isFilled = row.name.trim().length > 0;
                  const isValid = isFilled && row.unitPrice !== "" && Number(row.unitPrice) >= 0;

                  return (
                    <tr
                      key={row.id}
                      className={`group transition-colors ${
                        isFilled ? (isValid ? "bg-blue-50/20" : "bg-rose-50/20") : "hover:bg-slate-50/60"
                      }`}
                    >
                      {/* Row Index */}
                      <td className="py-2 px-2 text-center text-slate-400 font-mono font-bold text-[11px]">
                        <span
                          className={`inline-block w-6 h-6 rounded-full leading-6 text-center ${
                            isFilled
                              ? "bg-blue-600 text-white font-bold"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td className="py-2 px-2">
                        <input
                          ref={index === 0 ? firstInputRef : null}
                          type="text"
                          required={isFilled}
                          placeholder={`ex: Article ${index + 1}`}
                          value={row.name}
                          onChange={(e) => handleRowChange(index, "name", e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
                        />
                      </td>

                      {/* Category with autocomplete datalist & custom entry */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          list="bulk-categories-options"
                          required={isFilled}
                          placeholder="Catégorie..."
                          value={row.category}
                          onChange={(e) => handleRowChange(index, "category", e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        />
                      </td>

                      {/* Unit Selling Price */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required={isFilled}
                          placeholder="0"
                          value={row.unitPrice}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "unitPrice",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        />
                      </td>

                      {/* Cost Price */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={row.costPrice}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "costPrice",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        />
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={row.stockQuantity}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "stockQuantity",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-center"
                        />
                      </td>

                      {/* Min Stock Alert */}
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="5"
                          value={row.minStockAlert}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "minStockAlert",
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-center"
                        />
                      </td>

                      {/* Barcode */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="ex: 600100..."
                          value={row.barcode}
                          onKeyDown={(e) => handleKeyDownLastInput(e, index)}
                          onChange={(e) => handleRowChange(index, "barcode", e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateRow(index)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Dupliquer cette ligne"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(index)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Supprimer cette ligne"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <datalist id="bulk-categories-options">
            {availableCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          {/* Footer Summary & Submit */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Live Metrics */}
            <div className="flex items-center flex-wrap gap-4 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>
                  <strong className="text-blue-700 font-extrabold text-sm">{validRows.length}</strong>{" "}
                  {validRows.length > 1 ? "articles valides" : "article valide"}
                </span>
              </div>
              <div className="text-slate-300 hidden sm:inline">|</div>
              <div>
                <span className="text-slate-400 font-normal">Total Stock Init. : </span>
                <span className="font-extrabold text-slate-900">{totalStockQty} unités</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors touch-press"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || validRows.length === 0}
                className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all touch-press"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Création en cours...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Enregistrer {validRows.length > 0 ? `(${validRows.length}) Articles` : ""}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
