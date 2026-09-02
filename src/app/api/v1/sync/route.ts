import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SyncPushRequestSchema } from "@/lib/shared/schemas";
import type { SyncPushResponse, StockDeltaPayload } from "@/lib/shared/types";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { verifySessionToken, createSessionToken } from "@/lib/security/jwt";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function sanitizeSyncPrice(val: any): number {
  if (val === null || val === undefined || isNaN(Number(val))) return 0;
  let clean = Number(val);
  while (clean > 250000) {
    clean = Math.round(clean / 2850);
  }
  return Math.max(0, clean);
}

function sanitizeSyncDebt(val: any): number {
  if (val === null || val === undefined || isNaN(Number(val))) return 0;
  let clean = Number(val);
  while (clean > 250000) {
    clean = Math.round(clean / 2850);
  }
  return Math.max(0, clean);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    // Rate Limit: 120 sync requests per minute per IP
    const rateLimit = checkRateLimit(`sync:${ip}`, {
      limit: 120,
      windowMs: 60 * 1000,
      blockDurationMs: 5 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: rateLimit.message },
        { status: 429 }
      );
    }

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
    const storeId: string = rawData.storeId;
    let tenantId: string = rawData.tenantId || "00000000-0000-4000-8000-000000000000";

    let isDbConnected = true;
    try {
      if (!process.env.DATABASE_URL) {
        isDbConnected = false;
      } else if (storeId) {
        // If the store already exists in PostgreSQL, prioritize its real tenant
        const existingStore = await prisma.store.findUnique({
          where: { id: storeId },
          select: { tenantId: true },
        });
        if (existingStore?.tenantId) {
          tenantId = existingStore.tenantId;
        }
      }
    } catch {
      isDbConnected = false;
    }

    let refreshedToken: string | undefined = undefined;

    // Strict JWT session token validation
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Non authentifié : Token de session Bearer manquant pour la synchronisation" },
        { status: 401 }
      );
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session expirée ou invalide : Veuillez vous reconnecter à votre caisse" },
        { status: 401 }
      );
    }

    if (session.tenantId !== "global-platform-admin" && session.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Accès refusé : Session non autorisée pour cette organisation" },
        { status: 403 }
      );
    }

    const lastPulledAt = rawData.lastPulledAt || undefined;
    const mutations = rawData.mutations;
    const syncedIds: string[] = [];
    const failedIds: Array<{ id: string; error: string }> = [];
    const now = new Date();

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
          update: {
            tenantId,
          },
          create: {
            id: storeId,
            tenantId,
            name: "Boutique Principale",
            currency: "CDF",
            createdAt: now,
            updatedAt: now,
          },
        });
      } catch (upsertErr) {
        console.warn("[Sync] Tenant/Store auto-upsert error:", upsertErr);
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
            const cleanUnitPrice = data.unitPrice !== undefined ? sanitizeSyncPrice(data.unitPrice) : undefined;
            const cleanCostPrice = data.costPrice !== undefined ? sanitizeSyncPrice(data.costPrice) : undefined;

            await prisma.product.upsert({
              where: { id: data.id },
              update: {
                name: data.name ?? undefined,
                unitPrice: cleanUnitPrice,
                costPrice: cleanCostPrice,
                stockQuantity: data.stockQuantity !== undefined ? data.stockQuantity : undefined,
                minStockAlert: data.minStockAlert !== undefined ? data.minStockAlert : undefined,
                category: data.category ?? undefined,
                barcode: data.barcode !== undefined ? data.barcode : undefined,
                imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
                isSynced: true,
                updatedAt: now,
              },
              create: {
                id: data.id,
                tenantId: data.tenantId || tenantId,
                storeId: data.storeId || storeId,
                name: data.name || "Article",
                unitPrice: cleanUnitPrice ?? 0,
                costPrice: cleanCostPrice ?? 0,
                stockQuantity: data.stockQuantity ?? 0,
                minStockAlert: data.minStockAlert ?? 5,
                category: data.category ?? "Général",
                barcode: data.barcode || null,
                imageUrl: data.imageUrl || null,
                isSynced: true,
                createdAt: new Date(data.createdAt || now),
                updatedAt: now,
              },
            });
            syncedIds.push(id);
          } else if (entity === "customer" && (action === "CREATE" || action === "UPDATE")) {
            const cleanDebt = data.currentDebtBalance !== undefined ? sanitizeSyncDebt(data.currentDebtBalance) : undefined;

            await prisma.customer.upsert({
              where: { id: data.id },
              update: {
                name: data.name ?? undefined,
                phone: data.phone !== undefined ? data.phone : undefined,
                currentDebtBalance: cleanDebt,
                isSynced: true,
                updatedAt: now,
              },
              create: {
                id: data.id,
                tenantId: data.tenantId || tenantId,
                storeId: data.storeId || storeId,
                name: data.name || "Client",
                phone: data.phone || null,
                currentDebtBalance: cleanDebt ?? 0,
                isSynced: true,
                createdAt: new Date(data.createdAt || now),
                updatedAt: now,
              },
            });
            syncedIds.push(id);
          } else if (entity === "sale" && action === "CREATE") {
            // Resolve effective tenantId from Store in Postgres
            const targetStoreId = data.storeId || storeId;
            let resolvedTenantId = data.tenantId || tenantId;
            if (targetStoreId) {
              const storeRecord = await prisma.store.findUnique({
                where: { id: targetStoreId },
                select: { tenantId: true },
              });
              if (storeRecord?.tenantId) {
                resolvedTenantId = storeRecord.tenantId;
              }
            }

            // 1. Ensure customer exists if customerId is provided
            let validCustomerId: string | null = null;
            if (data.customerId) {
              try {
                const cust = await prisma.customer.upsert({
                  where: { id: data.customerId },
                  update: {
                    tenantId: resolvedTenantId,
                  },
                  create: {
                    id: data.customerId,
                    tenantId: resolvedTenantId,
                    storeId: targetStoreId,
                    name: data.customerName || "Client",
                    createdAt: new Date(data.createdAt || now),
                    updatedAt: now,
                  },
                });
                validCustomerId = cust.id;
              } catch {
                validCustomerId = null;
              }
            }

            // 2. Ensure user exists if userId is provided
            let validUserId: string | null = null;
            if (data.userId) {
              try {
                const usr = await prisma.user.findUnique({ where: { id: data.userId } });
                if (usr) validUserId = usr.id;
              } catch {
                validUserId = null;
              }
            }

            // 3. Ensure products exist for all items to prevent foreign key errors
            const validItems: any[] = [];
            if (data.items && Array.isArray(data.items)) {
              for (const it of data.items) {
                const prodId = it.productId || it.product?.id || it.id;
                if (prodId) {
                  try {
                    await prisma.product.upsert({
                      where: { id: prodId },
                      update: {
                        tenantId: resolvedTenantId,
                      },
                      create: {
                        id: prodId,
                        tenantId: resolvedTenantId,
                        storeId: targetStoreId,
                        name: it.productName || it.product?.name || "Produit synchronisé",
                        unitPrice: it.unitPrice || 0,
                        costPrice: it.costPrice || 0,
                        stockQuantity: 0,
                        category: "Général",
                        createdAt: new Date(it.createdAt || now),
                        updatedAt: now,
                      },
                    });
                    validItems.push({
                      id: it.id || undefined,
                      productId: prodId,
                      quantity: it.quantity || 1,
                      unitPrice: it.unitPrice || 0,
                      costPrice: it.costPrice ?? 0,
                      createdAt: new Date(it.createdAt || now),
                    });
                  } catch (itemErr) {
                    console.warn("[Sync] Ensure item product failed:", itemErr);
                  }
                }
              }
            }

            // 4. Validate paymentMethod
            const validPaymentMethods = [
              "CASH", "MPESA", "AIRTEL_MONEY", "ORANGE_MONEY", "AFRIMONEY",
              "ILLICOCASH", "EQUITY_BCDC", "PEPELE_MOBILE",
              "WAVE", "MTN_MOMO", "MOOV_MONEY", "CREDIT", "CARD", "MIXED"
            ];
            const paymentMethod = validPaymentMethods.includes(data.paymentMethod)
              ? data.paymentMethod
              : "CASH";

            // 5. Upsert the sale with guaranteed correct tenantId
            await prisma.sale.upsert({
              where: { id: data.id },
              update: {
                tenantId: resolvedTenantId,
                storeId: targetStoreId,
                status: data.status || "COMPLETED",
                isSynced: true,
                updatedAt: now,
              },
              create: {
                id: data.id,
                tenantId: resolvedTenantId,
                storeId: targetStoreId,
                customerId: validCustomerId,
                userId: validUserId,
                totalAmount: data.totalAmount || 0,
                amountPaid: data.amountPaid || 0,
                debtAmount: data.debtAmount ?? 0,
                paymentMethod,
                status: data.status || "COMPLETED",
                receiptNumber: data.receiptNumber,
                notes: data.notes,
                isSynced: true,
                createdAt: new Date(data.createdAt || now),
                updatedAt: now,
                items: validItems.length > 0 ? {
                  create: validItems,
                } : undefined,
              },
            });
            syncedIds.push(id);
          } else if (entity === "debt_payment" && action === "CREATE") {
            if (data.customerId) {
              await prisma.customer.upsert({
                where: { id: data.customerId },
                update: {},
                create: {
                  id: data.customerId,
                  tenantId: data.tenantId || tenantId,
                  storeId: data.storeId || storeId,
                  name: data.customerName || "Client",
                  createdAt: new Date(data.createdAt || now),
                  updatedAt: now,
                },
              }).catch(() => {});
            }

            const validPaymentMethods = [
              "CASH", "MPESA", "AIRTEL_MONEY", "ORANGE_MONEY", "AFRIMONEY",
              "ILLICOCASH", "EQUITY_BCDC", "PEPELE_MOBILE",
              "WAVE", "MTN_MOMO", "MOOV_MONEY", "CREDIT", "CARD", "MIXED"
            ];
            const paymentMethod = validPaymentMethods.includes(data.paymentMethod)
              ? data.paymentMethod
              : "CASH";

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
                paymentMethod,
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
            const requestedRole = data.role || "CASHIER";
            try {
              await prisma.user.upsert({
                where: { id: data.id },
                update: {
                  name: data.name,
                  phone: data.phone,
                  email: data.email,
                  pinCode: data.pinCode,
                  role: requestedRole,
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
                  role: requestedRole,
                  isActive: data.isActive !== undefined ? data.isActive : true,
                  createdAt: new Date(data.createdAt || now),
                  updatedAt: now,
                },
              });
            } catch (userUpsertErr: any) {
              // If remote Postgres database has not yet added WAITER to UserRole enum, fallback safely to CASHIER
              if (requestedRole === "WAITER" || userUpsertErr?.message?.includes("UserRole")) {
                await prisma.user.upsert({
                  where: { id: data.id },
                  update: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    pinCode: data.pinCode,
                    role: "CASHIER",
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
                    role: "CASHIER",
                    isActive: data.isActive !== undefined ? data.isActive : true,
                    createdAt: new Date(data.createdAt || now),
                    updatedAt: now,
                  },
                });
              } else {
                throw userUpsertErr;
              }
            }
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
        const [updatedProducts, updatedCustomers, updatedSales, updatedPayments, updatedTenant, updatedStores] =
          await Promise.all([
            prisma.product.findMany({
              where: { tenantId, storeId, updatedAt: { gt: pullSince } },
            }),
            prisma.customer.findMany({
              where: { tenantId, storeId, updatedAt: { gt: pullSince } },
            }),
            prisma.sale.findMany({
              where: { tenantId, storeId, updatedAt: { gt: pullSince } },
              include: {
                items: {
                  include: {
                    product: { select: { name: true } },
                  },
                },
              },
            }),
            prisma.debtPayment.findMany({
              where: { tenantId, storeId, updatedAt: { gt: pullSince } },
            }),
            prisma.tenant.findUnique({
              where: { id: tenantId },
            }),
            prisma.store.findMany({
              where: { tenantId },
            }),
          ]);

        updates = {
          tenant: updatedTenant ? {
            ...updatedTenant,
            createdAt: updatedTenant.createdAt.toISOString(),
            updatedAt: updatedTenant.updatedAt.toISOString(),
            planExpiresAt: updatedTenant.planExpiresAt ? updatedTenant.planExpiresAt.toISOString() : undefined,
          } as any : undefined,
          stores: updatedStores ? updatedStores.map((s) => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })) : undefined,
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
          sales: updatedSales.map((s: any) => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
            items: s.items?.map((it: any) => ({
              id: it.id,
              saleId: it.saleId,
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              costPrice: it.costPrice,
              productName: it.product?.name || it.productName || "Article",
              createdAt: it.createdAt.toISOString(),
            })),
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

    const responsePayload: SyncPushResponse & { refreshedToken?: string } = {
      success: true,
      syncedIds,
      failedIds: failedIds.length > 0 ? failedIds : undefined,
      serverTime: now.toISOString(),
      updates: Object.keys(updates).length > 0 ? updates : undefined,
      refreshedToken,
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
