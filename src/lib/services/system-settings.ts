import fs from "fs";
import path from "path";

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
  isSimulationMode: true,    // Simulé jusqu'à ce que les clés soient fournies
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

const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "verification-config.json");

/**
 * Reads system verification config (from local persistent JSON or default)
 */
export function getSystemVerificationConfig(): SystemVerificationConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileData = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      const parsed = JSON.parse(fileData);
      return {
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
    }
  } catch (err) {
    console.warn("[SystemSettings] Failed to read config file, falling back to default:", err);
  }

  return DEFAULT_CONFIG;
}

/**
 * Saves updated system verification config
 */
export function saveSystemVerificationConfig(
  updates: Partial<SystemVerificationConfig>
): SystemVerificationConfig {
  try {
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

    // Auto-detect if real Twilio credentials are provided
    if (merged.twilio.accountSid && merged.twilio.authToken && (merged.twilio.phoneNumber || merged.twilio.messagingServiceSid)) {
      if (updates.isSimulationMode === undefined) {
        merged.isSimulationMode = false;
      }
    } else {
      merged.isSimulationMode = true;
    }

    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(merged, null, 2), "utf-8");
    return merged;
  } catch (err) {
    console.error("[SystemSettings] Failed to save config file:", err);
    throw new Error("Impossible de sauvegarder la configuration");
  }
}
