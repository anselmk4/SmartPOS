import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/v1/admin/tenants/deduplicate
 * Detects all tenants that share identical or trimmed lowercase names.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const allTenants = await prisma.tenant.findMany({
      include: {
        stores: true,
        users: true,
        _count: {
          select: {
            products: true,
            sales: true,
            customers: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by normalized name
    const groups: Record<string, typeof allTenants> = {};
    for (const t of allTenants) {
      const norm = t.name.trim().toLowerCase();
      if (!groups[norm]) {
        groups[norm] = [];
      }
      groups[norm].push(t);
    }

    // Filter only groups with 2 or more tenants
    const duplicateGroups = Object.entries(groups)
      .filter(([_, list]) => list.length > 1)
      .map(([name, list]) => {
        // Plan tier priority helper
        const getPlanWeight = (p?: string) => {
          switch (p) {
            case "ENTERPRISE": return 1000;
            case "PRO": return 500;
            case "STARTER": return 200;
            case "BASIC": return 100;
            default: return 0;
          }
        };

        // Sort: highest plan tier first, then real owners, then data volume
        const sorted = [...list].sort((a, b) => {
          const planScoreA = getPlanWeight(a.plan);
          const planScoreB = getPlanWeight(b.plan);
          if (planScoreA !== planScoreB) {
            return planScoreB - planScoreA;
          }

          // Penalize test names like "sidney mak"
          const ownerA = a.users?.find((u) => u.role === "OWNER")?.name?.toLowerCase() || "";
          const ownerB = b.users?.find((u) => u.role === "OWNER")?.name?.toLowerCase() || "";
          const isTestA = ownerA.includes("sidney") || ownerA.includes("test") || ownerA.includes("apple");
          const isTestB = ownerB.includes("sidney") || ownerB.includes("test") || ownerB.includes("apple");
          if (isTestA !== isTestB) {
            return isTestA ? 1 : -1;
          }

          const scoreA =
            (a.stores?.length || 0) * 10 +
            (a._count?.sales || 0) * 5 +
            (a._count?.products || 0) * 2 +
            (a._count?.customers || 0);
          const scoreB =
            (b.stores?.length || 0) * 10 +
            (b._count?.sales || 0) * 5 +
            (b._count?.products || 0) * 2 +
            (b._count?.customers || 0);
          return scoreB - scoreA;
        });

        return {
          normalizedName: name,
          count: list.length,
          primaryCandidate: sorted[0],
          duplicates: sorted.slice(1),
        };
      });

    return NextResponse.json({
      success: true,
      data: duplicateGroups,
      totalDuplicates: duplicateGroups.reduce((acc, g) => acc + g.duplicates.length, 0),
    });
  } catch (error: any) {
    console.error("[Admin Tenants Deduplicate GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la détection des doublons" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/tenants/deduplicate
 * Merges duplicate tenants into the target primary tenant or deletes empty duplicate tenants.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await req.json().catch(() => ({}));
    const { primaryTenantId, duplicateTenantIds, action = "MERGE" } = body;

    if (!primaryTenantId || !duplicateTenantIds || !Array.isArray(duplicateTenantIds) || duplicateTenantIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "primaryTenantId et duplicateTenantIds requis" },
        { status: 400 }
      );
    }

    const primary = await prisma.tenant.findUnique({
      where: { id: primaryTenantId },
      include: { stores: true },
    });

    if (!primary) {
      return NextResponse.json(
        { success: false, error: "Boutique principale introuvable" },
        { status: 404 }
      );
    }

    const defaultStoreId = primary.stores[0]?.id;
    const mergeLogs: string[] = [];

    for (const dupId of duplicateTenantIds) {
      if (dupId === primaryTenantId) continue;

      const dupTenant = await prisma.tenant.findUnique({
        where: { id: dupId },
        include: {
          stores: true,
          users: true,
          products: true,
          customers: true,
        },
      });

      if (!dupTenant) continue;

      if (action === "MERGE") {
        // 1. Reassign stores
        await prisma.store.updateMany({
          where: { tenantId: dupId },
          data: { tenantId: primaryTenantId },
        });

        // 2. Reassign products
        await prisma.product.updateMany({
          where: { tenantId: dupId },
          data: {
            tenantId: primaryTenantId,
            ...(defaultStoreId ? { storeId: defaultStoreId } : {}),
          },
        });

        // 3. Reassign customers
        await prisma.customer.updateMany({
          where: { tenantId: dupId },
          data: { tenantId: primaryTenantId },
        });

        // 4. Reassign sales & items
        await prisma.sale.updateMany({
          where: { tenantId: dupId },
          data: {
            tenantId: primaryTenantId,
            ...(defaultStoreId ? { storeId: defaultStoreId } : {}),
          },
        });

        // 5. Reassign debt payments
        await prisma.debtPayment.updateMany({
          where: { tenantId: dupId },
          data: {
            tenantId: primaryTenantId,
            ...(defaultStoreId ? { storeId: defaultStoreId } : {}),
          },
        });

        // 6. Reassign subscriptions
        await prisma.subscription.updateMany({
          where: { tenantId: dupId },
          data: { tenantId: primaryTenantId },
        });

        // 7. Reassign users (avoiding duplicates)
        for (const user of dupTenant.users) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                tenantId: primaryTenantId,
                role: user.role === "OWNER" ? "MANAGER" : user.role, // downgrade duplicate OWNER to MANAGER to avoid multiple conflicting owners
              },
            });
          } catch (uErr) {
            console.warn(`[Merge User Skip]: ${user.name} (${user.id})`, uErr);
          }
        }
      }

      // Delete the duplicate tenant record (cascade handles remaining logs/otps)
      await prisma.tenant.delete({
        where: { id: dupId },
      });

      mergeLogs.push(`Boutique doublon "${dupTenant.name}" (ID: ${dupId.slice(0, 8)}) fusionnée et supprimée.`);
    }

    return NextResponse.json({
      success: true,
      message: `Fusion réussie vers "${primary.name}" ! ${duplicateTenantIds.length} doublon(s) résolu(s).`,
      logs: mergeLogs,
    });
  } catch (error: any) {
    console.error("[Admin Tenants Deduplicate POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la fusion des doublons" },
      { status: 500 }
    );
  }
}
