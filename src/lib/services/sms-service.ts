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
 * Generic SMS dispatcher using Twilio API or simulation
 */
export async function sendCustomSms(
  toPhone: string,
  messageBody: string
): Promise<SendSmsResult> {
  const config = await getSystemVerificationConfig();
  const formattedPhone = formatPhoneNumberE164(toPhone);

  const twilio = config.twilio || {};
  let accountSid = (twilio.accountSid || process.env.TWILIO_ACCOUNT_SID || "").trim();
  let authToken = (twilio.authToken || process.env.TWILIO_AUTH_TOKEN || "").trim();
  let phoneNumber = (twilio.phoneNumber || process.env.TWILIO_PHONE_NUMBER || "").trim();
  let messagingServiceSid = (twilio.messagingServiceSid || process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim();

  // Normalize SID case (must start with uppercase AC)
  if (accountSid.toLowerCase().startsWith("ac")) {
    accountSid = "AC" + accountSid.substring(2);
  }

  // Filter out dummy/placeholder Messaging Service SIDs (like MGxxxxxxxx...)
  if (messagingServiceSid.toLowerCase().includes("xxxx") || messagingServiceSid.length < 30) {
    messagingServiceSid = "";
  }

  const hasTwilioKeys = Boolean(accountSid && authToken && (phoneNumber || messagingServiceSid));

  // 1. Simulation Mode or Missing Credentials
  if (config.isSimulationMode || !hasTwilioKeys) {
    if (!hasTwilioKeys) {
      console.warn("[Twilio SMS] Clés Twilio manquantes, passage en simulation ou vérification des variables d'environnement.");
    }
    console.log("=================================================");
    console.log("📱 [SMS TWILIO] Envoi déclenché :");
    console.log(`➡️ Destinataire : ${formattedPhone}`);
    console.log(`💬 Message : "${messageBody}"`);
    console.log("=================================================");

    return {
      success: true,
      messageId: `sim_twilio_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      isSimulated: true,
    };
  }

  // 2. Real Twilio API Call via standard REST endpoint
  try {
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("To", formattedPhone);
    formData.append("Body", messageBody);

    if (messagingServiceSid && messagingServiceSid.startsWith("MG")) {
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
      let errorDetail = data.message || `Erreur Twilio (${data.code || response.status})`;
      if (data.code === 21408) {
        errorDetail = "Twilio Erreur 21408 : L'envoi de SMS vers la RDC (+243) doit être activé dans votre console Twilio (Messaging > Settings > Geo-Permissions).";
      } else if (data.code === 21608) {
        errorDetail = `Twilio Erreur 21608 : Compte Twilio d'essai. Le numéro ${formattedPhone} doit être vérifié dans votre console Twilio (Verified Caller IDs) ou votre compte doit être approvisionné.`;
      } else if (data.code === 20003) {
        errorDetail = "Twilio Erreur 20003 : Échec d'authentification Twilio. Vérifiez votre Account SID et Auth Token.";
      } else if (data.code === 21211) {
        errorDetail = `Twilio Erreur 21211 : Le numéro de téléphone ${formattedPhone} est invalide pour l'opérateur.`;
      }
      return {
        success: false,
        isSimulated: false,
        error: errorDetail,
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

/**
 * Dispatches an SMS using Twilio API, or simulates sending if simulation mode is enabled
 */
export async function sendVerificationSms(
  toPhone: string,
  otpCode: string,
  storeName: string
): Promise<SendSmsResult> {
  const messageBody = `[Kuettu Global POS] Votre code de confirmation pour votre boutique "${storeName}" est : ${otpCode}. Valable 10 minutes. Ne le partagez avec personne.`;
  const result = await sendCustomSms(toPhone, messageBody);
  if (result.isSimulated) {
    result.simulatedCode = otpCode;
  }
  return result;
}

/**
 * Sends a courteous confirmation SMS to the store owner when the Super Admin activates their account manually
 */
export async function sendManualActivationSms(
  toPhone: string,
  storeName: string,
  ownerName?: string | null
): Promise<SendSmsResult> {
  const salutation = ownerName ? `Bonjour ${ownerName}` : "Bonjour";
  const messageBody = `[Kuettu Global POS] ${salutation}, nous avons le plaisir de vous informer que votre compte pour la boutique "${storeName}" a été validé et activé avec succès par notre service d'assistance. Vous pouvez dès à présent vous connecter à votre caisse avec votre code PIN pour démarrer vos ventes. Nous vous remercions pour votre confiance !`;

  return sendCustomSms(toPhone, messageBody);
}
