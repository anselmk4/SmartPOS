"use client";

import React, { useState } from "react";
import type { Subscription, Tenant } from "@/lib/shared/types";
import { printIsolatedDocument } from "@/lib/native/print-service";
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Building,
  Calendar,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Crown,
  Clock,
  Sparkles,
  DollarSign,
  Gift,
  FileText,
  BadgeCheck,
} from "lucide-react";

interface SubscriptionInvoiceModalProps {
  subscription: Subscription | null;
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionInvoiceModal({
  subscription,
  tenant,
  isOpen,
  onClose,
}: SubscriptionInvoiceModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !subscription) return null;

  const invoiceNumber =
    subscription.transactionId ||
    `FAC-SUB-${new Date(subscription.createdAt || Date.now()).getFullYear()}${String(new Date(subscription.createdAt || Date.now()).getMonth() + 1).padStart(2, "0")}-${subscription.id.slice(0, 6).toUpperCase()}`;

  const createdDate = subscription.createdAt ? new Date(subscription.createdAt) : new Date();
  const formattedDate = createdDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const formattedTime = createdDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const startDate = subscription.periodStart ? new Date(subscription.periodStart) : createdDate;
  const endDate = subscription.periodEnd
    ? new Date(subscription.periodEnd)
    : new Date(startDate.getTime() + 30 * 86400000);

  const formattedStart = startDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedEnd = endDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Calculate approximate duration in months
  const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const durationMonths = Math.max(1, Math.round(durationDays / 30));

  const isFree = Number(subscription.amount || 0) === 0;

  const planName =
    subscription.plan === "BASIC"
      ? "Commerçant Basic"
      : subscription.plan === "PRO"
      ? "Commerçant Pro"
      : subscription.plan === "BUSINESS"
      ? "Business Multi-Magasins"
      : "Découverte";

  const currency = subscription.currency || tenant?.currency || "CDF";

  const paymentLabel = (() => {
    switch (subscription.paymentMethod) {
      case "CASH":
        return "Règlement Manuel Direct / Espèces (Hors PawaPay)";
      case "MPESA":
        return "Vodacom M-Pesa Direct";
      case "AIRTEL_MONEY":
        return "Airtel Money Direct";
      case "ORANGE_MONEY":
        return "Orange Money Direct";
      case "AFRIMONEY":
        return "AfriMoney Direct";
      case "WAVE":
        return "Wave Mobile Money";
      case "MTN_MOMO":
        return "MTN MoMo";
      case "CARD":
        return "Virement Bancaire / Carte";
      default:
        return isFree ? "Activation Gracieuse / Offerte" : subscription.paymentMethod || "Paiement direct";
    }
  })();

