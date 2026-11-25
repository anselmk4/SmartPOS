import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type AuditLogType =
  | "REGISTRATION"
  | "SALE"
  | "PRODUCT"
  | "SUBSCRIPTION"
  | "DEBT"
  | "USER"
  | "SYNC";

export interface AuditLogItem {
  id: string;
  timestamp: string;
  type: AuditLogType;
  categoryLabel: string;
  title: string;
  description: string;
  tenantId?: string;
  tenantName: string;
  storeName?: string;
  userName?: string;
  userRole?: string;
  amount?: number | null;
  currency?: string;
  status: string;
  metadata?: Record<string, any>;
}

export async function GET(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "ALL"; // ALL | REGISTRATION | SALE | PRODUCT | SUBSCRIPTION | DEBT | USER | SYNC
    const tenantIdParam = searchParams.get("tenantId") || "ALL";
    const dateRange = searchParams.get("dateRange") || "ALL"; // ALL | TODAY | 7D | 30D
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));

    // Date boundary filter
    let dateFilter: Date | undefined;
    const now = new Date();
    if (dateRange === "TODAY") {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === "7D") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "30D") {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const tenantWhere = tenantIdParam !== "ALL" ? { id: tenantIdParam } : undefined;
    const tenantIdWhere = tenantIdParam !== "ALL" ? tenantIdParam : undefined;

    // Collect counts and operations across models
    const logs: AuditLogItem[] = [];

    // 1. REGISTRATIONS (Tenants created)
    const shouldFetchRegistrations = category === "ALL" || category === "REGISTRATION";
    const registrationsPromise = shouldFetchRegistrations
      ? prisma.tenant.findMany({
          where: {
            ...(tenantWhere || {}),
            ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            users: {
              where: { role: "OWNER" },
              select: { name: true, phone: true, email: true },
              take: 1,
            },
            stores: { select: { name: true }, take: 1 },
          },
        })
      : Promise.resolve([]);

    // 2. SALES (Cash / Mobile Money sales)
    const shouldFetchSales = category === "ALL" || category === "SALE";
    const salesPromise = shouldFetchSales
      ? prisma.sale.findMany({
          where: {
            ...(tenantIdWhere ? { tenantId: tenantIdWhere } : {}),
            ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 150,
          include: {
            tenant: { select: { name: true, currency: true } },
            store: { select: { name: true } },
            user: { select: { name: true, role: true } },
            items: {
              select: {
                id: true,
                productName: true,
                quantity: true,
                unitPrice: true,
              },
              take: 5,
            },
          },
        })
      : Promise.resolve([]);

    // 3. PRODUCTS (Items created / updated)
    const shouldFetchProducts = category === "ALL" || category === "PRODUCT";
    const productsPromise = shouldFetchProducts
      ? prisma.product.findMany({
          where: {
            ...(tenantIdWhere ? { tenantId: tenantIdWhere } : {}),
            ...(dateFilter ? { updatedAt: { gte: dateFilter } } : {}),
          },
          orderBy: { updatedAt: "desc" },
          take: 100,
          include: {
            tenant: { select: { name: true, currency: true } },
            store: { select: { name: true } },
          },
        })
      : Promise.resolve([]);

    // 4. SUBSCRIPTIONS & PLAN PAYMENTS
    const shouldFetchSubscriptions = category === "ALL" || category === "SUBSCRIPTION";
    const subscriptionsPromise = shouldFetchSubscriptions
      ? prisma.subscription.findMany({
          where: {
            ...(tenantIdWhere ? { tenantId: tenantIdWhere } : {}),
            ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            tenant: {
              select: {
                name: true,
                phone: true,
                plan: true,
                planStatus: true,
                planExpiresAt: true,
              },
            },
          },
        })
      : Promise.resolve([]);

    // 5. DEBT PAYMENTS
    const shouldFetchDebts = category === "ALL" || category === "DEBT";
    const debtsPromise = shouldFetchDebts
      ? prisma.debtPayment.findMany({
          where: {
            ...(tenantIdWhere ? { tenantId: tenantIdWhere } : {}),
            ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            tenant: { select: { name: true, currency: true } },
            store: { select: { name: true } },
            customer: { select: { name: true, phone: true } },
          },
        })
      : Promise.resolve([]);

    // 6. USERS & CASHIERS ADDED
    const shouldFetchUsers = category === "ALL" || category === "USER";
    const usersPromise = shouldFetchUsers
      ? prisma.user.findMany({
          where: {
            ...(tenantIdWhere ? { tenantId: tenantIdWhere } : {}),
            ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            tenant: { select: { name: true } },
          },
        })
      : Promise.resolve([]);

    // 7. SYNC LOGS
    const shouldFetchSync = category === "ALL" || category === "SYNC";
    const syncLogsPromise = shouldFetchSync
      ? prisma.syncLog.findMany({
          where: {
            ...(tenantIdWhere ? { tenantId: tenantIdWhere } : {}),
            ...(dateFilter ? { processedAt: { gte: dateFilter } } : {}),
          },
          orderBy: { processedAt: "desc" },
          take: 100,
          include: {
            tenant: { select: { name: true } },
            store: { select: { name: true } },
          },
        })
      : Promise.resolve([]);

    // Execute queries in parallel
    const [
      registrations,
      sales,
      products,
      subscriptions,
      debtPayments,
      users,
      syncLogs,
      tenantsList,
    ] = await Promise.all([
      registrationsPromise,
      salesPromise,
      productsPromise,
      subscriptionsPromise,
      debtsPromise,
      usersPromise,
      syncLogsPromise,
      prisma.tenant.findMany({
        select: { id: true, name: true, plan: true, currency: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // Format 1: Registrations
    for (const t of registrations) {
      const owner = t.users[0];
      logs.push({
        id: `reg-${t.id}`,
        timestamp: t.createdAt.toISOString(),
        type: "REGISTRATION",
        categoryLabel: "Inscription",
        title: `Nouvelle Boutique inscrite : ${t.name}`,
        description: `Création du commerce par ${owner?.name || "Propriétaire"} (${owner?.phone || t.phone || "Sans tél"}) • Forfait : ${t.plan} (${t.planStatus}) • Devise : ${t.currency}`,
        tenantId: t.id,
        tenantName: t.name,
        storeName: t.stores[0]?.name,
        userName: owner?.name,
        userRole: "OWNER",
        status: t.isActive ? "ACTIF" : "EN ATTENTE",
        currency: t.currency,
        metadata: {
          slug: t.slug,
          businessType: t.businessType,
          countryCode: t.countryCode,
          plan: t.plan,
          planStatus: t.planStatus,
          planExpiresAt: t.planExpiresAt?.toISOString(),
        },
      });
    }

    // Format 2: Sales
    for (const s of sales) {
      const itemsCount = s.items?.length || 0;
      const itemsPreview = s.items?.map((it) => `${it.quantity}x ${it.productName}`).join(", ") || "";
      logs.push({
        id: `sale-${s.id}`,
        timestamp: s.createdAt.toISOString(),
        type: "SALE",
        categoryLabel: "Vente POS",
        title: `Vente #${s.saleNumber} encaissée`,
        description: `${s.totalAmount.toLocaleString("fr-FR")} ${s.currency} via ${s.paymentMethod} • ${itemsCount} article(s)${itemsPreview ? ` : ${itemsPreview}` : ""}`,
        tenantId: s.tenantId,
        tenantName: s.tenant?.name || "Boutique",
        storeName: s.store?.name,
        userName: s.user?.name || "Caissier",
        userRole: s.user?.role || "CASHIER",
        amount: s.totalAmount,
        currency: s.currency,
        status: s.status,
        metadata: {
          saleNumber: s.saleNumber,
          paymentMethod: s.paymentMethod,
          itemsCount,
          subtotal: s.subtotal,
          taxAmount: s.taxAmount,
          discountAmount: s.discountAmount,
        },
      });
    }

    // Format 3: Products
    for (const p of products) {
      const isNew = p.createdAt.getTime() === p.updatedAt.getTime();
      logs.push({
        id: `prod-${p.id}-${p.updatedAt.getTime()}`,
        timestamp: p.updatedAt.toISOString(),
        type: "PRODUCT",
        categoryLabel: "Catalogue & Stock",
        title: `${isNew ? "Ajout article" : "Mise à jour article"} : ${p.name}`,
        description: `Stock actuel : ${p.stockQuantity} unités • Prix de vente : ${p.unitPrice.toLocaleString("fr-FR")} ${p.tenant?.currency || "CDF"} • Catégorie : ${p.category}`,
        tenantId: p.tenantId,
        tenantName: p.tenant?.name || "Boutique",
        storeName: p.store?.name,
        amount: p.unitPrice,
        currency: p.tenant?.currency || "CDF",
        status: p.stockQuantity <= (p.minStockAlert || 5) ? "ALERTE STOCK" : "DISPONIBLE",
        metadata: {
          productId: p.id,
          unitPrice: p.unitPrice,
          costPrice: p.costPrice,
          stockQuantity: p.stockQuantity,
          minStockAlert: p.minStockAlert,
          category: p.category,
          barcode: p.barcode,
        },
      });
    }

    // Format 4: Subscriptions & Mobile Money Payments
    for (const sub of subscriptions) {
      logs.push({
        id: `sub-${sub.id}`,
        timestamp: sub.createdAt.toISOString(),
        type: "SUBSCRIPTION",
        categoryLabel: "Paiement Forfait",
        title: `Paiement Forfait ${sub.plan} (${sub.amount} ${sub.currency})`,
        description: `Règlement par ${sub.paymentMethod} • Référence : ${sub.transactionId || "MANUEL"} • Valide jusqu'au ${sub.periodEnd.toLocaleDateString("fr-FR")}`,
        tenantId: sub.tenantId,
        tenantName: sub.tenant?.name || "Boutique",
        amount: sub.amount,
        currency: sub.currency,
        status: sub.paymentStatus,
        metadata: {
          plan: sub.plan,
          paymentMethod: sub.paymentMethod,
          transactionId: sub.transactionId,
          periodStart: sub.periodStart.toISOString(),
          periodEnd: sub.periodEnd.toISOString(),
        },
      });
    }

    // Format 5: Debt Payments
    for (const dp of debtPayments) {
      logs.push({
        id: `debt-${dp.id}`,
        timestamp: dp.createdAt.toISOString(),
        type: "DEBT",
        categoryLabel: "Carnet Dettes",
        title: `Remboursement de dette : ${dp.customer?.name || "Client"}`,
        description: `Paiement de ${dp.amount.toLocaleString("fr-FR")} ${dp.tenant?.currency || "CDF"} via ${dp.paymentMethod} (Tél client : ${dp.customer?.phone || "N/A"})`,
        tenantId: dp.tenantId,
        tenantName: dp.tenant?.name || "Boutique",
        storeName: dp.store?.name,
        userName: dp.customer?.name,
        amount: dp.amount,
        currency: dp.tenant?.currency || "CDF",
        status: "ACQUITTÉ",
        metadata: {
          customerId: dp.customerId,
          customerName: dp.customer?.name,
          paymentMethod: dp.paymentMethod,
        },
      });
    }

    // Format 6: Users & Team Members
    for (const u of users) {
      logs.push({
        id: `usr-${u.id}`,
        timestamp: u.createdAt.toISOString(),
        type: "USER",
        categoryLabel: "Utilisateur",
        title: `Création utilisateur : ${u.name} (${u.role})`,
        description: `Compte rattaché à la boutique "${u.tenant?.name || "Boutique"}" • Tél : ${u.phone || u.email || "Non spécifié"}`,
        tenantId: u.tenantId,
        tenantName: u.tenant?.name || "Boutique",
        userName: u.name,
        userRole: u.role,
        status: u.isActive ? "ACTIF" : "INACTIF",
        metadata: {
          role: u.role,
          phone: u.phone,
          email: u.email,
        },
      });
    }

    // Format 7: Sync Logs
    for (const sl of syncLogs) {
      logs.push({
        id: `sync-${sl.id}`,
        timestamp: sl.processedAt.toISOString(),
        type: "SYNC",
        categoryLabel: "Synchronisation",
        title: `Synchro hors-ligne : ${sl.entity} (${sl.action})`,
        description: `Statut : ${sl.status}${sl.error ? ` • Erreur : ${sl.error}` : ""} • Magasin : ${sl.store?.name || "Principal"}`,
        tenantId: sl.tenantId,
        tenantName: sl.tenant?.name || "Boutique",
        storeName: sl.store?.name,
        status: sl.status,
        metadata: {
          entity: sl.entity,
          entityId: sl.entityId,
          action: sl.action,
          error: sl.error,
        },
      });
    }

    // Sort all aggregated logs by timestamp descending (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply text search filter if provided
    let filteredLogs = logs;
    if (search) {
      filteredLogs = logs.filter((item) => {
        return (
          item.title.toLowerCase().includes(search) ||
          item.description.toLowerCase().includes(search) ||
          item.tenantName.toLowerCase().includes(search) ||
          (item.storeName && item.storeName.toLowerCase().includes(search)) ||
          (item.userName && item.userName.toLowerCase().includes(search)) ||
          (item.status && item.status.toLowerCase().includes(search)) ||
          (item.metadata?.transactionId && String(item.metadata.transactionId).toLowerCase().includes(search))
        );
      });
    }

    // Aggregate summary counts
    const summary = {
      total: logs.length,
      registrations: logs.filter((l) => l.type === "REGISTRATION").length,
      sales: logs.filter((l) => l.type === "SALE").length,
      products: logs.filter((l) => l.type === "PRODUCT").length,
      subscriptions: logs.filter((l) => l.type === "SUBSCRIPTION").length,
      debts: logs.filter((l) => l.type === "DEBT").length,
      users: logs.filter((l) => l.type === "USER").length,
      sync: logs.filter((l) => l.type === "SYNC").length,
      totalSalesAmount: sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0),
      totalSubAmount: subscriptions.reduce((acc, s) => acc + (s.amount || 0), 0),
    };

    // Apply pagination
    const totalFiltered = filteredLogs.length;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: {
        logs: paginatedLogs,
        summary,
        tenants: tenantsList,
        pagination: {
          page,
          limit,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("[Admin Logs API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de la récupération des journaux d'opérations",
      },
      { status: 500 }
    );
  }
}
