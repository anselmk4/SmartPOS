import { getSystemVerificationConfig } from "./system-settings";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  isSimulated: boolean;
  simulatedCode?: string;
  error?: string;
}

export interface PaymentNotificationData {
  tenantName: string;
  storeName?: string;
  customerEmail?: string | null;
  customerName?: string | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string | null;
  plan?: string | null;
  periodEnd?: Date | string | null;
  notes?: string | null;
}

/**
 * Base responsive email container matching the official Kuettu Global POS design template.
 */
function renderBaseEmailTemplate({
  title,
  contentHtml,
  disclaimerText = "Si vous n'avez pas demandé cette opération, vous pouvez ignorer cet e-mail en toute sécurité. Quelqu'un a probablement entré votre adresse par erreur.",
}: {
  title: string;
  contentHtml: string;
  disclaimerText?: string;
}): string {
  const currentYear = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://globalpos.app";
  const logoUrl = `${appUrl.replace(/\/+$/, "")}/logo.png`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 16px;
    }
    .main-card {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      overflow: hidden;
    }
    .top-accent-bar {
      height: 6px;
      background: linear-gradient(90deg, #4338CA 0%, #4F46E5 50%, #6366F1 100%);
      width: 100%;
    }
    .card-body {
      padding: 36px 32px 28px 32px;
    }
    .logo-container {
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0 0 18px 0;
      line-height: 1.3;
    }
    .body-text {
      font-size: 15px;
      color: #334155;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    .code-box-wrapper {
      text-align: center;
      margin: 28px 0;
    }
    .code-badge {
      display: inline-block;
      padding: 16px 36px;
      background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
      color: #ffffff !important;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 8px;
      border-radius: 12px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }
    .btn-action {
      display: inline-block;
      padding: 14px 32px;
      background-color: #4F46E5;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 700;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }
    .expiry-text {
      font-size: 12px;
      color: #64748b;
      margin-top: 10px;
    }
    .card-disclaimer {
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      padding: 18px 32px;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer-section {
      text-align: center;
      padding-top: 24px;
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.6;
    }
    .footer-link {
      color: #6366F1;
      text-decoration: none;
    }
    .info-table {
      width: 100%;
      margin: 20px 0;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
    }
    .info-table .label {
      color: #64748b;
      width: 40%;
      font-weight: 500;
    }
    .info-table .val {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .badge-success {
      display: inline-block;
      padding: 4px 10px;
      background-color: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-card">
      <div class="top-accent-bar"></div>
      <div class="card-body">
        
        <!-- OFFICIAL BRAND LOGO HEADER -->
        <div class="logo-container">
          <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img src="${logoUrl}" alt="Kuettu Global POS" width="170" style="display: block; max-width: 170px; height: auto; border: 0;" />
          </a>
        </div>

        <!-- MAIN TITLE -->
        <h1 class="brand-title">${title}</h1>

        <!-- CONTENT -->
        ${contentHtml}

      </div>

      <!-- DISCLAIMER SECTION -->
      <div class="card-disclaimer">
        ${disclaimerText}
      </div>
    </div>

    <!-- EXTERNAL FOOTER -->
    <div class="footer-section">
      <div style="margin-bottom: 8px;">
        <img src="${logoUrl}" alt="Kuettu Global POS" width="90" style="display: inline-block; max-width: 90px; height: auto; opacity: 0.85;" />
      </div>
      <p style="margin: 4px 0; font-weight: 600; color: #64748b;">Global POS App.</p>
      <p style="margin: 4px 0;">© ${currentYear} Kuettu Corporation SARL. Tous droits réservés.</p>
      <p style="margin: 4px 0;">
        Vous recevez cet e-mail car vous utilisez Global POS sur <a href="${appUrl}" class="footer-link">${appUrl.replace(/^https?:\/\//, "")}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Universal Resend Dispatch Engine
 * Dispatches emails via Resend REST API or simulates in development
 */
async function dispatchViaResend({
  to,
  cc,
  subject,
  html,
}: {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const config = await getSystemVerificationConfig();
  const resendApiKey =
    process.env.RESEND_API_KEY ||
    process.env.resend_api ||
    process.env.NEXT_PUBLIC_RESEND_API_KEY ||
    (config.email as any)?.apiKey ||
    (config.email as any)?.resendApiKey;

  const toList = Array.isArray(to) ? to : [to];
  const ccList = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;

  // 1. Simulation Mode ONLY if explicitly enabled in system settings
  if (config.isSimulationMode) {
    console.log("=================================================");
    console.log("✉️ [EMAIL RESEND SIMULATION] Déclenchement :");
    console.log(`➡️ Destinataire(s) : ${toList.join(", ")}`);
    if (ccList && ccList.length > 0) {
      console.log(`📋 Copie (CC)     : ${ccList.join(", ")}`);
    }
    console.log(`📌 Sujet           : ${subject}`);
    console.log("=================================================");

    return {
      success: true,
      messageId: `sim_resend_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      isSimulated: true,
    };
  }

  // 2. Direct Resend REST API Dispatch
  try {
    const configFromEmail = config.email?.fromEmail?.trim() || "noreply@globalpos.app";
    const configFromName = config.email?.fromName?.trim() || "Kuettu Global POS";

    const fromAddress = configFromEmail.includes("<")
      ? configFromEmail
      : `${configFromName} <${configFromEmail}>`;

    const payload: any = {
      from: fromAddress,
      to: toList,
      subject,
      html,
    };

    if (ccList && ccList.length > 0) {
      payload.cc = ccList;
    }

    if (!resendApiKey) {
      console.error("[Email Service Error]: Aucune clé API Resend (RESEND_API_KEY) n'est configurée.");
      return {
        success: false,
        isSimulated: false,
        error: "Clé API Resend manquante. Veuillez renseigner votre clé RESEND_API_KEY dans le fichier .env ou les paramètres d'administration.",
      };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error("[Resend API Error Response]:", resData);
      
      // Fallback 1: If custom domain error, retry with noreply@globalpos.app
      if (response.status === 403 && !fromAddress.includes("globalpos.app")) {
        console.warn("[Resend] Attempting retry with Kuettu Global POS <noreply@globalpos.app>...");
        const retryRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...payload,
            from: "Kuettu Global POS <noreply@globalpos.app>",
          }),
        });
        const retryData = await retryRes.json();
        if (retryRes.ok) {
          return {
            success: true,
            messageId: retryData.id || `resend_${Date.now()}`,
            isSimulated: false,
          };
        }
      }

      // Fallback 2: retry with onboarding@resend.dev
      if (response.status === 403) {
        console.warn("[Resend] Attempting fallback with onboarding@resend.dev...");
        const fallbackRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...payload,
            from: "Kuettu Global POS <onboarding@resend.dev>",
          }),
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok) {
          return {
            success: true,
            messageId: fallbackData.id || `resend_${Date.now()}`,
            isSimulated: false,
          };
        }
      }

      return {
        success: false,
        isSimulated: false,
        error: resData.message || resData.error || "Erreur lors de l'envoi via Resend",
      };
    }

    return {
      success: true,
      messageId: resData.id || `resend_${Date.now()}`,
      isSimulated: false,
    };
  } catch (err: any) {
    console.error("[Email Service Dispatch Exception]:", err);
    return {
      success: false,
      isSimulated: false,
      error: err.message || "Erreur inattendue lors de l'envoi de l'e-mail",
    };
  }
}

/**
 * 1. Template: Email OTP Verification (Inscription & Validation de compte)
 */
export async function sendVerificationEmail(
  toEmail: string,
  otpCode: string,
  storeName: string,
  ownerName: string
): Promise<SendEmailResult> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const salutation = ownerName?.trim() ? `Bonjour ${ownerName},` : "Bonjour,";

  const contentHtml = `
    <p class="body-text">${salutation}</p>
    <p class="body-text">
      Merci d'avoir créé votre compte sur <strong>Kuettu Global POS</strong>. Pour finaliser l'inscription de votre commerce <strong>${storeName}</strong> et activer pleinement vos accès, veuillez saisir votre code de validation sécurisé :
    </p>

    <div class="code-box-wrapper">
      <div class="code-badge">${otpCode}</div>
      <div class="expiry-text">Ce code est confidentiel et expire dans 10 minutes.</div>
    </div>

    <p class="body-text" style="font-size: 14px; color: #475569;">
      Une fois validé, vous aurez accès immédiatement à votre caisse intelligente, la gestion des stocks, des ventes et des crédits clients.
    </p>
  `;

  const html = renderBaseEmailTemplate({
    title: "Confirmez votre adresse e-mail",
    contentHtml,
    disclaimerText:
      "Si vous n'avez pas demandé la création de ce compte, vous pouvez ignorer cet e-mail en toute sécurité. Quelqu'un a probablement entré votre adresse par erreur.",
  });

  const res = await dispatchViaResend({
    to: cleanEmail,
    subject: `[Kuettu Global POS] ${otpCode} est votre code de confirmation`,
    html,
  });

  return {
    ...res,
    simulatedCode: res.isSimulated ? otpCode : undefined,
  };
}

/**
 * 2. Template: PIN Oublié (Réinitialisation sécurisée du code PIN de caisse)
 */
export async function sendForgotPinEmail(
  toEmail: string,
  otpCode: string,
  userName: string,
  storeName?: string
): Promise<SendEmailResult> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const salutation = userName?.trim() ? `Bonjour ${userName},` : "Bonjour,";
  const storeMention = storeName ? `pour votre commerce <strong>${storeName}</strong>` : "";

  const contentHtml = `
    <p class="body-text">${salutation}</p>
    <p class="body-text">
      Une demande de réinitialisation du code PIN de caisse ${storeMention} a été effectuée sur <strong>Kuettu Global POS</strong>.
    </p>
    <p class="body-text">
      Voici votre code de sécurité temporaire pour définir votre nouveau code PIN :
    </p>

    <div class="code-box-wrapper">
      <div class="code-badge">${otpCode}</div>
      <div class="expiry-text">Ce code est strictement personnel et expire dans 15 minutes.</div>
    </div>

    <p class="body-text" style="font-size: 14px; color: #475569;">
      Entrez ces 6 chiffres sur l'écran de réinitialisation afin de choisir votre nouveau code PIN à 4 chiffres.
    </p>
  `;

  const html = renderBaseEmailTemplate({
    title: "Réinitialisation de votre code PIN",
    contentHtml,
    disclaimerText:
      "Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail. Votre code PIN actuel reste inchangé et sécurisé.",
  });

  const res = await dispatchViaResend({
    to: cleanEmail,
    subject: `[Kuettu Global POS] Code de réinitialisation PIN : ${otpCode}`,
    html,
  });

  return {
    ...res,
    simulatedCode: res.isSimulated ? otpCode : undefined,
  };
}

/**
 * 3. Template: Notifications de Paiement (Mobile Money & Abonnements)
 * Envoie AUTOMATIQUEMENT à kuettusocial@gmail.com avec copie (CC) à info@kuettu.com
 */
export async function sendPaymentNotificationEmail(
  data: PaymentNotificationData
): Promise<SendEmailResult> {
  const primaryNotificationEmail = "kuettusocial@gmail.com";
  const ccNotificationEmail = "info@kuettu.com";

  // Build list of recipients
  const toList: string[] = [primaryNotificationEmail];
  const ccList: string[] = [ccNotificationEmail];

  if (data.customerEmail && data.customerEmail.includes("@")) {
    const cleanCustomer = data.customerEmail.trim().toLowerCase();
    if (!toList.includes(cleanCustomer) && !ccList.includes(cleanCustomer)) {
      ccList.push(cleanCustomer);
    }
  }

  const formattedAmount = `${new Intl.NumberFormat("fr-FR").format(data.amount)} ${data.currency || "CDF"}`;
  const formattedDate = new Date().toLocaleString("fr-FR", {
    timeZone: "Africa/Kinshasa",
    dateStyle: "full",
    timeStyle: "short",
  });

  const contentHtml = `
    <p class="body-text">Bonjour,</p>
    <p class="body-text">
      Un nouveau paiement a été enregistré et confirmé avec succès sur la plateforme <strong>Kuettu Global POS</strong>.
    </p>

    <div style="text-align: center; margin: 20px 0;">
      <span class="badge-success">✓ PAIEMENT CONFIRMÉ ET VALIDÉ</span>
    </div>

    <table class="info-table">
      <tr>
        <td class="label">Boutique / Marchand</td>
        <td class="val">${data.tenantName} ${data.storeName ? `(${data.storeName})` : ""}</td>
      </tr>
      <tr>
        <td class="label">Montant Réglé</td>
        <td class="val" style="color: #059669; font-size: 16px;">${formattedAmount}</td>
      </tr>
      <tr>
        <td class="label">Moyen de Paiement</td>
        <td class="val">${data.paymentMethod}</td>
      </tr>
      ${
        data.plan
          ? `<tr>
        <td class="label">Forfait Activé</td>
        <td class="val">Formule ${data.plan}</td>
      </tr>`
          : ""
      }
      ${
        data.transactionId
          ? `<tr>
        <td class="label">Réf. Transaction</td>
        <td class="val" style="font-family: monospace; font-size: 13px;">${data.transactionId}</td>
      </tr>`
          : ""
      }
      <tr>
        <td class="label">Date & Heure</td>
        <td class="val">${formattedDate}</td>
      </tr>
      ${
        data.notes
          ? `<tr>
        <td class="label">Détails / Notes</td>
        <td class="val">${data.notes}</td>
      </tr>`
          : ""
      }
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://globalpos.app"}/admin/subscriptions" class="btn-action">
        Consulter dans l'administration
      </a>
    </div>
  `;

  const html = renderBaseEmailTemplate({
    title: "Notification de paiement reçu",
    contentHtml,
    disclaimerText:
      "Ce message automatique est transmis aux administrateurs de Kuettu Corporation pour le suivi financier et la facturation.",
  });

  return await dispatchViaResend({
    to: toList,
    cc: ccList,
    subject: `[Paiement Reçu] ${formattedAmount} - ${data.tenantName} (${data.paymentMethod})`,
    html,
  });
}

/**
 * 4. Template: Activation Manuelle par l'Admin
 */
export async function sendManualActivationEmail(
  toEmail: string,
  storeName: string,
  ownerName?: string | null
): Promise<SendEmailResult> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const salutation = ownerName?.trim() ? `Bonjour ${ownerName},` : "Bonjour,";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://globalpos.app";

  const contentHtml = `
    <p class="body-text">${salutation}</p>
    <p class="body-text">
      Nous avons le plaisir de vous informer que votre compte commerçant <strong>${storeName}</strong> a été activé par l'équipe administrative de <strong>Kuettu Global POS</strong>.
    </p>
    <p class="body-text">
      Toutes les fonctionnalités de votre formule sont désormais débloquées et prêtes à l'emploi.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${appUrl}/auth/login" class="btn-action">
        Accéder à ma caisse Global POS
      </a>
    </div>
  `;

  const html = renderBaseEmailTemplate({
    title: "Votre compte Global POS est activé !",
    contentHtml,
    disclaimerText:
      "Pour toute assistance technique ou question sur vos forfaits, notre équipe de support Kuettu reste à votre entière disposition.",
  });

  return await dispatchViaResend({
    to: cleanEmail,
    subject: `[Kuettu Global POS] Activation confirmée de votre boutique ${storeName}`,
    html,
  });
}