  const handlePrintPDF = async () => {
    setIsPrinting(true);
    try {
      const qrData = encodeURIComponent(`https://globalpos.app/billing?invoice=${invoiceNumber}`);
      const bodyHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.4; padding: 10px;">
          
          <!-- TOP HEADER: GlobalPOS Branding & Platform Info -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #1e3a8a, #2563eb); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 24px; box-shadow: 0 4px 10px rgba(37,99,235,0.2);">
                GP
              </div>
              <div>
                <div style="font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; line-height: 1.1;">
                  GLOBAL<span style="color: #2563eb;">POS</span>
                </div>
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-top: 2px;">
                  Micro-ERP & Retail Cloud SaaS
                </div>
                <div style="font-size: 10px; color: #64748b; margin-top: 3px;">
                  Plateforme Centrale de Gestion Commerciale, Stocks & Caisses
                </div>
              </div>
            </div>

            <div style="text-align: right; font-size: 10px; color: #475569; max-width: 300px; line-height: 1.45;">
              <div style="font-weight: bold; color: #0f172a; font-size: 11px;">Kuettu Corporation SARL</div>
              <div>Bukavu - République Démocratique du Congo</div>
              <div>RCCM : CD/BKV/RCCM/20-B-00023</div>
              <div>Support : <b>support@globalpos.app</b> | <b>+243 990 387 237</b></div>
            </div>
          </div>

          <!-- INVOICE BADGE & REFERENCE TITLE -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
            <div>
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">
                FACTURE D'ABONNEMENT SAAS
              </div>
              <div style="font-size: 18px; font-weight: 900; color: #1e3a8a; font-family: monospace; margin-top: 2px;">
                N° ${invoiceNumber}
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                Date d'émission : <b>${formattedDate} à ${formattedTime}</b>
              </div>
            </div>

            <div style="text-align: right;">
              <div style="background: #ecfdf5; color: #065f46; border: 1.5px solid #a7f3d0; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 900; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                ✓ FACTURE ACQUITTÉE
              </div>
              <div style="font-size: 11px; color: #059669; font-weight: bold; margin-top: 4px;">
                Paiement 100% validé & enregistré
              </div>
            </div>
          </div>

          <!-- CLIENT INFO & SUBSCRIPTION VALIDITY GRID -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px;">
            <!-- Beneficiary Shop -->
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px;">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #2563eb; letter-spacing: 0.5px; margin-bottom: 6px;">
                Boutique / Commerce Bénéficiaire
              </div>
              <div style="font-size: 15px; font-weight: 900; color: #0f172a;">
                ${tenant?.name || "Boutique Cliente"}
              </div>
              ${tenant?.phone ? `<div style="font-size: 11px; color: #334155; margin-top: 3px;">Tél : <b>${tenant.phone}</b></div>` : ""}
              ${tenant?.address ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">Adresse : ${tenant.address}</div>` : ""}
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                Pays : <b>${tenant?.countryCode || "CD"}</b> • Devise du compte : <b>${currency}</b>
              </div>
            </div>

            <!-- Subscription Period & Expiration -->
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px;">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #059669; letter-spacing: 0.5px; margin-bottom: 6px;">
                Période de Validité & Échéance
              </div>
              <div style="font-size: 12px; color: #0f172a; margin-bottom: 3px;">
                Période active : <b>Du ${formattedStart} au ${formattedEnd}</b>
              </div>
              <div style="font-size: 12px; color: #0f172a; margin-bottom: 3px;">
                Durée souscrite : <b>${durationMonths} mois (${durationDays} jours)</b>
              </div>
              <div style="font-size: 13px; font-weight: 900; color: #059669; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
                Date d'échéance : ${formattedEnd}
              </div>
            </div>
          </div>

          <!-- SERVICES & PLAN DETAILS TABLE -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
            <thead>
              <tr style="background: #1e3a8a; color: #ffffff;">
                <th style="padding: 10px 12px; text-align: left; border-top-left-radius: 8px;">Désignation de la Prestation</th>
                <th style="padding: 10px 12px; text-align: center; width: 90px;">Durée</th>
                <th style="padding: 10px 12px; text-align: center; width: 170px;">Mode de Règlement</th>
                <th style="padding: 10px 12px; text-align: right; width: 140px; border-top-right-radius: 8px;">Total (${currency})</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                <td style="padding: 14px 12px; vertical-align: top;">
                  <div style="font-size: 14px; font-weight: 900; color: #0f172a;">
                    Abonnement Logiciel GlobalPOS — ${planName}
                  </div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.35;">
                    Licence d'utilisation cloud, caisses tactiles, gestion des stocks, carnet de dettes clients, sauvegarde automatique et synchronisation multi-terminaux.
                  </div>
                  <div style="font-size: 10px; color: #2563eb; font-weight: bold; margin-top: 4px;">
                    Valable du ${formattedStart} au ${formattedEnd}
                  </div>
                </td>
                <td style="padding: 14px 12px; text-align: center; vertical-align: middle; font-weight: bold; color: #0f172a;">
                  ${durationMonths} mois
                </td>
                <td style="padding: 14px 12px; text-align: center; vertical-align: middle;">
                  <span style="display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: bold; color: #334155;">
                    ${paymentLabel}
                  </span>
                </td>
                <td style="padding: 14px 12px; text-align: right; vertical-align: middle; font-size: 15px; font-weight: 900; font-family: monospace; color: #0f172a;">
                  ${isFree ? `<span style="color: #d97706;">0 ${currency} (Offert)</span>` : `${Number(subscription.amount || 0).toLocaleString("fr-FR")} ${currency}`}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- FINANCIAL TOTALS & PAYMENT RECAP -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
            <div style="max-width: 320px; font-size: 11px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
              <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px;">Modalités & Référence :</div>
              <div>Canal de paiement : <b>${paymentLabel}</b></div>
              <div>Réf transaction : <b style="font-family: monospace; color: #1e3a8a;">${invoiceNumber}</b></div>
              <div style="margin-top: 4px; color: #059669; font-weight: bold;">
                ✓ Paiement 100% acquitté et validé par l'Administration
              </div>
            </div>

            <div style="width: 270px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 14px; font-size: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569;">
                <span>Total Prestation HT :</span>
                <span style="font-family: monospace; font-weight: bold;">${isFree ? "0" : Number(subscription.amount || 0).toLocaleString("fr-FR")} ${currency}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569;">
                <span>TVA (Régime SaaS 0%) :</span>
                <span style="font-family: monospace;">0 ${currency}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 2px solid #94a3b8; font-size: 16px; font-weight: 900; color: #1e3a8a;">
                <span>TOTAL TTC RÉGLÉ :</span>
                <span style="font-family: monospace; color: #059669;">
                  ${isFree ? "0 " + currency : `${Number(subscription.amount || 0).toLocaleString("fr-FR")} ${currency}`}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: #059669; font-weight: bold;">
                <span>Solde restant dû :</span>
                <span>0 ${currency}</span>
              </div>
            </div>
          </div>

          <!-- SIGNATURES, DIGITAL STAMP & QR CODE -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 24px; padding-top: 14px; border-top: 1px dashed #cbd5e1;">
            <!-- Client acceptance -->
            <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; height: 110px; display: flex; flex-direction: column; justify-content: space-between; text-align: center;">
              <div style="font-size: 11px; font-weight: bold; color: #64748b;">Signature & Cachet de la Boutique</div>
              <div style="font-size: 10px; color: #94a3b8;">Reçu conforme pour activation du compte</div>
              <div style="border-bottom: 1px dashed #cbd5e1; width: 60%; margin: 0 auto;"></div>
            </div>

            <!-- Platform Official Stamp & Signature -->
            <div style="border: 1.5px solid #bfdbfe; background: #eff6ff; border-radius: 10px; padding: 12px; height: 110px; display: flex; flex-direction: column; justify-content: space-between; text-align: center; position: relative;">
              <div style="font-size: 11px; font-weight: 900; color: #1e3a8a;">KUETTU CORPORATION SARL — DIRECTION FINANCIÈRE</div>
              <div style="display: inline-block; margin: 0 auto; padding: 4px 10px; border: 1.5px solid #2563eb; color: #1e3a8a; font-weight: 900; font-size: 10px; text-transform: uppercase; border-radius: 6px; transform: rotate(-2deg);">
                ✓ CERTIFIED & VALIDATED SAAS
              </div>
              <div style="font-size: 9px; color: #3b82f6; font-weight: bold;">Signature Électronique Certifiée</div>
            </div>
          </div>

          <!-- FOOTER & AUTHENTICITY URL -->
          <div style="border-top: 2px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b;">
            <div>
              <div style="font-weight: bold; color: #0f172a;">Document officiel émis par Kuettu Corporation SARL — GlobalPOS Cloud ERP</div>
              <div style="margin-top: 2px;">Vérification de validité en ligne : <a href="https://globalpos.app" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: bold;">https://globalpos.app</a></div>
              <div style="margin-top: 2px; color: #94a3b8;">RCCM : CD/BKV/RCCM/20-B-00023 • Bukavu, Sud-Kivu, RDC</div>
            </div>

            <div style="text-align: center;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrData}" alt="QR Code GlobalPOS" style="width: 55px; height: 55px; display: block; margin: 0 auto 2px auto;" />
              <span style="font-size: 8px; color: #94a3b8;">Scanner pour vérifier</span>
            </div>
          </div>

        </div>
      `;

      await printIsolatedDocument({
        title: `Facture_Abonnement_${invoiceNumber}`,
        width: "a4",
        bodyHtml,
      });
    } catch (err) {
      console.error("[Print Invoice Error]", err);
      alert("Erreur lors de l'impression de la facture.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShare = () => {
    const text =
      `🧾 *FACTURE D'ABONNEMENT KUETTU CORPORATION*\n` +
      `Facture N° : ${invoiceNumber}\n` +
      `Boutique : ${tenant?.name || "Boutique"}\n` +
      `Forfait : ${planName} (${durationMonths} mois)\n` +
      `Montant : ${isFree ? "Gratuit / Offert" : `${subscription.amount} ${currency}`}\n` +
      `Période : Du ${formattedStart} au ${formattedEnd}\n` +
      `Date d'échéance : ${formattedEnd}\n` +
      `Statut : ACQUITTÉ & ACTIF ✅\n` +
      `Émetteur : Kuettu Corporation SARL (RCCM : CD/BKV/RCCM/20-B-00023, Bukavu RDC)`;

    if (navigator.share) {
      navigator.share({ title: `Facture_${invoiceNumber}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Détails de la facture copiés dans le presse-papier.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Modal Top Actions */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold border border-blue-500/20">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                Facture d'Abonnement Kuettu Corporation
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">{invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPDF}
              disabled={isPrinting}
              className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all touch-press"
            >
              {isPrinting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>Imprimer / PDF</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Partager les détails"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Visual Preview */}
        <div className="p-6 sm:p-7 space-y-5 text-slate-200 text-xs max-h-[75vh] overflow-y-auto">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black text-white tracking-tight">
                  GLOBAL<span className="text-blue-500">POS</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase">
                  Kuettu Corp
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Plateforme Centrale SaaS • Caisses & Stocks
              </p>
              <p className="text-[11px] text-slate-500">
                Kuettu Corporation SARL • Bukavu, RDC
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Facture Acquittée</span>
              </div>
              <h2 className="text-sm font-black text-white font-mono">{invoiceNumber}</h2>
              <p className="text-xs text-slate-400">
                Émise le : <b>{formattedDate}</b>
              </p>
            </div>
          </div>

          {/* Beneficiary & Validity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            {/* Beneficiary */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Boutique / Commerce Bénéficiaire
              </span>
              <div className="font-black text-white text-sm">
                {tenant?.name || "Boutique Cliente"}
              </div>
              {tenant?.phone && (
                <div className="text-slate-300">Tél : {tenant.phone}</div>
              )}
              {tenant?.address && (
                <div className="text-slate-400">Adresse : {tenant.address}</div>
              )}
              <div className="text-slate-400">
                Pays : <b>{tenant?.countryCode || "CD"}</b> • Devise : <b>{currency}</b>
              </div>
            </div>

            {/* Validity & Expiry */}
            <div className="space-y-1.5 sm:border-l sm:border-slate-700/60 sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Période de Validité & Échéance
              </span>
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Du {formattedStart} au {formattedEnd}</span>
              </div>
              <div className="text-slate-300">
                Durée souscrite : <b>{durationMonths} mois ({durationDays} jours)</b>
              </div>
              <div className="text-emerald-400 font-bold flex items-center gap-1">
                <BadgeCheck className="w-4 h-4" />
                <span>Date d'échéance : {formattedEnd}</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-2">Désignation</th>
                  <th className="py-2.5 px-2 text-center">Durée</th>
                  <th className="py-2.5 px-2 text-center">Mode de Règlement</th>
                  <th className="py-2.5 px-2 text-right">Montant Total</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-slate-800 divide-slate-800/60">
                <tr>
                  <td className="py-3 px-2">
                    <div className="font-black text-white text-sm">
                      Abonnement SaaS {planName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Licence d'utilisation logicielle, accès caisse tactile et sauvegarde cloud
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-slate-300 whitespace-nowrap">
                    {durationMonths} mois
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-[11px] border border-slate-700">
                      {paymentLabel}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-black text-white text-sm whitespace-nowrap">
                    {isFree ? (
                      <span className="text-amber-400">0 {currency} (Offert)</span>
                    ) : (
                      `${Number(subscription.amount || 0).toLocaleString("fr-FR")} ${currency}`
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs text-slate-400">
              <div>Mode de paiement : <b>{paymentLabel}</b></div>
              <div>Réf transaction : <b className="font-mono text-slate-300">{invoiceNumber}</b></div>
              <div className="text-[11px] text-emerald-400 font-bold">
                ✓ Règlement 100% perçu et validé par l'Administration
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 space-y-1 w-full sm:w-auto">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Total TTC Réglé
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {isFree
                  ? "0 " + currency
                  : `${Number(subscription.amount || 0).toLocaleString("fr-FR")} ${currency}`}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                TVA : Exonéré • Reste à payer : 0
              </div>
            </div>
          </div>

          {/* Actions Banner */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-xs">
                Cliquez sur <b>Imprimer / PDF</b> pour générer la version officielle prête à imprimer ou télécharger.
              </span>
            </div>
            <button
              onClick={handlePrintPDF}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 shadow-md shadow-blue-600/30 transition-all touch-press"
            >
              Imprimer Facture A4
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
