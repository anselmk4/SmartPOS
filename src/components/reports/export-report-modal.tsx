"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_STORE_ID } from "@/lib/db/dexie-db";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import {
  FileSpreadsheet,
  X,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  Crown,
} from "lucide-react";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportReportModal({ isOpen, onClose }: ExportReportModalProps) {
  const { tenant, store } = useAuth();
  const { formatMoney } = useSync();

  const currentStoreId = store?.id || DEFAULT_STORE_ID;
  const currentTenantId = tenant?.id;

  const [reportType, setReportType] = useState<"sales" | "debts" | "inventory">("sales");
  const [period, setPeriod] = useState<"all" | "today" | "month">("month");
  const [isExporting, setIsExporting] = useState(false);

  const sales = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.sales
      .filter((s) => s.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  const customers = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.customers
      .filter((c) => c.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  const products = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.products
      .filter((p) => p.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  if (!isOpen) return null;

  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    setIsExporting(true);
    const dateStr = new Date().toISOString().split("T")[0];

    try {
      if (reportType === "sales") {
        let filtered = sales;
        if (period === "today") {
          filtered = sales.filter((s) => s.createdAt.startsWith(dateStr));
        } else if (period === "month") {
          const currentMonth = dateStr.slice(0, 7);
          filtered = sales.filter((s) => s.createdAt.startsWith(currentMonth));
        }

        let csv = "Numero Recu;Date;Heure;Mode Paiement;Total;Montant Paye;Dette Client;Statut\n";
        filtered.forEach((s) => {
          const d = new Date(s.createdAt);
          csv += `"${s.receiptNumber || s.id}";"${d.toLocaleDateString("fr-FR")}";"${d.toLocaleTimeString("fr-FR")}";"${s.paymentMethod}";${s.totalAmount};${s.amountPaid};${s.debtAmount};"${s.status}"\n`;
        });
        downloadCSV(`Rapport_Ventes_${tenant?.name || "Boutique"}_${dateStr}.csv`, csv);
      } else if (reportType === "debts") {
        let csv = "Nom Client;Telephone;Solde Dette;Date Creation\n";
        customers.forEach((c) => {
          csv += `"${c.name}";"${c.phone || "N/A"}";${c.currentDebtBalance};"${new Date(c.createdAt).toLocaleDateString("fr-FR")}"\n`;
        });
        downloadCSV(`Carnet_Dettes_${tenant?.name || "Boutique"}_${dateStr}.csv`, csv);
      } else if (reportType === "inventory") {
        let csv = "Nom Produit;Categorie;Prix Vente;Prix Achat;Quantite Stock;Seuil Alerte;Valeur Stock Vente;Valeur Stock Achat\n";
        products.forEach((p) => {
          const stockValVente = p.stockQuantity * p.unitPrice;
          const stockValAchat = p.stockQuantity * (p.costPrice || p.unitPrice * 0.8);
          csv += `"${p.name}";"${p.category || "Général"}";${p.unitPrice};${p.costPrice || 0};${p.stockQuantity};${p.minStockAlert};${stockValVente};${stockValAchat}\n`;
        });
        downloadCSV(`Inventaire_Stock_${tenant?.name || "Boutique"}_${dateStr}.csv`, csv);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-slate-900 text-base">Export Comptable & Rapports</h3>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Business
                </span>
              </div>
              <p className="text-xs text-slate-500">Génération de fichiers Excel (CSV) & PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Type de Rapport à Exporter
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "sales", label: "Journal des Ventes", count: sales.length },
                { id: "debts", label: "Carnet Dettes", count: customers.length },
                { id: "inventory", label: "Inventaire Stock", count: products.length },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setReportType(t.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    reportType === t.id
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-2 ring-indigo-600/20"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                  }`}
                >
                  <div className="text-xs">{t.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t.count} lignes</div>
                </button>
              ))}
            </div>
          </div>

          {reportType === "sales" && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Période
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "today", label: "Aujourd'hui" },
                  { id: "month", label: "Ce Mois" },
                  { id: "all", label: "Tout l'historique" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id as any)}
                    className={`py-2 rounded-xl border text-xs transition-all ${
                      period === p.id
                        ? "bg-slate-900 text-white font-bold border-slate-900"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 touch-press"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger Excel (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
