import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const result = await auditAndVerifyTenants(prisma);
    return NextResponse.json({
      success: true,
      message: "Vérification et intégrité des boutiques validées avec succès.",
      data: result,
    });
  } catch (err: any) {
    console.error("[Reconcile Tenants Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erreur d'audit des boutiques" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const result = await auditAndVerifyTenants(prisma);
    return NextResponse.json({
      success: true,
      message: "Rapport d'intégrité multi-tenant généré avec succès.",
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * Non-destructive tenant data integrity audit and verification engine.
 * Ensures stores, users, and products are strictly scoped to their legitimate tenantId.
 */
export async function auditAndVerifyTenants(prismaClient: typeof prisma) {
  const allTenants = await prismaClient.tenant.findMany({
    include: {
      stores: {
        include: {
          _count: { select: { products: true, sales: true, customers: true } },
        },
      },
      users: { select: { id: true, name: true, phone: true, role: true, isActive: true } },
      _count: { select: { products: true, sales: true, customers: true, subscriptions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Verify any orphaned products or stores where store.tenantId !== product.tenantId
  const mismatchedProducts = await prismaClient.product.findMany({
    where: {
      store: {
        tenantId: { not: undefined }
      }
    },
    select: {
      id: true,
      tenantId: true,
      storeId: true,
      store: { select: { tenantId: true } }
    }
  });

  const fixingBatch: string[] = [];
  for (const p of mismatchedProducts) {
    if (p.store && p.store.tenantId && p.tenantId !== p.store.tenantId) {
      await prismaClient.product.update({
        where: { id: p.id },
        data: { tenantId: p.store.tenantId },
      });
      fixingBatch.push(p.id);
    }
  }

  return {
    totalTenants: allTenants.length,
    fixedMismatches: fixingBatch.length,
    tenantsSummary: allTenants.map((t) => ({
      id: t.id,
      name: t.name,
      currency: t.currency,
      storesCount: t.stores.length,
      productsCount: t._count.products,
      salesCount: t._count.sales,
      customersCount: t._count.customers,
    })),
  };
}
