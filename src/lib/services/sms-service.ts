import { getSystemVerificationConfig } from "./system-settings";

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  isSimulated: boolean;
  simulatedCode?: string;
  error?: string;
}

/**
 * Normalizes phone numbers to standard E.164 format (+243...)
 */
export function formatPhoneNumberE164(phone: string, defaultCountry = "CD"): string {
  let cleaned = phone.trim().replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // Common country prefixes
  if (defaultCountry === "CD" || defaultCountry === "RDC") {
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    if (!cleaned.startsWith("243")) {
      cleaned = "243" + cleaned;
    }
  } else if (defaultCountry === "CI") {
    if (!cleaned.startsWith("225")) cleaned = "225" + cleaned;
  } else if (defaultCountry === "SN") {
    if (!cleaned.startsWith("221")) cleaned = "221" + cleaned;
  } else if (defaultCountry === "CM") {
    if (!cleaned.startsWith("237")) cleaned = "237" + cleaned;
  }

  return "+" + cleaned;
}

/**
 * Dispatches an SMS using Twilio API, or simulates sending if simulation mode is enabled
 */
export async function sendVerificationSms(
  toPhone: string,
  otpCode: string,
  storeName: string
): Promise<SendSmsResult> {
  const config = getSystemVerificationConfig();
  const formattedPhone = formatPhoneNumberE164(toPhone);

  const messageBody = `[Kuettu Global POS] Votre code de confirmation pour votre boutique "${storeName}" est : ${otpCode}. Valable 10 minutes. Ne le partagez avec personne.`;

  // 1. Simulation Mode or Missing Credentials
  const hasTwilioKeys = Boolean(
    config.twilio.accountSid &&
    config.twilio.authToken &&
    (config.twilio.phoneNumber || config.twilio.messagingServiceSid)
  );

  if (config.isSimulationMode || !hasTwilioKeys) {
    console.log("=================================================");
    console.log("📱 [SIMULATION SMS TWILIO] Message déclenché :");
    console.log(`➡️ Destinataire : ${formattedPhone}`);
    console.log(`🔑 Code OTP : ${otpCode}`);
    console.log(`🏪 Commerce : ${storeName}`);
    console.log(`💬 Message : "${messageBody}"`);
    console.log("=================================================");

    return {
      success: true,
      messageId: `sim_twilio_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      isSimulated: true,
      simulatedCode: otpCode,
    };
  }

  // 2. Real Twilio API Call via standard REST endpoint
  try {
    const { accountSid, authToken, phoneNumber, messagingServiceSid } = config.twilio;
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("To", formattedPhone);
    formData.append("Body", messageBody);

    if (messagingServiceSid) {
      formData.append("MessagingServiceSid", messagingServiceSid);
    } else if (phoneNumber) {
      formData.append("From", phoneNumber);
    }

    const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await fetch(twilioEndpoint, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Twilio API Error]:", data);
      return {
        success: false,
        isSimulated: false,
        error: data.message || `Erreur Twilio (${data.code || response.status})`,
      };
    }

    return {
      success: true,
      messageId: data.sid,
      isSimulated: false,
    };
  } catch (err: any) {
    console.error("[SMS Service Exception]:", err);
    return {
      success: false,
      isSimulated: false,
      error: err.message || "Erreur de connexion au service SMS",
    };
  }
}
