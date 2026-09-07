"use client";

import React, { useState } from "react";
import {
  QrCode,
  Copy,
  Check,
  Share2,
  Printer,
  Download,
  ExternalLink,
  X,
  Store,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { generateQRCodeDataUrl, generatePrintableCounterStandHTML } from "@/lib/utils/qr-code";

interface StoreQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: {
    id: string;
    name: string;
    businessType?: string;
    logoUrl?: string;
    phone?: string;
    currency?: string;
    address?: string;
  };
}

export function StoreQRModal({ isOpen, onClose, store }: StoreQRModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Determine origin URL
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://globalpos.app";

  const publicUrl = `${origin}/catalog/${store.id}`;
  const qrImageUrl = generateQRCodeDataUrl(publicUrl, { size: 360 });

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Consultez notre catalogue et nos tarifs en direct sur notre lien officiel :\n${publicUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handlePrintStand = () => {
    const htmlContent = generatePrintableCounterStandHTML({
      storeName: store.name,
      businessType: store.businessType,
      logoUrl: store.logoUrl,
      phone: store.phone,
      currency: store.currency,
      address: store.address,
      publicUrl,
    });

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `QRCode-Tarifs-${store.name.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(qrImageUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Code QR & Tarifs Publics
              </h2>
              <p className="text-xs text-slate-400">Catalogue en ligne de votre boutique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto py-4 space-y-4 text-center">
          {/* QR Display Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center">
            <div className="bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-sm mb-2">
              <img
                src={qrImageUrl}
                alt="QR Code Catalogue"
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{store.name}</span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
              Vos clients peuvent scanner ce code pour consulter vos articles et tarifs en temps réel (sans afficher vos stocks).
            </p>
          </div>

          {/* Direct Link Input */}
          <div className="text-left space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Lien public direct :
            </label>
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 bg-transparent px-2 text-xs font-medium text-slate-700 outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handlePrintStand}
              className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <Printer className="w-5 h-5 text-blue-600" />
              <span>Imprimer l'Affiche</span>
              <span className="text-[10px] text-blue-500 font-normal">A4/A5 pour comptoir</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <MessageCircle className="w-5 h-5 fill-emerald-600 text-emerald-600" />
              <span>Partager sur WhatsApp</span>
              <span className="text-[10px] text-emerald-500 font-normal">Envoyer aux clients</span>
            </button>

            <button
              onClick={handleDownloadQR}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors col-span-1"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger PNG</span>
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors col-span-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ouvrir la page</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
