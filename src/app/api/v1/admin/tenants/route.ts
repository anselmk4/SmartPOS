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
    const { id, name, phone, currency, countryCode, plan, planStatus, planExpiresAt, isActive } = body;

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
    if (planExpiresAt !== undefined) updateData.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Boutique "${updated.name}" mise à jour avec succès`,
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
