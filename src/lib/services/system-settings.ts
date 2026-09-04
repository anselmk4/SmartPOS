import fs from "fs";
import path from "path";
import os from "os";

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
 * Reads system verification config (from memory, local persistent JSON, tmp JSON, or default)
 */
export function getSystemVerificationConfig(): SystemVerificationConfig {
  // 1. Check in-memory global cache first
  if ((globalThis as any).__systemVerificationConfig) {
    return (globalThis as any).__systemVerificationConfig;
  }

  // 2. Try reading from primary config path or tmp config path
  const pathsToTry = [PRIMARY_CONFIG_PATH, TMP_CONFIG_PATH];

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
 * Saves updated system verification config
 */
export function saveSystemVerificationConfig(
  updates: Partial<SystemVerificationConfig>
): SystemVerificationConfig {
  const current = getSystemVerificationConfig();
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

  // Determine simulation mode
  if (updates.isSimulationMode !== undefined) {
    merged.isSimulationMode = Boolean(updates.isSimulationMode);
  } else if (
    merged.twilio.accountSid &&
    merged.twilio.authToken &&
    (merged.twilio.phoneNumber || merged.twilio.messagingServiceSid)
  ) {
    merged.isSimulationMode = false;
  } else {
    merged.isSimulationMode = true;
  }

  // 1. Always update in-memory runtime cache
  (globalThis as any).__systemVerificationConfig = merged;

  // 2. Try persisting to primary data path, then tmpdir
  let savedToFile = false;
  const pathsToAttempt = [PRIMARY_CONFIG_PATH, TMP_CONFIG_PATH];

  for (const filePath of pathsToAttempt) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf-8");
      savedToFile = true;
      break; // Successfully saved to file
    } catch (err) {
      console.warn(`[SystemSettings] Could not write to ${filePath} (read-only filesystem or permission issue):`, err);
    }
  }

  if (!savedToFile) {
    console.warn("[SystemSettings] Running in read-only environment. Settings saved to in-memory state.");
  }

  return merged;
}

