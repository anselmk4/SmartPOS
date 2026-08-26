import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, resetRateLimit } from "@/lib/security/rate-limiter";
import { createSessionToken } from "@/lib/security/jwt";
import { verifyPinCode } from "@/lib/security/password";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await req.json();
    const { identifier, pinCode, tenantId: targetTenantId, userId: targetUserId } = body;

    const cleanInput = (identifier || "").trim();
    const cleanDigits = cleanInput.replace(/\D/g, "");
    const cleanPin = (pinCode || "").trim();

    // Rate Limiting identifier: combine IP + target (phone/user)
    const rateLimitKey = `login:${ip}:${targetUserId || cleanDigits || "anon"}`;
    const rateLimit = checkRateLimit(rateLimitKey, {
      limit: 6,
      windowMs: 2 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: rateLimit.message },
        { status: 429 }
      );
    }

    if (!cleanInput && !cleanPin && !targetUserId) {
      return NextResponse.json(
        { success: false, error: "Numéro de téléphone, email ou identifiant requis" },
        { status: 400 }
      );
    }

    let user: any = null;

    // SCENARIO 1: Explicit user login with PIN within an identified Tenant
    if (targetUserId && cleanPin) {
      const candidate = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: { tenant: true },
      });

      if (candidate && candidate.isActive) {
        if (candidate.pinCode && !verifyPinCode(cleanPin, candidate.pinCode)) {
          return NextResponse.json(
            {
              success: false,
              error: "Code PIN incorrect",
              remainingAttempts: rateLimit.remaining,
            },
            { status: 401 }
          );
        }
        user = candidate;
      }
    }

    // SCENARIO 2: Manager / Merchant login by Phone or Email (+ optional PIN)
    if (!user && cleanInput) {
      // 1. Search in Users table
      const userSearchFilters: any[] = [
        { email: { equals: cleanInput, mode: "insensitive" } },
        { phone: { equals: cleanInput } },
        { phone: { contains: cleanInput } },
      ];
      if (cleanDigits.length >= 6) {
        userSearchFilters.push({ phone: { contains: cleanDigits } });
        if (cleanDigits.length >= 9) {
          userSearchFilters.push({ phone: { contains: cleanDigits.slice(-9) } });
        }
        if (cleanDigits.length >= 8) {
          userSearchFilters.push({ phone: { contains: cleanDigits.slice(-8) } });
        }
      }

      let candidateUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          OR: userSearchFilters,
        },
        include: { tenant: true },
      });

      // 2. Search in Tenants table (by tenant phone or name) if no direct user was found
      if (candidateUsers.length === 0) {
        const tenantSearchFilters: any[] = [
          { phone: { equals: cleanInput } },
          { phone: { contains: cleanInput } },
          { name: { equals: cleanInput, mode: "insensitive" } },
        ];
        if (cleanDigits.length >= 6) {
          tenantSearchFilters.push({ phone: { contains: cleanDigits } });
          if (cleanDigits.length >= 9) {
            tenantSearchFilters.push({ phone: { contains: cleanDigits.slice(-9) } });
          }
          if (cleanDigits.length >= 8) {
            tenantSearchFilters.push({ phone: { contains: cleanDigits.slice(-8) } });
          }
        }

        const matchedTenants = await prisma.tenant.findMany({
          where: {
            isActive: true,
            OR: tenantSearchFilters,
          },
          include: { users: true },
        });

        if (matchedTenants.length > 0) {
          for (const t of matchedTenants) {
            // Find owner or manager of this tenant
            const ownerOrMgr = t.users.find((u) => u.role === "OWNER" || u.role === "MANAGER") || t.users[0];
            if (ownerOrMgr) {
              candidateUsers.push({
                ...ownerOrMgr,
                tenant: t,
              });
            }
          }
        }
      }

      // 3. Match candidate users with provided PIN
      if (candidateUsers.length > 0) {
        if (cleanPin) {
          const pinMatched = candidateUsers.find((u) => verifyPinCode(cleanPin, u.pinCode));
          if (pinMatched) {
            user = pinMatched;
          } else {
            user = candidateUsers[0];
            if (user.pinCode && !verifyPinCode(cleanPin, user.pinCode)) {
              return NextResponse.json(
                { success: false, error: `Code PIN incorrect pour le compte de ${user.name}` },
                { status: 401 }
              );
            }
          }
        } else {
          user = candidateUsers[0];
        }
      }
    }

    // SCENARIO 3: If still not found, return clean error
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun compte trouvé avec ce numéro ou cet email. Vérifiez vos identifiants ou créez votre boutique.",
        },
        { status: 404 }
      );
    }

    const tenantId = user.tenantId;

    // 4. Fetch full tenant ecosystem for instant offline-first bootstrapping
    const [stores, allUsers, products, customers, recentSales, debtPayments] = await Promise.all([
      prisma.store.findMany({ where: { tenantId } }),
      prisma.user.findMany({ where: { tenantId, isActive: true } }),
      prisma.product.findMany({ where: { tenantId } }),
      prisma.customer.findMany({ where: { tenantId } }),
      prisma.sale.findMany({
        where: { tenantId },
        take: 500,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
      prisma.debtPayment.findMany({
        where: { tenantId },
        take: 200,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Reset rate limiter on success
    resetRateLimit(rateLimitKey);

    // Generate signed JWT session token
    const sessionToken = createSessionToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      phone: user.phone || undefined,
      storeId: user.storeId || undefined,
    });

    const response = NextResponse.json({
      success: true,
      token: sessionToken,
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
      debtPayments,
      message: `Connexion réussie ! Bienvenue sur ${user.tenant?.name || user.name}`,
    });

    response.cookies.set("kuettu_session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Auth Login API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur de connexion au serveur" },
      { status: 500 }
    );
  }
}
