import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: Server health & Real database table stats
export async function GET(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const startTime = Date.now();

    // Query counts directly from PostgreSQL tables
    const [
      tenantsCount,
      storesCount,
      usersCount,
      subscriptionsCount,
      productsCount,
      customersCount,
      salesCount,
      saleItemsCount,
      debtPaymentsCount,
      syncLogsCount,
      otpCount,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.store.count(),
      prisma.user.count(),
      prisma.subscription.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.sale.count(),
      prisma.saleItem.count(),
      prisma.debtPayment.count(),
      prisma.syncLog.count(),
      prisma.otpVerification.count(),
    ]);

    const pingMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        database: {
          connected: true,
          provider: "Supabase PostgreSQL",
          latencyMs: pingMs,
          urlHost: "aws-1-eu-west-1.pooler.supabase.com",
        },
        tableCounts: {
          tenants: tenantsCount,
          stores: storesCount,
          users: usersCount,
          subscriptions: subscriptionsCount,
          products: productsCount,
          customers: customersCount,
          sales: salesCount,
          saleItems: saleItemsCount,
          debtPayments: debtPaymentsCount,
          syncLogs: syncLogsCount,
          otpVerifications: otpCount,
        },
        environment: process.env.NODE_ENV || "development",
        serverTimestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Admin Settings GET Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur de connexion à la base de données Supabase",
        data: {
          database: { connected: false, error: error.message },
        },
      },
      { status: 500 }
    );
  }
}

// POST: Full Supabase Database Backup Export (JSON)
export async function POST(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const [
      tenants,
      stores,
      users,
      subscriptions,
      products,
      customers,
      sales,
      saleItems,
      debtPayments,
      syncLogs,
    ] = await Promise.all([
      prisma.tenant.findMany(),
      prisma.store.findMany(),
      prisma.user.findMany(),
      prisma.subscription.findMany(),
      prisma.product.findMany(),
      prisma.customer.findMany(),
      prisma.sale.findMany(),
      prisma.saleItem.findMany(),
      prisma.debtPayment.findMany(),
      prisma.syncLog.findMany(),
    ]);

    const backupData = {
      meta: {
        exportDate: new Date().toISOString(),
        version: "3.0",
        source: "Supabase PostgreSQL Database",
        platform: "Global POS SuperAdmin",
      },
      counts: {
        tenants: tenants.length,
        stores: stores.length,
        users: users.length,
        subscriptions: subscriptions.length,
        products: products.length,
        customers: customers.length,
        sales: sales.length,
        saleItems: saleItems.length,
        debtPayments: debtPayments.length,
        syncLogs: syncLogs.length,
      },
      data: {
        tenants,
        stores,
        users,
        subscriptions,
        products,
        customers,
        sales,
        saleItems,
        debtPayments,
        syncLogs,
      },
    };

    return NextResponse.json({
      success: true,
      data: backupData,
      message: "Sauvegarde intégrale Supabase générée avec succès",
    });
  } catch (error: any) {
    console.error("[Admin Settings Backup POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'export de la base" },
      { status: 500 }
    );
  }
}
