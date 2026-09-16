-- =========================================================================================
-- GLOBALPOS SAAS - MIGRATION SQL POUR LE SYSTÈME D'AFFILIATION & PARRAINAGE MULTI-NIVEAUX
-- Compatible PostgreSQL / Supabase
-- =========================================================================================

-- 1. ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AffiliateTier') THEN
        CREATE TYPE "AffiliateTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReferralStatus') THEN
        CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RewardType') THEN
        CREATE TYPE "RewardType" AS ENUM ('FREE_MONTH', 'DISCOUNT', 'PAYOUT', 'TIER_UPGRADE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RewardStatus') THEN
        CREATE TYPE "RewardStatus" AS ENUM ('GRANTED', 'APPLIED', 'EXPIRED', 'PENDING_MATURITY');
    END IF;
END $$;

-- 2. TABLE: affiliates (Profil affilié par commerce/marchand)
CREATE TABLE IF NOT EXISTS "affiliates" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" TEXT UNIQUE NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "user_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "referral_code" VARCHAR(32) UNIQUE NOT NULL,
    "current_tier" "AffiliateTier" NOT NULL DEFAULT 'BRONZE',
    "total_referrals_count" INTEGER NOT NULL DEFAULT 0,
    "active_referrals_count" INTEGER NOT NULL DEFAULT 0,
    "free_months_earned" INTEGER NOT NULL DEFAULT 0,
    "free_months_used" INTEGER NOT NULL DEFAULT 0,
    "total_cash_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payout_phone" VARCHAR(64),
    "payout_payment_method" "PaymentMethod",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_affiliates_referral_code" ON "affiliates"("referral_code");
CREATE INDEX IF NOT EXISTS "idx_affiliates_current_tier" ON "affiliates"("current_tier");

-- 3. TABLE: referrals (Liaison entre le parrain et les commerces filleuls)
CREATE TABLE IF NOT EXISTS "referrals" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "affiliate_id" UUID NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE,
    "referred_tenant_id" TEXT UNIQUE NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "referred_user_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "conversion_date" TIMESTAMP(3),
    "signup_ip" VARCHAR(64),
    "device_fingerprint" VARCHAR(128),
    "total_paid_by_referred" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_referrals_affiliate_id" ON "referrals"("affiliate_id");
CREATE INDEX IF NOT EXISTS "idx_referrals_status" ON "referrals"("status");
CREATE INDEX IF NOT EXISTS "idx_referrals_referred_tenant_id" ON "referrals"("referred_tenant_id");

-- 4. TABLE: affiliate_rewards (Historique & solde des récompenses attribuées)
CREATE TABLE IF NOT EXISTS "affiliate_rewards" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "affiliate_id" UUID NOT NULL REFERENCES "affiliates"("id") ON DELETE CASCADE,
    "referral_id" UUID REFERENCES "referrals"("id") ON DELETE SET NULL,
    "reward_type" "RewardType" NOT NULL DEFAULT 'FREE_MONTH',
    "reward_value" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "status" "RewardStatus" NOT NULL DEFAULT 'GRANTED',
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_affiliate_rewards_affiliate_id" ON "affiliate_rewards"("affiliate_id");
CREATE INDEX IF NOT EXISTS "idx_affiliate_rewards_status" ON "affiliate_rewards"("status");

-- 5. TABLE: tier_rules (Configuration des règles et barèmes de gamification)
CREATE TABLE IF NOT EXISTS "tier_rules" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tier_name" "AffiliateTier" UNIQUE NOT NULL,
    "display_name" VARCHAR(64) NOT NULL,
    "min_active_referrals" INTEGER NOT NULL,
    "free_months_reward" INTEGER NOT NULL DEFAULT 0,
    "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cash_commission_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perks_json" TEXT,
    "badge_color" VARCHAR(64),
    "order_index" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. INSERT DEFAULT TIER RULES
INSERT INTO "tier_rules" ("tier_name", "display_name", "min_active_referrals", "free_months_reward", "discount_percent", "cash_commission_percent", "perks_json", "order_index")
VALUES
    ('BRONZE', 'Bronze', 1, 0, 0.0, 0.0, '["15 jours offerts du plan PRO dès 10 filleuls", "Kit de promotion & liens de partage WhatsApp", "Accès au tableau de bord affilié en temps réel"]', 1),
    ('SILVER', 'Argent', 11, 1, 0.0, 0.0, '["1 mois gratuit par trimestre dès 20 filleuls", "Badge Partenaire Argent", "Support prioritaire par chat"]', 2),
    ('GOLD', 'Or', 21, 6, 0.0, 0.0, '["6 mois offerts dès le 30e filleul (Objectif 40)", "Ligne directe WhatsApp avec notre équipe", "Formation gratuite des caissiers"]', 3),
    ('PLATINUM', 'VIP Platine', 41, 999, 100.0, 10.0, '["Compte GlobalPOS 100% GRATUIT dès le 41e filleul", "10% de commission Cash sur chaque paiement du plan PRO", "Paiement Mobile Money automatique", "Account Manager dédié VIP"]', 4)
ON CONFLICT ("tier_name") DO UPDATE SET
    "display_name" = EXCLUDED."display_name",
    "min_active_referrals" = EXCLUDED."min_active_referrals",
    "free_months_reward" = EXCLUDED."free_months_reward",
    "discount_percent" = EXCLUDED."discount_percent",
    "cash_commission_percent" = EXCLUDED."cash_commission_percent",
    "perks_json" = EXCLUDED."perks_json",
    "order_index" = EXCLUDED."order_index";
