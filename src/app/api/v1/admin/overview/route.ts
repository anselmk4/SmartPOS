import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";
import { getPlanPriceInfo, convertCurrency } from "@/lib/constants/plans";
import type { SubscriptionPlan } from "@/lib/shared/types";

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

    // 2. Fetch all tenants with relationships
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

    // 4. Compute Plan Stats & accurate MRR from real tenants in database
    let mrrTotal = 0;
    const planStats = { FREE: 0, BASIC: 0, PRO: 0, BUSINESS: 0 };

    tenants.forEach((t) => {
      if (t.plan in planStats) {
        planStats[t.plan as keyof typeof planStats] += 1;
      }
      if (t.isActive && t.plan !== "FREE") {
        const info = getPlanPriceInfo(t.plan as SubscriptionPlan, t.currency || "CDF");
        const cdfAmount = convertCurrency(info.amount, t.currency || "CDF", "CDF");
        mrrTotal += cdfAmount;
      }
    });

    // 5. Fetch all subscriptions for time-series charts (Jour, Semaine, Mois, Année)
    const allSubscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        tenant: {
          select: { id: true, name: true, phone: true, slug: true },
        },
      },
    });

    // 5b. Revenue grouped by currency from Subscriptions
    const revenueByCurrency: Record<string, { currency: string; total: number; count: number }> = {};
    allSubscriptions.forEach((s) => {
      const cur = s.currency || "CDF";
      if (!revenueByCurrency[cur]) {
        revenueByCurrency[cur] = { currency: cur, total: 0, count: 0 };
      }
      revenueByCurrency[cur].total += s.amount || 0;
      revenueByCurrency[cur].count += 1;
    });

    // 6. Mobile Money Distribution from Subscriptions & Sales
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

    allSubscriptions.forEach((s) => {
      const method = s.paymentMethod;
      if (mobileMoneyStats[method]) {
        mobileMoneyStats[method].count += 1;
        mobileMoneyStats[method].total += s.amount || 0;
      }
    });

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

    // 7. Top Merchants by Sales Volume & GMV (Le commerce avec plus de ventes)
    const salesByTenant = await prisma.sale.groupBy({
      by: ["tenantId"],
      _count: { _all: true },
      _sum: { totalAmount: true },
      orderBy: {
        _sum: { totalAmount: "desc" },
      },
      take: 10,
    });

    const topMerchants = salesByTenant.map((item, index) => {
      const matchingTenant = tenants.find((t) => t.id === item.tenantId);
      const totalAmount = item._sum.totalAmount || 0;
      const salesCount = item._count._all || 0;
      const avgBasket = salesCount > 0 ? Math.round(totalAmount / salesCount) : 0;

      return {
        rank: index + 1,
        tenantId: item.tenantId,
        name: matchingTenant?.name || "Commerce Inconnu",
        slug: matchingTenant?.slug || "",
        plan: matchingTenant?.plan || "FREE",
        currency: matchingTenant?.currency || "CDF",
        isActive: matchingTenant?.isActive ?? true,
        salesCount,
        totalGmv: totalAmount,
        avgBasket,
        productsCount: matchingTenant?._count.products || 0,
        storesCount: matchingTenant?.stores.length || 1,
      };
    });

    // If there are tenants without sales yet, add them to complete the ranking
    if (topMerchants.length < 5) {
      const existingIds = new Set(topMerchants.map((m) => m.tenantId));
      tenants.forEach((t) => {
        if (!existingIds.has(t.id)) {
          topMerchants.push({
            rank: topMerchants.length + 1,
            tenantId: t.id,
            name: t.name,
            slug: t.slug,
            plan: t.plan,
            currency: t.currency || "CDF",
            isActive: t.isActive,
            salesCount: t._count.sales || 0,
            totalGmv: 0,
            avgBasket: 0,
            productsCount: t._count.products || 0,
            storesCount: t.stores.length || 1,
          });
        }
      });
    }

    // 8. Recent Sales
    const recentSales = await prisma.sale.findMany({
      take: 6,
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
          revenueByCurrency,
        },
        planStats,
        mobileMoneyStats,
        allSubscriptions,
        recentTenants: tenants.slice(0, 5),
        recentSubscriptions: allSubscriptions.slice(-10).reverse(),
        topMerchants: topMerchants.slice(0, 8),
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
