import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySuperAdmin, unauthorizedAdminResponse } from "@/lib/admin/admin-guard";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET: List all users from real database
export async function GET(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "ALL";
    const tenantId = searchParams.get("tenantId") || "ALL";

    const whereClause: any = {};

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role !== "ALL") {
      whereClause.role = role;
    }

    if (tenantId !== "ALL") {
      whereClause.tenantId = tenantId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error: any) {
    console.error("[Admin Users GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

// POST: Create a new user in Supabase
export async function POST(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await req.json();
    const { tenantId, name, phone, email, pinCode = "1234", role = "CASHIER" } = body;

    if (!name || !name.trim() || !tenantId) {
      return NextResponse.json(
        { success: false, error: "Le nom et la boutique d'affiliation sont requis" },
        { status: 400 }
      );
    }

    const tenantExists = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenantExists) {
      return NextResponse.json(
        { success: false, error: "La boutique spécifiée est introuvable" },
        { status: 404 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        pinCode: pinCode ? pinCode.trim() : "1234",
        role,
        isActive: true,
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Utilisateur "${newUser.name}" créé avec succès`,
      data: newUser,
    });
  } catch (error: any) {
    console.error("[Admin Users POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}

// PUT: Update user (details, role, active status, PIN)
export async function PUT(req: NextRequest) {
  try {
    const auth = verifySuperAdmin(req);
    if (!auth.authenticated) {
      return unauthorizedAdminResponse(auth.error);
    }

    const body = await req.json();
    const { id, name, phone, email, pinCode, role, isActive, tenantId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de l'utilisateur requis" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (email !== undefined) updateData.email = email ? email.trim() : null;
    if (pinCode !== undefined) updateData.pinCode = pinCode ? pinCode.trim() : "1234";
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (tenantId !== undefined) updateData.tenantId = tenantId;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Utilisateur "${updated.name}" mis à jour avec succès`,
      data: updated,
    });
  } catch (error: any) {
    console.error("[Admin Users PUT Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a user
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
        { success: false, error: "ID de l'utilisateur requis" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Utilisateur "${user.name}" supprimé de Supabase`,
    });
  } catch (error: any) {
    console.error("[Admin Users DELETE Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}
