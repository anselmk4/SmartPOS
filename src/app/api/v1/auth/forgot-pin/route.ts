import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, resetRateLimit } from "@/lib/security/rate-limiter";
import { sendTwilioSMS } from "@/lib/sms/twilio-client";
import { hashPinCode, verifyPinCode } from "@/lib/security/password";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

      // Generate cryptographically secure 6-digit verification code
      const randomInt = crypto.randomInt(100000, 1000000);
      const otpCode = randomInt.toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity
      const normalizedIdentifier = (user.phone || user.email || cleanDigits).toLowerCase().trim();

      // Invalidate previous unconsumed OTPs for this identifier
      await prisma.otpVerification.updateMany({
        where: {
          identifier: normalizedIdentifier,
          consumed: false,
        },
        data: {
          consumed: true,
        },
      });

      // Save hashed OTP in database
      const codeHash = hashPinCode(otpCode);
      await prisma.otpVerification.create({
        data: {
          identifier: normalizedIdentifier,
          codeHash,
          userId: user.id,
          tenantId: user.tenantId,
          expiresAt,
          consumed: false,
        },
      });

      // Deliver OTP code via Twilio SMS
      const destinationPhone = user.phone || (cleanDigits.length >= 8 ? cleanInput : null);
      let smsResult: any = { success: false, isSimulated: false };

      if (destinationPhone) {
        smsResult = await sendTwilioSMS({
          to: destinationPhone,
          body: `[Kuettu Global POS] Votre code de réinitialisation sécurisé est : ${otpCode} (Valide pendant 15 minutes). Ne le partagez jamais.`,
        });
      }

      const maskedPhone = user.phone
        ? user.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")
        : cleanInput;

      return NextResponse.json({
        success: true,
        message: destinationPhone
          ? `Code de sécurité envoyé par SMS au numéro ${maskedPhone}.`
          : `Code de sécurité à 6 chiffres généré avec succès pour ${user.name}.`,
        maskedIdentifier: maskedPhone,
        userName: user.name,
        tenantName: user.tenant?.name,
        smsDelivered: smsResult.success,
        isSimulatedSms: smsResult.isSimulated || false,
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

      // Rate limit verification attempts: max 5 attempts per 5 minutes
      const verifyLimit = checkRateLimit(`forgot-pin-verify:${ip}:${cleanDigits || "anon"}`, {
        limit: 5,
        windowMs: 5 * 60 * 1000,
        blockDurationMs: 15 * 60 * 1000,
      });

      if (!verifyLimit.success) {
        return NextResponse.json({ success: false, error: verifyLimit.message }, { status: 429 });
      }

      const now = new Date();

      // Find unconsumed, unexpired OTP records for this identifier (or phone search)
      const possibleOtps = await prisma.otpVerification.findMany({
        where: {
          consumed: false,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const matchedOtp = possibleOtps.find((record) => {
        const idLower = record.identifier.toLowerCase();
        const inputLower = cleanInput.toLowerCase();
        const matchesIdentifier =
          idLower === inputLower ||
          idLower.includes(cleanDigits) ||
          inputLower.includes(record.identifier);

        if (!matchesIdentifier) return false;
        return verifyPinCode(cleanCode, record.codeHash);
      });

      if (!matchedOtp) {
        return NextResponse.json(
          {
            success: false,
            error: "Code de vérification incorrect ou expiré. Veuillez vérifier les 6 chiffres ou redemander un nouveau code.",
            remainingAttempts: verifyLimit.remaining,
          },
          { status: 401 }
        );
      }

      // Mark OTP as consumed to prevent reuse (anti-replay)
      await prisma.otpVerification.update({
        where: { id: matchedOtp.id },
        data: { consumed: true },
      });

      // Securely hash the new PIN code using PBKDF2 before storing
      const hashedPin = hashPinCode(cleanNewPin);
      const updatedUser = await prisma.user.update({
        where: { id: matchedOtp.userId },
        data: {
          pinCode: hashedPin,
          updatedAt: now,
        },
      });

      // Reset login rate limiter for this user/IP
      resetRateLimit(`login:${ip}:${matchedOtp.userId}`);

      return NextResponse.json({
        success: true,
        message: `Votre code PIN a été mis à jour avec succès ! Vous pouvez maintenant vous connecter avec votre nouveau code.`,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          phone: updatedUser.phone,
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
