import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, pinCode, mode = "phone_or_email" } = body;

    if (!identifier && !pinCode) {
      return NextResponse.json(
        { success: false, error: "Identifiant ou code PIN requis" },
        { status: 400 }
      );
    }

    const cleanInput = (identifier || "").trim();
    const cleanDigits = cleanInput.replace(/\D/g, "");
    const cleanPin = (pinCode || "").trim();

    // 1. Search User in Supabase PostgreSQL
    let user: any = null;

    if (mode === "pin" && cleanPin) {
      // Find active user with this PIN
      user = await prisma.user.findFirst({
        where: {
          pinCode: cleanPin,
          isActive: true,
        },
        include: {
          tenant: true,
        },
      });
    } else {
      // Find all potential matching users by phone or email
      const potentialUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { email: { equals: cleanInput, mode: "insensitive" } },
            { phone: { contains: cleanInput } },
            { phone: { contains: cleanDigits.length >= 7 ? cleanDigits.slice(-7) : cleanDigits } },
          ],
        },
        include: {
          tenant: true,
        },
      });

      // Match PIN or password if provided
      if (potentialUsers.length > 0) {
        if (cleanPin) {
          user = potentialUsers.find((u) => u.pinCode === cleanPin) || potentialUsers[0];
        } else {
          user = potentialUsers[0];
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun compte trouvé avec ce numéro ou cet email. Vérifiez vos identifiants ou créez une boutique.",
        },
        { status: 404 }
      );
    }

    // Verify PIN if required
    if (cleanPin && user.pinCode && user.pinCode !== cleanPin) {
      return NextResponse.json(
        { success: false, error: "Code PIN incorrect pour ce compte" },
        { status: 401 }
      );
    }

    const tenantId = user.tenantId;

    // 2. Fetch full tenant ecosystem for instant offline-first bootstrapping
    const [stores, allUsers, products, customers, recentSales] = await Promise.all([
      prisma.store.findMany({ where: { tenantId } }),
      prisma.user.findMany({ where: { tenantId, isActive: true } }),
      prisma.product.findMany({ where: { tenantId } }),
      prisma.customer.findMany({ where: { tenantId } }),
      prisma.sale.findMany({
        where: { tenantId },
        take: 100,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        storeId: user.storeId,
        name: user.name,
        phone: user.phone,
        email: user.email,
        pinCode: user.pinCode,
        role: user.role,
        isActive: user.isActive,
      },
      tenant: user.tenant,
      stores,
      users: allUsers,
      products,
      customers,
      sales: recentSales,
      message: `Connexion réussie ! Bienvenue sur votre boutique ${user.tenant?.name || user.name}`,
    });
  } catch (error: any) {
    console.error("[Auth Login API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur de connexion au serveur" },
      { status: 500 }
    );
  }
}
