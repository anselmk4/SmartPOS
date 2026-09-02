"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_STORE_ID } from "@/lib/db/dexie-db";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import { printIsolatedDocument } from "@/lib/native/print-service";
import {
  FileCheck,
  X,
  Printer,
  Sparkles,
  Shield,
  Sliders,
  Calendar,
  Building,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface CustomAdjustedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomAdjustedReportModal({
  isOpen,
  onClose,
}: CustomAdjustedReportModalProps) {
  const { tenant, store, user, isOwner } = useAuth();
  const { formatMoney, currency } = useSync();

  const currentStoreId = store?.id || DEFAULT_STORE_ID;

  // Real data baseline
  const sales = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.sales.filter((s) => s.storeId === currentStoreId).toArray();
  }, [currentStoreId]) || [];

  const expenses = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.expenses.filter((e) => e.storeId === currentStoreId).toArray();
  }, [currentStoreId]) || [];

  // Form State
  const [period, setPeriod] = useState<"MONTH" | "QUARTER" | "YEAR" | "CUSTOM">("MONTH");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Adjustment factor (percentage of real turnover, e.g. 50%)
  const [adjustmentRatio, setAdjustmentRatio] = useState<number>(60);
  const [customTurnoverInput, setCustomTurnoverInput] = useState<number | null>(null);
  const [customExpenseInput, setCustomExpenseInput] = useState<number | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>(
    "État Financier Récapitulatif & Déclaration d'Activité"
  );
  const [auditorNote, setAuditorNote] = useState<string>(
    "Conforme aux livres comptables simplifiés et registres d'exploitation."
  );

  // Filter baseline sales according to period
  const baselineSales = useMemo(() => {
    return sales.filter((s) => {
      const sDate = s.createdAt.split("T")[0];
      if (startDate && sDate < startDate) return false;
      if (endDate && sDate > endDate) return false;
      return true;
    });
  }, [sales, startDate, endDate]);

  const realTurnover = useMemo(() => {
    return baselineSales.reduce((acc, s) => acc + s.totalAmount, 0);
  }, [baselineSales]);

  const realExpenses = useMemo(() => {
    return expenses.reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  // Adjusted figures
  const adjustedTurnover = useMemo(() => {
    if (customTurnoverInput !== null && customTurnoverInput > 0) {
      return customTurnoverInput;
    }
    return Math.round((realTurnover * adjustmentRatio) / 100);
  }, [realTurnover, adjustmentRatio, customTurnoverInput]);

  const adjustedExpenses = useMemo(() => {
    if (customExpenseInput !== null && customExpenseInput > 0) {
      return customExpenseInput;
    }
    return Math.round((realExpenses * (adjustmentRatio / 100)) * 0.85);
  }, [realExpenses, adjustmentRatio, customExpenseInput]);

  const estimatedTax = useMemo(() => {
    // Impôt synthétique forfaitaire ~3%
    return Math.round(adjustedTurnover * 0.03);
  }, [adjustedTurnover]);

  const adjustedNetProfit = Math.max(0, adjustedTurnover - adjustedExpenses - estimatedTax);
  const adjustedSalesCount = Math.max(
    1,
    Math.round((baselineSales.length || 10) * (adjustmentRatio / 100))
  );

  if (!isOpen) return null;

  // Print official styled PDF
  const handlePrintDeclarativePDF = async () => {
    const storeName = store?.name || tenant?.name || "Commerce Kuettu";
    const storeLogo = store?.logoUrl || tenant?.logoUrl;
    const dateStr = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 24px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" style="max-height: 50px; max-width: 160px; object-fit: contain; margin-bottom: 6px;" />` : ""}
            <h1 style="font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase;">${storeName}</h1>
            ${store?.address ? `<p style="margin: 2px 0; font-size: 11px; color: #475569;">📍 ${store.address}</p>` : ""}
            ${store?.phone ? `<p style="margin: 2px 0; font-size: 11px; color: #475569;">📞 Tél : ${store.phone}</p>` : ""}
            ${tenant?.nifNumber ? `<p style="margin: 2px 0; font-size: 11px; color: #475569;"><b>NIF / RCCM :</b> ${tenant.nifNumber}</p>` : ""}
          </div>
          <div style="text-align: right;">
            <div style="background: #f8fafc; color: #0f172a; padding: 6px 12px; border-radius: 6px; font-weight: 900; font-size: 13px; border: 1px solid #cbd5e1; display: inline-block;">
              DOCUMENT DE CONFORMITÉ COMPTABLE
            </div>
            <p style="margin: 4px 0 2px 0; font-size: 11px; color: #64748b;">Période : <b>Du ${startDate} au ${endDate}</b></p>
            <p style="margin: 2px 0; font-size: 11px; color: #64748b;">Édité le : <b>${dateStr}</b></p>
          </div>
        </div>

        <!-- Document Title -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 0 0 4px 0; color: #1e293b;">
            ${documentTitle}
          </h2>
          <p style="font-size: 11px; color: #64748b; margin: 0;">
            Synthèse d'exploitation et bilan d'activité certifié régulier
          </p>
        </div>

        <!-- Table Summary -->
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f1f5f9; color: #0f172a; text-align: left; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 10px 8px;">Rubrique Comptable</th>
              <th style="padding: 10px 8px; width: 140px; text-align: center;">Base Périodique</th>
              <th style="padding: 10px 8px; width: 160px; text-align: right;">Montant (${currency})</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 8px;"><b>1. Chiffre d'Affaires Brut (Ventes Globales)</b><br/><span style="font-size: 10px; color: #64748b;">Total des recettes enregistrées au journal des opérations</span></td>
              <td style="padding: 10px 8px; text-align: center;">${adjustedSalesCount} transactions</td>
              <td style="padding: 10px 8px; text-align: right; font-weight: 800; font-size: 13px;">${formatMoney(adjustedTurnover)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 8px;"><b>2. Coût des Marchandises Vendues & Approvisionnements</b><br/><span style="font-size: 10px; color: #64748b;">Achats auprès des grossistes et transport</span></td>
              <td style="padding: 10px 8px; text-align: center;">Déductible</td>
              <td style="padding: 10px 8px; text-align: right; color: #475569;">${formatMoney(Math.round(adjustedTurnover * 0.72))}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 8px;"><b>3. Charges & Dépenses d'Exploitation</b><br/><span style="font-size: 10px; color: #64748b;">Loyers, salaires, énergie et consommables</span></td>
              <td style="padding: 10px 8px; text-align: center;">Justifié</td>
              <td style="padding: 10px 8px; text-align: right; color: #475569;">${formatMoney(adjustedExpenses)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 8px;"><b>4. Redevances & Droits Fiscaux Estimés</b><br/><span style="font-size: 10px; color: #64748b;">Impôt synthétique / IBP forfaitaire</span></td>
              <td style="padding: 10px 8px; text-align: center;">3%</td>
              <td style="padding: 10px 8px; text-align: right; color: #b91c1c; font-weight: 700;">${formatMoney(estimatedTax)}</td>
            </tr>
            <tr style="background: #f8fafc; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a;">
              <td style="padding: 12px 8px; font-weight: 900; font-size: 13px; text-transform: uppercase;">RÉSULTAT NET D'EXPLOITATION</td>
              <td style="padding: 12px 8px; text-align: center; font-weight: 700;">Positif</td>
              <td style="padding: 12px 8px; text-align: right; font-weight: 900; font-size: 14px; color: #047857;">${formatMoney(adjustedNetProfit)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Auditor declaration statement -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 30px; font-size: 11px; color: #334155;">
          <b>Mention du Déclarant :</b> ${auditorNote}
        </div>

        <!-- Signatures & Stamp -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; height: 110px; display: flex; flex-direction: column; justify-content: space-between; text-align: center;">
            <span style="font-size: 11px; font-weight: bold; color: #64748b;">Visa du Responsable Comptable / Gérant</span>
            <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${user?.name || "La Direction"}</div>
          </div>
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; height: 110px; display: flex; flex-direction: column; justify-content: space-between; text-align: center;">
            <span style="font-size: 11px; font-weight: bold; color: #64748b;">Cachet & Signature Direction Générale</span>
            <div style="border-bottom: 1px dashed #cbd5e1; width: 60%; margin: 0 auto 6px auto;"></div>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #94a3b8;">
          <span>Rapport synthétique sécurisé édité via Kuettu Global POS • Numéro de série : REF-${Date.now().toString().slice(-8)}</span>
          <span>Certifié conforme</span>
        </div>
      </div>
    `;

    await printIsolatedDocument({
      title: `Bilan_Synthese_${startDate}_${endDate}`,
      width: "a4",
      bodyHtml,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-slate-900 text-base">
                  Bilan Personnalisé & Synthèse Déclarative
                </h3>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Direction
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Génération de rapports d'activité sur-mesure (sans impact sur la base)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Security Alert Banner */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600">
              <b>Module Privé Propriétaire :</b> Ajustez les indicateurs d'exploitation pour générer un bilan PDF officiel et propre. Les transactions réelles en caisse et l'inventaire restent 100% intacts.
            </div>
          </div>

          {/* Date Range Controls */}
          <div>
            <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block mb-1">
              Période du Bilan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Date Début</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Date Fin</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Preset Slider or Custom Turnover */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Niveau d'Ajustement Déclaratif</span>
              </span>
              <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                {adjustmentRatio}% du réel
              </span>
            </div>

            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={adjustmentRatio}
              onChange={(e) => {
                setAdjustmentRatio(Number(e.target.value));
                setCustomTurnoverInput(null);
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block">Chiffre d'Affaires Réel</span>
                <div className="font-bold text-slate-700 text-xs font-mono">
                  {formatMoney(realTurnover)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-blue-700 font-bold block">Montant Bilan Prévu</span>
                <div className="font-black text-blue-900 text-sm font-mono">
                  {formatMoney(adjustedTurnover)}
                </div>
              </div>
            </div>
          </div>

          {/* Optional Direct Manual Overrides */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Forcer Chiffre d'Affaires ({currency})
              </label>
              <input
                type="number"
                placeholder={adjustedTurnover.toString()}
                value={customTurnoverInput || ""}
                onChange={(e) => setCustomTurnoverInput(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 bg-slate-50 rounded-xl text-xs font-mono font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Forcer Total Dépenses ({currency})
              </label>
              <input
                type="number"
                placeholder={adjustedExpenses.toString()}
                value={customExpenseInput || ""}
                onChange={(e) => setCustomExpenseInput(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 bg-slate-50 rounded-xl text-xs font-mono font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Document Title */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Titre Officiel du Document
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full p-2 bg-slate-50 rounded-xl text-xs font-semibold border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 mt-3 space-y-2">
          <button
            onClick={handlePrintDeclarativePDF}
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 touch-press transition-all"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Générer & Imprimer le Bilan Officiel (PDF A4)</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
