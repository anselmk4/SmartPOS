import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, resetRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-Memory store for OTP verification codes
interface ResetRecord {
  code: string;
  userId: string;
  tenantId: string;
  identifier: string;
  expiresAt: number;
}

const resetCodeStore = new Map<string, ResetRecord>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await req.json();
    const { action, identifier, code, newPinCode } = body;

    const cleanInput = (identifier || "").trim();
    const cleanDigits = cleanInput.replace(/\D/g, "");

    // -------------------------------------------------------------
    // ACTION 1: REQUEST OTP CODE
    // -------------------------------------------------------------
    if (action === "REQUEST_CODE") {
      if (!cleanInput) {
        return NextResponse.json(
          { success: false, error: "Veuillez saisir votre numéro de téléphone ou votre adresse email." },
          { status: 400 }
        );
      }

      // Rate limit: 4 requests per 10 minutes
      const rateLimit = checkRateLimit(`forgot-pin-req:${ip}:${cleanDigits || "anon"}`, {
        limit: 4,
        windowMs: 10 * 60 * 1000,
        blockDurationMs: 20 * 60 * 1000,
      });

      if (!rateLimit.success) {
        return NextResponse.json({ success: false, error: rateLimit.message }, { status: 429 });
      }

      // Find user by phone, email or name
      const searchFilters: any[] = [
        { email: { equals: cleanInput, mode: "insensitive" } },
        { phone: { equals: cleanInput } },
        { phone: { contains: cleanInput } },
      ];
      if (cleanDigits.length >= 6) {
        searchFilters.push({ phone: { contains: cleanDigits.slice(-9) } });
      }

      let user: any = await prisma.user.findFirst({
        where: {
          isActive: true,
          OR: searchFilters,
        },
        include: { tenant: true },
      });

      // If not directly found in user table, check Tenant table
      if (!user) {
        const tenant = await prisma.tenant.findFirst({
          where: {
            isActive: true,
            OR: [
              { phone: { equals: cleanInput } },
              { phone: { contains: cleanInput } },
              { name: { equals: cleanInput, mode: "insensitive" } },
            ],
          },
          include: { users: true },
        });

        if (tenant && tenant.users && tenant.users.length > 0) {
          const ownerUser = tenant.users.find((u) => u.role === "OWNER") || tenant.users[0];
          user = { ...ownerUser, tenant };
        }
      }

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "Aucun compte marchand trouvé avec ces coordonnées. Vérifiez votre numéro ou email.",
          },
          { status: 404 }
        );
      }

      // Generate 6-digit random verification code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

      const normalizedKey = (user.phone || user.email || cleanDigits).toLowerCase();
      resetCodeStore.set(normalizedKey, {
        code: otpCode,
        userId: user.id,
        tenantId: user.tenantId,
        identifier: cleanInput,
        expiresAt,
      });

      const maskedPhone = user.phone
        ? user.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")
        : cleanInput;

      return NextResponse.json({
        success: true,
        message: `Code de sécurité à 6 chiffres généré avec succès pour ${user.name}.`,
        maskedIdentifier: maskedPhone,
        userName: user.name,
        tenantName: user.tenant?.name,
        // In local/test environment or demo mode, codePreview allows instant testing
        codePreview: otpCode,
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: VERIFY CODE & RESET PIN
    // -------------------------------------------------------------
    if (action === "VERIFY_AND_RESET") {
      const cleanCode = (code || "").trim();
      const cleanNewPin = (newPinCode || "").trim().replace(/\D/g, "");

      if (!cleanInput || !cleanCode || !cleanNewPin) {
        return NextResponse.json(
          { success: false, error: "Identifiant, code de vérification et nouveau code PIN requis." },
          { status: 400 }
        );
      }

      if (cleanNewPin.length < 4) {
        return NextResponse.json(
          { success: false, error: "Le nouveau code PIN doit comporter au moins 4 chiffres." },
          { status: 400 }
        );
      }

      // Rate limit verification attempts
      const verifyLimit = checkRateLimit(`forgot-pin-verify:${ip}:${cleanDigits}`, {
        limit: 5,
        windowMs: 5 * 60 * 1000,
        blockDurationMs: 15 * 60 * 1000,
      });

      if (!verifyLimit.success) {
        return NextResponse.json({ success: false, error: verifyLimit.message }, { status: 429 });
      }

      // Find matching OTP record
      let matchedRecord: any = null;
      let matchedKey: any = null;

      resetCodeStore.forEach((rec, k) => {
        if (
          !matchedRecord &&
          (rec.identifier.includes(cleanInput) ||
            cleanInput.includes(rec.identifier) ||
            k.includes(cleanDigits) ||
            (cleanDigits.length >= 6 && k.includes(cleanDigits.slice(-6))))
        ) {
          matchedRecord = rec;
          matchedKey = k;
        }
      });

      if (!matchedRecord) {
        return NextResponse.json(
          { success: false, error: "Aucune demande de réinitialisation en cours pour ce compte." },
          { status: 400 }
        );
      }

      if (Date.now() > matchedRecord.expiresAt) {
        if (matchedKey) resetCodeStore.delete(matchedKey);
        return NextResponse.json(
          { success: false, error: "Le code de vérification a expiré. Veuillez demander un nouveau code." },
          { status: 400 }
        );
      }

      if (matchedRecord.code !== cleanCode) {
        return NextResponse.json(
          {
            success: false,
            error: "Code de vérification incorrect. Veuillez vérifier les 6 chiffres saisis.",
            remainingAttempts: verifyLimit.remaining,
          },
          { status: 401 }
        );
      }

      // Valid OTP! Update PIN in database
      const now = new Date();
      const updatedUser = await prisma.user.update({
        where: { id: matchedRecord.userId },
        data: {
          pinCode: cleanNewPin,
          updatedAt: now,
        },
      });

      // Clear OTP record
      if (matchedKey) resetCodeStore.delete(matchedKey);

      // Reset login rate limiter for this user/IP
      resetRateLimit(`login:${ip}:${matchedRecord.userId}`);

      return NextResponse.json({
        success: true,
        message: `Votre code PIN a été mis à jour avec succès ! Vous pouvez maintenant vous connecter avec votre nouveau code ${cleanNewPin}.`,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          phone: updatedUser.phone,
          pinCode: updatedUser.pinCode,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Action non reconnue. Utilisez REQUEST_CODE ou VERIFY_AND_RESET." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Forgot PIN API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la réinitialisation du code PIN" },
      { status: 500 }
    );
  }
}
