"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, generateUUID } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import type { Subscription, Tenant, SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";
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
  FileSpreadsheet,
} from "lucide-react";

export default function AdminSubscriptionsPage() {
  const { formatMoney } = useSync();

  const subscriptions = useLiveQuery(() => db.subscriptions.toArray()) || [];
  const tenants = useLiveQuery(() => db.tenants.toArray()) || [];

  // Search & Filters
  const [operatorFilter, setOperatorFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");

  // Modal State for manual entry
  const [isManualSubModalOpen, setIsManualSubModalOpen] = useState(false);
  const [subTenantId, setSubTenantId] = useState("");
  const [subPlan, setSubPlan] = useState<SubscriptionPlan>("PRO");
  const [subAmount, setSubAmount] = useState(15000);
  const [subMethod, setSubMethod] = useState<PaymentMethod>("MPESA");
  const [subTxId, setSubTxId] = useState("");

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // KPIs
  const mrrTotal = useMemo(() => {
    return tenants.reduce((acc, t) => {
      if (!t.isActive) return acc;
      if (t.plan === "PRO") return acc + 15000;
      if (t.plan === "BUSINESS") return acc + 45000;
      return acc;
    }, 0);
  }, [tenants]);

  const totalCollected = useMemo(() => {
    return subscriptions.reduce((acc, s) => acc + (s.amount || 0), 0);
  }, [subscriptions]);

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
    setSubAmount(15000);
    setSubMethod("MPESA");
    setSubTxId("");
    setIsManualSubModalOpen(true);
  };

  const handleManualSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTenantId) return;

    const targetTenant = tenants.find((t) => t.id === subTenantId);
    if (!targetTenant) return;

    const now = new Date();
    const subId = generateUUID();
    const newSub: Subscription = {
      id: subId,
      tenantId: subTenantId,
      plan: subPlan,
      amount: subAmount,
      currency: "CDF",
      paymentMethod: subMethod,
      paymentStatus: "ACTIVE",
      transactionId: subTxId.trim() || `MANUAL-${Date.now().toString().slice(-6)}`,
      periodStart: now.toISOString(),
      periodEnd: new Date(now.getTime() + 30 * 86400000).toISOString(),
      createdAt: now.toISOString(),
    };

    await db.subscriptions.add(newSub);
    await db.tenants.update(subTenantId, {
      plan: subPlan,
      planStatus: "ACTIVE",
      planExpiresAt: newSub.periodEnd,
      updatedAt: now.toISOString(),
    });

    setIsManualSubModalOpen(false);
    showToast(`Règlement de ${formatMoney(subAmount)} validé pour "${targetTenant.name}" !`);
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
            <CreditCard className="w-3.5 h-3.5" />
            <span>Suivi des Paiements & Abonnements SaaS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Paiements Récurrents & Mobile Money ({subscriptions.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enregistrement, historique et validation des encaissements d'abonnements des boutiques.
          </p>
        </div>

        <button
          onClick={handleOpenManual}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all touch-press"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer un Règlement</span>
        </button>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              MRR Plateforme
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {formatMoney(mrrTotal)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Revenus mensuels récurrents</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Encaissé
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {formatMoney(totalCollected)}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Volume global d'abonnements</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Transactions Enregistrées
            </span>
            <div className="text-2xl font-black text-indigo-400 mt-1">
              {subscriptions.length}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Règlements archivés en base</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800 flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-300">Filtrer les transactions :</span>
        <div className="flex items-center gap-2">
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="p-2 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
          >
            <option value="ALL">Tous les opérateurs</option>
            <option value="MPESA">Vodacom M-Pesa</option>
            <option value="AIRTEL_MONEY">Airtel Money</option>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="AFRIMONEY">Afrimoney</option>
            <option value="CASH">Espèces / Bureau</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="p-2 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
          >
            <option value="ALL">Tous les forfaits</option>
            <option value="FREE">Découverte (Gratuit)</option>
            <option value="PRO">Commerçant Pro</option>
            <option value="BUSINESS">Business Réseau</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm overflow-hidden">
        {filteredSubscriptions.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <CreditCard className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-bold text-slate-400">Aucune transaction trouvée</p>
            <p className="text-xs mt-0.5">Enregistrez un nouveau règlement de souscription.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Réf Transaction</th>
                  <th className="pb-3">Boutique Souscriptrice</th>
                  <th className="pb-3">Forfait</th>
                  <th className="pb-3">Opérateur</th>
                  <th className="pb-3">Montant Encaissé</th>
                  <th className="pb-3">Période Couverte</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredSubscriptions.map((s) => {
                  const boutique = tenants.find((t) => t.id === s.tenantId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 font-mono font-bold text-white">
                        {s.transactionId || s.id.slice(0, 10)}
                      </td>

                      <td className="py-4 font-bold text-slate-200">
                        {boutique ? (
                          <div className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>{boutique.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Boutique inconnue</span>
                        )}
                      </td>

                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            s.plan === "BUSINESS"
                              ? "bg-indigo-500/20 text-indigo-300"
                              : s.plan === "PRO"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {s.plan}
                        </span>
                      </td>

                      <td className="py-4">
                        <span className="font-bold text-slate-300">{s.paymentMethod}</span>
                      </td>

                      <td className="py-4 font-black text-emerald-400">
                        {formatMoney(s.amount)}
                      </td>

                      <td className="py-4 font-mono text-slate-400">
                        {new Date(s.periodStart).toLocaleDateString("fr-FR")} →{" "}
                        {new Date(s.periodEnd).toLocaleDateString("fr-FR")}
                      </td>

                      <td className="py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          ✓ {s.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Manual Subscription Entry */}
      {isManualSubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleManualSubSubmit}
            className="bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-800 text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Valider un Règlement d'Abonnement</h3>
              <button
                type="button"
                onClick={() => setIsManualSubModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Boutique souscriptrice *
              </label>
              <select
                value={subTenantId}
                onChange={(e) => setSubTenantId(e.target.value)}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    🏬 {t.name} (Forfait actuel: {t.plan})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Forfait Validé
                </label>
                <select
                  value={subPlan}
                  onChange={(e) => {
                    const p = e.target.value as SubscriptionPlan;
                    setSubPlan(p);
                    setSubAmount(p === "BUSINESS" ? 45000 : 15000);
                  }}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
                >
                  <option value="PRO">Commerçant Pro</option>
                  <option value="BUSINESS">Business Réseau</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Moyen de Paiement
                </label>
                <select
                  value={subMethod}
                  onChange={(e) => setSubMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
                >
                  <option value="MPESA">M-Pesa</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="AFRIMONEY">Afrimoney</option>
                  <option value="CASH">Espèces / Bureau</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Montant Encaissé (CDF) *
              </label>
              <input
                type="number"
                required
                value={subAmount}
                onChange={(e) => setSubAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-sm font-black text-emerald-400 border border-slate-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Référence Transaction / ID Mobile Money (optionnel)
              </label>
              <input
                type="text"
                placeholder="ex: MPESA-TX-984312"
                value={subTxId}
                onChange={(e) => setSubTxId(e.target.value)}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-xs border border-slate-700 text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
            >
              Enregistrer et Débloquer la Boutique (+30 jours)
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
