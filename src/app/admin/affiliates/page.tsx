"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/lib/admin/admin-api";
import {
  Gift,
  Users,
  Award,
  Crown,
  TrendingUp,
  DollarSign,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function AdminAffiliatesPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");

  const loadAffiliateData = useCallback(async () => {
    try {
      const res = await adminFetch("/api/v1/admin/affiliates");
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("[Admin Affiliates Page] Error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAffiliateData();
  }, [loadAffiliateData]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Chargement du réseau d&apos;affiliés GlobalPOS...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalAffiliates: 0,
    totalReferrals: 0,
    activeReferrals: 0,
    conversionRate: 0,
    totalFreeMonthsGranted: 0,
    totalCashPaidOut: 0,
  };

  const affiliatesList = (data?.affiliates || []).filter((a: any) => {
    const matchesSearch =
      a.referralCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tenant?.phone?.includes(searchTerm);
    const matchesTier = tierFilter === "ALL" || a.currentTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-black text-white">Programme d&apos;Affiliation & Gamification</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervision du réseau de parrainage multi-niveaux, conversion des filleuls et attribution des mois offerts
          </p>
        </div>

        <button
          onClick={() => {
            setIsRefreshing(true);
            loadAffiliateData();
          }}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Partenaires Affiliés</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats.totalAffiliates}</div>
          <span className="text-[11px] text-slate-500 font-mono">Commerces avec code actif</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Filleuls Actifs (Payants)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {stats.activeReferrals}{" "}
            <span className="text-xs text-slate-400 font-normal">/ {stats.totalReferrals} ({stats.conversionRate}%)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Taux de conversion global</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Mois Gratuits Attribués</span>
            <Gift className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{stats.totalFreeMonthsGranted} mois</div>
          <span className="text-[11px] text-slate-500 font-mono">Prolongations SaaS distribuées</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Commissions Platine VIP</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-400">{stats.totalCashPaidOut.toLocaleString("fr-FR")} USD</div>
          <span className="text-[11px] text-slate-500 font-mono">15% Payouts PawaPay</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par commerce ou code (ex: GP-89X)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "BRONZE", "SILVER", "GOLD", "PLATINUM"].map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tierFilter === tier
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tier === "ALL" ? "Tous les Paliers" : tier}
            </button>
          ))}
        </div>
      </div>

      {/* Affiliates List Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] bg-slate-950/60">
                <th className="py-3.5 px-4">Parrain / Commerce</th>
                <th className="py-3.5 px-4">Code Partenaire</th>
                <th className="py-3.5 px-4">Palier Actuel</th>
                <th className="py-3.5 px-4">Filleuls (Actifs / Total)</th>
                <th className="py-3.5 px-4">Mois Gagnés</th>
                <th className="py-3.5 px-4">Date de Création</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {affiliatesList.map((aff: any) => {
                const activeRefs = aff.referrals.filter((r: any) => r.status === "ACTIVE").length;
                return (
                  <tr key={aff.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{aff.tenant?.name || "Boutique"}</div>
                      <span className="text-[10px] text-slate-400">{aff.tenant?.phone || "Sans téléphone"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300">
                        {aff.referralCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          aff.currentTier === "PLATINUM"
                            ? "bg-purple-900/60 text-purple-300 border border-purple-500/40"
                            : aff.currentTier === "GOLD"
                            ? "bg-amber-900/60 text-amber-300 border border-amber-500/40"
                            : aff.currentTier === "SILVER"
                            ? "bg-slate-800 text-slate-300 border border-slate-600"
                            : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                        }`}
                      >
                        {aff.currentTier}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-400">{activeRefs}</span>
                      <span className="text-slate-500"> / {aff.referrals.length}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-amber-300">+{aff.freeMonthsEarned}</span> mois
                      <span className="text-[10px] text-slate-500 block">({aff.freeMonthsUsed} utilisés)</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(aff.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                );
              })}

              {affiliatesList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    Aucun affilié trouvé avec ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
