"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_STORE_ID } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import { useAuth } from "@/lib/auth/auth-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { UpgradePromptModal } from "@/components/plans/upgrade-prompt-modal";
import ExportReportModal from "@/components/reports/export-report-modal";
import {
  TrendingUp,
  CreditCard,
  BookOpen,
  DollarSign,
  ShoppingCart,
  Package,
  ArrowUpRight,
  AlertTriangle,
  Receipt,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  FileSpreadsheet,
  Building,
} from "lucide-react";

export default function DashboardPage() {
  const { user, tenant, store: authStore, stores, isAuthenticated, isLoading, plan, canAccess } = useAuth();
  const { formatMoney } = useSync();

  const currentStoreId = authStore?.id || DEFAULT_STORE_ID;
  const currentTenantId = tenant?.id;

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const sales = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.sales
      .filter((s) => s.storeId === currentStoreId)
      .reverse()
      .sortBy("createdAt");
  }, [currentStoreId]) || [];

  const allTenantSales = useLiveQuery(async () => {
    if (!currentTenantId) return [];
    return await db.sales
      .filter((s) => s.tenantId === currentTenantId || !s.tenantId)
      .toArray();
  }, [currentTenantId]) || [];

  const saleItems = useLiveQuery(() => db.saleItems.toArray()) || [];

  const products = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.products
      .filter((p) => p.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  const customers = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.customers
      .filter((c) => c.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen title="Tableau de Bord Verrouillé" />;
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const todayCashCollected = todaySales.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalCustomerDebt = customers.reduce((acc, c) => acc + (c.currentDebtBalance > 0 ? c.currentDebtBalance : 0), 0);

  const estimatedGrossProfit = (() => {
    const todaySaleIds = new Set(todaySales.map((s) => s.id));
    const relevantItems = saleItems.filter((it) => todaySaleIds.has(it.saleId));
    return relevantItems.reduce((acc, it) => {
      const marginPerItem = it.unitPrice - (it.costPrice || it.unitPrice * 0.8);
      return acc + marginPerItem * it.quantity;
    }, 0);
  })();

  const paymentBreakdown = (() => {
    const counts: Record<string, number> = {
      CASH: 0,
      MPESA: 0,
      AIRTEL_MONEY: 0,
      ORANGE_MONEY: 0,
      AFRIMONEY: 0,
      WAVE: 0,
      MTN_MOMO: 0,
      MOOV_MONEY: 0,
      CREDIT: 0,
    };
    todaySales.forEach((s) => {
      counts[s.paymentMethod] = (counts[s.paymentMethod] || 0) + s.amountPaid;
    });
    return counts;
  })();

  const lowStockItems = products.filter((p) => p.stockQuantity <= p.minStockAlert).slice(0, 5);

  const canViewMargins = canAccess("canViewGrossProfitMargins");

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Tableau de Bord & Bénéfices
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Boutique : <b className="text-slate-800">{authStore?.name || tenant?.name}</b>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canAccess("canExportReports") && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="py-2.5 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-2 border border-indigo-200 transition-all touch-press"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Comptable</span>
            </button>
          )}

          <Link
            href="/pos"
            className="py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all touch-press"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Ouvrir la Caisse</span>
          </Link>
        </div>
      </div>

      {/* Business Multi-Store Aggregate Radar (Shown when multi-stores exist) */}
      {plan === "BUSINESS" && stores.length > 1 && (
        <div className="bg-indigo-950 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-indigo-900">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" />
              <h3 className="font-extrabold text-sm sm:text-base">Consolidation Réseau Multi-Boutiques ({stores.length} Magasins)</h3>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
              Business Exclusive
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {stores.map((s) => {
              const storeSales = allTenantSales.filter((sal) => sal.storeId === s.id && sal.createdAt.startsWith(todayStr));
              const rev = storeSales.reduce((acc, it) => acc + it.totalAmount, 0);
              return (
                <div key={s.id} className="bg-white/10 p-3 rounded-2xl border border-white/10">
                  <div className="text-slate-300 font-medium truncate">{s.name}</div>
                  <div className="text-base sm:text-lg font-black text-white mt-1">{formatMoney(rev)}</div>
                  <div className="text-[10px] text-indigo-300">{storeSales.length} ventes aujourd'hui</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Chiffre d'Affaires (Jour)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatMoney(todayRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {todaySales.length} vente{todaySales.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Gross Profit Margin Card (Locked on Free plan) */}
        <div
          onClick={() => !canViewMargins && setIsUpgradeModalOpen(true)}
          className={`bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between relative transition-all ${
            !canViewMargins ? "cursor-pointer hover:border-blue-300 hover:shadow-md" : ""
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Marge Brute Estimée
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          {canViewMargins ? (
            <>
              <div className="text-xl sm:text-2xl font-black text-indigo-600">
                +{formatMoney(estimatedGrossProfit)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Bénéfice net estimé</p>
            </>
          ) : (
            <div className="py-1">
              <div className="text-lg font-black text-slate-400 blur-sm select-none">
                +125 000 FC
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 mt-1">
                <Lock className="w-3 h-3" />
                <span>Débloquer avec Pro</span>
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Encaissé en Caisse
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-600">
            {formatMoney(todayCashCollected)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cash & Mobile Money</p>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-rose-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Créances Clients (Dettes)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            {formatMoney(totalCustomerDebt)}
          </div>
          <Link
            href="/debts"
            className="text-[11px] text-rose-600 font-bold hover:underline flex items-center gap-1 mt-1"
          >
            <span>Gérer les relances</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Grid Middle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Répartition des Paiements (Jour)</span>
          </h3>

          <div className="space-y-2 flex-1 justify-center flex flex-col">
            {[
              { label: "Espèces (Cash)", amount: paymentBreakdown.CASH, color: "bg-blue-600" },
              { label: "M-Pesa (Vodacom)", amount: paymentBreakdown.MPESA, color: "bg-red-600" },
              { label: "Airtel Money", amount: paymentBreakdown.AIRTEL_MONEY, color: "bg-rose-600" },
              { label: "Orange Money", amount: paymentBreakdown.ORANGE_MONEY, color: "bg-orange-500" },
              { label: "Afrimoney", amount: paymentBreakdown.AFRIMONEY, color: "bg-purple-600" },
            ].map((m) => {
              const pct = todayCashCollected > 0 ? Math.round((m.amount / todayCashCollected) * 100) : 0;
              return (
                <div key={m.label} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">{m.label}</span>
                    <span className="text-slate-900 font-bold">{formatMoney(m.amount)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Articles à Réapprovisionner</span>
            </h3>
            <Link
              href="/inventory"
              className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>Voir tout</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-2">
            {lowStockItems.length === 0 ? (
              <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-slate-400 text-center">
                <CheckCircle2 className="w-8 h-8 text-blue-500 mb-1" />
                <p className="text-xs font-medium text-slate-700">Stock optimal</p>
                <p className="text-[11px]">Aucun article sous le seuil d'alerte</p>
              </div>
            ) : (
              lowStockItems.map((p) => (
                <div
                  key={p.id}
                  className="bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-xs text-slate-800 truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{formatMoney(p.unitPrice)}</div>
                  </div>
                  <span className="text-xs font-black text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-lg whitespace-nowrap">
                    Reste : {p.stockQuantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-5 text-white shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Kuettu SMART POS • Offline-First
            </span>
            <h4 className="text-lg font-black mt-1">Données Isolées & Sauvegardées</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Toutes les opérations de votre boutique sont cloisonnées et synchronisées avec le Cloud dès que votre connexion est active.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
            <Link
              href="/owner"
              className="text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 px-3.5 py-2 rounded-xl transition-all"
            >
              Supervision Gérant →
            </Link>
          </div>
        </div>
      </div>

      {/* Sales History */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>Dernières Ventes</span>
          </h3>
          <span className="text-xs text-slate-500">{sales.length} ventes</span>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <ShoppingCart className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Aucune vente enregistrée pour l'instant</p>
            <p className="text-xs text-slate-400 mt-0.5">Accédez à la caisse pour réaliser votre première vente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-2 font-semibold">N° Reçu</th>
                  <th className="pb-2 font-semibold">Date & Heure</th>
                  <th className="pb-2 font-semibold">Mode de Paiement</th>
                  <th className="pb-2 font-semibold text-right">Total</th>
                  <th className="pb-2 font-semibold text-right">Payé</th>
                  <th className="pb-2 font-semibold text-right">Dette</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono font-bold text-slate-800">
                      {s.receiptNumber || s.id.slice(0, 8)}
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(s.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-900 text-right">
                      {formatMoney(s.totalAmount)}
                    </td>
                    <td className="py-3 text-blue-600 font-semibold text-right">
                      {formatMoney(s.amountPaid)}
                    </td>
                    <td className="py-3 text-right">
                      {s.debtAmount > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatMoney(s.debtAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPGRADE PROMPT MODAL */}
      <UpgradePromptModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Calcul Automatique des Marges & Bénéfices"
        description="Le calcul en temps réel de votre bénéfice net et des marges réalisées sur chaque article est réservé au forfait Commerçant Pro."
        targetPlan="PRO"
        features={[
          "Calcul automatique de la marge brute et nette",
          "Suivi des bénéfices réalisés par jour, semaine et mois",
          "Supervision gérant sur smartphone à distance",
          "Ventes et caisse illimitées",
        ]}
      />

      {/* EXPORT REPORT MODAL */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
