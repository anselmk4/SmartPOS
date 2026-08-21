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
  const config = getSystemVerificationConfig();
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

  // Normalize identifier based on method
  let targetIdentifier: string;
  if (method === "EMAIL" && params.email) {
    targetIdentifier = params.email.trim().toLowerCase();
  } else {
    targetIdentifier = formatPhoneNumberE164(params.phone);
  }

  // 1. Invalidate previous pending OTPs for this identifier
  await prisma.otpVerification.updateMany({
    where: { identifier: targetIdentifier, consumed: false },
    data: { consumed: true },
  });

  // 2. Insert new OTP record
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

  // 3. Dispatch via selected channel
  if (method === "EMAIL" && params.email) {
    const emailRes = await sendVerificationEmail(
      params.email,
      rawCode,
      params.storeName,
      params.ownerName
    );

    return {
      success: emailRes.success,
      verificationMethod: "EMAIL",
      identifier: targetIdentifier,
      expiresAt: expiresAt.toISOString(),
      isSimulated: emailRes.isSimulated,
      simulatedCode: emailRes.simulatedCode,
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
      isSimulated: smsRes.isSimulated,
      simulatedCode: smsRes.simulatedCode,
      error: smsRes.error,
    };
  }
}

/**
 * Validates an entered OTP code
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
  const cleanIdentifier = identifier.trim().startsWith("+")
    ? formatPhoneNumberE164(identifier)
    : identifier.includes("@")
    ? identifier.trim().toLowerCase()
    : formatPhoneNumberE164(identifier);

  const hashedEntered = hashOtpCode(enteredCode);
  const now = new Date();

  // Find valid unconsumed record
  const record = await prisma.otpVerification.findFirst({
    where: {
      identifier: cleanIdentifier,
      consumed: false,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return {
      success: false,
      error: "Code expiré ou introuvable. Veuillez demander un nouveau code.",
    };
  }

  if (record.codeHash !== hashedEntered) {
    return {
      success: false,
      error: "Code de confirmation incorrect. Vérifiez les 6 chiffres saisis.",
    };
  }

  // Mark consumed
  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { consumed: true },
  });

  // Fetch existing tenant to check plan
  const existingTenant = await prisma.tenant.findUnique({
    where: { id: record.tenantId },
  });

  const isFreePlan = !existingTenant?.plan || existingTenant.plan === "FREE";
  const initialPlanStatus = isFreePlan ? "ACTIVE" : "TRIAL";

  // Activate Tenant (isActive = true) and User in Supabase, keeping planStatus pending if paid plan
  const [tenant, user, stores] = await Promise.all([
    prisma.tenant.update({
      where: { id: record.tenantId },
      data: { isActive: true, planStatus: initialPlanStatus },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { isActive: true },
    }),
    prisma.store.findMany({
      where: { tenantId: record.tenantId },
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
