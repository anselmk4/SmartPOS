import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: Fetch real subscriptions list with filtering & KPIs
export async function GET(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const { searchParams } = new URL(req.url);
    const operator = searchParams.get("operator") || "ALL";
    const plan = searchParams.get("plan") || "ALL";
    const tenantId = searchParams.get("tenantId") || "ALL";

    const whereClause: any = {};

    if (operator !== "ALL") {
      whereClause.paymentMethod = operator;
    }

    if (plan !== "ALL") {
      whereClause.plan = plan;
    }

    if (tenantId !== "ALL") {
      whereClause.tenantId = tenantId;
    }

    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            plan: true,
            planStatus: true,
            planExpiresAt: true,
          },
        },
      },
    });

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        isActive: true,
      },
    });

    // Compute MRR & Total collected
    const totalCollected = subscriptions.reduce((acc, s) => acc + (s.amount || 0), 0);
    const mrrTotal = tenants.reduce((acc, t) => {
      if (!t.isActive) return acc;
      if (t.plan === "PRO") return acc + 15000;
      if (t.plan === "BUSINESS") return acc + 45000;
      if (t.plan === "BASIC") return acc + 5000;
      return acc;
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        tenants,
        totalCollected,
        mrrTotal,
        total: subscriptions.length,
      },
    });
  } catch (error: any) {
    console.error("[Admin Subscriptions GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération des abonnements" },
      { status: 500 }
    );
  }
}

// POST: Add a new subscription payment and update tenant plan
export async function POST(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await req.json();
    const {
      tenantId,
      plan = "PRO",
      amount = 30000,
      currency,
      paymentMethod = "CASH",
      transactionId,
      durationDays,
      durationMonths = 1,
      isFree = false,
    } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "La boutique est requise" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Boutique introuvable" },
        { status: 404 }
      );
    }

    const now = new Date();
    const periodStart = now;
    
    // Compute periodEnd
    let periodEnd: Date;
    if (durationMonths) {
      const future = new Date(now);
      future.setMonth(future.getMonth() + Math.max(1, Number(durationMonths)));
      periodEnd = future;
    } else {
      const days = Number(durationDays) || 30;
      periodEnd = new Date(now.getTime() + days * 86400000);
    }

    const finalAmount = isFree ? 0 : Math.max(0, Number(amount) || 0);
    const finalCurrency = currency || tenant.currency || "CDF";
    const txRef =
      transactionId?.trim() ||
      `FAC-SUB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(100000 + Math.random() * 900000)}`;

    const [subscription, updatedTenant] = await prisma.$transaction([
      prisma.subscription.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          plan: plan as any,
          amount: finalAmount,
          currency: finalCurrency,
          paymentMethod: paymentMethod as any,
          paymentStatus: "ACTIVE",
          transactionId: txRef,
          periodStart,
          periodEnd,
          createdAt: now,
        },
      }),
      prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: plan as any,
          planStatus: "ACTIVE",
          planExpiresAt: periodEnd,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Abonnement ${plan} pour "${tenant.name}" enregistré (${isFree ? "Gratuit" : `${finalAmount} ${finalCurrency}`}). Facture N° ${txRef} générée.`,
      data: { subscription, updatedTenant },
    });
  } catch (error: any) {
    console.error("[Admin Subscriptions POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'enregistrement du paiement" },
      { status: 500 }
    );
  }
}

// PUT: Update subscription status
export async function PUT(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await req.json();
    const { id, paymentStatus } = body;

    if (!id || !paymentStatus) {
      return NextResponse.json(
        { success: false, error: "ID et statut requis" },
        { status: 400 }
      );
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: { paymentStatus },
    });

    return NextResponse.json({
      success: true,
      message: "Statut de l'abonnement mis à jour",
      data: updated,
    });
  } catch (error: any) {
    console.error("[Admin Subscriptions PUT Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la mise à jour de l'abonnement" },
      { status: 500 }
    );
  }
}
