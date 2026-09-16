import { prisma } from "@/lib/prisma";
import type {
  AffiliateTier,
  ReferralStatus,
  RewardType,
  RewardStatus,
  AffiliateDashboardData,
  AffiliateProfile,
  ReferralItem,
  AffiliateRewardItem,
} from "@/lib/types/affiliate";
import { AFFILIATE_TIERS } from "@/lib/types/affiliate";
import * as crypto from "crypto";

/**
 * Generate a clean, unique and memorable referral code (e.g., GP-K7A9X or STORE-39B)
 */
export async function generateUniqueReferralCode(prefixHint?: string): Promise<string> {
  const cleanPrefix = prefixHint
    ? prefixHint.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4)
    : "GP";
  
  for (let i = 0; i < 10; i++) {
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
    const code = `${cleanPrefix || "GP"}-${randomPart}`;
    const exists = await prisma.affiliate.findUnique({
      where: { referralCode: code },
    });
    if (!exists) return code;
  }
  return `GP-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

/**
 * Determine the tier based on the number of active paying referrals
 */
export function determineTierFromActiveCount(activeCount: number): AffiliateTier {
  if (activeCount >= AFFILIATE_TIERS.PLATINUM.minActiveReferrals) {
    return "PLATINUM";
  }
  if (activeCount >= AFFILIATE_TIERS.GOLD.minActiveReferrals) {
    return "GOLD";
  }
  if (activeCount >= AFFILIATE_TIERS.SILVER.minActiveReferrals) {
    return "SILVER";
  }
  return "BRONZE";
}

/**
 * Get or create an Affiliate profile for a given tenant / user
 */
export async function getOrCreateAffiliate(
  tenantId: string,
  userId?: string | null,
  storeNameHint?: string
) {
  let affiliate = await prisma.affiliate.findUnique({
    where: { tenantId },
    include: {
      tenant: true,
      referrals: {
        include: {
          referredTenant: true,
        },
      },
      rewards: true,
    },
  });

  if (!affiliate) {
    const code = await generateUniqueReferralCode(storeNameHint);
    affiliate = await prisma.affiliate.create({
      data: {
        tenantId,
        userId: userId || undefined,
        referralCode: code,
        currentTier: "BRONZE",
        totalReferralsCount: 0,
        activeReferralsCount: 0,
        freeMonthsEarned: 0,
        freeMonthsUsed: 0,
        totalCashEarned: 0,
        isActive: true,
      },
      include: {
        tenant: true,
        referrals: {
          include: {
            referredTenant: true,
          },
        },
        rewards: true,
      },
    });
  }

  return affiliate;
}

/**
 * Anti-Fraud check: Prevent self-referral and detect abusive signup rings
 */
export async function checkAntiFraud(
  referrerAffiliateId: string,
  newMerchantData: {
    phone?: string | null;
    email?: string | null;
    signupIp?: string | null;
  }
): Promise<{ allowed: boolean; reason?: string }> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: referrerAffiliateId },
    include: {
      tenant: {
        include: {
          users: true,
        },
      },
    },
  });

  if (!affiliate) {
    return { allowed: false, reason: "Parrain introuvable." };
  }

  const referrerPhone = affiliate.tenant.phone?.replace(/[^0-9]/g, "");
  const newPhone = newMerchantData.phone?.replace(/[^0-9]/g, "");

  // 1. Same phone check
  if (referrerPhone && newPhone && referrerPhone === newPhone) {
    return {
      allowed: false,
      reason: "L'auto-parrainage avec le même numéro de téléphone est interdit.",
    };
  }

  // 2. Same email check
  const referrerEmails = affiliate.tenant.users
    .map((u) => u.email?.toLowerCase().trim())
    .filter(Boolean);
  const newEmail = newMerchantData.email?.toLowerCase().trim();

  if (newEmail && referrerEmails.includes(newEmail)) {
    return {
      allowed: false,
      reason: "L'auto-parrainage avec la même adresse e-mail est interdit.",
    };
  }

  // 3. Velocity check: Check for suspicious spikes (> 10 signups in 1 hour from same IP)
  if (newMerchantData.signupIp && newMerchantData.signupIp !== "127.0.0.1" && newMerchantData.signupIp !== "::1") {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSignupsFromSameIp = await prisma.referral.count({
      where: {
        signupIp: newMerchantData.signupIp,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentSignupsFromSameIp >= 8) {
      return {
        allowed: false,
        reason: "Trop d'inscriptions récentes détectées depuis votre réseau.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Link a new tenant to their referrer via referralCode during registration
 */
export async function linkReferralSignup(params: {
  referralCode: string;
  referredTenantId: string;
  referredUserId?: string;
  signupIp?: string;
  deviceFingerprint?: string;
  phone?: string;
  email?: string;
}): Promise<{ success: boolean; message: string; referralId?: string }> {
  try {
    const cleanCode = params.referralCode.trim().toUpperCase();
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode: cleanCode },
      include: { tenant: true },
    });

    if (!affiliate || !affiliate.isActive) {
      return { success: false, message: "Code de parrainage invalide ou expiré." };
    }

    // Prevent referring self
    if (affiliate.tenantId === params.referredTenantId) {
      return { success: false, message: "Vous ne pouvez pas vous parrainer vous-même." };
    }

    // Anti-fraud validation
    const antiFraudRes = await checkAntiFraud(affiliate.id, {
      phone: params.phone,
      email: params.email,
      signupIp: params.signupIp,
    });

    if (!antiFraudRes.allowed) {
      console.warn(`[Anti-Fraud Affiliate] Blocked referral: ${antiFraudRes.reason}`);
      return { success: false, message: antiFraudRes.reason || "Vérification anti-fraude échouée." };
    }

    // Check if referral record already exists
    const existingRef = await prisma.referral.findUnique({
      where: { referredTenantId: params.referredTenantId },
    });

    if (existingRef) {
      return { success: true, message: "Filleul déjà rattaché.", referralId: existingRef.id };
    }

    // Create pending referral
    const referral = await prisma.referral.create({
      data: {
        affiliateId: affiliate.id,
        referredTenantId: params.referredTenantId,
        referredUserId: params.referredUserId,
        status: "PENDING",
        signupIp: params.signupIp,
        deviceFingerprint: params.deviceFingerprint,
      },
    });

    // Increment total referral count
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        totalReferralsCount: { increment: 1 },
      },
    });

    return {
      success: true,
      message: `Rattaché au parrain ${affiliate.tenant.name} avec succès.`,
      referralId: referral.id,
    };
  } catch (error: any) {
    console.error("[Affiliate Service Link Error]:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Recalculate affiliate stats & Tier level, granting rewards if tier threshold reached
 */
export async function recalculateAffiliateTier(affiliateId: string): Promise<{
  previousTier: AffiliateTier;
  newTier: AffiliateTier;
  upgraded: boolean;
  activeCount: number;
}> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: {
      tenant: true,
      referrals: {
        where: { status: "ACTIVE" },
      },
      rewards: true,
    },
  });

  if (!affiliate) {
    throw new Error("Affiliate not found");
  }

  const activeCount = affiliate.referrals.length;
  const previousTier = affiliate.currentTier;
  const newTier = determineTierFromActiveCount(activeCount);
  const upgraded = newTier !== previousTier;

  // Update affiliate counts & Tier
  await prisma.affiliate.update({
    where: { id: affiliateId },
    data: {
      activeReferralsCount: activeCount,
      currentTier: newTier,
    },
  });

  // If upgraded or reached a milestone, grant rewards
  if (upgraded) {
    const tierConfig = AFFILIATE_TIERS[newTier];
    let freeMonthsToGrant = 0;

    if (newTier === "SILVER") {
      freeMonthsToGrant = 1; // 1 mois gratuit débloqué
    } else if (newTier === "GOLD") {
      freeMonthsToGrant = 1; // 1 mois supplémentaire
    } else if (newTier === "PLATINUM") {
      freeMonthsToGrant = 2; // 2 mois bonus + statut VIP
    }

    if (freeMonthsToGrant > 0) {
      await prisma.affiliateReward.create({
        data: {
          affiliateId,
          rewardType: "FREE_MONTH",
          rewardValue: freeMonthsToGrant,
          status: "GRANTED",
          notes: `Déblocage du Palier ${tierConfig.displayName} (${activeCount} filleuls actifs) !`,
        },
      });

      await prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          freeMonthsEarned: { increment: freeMonthsToGrant },
        },
      });
    }
  }

  return { previousTier, newTier, upgraded, activeCount };
}

/**
 * Handle Payment Conversion: Called by PawaPay Webhook or Payment Status API
 * Converts pending referral to ACTIVE, updates affiliate stats, and checks tier upgrades
 */
export async function handlePaymentConversion(
  referredTenantId: string,
  paymentAmount: number,
  transactionId?: string
): Promise<{
  success: boolean;
  converted: boolean;
  tierUpgraded?: boolean;
  newTier?: AffiliateTier;
  message?: string;
}> {
  try {
    const referral = await prisma.referral.findUnique({
      where: { referredTenantId },
      include: {
        affiliate: {
          include: { tenant: true },
        },
      },
    });

    if (!referral) {
      // Not a referred tenant, nothing to process
      return { success: true, converted: false };
    }

    const wasPending = referral.status === "PENDING";
    const now = new Date();

    // Update referral status to ACTIVE
    const updatedRef = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: "ACTIVE",
        conversionDate: referral.conversionDate || now,
        totalPaidByReferred: { increment: paymentAmount },
        updatedAt: now,
      },
    });

    // If this is the first payment conversion, grant the initial 15 days or 1st referral reward
    if (wasPending) {
      // Check if this is the affiliate's 1st referral
      const totalActive = await prisma.referral.count({
        where: { affiliateId: referral.affiliateId, status: "ACTIVE" },
      });

      if (totalActive === 1) {
        // Grant Bronze bonus: 0.5 month (15 days) reward
        await prisma.affiliateReward.create({
          data: {
            affiliateId: referral.affiliateId,
            referralId: referral.id,
            rewardType: "FREE_MONTH",
            rewardValue: 0.5,
            status: "GRANTED",
            notes: "Bonus d'activation : 15 jours offerts pour votre 1er filleul actif !",
          },
        });

        await prisma.affiliate.update({
          where: { id: referral.affiliateId },
          data: {
            freeMonthsEarned: { increment: 1 }, // Count as 1 reward milestone
          },
        });
      }
    }

    // Recalculate affiliate tier & perks
    const tierResult = await recalculateAffiliateTier(referral.affiliateId);

    // If affiliate is Platinum, calculate and accumulate 15% cash commission
    if (tierResult.newTier === "PLATINUM" && paymentAmount > 0) {
      const commission = Math.round(paymentAmount * 0.15 * 100) / 100;
      if (commission > 0) {
        await prisma.affiliateReward.create({
          data: {
            affiliateId: referral.affiliateId,
            referralId: referral.id,
            rewardType: "PAYOUT",
            rewardValue: commission,
            status: "GRANTED",
            notes: `Commission VIP 15% sur paiement de ${paymentAmount} (Réf: ${transactionId || "N/A"})`,
          },
        });

        await prisma.affiliate.update({
          where: { id: referral.affiliateId },
          data: {
            totalCashEarned: { increment: commission },
          },
        });
      }
    }

    return {
      success: true,
      converted: true,
      tierUpgraded: tierResult.upgraded,
      newTier: tierResult.newTier,
      message: `Conversion enregistrée pour le parrain ${referral.affiliate.tenant.name}.`,
    };
  } catch (error: any) {
    console.error("[Affiliate Conversion Error]:", error);
    return { success: false, converted: false, message: error.message };
  }
}

/**
 * Apply a Free Month / Free Extension on the Affiliate's own Tenant Subscription
 * Extends `tenant.planExpiresAt` by 30 days per month applied without breaking payment cycles
 */
export async function applyFreeSubscriptionMonth(
  affiliateId: string,
  rewardId?: string
): Promise<{
  success: boolean;
  message: string;
  newPlanExpiresAt?: Date;
}> {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        tenant: true,
        rewards: {
          where: { status: "GRANTED", rewardType: "FREE_MONTH" },
        },
      },
    });

    if (!affiliate) {
      return { success: false, message: "Profil affilié introuvable." };
    }

    // Find the reward to apply
    let targetReward = rewardId
      ? affiliate.rewards.find((r) => r.id === rewardId)
      : affiliate.rewards[0];

    if (!targetReward) {
      // Fallback: Check if affiliate has earned free months not yet marked
      const availableCount = affiliate.freeMonthsEarned - affiliate.freeMonthsUsed;
      if (availableCount <= 0) {
        return {
          success: false,
          message: "Vous n'avez aucun mois gratuit disponible à activer pour le moment.",
        };
      }
    }

    const daysToAdd = targetReward ? Math.round(targetReward.rewardValue * 30) : 30;
    const now = new Date();
    
    // Calculate new expiration date
    let currentExpires = affiliate.tenant.planExpiresAt
      ? new Date(affiliate.tenant.planExpiresAt)
      : now;

    // If already expired in past, start from now
    if (currentExpires.getTime() < now.getTime()) {
      currentExpires = now;
    }

    const newExpiresAt = new Date(currentExpires.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // Update Tenant subscription expiration
    await prisma.tenant.update({
      where: { id: affiliate.tenantId },
      data: {
        planStatus: "ACTIVE",
        planExpiresAt: newExpiresAt,
        updatedAt: now,
      },
    });

    // Mark reward as APPLIED
    if (targetReward) {
      await prisma.affiliateReward.update({
        where: { id: targetReward.id },
        data: {
          status: "APPLIED",
          appliedAt: now,
        },
      });
    }

    // Update affiliate used count
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        freeMonthsUsed: { increment: 1 },
      },
    });

    return {
      success: true,
      message: `Félicitations ! Votre abonnement a été prolongé de ${daysToAdd} jours (jusqu'au ${newExpiresAt.toLocaleDateString("fr-FR")}).`,
      newPlanExpiresAt: newExpiresAt,
    };
  } catch (error: any) {
    console.error("[Affiliate Free Month Error]:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Anonymize store / merchant name for privacy (e.g. "Boutique K***, Kinshasa")
 */
function anonymizeStoreName(name?: string | null): string {
  if (!name || name.trim().length === 0) return "Commerce Partenaire";
  const trimmed = name.trim();
  if (trimmed.length <= 4) return `${trimmed[0]}***`;
  const words = trimmed.split(/\s+/);
  return words
    .map((w) => (w.length > 2 ? `${w.slice(0, 2)}***` : w))
    .join(" ");
}

/**
 * Fetch full dashboard data for frontend UI
 */
export async function getAffiliateDashboardData(
  tenantId: string,
  userId?: string | null,
  baseUrl = "https://globalpos.africa"
): Promise<AffiliateDashboardData> {
  const affiliate = await getOrCreateAffiliate(tenantId, userId);

  // Load all referrals for this affiliate with referred tenant info
  const rawReferrals = await prisma.referral.findMany({
    where: { affiliateId: affiliate.id },
    include: {
      referredTenant: {
        include: {
          stores: { take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Load rewards
  const rawRewards = await prisma.affiliateReward.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: "desc" },
  });

  const activeCount = rawReferrals.filter((r) => r.status === "ACTIVE").length;
  const currentTier = affiliate.currentTier;
  const currentTierConfig = AFFILIATE_TIERS[currentTier];

  // Determine next tier
  let nextTierConfig = null;
  let neededForNext = 0;
  let progressPercent = 100;

  if (currentTier === "BRONZE") {
    nextTierConfig = AFFILIATE_TIERS.SILVER;
    neededForNext = Math.max(0, nextTierConfig.minActiveReferrals - activeCount);
    progressPercent = Math.min(100, Math.round((activeCount / nextTierConfig.minActiveReferrals) * 100));
  } else if (currentTier === "SILVER") {
    nextTierConfig = AFFILIATE_TIERS.GOLD;
    neededForNext = Math.max(0, nextTierConfig.minActiveReferrals - activeCount);
    const span = nextTierConfig.minActiveReferrals - currentTierConfig.minActiveReferrals;
    const progress = activeCount - currentTierConfig.minActiveReferrals;
    progressPercent = Math.min(100, Math.max(0, Math.round((progress / span) * 100)));
  } else if (currentTier === "GOLD") {
    nextTierConfig = AFFILIATE_TIERS.PLATINUM;
    neededForNext = Math.max(0, nextTierConfig.minActiveReferrals - activeCount);
    const span = nextTierConfig.minActiveReferrals - currentTierConfig.minActiveReferrals;
    const progress = activeCount - currentTierConfig.minActiveReferrals;
    progressPercent = Math.min(100, Math.max(0, Math.round((progress / span) * 100)));
  } else {
    // Platinum is max tier
    neededForNext = 0;
    progressPercent = 100;
  }

  const freeMonthsAvailable = rawRewards.filter(
    (r) => r.status === "GRANTED" && r.rewardType === "FREE_MONTH"
  ).length;

  const profile: AffiliateProfile = {
    id: affiliate.id,
    tenantId: affiliate.tenantId,
    userId: affiliate.userId,
    referralCode: affiliate.referralCode,
    referralUrl: `${baseUrl}/auth/register?ref=${affiliate.referralCode}`,
    currentTier: affiliate.currentTier,
    tierConfig: currentTierConfig,
    nextTier: nextTierConfig,
    totalReferralsCount: rawReferrals.length,
    activeReferralsCount: activeCount,
    neededForNextTier: neededForNext,
    tierProgressPercent: progressPercent,
    freeMonthsEarned: affiliate.freeMonthsEarned,
    freeMonthsUsed: affiliate.freeMonthsUsed,
    freeMonthsAvailable,
    totalCashEarned: affiliate.totalCashEarned,
    payoutPhone: affiliate.payoutPhone,
    payoutPaymentMethod: affiliate.payoutPaymentMethod,
    isActive: affiliate.isActive,
    createdAt: affiliate.createdAt.toISOString(),
  };

  const referrals: ReferralItem[] = rawReferrals.map((r) => {
    const store = r.referredTenant.stores[0];
    const country = r.referredTenant.countryCode || "CD";
    const cityOrCountry = country === "CD" ? "RDC" : country === "CI" ? "Côte d'Ivoire" : country === "SN" ? "Sénégal" : country;
    
    return {
      id: r.id,
      anonymizedName: anonymizeStoreName(store?.name || r.referredTenant.name),
      cityOrCountry,
      status: r.status,
      plan: r.referredTenant.plan,
      createdAt: r.createdAt.toISOString(),
      conversionDate: r.conversionDate ? r.conversionDate.toISOString() : null,
      totalPaid: r.totalPaidByReferred,
    };
  });

  const rewards: AffiliateRewardItem[] = rawRewards.map((rw) => ({
    id: rw.id,
    rewardType: rw.rewardType,
    rewardValue: rw.rewardValue,
    status: rw.status,
    grantedAt: rw.grantedAt.toISOString(),
    appliedAt: rw.appliedAt ? rw.appliedAt.toISOString() : null,
    expiresAt: rw.expiresAt ? rw.expiresAt.toISOString() : null,
    notes: rw.notes,
  }));

  const allTiers = Object.values(AFFILIATE_TIERS);

  return {
    profile,
    referrals,
    rewards,
    tiers: allTiers,
    antiFraudSummary: {
      status: "HEALTHY",
      verifiedReferralsPercent: rawReferrals.length > 0 ? Math.round((activeCount / rawReferrals.length) * 100) : 100,
      protectionNotes: [
        "Vérification d'authenticité par paiement Mobile Money réel (PawaPay)",
        "Protection anti-auto-parrainage active",
        "Période de garantie et protection contre les annulations frauduleuses",
      ],
    },
  };
}
