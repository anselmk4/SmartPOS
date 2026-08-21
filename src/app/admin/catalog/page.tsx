"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { adminFetch } from "@/lib/admin/admin-api";
import {
  Package,
  Search,
  AlertTriangle,
  Barcode,
  Boxes,
  TrendingUp,
  DollarSign,
  Store as StoreIcon,
  Tag,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  RefreshCw,
  AlertCircle,
  Database,
} from "lucide-react";

interface ProductWithTenantStore {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  minStockAlert: number;
  category: string;
  barcode?: string | null;
  imageUrl?: string | null;
  updatedAt: string;
  tenant?: { id: string; name: string; slug: string };
  store?: { id: string; name: string };
}

export default function AdminCatalogPage() {
  const [products, setProducts] = useState<ProductWithTenantStore[]>([]);
  const [stores, setStores] = useState<Array<{ id: string; name: string; tenantId: string }>>([]);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantFilter, setTenantFilter] = useState<string>("ALL");
  const [storeFilter, setStoreFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithTenantStore | null>(null);
  const [formPrice, setFormPrice] = useState(0);
  const [formCost, setFormCost] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [formMinAlert, setFormMinAlert] = useState(5);
  const [formCategory, setFormCategory] = useState("Général");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const formatMoney = (amount: number, currency = "CDF") => {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount || 0)} ${currency}`;
  };

  const loadData = useCallback(async () => {
    try {
      const res = await adminFetch("/api/v1/admin/catalog");
      if (res.success && res.data) {
        setProducts(res.data.products || []);
        setStores(res.data.stores || []);
        setTenants(res.data.tenants || []);
        setCategories(res.data.categories || []);
        setTotalStockValue(res.data.totalStockValue || 0);
        setLowStockCount(res.data.lowStockCount || 0);
        setError(null);
      } else {
        setError(res.error || "Erreur lors du chargement du catalogue");
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      const matchTenant = tenantFilter === "ALL" || p.tenantId === tenantFilter;
      const matchStore = storeFilter === "ALL" || p.storeId === storeFilter;
      const matchCat = categoryFilter === "ALL" || p.category === categoryFilter;
      const matchLowStock = !showLowStockOnly || p.stockQuantity <= p.minStockAlert;
      return matchSearch && matchTenant && matchStore && matchCat && matchLowStock;
    });
  }, [products, searchQuery, tenantFilter, storeFilter, categoryFilter, showLowStockOnly]);

  const handleOpenEdit = (p: ProductWithTenantStore) => {
    setSelectedProduct(p);
    setFormPrice(p.unitPrice);
    setFormCost(p.costPrice || 0);
    setFormStock(p.stockQuantity);
    setFormMinAlert(p.minStockAlert || 5);
    setFormCategory(p.category || "Général");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSubmitting(true);
    const res = await adminFetch("/api/v1/admin/catalog", {
      method: "PUT",
      body: JSON.stringify({
        id: selectedProduct.id,
        unitPrice: formPrice,
        costPrice: formCost,
        stockQuantity: formStock,
        minStockAlert: formMinAlert,
        category: formCategory,
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsEditModalOpen(false);
      showToast(`Article "${selectedProduct.name}" mis à jour dans Supabase.`);
      loadData();
    } else {
      alert(res.error || "Erreur lors de la mise à jour");
    }
  };

  const handleDeleteProduct = async (p: ProductWithTenantStore) => {
    if (!confirm(`Voulez-vous supprimer définitivement l'article "${p.name}" de Supabase ?`)) return;

    const res = await adminFetch(`/api/v1/admin/catalog?id=${p.id}`, {
      method: "DELETE",
    });

    if (res.success) {
      showToast(res.message || "Article supprimé.");
      loadData();
    } else {
      alert(res.error || "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Table `products` Supabase PostgreSQL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Catalogue Réseau Multi-Boutiques ({products.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervision globale des stocks, contrôle des prix et détection des ruptures.
          </p>
        </div>

        <button
          onClick={() => {
            setIsRefreshing(true);
            loadData();
          }}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 flex items-center gap-2 text-xs font-bold"
          title="Rafraîchir les données"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Articles Référencés
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {products.length} <span className="text-xs font-normal text-slate-400">produits</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Sur l'ensemble des boutiques Supabase</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Valeur du Stock Global
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {formatMoney(totalStockValue)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Valorisation brute consolidée</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Alertes Rupture de Stock
            </span>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {lowStockCount} <span className="text-xs font-normal text-slate-400">articles</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Sous le seuil minimum d'alerte</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher article, code-barres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Boutique Filter */}
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Toutes les Boutiques</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Toutes Catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              showLowStockOnly
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Ruptures ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">Chargement du catalogue depuis Supabase...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="font-bold underline hover:text-white">
            Réessayer
          </button>
        </div>
      )}

      {/* Products Table */}
      {!isLoading && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-3.5">Article</th>
                  <th className="px-4 py-3.5">Boutique & Dépôt</th>
                  <th className="px-4 py-3.5">Catégorie</th>
                  <th className="px-4 py-3.5">Prix de Vente</th>
                  <th className="px-4 py-3.5">Stock Restant</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Aucun article trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLow = p.stockQuantity <= p.minStockAlert;

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-white text-sm">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {p.barcode ? `Code: ${p.barcode}` : `ID: ${p.id.slice(0, 8)}`}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-200">{p.tenant?.name || "Boutique"}</div>
                          <div className="text-[10px] text-slate-500">{p.store?.name || "Siège"}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {p.category || "Général"}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-mono font-black text-emerald-400 text-sm">
                            {formatMoney(p.unitPrice)}
                          </div>
                          {p.costPrice > 0 && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Achat: {formatMoney(p.costPrice)}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`font-mono font-black px-2.5 py-1 rounded-lg inline-block ${
                              isLow
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-slate-800 text-slate-200"
                            }`}
                          >
                            {p.stockQuantity} en stock
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Modifier l'article"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Edit Product */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Ajuster : {selectedProduct.name}</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Prix de Vente</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Prix d'Achat / Revient</label>
                  <input
                    type="number"
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Quantité en Stock</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Seuil d'Alerte</label>
                  <input
                    type="number"
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Catégorie</label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg"
                >
                  {isSubmitting ? "Enregistrement..." : "Valider dans Supabase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
