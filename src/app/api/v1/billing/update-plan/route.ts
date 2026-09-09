import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/security/jwt";
import { verifySuperAdmin } from "@/lib/admin/admin-guard";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/shared/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "") || req.cookies.get("kuettu_session_token")?.value;

    const body = await req.json();
    const { tenantId, plan, planStatus = "ACTIVE" } = body;

    if (!tenantId || !plan) {
      return NextResponse.json(
        { success: false, error: "Identifiants tenantId et plan requis" },
        { status: 400 }
      );
    }

    // 1. Check if caller is Super Admin
    const superAdminAuth = verifySuperAdmin(req);
    let isSuperAdmin = superAdminAuth.authenticated;

    // 2. If not super admin, check if caller is the verified OWNER of this tenant
    if (!isSuperAdmin) {
      if (!token) {
        return NextResponse.json(
          { success: false, error: "Non autorisé : Session requise pour modifier le forfait" },
          { status: 401 }
        );
      }

      const session = verifySessionToken(token);
      if (!session || (session.tenantId !== tenantId && session.role !== "SUPER_ADMIN")) {
        return NextResponse.json(
          { success: false, error: "Accès refusé : Vous n'avez pas les droits de gestion sur cette organisation" },
          { status: 403 }
        );
      }

      if (session.role !== "OWNER") {
        return NextResponse.json(
          { success: false, error: "Accès refusé : Rôle Propriétaire requis" },
          { status: 403 }
        );
      }
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const targetStatus = (planStatus || "ACTIVE") as SubscriptionStatus;

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: plan as SubscriptionPlan,
        planStatus: targetStatus,
        planExpiresAt: plan === "FREE" ? null : periodEnd,
        updatedAt: now,
      },
      include: { stores: true, users: true },
    });

    // Create or update subscription record in PostgreSQL
    if (plan !== "FREE") {
      await prisma.subscription.create({
        data: {
          tenantId,
          plan: plan as SubscriptionPlan,
          amount: plan === "BUSINESS" ? 15 : plan === "PRO" ? 10 : 5,
          currency: "USD",
          paymentMethod: "CASH",
          paymentStatus: "ACTIVE",
          transactionId: `sub-manual-${Date.now()}`,
          periodStart: now,
          periodEnd,
        },
      }).catch((subErr) => {
        console.warn("[Billing Update Plan] Subscription insert note:", subErr.message);
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Forfait ${plan} activé avec succès.`,
    });
  } catch (error: any) {
    console.error("[Update Plan API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la mise à jour du forfait" },
      { status: 500 }
    );
  }
}
