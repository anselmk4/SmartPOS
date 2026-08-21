import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    // 1. Fetch real aggregate counts in parallel
    const [
      tenantsCount,
      storesCount,
      usersCount,
      productsCount,
      salesCount,
      subscriptionsCount,
      debtPaymentsCount,
      syncLogsCount,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.store.count(),
      prisma.user.count(),
      prisma.product.count(),
      prisma.sale.count(),
      prisma.subscription.count(),
      prisma.debtPayment.count(),
      prisma.syncLog.count(),
    ]);

    // 2. Fetch all tenants for plan distribution & MRR computation
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        stores: { select: { id: true, name: true } },
        _count: {
          select: {
            users: true,
            products: true,
            sales: true,
          },
        },
      },
    });

    // 3. Compute real GMV (sum of sales totalAmount)
    const salesAggregate = await prisma.sale.aggregate({
      _sum: { totalAmount: true },
    });
    const gmvTotal = salesAggregate._sum.totalAmount || 0;

    // 4. Compute Plan Stats & MRR from real tenants
    let mrrTotal = 0;
    const planStats = { FREE: 0, BASIC: 0, PRO: 0, BUSINESS: 0 };

    tenants.forEach((t) => {
      if (t.plan in planStats) {
        planStats[t.plan as keyof typeof planStats] += 1;
      }
      if (t.isActive) {
        if (t.plan === "PRO") mrrTotal += 15000;
        else if (t.plan === "BUSINESS") mrrTotal += 45000;
        else if (t.plan === "BASIC") mrrTotal += 5000;
      }
    });

    // 5. Fetch real Subscriptions with tenant details
    const recentSubscriptions = await prisma.subscription.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          select: { id: true, name: true, phone: true, slug: true },
        },
      },
    });

    // 6. Mobile Money Distribution from real Subscriptions & Sales
    const mobileMoneyStats: Record<string, { count: number; total: number }> = {
      MPESA: { count: 0, total: 0 },
      AIRTEL_MONEY: { count: 0, total: 0 },
      ORANGE_MONEY: { count: 0, total: 0 },
      AFRIMONEY: { count: 0, total: 0 },
      WAVE: { count: 0, total: 0 },
      MTN_MOMO: { count: 0, total: 0 },
      CASH: { count: 0, total: 0 },
      CREDIT: { count: 0, total: 0 },
    };

    // Subscriptions payments
    const allSubscriptions = await prisma.subscription.findMany({
      select: { paymentMethod: true, amount: true },
    });
    allSubscriptions.forEach((s) => {
      const method = s.paymentMethod;
      if (mobileMoneyStats[method]) {
        mobileMoneyStats[method].count += 1;
        mobileMoneyStats[method].total += s.amount || 0;
      }
    });

    // Sales payments
    const allSalesMethods = await prisma.sale.groupBy({
      by: ["paymentMethod"],
      _count: { _all: true },
      _sum: { totalAmount: true },
    });
    allSalesMethods.forEach((s) => {
      const method = s.paymentMethod;
      if (mobileMoneyStats[method]) {
        mobileMoneyStats[method].count += s._count._all;
        mobileMoneyStats[method].total += s._sum.totalAmount || 0;
      }
    });

    // Recent Sales
    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          tenants: tenantsCount,
          stores: storesCount,
          users: usersCount,
          products: productsCount,
          sales: salesCount,
          subscriptions: subscriptionsCount,
          debtPayments: debtPaymentsCount,
          syncLogs: syncLogsCount,
        },
        financials: {
          gmvTotal,
          mrrTotal,
        },
        planStats,
        mobileMoneyStats,
        recentTenants: tenants.slice(0, 5),
        recentSubscriptions,
        recentSales,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Admin Overview API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
