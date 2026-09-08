import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSystemVerificationConfig, type VerificationMethod } from "./system-settings";
import { sendVerificationSms, formatPhoneNumberE164 } from "./sms-service";
import { sendVerificationEmail } from "./email-service";
import { createSessionToken } from "@/lib/security/jwt";

/**
 * Hashes an OTP code with SHA-256 for secure database storage
 */
export function hashOtpCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

/**
 * Generates a cryptographically strong 6-digit numeric OTP code
 */
export function generateNumericOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

export interface TriggerOtpParams {
  tenantId: string;
  userId: string;
  phone: string;
  email?: string | null;
  storeName: string;
  ownerName: string;
}

export interface TriggerOtpResult {
  success: boolean;
  verificationMethod: VerificationMethod;
  identifier: string;
  expiresAt: string;
  isSimulated: boolean;
  simulatedCode?: string;
  error?: string;
}

/**
 * Generates an OTP, stores it in DB, and dispatches it via SMS or Email based on Admin settings
 */
export async function triggerRegistrationOtp(params: TriggerOtpParams): Promise<TriggerOtpResult> {
  const config = await getSystemVerificationConfig();
  const method = config.verificationMethod;

  if (method === "DISABLED") {
    // If admin disabled verification, automatically activate
    await prisma.tenant.update({
      where: { id: params.tenantId },
      data: { isActive: true, planStatus: "ACTIVE" },
    });
    return {
      success: true,
      verificationMethod: "DISABLED",
      identifier: params.phone,
      expiresAt: new Date(Date.now() + 600000).toISOString(),
      isSimulated: false,
    };
  }

  const rawCode = generateNumericOtp();
  const codeHash = hashOtpCode(rawCode);
  const expiryMinutes = config.otpExpiryMinutes || 10;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const cleanEmail = params.email ? params.email.trim().toLowerCase() : null;
  const formattedPhone = params.phone ? formatPhoneNumberE164(params.phone) : null;

  // Determine primary identifier and method
  let targetIdentifier = cleanEmail || formattedPhone || params.phone.trim();
  let effectiveMethod: VerificationMethod = method;

  if (cleanEmail) {
    targetIdentifier = cleanEmail;
    effectiveMethod = "EMAIL";
  } else if (method === "EMAIL" && !cleanEmail) {
    effectiveMethod = "SMS";
    targetIdentifier = formattedPhone || params.phone.trim();
  }

  // 1. Invalidate previous pending OTPs for both email and phone
  const identifiersToInvalidate = [targetIdentifier];
  if (cleanEmail && !identifiersToInvalidate.includes(cleanEmail)) identifiersToInvalidate.push(cleanEmail);
  if (formattedPhone && !identifiersToInvalidate.includes(formattedPhone)) identifiersToInvalidate.push(formattedPhone);

  await prisma.otpVerification.updateMany({
    where: {
      identifier: { in: identifiersToInvalidate },
      consumed: false,
    },
    data: { consumed: true },
  });

  // 2. Insert new OTP records (for both email and phone so verification works with either)
  await prisma.otpVerification.create({
    data: {
      identifier: targetIdentifier,
      codeHash,
      userId: params.userId,
      tenantId: params.tenantId,
      expiresAt,
      consumed: false,
    },
  });

  if (formattedPhone && formattedPhone !== targetIdentifier) {
    await prisma.otpVerification.create({
      data: {
        identifier: formattedPhone,
        codeHash,
        userId: params.userId,
        tenantId: params.tenantId,
        expiresAt,
        consumed: false,
      },
    }).catch(() => {});
  }

  // 3. Dispatch via selected channel
  if (cleanEmail) {
    const emailRes = await sendVerificationEmail(
      cleanEmail,
      rawCode,
      params.storeName,
      params.ownerName
    );

    // If phone exists and SMS is also configured, send SMS as secondary
    if (method === "SMS" && formattedPhone) {
      sendVerificationSms(formattedPhone, rawCode, params.storeName).catch(() => {});
    }

    return {
      success: emailRes.success,
      verificationMethod: "EMAIL",
      identifier: cleanEmail,
      expiresAt: expiresAt.toISOString(),
      isSimulated: Boolean(emailRes.isSimulated),
      error: emailRes.error,
    };
  } else {
    // Default channel: SMS
    const smsRes = await sendVerificationSms(
      params.phone,
      rawCode,
      params.storeName
    );

    return {
      success: smsRes.success,
      verificationMethod: "SMS",
      identifier: targetIdentifier,
      expiresAt: expiresAt.toISOString(),
      isSimulated: Boolean(smsRes.isSimulated),
      error: smsRes.error,
    };
  }
}

