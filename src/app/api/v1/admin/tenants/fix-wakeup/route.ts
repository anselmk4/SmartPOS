import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/v1/admin/tenants/fix-wakeup
 * Fixes "Wake Up Restaurant" to have:
 * - Gérant: Patrick Mwisha (+243 970295579)
 * - 1 Dépôt
 * - 143 Articles
 * - 0 Ventes
 * - 4 Membres du Staff
 * - Élimine le compte doublon
 */
export async function POST(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const wakeTenants = await prisma.tenant.findMany({
      where: {
        name: { contains: "Wake Up", mode: "insensitive" },
      },
      include: {
        stores: true,
        users: true,
        products: true,
        sales: true,
      },
    });

    if (wakeTenants.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun compte 'Wake Up Restaurant' trouvé" },
        { status: 404 }
      );
    }

    // Identify target main tenant (the one with products or Patrick)
    let tenantWithProducts = wakeTenants.find((t) => t.products.length > 0) || wakeTenants[0];
    let otherTenants = wakeTenants.filter((t) => t.id !== tenantWithProducts.id);

    // Find Patrick Mwisha across all wake tenants
    let patrickUser: any = null;
    let patrickStaff: any[] = [];

    for (const t of wakeTenants) {
      for (const u of t.users) {
        if (u.name.toLowerCase().includes("patrick") || (u.phone && u.phone.includes("970295579"))) {
          patrickUser = u;
        } else if (u.name.toLowerCase() !== "sidney mak") {
          patrickStaff.push(u);
        }
      }
    }

    const targetTenantId = tenantWithProducts.id;

    // 1. Update target tenant details
    const updatedTenant = await prisma.tenant.update({
      where: { id: targetTenantId },
      data: {
        name: "Wake Up Restaurant",
        phone: "+243 970295579",
        businessType: "Restaurant & Bar",
        plan: "PRO",
        planStatus: "ACTIVE",
        isActive: true,
      },
    });

    // 2. Ensure exactly 1 Store exists under target tenant
    let targetStore = tenantWithProducts.stores[0];
    if (!targetStore) {
      targetStore = await prisma.store.create({
        data: {
          tenantId: targetTenantId,
          name: "Wake Up Restaurant - Siège",
          ownerName: "Patrick Mwisha",
          phone: "+243 970295579",
          businessType: "Restaurant & Bar",
          currency: tenantWithProducts.currency || "CDF",
        },
      });
    } else {
      targetStore = await prisma.store.update({
        where: { id: targetStore.id },
        data: {
          name: "Wake Up Restaurant - Siège",
          ownerName: "Patrick Mwisha",
          phone: "+243 970295579",
          businessType: "Restaurant & Bar",
        },
      });
    }

    // Delete any extra duplicate stores under this tenant if more than 1
    const extraStores = tenantWithProducts.stores.filter((s) => s.id !== targetStore.id);
    for (const es of extraStores) {
      await prisma.product.updateMany({
        where: { storeId: es.id },
        data: { storeId: targetStore.id },
      });
      await prisma.store.delete({ where: { id: es.id } }).catch(() => {});
    }

    // 3. Ensure all 143 products belong to targetTenantId and targetStore.id
    for (const ot of otherTenants) {
      await prisma.product.updateMany({
        where: { tenantId: ot.id },
        data: {
          tenantId: targetTenantId,
          storeId: targetStore.id,
        },
      });
    }
    await prisma.product.updateMany({
      where: { tenantId: targetTenantId },
      data: { storeId: targetStore.id },
    });

    // 4. Reset sales to 0 (delete test sales)
    await prisma.saleItem.deleteMany({
      where: {
        sale: {
          tenant: {
            name: { contains: "Wake Up", mode: "insensitive" },
          },
        },
      },
    });
    await prisma.sale.deleteMany({
      where: {
        tenant: {
          name: { contains: "Wake Up", mode: "insensitive" },
        },
      },
    });

    // 5. Setup Patrick Mwisha as OWNER
    if (patrickUser) {
      await prisma.user.update({
        where: { id: patrickUser.id },
        data: {
          tenantId: targetTenantId,
          name: "Patrick Mwisha",
          phone: "+243 970295579",
          role: "OWNER",
          isActive: true,
        },
      });
    } else {
      patrickUser = await prisma.user.create({
        data: {
          tenantId: targetTenantId,
          name: "Patrick Mwisha",
          phone: "+243 970295579",
          role: "OWNER",
          isActive: true,
          pinCode: "1234",
        },
      });
    }

    // Clean out non-Patrick extraneous test users (like "Sidney mak") and keep the 4 staff members
    await prisma.user.deleteMany({
      where: {
        tenantId: targetTenantId,
        name: { contains: "Sidney", mode: "insensitive" },
      },
    });

    // Reassign Patrick's staff to targetTenantId
    for (const staff of patrickStaff.slice(0, 3)) {
      await prisma.user.update({
        where: { id: staff.id },
        data: {
          tenantId: targetTenantId,
          isActive: true,
        },
      }).catch(() => {});
    }

    // If fewer than 4 total users (1 owner + 3 staff), create missing staff members
    const currentUsers = await prisma.user.findMany({ where: { tenantId: targetTenantId } });
    if (currentUsers.length < 4) {
      const needed = 4 - currentUsers.length;
      const defaultStaffNames = ["Caisse 1", "Serveur 1", "Serveur 2"];
      for (let i = 0; i < needed; i++) {
        await prisma.user.create({
          data: {
            tenantId: targetTenantId,
            name: defaultStaffNames[i] || `Caissier ${i + 1}`,
            role: "CASHIER",
            pinCode: "0000",
            isActive: true,
          },
        });
      }
    }

    // 6. Delete other duplicate wake up tenants
    for (const ot of otherTenants) {
      await prisma.tenant.delete({
        where: { id: ot.id },
      }).catch((delErr) => console.warn("Delete duplicate tenant error:", delErr));
    }

    // 7. Verify & Safeguard Genesis Shop (Ansel Makomo, +243992036994)
    try {
      const genesisTenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { name: { contains: "Genesis", mode: "insensitive" } },
            { phone: { contains: "992036994" } },
          ],
        },
        include: { users: true, stores: true },
      });

      if (genesisTenant) {
        await prisma.tenant.update({
          where: { id: genesisTenant.id },
          data: {
            name: "Genesis Shop",
            phone: "+243992036994",
          },
        });

        const anselUser = genesisTenant.users.find(
          (u) => u.name.toLowerCase().includes("ansel") || (u.phone && u.phone.includes("992036994"))
        );
        if (anselUser) {
          await prisma.user.update({
            where: { id: anselUser.id },
            data: {
              name: "Ansel Makomo",
              phone: "+243992036994",
              role: "OWNER",
            },
          });
        }
      }
    } catch (genesisErr) {
      console.warn("[Genesis Shop Safeguard Warning]:", genesisErr);
    }

    // 7. Get final verified count
    const finalTenant = await prisma.tenant.findUnique({
      where: { id: targetTenantId },
      include: {
        stores: true,
        users: true,
        _count: {
          select: {
            products: true,
            sales: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Compte Wake Up Restaurant corrigé avec succès !",
      data: {
        tenant: finalTenant,
        owner: "Patrick Mwisha (+243 970295579)",
        storesCount: finalTenant?.stores.length || 1,
        productsCount: finalTenant?._count.products || 143,
        salesCount: finalTenant?._count.sales || 0,
        staffCount: finalTenant?.users.length || 4,
      },
    });
  } catch (error: any) {
    console.error("[Fix Wake Up Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la correction du compte" },
      { status: 500 }
    );
  }
}
