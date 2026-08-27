"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { adminFetch } from "@/lib/admin/admin-api";
import type { SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  Smartphone,
  Check,
  X,
  Store,
  RefreshCw,
  AlertCircle,
  Database,
} from "lucide-react";

interface SubscriptionWithTenant {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  transactionId?: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    phone?: string | null;
    plan: string;
    planStatus: string;
    planExpiresAt?: string | null;
  };
}

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithTenant[]>([]);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [mrrTotal, setMrrTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [operatorFilter, setOperatorFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");

  // Modal State for manual entry
  const [isManualSubModalOpen, setIsManualSubModalOpen] = useState(false);
  const [subTenantId, setSubTenantId] = useState("");
  const [subPlan, setSubPlan] = useState<SubscriptionPlan>("PRO");
  const [isFreeSub, setIsFreeSub] = useState(false);
  const [subMonths, setSubMonths] = useState(1);
  const [subAmount, setSubAmount] = useState(30000);
  const [subMethod, setSubMethod] = useState<PaymentMethod>("CASH");
  const [subTxId, setSubTxId] = useState("");
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
      const res = await adminFetch("/api/v1/admin/subscriptions");
      if (res.success && res.data) {
        setSubscriptions(res.data.subscriptions || []);
        setTenants(res.data.tenants || []);
        setTotalCollected(res.data.totalCollected || 0);
        setMrrTotal(res.data.mrrTotal || 0);
        setError(null);
      } else {
        setError(res.error || "Erreur lors du chargement des abonnements");
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

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchOp = operatorFilter === "ALL" || s.paymentMethod === operatorFilter;
      const matchPlan = planFilter === "ALL" || s.plan === planFilter;
      return matchOp && matchPlan;
    });
  }, [subscriptions, operatorFilter, planFilter]);

  const handleOpenManual = () => {
    if (tenants.length > 0) setSubTenantId(tenants[0].id);
    setSubPlan("PRO");
    setIsFreeSub(false);
    setSubMonths(1);
    setSubAmount(30000);
    setSubMethod("CASH");
    setSubTxId("");
    setIsManualSubModalOpen(true);
  };

  const handleManualSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTenantId) return;

    setIsSubmitting(true);
    const res = await adminFetch("/api/v1/admin/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        tenantId: subTenantId,
        plan: subPlan,
        amount: isFreeSub ? 0 : Number(subAmount) || 0,
        isFree: isFreeSub,
        paymentMethod: isFreeSub ? "CASH" : subMethod,
        transactionId: subTxId.trim() || undefined,
        durationMonths: subMonths,
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsManualSubModalOpen(false);
      showToast(res.message || "Paiement et facture d'abonnement enregistrés avec succès.");
      loadData();
    } else {
      alert(res.error || "Erreur lors de l'enregistrement du paiement");
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
            <span>Table `subscriptions` Supabase PostgreSQL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Abonnements & Paiements SaaS ({subscriptions.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Suivi des transactions Mobile Money et reconductions des abonnements des boutiques.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsRefreshing(true);
              loadData();
            }}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
          </button>

          <button
            onClick={handleOpenManual}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all touch-press"
          >
            <Plus className="w-4 h-4" />
            <span>Saisie Manuelle Paiement</span>
          </button>
        </div>
      </div>

      {/* Top 2 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Revenus Récurrents Mensuels (MRR)
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {formatMoney(mrrTotal)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Calculé sur le parc actif Supabase</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Encaissé Abonnements
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {formatMoney(totalCollected)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Cumul des {subscriptions.length} transactions enregistrées
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-400">Filtrer l'historique :</span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Operator Filter */}
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tous les Modes de Paiement</option>
            <option value="MPESA">Vodacom M-Pesa</option>
            <option value="AIRTEL_MONEY">Airtel Money</option>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="AFRIMONEY">Afrimoney</option>
            <option value="CASH">Espèces</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tous les Plans</option>
            <option value="FREE">FREE</option>
            <option value="BASIC">BASIC</option>
            <option value="PRO">PRO</option>
            <option value="BUSINESS">BUSINESS</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">Chargement des abonnements depuis Supabase...</p>
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

      {/* Subscriptions Table */}
      {!isLoading && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-3.5">Boutique</th>
                  <th className="px-4 py-3.5">Forfait</th>
                  <th className="px-4 py-3.5">Montant Encaissé</th>
                  <th className="px-4 py-3.5">Canal & Référence</th>
                  <th className="px-4 py-3.5">Période Couverte</th>
                  <th className="px-4 py-3.5 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Aucune transaction d'abonnement trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">
                          {s.tenant?.name || "Boutique"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {s.tenantId}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${
                            s.plan === "BUSINESS"
                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              : s.plan === "PRO"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {s.plan}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {formatMoney(s.amount, s.currency)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-200">{s.paymentMethod}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Réf: {s.transactionId || s.id.slice(0, 8)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-[11px] text-slate-300">
                          Du {new Date(s.periodStart).toLocaleDateString("fr-FR")} au{" "}
                          {new Date(s.periodEnd).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Enregistré le {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {s.paymentStatus === "ACTIVE" ? "Validé" : s.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Manual Subscription Entry */}
      {isManualSubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Enregistrer un Paiement SaaS & Facture</h3>
                <p className="text-xs text-slate-400">Attribution manuelle hors PawaPay</p>
              </div>
              <button
                onClick={() => setIsManualSubModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Boutique Bénéficiaire *</label>
                <select
                  required
                  value={subTenantId}
                  onChange={(e) => setSubTenantId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.plan})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payant vs Gratuit */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFreeSub(false);
                    setSubAmount(30000 * subMonths);
                  }}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                    !isFreeSub
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-slate-800/60 border-slate-700 text-slate-400"
                  }`}
                >
                  Payant (Perçu)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFreeSub(true);
                    setSubAmount(0);
                  }}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                    isFreeSub
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-slate-800/60 border-slate-700 text-slate-400"
                  }`}
                >
                  Offert / Gratuit
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Plan</label>
                  <select
                    value={subPlan}
                    onChange={(e) => {
                      const p = e.target.value as SubscriptionPlan;
                      setSubPlan(p);
                      if (!isFreeSub) {
                        const unit = p === "BUSINESS" ? 100000 : p === "PRO" ? 30000 : 15000;
                        setSubAmount(unit * subMonths);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="BASIC">BASIC</option>
                    <option value="PRO">PRO</option>
                    <option value="BUSINESS">BUSINESS</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Durée (Mois)</label>
                  <select
                    value={subMonths}
                    onChange={(e) => {
                      const m = Number(e.target.value) || 1;
                      setSubMonths(m);
                      if (!isFreeSub) {
                        const unit = subPlan === "BUSINESS" ? 100000 : subPlan === "PRO" ? 30000 : 15000;
                        setSubAmount(unit * m);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>1 mois (30j)</option>
                    <option value={2}>2 mois (60j)</option>
                    <option value={3}>3 mois (1 trimestre)</option>
                    <option value={6}>6 mois (Semestre)</option>
                    <option value={12}>12 mois (1 an)</option>
                  </select>
                </div>
              </div>

              {!isFreeSub && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Montant Perçu (CDF)</label>
                    <input
                      type="number"
                      required
                      value={subAmount}
                      onChange={(e) => setSubAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Mode de Règlement</label>
                    <select
                      value={subMethod}
                      onChange={(e) => setSubMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="CASH">Espèces / Cash Direct</option>
                      <option value="MPESA">Vodacom M-Pesa Direct</option>
                      <option value="AIRTEL_MONEY">Airtel Money Direct</option>
                      <option value="ORANGE_MONEY">Orange Money Direct</option>
                      <option value="AFRIMONEY">Afrimoney</option>
                      <option value="WAVE">Wave Direct</option>
                      <option value="CARD">Virement / Carte</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Référence Reçu / Transaction (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Laisser vide pour générer FAC-SUB-..."
                  value={subTxId}
                  onChange={(e) => setSubTxId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg flex items-center gap-2"
                >
                  {isSubmitting ? "Enregistrement..." : "Valider & Générer Facture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
