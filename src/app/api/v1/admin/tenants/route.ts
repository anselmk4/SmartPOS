import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET all tenants with aggregated counts and store info
export async function GET(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan") || "ALL";
    const status = searchParams.get("status") || "ALL";

    const whereClause: any = {};

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (plan !== "ALL") {
      whereClause.plan = plan;
    }

    if (status === "ACTIVE") {
      whereClause.isActive = true;
    } else if (status === "SUSPENDED") {
      whereClause.isActive = false;
    }

    // 1. Auto-reconcile any sales, products, and customers whose storeId belongs to a specific tenant
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE sales s
        SET tenant_id = st.tenant_id
        FROM stores st
        WHERE s.store_id = st.id AND (s.tenant_id IS NULL OR s.tenant_id != st.tenant_id);
      `);

      await prisma.$executeRawUnsafe(`
        UPDATE products p
        SET tenant_id = st.tenant_id
        FROM stores st
        WHERE p.store_id = st.id AND (p.tenant_id IS NULL OR p.tenant_id != st.tenant_id);
      `);

      await prisma.$executeRawUnsafe(`
        UPDATE customers c
        SET tenant_id = st.tenant_id
        FROM stores st
        WHERE c.store_id = st.id AND (c.tenant_id IS NULL OR c.tenant_id != st.tenant_id);
      `);
    } catch (reconcileErr) {
      console.warn("[Admin Tenants Reconcile Warning]:", reconcileErr);
    }

    const tenants = await prisma.tenant.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        stores: true,
        users: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            products: true,
            sales: true,
            customers: true,
            subscriptions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: tenants,
      total: tenants.length,
    });
  } catch (error: any) {
    console.error("[Admin Tenants GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération des boutiques" },
      { status: 500 }
    );
  }
}

// POST: Create a new tenant with store and initial owner user
export async function POST(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await req.json();
    const {
      name,
      ownerName,
      phone,
      email,
      currency = "CDF",
      countryCode = "CD",
      plan = "PRO",
      address,
      pinCode = "1234",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Le nom de la boutique est requis" },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    let baseSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!baseSlug) baseSlug = "boutique";

    // Ensure unique slug
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.tenant.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const tenantId = crypto.randomUUID();
    const storeId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    // Create in database inside a transaction
    const [tenant, store, user] = await prisma.$transaction([
      prisma.tenant.create({
        data: {
          id: tenantId,
          name: cleanName,
          slug: finalSlug,
          phone: phone?.trim() || null,
          countryCode: countryCode || "CD",
          currency: currency || "CDF",
          plan: plan || "PRO",
          planStatus: "ACTIVE",
          planExpiresAt: new Date(Date.now() + 30 * 86400000),
          isActive: true,
        },
      }),
      prisma.store.create({
        data: {
          id: storeId,
          tenantId,
          name: `${cleanName} - Siège`,
          currency: currency || "CDF",
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          ownerName: ownerName?.trim() || cleanName,
        },
      }),
      prisma.user.create({
        data: {
          id: userId,
          tenantId,
          name: ownerName?.trim() || cleanName,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          pinCode: pinCode?.trim() || "1234",
          role: "OWNER",
          isActive: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Boutique "${cleanName}" créée avec succès dans Supabase`,
      data: { tenant, store, user },
    });
  } catch (error: any) {
    console.error("[Admin Tenants POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la création de la boutique" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing tenant (plan, status, details)
export async function PUT(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await req.json();
    const {
      id,
      name,
      phone,
      currency,
      countryCode,
      plan,
      planStatus,
      planExpiresAt,
      isActive,
      // Subscription invoice fields
      durationMonths,
      amount,
      isFree,
      paymentMethod = "CASH",
      transactionId,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de la boutique requis" },
        { status: 400 }
      );
    }

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Boutique non trouvée" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (currency !== undefined) updateData.currency = currency;
    if (countryCode !== undefined) updateData.countryCode = countryCode;
    if (plan !== undefined) updateData.plan = plan;
    if (planStatus !== undefined) updateData.planStatus = planStatus;
    // If isActive is explicitly modified
    if (isActive !== undefined) {
      const activeBool = Boolean(isActive);
      updateData.isActive = activeBool;
      if (activeBool) {
        if (!existing.planStatus || existing.planStatus === "TRIAL") {
          updateData.planStatus = existing.plan === "FREE" ? "ACTIVE" : existing.planStatus;
        }
        // Activate all users under this tenant
        await prisma.user.updateMany({
          where: { tenantId: id },
          data: { isActive: true },
        });
        // Consume any pending OTP verification records
        await prisma.otpVerification.updateMany({
          where: { tenantId: id },
          data: { consumed: true },
        });
      } else {
        // If suspending, also deactivate users
        await prisma.user.updateMany({
          where: { tenantId: id },
          data: { isActive: false },
        });
      }
    }

    // If plan is changed or subscription details are provided, compute expiration & create invoice
    const hasPlanChange = plan !== undefined && (durationMonths !== undefined || isFree !== undefined || amount !== undefined);

    let calculatedExpiresAt: Date | null = null;
    if (planExpiresAt !== undefined) {
      calculatedExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null;
    } else if (hasPlanChange || durationMonths !== undefined) {
      const months = Math.max(1, Number(durationMonths) || 1);
      const now = new Date();
      // Calculate future expiration date
      const future = new Date(now);
      future.setMonth(future.getMonth() + months);
      calculatedExpiresAt = future;
    }

    if (calculatedExpiresAt !== null || planExpiresAt !== undefined) {
      updateData.planExpiresAt = calculatedExpiresAt;
    }

    let createdSubscription: any = null;

    if (hasPlanChange || (plan && plan !== "FREE" && durationMonths)) {
      const now = new Date();
      const months = Math.max(1, Number(durationMonths) || 1);
      const expiry = calculatedExpiresAt || new Date(now.getTime() + months * 30 * 86400000);
      const finalAmount = isFree ? 0 : Math.max(0, Number(amount) || 0);
      const finalCurrency = currency || existing.currency || "CDF";
      
      const invoiceRef =
        transactionId?.trim() ||
        `FAC-SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(100000 + Math.random() * 900000)}`;

      const [updatedTenant, sub] = await prisma.$transaction([
        prisma.tenant.update({
          where: { id },
          data: {
            ...updateData,
            plan: plan || existing.plan,
            planStatus: "ACTIVE",
            planExpiresAt: expiry,
          },
        }),
        prisma.subscription.create({
          data: {
            id: crypto.randomUUID(),
            tenantId: id,
            plan: (plan || existing.plan) as any,
            amount: finalAmount,
            currency: finalCurrency,
            paymentMethod: paymentMethod as any,
            paymentStatus: "ACTIVE",
            transactionId: invoiceRef,
            periodStart: now,
            periodEnd: expiry,
            createdAt: now,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `Forfait ${plan} activé avec succès (${isFree ? "Gratuit / Offert" : `${finalAmount} ${finalCurrency} pour ${months} mois`}). Facture N° ${invoiceRef} générée.`,
        data: updatedTenant,
        subscription: sub,
      });
    }

    // Standard simple update
    const updated = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    const isActivationAction = isActive === true;
    const isSuspensionAction = isActive === false;

    return NextResponse.json({
      success: true,
      message: isActivationAction
        ? `Boutique "${updated.name}" activée manuellement avec succès ! Le gérant et son équipe peuvent désormais ouvrir leur caisse.`
        : isSuspensionAction
        ? `Boutique "${updated.name}" suspendue avec succès.`
        : `Boutique "${updated.name}" mise à jour avec succès`,
      data: updated,
    });
  } catch (error: any) {
    console.error("[Admin Tenants PUT Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la mise à jour de la boutique" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a tenant and its cascading records
export async function DELETE(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de la boutique requis" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Boutique introuvable" },
        { status: 404 }
      );
    }

    // Cascade delete in Prisma
    await prisma.tenant.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Boutique "${tenant.name}" supprimée définitivement de Supabase`,
    });
  } catch (error: any) {
    console.error("[Admin Tenants DELETE Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la suppression de la boutique" },
      { status: 500 }
    );
  }
}
