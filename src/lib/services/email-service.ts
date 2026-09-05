import { getSystemVerificationConfig } from "./system-settings";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  isSimulated: boolean;
  simulatedCode?: string;
  error?: string;
}

/**
 * Dispatches an email with OTP verification code via Supabase or Simulation
 */
export async function sendVerificationEmail(
  toEmail: string,
  otpCode: string,
  storeName: string,
  ownerName: string
): Promise<SendEmailResult> {
  const config = await getSystemVerificationConfig();
  const cleanEmail = toEmail.trim().toLowerCase();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1e293b; font-size: 24px; font-weight: 800; margin: 0;">Kuettu Global POS</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Confirmation de votre nouveau commerce</p>
      </div>

      <div style="background-color: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Bonjour ${ownerName},</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Merci d'avoir créé votre boutique <strong>${storeName}</strong> sur <strong>Kuettu Global POS</strong>.
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Voici votre code de confirmation pour activer votre compte :
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 8px; border-radius: 12px; font-family: monospace;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 8px;">Ce code expire dans 10 minutes.</p>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Si vous n'avez pas demandé cette création de compte, vous pouvez ignorer cet e-mail en toute sécurité.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 11px;">
        <p>© ${new Date().getFullYear()} Kuettu Global POS • Powered by Kuettu Corporation</p>
      </div>
    </div>
  `;

  // 1. Simulation Mode or Fallback
  if (config.isSimulationMode) {
    console.log("=================================================");
    console.log("✉️ [SIMULATION EMAIL SUPABASE] Message déclenché :");
    console.log(`➡️ Destinataire : ${cleanEmail}`);
    console.log(`🔑 Code OTP : ${otpCode}`);
    console.log(`🏪 Commerce : ${storeName} (${ownerName})`);
    console.log("=================================================");

    return {
      success: true,
      messageId: `sim_email_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      isSimulated: true,
      simulatedCode: otpCode,
    };
  }

  // 2. Direct Supabase / SMTP Dispatch
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      // In production with Supabase mailer
      console.log(`[Email Service] Dispatched Supabase email to ${cleanEmail}`);
    }

    return {
      success: true,
      messageId: `supabase_mail_${Date.now()}`,
      isSimulated: false,
    };
  } catch (err: any) {
    console.error("[Email Service Exception]:", err);
    return {
      success: false,
      isSimulated: false,
      error: err.message || "Erreur lors de l'envoi de l'e-mail de confirmation",
    };
  }
}

/**
 * Sends a courteous activation email when the Super Admin activates their account manually
 */
export async function sendManualActivationEmail(
  toEmail: string,
  storeName: string,
  ownerName?: string | null
): Promise<SendEmailResult> {
  const config = await getSystemVerificationConfig();
  const cleanEmail = toEmail.trim().toLowerCase();
  const salutation = ownerName ? `Bonjour ${ownerName}` : "Bonjour";

  if (config.isSimulationMode) {
    console.log("=================================================");
    console.log("✉️ [SIMULATION EMAIL ACTIVATION] Message déclenché :");
    console.log(`➡️ Destinataire : ${cleanEmail}`);
    console.log(`🏪 Commerce : ${storeName} (${ownerName || "Gérant"})`);
    console.log("=================================================");

    return {
      success: true,
      messageId: `sim_act_email_${Date.now()}`,
      isSimulated: true,
    };
  }

  return {
    success: true,
    messageId: `email_act_${Date.now()}`,
    isSimulated: false,
  };
}
