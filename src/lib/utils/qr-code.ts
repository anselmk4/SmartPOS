/**
 * Standalone QR Code Generator in TypeScript
 * Generates standards-compliant QR Code URLs and printable counter displays.
 */

export interface QRCodeOptions {
  size?: number; // Output pixel size (default 300)
  margin?: number; // Quiet zone modules (default 1)
  foregroundColor?: string; // default "#0f172a"
  backgroundColor?: string; // default "#ffffff"
}

/**
 * Returns a public web QR code image URL
 */
export function generateQRCodeDataUrl(
  text: string,
  options: QRCodeOptions = {}
): string {
  const size = options.size || 300;
  const fg = encodeURIComponent(options.foregroundColor || "#0f172a");
  const bg = encodeURIComponent(options.backgroundColor || "#ffffff");
  const encodedText = encodeURIComponent(text);

  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&color=${fg.replace("#", "")}&bgcolor=${bg.replace("#", "")}&margin=1`;
}

/**
 * Generates an HTML string for a printable A4/A5 store counter display stand
 */
export function generatePrintableCounterStandHTML(params: {
  storeName: string;
  businessType?: string;
  logoUrl?: string;
  phone?: string;
  currency?: string;
  publicUrl: string;
  address?: string;
}): string {
  const { storeName, businessType, logoUrl, phone, publicUrl, address } = params;
  const qrUrl = generateQRCodeDataUrl(publicUrl, { size: 400 });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Présentoir Tarifs & Menu - ${escapeHtml(storeName)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #0f172a;
    }
    .stand-card {
      width: 100%;
      max-width: 520px;
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 32px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.08);
      page-break-inside: avoid;
    }
    .logo-box {
      width: 80px;
      height: 80px;
      margin: 0 auto 16px auto;
      border-radius: 20px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 2px solid #e2e8f0;
    }
    .logo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .store-name {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    .badge {
      display: inline-block;
      padding: 4px 14px;
      background: #eff6ff;
      color: #2563eb;
      font-size: 13px;
      font-weight: 700;
      border-radius: 9999px;
      margin-bottom: 24px;
    }
    .qr-container {
      background: #ffffff;
      border: 3px solid #0f172a;
      border-radius: 28px;
      padding: 20px;
      width: 280px;
      height: 280px;
      margin: 0 auto 24px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-container img {
      width: 240px;
      height: 240px;
      display: block;
    }
    .scan-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .scan-subtitle {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .features-row {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .feat-pill {
      font-size: 11px;
      font-weight: 600;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 6px 12px;
      border-radius: 12px;
      color: #475569;
    }
    .footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 16px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-print {
      margin-top: 20px;
      padding: 12px 28px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 14px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }
    @media print {
      body {
        background: transparent;
      }
      .stand-card {
        box-shadow: none;
        border: 2px solid #cbd5e1;
        max-width: 100%;
      }
      .btn-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div>
    <div class="stand-card">
      ${
        logoUrl
          ? `<div class="logo-box"><img src="${escapeHtml(logoUrl)}" alt="Logo" /></div>`
          : `<div class="logo-box"><span style="font-size: 32px;">🏪</span></div>`
      }
      <h1 class="store-name">${escapeHtml(storeName)}</h1>
      ${businessType ? `<div class="badge">${escapeHtml(businessType)}</div>` : ""}

      <div class="qr-container">
        <img src="${qrUrl}" alt="QR Code Tarifs" />
      </div>

      <h2 class="scan-title">📲 Scannez pour voir nos tarifs & menu</h2>
      <p class="scan-subtitle">
        Pointez l'appareil photo de votre smartphone sur le code QR pour découvrir la liste complète de nos articles et prix à jour.
      </p>

      <div class="features-row">
        <div class="feat-pill">✨ Sans application</div>
        <div class="feat-pill">⚡ Tarifs en direct</div>
        ${phone ? `<div class="feat-pill">📞 ${escapeHtml(phone)}</div>` : ""}
      </div>

      <div class="footer">
        <span>${address ? escapeHtml(address) : "Tarifs officiels vérifiés"}</span>
        <span style="display: flex; items-center; gap: 4px; font-weight: 700; color: #2563eb;">
          <img src="https://globalpos.app/images/logo.png" alt="Kuettu" style="height: 12px; width: auto; vertical-align: middle; display: inline-block; margin-right: 4px;" onerror="this.style.display='none'" />
          Propulsé par Kuettu Global POS
        </span>
      </div>
    </div>
    
    <div style="text-align: center;">
      <button class="btn-print" onclick="window.print()">Imprimer cette affiche</button>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
