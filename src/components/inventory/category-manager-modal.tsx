"use client";

import React, { useState, useMemo } from "react";
import { renameCategoryCascade, deleteCategoryCascade } from "@/lib/db/dexie-db";
import type { Product } from "@/lib/shared/types";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Wine,
  Utensils,
  Store,
  Tag,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  ArrowRight,
} from "lucide-react";

export interface CategoryPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  categories: string[];
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: "bar-type",
    name: "Bar & Lounge (Par Type de Boisson)",
    icon: <Wine className="w-4 h-4 text-purple-600" />,
    description: "Organisation par types de boissons (Bières, Sucrés, Vins, Liqueurs, etc.)",
    categories: [
      "Bières",
      "Sucrés & Sodas",
      "Liqueurs & Cognacs",
      "Vins",
      "Cocktails",
      "Champagnes",
      "Eaux & Jus",
      "Snacks Bar & Tapas",
    ],
  },
  {
    id: "bar-brasserie",
    name: "Bar (Par Brasserie / Fournisseur)",
    icon: <Wine className="w-4 h-4 text-amber-600" />,
    description: "Organisation par distributeurs et brasseries (Bralima, Brasimba, etc.)",
    categories: [
      "Bralima",
      "Brasimba",
      "Bralirwa",
      "Brarudi",
      "Vins",
      "Liqueurs & Cognacs",
      "Sucrés & Sodas",
      "Eaux Minérales",
      "Autres Boissons",
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant & Cuisine (Carte Menu)",
    icon: <Utensils className="w-4 h-4 text-rose-600" />,
    description: "Organisation de cuisine (Grillades, Poissons, Viandes, Plats complets, etc.)",
    categories: [
      "Grillades",
      "Poissons & Capitaine",
      "Viandes & Poulet",
      "Accompagnements (Frites, Chikwangue, Bananes)",
      "Légumes & Salades",
      "Plats Complets",
      "Snacks & Fast-Food",
      "Petit-déjeuner",
      "Entrées & Soupes",
      "Desserts & Fruits",
      "Boissons & Rafraîchissements",
    ],
  },
  {
    id: "alimentation",
    name: "Alimentation & Supérette",
    icon: <Store className="w-4 h-4 text-blue-600" />,
    description: "Organisation de commerce de détail et produits de consommation courante",
    categories: [
      "Épicerie & Vivres Frais",
      "Boissons & Eaux",
      "Hygiène & Beauté",
      "Produits d'Entretien",
      "Snacks & Confiserie",
      "Services & Télécom",
      "Divers",
    ],
  },
];

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  storeId?: string;
  tenantId?: string;
  onCategorySelect?: (categoryName: string) => void;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  products = [],
  storeId,
  tenantId,
  onCategorySelect,
}: CategoryManagerModalProps) {
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "info" } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showFeedback = (text: string, type: "success" | "info" = "success") => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Compute category statistics from current products
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    (products || []).forEach((p) => {
      const cat = p.category?.trim() || "Général";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  }, [products]);

  if (!isOpen) return null;

  const handleCreateCategory = (catName: string) => {
    const clean = catName.trim();
    if (!clean) return;

    if (categoryStats.some((c) => c.name.toLowerCase() === clean.toLowerCase())) {
      showFeedback(`La catégorie "${clean}" existe déjà.`, "info");
      setNewCategoryInput("");
      return;
    }

    if (onCategorySelect) {
      onCategorySelect(clean);
    }
    showFeedback(`Catégorie "${clean}" prête à être utilisée !`);
    setNewCategoryInput("");
  };

  const handleStartEdit = (catName: string) => {
    setEditingCategory(catName);
    setEditCategoryName(catName);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;
    const cleanNew = editCategoryName.trim();

    if (cleanNew.toLowerCase() === editingCategory.toLowerCase()) {
      setEditingCategory(null);
      return;
    }

    setIsProcessing(true);
    try {
      const count = await renameCategoryCascade(editingCategory, cleanNew, { storeId, tenantId });
      showFeedback(`Catégorie renommée en "${cleanNew}" (${count} article${count > 1 ? "s" : ""} mis à jour)`);
      setEditingCategory(null);
    } catch (err: any) {
      alert("Erreur lors du renommage : " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (catName: string, count: number) => {
    const msg =
      count > 0
        ? `Voulez-vous supprimer la catégorie "${catName}" ? Les ${count} article(s) associés seront reclassés en "Général".`
        : `Voulez-vous supprimer la catégorie "${catName}" ?`;

    if (!confirm(msg)) return;

    setIsProcessing(true);
    try {
      await deleteCategoryCascade(catName, "Général", { storeId, tenantId });
      showFeedback(`Catégorie "${catName}" supprimée.`);
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>Gestion des Catégories de Produits</span>
              </h3>
              <p className="text-xs text-slate-500">
                Créez, organisez et personnalisez librement vos catégories selon votre activité (Bar, Restaurant, Fournisseurs)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mx-4 sm:mx-5 mt-3 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Quick Create Category Input */}
          <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100">
            <label className="text-xs font-bold text-purple-950 block mb-1.5 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-purple-600" />
              <span>Créer une nouvelle catégorie personnalisée :</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="ex: Bières, Grillades, Bralima, Vins, Cocktails, Snacks..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCategory(newCategoryInput);
                  }
                }}
                className="flex-1 px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => handleCreateCategory(newCategoryInput)}
                disabled={!newCategoryInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5 shrink-0 touch-press"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Packs for Bar & Restaurant */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Modèles Recommandés par Secteur d'Activité :</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORY_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-all flex flex-col justify-between group text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-white rounded-xl shadow-2xs">{preset.icon}</div>
                      <h4 className="font-bold text-xs text-slate-900">{preset.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">{preset.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {preset.categories.slice(0, 5).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCreateCategory(cat)}
                          className="px-2 py-0.5 rounded-lg bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 text-[10px] font-semibold text-slate-700 transition-colors"
                          title="Cliquer pour ajouter cette catégorie"
                        >
                          + {cat}
                        </button>
                      ))}
                      {preset.categories.length > 5 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-medium">
                          +{preset.categories.length - 5} autres
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {preset.categories.length} catégories
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        preset.categories.forEach((c) => handleCreateCategory(c));
                        showFeedback(`Pack "${preset.name}" ajouté avec succès !`);
                      }}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline"
                    >
                      <span>Ajouter tout le pack</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Active Categories in Store */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Catégories Actuelles du Catalogue ({categoryStats.length}) :</span>
              </span>
            </div>

            {categoryStats.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs">
                Aucune catégorie configurée pour le moment.
              </div>
            ) : (
              <div className="space-y-1.5">
                {categoryStats.map((cat) => {
                  const isEditing = editingCategory === cat.name;

                  return (
                    <div
                      key={cat.name}
                      className="p-2.5 sm:p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 hover:bg-slate-100/60 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEditingCategory(null);
                            }}
                            className="flex-1 px-3 py-1.5 bg-white border border-blue-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={isProcessing}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                            title="Confirmer le nouveau nom"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs transition-colors"
                            title="Annuler"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                                {cat.name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {cat.count} article{cat.count > 1 ? "s" : ""} associé{cat.count > 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {onCategorySelect && (
                              <button
                                type="button"
                                onClick={() => {
                                  onCategorySelect(cat.name);
                                  onClose();
                                }}
                                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold transition-colors"
                                title="Sélectionner cette catégorie"
                              >
                                Choisir
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleStartEdit(cat.name)}
                              className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-xl text-xs transition-colors border border-slate-200"
                              title="Renommer la catégorie"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(cat.name, cat.count)}
                              disabled={isProcessing}
                              className="p-2 bg-white hover:bg-rose-50 text-rose-600 rounded-xl text-xs transition-colors border border-slate-200"
                              title="Supprimer la catégorie"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {categoryStats.length} catégorie{categoryStats.length > 1 ? "s" : ""} au total
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors touch-press"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
