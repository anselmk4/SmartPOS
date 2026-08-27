"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, processDebtRepayment, DEFAULT_STORE_ID, generateUUID, enqueueSync } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import { useAuth } from "@/lib/auth/auth-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { UpgradePromptModal } from "@/components/plans/upgrade-prompt-modal";
import ExportReportModal from "@/components/reports/export-report-modal";
import type { Customer, PaymentMethod, DebtPayment } from "@/lib/shared/types";
import {
  BookOpen,
  Search,
  MessageCircle,
  CreditCard,
  UserPlus,
  Phone,
  Coins,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  X,
  Send,
  Users,
  Wallet,
  Sparkles,
  FileSpreadsheet,
  Lock,
} from "lucide-react";

export default function DebtsPage() {
  const { user, tenant, store: authStore, isAuthenticated, isLoading, plan, canAccess } = useAuth();
  const { formatMoney, currency } = useSync();

  const currentStoreId = authStore?.id || DEFAULT_STORE_ID;
  const customers = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.customers
      .filter((c) => c.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "debtors" | "cleared">("debtors");

  // Modals
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [selectedCustomerForWhatsApp, setSelectedCustomerForWhatsApp] = useState<Customer | null>(null);
  const [whatsAppTemplateType, setWhatsAppTemplateType] = useState<"courteous" | "urgent" | "mobile_money">("courteous");
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Repayment form state
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayMethod, setRepayMethod] = useState<PaymentMethod>("CASH");
  const [repayNotes, setRepayNotes] = useState("");
  const [isSubmittingRepayment, setIsSubmittingRepayment] = useState(false);

  // New customer form state
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [initialDebt, setInitialDebt] = useState<number>(0);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery));

      if (filterType === "debtors") return matchSearch && c.currentDebtBalance > 0;
      if (filterType === "cleared") return matchSearch && c.currentDebtBalance <= 0;
      return matchSearch;
    });
  }, [customers, searchQuery, filterType]);

  const totalOutstandingDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentDebtBalance > 0 ? c.currentDebtBalance : 0), 0);
  }, [customers]);

  const activeDebtorsCount = useMemo(() => {
    return customers.filter((c) => c.currentDebtBalance > 0).length;
  }, [customers]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement du carnet de dettes...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen title="Carnet de Dettes Verrouillé" />;
  }

  const handleOpenAddCustomer = () => {
    if (plan === "FREE" && customers.length >= 5) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setIsNewCustomerModalOpen(true);
  };

  const handleOpenRepayment = (cust: Customer) => {
    setSelectedCustomerForPayment(cust);
    setRepayAmount(cust.currentDebtBalance);
    setRepayMethod("CASH");
    setRepayNotes("");
  };

  const handleSubmitRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment || repayAmount <= 0 || isSubmittingRepayment) return;

    setIsSubmittingRepayment(true);
    try {
      await processDebtRepayment({
        tenantId: tenant?.id,
        storeId: currentStoreId,
        customerId: selectedCustomerForPayment.id,
        amount: repayAmount,
        paymentMethod: repayMethod,
        notes: repayNotes,
      });

      setSelectedCustomerForPayment(null);
    } catch (err: any) {
      alert("Erreur lors de l'encaissement: " + err.message);
    } finally {
      setIsSubmittingRepayment(false);
    }
  };

  const handleCreateCustomerWithDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    if (plan === "FREE" && customers.length >= 5) {
      setIsUpgradeModalOpen(true);
      return;
    }

    const newId = generateUUID();
    const now = new Date().toISOString();
    const newCust: Customer = {
      id: newId,
      tenantId: tenant?.id,
      storeId: currentStoreId,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || undefined,
      currentDebtBalance: Number(initialDebt) || 0,
      isSynced: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.customers.add(newCust);
    await enqueueSync({
      tenantId: tenant?.id,
      storeId: currentStoreId,
      entity: "customer",
      action: "CREATE",
      payload: JSON.stringify(newCust),
    });

    setNewCustName("");
    setNewCustPhone("");
    setInitialDebt(0);
    setIsNewCustomerModalOpen(false);
  };

  const buildWhatsAppMessage = (cust: Customer, template: "courteous" | "urgent" | "mobile_money") => {
    const storeName = authStore?.name || tenant?.name || "Boutique";
    const storePhone = authStore?.phone || tenant?.phone || "notre numéro";

    if (template === "urgent") {
      return `⚠️ *RAPPEL IMPORTANT - ${storeName}*\n\nBonjour ${cust.name},\n\nNous constatons que votre solde débiteur de *${formatMoney(cust.currentDebtBalance)}* est toujours en attente de régularisation.\n\nMerci de bien vouloir passer à la boutique ou effectuer un virement pour solder votre compte sans délai.\n\nCordialement,\n${storeName}`;
    }

    if (template === "mobile_money") {
      return `📱 *PAIEMENT MOBILE MONEY - ${storeName}*\n\nBonjour ${cust.name},\n\nVotre solde restant s'élève à *${formatMoney(cust.currentDebtBalance)}*.\n\nVous pouvez effectuer votre règlement directement par Mobile Money (M-Pesa / Airtel / Orange) au numéro de la boutique : *${storePhone}*.\n\nMerci pour votre confiance !`;
    }

    // Default courteous
    return `Bonjour ${cust.name},\n\nSauf erreur de notre part, votre solde débiteur à la *${storeName}* s'élève à *${formatMoney(cust.currentDebtBalance)}*.\n\nMerci de bien vouloir passer régulariser votre compte dès que possible.\n\nCordialement,\n${storeName}`;
  };

  const getWhatsAppLink = (cust: Customer, template: "courteous" | "urgent" | "mobile_money") => {
    const rawPhone = cust.phone ? cust.phone.replace(/[^0-9]/g, "") : "";
    const msg = buildWhatsAppMessage(cust, template);
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col">
      {/* Header & KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl p-4 sm:p-5 text-white shadow-lg shadow-rose-500/20">
          <div className="flex items-center justify-between opacity-90 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total des Créances en cours
            </span>
            <Wallet className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black">
            {formatMoney(totalOutstandingDebt)}
          </div>
          <p className="text-xs text-rose-100 mt-1">À recouvrer auprès des clients</p>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Débiteurs Actifs
            </span>
            <Users className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {activeDebtorsCount} <span className="text-sm font-normal text-slate-500">clients</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {plan === "FREE" ? `Forfait Gratuit : ${customers.length}/5 clients max` : "Clients ayant un solde débiteur > 0"}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-center gap-2">
          <button
            onClick={handleOpenAddCustomer}
            className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all touch-press"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Débiteur / Client</span>
          </button>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <span>Enregistrer une dette ou créer un compte</span>
            {canAccess("canExportReports") && (
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="text-indigo-600 font-bold hover:underline"
              >
                • Exporter Excel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom ou numéro WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterType("debtors")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === "debtors"
                ? "bg-white text-rose-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Débiteurs ({activeDebtorsCount})
          </button>
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === "all"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tous ({customers.length})
          </button>
          <button
            onClick={() => setFilterType("cleared")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === "cleared"
                ? "bg-white text-blue-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Soldés ({customers.length - activeDebtorsCount})
          </button>
        </div>
      </div>

      {/* Customers List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-slate-400">
            <BookOpen className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">Aucun client dans ce filtre</p>
            <p className="text-xs text-slate-400 mt-1">Tous les comptes sont à jour ou aucun client n'a été créé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
            {filteredCustomers.map((cust) => {
              const hasDebt = cust.currentDebtBalance > 0;

              return (
                <div
                  key={cust.id}
                  className={`bg-white rounded-3xl p-4 border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                    hasDebt ? "border-rose-200/80" : "border-slate-200/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">{cust.name}</h3>
                      {cust.phone ? (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cust.phone}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Pas de numéro</span>
                      )}
                    </div>

                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        hasDebt
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {hasDebt ? formatMoney(cust.currentDebtBalance) : "À jour"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    {hasDebt ? (
                      <>
                        <button
                          onClick={() => handleOpenRepayment(cust)}
                          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm touch-press"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Encaisser</span>
                        </button>

                        {cust.phone && (
                          <button
                            onClick={() => setSelectedCustomerForWhatsApp(cust)}
                            className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 touch-press"
                            title="Relancer par WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                            <span>Relancer</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="w-full text-center text-xs text-blue-600 font-semibold py-1 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Compte régularisé</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WHATSAPP TEMPLATES MODAL (PRO & BUSINESS EXCLUSIVE TEMPLATES) */}
      {selectedCustomerForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Relance WhatsApp Client</h3>
                  <p className="text-xs text-slate-500">Destinataire : <b className="text-slate-800">{selectedCustomerForWhatsApp.name}</b></p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerForWhatsApp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template selector */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Choisissez le Modèle de Relance :
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "courteous", label: "Amical / Courtois", badge: "Standard" },
                  { id: "urgent", label: "Rappel Urgent", badge: "Retard" },
                  { id: "mobile_money", label: "Paiement Mobile Money", badge: "Direct" },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setWhatsAppTemplateType(tpl.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      whatsAppTemplateType === tpl.id
                        ? "border-blue-600 bg-blue-50/80 text-blue-800 font-bold ring-2 ring-blue-600/20"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-bold">{tpl.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{tpl.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Message Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-700 whitespace-pre-line font-sans mb-5 max-h-48 overflow-y-auto">
              {buildWhatsAppMessage(selectedCustomerForWhatsApp, whatsAppTemplateType)}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCustomerForWhatsApp(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <a
                href={getWhatsAppLink(selectedCustomerForWhatsApp, whatsAppTemplateType)}
                target="_blank"
                rel="noreferrer"
                onClick={() => setSelectedCustomerForWhatsApp(null)}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 touch-press"
              >
                <Send className="w-4 h-4" />
                <span>Ouvrir WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* REPAYMENT MODAL */}
      {selectedCustomerForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitRepayment}
            className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Encaisser un Remboursement</h3>
                <p className="text-xs text-slate-500">
                  Client : <span className="font-semibold text-slate-800">{selectedCustomerForPayment.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerForPayment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 rounded-2xl p-3 border border-rose-200 mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800">Dette totale en cours :</span>
              <span className="text-base font-black text-rose-700">
                {formatMoney(selectedCustomerForPayment.currentDebtBalance)}
              </span>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Montant versé aujourd'hui ({currency}) *
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedCustomerForPayment.currentDebtBalance}
                value={repayAmount || ""}
                onChange={(e) => setRepayAmount(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 rounded-2xl text-lg font-black text-slate-900 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none mb-2"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRepayAmount(selectedCustomerForPayment.currentDebtBalance)}
                  className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg"
                >
                  Solder tout ({formatMoney(selectedCustomerForPayment.currentDebtBalance)})
                </button>
                {selectedCustomerForPayment.currentDebtBalance > 2000 && (
                  <button
                    type="button"
                    onClick={() => setRepayAmount(Math.round(selectedCustomerForPayment.currentDebtBalance / 2))}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-lg"
                  >
                    50%
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Mode de Réception
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "CASH", label: "Espèces" },
                  { id: "MPESA", label: "M-Pesa" },
                  { id: "AIRTEL_MONEY", label: "Airtel" },
                  { id: "ORANGE_MONEY", label: "Orange" },
                  { id: "AFRIMONEY", label: "Afrimoney" },
                  { id: "ILLICOCASH", label: "IlliCo Cash" },
                  { id: "EQUITY_BCDC", label: "Equity BCDC" },
                  { id: "PEPELE_MOBILE", label: "Pepele Mobile" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setRepayMethod(m.id as PaymentMethod)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      repayMethod === m.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingRepayment || repayAmount <= 0}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 touch-press disabled:bg-slate-300"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmer l'encaissement de {formatMoney(repayAmount)}</span>
            </button>
          </form>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCustomerWithDebt}
            className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Nouveau Débiteur / Client</h3>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Nom & Prénom / Surnom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Trésor Mbuyi"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Numéro WhatsApp (pour les relances)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="ex: +243 81 000 00 00"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Solde de dette initial ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={initialDebt || ""}
                  onChange={(e) => setInitialDebt(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-bold text-rose-700 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UPGRADE PROMPT MODAL */}
      <UpgradePromptModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Limite de 5 Débiteurs Atteinte"
        description="Le forfait Découverte gratuit permet de gérer jusqu'à 5 clients. Pour enregistrer des clients illimités et envoyer des relances WhatsApp automatiques, passez au forfait Pro."
        targetPlan="PRO"
        features={[
          "Nombre de clients et débiteurs illimité",
          "Modèles de relances WhatsApp automatiques (Amical, Urgent, Mobile Money)",
          "Ventes et caisse illimitées",
          "Supervision gérant à distance sur smartphone",
        ]}
      />

      {/* EXPORT REPORT MODAL */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
