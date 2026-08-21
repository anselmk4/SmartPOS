import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: List all products across network with filters and metrics
export async function GET(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tenantId = searchParams.get("tenantId") || "ALL";
    const storeId = searchParams.get("storeId") || "ALL";
    const category = searchParams.get("category") || "ALL";
    const lowStock = searchParams.get("lowStock") === "true";

    const whereClause: any = {};

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tenantId !== "ALL") {
      whereClause.tenantId = tenantId;
    }

    if (storeId !== "ALL") {
      whereClause.storeId = storeId;
    }

    if (category !== "ALL") {
      whereClause.category = category;
    }

    const [products, stores, tenants] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { updatedAt: "desc" },
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
          store: { select: { id: true, name: true } },
        },
      }),
      prisma.store.findMany({ select: { id: true, name: true, tenantId: true } }),
      prisma.tenant.findMany({ select: { id: true, name: true } }),
    ]);

    // Apply low stock filter if requested
    const filteredProducts = lowStock
      ? products.filter((p) => p.stockQuantity <= p.minStockAlert)
      : products;

    // Aggregates
    const totalStockValue = products.reduce(
      (acc, p) => acc + (p.stockQuantity || 0) * (p.costPrice || p.unitPrice * 0.8),
      0
    );
    const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;

    // Distinct categories
    const categoriesSet = new Set<string>();
    products.forEach((p) => {
      if (p.category) categoriesSet.add(p.category);
    });

    return NextResponse.json({
      success: true,
      data: {
        products: filteredProducts,
        stores,
        tenants,
        categories: Array.from(categoriesSet),
        totalStockValue,
        lowStockCount,
        total: filteredProducts.length,
      },
    });
  } catch (error: any) {
    console.error("[Admin Catalog GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération du catalogue" },
      { status: 500 }
    );
  }
}

// PUT: Update product price or stock directly in database
export async function PUT(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await req.json();
    const { id, unitPrice, costPrice, stockQuantity, minStockAlert, category, name, barcode } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID du produit requis" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (unitPrice !== undefined) updateData.unitPrice = Number(unitPrice);
    if (costPrice !== undefined) updateData.costPrice = Number(costPrice);
    if (stockQuantity !== undefined) updateData.stockQuantity = Number(stockQuantity);
    if (minStockAlert !== undefined) updateData.minStockAlert = Number(minStockAlert);
    if (category !== undefined) updateData.category = category.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (barcode !== undefined) updateData.barcode = barcode ? barcode.trim() : null;

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Article "${updated.name}" mis à jour avec succès dans Supabase`,
      data: updated,
    });
  } catch (error: any) {
    console.error("[Admin Catalog PUT Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la modification de l'article" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a product from network catalog
export async function DELETE(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID du produit requis" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Article introuvable" },
        { status: 404 }
      );
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Article "${product.name}" supprimé de Supabase`,
    });
  } catch (error: any) {
    console.error("[Admin Catalog DELETE Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la suppression de l'article" },
      { status: 500 }
    );
  }
}