/**
 * Validates an entered OTP code with master simulation bypass support for dev/sandbox testing
 */
export async function verifyRegistrationOtp(
  identifier: string,
  enteredCode: string
): Promise<{
  success: boolean;
  token?: string;
  tenant?: any;
  user?: any;
  stores?: any[];
  error?: string;
}> {
  const cleanCode = enteredCode.trim();
  const cleanIdentifier = identifier.trim().startsWith("+")
    ? formatPhoneNumberE164(identifier)
    : identifier.includes("@")
    ? identifier.trim().toLowerCase()
    : formatPhoneNumberE164(identifier);

  const rawDigits = identifier.replace(/\D/g, "");

  const isProduction = process.env.NODE_ENV === "production";
  const config = await getSystemVerificationConfig();
  
  // Master simulation codes are ONLY allowed in non-production environments AND when simulation mode is explicitly enabled
  const isMasterSimulationCode = !isProduction && config.isSimulationMode && ["111111", "123456", "000000", "777777", "999999", "654321"].includes(cleanCode);

  let targetTenantId: string | null = null;
  let targetUserId: string | null = null;

  // 1. Try finding by active OTP record
  const hashedEntered = hashOtpCode(cleanCode);
  const now = new Date();

  const orClauses: any[] = [{ identifier: cleanIdentifier }];
  if (!identifier.includes("@") && rawDigits.length >= 8) {
    orClauses.push({ identifier: { contains: rawDigits.slice(-8) } });
  }

  const record = await prisma.otpVerification.findFirst({
    where: {
      consumed: false,
      expiresAt: { gt: now },
      OR: orClauses,
    },
    orderBy: { createdAt: "desc" },
  });

  if (record) {
    const isExactMatch = record.codeHash === hashedEntered;
    if (isExactMatch || isMasterSimulationCode) {
      targetTenantId = record.tenantId;
      targetUserId = record.userId;

      // Mark consumed
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { consumed: true },
      }).catch(() => {});
    }
  }

  // 2. If master simulation code is legitimately enabled in dev and no OTP record found
  if (isMasterSimulationCode && (!targetTenantId || !targetUserId)) {
    const matchedUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanIdentifier },
          { email: cleanIdentifier },
          { phone: { contains: rawDigits.length >= 8 ? rawDigits.slice(-8) : rawDigits } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (matchedUser) {
      targetTenantId = matchedUser.tenantId;
      targetUserId = matchedUser.id;
    }
  }

  if (!targetTenantId || !targetUserId) {
    return {
      success: false,
      error: "Code de vérification invalide ou expiré. Veuillez vérifier les 6 chiffres ou demander un nouveau code.",
    };
  }

  // Fetch existing tenant to check plan
  const existingTenant = await prisma.tenant.findUnique({
    where: { id: targetTenantId },
  });

  const isFreePlan = !existingTenant?.plan || existingTenant.plan === "FREE";
  const initialPlanStatus = isFreePlan ? "ACTIVE" : "TRIAL";

  // Activate Tenant (isActive = true) and User in Supabase, keeping planStatus pending if paid plan
  const [tenant, user, stores] = await Promise.all([
    prisma.tenant.update({
      where: { id: targetTenantId },
      data: { isActive: true, planStatus: initialPlanStatus },
    }),
    prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: true },
    }),
    prisma.store.findMany({
      where: { tenantId: targetTenantId },
    }),
  ]);

  // Generate JWT auth session token
  const token = createSessionToken({
    userId: user.id,
    tenantId: tenant.id,
    role: user.role,
  });

  return {
    success: true,
    token,
    tenant,
    user,
    stores,
  };
}
