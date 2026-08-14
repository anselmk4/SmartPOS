"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
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
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export default function AdminOverviewPage() {
  const { formatMoney } = useSync();

  // Reactive Dexie database queries
  const tenants = useLiveQuery(() => db.tenants.toArray()) || [];
  const stores = useLiveQuery(() => db.stores.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const subscriptions = useLiveQuery(() => db.subscriptions.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const syncQueue = useLiveQuery(() => db.syncQueue.toArray()) || [];

  // KPI Computations directly from active database
  const gmvTotal = useMemo(() => {
    return sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  }, [sales]);

  const mrrTotal = useMemo(() => {
    return tenants.reduce((acc, t) => {
      if (!t.isActive) return acc;
      if (t.plan === "PRO") return acc + 15000;
      if (t.plan === "BUSINESS") return acc + 45000;
      return acc;
    }, 0);
  }, [tenants]);

  const planStats = useMemo(() => {
    const free = tenants.filter((t) => t.plan === "FREE").length;
    const pro = tenants.filter((t) => t.plan === "PRO").length;
    const biz = tenants.filter((t) => t.plan === "BUSINESS").length;
    return { free, pro, biz };
  }, [tenants]);

  const mobileMoneyStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {
      MPESA: { count: 0, total: 0 },
      AIRTEL_MONEY: { count: 0, total: 0 },
      ORANGE_MONEY: { count: 0, total: 0 },
      AFRIMONEY: { count: 0, total: 0 },
    };

    subscriptions.forEach((s) => {
      if (stats[s.paymentMethod]) {
        stats[s.paymentMethod].count += 1;
        stats[s.paymentMethod].total += s.amount || 0;
      }
    });

    return stats;
  }, [subscriptions]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Node RDC • Base de données en temps réel</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Vue d'Ensemble & Métriques Exécutives
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Indicateurs consolidés provenant directement de la base de données locale & Cloud.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/subscriptions"
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all touch-press"
          >
            <CreditCard className="w-4 h-4" />
            <span>Gérer les Abonnements</span>
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
            <div className="text-3xl font-black text-white">{tenants.length}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stores.length} points de vente / dépôts connectés
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between text-[10px] font-bold">
            <span className="text-blue-400">Pro: {planStats.pro}</span>
            <span className="text-indigo-400">Biz: {planStats.biz}</span>
            <span className="text-slate-400">Gratuit: {planStats.free}</span>
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
            <div className="text-3xl font-black text-emerald-400">{formatMoney(mrrTotal)}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Revenus mensuels estimés en RDC
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/60 mt-3 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Abonnements payants :</span>
            <b className="text-emerald-400">{planStats.pro + planStats.biz} actifs</b>
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
            <div className="text-3xl font-black text-white">{formatMoney(gmvTotal)}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              {sales.length} ventes traitées sur les caisses
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/60 mt-3 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Articles référencés :</span>
            <b className="text-indigo-400">{products.length} articles</b>
          </div>
        </Link>

        {/* Metric 4: Sync & Node */}
        <Link
          href="/admin/settings"
          className="bg-slate-900/90 hover:bg-slate-900 rounded-3xl p-5 border border-slate-800/80 shadow-sm flex flex-col justify-between group transition-all"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Sync & Cloud Node</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-purple-400">
              {syncQueue.length === 0 ? "100%" : `${syncQueue.length} pending`}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              File d'attente globale Dexie
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/60 mt-3 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Architecture :</span>
            <span className="text-purple-300 font-bold">Offline-First RDC</span>
          </div>
        </Link>
      </div>

      {/* Mobile Money Operators Distribution */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-black text-white text-base">
              Souscriptions par Opérateur Mobile Money RDC
            </h3>
            <p className="text-xs text-slate-400">
              Volume des abonnements SaaS encaissés par canal de paiement.
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
            const data = mobileMoneyStats[op.key] || { count: 0, total: 0 };
            return (
              <div key={op.key} className={`p-4 rounded-2xl border ${op.color} flex flex-col justify-between`}>
                <div>
                  <span className="text-xs font-bold">{op.name}</span>
                  <div className="text-xl font-black text-white mt-2">{formatMoney(data.total)}</div>
                </div>
                <span className="text-[11px] opacity-80 mt-2">{data.count} transaction(s) enregistrée(s)</span>
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
                <h3 className="font-bold text-white text-base">Boutiques Récemment Créées</h3>
                <p className="text-xs text-slate-400">Commerces inscrits dans la base</p>
              </div>
              <Link href="/admin/tenants" className="text-xs font-bold text-blue-400 hover:text-blue-300">
                Gérer les boutiques →
              </Link>
            </div>

            <div className="space-y-2.5">
              {tenants.slice(0, 4).map((t) => (
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
              ))}
            </div>
          </div>

          <Link
            href="/admin/tenants"
            className="mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-xs font-bold text-slate-200 transition-colors"
          >
            Accéder à la Gestion des Boutiques ({tenants.length})
          </Link>
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Derniers Paiements SaaS</h3>
                <p className="text-xs text-slate-400">Transactions enregistrées en base</p>
              </div>
              <Link href="/admin/subscriptions" className="text-xs font-bold text-blue-400 hover:text-blue-300">
                Gérer les paiements →
              </Link>
            </div>

            <div className="space-y-2.5">
              {subscriptions.slice(0, 4).map((s) => {
                const boutique = tenants.find((t) => t.id === s.tenantId);
                return (
                  <div
                    key={s.id}
                    className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-bold text-white truncate">
                        {boutique?.name || "Boutique"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {s.paymentMethod} • Réf: {s.transactionId || s.id.slice(0, 8)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-emerald-400">{formatMoney(s.amount)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/admin/subscriptions"
            className="mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-xs font-bold text-slate-200 transition-colors"
          >
            Accéder au Suivi des Abonnements ({subscriptions.length})
          </Link>
        </div>
      </div>
    </div>
  );
}
