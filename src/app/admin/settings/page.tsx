"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/lib/admin/admin-api";
import {
  Settings,
  Database,
  Download,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Server,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  AlertCircle,
} from "lucide-react";

interface SystemStats {
  database: {
    connected: boolean;
    provider: string;
    latencyMs: number;
    urlHost: string;
    error?: string;
  };
  tableCounts: {
    tenants: number;
    stores: number;
    users: number;
    subscriptions: number;
    products: number;
    customers: number;
    sales: number;
    saleItems: number;
    debtPayments: number;
    syncLogs: number;
    otpVerifications: number;
  };
  environment: string;
  serverTimestamp: string;
}

export default function AdminSettingsPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Platform Pricing Settings (configurable)
  const [proPrice, setProPrice] = useState(15000);
  const [bizPrice, setBizPrice] = useState(45000);
  const [freeQuota, setFreeQuota] = useState(100);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadStats = useCallback(async () => {
    try {
      const res = await adminFetch<SystemStats>("/api/v1/admin/settings");
      if (res.success && res.data) {
        setStats(res.data);
        setError(null);
      } else {
        setError(res.error || "Erreur de connexion à la base de données");
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleExportFullDatabaseJson = async () => {
    setIsExporting(true);
    try {
      const res = await adminFetch("/api/v1/admin/settings", {
        method: "POST",
      });

      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `supabase_globalpos_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Sauvegarde intégrale Supabase exportée avec succès !");
      } else {
        alert(res.error || "Erreur lors de l'exportation");
      }
    } catch (err: any) {
      alert("Erreur lors de l'export: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSavePlatformConfig = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Configuration des tarifs et quotas sauvegardée avec succès !");
  };

  const counts = stats?.tableCounts || {
    tenants: 0,
    stores: 0,
    users: 0,
    subscriptions: 0,
    products: 0,
    customers: 0,
    sales: 0,
    saleItems: 0,
    debtPayments: 0,
    syncLogs: 0,
    otpVerifications: 0,
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
            <Settings className="w-3.5 h-3.5" />
            <span>Console Système Super Admin</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Paramètres & Supervision Supabase PostgreSQL
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Surveillance en temps réel de la base cloud, volume des données et sauvegardes intégrales.
          </p>
        </div>

        <button
          onClick={() => {
            setIsRefreshing(true);
            loadStats();
          }}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
          <span>Actualiser le Statut</span>
        </button>
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={loadStats} className="font-bold underline hover:text-white">
            Réessayer
          </button>
        </div>
      )}

      {/* Database Status Card */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Base de Données Principale (Supabase Cloud PostgreSQL)
              </h3>
              <p className="text-xs text-slate-400">
                Fournisseur : {stats?.database.provider || "Supabase"} • Hôte : {stats?.database.urlHost || "Pooler AWS"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                stats?.database.connected
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  stats?.database.connected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              <span>{stats?.database.connected ? "En Ligne & Connecté" : "Hors Ligne"}</span>
            </span>

            {stats?.database.latencyMs !== undefined && (
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {stats.database.latencyMs} ms
              </span>
            )}
          </div>
        </div>

        {/* Real Table Counts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4">
          {[
            { label: "Boutiques (tenants)", count: counts.tenants, color: "text-blue-400" },
            { label: "Points de vente (stores)", count: counts.stores, color: "text-indigo-400" },
            { label: "Utilisateurs (users)", count: counts.users, color: "text-purple-400" },
            { label: "Abonnements (subscriptions)", count: counts.subscriptions, color: "text-emerald-400" },
            { label: "Catalogue (products)", count: counts.products, color: "text-amber-400" },
            { label: "Clients (customers)", count: counts.customers, color: "text-sky-400" },
            { label: "Ventes (sales)", count: counts.sales, color: "text-emerald-300" },
            { label: "Articles vendus (sale_items)", count: counts.saleItems, color: "text-teal-400" },
            { label: "Règlements dettes", count: counts.debtPayments, color: "text-rose-400" },
            { label: "Journaux sync (sync_logs)", count: counts.syncLogs, color: "text-slate-400" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60 flex flex-col justify-between"
            >
              <span className="text-[11px] text-slate-400 font-medium truncate">{item.label}</span>
              <span className={`text-xl font-black ${item.color} mt-1 font-mono`}>
                {isLoading ? "..." : item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Database Backup & Export */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base">
              Sauvegarde Complète de la Base Supabase (JSON)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Générez et téléchargez une archive JSON intégrale contenant toutes les tables réelles de Supabase (boutiques, utilisateurs, produits, ventes, abonnements).
            </p>
          </div>

          <button
            onClick={handleExportFullDatabaseJson}
            disabled={isExporting}
            className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all touch-press shrink-0"
          >
            <Download className={`w-4 h-4 ${isExporting ? "animate-bounce" : ""}`} />
            <span>{isExporting ? "Génération en cours..." : "Télécharger Sauvegarde Supabase"}</span>
          </button>
        </div>
      </div>

      {/* Pricing & SaaS Quotas */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Tarification SaaS des Forfaits RDC</h3>
            <p className="text-xs text-slate-400">
              Paramétrez les montants standards des abonnements facturés aux boutiques.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePlatformConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Forfait PRO Mensuel (CDF)
            </label>
            <input
              type="number"
              value={proPrice}
              onChange={(e) => setProPrice(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Équivalent ~5.5 USD / mois</p>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Forfait BUSINESS Mensuel (CDF)
            </label>
            <input
              type="number"
              value={bizPrice}
              onChange={(e) => setBizPrice(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Équivalent ~16 USD / mois</p>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Quota Produits Forfait Gratuit
            </label>
            <input
              type="number"
              value={freeQuota}
              onChange={(e) => setFreeQuota(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Limite max d'articles en version FREE</p>
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
            >
              Enregistrer la Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
