import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@/lib/shared/types";

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
      countryCode = "CD",
      currency = "CDF",
      pinCode = "1234",
      plan = "PRO",
    } = body;

    if (!storeName || !ownerName || !phone) {
      return NextResponse.json(
        { success: false, error: "Nom de boutique, nom du propriétaire et téléphone requis" },
        { status: 400 }
      );
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days trial/active

    // 1. Create or upsert Tenant
    const cleanSlug = `${storeName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
    const tenant = await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {
        name: storeName.trim(),
        phone: phone.trim(),
        countryCode,
        currency,
        plan: (plan as SubscriptionPlan) || "PRO",
        planStatus: "ACTIVE",
        planExpiresAt: periodEnd,
        updatedAt: now,
      },
      create: {
        id: tenantId,
        name: storeName.trim(),
        slug: cleanSlug,
        phone: phone.trim(),
        countryCode,
        currency,
        plan: (plan as SubscriptionPlan) || "PRO",
        planStatus: "ACTIVE",
        planExpiresAt: periodEnd,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    // 2. Create or upsert Store
    const store = await prisma.store.upsert({
      where: { id: storeId },
      update: {
        name: storeName.trim(),
        currency,
        phone: phone.trim(),
        ownerName: ownerName.trim(),
        updatedAt: now,
      },
      create: {
        id: storeId,
        tenantId: tenant.id,
        name: storeName.trim(),
        currency,
        phone: phone.trim(),
        ownerName: ownerName.trim(),
        createdAt: now,
        updatedAt: now,
      },
    });

    // 3. Create or upsert Owner User
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        name: ownerName.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : undefined,
        pinCode: pinCode.trim(),
        role: "OWNER",
        isActive: true,
        updatedAt: now,
      },
      create: {
        id: userId,
        tenantId: tenant.id,
        name: ownerName.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : null,
        pinCode: pinCode.trim(),
        role: "OWNER",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      tenant,
      store,
      user,
      message: `Boutique "${storeName}" créée et synchronisée sur le Cloud !`,
    });
  } catch (error: any) {
    console.error("[Auth Register API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la création du compte sur le serveur" },
      { status: 500 }
    );
  }
}
