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

    if (!cleanPin) {
      return NextResponse.json(
        { success: false, error: "Code PIN requis pour vous connecter à votre compte." },
        { status: 400 }
      );
    }

    if (!cleanInput && !targetUserId) {
      return NextResponse.json(
        { success: false, error: "Numéro de téléphone, email ou identifiant requis" },
        { status: 400 }
      );
    }

    let user: any = null;

    // SCENARIO 1: Explicit user login with PIN within an identified Tenant
    if (targetUserId) {
      const candidate = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: { tenant: true },
      });

      if (candidate) {
        if (!verifyPinCode(cleanPin, candidate.pinCode)) {
          return NextResponse.json(
            {
              success: false,
              error: "Code PIN incorrect",
              remainingAttempts: rateLimit.remaining,
            },
            { status: 401 }
          );
        }

        // Check if account or tenant is not activated
        if (!candidate.isActive || !candidate.tenant?.isActive) {
          return NextResponse.json(
            {
              success: false,
              requiresVerification: true,
              isInactive: true,
              identifier: candidate.phone || candidate.email || candidate.tenant?.phone,
              tenantName: candidate.tenant?.name,
              error: `La boutique "${candidate.tenant?.name || "Boutique"}" n'est pas encore activée. Veuillez valider le code de confirmation SMS reçu lors de l'inscription ou demander l'activation à un administrateur.`,
            },
            { status: 403 }
          );
        }

        user = candidate;
      }
    }

    // SCENARIO 2: Manager / Merchant login by Phone or Email + PIN
    if (!user && cleanInput) {
      // 1. Search in Users table (including pending/inactive accounts)
      const userSearchFilters: any[] = [
        { email: { equals: cleanInput, mode: "insensitive" } },
        { phone: { equals: cleanInput } },
      ];
      if (cleanDigits.length >= 6) {
        userSearchFilters.push({ phone: { equals: `+${cleanDigits}` } });
        userSearchFilters.push({ phone: { equals: cleanDigits } });
        if (cleanDigits.length >= 9) {
          userSearchFilters.push({ phone: { contains: cleanDigits.slice(-9) } });
        }
      }

      let candidateUsers = await prisma.user.findMany({
        where: {
          OR: userSearchFilters,
        },
        include: { tenant: true },
      });

      // 2. Search in Tenants table if no direct user was found
      if (candidateUsers.length === 0) {
        const tenantSearchFilters: any[] = [
          { phone: { equals: cleanInput } },
          { name: { equals: cleanInput, mode: "insensitive" } },
        ];
        if (cleanDigits.length >= 6) {
          tenantSearchFilters.push({ phone: { equals: `+${cleanDigits}` } });
          tenantSearchFilters.push({ phone: { equals: cleanDigits } });
          if (cleanDigits.length >= 9) {
            tenantSearchFilters.push({ phone: { contains: cleanDigits.slice(-9) } });
          }
        }

        const matchedTenants = await prisma.tenant.findMany({
          where: {
            OR: tenantSearchFilters,
          },
          include: { users: true },
        });

        if (matchedTenants.length > 0) {
          for (const t of matchedTenants) {
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

      // 3. Match candidate users with provided PIN strictly
      if (candidateUsers.length > 0) {
        const pinMatched = candidateUsers.find((u) => verifyPinCode(cleanPin, u.pinCode));
        if (pinMatched) {
          // Check if user or tenant is not yet activated / pending SMS confirmation
          if (!pinMatched.isActive || !pinMatched.tenant?.isActive) {
            return NextResponse.json(
              {
                success: false,
                requiresVerification: true,
                isInactive: true,
                identifier: pinMatched.phone || pinMatched.email || pinMatched.tenant?.phone,
                tenantName: pinMatched.tenant?.name,
                error: `La boutique "${pinMatched.tenant?.name || "Boutique"}" n'est pas encore activée. Veuillez valider le code de confirmation SMS reçu lors de l'inscription ou demander l'activation à un administrateur.`,
              },
              { status: 403 }
            );
          }

          user = pinMatched;
        } else {
          return NextResponse.json(
            {
              success: false,
              error: "Code PIN incorrect pour ce compte",
              remainingAttempts: rateLimit.remaining,
            },
            { status: 401 }
          );
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

    // 4. Fetch full tenant ecosystem for instant offline-first bootstrapping (sanitizing sensitive credentials)
    const [stores, allUsers, products, customers, recentSales, debtPayments] = await Promise.all([
      prisma.store.findMany({ where: { tenantId } }),
      prisma.user.findMany({
        where: { tenantId, isActive: true },
        select: {
          id: true,
          tenantId: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
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
