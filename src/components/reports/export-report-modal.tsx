"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_STORE_ID } from "@/lib/db/dexie-db";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import { printIsolatedDocument } from "@/lib/native/print-service";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  X,
  Layers,
  Banknote,
  BookOpen,
  PieChart,
  FileText,
  TrendingUp,
} from "lucide-react";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportReportModal({ isOpen, onClose }: ExportReportModalProps) {
  const { user, tenant, store } = useAuth();
  const { formatMoney, currency } = useSync();

  const currentStoreId = store?.id || DEFAULT_STORE_ID;
  const currentTenantId = tenant?.id;

  const [reportType, setReportType] = useState<"sales" | "bilan" | "debts" | "inventory">("bilan");
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year" | "custom" | "all">("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const sales = useLiveQuery(async () => {
    if (!currentStoreId && !currentTenantId) return [];
    return await db.sales
      .filter((s) => (Boolean(currentStoreId) && s.storeId === currentStoreId) || (Boolean(currentTenantId) && s.tenantId === currentTenantId))
      .toArray();
  }, [currentStoreId, currentTenantId]) || [];

  const expenses = useLiveQuery(async () => {
    if (!currentStoreId && !currentTenantId) return [];
    return await db.expenses
      .filter((e) => (Boolean(currentStoreId) && e.storeId === currentStoreId) || (Boolean(currentTenantId) && e.tenantId === currentTenantId))
      .toArray();
  }, [currentStoreId, currentTenantId]) || [];

  const customers = useLiveQuery(async () => {
    if (!currentStoreId && !currentTenantId) return [];
    return await db.customers
      .filter((c) => (Boolean(currentStoreId) && c.storeId === currentStoreId) || (Boolean(currentTenantId) && c.tenantId === currentTenantId))
      .toArray();
  }, [currentStoreId, currentTenantId]) || [];

  const products = useLiveQuery(async () => {
    if (!currentStoreId && !currentTenantId) return [];
    return await db.products
      .filter((p) => (Boolean(currentStoreId) && p.storeId === currentStoreId) || (Boolean(currentTenantId) && p.tenantId === currentTenantId))
      .toArray();
  }, [currentStoreId, currentTenantId]) || [];

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

  const getFilteredSales = () => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (period === "today") {
      return sales.filter((s) => s.createdAt.startsWith(todayStr));
    }
    if (period === "week") {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);
      return sales.filter((s) => new Date(s.createdAt) >= weekStart);
    }
    if (period === "month") {
      const currentMonth = todayStr.slice(0, 7);
      return sales.filter((s) => s.createdAt.startsWith(currentMonth));
    }
    if (period === "year") {
      const currentYear = todayStr.slice(0, 4);
      return sales.filter((s) => s.createdAt.startsWith(currentYear));
    }
    if (period === "custom") {
      return sales.filter((s) => {
        const sDate = s.createdAt.split("T")[0];
        if (startDate && sDate < startDate) return false;
        if (endDate && sDate > endDate) return false;
        return true;
      });
    }
    return sales;
  };

  const getFilteredExpenses = () => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (period === "today") {
      return expenses.filter((e) => e.createdAt.startsWith(todayStr));
    }
    if (period === "week") {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);
      return expenses.filter((e) => new Date(e.createdAt) >= weekStart);
    }
    if (period === "month") {
      const currentMonth = todayStr.slice(0, 7);
      return expenses.filter((e) => e.createdAt.startsWith(currentMonth));
    }
    if (period === "year") {
      const currentYear = todayStr.slice(0, 4);
      return expenses.filter((e) => e.createdAt.startsWith(currentYear));
    }
    if (period === "custom") {
      return expenses.filter((e) => {
        const eDate = e.createdAt.split("T")[0];
        if (startDate && eDate < startDate) return false;
        if (endDate && eDate > endDate) return false;
        return true;
      });
    }
    return expenses;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "today":
        return "Aujourd'hui (" + new Date().toLocaleDateString("fr-FR") + ")";
      case "week":
        return "7 Derniers Jours";
      case "month":
        return "Mois en Cours (" + new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) + ")";
      case "year":
        return "Année en Cours (" + new Date().getFullYear() + ")";
      case "custom":
        return `Du ${startDate || "début"} au ${endDate || "fin"}`;
      case "all":
      default:
        return "Historique Complet";
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    const dateStr = new Date().toISOString().split("T")[0];
    const filteredSales = getFilteredSales();
    const filteredExpenses = getFilteredExpenses();

    try {
      if (reportType === "sales") {
        let csv = "Numero Recu;Date;Heure;Mode Paiement;Total;Montant Paye;Dette Client;Statut\n";
        filteredSales.forEach((s) => {
          const d = new Date(s.createdAt);
          csv += `"${s.receiptNumber || s.id}";"${d.toLocaleDateString("fr-FR")}";"${d.toLocaleTimeString("fr-FR")}";"${s.paymentMethod}";${s.totalAmount};${s.amountPaid};${s.debtAmount};"${s.status}"\n`;
        });
        downloadCSV(`Rapport_Ventes_${tenant?.name || "Commerce"}_${dateStr}.csv`, csv);
      } else if (reportType === "bilan") {
        const totalRev = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
        const totalPaid = filteredSales.reduce((sum, s) => sum + s.amountPaid, 0);
        const totalDebt = filteredSales.reduce((sum, s) => sum + s.debtAmount, 0);
        const totalExp = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

        let csv = "Indicateur Financier;Montant\n";
        csv += `"Chiffre d'Affaires Brut";${totalRev}\n`;
        csv += `"Montant Total Encaissé";${totalPaid}\n`;
        csv += `"Créances & Dettes Clients Générées";${totalDebt}\n`;
        csv += `"Total Dépenses d'Exploitation";${totalExp}\n`;
        csv += `"Bénéfice Net Estimé";${totalRev - totalExp}\n`;
        downloadCSV(`Bilan_Financier_${tenant?.name || "Commerce"}_${dateStr}.csv`, csv);
      } else if (reportType === "debts") {
        let csv = "Nom Client;Telephone;Solde Dette;Date Creation\n";
        customers.forEach((c) => {
          csv += `"${c.name}";"${c.phone || "N/A"}";${c.currentDebtBalance};"${new Date(c.createdAt).toLocaleDateString("fr-FR")}"\n`;
        });
        downloadCSV(`Carnet_Dettes_${tenant?.name || "Commerce"}_${dateStr}.csv`, csv);
      } else if (reportType === "inventory") {
        let csv = "Nom Produit;Categorie;Prix Vente;Prix Achat;Quantite Stock;Seuil Alerte;Valeur Stock Vente;Valeur Stock Achat\n";
        products.forEach((p) => {
          const stockValVente = p.stockQuantity * p.unitPrice;
          const stockValAchat = p.stockQuantity * (p.costPrice || p.unitPrice * 0.8);
          csv += `"${p.name}";"${p.category || "Général"}";${p.unitPrice};${p.costPrice || 0};${p.stockQuantity};${p.minStockAlert};${stockValVente};${stockValAchat}\n`;
        });
        downloadCSV(`Inventaire_Stock_${tenant?.name || "Commerce"}_${dateStr}.csv`, csv);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPDF = async () => {
    const storeName = store?.name || tenant?.name || "Kuettu Global POS";
    const dateStr = new Date().toISOString().split("T")[0];
    const periodLabel = getPeriodLabel();
    let reportTitle = "Rapport Financier";
    let tableHtml = "";

    if (reportType === "bilan") {
      const filtered = getFilteredSales();
      const filteredExp = getFilteredExpenses();

      reportTitle = `Bilan Comptable & Résultat (${periodLabel})`;

      const totalVentesBrut = filtered.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalEncaissCash = filtered
        .filter((s) => s.paymentMethod === "CASH")
        .reduce((sum, s) => sum + s.amountPaid, 0);
      const totalEncaissMobile = filtered
        .filter((s) => ["AIRTEL", "ORANGE", "M_PESA", "AFRIMONEY", "WAVE", "MTN"].includes(s.paymentMethod))
        .reduce((sum, s) => sum + s.amountPaid, 0);
      const totalEncaissAutre = filtered
        .filter((s) => !["CASH", "AIRTEL", "ORANGE", "M_PESA", "AFRIMONEY", "WAVE", "MTN"].includes(s.paymentMethod))
        .reduce((sum, s) => sum + s.amountPaid, 0);
      const totalPaye = filtered.reduce((sum, s) => sum + s.amountPaid, 0);
      const totalDettesEmises = filtered.reduce((sum, s) => sum + s.debtAmount, 0);
      const totalDepenses = filteredExp.reduce((sum, e) => sum + e.amount, 0);

      // COGS estimation based on items or default margin
      const totalCoutAchat = filtered.reduce((sum, s) => {
        if (s.items && s.items.length > 0) {
          const sCost = s.items.reduce((iSum, item) => iSum + (item.costPrice || item.unitPrice * 0.75) * item.quantity, 0);
          return sum + sCost;
        }
        return sum + s.totalAmount * 0.75;
      }, 0);

      const margeBrute = totalVentesBrut - totalCoutAchat;
      const resultatNet = totalVentesBrut - totalDepenses - totalCoutAchat;

      tableHtml = `
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 13px; font-weight: 800; margin-bottom: 8px; border-bottom: 2px solid #0f172a; padding-bottom: 4px; text-transform: uppercase; color: #0f172a;">
            1. Synthèse du Compte de Résultat & Rentabilité
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1;">
                <th style="padding: 8px; text-align: left; font-weight: bold; color: #334155;">Indicateur Comptable & Financier</th>
                <th style="padding: 8px; text-align: right; font-weight: bold; color: #334155;">Montant (${currency})</th>
                <th style="padding: 8px; text-align: right; font-weight: bold; color: #334155;">% Chiffre d'Affaires</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px;"><b>Chiffre d'Affaires Brut (Ventes Totales)</b></td>
                <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 12px;">${formatMoney(totalVentesBrut)}</td>
                <td style="padding: 8px; text-align: right; font-weight: bold;">100.0%</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; color: #475569;">
                <td style="padding: 8px; padding-left: 20px;">- Coût d'Achat des Marchandises Vendues (COGS)</td>
                <td style="padding: 8px; text-align: right; color: #b91c1c;">-${formatMoney(totalCoutAchat)}</td>
                <td style="padding: 8px; text-align: right;">${totalVentesBrut > 0 ? ((totalCoutAchat / totalVentesBrut) * 100).toFixed(1) : "0.0"}%</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1; background: #f1f5f9; font-weight: bold;">
                <td style="padding: 8px;"><b>= Marge Commerciale Brute</b></td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: ${margeBrute >= 0 ? '#15803d' : '#b91c1c'};">${formatMoney(margeBrute)}</td>
                <td style="padding: 8px; text-align: right;">${totalVentesBrut > 0 ? ((margeBrute / totalVentesBrut) * 100).toFixed(1) : "0.0"}%</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0; color: #475569;">
                <td style="padding: 8px; padding-left: 20px;">- Dépenses & Charges d'Exploitation (${filteredExp.length} dépenses)</td>
                <td style="padding: 8px; text-align: right; color: #b91c1c;">-${formatMoney(totalDepenses)}</td>
                <td style="padding: 8px; text-align: right;">${totalVentesBrut > 0 ? ((totalDepenses / totalVentesBrut) * 100).toFixed(1) : "0.0"}%</td>
              </tr>
              <tr style="border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; background: #e2e8f0; font-weight: 900; font-size: 12px;">
                <td style="padding: 10px 8px;"><b>RÉSULTAT NET ESTIMÉ (Bénéfice Net)</b></td>
                <td style="padding: 10px 8px; text-align: right; color: ${resultatNet >= 0 ? '#15803d' : '#b91c1c'}; font-size: 13px;">${formatMoney(resultatNet)}</td>
                <td style="padding: 10px 8px; text-align: right;">${totalVentesBrut > 0 ? ((resultatNet / totalVentesBrut) * 100).toFixed(1) : "0.0"}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; text-transform: uppercase;">
              2. Flux de Trésorerie & Encaissements
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <tbody>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 5px 0;">Total Encaissé en Espèces (Cash)</td><td style="text-align: right; font-weight: bold;">${formatMoney(totalEncaissCash)}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 5px 0;">Total Encaissé par Mobile Money</td><td style="text-align: right; font-weight: bold;">${formatMoney(totalEncaissMobile)}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 5px 0;">Total Autres Moyens</td><td style="text-align: right; font-weight: bold;">${formatMoney(totalEncaissAutre)}</td></tr>
                <tr style="border-top: 1px solid #000; font-weight: bold; background: #f8fafc;"><td style="padding: 6px 0;">TOTAL ENCAISSÉ (TRÉSORERIE)</td><td style="text-align: right; color: #15803d; font-size: 11px;">${formatMoney(totalPaye)}</td></tr>
                <tr style="border-top: 1px solid #eee;"><td style="padding: 5px 0; color: #b91c1c;">Ventes à Crédit (Créances clients émises)</td><td style="text-align: right; font-weight: bold; color: #b91c1c;">${formatMoney(totalDettesEmises)}</td></tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; text-transform: uppercase;">
              3. Activité Commerciale & Volumes
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <tbody>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 5px 0;">Nombre de transactions validées</td><td style="text-align: right; font-weight: bold;">${filtered.length} ventes</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 5px 0;">Panier moyen par vente</td><td style="text-align: right; font-weight: bold;">${filtered.length > 0 ? formatMoney(totalVentesBrut / filtered.length) : formatMoney(0)}</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 5px 0;">Taux de recouvrement immédiat</td><td style="text-align: right; font-weight: bold;">${totalVentesBrut > 0 ? ((totalPaye / totalVentesBrut) * 100).toFixed(1) : "100.0"}%</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 5px 0;">Nombre d'articles au catalogue</td><td style="text-align: right; font-weight: bold;">${products.length} références</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (reportType === "sales") {
      const filtered = getFilteredSales();
      reportTitle = `Journal des Ventes (${periodLabel})`;

      const totalVentes = filtered.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalPaye = filtered.reduce((sum, s) => sum + s.amountPaid, 0);
      const totalDettes = filtered.reduce((sum, s) => sum + s.debtAmount, 0);

      tableHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #000;">
              <th style="padding: 6px; text-align: left;">N° Reçu</th>
              <th style="padding: 6px; text-align: left;">Date & Heure</th>
              <th style="padding: 6px; text-align: left;">Paiement</th>
              <th style="padding: 6px; text-align: right;">Total Net</th>
              <th style="padding: 6px; text-align: right;">Payé</th>
              <th style="padding: 6px; text-align: right;">Dette</th>
            </tr>
          </thead>
          <tbody>
            ${filtered
              .map((s) => {
                const d = new Date(s.createdAt);
                return `<tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 6px;"><b>${s.receiptNumber || s.id.slice(0, 8)}</b></td>
                <td style="padding: 6px;">${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</td>
                <td style="padding: 6px;">${s.paymentMethod}</td>
                <td style="padding: 6px; text-align: right; font-weight: bold;">${formatMoney(s.totalAmount)}</td>
                <td style="padding: 6px; text-align: right;">${formatMoney(s.amountPaid)}</td>
                <td style="padding: 6px; text-align: right; font-weight: bold; color: ${s.debtAmount > 0 ? '#b91c1c' : '#000'}">${s.debtAmount > 0 ? formatMoney(s.debtAmount) : "-"}</td>
              </tr>`;
              })
              .join("")}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #000; font-weight: bold; background: #f8fafc;">
              <td colspan="3" style="padding: 8px;">TOTAL (${filtered.length} ventes)</td>
              <td style="padding: 8px; text-align: right; font-weight: 900;">${formatMoney(totalVentes)}</td>
              <td style="padding: 8px; text-align: right;">${formatMoney(totalPaye)}</td>
              <td style="padding: 8px; text-align: right; font-weight: 900; color: #b91c1c;">${formatMoney(totalDettes)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (reportType === "debts") {
      reportTitle = "Carnet de Dettes & Créances Clients";
      const totalCreances = customers.reduce((sum, c) => sum + c.currentDebtBalance, 0);

      tableHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #000;">
              <th style="padding: 6px; text-align: left;">Nom du Client</th>
              <th style="padding: 6px; text-align: left;">Téléphone</th>
              <th style="padding: 6px; text-align: right;">Solde Dû</th>
            </tr>
          </thead>
          <tbody>
            ${customers
              .map(
                (c) => `<tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 6px;"><b>${c.name}</b></td>
                <td style="padding: 6px;">${c.phone || "N/A"}</td>
                <td style="padding: 6px; text-align: right; font-weight: 900; color: ${c.currentDebtBalance > 0 ? '#b91c1c' : '#000'}">${formatMoney(c.currentDebtBalance)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #000; font-weight: bold; background: #f8fafc;">
              <td colspan="2" style="padding: 8px;">TOTAL CRÉANCES CLIENTS (${customers.length} clients)</td>
              <td style="padding: 8px; text-align: right; font-weight: 900; color: #b91c1c;">${formatMoney(totalCreances)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (reportType === "inventory") {
      reportTitle = "État des Stocks & Valorisation de l'Inventaire";
      const totalStockValVente = products.reduce((sum, p) => sum + p.stockQuantity * p.unitPrice, 0);

      tableHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #000;">
              <th style="padding: 6px; text-align: left;">Article</th>
              <th style="padding: 6px; text-align: left;">Catégorie</th>
              <th style="padding: 6px; text-align: right;">Prix Vente</th>
              <th style="padding: 6px; text-align: right;">Stock</th>
              <th style="padding: 6px; text-align: right;">Valeur Stock</th>
            </tr>
          </thead>
          <tbody>
            ${products
              .map(
                (p) => `<tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 6px;"><b>${p.name}</b></td>
                <td style="padding: 6px;">${p.category || "Général"}</td>
                <td style="padding: 6px; text-align: right;">${formatMoney(p.unitPrice)}</td>
                <td style="padding: 6px; text-align: right; font-weight: bold; color: ${p.stockQuantity <= p.minStockAlert ? '#b91c1c' : '#000'}">${p.stockQuantity}</td>
                <td style="padding: 6px; text-align: right; font-weight: 900;">${formatMoney(p.stockQuantity * p.unitPrice)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #000; font-weight: bold; background: #f8fafc;">
              <td colspan="4" style="padding: 8px;">VALEUR TOTALE DU STOCK (${products.length} articles)</td>
              <td style="padding: 8px; text-align: right; font-weight: 900;">${formatMoney(totalStockValVente)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    const bodyHtml = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
        <div>
          <h1 style="font-size: 18px; margin: 0; text-transform: uppercase; font-weight: 900;">${storeName}</h1>
          <p style="margin: 3px 0 0 0; font-size: 11px; color: #555;">${store?.address || "Kinshasa / RDC"} • Tél: ${store?.phone || ""}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 14px; margin: 0; color: #000; font-weight: 800;">${reportTitle}</h2>
          <p style="margin: 3px 0 0 0; font-size: 10px; color: #666;">Date d'édition : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      ${tableHtml}

      <div style="margin-top: 30px; padding-top: 10px; border-top: 1px dashed #999; display: flex; justify-content: space-between; font-size: 10px; color: #666;">
        <span>Document comptable certifié conforme • Kuettu Global POS</span>
        <span>https://globalpos.app</span>
      </div>
    `;

    await printIsolatedDocument({
      title: `${reportTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${dateStr}`,
      width: "a4",
      bodyHtml,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100">
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
              <p className="text-xs text-slate-500">Génération de fichiers Excel (CSV) & PDF complets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Type de Rapport à Générer
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "bilan", label: "Bilan & Résultat", count: `${sales.length} ventes` },
                { id: "sales", label: "Journal Ventes", count: `${sales.length} reçus` },
                { id: "debts", label: "Carnet Dettes", count: `${customers.length} clients` },
                { id: "inventory", label: "Inventaire Stock", count: `${products.length} articles` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setReportType(t.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    reportType === t.id
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-2 ring-indigo-600/20 shadow-xs"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                  }`}
                >
                  <div className="text-xs font-bold">{t.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t.count}</div>
                </button>
              ))}
            </div>
          </div>

          {(reportType === "sales" || reportType === "bilan") && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Période d'Analyse
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-slate-100 rounded-xl text-xs">
                {[
                  { id: "today", label: "Jour" },
                  { id: "week", label: "7 jours" },
                  { id: "month", label: "Mois" },
                  { id: "year", label: "Année" },
                  { id: "custom", label: "Plage" },
                  { id: "all", label: "Tout" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id as any)}
                    className={`py-1.5 rounded-lg text-[11px] transition-all text-center cursor-pointer ${
                      period === p.id
                        ? "bg-white text-slate-900 font-bold shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range Picker */}
              {period === "custom" && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Du (Date Début)</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-1.5 bg-white rounded-lg text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Au (Date Fin)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-1.5 bg-white rounded-lg text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimer / Télécharger PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 touch-press cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger Excel (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
