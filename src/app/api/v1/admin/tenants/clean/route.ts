import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/v1/admin/tenants/clean
 * Nettoie et purge toutes les données transactionnelles et de catalogue d'une boutique
 * (Ventes, Lignes de vente, Paiements de dettes, Produits, Clients, Logs de synchro)
 * Tout en conservant la structure du compte boutique (Tenant, Store, Propriétaire).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await req.json().catch(() => ({}));
    const { tenantId, tenantName, keepProducts, keepCustomers, keepUsers } = body;

    // 1. Rechercher la boutique soit par ID, soit par Nom
    let tenant: any = null;
    if (tenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { stores: true, users: true },
      });
    }

    if (!tenant && tenantName) {
      tenant = await prisma.tenant.findFirst({
        where: {
          name: { contains: tenantName.trim(), mode: "insensitive" },
        },
        include: { stores: true, users: true },
      });
    }

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          error: `Boutique introuvable avec les critères fournis (ID: ${tenantId || "N/A"}, Nom: ${tenantName || "N/A"})`,
        },
        { status: 404 }
      );
    }

    const targetTenantId = tenant.id;

    // 2. Exécution atomique de la purge des données
    const cleanupResult = await prisma.$transaction(async (tx) => {
      // a. Supprimer les lignes de vente (SaleItems)
      const deletedSaleItems = await tx.saleItem.deleteMany({
        where: {
          sale: {
            tenantId: targetTenantId,
          },
        },
      });

      // b. Supprimer les ventes (Sales)
      const deletedSales = await tx.sale.deleteMany({
        where: {
          tenantId: targetTenantId,
        },
      });

      // c. Supprimer les paiements de dettes (DebtPayments)
      const deletedDebtPayments = await tx.debtPayment.deleteMany({
        where: {
          tenantId: targetTenantId,
        },
      });

      // d. Supprimer les logs de synchronisation (SyncLogs)
      const deletedSyncLogs = await tx.syncLog.deleteMany({
        where: {
          tenantId: targetTenantId,
        },
      });

      // e. Supprimer les codes OTP résiduels
      const deletedOtps = await tx.otpVerification.deleteMany({
        where: {
          tenantId: targetTenantId,
        },
      });

      // f. Supprimer les produits si non conservés
      let deletedProductsCount = 0;
      if (!keepProducts) {
        const deletedProducts = await tx.product.deleteMany({
          where: {
            tenantId: targetTenantId,
          },
        });
        deletedProductsCount = deletedProducts.count;
      }

      // g. Supprimer les clients si non conservés
      let deletedCustomersCount = 0;
      if (!keepCustomers) {
        const deletedCustomers = await tx.customer.deleteMany({
          where: {
            tenantId: targetTenantId,
          },
        });
        deletedCustomersCount = deletedCustomers.count;
      }

      // h. Supprimer les caissiers si non conservés (conserver le propriétaire OWNER)
      let deletedUsersCount = 0;
      if (!keepUsers) {
        const deletedUsers = await tx.user.deleteMany({
          where: {
            tenantId: targetTenantId,
            role: { not: "OWNER" },
          },
        });
        deletedUsersCount = deletedUsers.count;
      }

      return {
        sales: deletedSales.count,
        saleItems: deletedSaleItems.count,
        debtPayments: deletedDebtPayments.count,
        syncLogs: deletedSyncLogs.count,
        otps: deletedOtps.count,
        products: deletedProductsCount,
        customers: deletedCustomersCount,
        users: deletedUsersCount,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Toutes les données de la boutique "${tenant.name}" ont été nettoyées avec succès !`,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      cleaned: cleanupResult,
    });
  } catch (error: any) {
    console.error("[Admin Tenant Clean Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors du nettoyage des données de la boutique",
      },
      { status: 500 }
    );
  }
}
