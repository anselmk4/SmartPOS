"use client";

import React, { useRef } from "react";
import type { Subscription, Tenant } from "@/lib/shared/types";
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
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !subscription) return null;

  const invoiceNumber = subscription.transactionId || `FAC-SUB-${subscription.id.slice(0, 8).toUpperCase()}`;

  const createdDate = subscription.createdAt ? new Date(subscription.createdAt) : new Date();
  const formattedDate = createdDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const startDate = subscription.periodStart ? new Date(subscription.periodStart) : createdDate;
  const endDate = subscription.periodEnd ? new Date(subscription.periodEnd) : new Date(startDate.getTime() + 30 * 86400000);

  const formattedStart = startDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedEnd = endDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Calculate approximate duration in months
  const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
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

  const paymentLabel = (() => {
    switch (subscription.paymentMethod) {
      case "CASH":
        return "Règlement Manuel / Espèces (Validé par l'Administration)";
      case "MPESA":
        return "Vodacom M-Pesa";
      case "AIRTEL_MONEY":
        return "Airtel Money";
      case "ORANGE_MONEY":
        return "Orange Money";
      case "AFRIMONEY":
        return "AfriMoney";
      case "WAVE":
        return "Wave Mobile Money";
      case "MTN_MOMO":
        return "MTN MoMo";
      case "CARD":
        return "Virement / Carte bancaire";
      default:
        return isFree ? "Offert par l'Administration" : subscription.paymentMethod || "Paiement direct";
    }
  })();

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `🧾 *FACTURE D'ABONNEMENT KUETTU POS*\n` +
      `Facture N° : ${invoiceNumber}\n` +
      `Boutique : ${tenant?.name || "Boutique"}\n` +
      `Forfait : ${planName} (${durationMonths} mois)\n` +
      `Montant : ${isFree ? "Gratuit / Offert" : `${subscription.amount} ${subscription.currency}`}\n` +
      `Échéance : ${formattedEnd}\n` +
      `Statut : ACQUITTÉ & ACTIF ✅`;

    if (navigator.share) {
      navigator.share({ title: `Facture_${invoiceNumber}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Détails de la facture copiés dans le presse-papier.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:bg-white print:text-black print:max-w-none print:m-0 animate-in zoom-in-95 duration-200">
        {/* Modal Top Actions (Hidden in print) */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Facture d'Abonnement SaaS</h3>
              <p className="text-[11px] text-slate-400 font-mono">{invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all touch-press"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimer / PDF</span>
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

        {/* Printable Invoice Document Body */}
        <div
          ref={invoiceRef}
          className="p-6 sm:p-8 bg-slate-900 print:bg-white print:text-black space-y-6 text-slate-200"
        >
          {/* Header row: Platform Info & Invoice Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:border-slate-300">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black text-white print:text-black tracking-tight">
                  KUETTU GLOBAL POS
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 print:bg-slate-100 print:text-slate-800 text-[10px] font-black uppercase">
                  SaaS ERP
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Plateforme de Gestion Commerciale, Caisses & Stocks
              </p>
              <p className="text-[11px] text-slate-500 print:text-slate-600">
                Facturation Centrale SaaS • Support : +243 897 458 980
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 print:bg-emerald-100 print:text-emerald-800 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                ✓ FACTURE ACQUITTÉE
              </div>
              <h2 className="text-sm sm:text-base font-black text-white print:text-black font-mono">
                {invoiceNumber}
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Date d'émission : <b>{formattedDate}</b>
              </p>
            </div>
          </div>

          {/* Client Details and Period Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/40 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-xs">
            {/* Beneficiary */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-500 tracking-wider block">
                Boutique / Commerce Bénéficiaire
              </span>
              <div className="font-black text-white print:text-black text-sm">
                {tenant?.name || "Boutique Cliente"}
              </div>
              {tenant?.phone && (
                <div className="text-slate-300 print:text-slate-700">
                  Tél : {tenant.phone}
                </div>
              )}
              {tenant?.address && (
                <div className="text-slate-400 print:text-slate-600">
                  Adresse : {tenant.address}
                </div>
              )}
              <div className="text-slate-400 print:text-slate-600">
                Pays : <b>{tenant?.countryCode || "CD"}</b> • Devise : <b>{subscription.currency || tenant?.currency || "CDF"}</b>
              </div>
            </div>

            {/* Validity & Expiry */}
            <div className="space-y-1.5 sm:border-l sm:border-slate-700/60 sm:print:border-slate-300 sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-500 tracking-wider block">
                Période de Validité & Échéance
              </span>
              <div className="font-bold text-slate-200 print:text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400 print:text-blue-600" />
                <span>Du {formattedStart} au {formattedEnd}</span>
              </div>
              <div className="text-slate-300 print:text-slate-700">
                Durée souscrite : <b>{durationMonths} mois ({durationDays} jours)</b>
              </div>
              <div className="text-emerald-400 print:text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Date d'échéance : {formattedEnd}</span>
              </div>
            </div>
          </div>

          {/* Invoicing Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-2">Désignation</th>
                  <th className="py-2.5 px-2 text-center">Durée</th>
                  <th className="py-2.5 px-2 text-center">Mode de Règlement</th>
                  <th className="py-2.5 px-2 text-right">Montant Total</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-slate-800 print:border-slate-300 divide-slate-800/60 print:divide-slate-200">
                <tr>
                  <td className="py-3.5 px-2">
                    <div className="font-black text-white print:text-black text-sm">
                      Abonnement SaaS {planName}
                    </div>
                    <div className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                      Licence d'utilisation logicielle, accès caisse tactile et sauvegarde cloud
                    </div>
                  </td>
                  <td className="py-3.5 px-2 text-center font-bold text-slate-300 print:text-slate-700 whitespace-nowrap">
                    {durationMonths} mois
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 print:bg-slate-100 text-slate-300 print:text-slate-800 font-bold text-[11px]">
                      {paymentLabel}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right font-mono font-black text-white print:text-black text-sm whitespace-nowrap">
                    {isFree ? (
                      <span className="text-amber-400 print:text-amber-700">0 {subscription.currency} (Offert)</span>
                    ) : (
                      `${Number(subscription.amount || 0).toLocaleString("fr-FR")} ${subscription.currency}`
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Totals Block */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs text-slate-400 print:text-slate-600">
              <div>Mode de paiement : <b>{paymentLabel}</b></div>
              <div>Réf transaction : <b className="font-mono text-slate-300 print:text-slate-800">{invoiceNumber}</b></div>
              <div className="text-[11px] text-emerald-400 print:text-emerald-700 font-bold">
                ✓ Règlement 100% perçu et validé par l'Administration
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 sm:print:border-slate-300 sm:pl-6 space-y-1 w-full sm:w-auto">
              <div className="text-[11px] text-slate-400 print:text-slate-600 font-bold uppercase tracking-wider">
                Total TTC Réglé
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 print:text-emerald-700 font-mono">
                {isFree
                  ? "0 " + (subscription.currency || "CDF")
                  : `${Number(subscription.amount || 0).toLocaleString("fr-FR")} ${subscription.currency}`}
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-500 font-semibold">
                TVA : Exonéré • Reste à payer : 0
              </div>
            </div>
          </div>

          {/* Official Footer / Stamp Mention */}
          <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 print:text-slate-600 gap-2">
            <div>
              Document émis numériquement par le système Micro-ERP Kuettu Global POS. Fait foi de reçu de souscription.
            </div>
            <div className="font-mono font-bold text-slate-400 print:text-slate-700">
              Validité : {formattedEnd}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
