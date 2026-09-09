import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenantId est requis" },
        { status: 400 }
      );
    }

    const rateLimit = checkRateLimit(`terminal-users:${ip}:${tenantId}`, {
      limit: 60,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Trop de requêtes, veuillez patienter." },
        { status: 429 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          where: { isActive: true },
          select: {
            id: true,
            tenantId: true,
            storeId: true,
            name: true,
            phone: true,
            email: true,
            pinCode: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [
            { role: "asc" },
            { name: "asc" },
          ],
        },
        stores: {
          select: {
            id: true,
            tenantId: true,
            name: true,
            businessType: true,
            currency: true,
            phone: true,
            address: true,
            ownerName: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Boutique non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        phone: tenant.phone,
        businessType: tenant.businessType,
        currency: tenant.currency,
        isActive: tenant.isActive,
      },
      stores: tenant.stores,
      users: tenant.users,
    });
  } catch (error: any) {
    console.error("[API Terminal Users Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
