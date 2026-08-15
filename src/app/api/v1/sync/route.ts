import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SyncPushRequestSchema } from "@/lib/shared/schemas";
import type { SyncPushResponse, StockDeltaPayload } from "@/lib/shared/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = SyncPushRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload de synchronisation SaaS invalide",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const rawData = parseResult.data;
    const tenantId: string = rawData.tenantId || "00000000-0000-4000-8000-000000000000";
    const storeId: string = rawData.storeId;
    const lastPulledAt = rawData.lastPulledAt || undefined;
    const mutations = rawData.mutations;
    const syncedIds: string[] = [];
    const failedIds: Array<{ id: string; error: string }> = [];
    const now = new Date();

    let isDbConnected = true;
    try {
      if (!process.env.DATABASE_URL) {
        isDbConnected = false;
      }
    } catch {
      isDbConnected = false;
    }

    if (isDbConnected) {
      // Auto-ensure tenant and store exist in database to prevent foreign key violations
      try {
        await prisma.tenant.upsert({
          where: { id: tenantId },
          update: {},
          create: {
            id: tenantId,
            name: "Organisation Client",
            slug: `tenant-${tenantId.substring(0, 8)}`,
            countryCode: "CD",
            currency: "CDF",
            plan: "PRO",
            planStatus: "ACTIVE",
            createdAt: now,
            updatedAt: now,
          },
        });

        await prisma.store.upsert({
          where: { id: storeId },
          update: {},
          create: {
            id: storeId,
            tenantId,
            name: "Boutique Principale",
            currency: "CDF",
            createdAt: now,
            updatedAt: now,
          },
        });
      } catch (e) {
        console.warn("[Sync] Ensure tenant/store fallback:", e);
      }

      for (const mutation of mutations) {
        try {
          const { id, entity, action, data } = mutation;

          if (entity === "product" && action === "STOCK_DELTA") {
            const payload = data as StockDeltaPayload;
            await prisma.product.upsert({
              where: { id: payload.productId },
              update: {
                stockQuantity: {
                  increment: payload.deltaQuantity,
                },
                updatedAt: now,
                isSynced: true,
              },
              create: {
                id: payload.productId,
                tenantId: payload.tenantId || tenantId,
                storeId: payload.storeId || storeId,
                name: "Produit synchronisé",
                unitPrice: 0,
                costPrice: 0,
                stockQuantity: Math.max(0, payload.deltaQuantity),
                category: "Général",
                isSynced: true,
                createdAt: now,
                updatedAt: now,
              },
            });
            syncedIds.push(id);
          } else if (entity === "product" && (action === "CREATE" || action === "UPDATE")) {
            await prisma.product.upsert({
              where: { id: data.id },
              update: {
                name: data.name,
                unitPrice: data.unitPrice,
                costPrice: data.costPrice ?? 0,
                stockQuantity: data.stockQuantity,
                minStockAlert: data.minStockAlert ?? 5,
                category: data.category ?? "Général",
                barcode: data.barcode,
                imageUrl: data.imageUrl,
                isSynced: true,
                updatedAt: now,
              },
              create: {
                id: data.id,
                tenantId: data.tenantId || tenantId,
                storeId: data.storeId || storeId,
                name: data.name,
                unitPrice: data.unitPrice,
                costPrice: data.costPrice ?? 0,
                stockQuantity: data.stockQuantity,
                minStockAlert: data.minStockAlert ?? 5,
                category: data.category ?? "Général",
                barcode: data.barcode,
                imageUrl: data.imageUrl,
                isSynced: true,
                createdAt: new Date(data.createdAt || now),
                updatedAt: now,
              },
            });
            syncedIds.push(id);
          } else if (entity === "customer" && (action === "CREATE" || action === "UPDATE")) {
            await prisma.customer.upsert({
              where: { id: data.id },
              update: {
                name: data.name ?? undefined,
                phone: data.phone ?? undefined,
                currentDebtBalance: data.currentDebtBalance ?? undefined,
                isSynced: true,
                updatedAt: now,
              },
              create: {
                id: data.id,
                tenantId: data.tenantId || tenantId,
                storeId: data.storeId || storeId,
                name: data.name,
                phone: data.phone,
                currentDebtBalance: data.currentDebtBalance ?? 0,
                isSynced: true,
                createdAt: new Date(data.createdAt || now),
                updatedAt: now,
              },
            });
            syncedIds.push(id);
          } else if (entity === "sale" && action === "CREATE") {
            await prisma.sale.upsert({
              where: { id: data.id },
              update: {
                status: data.status,
                isSynced: true,
                updatedAt: now,
              },
              create: {
                id: data.id,
                tenantId: data.tenantId || tenantId,
                storeId: data.storeId || storeId,
                customerId: data.customerId || null,
                userId: data.userId || null,
                totalAmount: data.totalAmount,
                amountPaid: data.amountPaid,
                debtAmount: data.debtAmount ?? 0,
                paymentMethod: data.paymentMethod || "CASH",
                status: data.status || "COMPLETED",
                receiptNumber: data.receiptNumber,
                notes: data.notes,
                isSynced: true,
                createdAt: new Date(data.createdAt || now),
                updatedAt: now,
                items: data.items && Array.isArray(data.items) ? {
                  create: data.items.map((it: any) => ({
                    id: it.id,
                    productId: it.productId,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    costPrice: it.costPrice ?? 0,
                    createdAt: new Date(it.createdAt || now),
                  })),
                } : undefined,
              },
            });
            syncedIds.push(id);
          } else if (entity === "debt_payment" && action === "CREATE") {
            await prisma.debtPayment.upsert({
              where: { id: data.id },
              update: {
                isSynced: true,
                updatedAt: now,
              },
              create: {
                id: data.id,
                tenantId: data.tenantId || tenantId,
                storeId: data.storeId || storeId,
                customerId: data.customerId,
                amount: data.amount,
                paymentMethod: data.paymentMethod || "CASH",
                notes: data.notes,
                isSynced: true,
                createdAt: new Date(data.createdAt || now),
                updatedAt: now,
              },
            });
            syncedIds.push(id);
          } else if (entity === "tenant" && (action === "CREATE" || action === "UPDATE")) {
            await prisma.tenant.upsert({
              where: { id: data.id },
              update: {
                name: data.name,
                plan: data.plan,
                planStatus: data.planStatus,
                phone: data.phone,
                updatedAt: now,
              },
              create: {
                id: data.id,
                name: data.name,
                slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                countryCode: data.countryCode || "CD",
                currency: data.currency || "CDF",
                plan: data.plan || "PRO",
                planStatus: data.planStatus || "ACTIVE",
                phone: data.phone,
                createdAt: new Date(data.createdAt || now),
                updatedAt: now,
              },
            });
            syncedIds.push(id);
          } else if (entity === "store" && (action === "CREATE" || action === "UPDATE")) {
            await prisma.store.upsert({
              where: { id: data.id },
              update: {
                name: data.name,
                currency: data.currency ?? "CDF",
                phone: data.phone,
                address: data.address,
                ownerName: data.ownerName,
                updatedAt: now,
              },
              create: {
                id: data.id,
                tenantId: data.tenantId || tenantId,
                name: data.name,
                currency: data.currency || "CDF",
                phone: data.phone,
                address: data.address,
                ownerName: data.ownerName,
                createdAt: new Date(data.createdAt || now),
                updatedAt: now,
              },
            });
            syncedIds.push(id);
          } else if (entity === "user" && (action === "CREATE" || action === "UPDATE")) {
            await prisma.user.upsert({
              where: { id: data.id },
              update: {
                name: data.name,
                phone: data.phone,
                email: data.email,
                pinCode: data.pinCode,
                role: data.role || "CASHIER",
                isActive: data.isActive !== undefined ? data.isActive : true,
                updatedAt: now,
              },
              create: {
                id: data.id,
                tenantId: data.tenantId || tenantId,
                name: data.name,
                phone: data.phone,
                email: data.email,
                pinCode: data.pinCode,
                role: data.role || "CASHIER",
                isActive: data.isActive !== undefined ? data.isActive : true,
                createdAt: new Date(data.createdAt || now),
                updatedAt: now,
              },
            });
            syncedIds.push(id);
          } else {
            // For other local entities (expense, stock_transfer, cash_closing, etc.), mark as synced
            syncedIds.push(id);
          }
        } catch (itemErr: any) {
          failedIds.push({
            id: mutation.id,
            error: itemErr.message || "Erreur de traitement de la mutation",
          });
        }
      }
    } else {
      for (const m of mutations) {
        syncedIds.push(m.id);
      }
    }

    // Pull updates for this specific Tenant since lastPulledAt
    let updates: any = {};
    if (isDbConnected && lastPulledAt) {
      try {
        const pullSince = new Date(lastPulledAt);
        const [updatedProducts, updatedCustomers, updatedSales, updatedPayments] =
          await Promise.all([
            prisma.product.findMany({
              where: { tenantId, storeId, updatedAt: { gt: pullSince } },
            }),
            prisma.customer.findMany({
              where: { tenantId, storeId, updatedAt: { gt: pullSince } },
            }),
            prisma.sale.findMany({
              where: { tenantId, storeId, updatedAt: { gt: pullSince } },
              include: { items: true },
            }),
            prisma.debtPayment.findMany({
              where: { tenantId, storeId, updatedAt: { gt: pullSince } },
            }),
          ]);

        updates = {
          products: updatedProducts.map((p) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          })),
          customers: updatedCustomers.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          })),
          sales: updatedSales.map((s) => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
          debtPayments: updatedPayments.map((dp) => ({
            ...dp,
            createdAt: dp.createdAt.toISOString(),
            updatedAt: dp.updatedAt.toISOString(),
          })),
        };
      } catch (pullErr) {
        console.warn("Pull queries failed:", pullErr);
      }
    }

    const responsePayload: SyncPushResponse = {
      success: true,
      syncedIds,
      failedIds: failedIds.length > 0 ? failedIds : undefined,
      serverTime: now.toISOString(),
      updates: Object.keys(updates).length > 0 ? updates : undefined,
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("API SaaS /api/v1/sync Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur interne lors de la synchronisation",
      },
      { status: 500 }
    );
  }
}
