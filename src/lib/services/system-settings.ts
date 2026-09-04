import fs from "fs";
import path from "path";
import os from "os";
import { prisma } from "@/lib/prisma";

export type VerificationMethod = "SMS" | "EMAIL" | "DISABLED";

export interface SystemVerificationConfig {
  verificationMethod: VerificationMethod;
  isSimulationMode: boolean;
  otpExpiryMinutes: number;
  twilio: {
    accountSid?: string;
    authToken?: string;
    phoneNumber?: string;
    messagingServiceSid?: string;
  };
  email: {
    provider: "SUPABASE" | "SMTP";
    fromEmail?: string;
    fromName?: string;
  };
  updatedAt?: string;
}

const DEFAULT_CONFIG: SystemVerificationConfig = {
  verificationMethod: "SMS", // Par défaut : SMS
  isSimulationMode: false,   // Mode Production actif (Envoi SMS réel via Twilio)
  otpExpiryMinutes: 10,
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || "",
  },
  email: {
    provider: "SUPABASE",
    fromEmail: process.env.ADMIN_EMAIL || "info@kuettu.com",
    fromName: "Kuettu Global POS",
  },
};

const PRIMARY_CONFIG_PATH = path.join(process.cwd(), "data", "verification-config.json");
const TMP_CONFIG_PATH = path.join(os.tmpdir(), "globalpos-verification-config.json");

/**
 * Reads system verification config (from database, memory, tmp JSON, local file or default)
 */
export async function getSystemVerificationConfig(): Promise<SystemVerificationConfig> {
  // 1. Try reading from Supabase PostgreSQL database first (shared across all lambdas/servers)
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT value FROM system_settings WHERE key = 'verification_config' LIMIT 1;
    `);

    if (rows && rows.length > 0 && rows[0]?.value) {
      const parsed = typeof rows[0].value === "string" ? JSON.parse(rows[0].value) : rows[0].value;
      const resolved: SystemVerificationConfig = {
        ...DEFAULT_CONFIG,
        ...parsed,
        twilio: {
          ...DEFAULT_CONFIG.twilio,
          ...(parsed.twilio || {}),
        },
        email: {
          ...DEFAULT_CONFIG.email,
          ...(parsed.email || {}),
        },
      };
      (globalThis as any).__systemVerificationConfig = resolved;
      return resolved;
    }
  } catch (dbErr) {
    console.warn("[SystemSettings] DB fetch warning, falling back to memory/disk:", dbErr);
  }

  // 2. Check in-memory global cache
  if ((globalThis as any).__systemVerificationConfig) {
    return (globalThis as any).__systemVerificationConfig;
  }

  // 3. Try reading from tmp or primary file path
  const pathsToTry = [TMP_CONFIG_PATH, PRIMARY_CONFIG_PATH];

  for (const filePath of pathsToTry) {
    try {
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(fileData);
        const resolved: SystemVerificationConfig = {
          ...DEFAULT_CONFIG,
          ...parsed,
          twilio: {
            ...DEFAULT_CONFIG.twilio,
            ...(parsed.twilio || {}),
          },
          email: {
            ...DEFAULT_CONFIG.email,
            ...(parsed.email || {}),
          },
        };
        (globalThis as any).__systemVerificationConfig = resolved;
        return resolved;
      }
    } catch (err) {
      console.warn(`[SystemSettings] Failed to read config from ${filePath}:`, err);
    }
  }

  return DEFAULT_CONFIG;
}

/**
 * Saves updated system verification config to PostgreSQL DB and memory
 */
export async function saveSystemVerificationConfig(
  updates: Partial<SystemVerificationConfig>
): Promise<SystemVerificationConfig> {
  const current = await getSystemVerificationConfig();
  const merged: SystemVerificationConfig = {
    ...current,
    ...updates,
    twilio: {
      ...current.twilio,
      ...(updates.twilio || {}),
    },
    email: {
      ...current.email,
      ...(updates.email || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  // Clean and normalize Twilio fields
  if (merged.twilio.accountSid) {
    merged.twilio.accountSid = merged.twilio.accountSid.trim();
    if (merged.twilio.accountSid.toLowerCase().startsWith("ac")) {
      merged.twilio.accountSid = "AC" + merged.twilio.accountSid.substring(2);
    }
  }
  if (merged.twilio.authToken) {
    merged.twilio.authToken = merged.twilio.authToken.trim();
  }
  if (merged.twilio.phoneNumber) {
    merged.twilio.phoneNumber = merged.twilio.phoneNumber.trim();
  }
  if (merged.twilio.messagingServiceSid) {
    merged.twilio.messagingServiceSid = merged.twilio.messagingServiceSid.trim();
    if (merged.twilio.messagingServiceSid.toLowerCase().includes("xxxx") || merged.twilio.messagingServiceSid.length < 30) {
      merged.twilio.messagingServiceSid = "";
    }
  }

  // Determine simulation mode (default: false for production)
  if (updates.isSimulationMode !== undefined) {
    merged.isSimulationMode = Boolean(updates.isSimulationMode);
  } else {
    merged.isSimulationMode = false;
  }

  // 1. Always update in-memory runtime cache
  (globalThis as any).__systemVerificationConfig = merged;

  // 2. Persist to Supabase PostgreSQL database
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('verification_config', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    `, JSON.stringify(merged));
  } catch (dbErr) {
    console.error("[SystemSettings] DB save error:", dbErr);
  }

  // 3. Try persisting to tmp and primary data path as fallback
  const pathsToAttempt = [TMP_CONFIG_PATH, PRIMARY_CONFIG_PATH];
  for (const filePath of pathsToAttempt) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf-8");
      break;
    } catch (err) {
      // Ignore read-only fs error
    }
  }

  return merged;
}

