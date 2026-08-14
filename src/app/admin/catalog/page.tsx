"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import type { Product, Store, Tenant } from "@/lib/shared/types";
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
} from "lucide-react";

export default function AdminCatalogPage() {
  const { formatMoney } = useSync();

  const products = useLiveQuery(() => db.products.toArray()) || [];
  const stores = useLiveQuery(() => db.stores.toArray()) || [];
  const tenants = useLiveQuery(() => db.tenants.toArray()) || [];

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Computations
  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stockQuantity || 0) * (p.costPrice || p.unitPrice * 0.8), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= p.minStockAlert).length;
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      const matchStore = storeFilter === "ALL" || p.storeId === storeFilter || p.tenantId === storeFilter;
      const matchCat = categoryFilter === "ALL" || p.category === categoryFilter;
      const matchLowStock = !showLowStockOnly || p.stockQuantity <= p.minStockAlert;
      return matchSearch && matchStore && matchCat && matchLowStock;
    });
  }, [products, searchQuery, storeFilter, categoryFilter, showLowStockOnly]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Supervision des Stocks & Catalogue</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Catalogue Réseau Multi-Boutiques ({products.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervision globale de l'inventaire, contrôle des prix et détection des ruptures.
          </p>
        </div>
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
            <p className="text-[10px] text-slate-400 mt-0.5">Sur l'ensemble des boutiques</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Valeur du Stock Global (Achat)
            </span>
            <div className="text-2xl font-black text-blue-400 mt-1">
              {formatMoney(totalStockValue)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Valorisation du stock réseau</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`rounded-3xl p-5 border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            lowStockCount > 0
              ? showLowStockOnly
                ? "bg-amber-600/30 border-amber-500 ring-2 ring-amber-500/30"
                : "bg-slate-900 border-amber-500/40 hover:bg-slate-800"
              : "bg-slate-900 border-slate-800"
          }`}
        >
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Alertes Rupture Stock
            </span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {lowStockCount} <span className="text-xs font-normal text-slate-400">en alerte</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Cliquer pour filtrer</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom de produit ou code-barre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 rounded-xl text-xs border border-slate-700 focus:outline-none focus:border-blue-500 text-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
          >
            <option value="ALL">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="p-2 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
          >
            <option value="ALL">Toutes les boutiques</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredProducts.map((p) => {
          const isOutOfStock = p.stockQuantity <= 0;
          const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= p.minStockAlert;
          const margin = p.unitPrice - (p.costPrice || 0);
          const boutique = tenants.find((t) => t.id === p.tenantId);

          return (
            <div
              key={p.id}
              className="bg-slate-900 rounded-3xl p-4 border border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="relative w-full h-28 rounded-2xl overflow-hidden mb-3 bg-slate-800 flex items-center justify-center">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center">
                      <Package className="w-8 h-8 stroke-1 mb-1" />
                      <span className="text-[9px] uppercase font-bold">{p.category}</span>
                    </div>
                  )}

                  <span
                    className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm backdrop-blur ${
                      isOutOfStock
                        ? "bg-rose-600 text-white"
                        : isLowStock
                        ? "bg-amber-500 text-white"
                        : "bg-slate-950/80 text-slate-200"
                    }`}
                  >
                    {isOutOfStock ? "Rupture" : `Stock: ${p.stockQuantity}`}
                  </span>
                </div>

                <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-2 mb-1">
                  {p.name}
                </h3>

                {boutique && (
                  <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold mb-2">
                    <StoreIcon className="w-3 h-3" />
                    <span>{boutique.name}</span>
                  </div>
                )}

                <div className="bg-slate-800/80 rounded-xl p-2 grid grid-cols-3 gap-1 text-center my-2 text-[10px] border border-slate-700/50">
                  <div>
                    <div className="text-slate-400">Achat</div>
                    <div className="font-bold text-slate-300">{formatMoney(p.costPrice || 0)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Vente</div>
                    <div className="font-black text-blue-400">{formatMoney(p.unitPrice)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Marge</div>
                    <div className="font-bold text-emerald-400">+{formatMoney(margin)}</div>
                  </div>
                </div>
              </div>

              {p.barcode && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1">
                    <Barcode className="w-3 h-3" />
                    <span>{p.barcode}</span>
                  </div>
                  <span>Alerte: &lt;{p.minStockAlert}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
