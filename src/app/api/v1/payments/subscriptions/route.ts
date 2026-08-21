import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: List all subscriptions and payment logs for a tenant
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Identifiant tenantId requis" },
        { status: 400 }
      );
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        plan: true,
        planStatus: true,
        planExpiresAt: true,
        currency: true,
        countryCode: true,
      },
    });

    return NextResponse.json({
      success: true,
      tenant,
      subscriptions,
    });
  } catch (error: any) {
    console.error("[Subscriptions API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
}
