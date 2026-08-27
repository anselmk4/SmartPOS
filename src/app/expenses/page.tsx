"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_STORE_ID, createExpense, deleteExpense } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import { useAuth } from "@/lib/auth/auth-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { EXPENSE_CATEGORIES, type Expense, type PaymentMethod, type ExpenseCategory } from "@/lib/shared/types";
import { uploadMediaFile } from "@/lib/storage/media-storage";
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  TrendingDown,
  Receipt,
  Smartphone,
  Coins,
  FileText,
  Tag,
  Building,
  Zap,
  Truck,
  Users,
  Package,
  Landmark,
  Utensils,
  Wrench,
  HelpCircle,
  CheckCircle2,
  X,
} from "lucide-react";

export default function ExpensesPage() {
  const { store: authStore, tenant, isAuthenticated, isLoading, isCashier } = useAuth();
  const { formatMoney, rawCurrency } = useSync();

  const currentStoreId = authStore?.id || DEFAULT_STORE_ID;
  const currentTenantId = tenant?.id;

  // Filter state
  const [selectedPeriod, setSelectedPeriod] = useState<"TODAY" | "WEEK" | "MONTH" | "ALL">("TODAY");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("ACHAT_FOURNITURES");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Query expenses for active store
  const expenses = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.expenses
      .filter((e) => e.storeId === currentStoreId)
      .reverse()
      .sortBy("createdAt");
  }, [currentStoreId]) || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement des dépenses...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen title="Dépenses Verrouillées" />;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Filtered expenses based on period, category and search
  const filteredExpenses = expenses.filter((e) => {
    // Period filter
    if (selectedPeriod === "TODAY" && !e.expenseDate.startsWith(todayStr)) return false;
    if (selectedPeriod === "MONTH" && !e.expenseDate.startsWith(currentMonthStr)) return false;
    if (selectedPeriod === "WEEK") {
      const expDate = new Date(e.expenseDate);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (expDate < sevenDaysAgo) return false;
    }

    // Category filter
    if (selectedCategoryFilter !== "ALL" && e.category !== selectedCategoryFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const catObj = EXPENSE_CATEGORIES.find((c) => c.id === e.category);
      const catName = (catObj?.label || e.category).toLowerCase();
      const noteStr = (e.notes || "").toLowerCase();
      return catName.includes(q) || noteStr.includes(q);
    }

    return true;
  });

  // KPI Calculations
  const todayTotal = expenses
    .filter((e) => e.expenseDate.startsWith(todayStr))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthTotal = expenses
    .filter((e) => e.expenseDate.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + e.amount, 0);

  const cashExpensesToday = expenses
    .filter((e) => e.expenseDate.startsWith(todayStr) && e.paymentMethod === "CASH")
    .reduce((sum, e) => sum + e.amount, 0);

  const momoExpensesToday = expenses
    .filter((e) => e.expenseDate.startsWith(todayStr) && e.paymentMethod !== "CASH")
    .reduce((sum, e) => sum + e.amount, 0);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert("Veuillez saisir un montant valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalReceiptUrl = receiptUrl || undefined;
      if (finalReceiptUrl && finalReceiptUrl.startsWith("data:image")) {
        const uploadRes = await uploadMediaFile(finalReceiptUrl, {
          folder: "expenses",
          fileName: `receipt-${Date.now()}.jpg`,
        });
        if (uploadRes.url) {
          finalReceiptUrl = uploadRes.url;
        }
      }

      await createExpense({
        tenantId: currentTenantId,
        storeId: currentStoreId,
        category,
        amount: numAmount,
        currency: rawCurrency,
        paymentMethod,
        expenseDate,
        notes,
        receiptUrl: finalReceiptUrl,
      });

      setAmount("");
      setNotes("");
      setReceiptUrl("");
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement de la dépense: " + (err?.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) {
      await deleteExpense(id);
    }
  };

  const handleReceiptPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("L'image est trop lourde (max 2 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Dépenses & Frais d'Exploitation
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Boutique : <b className="text-slate-800">{authStore?.name || tenant?.name}</b>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="py-3 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-red-600/25 transition-all touch-press"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer une Dépense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-red-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase text-red-800 tracking-wider">
              Dépenses (Aujourd'hui)
            </span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-600">
            {formatMoney(todayTotal)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Total décaissé ce jour</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase text-slate-700 tracking-wider">
              Dépenses (Ce Mois)
            </span>
            <Calendar className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatMoney(monthTotal)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Cumul du mois en cours</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase text-blue-800 tracking-wider">
              Sorties Espèces (Tiroir)
            </span>
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700">
            {formatMoney(cashExpensesToday)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Déduit de la caisse espèces</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase text-sky-800 tracking-wider">
              Sorties Mobile Money
            </span>
            <Smartphone className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-700">
            {formatMoney(momoExpensesToday)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">M-Pesa, Airtel, Orange, etc.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full md:w-auto text-xs">
          <button
            onClick={() => setSelectedPeriod("TODAY")}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              selectedPeriod === "TODAY" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setSelectedPeriod("WEEK")}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              selectedPeriod === "WEEK" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            7 derniers jours
          </button>
          <button
            onClick={() => setSelectedPeriod("MONTH")}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              selectedPeriod === "MONTH" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Ce mois
          </button>
          <button
            onClick={() => setSelectedPeriod("ALL")}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              selectedPeriod === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Toutes
          </button>
        </div>

        {/* Category & Search Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">Toutes les catégories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Rechercher motif / note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs flex-1 md:w-48 outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <span>Historique des Dépenses ({filteredExpenses.length})</span>
          </h3>
          <span className="text-xs font-bold text-red-600">
            Total : {formatMoney(filteredExpenses.reduce((acc, it) => acc + it.amount, 0))}
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-600">Aucune dépense enregistrée</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Cliquez sur "Enregistrer une Dépense" pour consigner les achats de sachets, loyers, factures et salaires.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredExpenses.map((exp) => {
              const catObj = EXPENSE_CATEGORIES.find((c) => c.id === exp.category) || {
                label: exp.category,
                icon: "📝",
                color: "text-slate-700",
                bgColor: "bg-slate-100",
              };

              return (
                <div
                  key={exp.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${catObj.bgColor} flex items-center justify-center text-lg shrink-0`}>
                      {catObj.icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{catObj.label}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                          {exp.paymentMethod}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>📅 {exp.expenseDate}</span>
                        {exp.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-600">"{exp.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {exp.receiptUrl && (
                      <a
                        href={exp.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 underline font-semibold hidden sm:inline"
                      >
                        Voir Reçu
                      </a>
                    )}

                    <div className="text-right">
                      <div className="font-black text-red-600 text-base sm:text-lg">
                        -{formatMoney(exp.amount)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Supprimer cette dépense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Add Expense */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateExpense}
            className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 my-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 text-base">Enregistrer une Dépense</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              {/* Category selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Catégorie de la dépense *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EXPENSE_CATEGORIES.map((c) => {
                    const isSelected = category === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? "bg-red-50 border-red-500 text-red-900 ring-2 ring-red-500/20 font-bold shadow-xs"
                            : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-white"
                        }`}
                      >
                        <span className="text-xl shrink-0">{c.icon}</span>
                        <span className="text-xs leading-tight truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Montant ({rawCurrency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="ex: 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-base font-black text-slate-900 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Date de la dépense *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-semibold border border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Moyen de paiement décaissé *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                  {[
                    { id: "CASH", label: "Espèces (Caisse)", icon: "💵" },
                    { id: "MPESA", label: "M-Pesa", icon: "📱" },
                    { id: "AIRTEL_MONEY", label: "Airtel Money", icon: "🔴" },
                    { id: "ORANGE_MONEY", label: "Orange Money", icon: "🟠" },
                    { id: "ILLICOCASH", label: "IlliCo Cash", icon: "🏦" },
                    { id: "EQUITY_BCDC", label: "Equity BCDC", icon: "🏛️" },
                    { id: "PEPELE_MOBILE", label: "Pepele Mobile", icon: "📲" },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        paymentMethod === m.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div>{m.icon}</div>
                      <div className="text-[11px] mt-0.5">{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / Motif */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Motif / Description détaillée (Optionnel)
                </label>
                <textarea
                  rows={2}
                  placeholder="ex: Achat de 2 rouleaux de sachets plastiques pour la caisse..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Receipt photo */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Photo du reçu / Facture (Optionnel)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptPhotoUpload}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
                {receiptUrl && (
                  <div className="mt-2">
                    <img
                      src={receiptUrl}
                      alt="Reçu"
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/25 disabled:opacity-50"
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer la Dépense"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
