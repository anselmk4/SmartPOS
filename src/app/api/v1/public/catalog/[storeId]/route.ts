import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";
export const revalidate = 60; // 1 minute ISR / CDN cache
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const storeParam = params.storeId?.trim();

    if (!storeParam) {
      return NextResponse.json(
        { success: false, error: "Identifiant de boutique manquant" },
        { status: 400 }
      );
    }

    // Rate limiting: 120 requests per minute per IP for public catalog
    const rateLimit = checkRateLimit(`public-catalog:${ip}`, {
      limit: 120,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Trop de requêtes, veuillez réessayer dans un instant." },
        { status: 429 }
      );
    }

    // Attempt to locate the store by ID or by tenant slug / ID
    let store = null;
    try {
      store = await prisma.store.findFirst({
        where: {
          OR: [
            { id: storeParam },
            { tenant: { slug: storeParam } },
            { tenantId: storeParam },
          ],
        },
        select: {
          id: true,
          name: true,
          businessType: true,
          currency: true,
          phone: true,
          address: true,
          ownerName: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              countryCode: true,
              currency: true,
              businessType: true,
            },
          },
        },
      });
    } catch (dbErr: any) {
      console.warn("[PublicCatalog API] Database lookup warning:", dbErr?.message);
    }

    if (!store) {
      return NextResponse.json(
        {
          success: false,
          error: "Boutique introuvable ou le lien a expiré.",
        },
        { status: 404 }
      );
    }

    // Fetch active products with public fields ONLY
    // Strictly omit stockQuantity, costPrice, and minStockAlert
    let products: any[] = [];
    try {
      products = await prisma.product.findMany({
        where: {
          storeId: store.id,
        },
        select: {
          id: true,
          name: true,
          unitPrice: true,
          category: true,
          imageUrl: true,
          barcode: true,
          createdAt: true,
        },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
    } catch (prodErr: any) {
      console.warn("[PublicCatalog API] Products lookup warning:", prodErr?.message);
    }

    // Collect unique categories
    const categoriesSet = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        categoriesSet.add(p.category.trim());
      }
    });
    const categories = Array.from(categoriesSet).sort();

    return NextResponse.json(
      {
        success: true,
        store: {
          id: store.id,
          name: store.name,
          businessType: store.businessType || store.tenant?.businessType || "Commerce Général",
          currency: store.currency || store.tenant?.currency || "CDF",
          phone: store.phone,
          address: store.address,
          ownerName: store.ownerName,
          countryCode: store.tenant?.countryCode || "CD",
        },
        categories,
        products,
        totalProducts: products.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("[PublicCatalog API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de charger le catalogue de la boutique.",
      },
      { status: 500 }
    );
  }
}
