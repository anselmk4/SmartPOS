/**
 * Twilio SMS Gateway for Kuettu Global POS
 * Sends OTP verification codes and critical security notifications via SMS.
 * Automatically runs in Sandbox Simulation mode if API credentials are not yet set in .env.
 */

export interface SendSmsParams {
  to: string; // Destination phone number in E.164 format (e.g. +243812345678)
  body: string;
}

export interface SendSmsResponse {
  success: boolean;
  messageId?: string;
  isSimulated?: boolean;
  error?: string;
}

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || "";
const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID || "";

/**
 * Sends an SMS message using Twilio REST API
 */
export async function sendTwilioSMS(params: SendSmsParams): Promise<SendSmsResponse> {
  const { to, body } = params;

  // Format destination phone number to international E.164
  let cleanTo = to.replace(/[\s\-().]/g, "");
  if (!cleanTo.startsWith("+")) {
    if (cleanTo.startsWith("0")) {
      // Default to RDC (+243) if starts with 0
      cleanTo = `+243${cleanTo.substring(1)}`;
    } else if (cleanTo.startsWith("243") || cleanTo.startsWith("33") || cleanTo.startsWith("1") || cleanTo.startsWith("225")) {
      cleanTo = `+${cleanTo}`;
    } else {
      cleanTo = `+${cleanTo}`;
    }
  }

  // 1. Simulation Mode if Twilio keys are not configured yet
  const isConfigured =
    TWILIO_ACCOUNT_SID &&
    TWILIO_ACCOUNT_SID.startsWith("AC") &&
    TWILIO_AUTH_TOKEN &&
    TWILIO_AUTH_TOKEN.length >= 16;

  if (!isConfigured) {
    console.log("[Twilio SMS 🧪 Mode Simulation]: Clés Twilio en attente dans .env", {
      to: cleanTo,
      message: body,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      messageId: `SIM-TWILIO-${Date.now()}`,
      isSimulated: true,
    };
  }

  // 2. Real Twilio API Call
  try {
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const formData = new URLSearchParams();
    formData.append("To", cleanTo);
    formData.append("Body", body);

    if (TWILIO_MESSAGING_SERVICE_SID) {
      formData.append("MessagingServiceSid", TWILIO_MESSAGING_SERVICE_SID);
    } else if (TWILIO_PHONE_NUMBER) {
      formData.append("From", TWILIO_PHONE_NUMBER);
    } else {
      return {
        success: false,
        error: "Numéro expéditeur Twilio (TWILIO_PHONE_NUMBER) manquant dans la configuration.",
      };
    }

    const authHeader = `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[Twilio SMS Error]:", responseData);
      return {
        success: false,
        error: responseData.message || `Erreur Twilio (${response.status})`,
      };
    }

    console.log(`[Twilio SMS Sent]: SID ${responseData.sid} to ${cleanTo}`);
    return {
      success: true,
      messageId: responseData.sid,
      isSimulated: false,
    };
  } catch (error: any) {
    console.error("[Twilio SMS Network Exception]:", error);
    return {
      success: false,
      error: error.message || "Impossible de joindre la passerelle SMS Twilio.",
    };
  }
}
