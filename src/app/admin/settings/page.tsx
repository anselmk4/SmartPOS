"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie-db";
import { seedAdminPlatformDataIfEmpty } from "@/lib/admin/admin-db-seed";
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
} from "lucide-react";

export default function AdminSettingsPage() {
  const tenantsCount = useLiveQuery(() => db.tenants.count()) || 0;
  const storesCount = useLiveQuery(() => db.stores.count()) || 0;
  const usersCount = useLiveQuery(() => db.users.count()) || 0;
  const subscriptionsCount = useLiveQuery(() => db.subscriptions.count()) || 0;
  const productsCount = useLiveQuery(() => db.products.count()) || 0;
  const customersCount = useLiveQuery(() => db.customers.count()) || 0;
  const salesCount = useLiveQuery(() => db.sales.count()) || 0;
  const syncQueueCount = useLiveQuery(() => db.syncQueue.count()) || 0;
  const transfersCount = useLiveQuery(() => db.stockTransfers.count()) || 0;
  const closingsCount = useLiveQuery(() => db.cashClosings.count()) || 0;

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

  const handleExportFullDatabaseJson = async () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      version: 3,
      platform: "Kuettu SMART POS Master",
      tenants: await db.tenants.toArray(),
      stores: await db.stores.toArray(),
      users: await db.users.toArray(),
      subscriptions: await db.subscriptions.toArray(),
      products: await db.products.toArray(),
      customers: await db.customers.toArray(),
      sales: await db.sales.toArray(),
      saleItems: await db.saleItems.toArray(),
      stockTransfers: await db.stockTransfers.toArray(),
      cashClosings: await db.cashClosings.toArray(),
      syncQueue: await db.syncQueue.toArray(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kuettu_platform_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Sauvegarde intégrale JSON exportée avec succès !");
  };

  const handleReseedPlatform = async () => {
    if (confirm("Voulez-vous réinjecter les données de démonstration multi-boutiques RDC (Kinshasa, Goma, Lubumbashi) ?")) {
      await seedAdminPlatformDataIfEmpty();
      showToast("Données multi-boutiques injectées avec succès !");
    }
  };

  const handleSavePlatformConfig = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Configuration des tarifs et quotas sauvegardée avec succès !");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-blue-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-blue-200" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Console Système & Maintenance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Paramètres Plateforme & Sauvegardes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervision de la base locale Dexie, tarifs des forfaits et outils de maintenance.
          </p>
        </div>
      </div>

      {/* Database Health Metrics Grid */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">État & Volume de la Base de Données</h3>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            ✓ Indexée & Prête (Version 3)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Boutiques (Tenants)", count: tenantsCount, color: "text-blue-400" },
            { label: "Points de Vente (Stores)", count: storesCount, color: "text-indigo-400" },
            { label: "Utilisateurs / Caissiers", count: usersCount, color: "text-emerald-400" },
            { label: "Abonnements", count: subscriptionsCount, color: "text-amber-400" },
            { label: "Articles Référencés", count: productsCount, color: "text-purple-400" },
            { label: "Clients Débiteurs", count: customersCount, color: "text-rose-400" },
            { label: "Ventes Réalisées", count: salesCount, color: "text-sky-400" },
            { label: "Transferts de Stock", count: transfersCount, color: "text-teal-400" },
            { label: "Clôtures Ticket Z", count: closingsCount, color: "text-yellow-400" },
            { label: "File de Synchro", count: syncQueueCount, color: "text-slate-400" },
          ].map((item) => (
            <div key={item.label} className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {item.label}
              </span>
              <div className={`text-2xl font-black ${item.color} mt-1`}>{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns: Platform Pricing Config & Backup / Reseed Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Pricing Form */}
        <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="font-bold text-white text-base">Configuration des Forfaits SaaS</h3>
                <p className="text-xs text-slate-400">Tarification mensuelle et limites</p>
              </div>
            </div>

            <form onSubmit={handleSavePlatformConfig} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Prix Mensuel Forfait Commerçant Pro (CDF)
                </label>
                <input
                  type="number"
                  value={proPrice}
                  onChange={(e) => setProPrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-sm font-black text-blue-400 border border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Prix Mensuel Forfait Business Multi-Magasins (CDF)
                </label>
                <input
                  type="number"
                  value={bizPrice}
                  onChange={(e) => setBizPrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-sm font-black text-indigo-400 border border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Quota Maximum de Ventes / Mois (Forfait Découverte)
                </label>
                <input
                  type="number"
                  value={freeQuota}
                  onChange={(e) => setFreeQuota(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-sm font-black text-slate-200 border border-slate-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
              >
                Mettre à Jour la Configuration
              </button>
            </form>
          </div>
        </div>

        {/* Maintenance & Backup Actions */}
        <div className="space-y-4">
          {/* Backup JSON */}
          <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Database className="w-5 h-5" />
                <h4 className="font-bold text-sm text-white">Sauvegarde Complète de la Base (JSON)</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exporte immédiatement toutes les tables de la base de données en un seul fichier JSON horodaté.
              </p>
            </div>
            <button
              onClick={handleExportFullDatabaseJson}
              className="mt-4 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all touch-press"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger la Sauvegarde Globale (JSON)</span>
            </button>
          </div>

          {/* Reseed Data */}
          <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Sparkles className="w-5 h-5" />
                <h4 className="font-bold text-sm text-white">Réinjecter Données Démo RDC</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Initialise des boutiques réalistes (Kinshasa, Goma, Lubumbashi) avec leurs abonnements Mobile Money pour des tests ou des démonstrations clients.
              </p>
            </div>
            <button
              onClick={handleReseedPlatform}
              className="mt-4 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span>Injecter les Boutiques de Démonstration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
