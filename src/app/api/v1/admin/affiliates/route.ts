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

    const affiliates = await prisma.affiliate.findMany({
      include: {
        tenant: {
          include: {
            stores: { take: 1 },
            users: { where: { role: "OWNER" }, take: 1 },
          },
        },
        referrals: {
          include: {
            referredTenant: true,
          },
        },
        rewards: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalAffiliates = affiliates.length;
    const totalReferrals = affiliates.reduce((acc, a) => acc + a.referrals.length, 0);
    const activeReferrals = affiliates.reduce(
      (acc, a) => acc + a.referrals.filter((r) => r.status === "ACTIVE").length,
      0
    );
    const totalFreeMonthsGranted = affiliates.reduce((acc, a) => acc + a.freeMonthsEarned, 0);
    const totalCashPaidOut = affiliates.reduce((acc, a) => acc + a.totalCashEarned, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalAffiliates,
        totalReferrals,
        activeReferrals,
        conversionRate: totalReferrals > 0 ? Math.round((activeReferrals / totalReferrals) * 100) : 0,
        totalFreeMonthsGranted,
        totalCashPaidOut,
      },
      affiliates,
    });
  } catch (error: any) {
    console.error("[Admin Affiliates API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors du chargement des affiliés" },
      { status: 500 }
    );
  }
}
