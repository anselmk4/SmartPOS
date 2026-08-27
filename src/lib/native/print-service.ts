"use client";

/**
 * Universal Isolated Print Service for Kuettu Global POS
 * Renders ONLY the designated ticket / invoice / report in an isolated iframe.
 * Eliminates background pages, sidebars, navbars, and buttons from the printout.
 */

export interface PrintOptions {
  title?: string;
  width?: "58mm" | "80mm" | "a4";
  bodyHtml: string;
}

export function printIsolatedDocument({
  title = "Ticket Kuettu Global POS",
  width = "80mm",
  bodyHtml,
}: PrintOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    // 1. Check if an existing print iframe exists and remove it
    const existingIframe = document.getElementById("kuettu-print-iframe");
    if (existingIframe) {
      existingIframe.remove();
    }

    // 2. Create invisible printing iframe
    const iframe = document.createElement("iframe");
    iframe.id = "kuettu-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      resolve(false);
      return;
    }

    const isA4 = width === "a4";
    const maxWidth = isA4 ? "210mm" : width === "58mm" ? "56mm" : "78mm";

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page {
      margin: 0;
      size: ${isA4 ? "A4 portrait" : "auto"};
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: ${isA4 ? "15mm" : "3mm 4mm"};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
      font-size: ${isA4 ? "13px" : "11px"};
      line-height: ${isA4 ? "1.4" : "1.25"};
      color: #000000;
      background: #ffffff;
      width: 100%;
      max-width: ${maxWidth};
      margin-left: auto;
      margin-right: auto;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .text-xs { font-size: 10px; }
    .text-sm { font-size: 12px; }
    .text-base { font-size: 13px; }
    .text-lg { font-size: 15px; font-weight: bold; }
    .border-b { border-bottom: 1px dashed #000000; }
    .border-t { border-top: 1px dashed #000000; }
    .border-solid { border-style: solid; }
    .py-1 { padding-top: 2px; padding-bottom: 2px; }
    .py-2 { padding-top: 4px; padding-bottom: 4px; }
    .my-1 { margin-top: 3px; margin-bottom: 3px; }
    .my-2 { margin-top: 6px; margin-bottom: 6px; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-center { align-items: center; }
    .space-y-1 > * + * { margin-top: 2px; }
    .space-y-2 > * + * { margin-top: 5px; }
    .divider {
      border-top: 1px dashed #000000;
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${isA4 ? "12px" : "10px"};
    }
    th, td {
      padding: ${isA4 ? "6px 4px" : "2px 0"};
      text-align: left;
    }
    th {
      border-bottom: 1px solid #000000;
      font-weight: bold;
    }
    .badge {
      display: inline-block;
      padding: 1px 4px;
      font-size: 9px;
      font-weight: bold;
      border: 1px solid #000000;
      border-radius: 3px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    img.ticket-logo {
      max-width: 60px;
      height: auto;
      display: block;
      margin: 0 auto 4px auto;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Trigger printing once loaded
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        resolve(true);
      } catch (err) {
        console.error("[PrintService Error]", err);
        resolve(false);
      } finally {
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      }
    }, 250);
  });
}
