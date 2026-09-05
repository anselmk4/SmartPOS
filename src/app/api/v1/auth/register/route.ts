import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@/lib/shared/types";
import { hashPinCode } from "@/lib/security/password";
import { triggerRegistrationOtp } from "@/lib/services/otp-service";
import { getSystemVerificationConfig } from "@/lib/services/system-settings";
import { createSessionToken } from "@/lib/security/jwt";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      storeId,
      userId,
      storeName,
      ownerName,
      phone,
      email,
      address,
      businessType,
      countryCode = "CD",
      currency = "CDF",
      pinCode = "1234",
      plan = "FREE",
      captchaToken,
      captchaAnswer,
      honeypot,
    } = body;

    // 1. Anti-Bot Honeypot validation
    if (honeypot && String(honeypot).trim().length > 0) {
      return NextResponse.json(
        { success: false, error: "Requête automatisée rejetée par la sécurité anti-bot." },
        { status: 400 }
      );
    }

    // 2. Anti-Bot Captcha Token validation (if token supplied)
    if (captchaToken && captchaAnswer !== undefined) {
      try {
        const decoded = JSON.parse(Buffer.from(captchaToken, "base64").toString("utf-8"));
        if (decoded && typeof decoded.expected === "number") {
          const userAns = parseInt(String(captchaAnswer).trim(), 10);
          if (isNaN(userAns) || userAns !== decoded.expected) {
            return NextResponse.json(
              { success: false, error: "Le calcul de sécurité anti-robot est incorrect." },
              { status: 400 }
            );
          }
        }
      } catch (err) {
        console.warn("[Register API] Captcha token decode warning:", err);
      }
    }

    if (!storeName || !ownerName || !phone) {
      return NextResponse.json(
        { success: false, error: "Nom de boutique, nom du propriétaire et téléphone requis" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Verify if a merchant already exists with this phone number to prevent account hijacking
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
      include: { tenant: true },
    });

    if (existingUser && existingUser.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Un compte marchand existe déjà avec ce numéro ou cet email. Veuillez vous connecter avec votre code PIN ou utiliser 'Code PIN oublié'.",
        },
        { status: 409 }
      );
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days trial/active

    const config = await getSystemVerificationConfig();
    const requiresVerification = config.verificationMethod !== "DISABLED";

    const targetTenantId = (existingUser?.tenantId || tenantId) || crypto.randomUUID();
    
    // Ensure we do not create duplicate stores if the tenant already has an existing store
    const existingStore = await prisma.store.findFirst({
      where: { tenantId: targetTenantId },
      orderBy: { createdAt: "asc" },
    });
    const targetStoreId = existingStore?.id || storeId || crypto.randomUUID();
    const targetUserId = (existingUser?.id || userId) || crypto.randomUUID();

    // 1. Create or upsert Tenant
    const cleanSlug = `${storeName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
    const tenant = await prisma.tenant.upsert({
      where: { id: targetTenantId },
      update: {
        name: storeName.trim(),
        phone: cleanPhone,
        countryCode,
        currency,
        plan: (plan as SubscriptionPlan) || "FREE",
        planStatus: requiresVerification ? "TRIAL" : "ACTIVE",
        planExpiresAt: periodEnd,
        isActive: !requiresVerification,
        updatedAt: now,
      },
      create: {
        id: targetTenantId,
        name: storeName.trim(),
        slug: cleanSlug,
        phone: cleanPhone,
        countryCode,
        currency,
        plan: (plan as SubscriptionPlan) || "FREE",
        planStatus: requiresVerification ? "TRIAL" : "ACTIVE",
        planExpiresAt: periodEnd,
        isActive: !requiresVerification,
        createdAt: now,
        updatedAt: now,
      },
    });

    // 2. Create or upsert Store
    const store = await prisma.store.upsert({
      where: { id: targetStoreId },
      update: {
        name: storeName.trim(),
        currency,
        phone: cleanPhone,
        address: address ? address.trim() : undefined,
        ownerName: ownerName.trim(),
        updatedAt: now,
      },
      create: {
        id: targetStoreId,
        tenantId: tenant.id,
        name: storeName.trim(),
        currency,
        phone: cleanPhone,
        address: address ? address.trim() : undefined,
        ownerName: ownerName.trim(),
        createdAt: now,
        updatedAt: now,
      },
    });

    // 3. Create or upsert Owner User with hashed PIN
    const hashedPin = pinCode ? hashPinCode(pinCode.trim()) : hashPinCode("1234");
    const user = await prisma.user.upsert({
      where: { id: targetUserId },
      update: {
        name: ownerName.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        pinCode: hashedPin,
        role: "OWNER",
        isActive: !requiresVerification,
        updatedAt: now,
      },
      create: {
        id: targetUserId,
        tenantId: tenant.id,
        name: ownerName.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        pinCode: hashedPin,
        role: "OWNER",
        isActive: !requiresVerification,
        createdAt: now,
        updatedAt: now,
      },
    });

    // 4. Trigger OTP verification (SMS Twilio / Supabase Email)
    let otpData = null;
    let token: string | undefined = undefined;

    if (requiresVerification) {
      otpData = await triggerRegistrationOtp({
        tenantId: tenant.id,
        userId: user.id,
        phone: phone.trim(),
        email: email ? email.trim() : null,
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
      });
    } else {
      token = createSessionToken({
        userId: user.id,
        tenantId: tenant.id,
        role: user.role,
      });
    }

    return NextResponse.json({
      success: true,
      requiresVerification,
      verificationMethod: config.verificationMethod,
      otp: otpData,
      token,
      tenant,
      store,
      user,
      message: requiresVerification
        ? `Code de confirmation envoyé par ${config.verificationMethod === "EMAIL" ? "e-mail" : "SMS"}.`
        : `Boutique "${storeName}" créée avec succès !`,
    });
  } catch (error: any) {
    console.error("[Auth Register API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la création du compte sur le serveur" },
      { status: 500 }
    );
  }
}
