"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import type { AffiliateDashboardData, AffiliateTier, RewardType } from "@/lib/types/affiliate";
import { AFFILIATE_TIERS } from "@/lib/types/affiliate";
import {
  Sparkles,
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Award,
  Calendar,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  ExternalLink,
  ChevronRight,
  MessageCircle,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Crown,
  RefreshCw,
} from "lucide-react";

export default function AffiliatePage() {
  const { tenant, user, isOwner, isManager } = useAuth();
  const { rawCurrency } = useSync();

  const [dashboardData, setDashboardData] = useState<AffiliateDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [claimLoadingId, setClaimLoadingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedTierDetail, setSelectedTierDetail] = useState<AffiliateTier | null>(null);

  const fetchAffiliateData = useCallback(async () => {
    try {
      if (!tenant?.id) return;
      const res = await fetch(`/api/v1/affiliate?tenantId=${tenant.id}&userId=${user?.id || ""}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDashboardData(json.data);
      }
    } catch (err) {
      console.error("[Affiliate Page] Error fetching data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tenant?.id, user?.id]);

  useEffect(() => {
    fetchAffiliateData();
  }, [fetchAffiliateData]);

  const handleCopy = (text: string, type: "link" | "code") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const handleShareWhatsApp = (url: string, code: string) => {
    const text = `Salut ! Rejoins GlobalPOS pour gérer facilement ton commerce et tes stocks : ${url} (Utilise mon code de parrainage: ${code} pour obtenir 15 jours offerts !)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleClaimReward = async (rewardId?: string) => {
    if (!tenant?.id || !dashboardData?.profile.id) return;

    try {
      setClaimLoadingId(rewardId || "generic");
      setActionFeedback(null);

      const res = await fetch("/api/v1/affiliate/claim-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: dashboardData.profile.id,
          tenantId: tenant.id,
          rewardId,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setActionFeedback({ message: json.message, type: "success" });
        await fetchAffiliateData();
      } else {
        setActionFeedback({ message: json.error || "Impossible d'appliquer le mois gratuit.", type: "error" });
      }
    } catch (err: any) {
      setActionFeedback({ message: err.message || "Erreur de connexion.", type: "error" });
    } finally {
      setClaimLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold">Chargement de votre Espace Partenaire & Récompenses...</p>
      </div>
    );
  }

  const profile = dashboardData?.profile;
  const currentTier = profile?.currentTier || "BRONZE";
  const tierConfig = AFFILIATE_TIERS[currentTier];
  const nextTier = profile?.nextTier;
  const activeCount = profile?.activeReferralsCount || 0;
  const neededForNext = profile?.neededForNextTier || 0;
  const progressPercent = profile?.tierProgressPercent || 0;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Programme Partenaire & Affiliation Gamifié</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Parrainez des Commerces, Débloquez des <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">Mois Gratuits</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Invitez d&apos;autres commerçants à utiliser <b>GlobalPOS</b>. Chaque abonnement actif vous fait progresser vers l&apos;autofinancement total de votre logiciel et des commissions Mobile Money !
            </p>
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchAffiliateData();
            }}
            disabled={isRefreshing}
            className="self-start md:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition-all backdrop-blur-md shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Shareable Link & Code Box */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Referral Link */}
          <div className="lg:col-span-8 bg-black/40 border border-white/15 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 backdrop-blur-md">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Votre Lien d&apos;Affiliation Unique
              </span>
              <p className="font-mono text-xs sm:text-sm text-blue-200 truncate select-all">
                {profile?.referralUrl || `https://globalpos.africa/auth/register?ref=${profile?.referralCode}`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() =>
                  handleCopy(
                    profile?.referralUrl || `https://globalpos.africa/auth/register?ref=${profile?.referralCode}`,
                    "link"
                  )
                }
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copié !" : "Copier"}</span>
              </button>

              <button
                onClick={() =>
                  handleShareWhatsApp(
                    profile?.referralUrl || `https://globalpos.africa/auth/register?ref=${profile?.referralCode}`,
                    profile?.referralCode || "GP"
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
                title="Partager sur WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Referral Code Badge */}
          <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Code Partenaire
              </span>
              <span className="font-mono text-base font-black text-amber-300 tracking-wider">
                {profile?.referralCode || "GP-XXXX"}
              </span>
            </div>

            <button
              onClick={() => handleCopy(profile?.referralCode || "", "code")}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all"
              title="Copier le code seul"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-lg animate-in slide-in-from-top-2 duration-200 ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 2. Gamified Hero Stats & Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Filleuls Actifs */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filleuls Actifs</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{activeCount}</div>
            <span className="text-[11px] text-slate-500 font-medium">
              Sur {profile?.totalReferralsCount || 0} inscriptions enregistrées
            </span>
          </div>
        </div>

        {/* Metric 2: Palier Actuel */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Niveau Atteint</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>{tierConfig.displayName}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierConfig.badgeColor}`}>
                Tier {currentTier === "BRONZE" ? "1" : currentTier === "SILVER" ? "2" : currentTier === "GOLD" ? "3" : "4"}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {tierConfig.freeMonthsDescription}
            </span>
          </div>
        </div>

        {/* Metric 3: Mois Gratuits Gagnés */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mois Gratuits</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">
              {profile?.freeMonthsEarned || 0}{" "}
              <span className="text-sm font-semibold text-slate-500">mois</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold">
              {profile?.freeMonthsAvailable ? `${profile.freeMonthsAvailable} disponible(s) à activer` : "Tous appliqués sur votre compte"}
            </span>
          </div>
        </div>

        {/* Metric 4: Commissions Cash / Payouts */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commissions Cash</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">
              {profile?.totalCashEarned?.toLocaleString("fr-FR") || 0}{" "}
              <span className="text-sm font-semibold text-slate-500">{rawCurrency || "USD"}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {currentTier === "PLATINUM" ? "15% PawaPay actif" : "Débloqué au Palier Platine VIP"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Progress Card towards next Tier */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Progression du Palier
              </span>
              <h2 className="text-xl sm:text-2xl font-black">
                {nextTier ? (
                  <>
                    Plus que <span className="text-amber-300 font-black">{neededForNext} filleul{neededForNext > 1 ? "s" : ""} actif{neededForNext > 1 ? "s" : ""}</span> pour passer à l&apos;Étage {nextTier.displayName} !
                  </>
                ) : (
                  <>Félicitations ! Vous avez atteint le niveau maximum <span className="text-amber-300">Platine VIP</span> 💎</>
                )}
              </h2>
            </div>

            {nextTier && (
              <div className="px-3.5 py-1.5 rounded-2xl bg-white/10 border border-white/20 text-xs font-bold text-white self-start sm:self-center">
                Prochain Bonus : {nextTier.freeMonthsDescription}
              </div>
            )}
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-black/30 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 shadow-lg transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] font-bold text-blue-100 px-1">
              <span>Niveau {tierConfig.displayName} ({activeCount} actifs)</span>
              <span>{progressPercent}% complété</span>
              {nextTier && <span>Objectif {nextTier.displayName} ({nextTier.minActiveReferrals} actifs)</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tier Cards Comparison (Bronze, Argent, Or, Platine) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Les 4 Paliers de Gamification</h3>
            <p className="text-xs text-slate-500">Débloquez des avantages croissants selon vos performances de parrainage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {(dashboardData?.tiers || Object.values(AFFILIATE_TIERS)).map((tier) => {
            const isCurrent = tier.tierName === currentTier;
            const isUnlocked = activeCount >= tier.minActiveReferrals;

            return (
              <div
                key={tier.tierName}
                className={`rounded-3xl p-5 sm:p-6 border transition-all flex flex-col justify-between relative overflow-hidden ${
                  isCurrent
                    ? "bg-white border-blue-500 ring-2 ring-blue-500/30 shadow-xl"
                    : isUnlocked
                    ? "bg-white border-slate-200 shadow-xs"
                    : "bg-slate-50/80 border-slate-200/60 opacity-80"
                }`}
              >
                {/* Header Tag */}
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-2xl">
                    Votre Niveau Actuel
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md bg-gradient-to-br ${tier.gradient} text-white`}
                    >
                      {tier.tierName === "BRONZE"
                        ? "🥉"
                        : tier.tierName === "SILVER"
                        ? "🥈"
                        : tier.tierName === "GOLD"
                        ? "🥇"
                        : "💎"}
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-base">{tier.displayName}</h4>
                      <span className="text-[11px] font-bold text-slate-500">
                        {tier.minActiveReferrals}
                        {tier.maxActiveReferrals ? ` à ${tier.maxActiveReferrals}` : "+"} filleuls actifs
                      </span>
                    </div>
                  </div>

                  {/* Main Reward Highlight */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold text-slate-800">
                    🎁 {tier.freeMonthsDescription}
                  </div>

                  {/* Perks list */}
                  <ul className="space-y-2 text-[11px] text-slate-600">
                    {tier.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Status Indicator */}
                <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                  {isCurrent ? (
                    <span className="text-xs font-bold text-blue-600 flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Palier Actif
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Débloqué
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">
                      Requis : {tier.minActiveReferrals} filleuls
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Rewards Management & Available Free Months */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-600" />
              <span>Vos Récompenses & Mois Gratuits à Réclamer</span>
            </h3>
            <p className="text-xs text-slate-500">
              Activez vos mois offerts pour prolonger instantanément l&apos;échéance de votre compte sans impact sur vos facturations
            </p>
          </div>

          {/* Quick Apply Button */}
          {profile?.freeMonthsAvailable && profile.freeMonthsAvailable > 0 ? (
            <button
              onClick={() => handleClaimReward()}
              disabled={Boolean(claimLoadingId)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>
                {claimLoadingId === "generic" ? "Prolongation en cours..." : "Activer 1 Mois Gratuit (+30 jours)"}
              </span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 text-xs font-bold">
              Aucun mois gratuit en attente
            </div>
          )}
        </div>

        {/* List of granted rewards */}
        {dashboardData?.rewards && dashboardData.rewards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.rewards.map((rw) => {
              const isApplied = rw.status === "APPLIED";
              return (
                <div
                  key={rw.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                    isApplied
                      ? "bg-slate-50/80 border-slate-200 text-slate-500"
                      : "bg-emerald-50/50 border-emerald-200 text-emerald-950 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        {rw.rewardType === "FREE_MONTH"
                          ? "Mois d'Abonnement Gratuit"
                          : rw.rewardType === "PAYOUT"
                          ? "Commission Cash PawaPay"
                          : "Avantage Spécial"}
                      </span>
                      <h4 className="font-bold text-sm mt-0.5">
                        {rw.rewardType === "FREE_MONTH" ? `+${Math.round(rw.rewardValue * 30)} jours offerts` : `${rw.rewardValue} ${rawCurrency}`}
                      </h4>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isApplied ? "bg-slate-200 text-slate-700" : "bg-emerald-600 text-white"
                      }`}
                    >
                      {isApplied ? "Déjà Appliqué" : "Disponible"}
                    </span>
                  </div>

                  {rw.notes && <p className="text-[11px] text-slate-600">{rw.notes}</p>}

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Attribué le {new Date(rw.grantedAt).toLocaleDateString("fr-FR")}</span>

                    {!isApplied && rw.rewardType === "FREE_MONTH" && (
                      <button
                        onClick={() => handleClaimReward(rw.id)}
                        disabled={claimLoadingId === rw.id}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                      >
                        {claimLoadingId === rw.id ? "Application..." : "Appliquer"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            <Gift className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <span>Vos récompenses débloquées apparaîtront ici dès que vos filleuls souscriront à leur forfait.</span>
          </div>
        )}
      </div>

      {/* 6. Anonymized Referrals Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Comptes Filleuls Parrainés</span>
            </h3>
            <p className="text-xs text-slate-500">
              Liste anonymisée des commerces inscrits avec votre lien de parrainage
            </p>
          </div>

          <div className="text-xs font-bold text-slate-600">
            Total : <span className="text-blue-600">{dashboardData?.referrals.length || 0}</span> commerce(s)
          </div>
        </div>

        {dashboardData?.referrals && dashboardData.referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Commerce Partenaire</th>
                  <th className="py-3 px-3">Région</th>
                  <th className="py-3 px-3">Date d&apos;inscription</th>
                  <th className="py-3 px-3">Forfait</th>
                  <th className="py-3 px-3">Statut Affiliation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {dashboardData.referrals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{item.anonymizedName}</td>
                    <td className="py-3 px-3 text-slate-500">{item.cityOrCountry || "RDC"}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{item.plan}</span>
                    </td>
                    <td className="py-3 px-3">
                      {item.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Actif (Payant)
                        </span>
                      ) : item.status === "PENDING" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          En attente de 1er paiement
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {item.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 mb-1">Aucun filleul pour l&apos;instant</p>
            <p className="text-[11px]">
              Partagez votre lien d&apos;affiliation sur WhatsApp pour commencer à cumuler vos mois gratuits !
            </p>
          </div>
        )}
      </div>

      {/* 7. Security & Anti-Fraud Guarantee */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg">Règles d&apos;Équité & Protection Anti-Fraude</h3>
            <p className="text-xs text-slate-400">Transparence et sécurité du programme d&apos;affiliation GlobalPOS</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 pt-2">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <b className="text-white block">1. Définition du Filleul Actif</b>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Un compte est comptabilisé comme actif dès lors qu&apos;il effectue son premier règlement d&apos;abonnement réel via Mobile Money (PawaPay).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <b className="text-white block">2. Interdiction d&apos;Auto-Parrainage</b>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Le système vérifie automatiquement l&apos;empreinte IP, les numéros de téléphone et emails pour empêcher la création de comptes fictifs par le même propriétaire.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
            <b className="text-white block">3. Prolongation Sans Engagement</b>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Les mois gratuits s&apos;ajoutent immédiatement à votre date d&apos;expiration sans interrompre vos forfaits récurrents et sont cumulables sans limite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
