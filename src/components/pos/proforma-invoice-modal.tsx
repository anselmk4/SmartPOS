"use client";

import React, { useRef } from "react";
import type { CartItem, Customer, Store, Tenant } from "@/lib/shared/types";
import { Printer, MessageCircle, X, FileText, Share2, Check } from "lucide-react";
import { printIsolatedDocument } from "@/lib/native/print-service";

interface ProformaInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  tableOrLabel?: string;
  selectedCustomer?: Customer | null;
  store?: Store | null;
  tenant?: Tenant | null;
  cashierName?: string;
  formatMoney: (amount: number) => string;
  currency: string;
  onSaveAsHoldAndClose?: () => void;
}

export function ProformaInvoiceModal({
  isOpen,
  onClose,
  items,
  subtotalAmount,
  discountAmount,
  totalAmount,
  tableOrLabel,
  selectedCustomer,
  store,
  tenant,
  cashierName,
  formatMoney,
  currency,
  onSaveAsHoldAndClose,
}: ProformaInvoiceModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const proformaNumber = `PRF-${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const handlePrint = async () => {
    const storeName = store?.name || tenant?.name || "Kuettu Global POS";
    const address = store?.address ? `<p class="text-xs">${store.address}</p>` : "";
    const phone = store?.phone ? `<p class="text-xs">Tél: ${store.phone}</p>` : "";

    const itemsHtml = items
      .map(
        (it) => `
      <tr>
        <td><b>${it.product.name}</b><br/><span style="font-size: 9px; color: #444;">${it.quantity} x ${formatMoney(it.unitPrice)}</span></td>
        <td class="text-right font-black" style="vertical-align: middle;">${formatMoney(it.subtotal)}</td>
      </tr>`
      )
      .join("");

    const bodyHtml = `
      <div class="text-center">
        <div class="font-black text-base uppercase">${storeName}</div>
        ${address}
        ${phone}
        <div class="divider"></div>
        <div class="badge uppercase">*** ADDITION / NOTE PROVISOIRE ***</div>
      </div>

      <div class="divider"></div>
      <div style="font-size: 10px; line-height: 1.3;">
        <div class="flex justify-between"><span>Note N° :</span><b>${proformaNumber}</b></div>
        <div class="flex justify-between"><span>Date :</span><span>${dateStr} ${timeStr}</span></div>
        ${tableOrLabel ? `<div class="flex justify-between font-bold"><span>Table / Ref :</span><span>${tableOrLabel}</span></div>` : ""}
        ${selectedCustomer ? `<div class="flex justify-between"><span>Client :</span><b>${selectedCustomer.name}</b></div>` : ""}
        ${cashierName ? `<div class="flex justify-between"><span>Caissier :</span><span>${cashierName}</span></div>` : ""}
      </div>

      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="divider"></div>
      <div style="font-size: 11px;">
        <div class="flex justify-between"><span>Sous-total Brut :</span><span>${formatMoney(subtotalAmount)}</span></div>
        ${discountAmount > 0 ? `<div class="flex justify-between font-bold"><span>Remise déduite :</span><span>-${formatMoney(discountAmount)}</span></div>` : ""}
        <div class="divider"></div>
        <div class="flex justify-between font-black text-sm" style="font-size: 13px;"><span>NET À PAYER :</span><span>${formatMoney(totalAmount)}</span></div>
      </div>

      <div class="divider"></div>
      <div class="text-center text-xs" style="color: #444; font-size: 9px; line-height: 1.3;">
        <p>Document provisoire ne valant pas quittance</p>
        <p>Paiement accepté : Espèces, Mobile Money, Carte</p>
        <p style="margin-top: 3px; font-weight: bold;">Kuettu Global POS • https://globalpos.app</p>
      </div>
    `;

    await printIsolatedDocument({
      title: `Addition_${proformaNumber}`,
      width: "80mm",
      bodyHtml,
    });
  };

  const handleWhatsAppShare = () => {
    if (!selectedCustomer?.phone && !store?.phone) return;
    const phoneToUse = selectedCustomer?.phone?.replace(/\D/g, "");
    if (!phoneToUse) return;

    let msg = `🧾 *${store?.name || "Global POS"} - ADDITION / NOTE À PAYER*\n`;
    msg += `N° Note : ${proformaNumber}\n`;
    if (tableOrLabel) msg += `📍 Table / Ref : ${tableOrLabel}\n`;
    msg += `📅 Date : ${dateStr} à ${timeStr}\n\n`;
    msg += `*DÉTAIL DES ARTICLES :*\n`;
    items.forEach((it) => {
      msg += `▪️ ${it.product.name} (x${it.quantity}) : ${formatMoney(it.subtotal)}\n`;
    });
    msg += `\n*TOTAL NET À PAYER : ${formatMoney(totalAmount)}*\n`;
    if (discountAmount > 0) msg += `(Remise déduite : -${formatMoney(discountAmount)})\n`;
    msg += `\n_Merci pour votre confiance !_`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${phoneToUse}?text=${encoded}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in zoom-in-95">
      <div className="bg-white w-full max-w-sm max-h-[90vh] rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Addition / Note Provisoire
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div
          ref={receiptRef}
          className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl p-4 border border-slate-200 text-slate-800 font-mono text-xs space-y-2.5 my-1"
        >
          {/* Store info */}
          <div className="text-center pb-2 border-b border-dashed border-slate-300">
            <h4 className="font-black text-sm uppercase text-slate-900 tracking-wide">
              {store?.name || tenant?.name || "Kuettu Global POS"}
            </h4>
            {store?.address && <p className="text-[10px] text-slate-500">{store.address}</p>}
            {store?.phone && <p className="text-[10px] text-slate-500">Tél: {store.phone}</p>}
            <div className="mt-1.5 inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-black text-[10px] uppercase tracking-wider">
              *** ADDITION / NOTE PROVISOIRE ***
            </div>
          </div>

          {/* Metadata */}
          <div className="text-[11px] text-slate-600 space-y-0.5 pb-2 border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span>Note N° :</span>
              <span className="font-bold text-slate-800">{proformaNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date :</span>
              <span>{dateStr} {timeStr}</span>
            </div>
            {tableOrLabel && (
              <div className="flex justify-between font-bold text-blue-700">
                <span>Table / Emplacement :</span>
                <span>{tableOrLabel}</span>
              </div>
            )}
            {selectedCustomer && (
              <div className="flex justify-between">
                <span>Client :</span>
                <span className="font-semibold">{selectedCustomer.name}</span>
              </div>
            )}
            {cashierName && (
              <div className="flex justify-between">
                <span>Serveur / Caissier :</span>
                <span>{cashierName}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-300">
            {items.map((it) => (
              <div key={it.product.id} className="flex justify-between items-start text-[11px]">
                <div className="flex-1 pr-2">
                  <div className="font-bold text-slate-900 truncate">{it.product.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {it.quantity} × {formatMoney(it.unitPrice)}
                  </div>
                </div>
                <div className="font-black text-slate-900 shrink-0">
                  {formatMoney(it.subtotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Sous-total Brut :</span>
              <span>{formatMoney(subtotalAmount)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Remise :</span>
                <span>- {formatMoney(discountAmount)}</span>
              </div>
            )}
            <div className="pt-1.5 border-t border-slate-300 flex justify-between text-sm font-black text-slate-900">
              <span>NET À PAYER :</span>
              <span className="text-blue-700 font-black">{formatMoney(totalAmount)}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 text-[10px] text-slate-400">
            <p>Document provisoire ne valant pas quittance</p>
            <p>Paiement accepté : Espèces, Mobile Money, Carte</p>
            <p className="mt-1 font-bold text-blue-600">Kuettu Global POS • https://globalpos.app</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer Note</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              disabled={!selectedCustomer?.phone}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          {onSaveAsHoldAndClose && (
            <button
              onClick={onSaveAsHoldAndClose}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
            >
              <span>💾 Conserver en Attente (Libérer la Caisse)</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
          >
            Fermer sans mettre en attente
          </button>
        </div>
      </div>
    </div>
  );
}
