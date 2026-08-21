"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/admin-api";
import {
  LayoutDashboard,
  Store as StoreIcon,
  Users,
  CreditCard,
  Package,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Layers,
  Activity,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Database,
} from "lucide-react";

interface OverviewData {
  counts: {
    tenants: number;
    stores: number;
    users: number;
    products: number;
    sales: number;
    subscriptions: number;
    debtPayments: number;
    syncLogs: number;
  };
  financials: {
    gmvTotal: number;
    mrrTotal: number;
  };
  planStats: {
    FREE: number;
    BASIC: number;
    PRO: number;
    BUSINESS: number;
  };
  mobileMoneyStats: Record<string, { count: number; total: number }>;
  recentTenants: Array<{
    id: string;
    name: string;
    slug: string;
    phone?: string;
    plan: string;
    isActive: boolean;
    createdAt: string;
  }>;
  recentSubscriptions: Array<{
    id: string;
    tenantId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: string;
    transactionId?: string;
    createdAt: string;
    tenant?: {
      name: string;
      slug: string;
    };
  }>;
  recentSales: Array<{
    id: string;
    totalAmount: number;
    paymentMethod: string;
    receiptNumber?: string;
    createdAt: string;
    tenant?: { name: string };
    store?: { name: string };
  }>;
  serverTime: string;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatMoney = (amount: number, currency = "CDF") => {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount || 0)} ${currency}`;
  };

  const loadData = useCallback(async () => {
    try {
      const res = await adminFetch<OverviewData>("/api/v1/admin/overview");
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error || "Impossible de charger les données Supabase");
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
    const interval = setInterval(loadData, 45000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-400 font-mono">
          Connexion et extraction des données réelles Supabase...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-300 max-w-xl mx-auto my-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Erreur de chargement Supabase</h3>
        <p className="text-xs text-rose-200">{error}</p>
        <button
          onClick={handleManualRefresh}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const counts = data?.counts || {
    tenants: 0,
    stores: 0,
    users: 0,
    products: 0,
    sales: 0,
    subscriptions: 0,
    debtPayments: 0,
    syncLogs: 0,
  };

  const financials = data?.financials || { gmvTotal: 0, mrrTotal: 0 };
  const planStats = data?.planStats || { FREE: 0, BASIC: 0, PRO: 0, BUSINESS: 0 };
  const mobileMoneyStats = data?.mobileMoneyStats || {};
  const recentTenants = data?.recentTenants || [];
  const recentSubscriptions = data?.recentSubscriptions || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Données Réelles Supabase Cloud Synchronisées</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Vue d'Ensemble & Métriques Exécutives
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Indicateurs consolidés en direct de la base de données PostgreSQL de production.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
            <span>{isRefreshing ? "Actualisation..." : "Actualiser"}</span>
          </button>

          <Link
            href="/admin/subscriptions"
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all touch-press"
          >
            <CreditCard className="w-4 h-4" />
            <span>Abonnements</span>
          </Link>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Boutiques */}
        <Link
          href="/admin/tenants"
          className="bg-slate-900/90 hover:bg-slate-900 rounded-3xl p-5 border border-slate-800/80 shadow-sm flex flex-col justify-between group transition-all"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Parc Boutiques</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <StoreIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white">{counts.tenants}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {counts.stores} points de vente / dépôts dans Supabase
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between text-[10px] font-bold">
            <span className="text-blue-400">Pro: {planStats.PRO}</span>
            <span className="text-indigo-400">Biz: {planStats.BUSINESS}</span>
            <span className="text-slate-400">Gratuit: {planStats.FREE + planStats.BASIC}</span>
          </div>
        </Link>

        {/* Metric 2: MRR */}
        <Link
          href="/admin/subscriptions"
          className="bg-slate-900/90 hover:bg-slate-900 rounded-3xl p-5 border border-slate-800/80 shadow-sm flex flex-col justify-between group transition-all"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">MRR (Revenus Récurrents)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-400">{formatMoney(financials.mrrTotal)}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Revenus mensuels récurrents calculés
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/60 mt-3 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Boutiques actives :</span>
            <b className="text-emerald-400">{counts.tenants} enregistrées</b>
          </div>
        </Link>

        {/* Metric 3: GMV */}
        <Link
          href="/admin/catalog"
          className="bg-slate-900/90 hover:bg-slate-900 rounded-3xl p-5 border border-slate-800/80 shadow-sm flex flex-col justify-between group transition-all"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Volume Traité (GMV)</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white">{formatMoney(financials.gmvTotal)}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {counts.sales} ventes réelles enregistrées
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/60 mt-3 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Articles référencés :</span>
            <b className="text-indigo-400">{counts.products} articles</b>
          </div>
        </Link>

        {/* Metric 4: Utilisateurs & Système */}
        <Link
          href="/admin/users"
          className="bg-slate-900/90 hover:bg-slate-900 rounded-3xl p-5 border border-slate-800/80 shadow-sm flex flex-col justify-between group transition-all"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Utilisateurs & Caissiers</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-purple-400">
              {counts.users}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Comptes actifs sur l'ensemble du réseau
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/60 mt-3 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Journaux de synchronisation :</span>
            <span className="text-purple-300 font-bold">{counts.syncLogs} logs</span>
          </div>
        </Link>
      </div>

      {/* Mobile Money Operators Distribution */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-white text-base">
              Souscriptions & Flux par Canal de Paiement Supabase
            </h3>
            <p className="text-xs text-slate-400">
              Volume total des abonnements et encaissements enregistrés en base.
            </p>
          </div>
          <Link
            href="/admin/subscriptions"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Détail des transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: "MPESA", name: "Vodacom M-Pesa", color: "border-red-500/40 bg-red-500/10 text-red-400" },
            { key: "AIRTEL_MONEY", name: "Airtel Money", color: "border-rose-500/40 bg-rose-500/10 text-rose-400" },
            { key: "ORANGE_MONEY", name: "Orange Money", color: "border-orange-500/40 bg-orange-500/10 text-orange-400" },
            { key: "AFRIMONEY", name: "Afrimoney", color: "border-purple-500/40 bg-purple-500/10 text-purple-400" },
          ].map((op) => {
            const opData = mobileMoneyStats[op.key] || { count: 0, total: 0 };
            return (
              <div key={op.key} className={`p-4 rounded-2xl border ${op.color} flex flex-col justify-between`}>
                <div>
                  <span className="text-xs font-bold">{op.name}</span>
                  <div className="text-xl font-black text-white mt-2">{formatMoney(opData.total)}</div>
                </div>
                <span className="text-[11px] opacity-80 mt-2">{opData.count} transaction(s) enregistrée(s)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: Recent Boutiques & Recent Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Boutiques */}
        <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Boutiques Réelles Supabase</h3>
                <p className="text-xs text-slate-400">Commerces inscrits dans la base PostgreSQL</p>
              </div>
              <Link href="/admin/tenants" className="text-xs font-bold text-blue-400 hover:text-blue-300">
                Gérer les boutiques →
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentTenants.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Aucune boutique enregistrée pour le moment.
                </div>
              ) : (
                recentTenants.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-bold text-white truncate">{t.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.phone || t.slug}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          t.plan === "BUSINESS"
                            ? "bg-indigo-500/20 text-indigo-300"
                            : t.plan === "PRO"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {t.plan}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {t.isActive ? "Actif" : "Suspendu"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/admin/tenants"
            className="mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-xs font-bold text-slate-200 transition-colors"
          >
            Accéder à la Gestion des Boutiques ({counts.tenants})
          </Link>
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Derniers Paiements SaaS Réels</h3>
                <p className="text-xs text-slate-400">Transactions enregistrées dans Supabase</p>
              </div>
              <Link href="/admin/subscriptions" className="text-xs font-bold text-blue-400 hover:text-blue-300">
                Gérer les paiements →
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentSubscriptions.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Aucun paiement d'abonnement pour le moment.
                </div>
              ) : (
                recentSubscriptions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-bold text-white truncate">
                        {s.tenant?.name || "Boutique"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {s.paymentMethod} • Réf: {s.transactionId || s.id.slice(0, 8)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-emerald-400">{formatMoney(s.amount, s.currency)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/admin/subscriptions"
            className="mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-xs font-bold text-slate-200 transition-colors"
          >
            Accéder au Suivi des Abonnements ({counts.subscriptions})
          </Link>
        </div>
      </div>
    </div>
  );
}
