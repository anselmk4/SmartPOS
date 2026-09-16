import type { SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";

export type AffiliateTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type ReferralStatus = "PENDING" | "ACTIVE" | "CANCELLED" | "EXPIRED";

export type RewardType = "FREE_MONTH" | "DISCOUNT" | "PAYOUT" | "TIER_UPGRADE";

export type RewardStatus = "GRANTED" | "APPLIED" | "EXPIRED" | "PENDING_MATURITY";

export interface TierConfig {
  tierName: AffiliateTier;
  displayName: string;
  minActiveReferrals: number;
  maxActiveReferrals?: number;
  freeMonthsReward: number; // e.g. 0.5 for 15 days, 1/3 (quarterly), 1/month, unlimited
  freeMonthsDescription: string;
  discountPercent: number;
  cashCommissionPercent: number;
  perks: string[];
  badgeColor: string;
  gradient: string;
  glowColor: string;
}

export const AFFILIATE_TIERS: Record<AffiliateTier, TierConfig> = {
  BRONZE: {
    tierName: "BRONZE",
    displayName: "Bronze",
    minActiveReferrals: 1,
    maxActiveReferrals: 10,
    freeMonthsReward: 0.5, // 15 jours offerts
    freeMonthsDescription: "15 jours offerts du plan PRO (dès 10 filleuls)",
    discountPercent: 0,
    cashCommissionPercent: 0,
    perks: [
      "15 jours d'abonnement forfait PRO offerts dès 10 filleuls actifs",
      "Kit de promotion & liens de partage WhatsApp",
      "Accès au tableau de bord affilié en temps réel",
    ],
    badgeColor: "bg-amber-600 text-amber-50 border-amber-500/40",
    gradient: "from-amber-700 via-amber-800 to-amber-950",
    glowColor: "rgba(217, 119, 6, 0.35)",
  },
  SILVER: {
    tierName: "SILVER",
    displayName: "Argent",
    minActiveReferrals: 11,
    maxActiveReferrals: 20,
    freeMonthsReward: 1, // 1 mois par trimestre
    freeMonthsDescription: "1 mois d'abonnement gratuit par trimestre (dès 20 filleuls)",
    discountPercent: 0,
    cashCommissionPercent: 0,
    perks: [
      "1 mois d'abonnement SaaS 100% gratuit par trimestre dès 20 filleuls",
      "Badge Partenaire Argent sur votre profil",
      "Support technique prioritaire par chat",
      "Accès anticipé aux nouvelles fonctionnalités POS",
    ],
    badgeColor: "bg-slate-300 text-slate-900 border-slate-400",
    gradient: "from-slate-400 via-slate-600 to-slate-800",
    glowColor: "rgba(148, 163, 184, 0.4)",
  },
  GOLD: {
    tierName: "GOLD",
    displayName: "Or",
    minActiveReferrals: 21,
    maxActiveReferrals: 40,
    freeMonthsReward: 6, // 6 mois offerts dès le 30e filleul
    freeMonthsDescription: "6 mois d'abonnement PRO offerts dès le 30e filleul (Objectif 40)",
    discountPercent: 0,
    cashCommissionPercent: 0,
    perks: [
      "6 mois d'abonnement PRO 100% gratuits débloqués dès le 30e filleul actif",
      "Statut Partenaire Or jusqu'à 40 filleuls",
      "Ligne directe WhatsApp avec notre équipe d'ingénieurs",
      "Formation personnalisée de vos caissiers par nos experts",
    ],
    badgeColor: "bg-amber-400 text-amber-950 border-amber-300 font-bold",
    gradient: "from-yellow-400 via-amber-500 to-yellow-600",
    glowColor: "rgba(245, 158, 11, 0.5)",
  },
  PLATINUM: {
    tierName: "PLATINUM",
    displayName: "VIP Platine",
    minActiveReferrals: 41,
    maxActiveReferrals: undefined,
    freeMonthsReward: 999, // Illimité
    freeMonthsDescription: "100% Gratuit en continu dès le 41e + 10% de commissions sur chaque paiement du plan PRO",
    discountPercent: 100,
    cashCommissionPercent: 10,
    perks: [
      "Compte GlobalPOS 100% GRATUIT à partir du 41e filleul actif",
      "10% de commission Cash sur chaque paiement du plan PRO de vos filleuls",
      "Paiement automatique chaque mois via Mobile Money (PawaPay/Wave/M-Pesa/Airtel)",
      "Account Manager dédié VIP et statut d'ambassadeur officiel",
    ],
    badgeColor: "bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-300 shadow-purple-500/30",
    gradient: "from-indigo-600 via-purple-700 to-pink-700",
    glowColor: "rgba(168, 85, 247, 0.55)",
  },
};

export interface AffiliateProfile {
  id: string;
  tenantId: string;
  userId?: string | null;
  referralCode: string;
  referralUrl: string;
  currentTier: AffiliateTier;
  tierConfig: TierConfig;
  nextTier?: TierConfig | null;
  totalReferralsCount: number;
  activeReferralsCount: number;
  neededForNextTier: number;
  tierProgressPercent: number;
  freeMonthsEarned: number;
  freeMonthsUsed: number;
  freeMonthsAvailable: number;
  totalCashEarned: number;
  payoutPhone?: string | null;
  payoutPaymentMethod?: PaymentMethod | null;
  isActive: boolean;
  createdAt: string;
}

export interface ReferralItem {
  id: string;
  anonymizedName: string;
  cityOrCountry?: string;
  status: ReferralStatus;
  plan: SubscriptionPlan;
  createdAt: string;
  conversionDate?: string | null;
  totalPaid: number;
  daysRemainingInSub?: number;
}

export interface AffiliateRewardItem {
  id: string;
  rewardType: RewardType;
  rewardValue: number;
  status: RewardStatus;
  grantedAt: string;
  appliedAt?: string | null;
  expiresAt?: string | null;
  notes?: string | null;
}

export interface AffiliateDashboardData {
  profile: AffiliateProfile;
  referrals: ReferralItem[];
  rewards: AffiliateRewardItem[];
  tiers: TierConfig[];
  antiFraudSummary: {
    status: "HEALTHY" | "REVIEW" | "SUSPICIOUS";
    verifiedReferralsPercent: number;
    protectionNotes: string[];
  };
}
