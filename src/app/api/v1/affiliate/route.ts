import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/security/jwt";
import {
  getAffiliateDashboardData,
  getOrCreateAffiliate,
} from "@/lib/services/affiliate-service";
import type { PaymentMethod } from "@/lib/shared/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.replace(/^Bearer\s+/i, "");
    const cookieToken = req.cookies.get("kuettu_session_token")?.value;
    const token = bearerToken || cookieToken || "";

    let tenantId = searchParams.get("tenantId") || "";
    let userId = searchParams.get("userId") || undefined;

    if (token) {
      const decoded = verifySessionToken(token);
      if (decoded && decoded.tenantId) {
        tenantId = decoded.tenantId;
        userId = decoded.userId;
      }
    }

    if (!tenantId) {
      // Look up first available tenant if in development or single-tenant local session
      const fallbackTenant = await prisma.tenant.findFirst({
        orderBy: { createdAt: "desc" },
      });
      if (fallbackTenant) {
        tenantId = fallbackTenant.id;
      } else {
        return NextResponse.json(
          { success: false, error: "Commerce / Tenant ID manquant ou session expirée" },
          { status: 401 }
        );
      }
    }

    const host = req.headers.get("host") || "globalpos.africa";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const baseUrl = `${protocol}://${host}`;

    const data = await getAffiliateDashboardData(tenantId, userId, baseUrl);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("[Affiliate GET API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération des données d'affiliation" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, payoutPhone, payoutPaymentMethod } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Identifiant de commerce (tenantId) requis" },
        { status: 400 }
      );
    }

    const affiliate = await getOrCreateAffiliate(tenantId);

    const updated = await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        payoutPhone: payoutPhone !== undefined ? String(payoutPhone).trim() : undefined,
        payoutPaymentMethod: (payoutPaymentMethod as PaymentMethod) || undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Coordonnées de paiement des commissions mises à jour !",
      affiliate: updated,
    });
  } catch (error: any) {
    console.error("[Affiliate POST API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la mise à jour du profil affilié" },
      { status: 500 }
    );
  }
}
