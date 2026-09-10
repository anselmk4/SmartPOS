"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { adminFetch } from "@/lib/admin/admin-api";
import { TenantDetailsSidebar } from "@/components/admin/tenant-details-sidebar";
import { PaginationControl } from "@/components/shared/pagination-control";
import { AdminPasswordConfirmModal, type AdminActionType } from "@/components/admin/admin-password-confirm-modal";
import type { SubscriptionPlan, PaymentMethod } from "@/lib/shared/types";
import { getPlanPriceInfo } from "@/lib/constants/plans";
import {
  Store as StoreIcon,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Phone,
  ArrowRight,
  Sparkles,
  X,
  Building,
  User as UserIcon,
  Layers,
  RefreshCw,
  AlertCircle,
  Database,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Gift,
  CreditCard,
  FileText,
  Clock,
  ShieldCheck,
  Eraser,
  MessageCircle,
} from "lucide-react";

interface TenantWithDetails {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  businessType?: string | null;
  countryCode: string;
  currency: string;
  plan: SubscriptionPlan;
  planStatus: string;
  planExpiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stores?: Array<{ id: string; name: string; address?: string | null; ownerName?: string | null; currency?: string; businessType?: string | null }>;
  users?: Array<{ id: string; name: string; phone?: string | null; email?: string | null; role: string; isActive: boolean; lastLoginAt?: string | null }>;
  subscriptions?: Array<{ id: string; plan: string; amount: number; currency: string; paymentMethod: string; paymentStatus: string; periodStart: string; periodEnd: string; createdAt: string }>;
  _count?: {
    products: number;
    sales: number;
    customers: number;
    subscriptions: number;
  };
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, planFilter, statusFilter]);

  // Modals & Drawer state
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithDetails | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTenant, setSidebarTenant] = useState<TenantWithDetails | null>(null);

  // Duplicate Resolution Modal State
  const [isDeduplicateModalOpen, setIsDeduplicateModalOpen] = useState(false);
  const [selectedDupGroup, setSelectedDupGroup] = useState<{
    name: string;
    primary: TenantWithDetails;
    duplicates: TenantWithDetails[];
  } | null>(null);
  const [isMergingDuplicates, setIsMergingDuplicates] = useState(false);

  // Security Confirmation Modal State (Delete, Clean, Suspend)
  const [securityModal, setSecurityModal] = useState<{
    isOpen: boolean;
    actionType: AdminActionType;
    tenant: TenantWithDetails | null;
  }>({
    isOpen: false,
    actionType: "DELETE",
    tenant: null,
  });
  const [isSecurityProcessing, setIsSecurityProcessing] = useState(false);

  // Form State for new boutique
  const [formName, setFormName] = useState("");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formPhone, setFormPhone] = useState("+243 ");
  const [formCurrency, setFormCurrency] = useState("CDF");
  const [formPlan, setFormPlan] = useState<SubscriptionPlan>("PRO");
  const [formAddress, setFormAddress] = useState("");
  const [formBusinessType, setFormBusinessType] = useState("");
  const [formPinCode, setFormPinCode] = useState("1234");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Plan change form state
  const [newPlanChoice, setNewPlanChoice] = useState<SubscriptionPlan>("PRO");
  const [isFreeActivation, setIsFreeActivation] = useState(false);
  const [planMonths, setPlanMonths] = useState(1);
  const [planAmount, setPlanAmount] = useState(30000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [receiptRef, setReceiptRef] = useState("");
  const [freeReason, setFreeReason] = useState("Offre promotionnelle");

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const formatMoney = (amount: number, currency = "CDF") => {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount || 0)} ${currency}`;
  };

  const loadTenants = useCallback(async () => {
    try {
      const res = await adminFetch<TenantWithDetails[]>("/api/v1/admin/tenants");
      if (res.success && Array.isArray(res.data)) {
        setTenants(res.data);
        setError(null);
      } else {
        setError(res.error || "Erreur lors du chargement des boutiques");
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.phone && t.phone.includes(searchQuery)) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlan = planFilter === "ALL" || t.plan === planFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && t.isActive) ||
        (statusFilter === "SUSPENDED" && !t.isActive);
      return matchSearch && matchPlan && matchStatus;
    });
  }, [tenants, searchQuery, planFilter, statusFilter]);

  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTenants.slice(start, start + pageSize);
  }, [filteredTenants, currentPage, pageSize]);

  // Detect duplicate tenants with the same name (e.g. 2 Wake Up Restaurants)
  const duplicateGroups = useMemo(() => {
    const map: Record<string, TenantWithDetails[]> = {};
    for (const t of tenants) {
      const norm = t.name.trim().toLowerCase();
      if (!map[norm]) map[norm] = [];
      map[norm].push(t);
    }
    return Object.entries(map)
      .filter(([_, list]) => list.length > 1)
      .map(([norm, list]) => {
        // Prioritize tenant with real data (stores, sales, products, users)
        const sorted = [...list].sort((a, b) => {
          const scoreA =
            (a.stores?.length || 0) * 20 +
            (a._count?.sales || 0) * 10 +
            (a._count?.products || 0) * 5 +
            (a._count?.customers || 0) * 2 +
            (a.users?.length || 0);
          const scoreB =
            (b.stores?.length || 0) * 20 +
            (b._count?.sales || 0) * 10 +
            (b._count?.products || 0) * 5 +
            (b._count?.customers || 0) * 2 +
            (b.users?.length || 0);
          return scoreB - scoreA;
        });

        return {
          normalizedName: norm,
          name: sorted[0].name,
          primary: sorted[0],
          duplicates: sorted.slice(1),
          totalCount: sorted.length,
        };
      });
  }, [tenants]);

  const handleOpenDeduplicateModal = (group: typeof duplicateGroups[0]) => {
    setSelectedDupGroup(group);
    setIsDeduplicateModalOpen(true);
  };

  const handleMergeDuplicatesSubmit = async () => {
    if (!selectedDupGroup) return;
    setIsMergingDuplicates(true);
    try {
      const isWakeUp = selectedDupGroup.name.toLowerCase().includes("wake up");
      const endpoint = isWakeUp ? "/api/v1/admin/tenants/fix-wakeup" : "/api/v1/admin/tenants/deduplicate";
      const payload = isWakeUp
        ? {}
        : {
            primaryTenantId: selectedDupGroup.primary.id,
            duplicateTenantIds: selectedDupGroup.duplicates.map((d) => d.id),
            action: "MERGE",
          };

      const res = await adminFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showToast(res.message || `Compte "${selectedDupGroup.name}" corrigé et consolidé avec succès !`);
        setIsDeduplicateModalOpen(false);
        setSelectedDupGroup(null);
        loadTenants();
      } else {
        alert(res.error || "Erreur lors de la fusion des doublons");
      }
    } finally {
      setIsMergingDuplicates(false);
    }
  };

  const handleFixWakeUpDirectly = async () => {
    setIsRefreshing(true);
    try {
      const res = await adminFetch("/api/v1/admin/tenants/fix-wakeup", { method: "POST" });
      if (res.success) {
        showToast("Compte Wake Up Restaurant configuré : Patrick Mwisha, 1 dépôt, 143 articles, 0 ventes, 4 staff !");
        loadTenants();
      } else {
        alert(res.error || "Erreur lors de la correction");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Actions
  const handleOpenAddModal = () => {
    setFormName("");
    setFormOwnerName("");
    setFormPhone("+243 ");
    setFormCurrency("CDF");
    setFormPlan("PRO");
    setFormAddress("");
    setFormBusinessType("");
    setFormPinCode("1234");
    setIsAddTenantModalOpen(true);
  };

  const handleOpenEditModal = (t: TenantWithDetails) => {
    setSelectedTenant(t);
    setFormName(t.name);
    setFormPhone(t.phone || "");
    setFormCurrency(t.currency);
    setFormPlan(t.plan);
    setFormBusinessType(t.businessType || t.stores?.[0]?.businessType || "");
    setIsEditTenantModalOpen(true);
  };

  const handleCreateTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formOwnerName.trim()) return;

    setIsSubmitting(true);
    const res = await adminFetch("/api/v1/admin/tenants", {
      method: "POST",
      body: JSON.stringify({
        name: formName.trim(),
        ownerName: formOwnerName.trim(),
        phone: formPhone.trim(),
        currency: formCurrency,
        plan: formPlan,
        businessType: formBusinessType.trim(),
        address: formAddress.trim(),
        pinCode: formPinCode.trim() || "1234",
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsAddTenantModalOpen(false);
      showToast(res.message || `Boutique "${formName}" enregistrée dans Supabase.`);
      loadTenants();
    } else {
      alert(res.error || "Erreur lors de la création");
    }
  };

  const handleEditTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !formName.trim()) return;

    setIsSubmitting(true);
    const res = await adminFetch("/api/v1/admin/tenants", {
      method: "PUT",
      body: JSON.stringify({
        id: selectedTenant.id,
        name: formName.trim(),
        phone: formPhone.trim(),
        currency: formCurrency,
        businessType: formBusinessType.trim(),
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsEditTenantModalOpen(false);
      showToast(`Boutique "${formName}" mise à jour dans Supabase.`);
      loadTenants();
    } else {
      alert(res.error || "Erreur lors de la mise à jour");
    }
  };

  const handleOpenChangePlanModal = (t: TenantWithDetails) => {
    setSelectedTenant(t);
    const initialPlan = t.plan === "FREE" ? "PRO" : t.plan;
    setNewPlanChoice(initialPlan);
    const isFree = t.plan === "FREE";
    setIsFreeActivation(isFree);
    setPlanMonths(1);
    const priceInfo = getPlanPriceInfo(initialPlan, t.currency);
    setPlanAmount(priceInfo.amount);
    setPaymentMethod("CASH");
    setReceiptRef("");
    setFreeReason("Activation promotionnelle / gracieuse");
    setIsChangePlanModalOpen(true);
  };

  const handlePlanChangeSelect = (plan: SubscriptionPlan) => {
    setNewPlanChoice(plan);
    if (!selectedTenant) return;
    if (plan === "FREE") {
      setIsFreeActivation(true);
      setPlanAmount(0);
    } else {
      const priceInfo = getPlanPriceInfo(plan, selectedTenant.currency);
      setPlanAmount(priceInfo.amount * planMonths);
    }
  };

  const handleMonthsChange = (months: number) => {
    setPlanMonths(months);
    if (!selectedTenant) return;
    if (!isFreeActivation && newPlanChoice !== "FREE") {
      const priceInfo = getPlanPriceInfo(newPlanChoice, selectedTenant.currency);
      setPlanAmount(priceInfo.amount * months);
    }
  };

  const handleFreeToggle = (free: boolean) => {
    setIsFreeActivation(free);
    if (!selectedTenant) return;
    if (free) {
      setPlanAmount(0);
    } else {
      const priceInfo = getPlanPriceInfo(newPlanChoice, selectedTenant.currency);
      setPlanAmount(priceInfo.amount * planMonths);
    }
  };

  const handleChangePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    setIsSubmitting(true);
    const res = await adminFetch("/api/v1/admin/tenants", {
      method: "PUT",
      body: JSON.stringify({
        id: selectedTenant.id,
        plan: newPlanChoice,
        durationMonths: planMonths,
        amount: isFreeActivation ? 0 : Number(planAmount) || 0,
        isFree: isFreeActivation,
        currency: selectedTenant.currency,
        paymentMethod: isFreeActivation ? "CASH" : paymentMethod,
        transactionId: receiptRef.trim() || undefined,
        notes: isFreeActivation ? freeReason : `Règlement manuel hors PawaPay (${planMonths} mois)`,
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsChangePlanModalOpen(false);
      showToast(
        res.message ||
          `Plan de "${selectedTenant.name}" mis à jour vers ${newPlanChoice} avec facture générée.`
      );
      loadTenants();
    } else {
      alert(res.error || "Erreur lors de la mise à jour du plan");
    }
  };

  const handleOpenSidebar = (t: TenantWithDetails) => {
    setSidebarTenant(t);
    setIsSidebarOpen(true);
  };

  const handleToggleStatus = async (t: TenantWithDetails) => {
    if (t.isActive) {
      // Suspending -> Requires Super Admin password confirmation modal
      setSecurityModal({
        isOpen: true,
        actionType: "SUSPEND",
        tenant: t,
      });
      return;
    }

    // Activating -> direct activation
    const res = await adminFetch("/api/v1/admin/tenants", {
      method: "PUT",
      body: JSON.stringify({
        id: t.id,
        isActive: true,
      }),
    });

    if (res.success) {
      showToast(`Boutique "${t.name}" activée avec succès.`);
      setSidebarTenant((prev) => (prev && prev.id === t.id ? { ...prev, isActive: true } : prev));
      loadTenants();
    } else {
      alert(res.error || "Erreur lors de l'activation");
    }
  };

  const handleCleanTenantData = (t: TenantWithDetails) => {
    setSecurityModal({
      isOpen: true,
      actionType: "CLEAN",
      tenant: t,
    });
  };

  const handleDeleteTenant = (t: TenantWithDetails) => {
    setSecurityModal({
      isOpen: true,
      actionType: "DELETE",
      tenant: t,
    });
  };

  const handleExecuteSecurityAction = async (adminPassword: string) => {
    const t = securityModal.tenant;
    if (!t) return;

    setIsSecurityProcessing(true);
    try {
      if (securityModal.actionType === "DELETE") {
        const res = await adminFetch(
          `/api/v1/admin/tenants?id=${t.id}&adminPassword=${encodeURIComponent(adminPassword)}`,
          { method: "DELETE" }
        );
        if (res.success) {
          showToast(res.message || `Boutique "${t.name}" supprimée de Supabase.`);
          setIsSidebarOpen(false);
          loadTenants();
        } else {
          alert(res.error || "Erreur lors de la suppression");
        }
      } else if (securityModal.actionType === "CLEAN") {
        const res = await adminFetch(`/api/v1/admin/tenants/clean`, {
          method: "POST",
          body: JSON.stringify({
            tenantId: t.id,
            adminPassword,
          }),
        });
        if (res.success) {
          showToast(res.message || `Données de "${t.name}" nettoyées avec succès.`);
          loadTenants();
        } else {
          alert(res.error || "Erreur lors du nettoyage des données");
        }
      } else if (securityModal.actionType === "SUSPEND") {
        const res = await adminFetch("/api/v1/admin/tenants", {
          method: "PUT",
          body: JSON.stringify({
            id: t.id,
            isActive: false,
            adminPassword,
          }),
        });
        if (res.success) {
          showToast(`Boutique "${t.name}" suspendue avec succès.`);
          setSidebarTenant((prev) => (prev && prev.id === t.id ? { ...prev, isActive: false } : prev));
          loadTenants();
        } else {
          alert(res.error || "Erreur lors de la suspension");
        }
      }
    } finally {
      setIsSecurityProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Table `tenants` Supabase PostgreSQL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Gestion des Boutiques & Commerces ({tenants.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Création, configuration des devises, attribution des plans et contrôle des accès.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {duplicateGroups.length > 0 && (
            <button
              onClick={() => handleOpenDeduplicateModal(duplicateGroups[0])}
              className="py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all touch-press animate-pulse"
              title="Résoudre les doublons détectés"
            >
              <AlertTriangle className="w-4 h-4 text-slate-950" />
              <span>{duplicateGroups.length} Doublon(s) Détecté(s)</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsRefreshing(true);
              loadTenants();
            }}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all touch-press"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Boutique</span>
          </button>
        </div>
      </div>

      {/* Duplicate Alert Banner */}
      {duplicateGroups.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-xs space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-black text-amber-300 text-sm">
                  Doublon Détecté : {duplicateGroups.map((g) => `"${g.name}" (${g.totalCount} boutiques)`).join(", ")}
                </h4>
                <p className="text-slate-300 text-xs mt-0.5">
                  Une boutique active avec des articles et ventes réelles existe en double avec un compte clone vide. Cliquez ci-dessous pour fusionner et nettoyer en 1 clic.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {duplicateGroups.map((group) => (
                <button
                  key={group.normalizedName}
                  type="button"
                  onClick={() => handleOpenDeduplicateModal(group)}
                  className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all touch-press"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fusionner & Nettoyer "{group.name}"</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tous les Plans</option>
            <option value="FREE">FREE (Gratuit)</option>
            <option value="BASIC">BASIC</option>
            <option value="PRO">PRO</option>
            <option value="BUSINESS">BUSINESS</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tous les Statuts</option>
            <option value="ACTIVE">Actives Uniquement</option>
            <option value="SUSPENDED">Suspendues</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">Chargement des boutiques depuis Supabase...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={loadTenants} className="font-bold underline hover:text-white">
            Réessayer
          </button>
        </div>
      )}

      {/* Tenants Cards / Grid */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedTenants.map((t) => {
              const storesCount = t.stores?.length || 0;
              const usersCount = t.users?.length || 0;
              const productsCount = t._count?.products || 0;
              const salesCount = t._count?.sales || 0;
              const mainOwner = t.users?.find((u) => u.role === "OWNER")?.name || t.stores?.[0]?.ownerName || "Gérant";

              return (
                <div
                  key={t.id}
                  className={`bg-slate-900 rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                    t.isActive ? "border-slate-800 hover:border-slate-700" : "border-rose-900/40 bg-rose-950/10"
                  }`}
                >
                  <div>
                    {/* Top Bar inside Card */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleOpenSidebar(t)}
                          className="text-left group flex items-center gap-1.5 transition-colors focus:outline-none w-full"
                          title="Cliquer pour ouvrir la fiche détaillée"
                        >
                          <h3 className="font-black text-white text-base truncate group-hover:text-blue-400 transition-colors">
                            {t.name}
                          </h3>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-mono truncate">
                            ID: {t.id.slice(0, 13)}...
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                              t.isActive
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? "bg-emerald-400" : "bg-rose-400"}`} />
                            {t.isActive ? "Actif" : "Suspendu"}
                          </span>
                        </div>
                      </div>

                      {/* Plan Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                          t.plan === "BUSINESS"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                            : t.plan === "PRO"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                            : t.plan === "BASIC"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {t.plan}
                      </span>
                    </div>

                    {/* Store Meta Info */}
                    <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate text-slate-300 font-medium">{mainOwner}</span>
                      </div>
                      {t.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-mono text-slate-300">{t.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Inscrit le {new Date(t.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-1.5 bg-slate-800/60 p-2.5 rounded-2xl border border-slate-800/80 mb-4 text-center">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Dépôts</span>
                        <span className="text-xs font-black text-white">{storesCount}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Staff</span>
                        <span className="text-xs font-black text-white">{usersCount}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Articles</span>
                        <span className="text-xs font-black text-white">{productsCount}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono">Ventes</span>
                        <span className="text-xs font-black text-emerald-400">{salesCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenChangePlanModal(t)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>Abonnement</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(t)}
                        className={`px-2 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          t.isActive
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                        title={t.isActive ? "Suspendre l'accès" : "Réactiver le commerce"}
                      >
                        {t.isActive ? "Suspendre" : "Activer"}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {t.phone && (
                        <a
                          href={`https://wa.me/${t.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Bonjour ${
                              t.users?.find((u) => u.role === "OWNER")?.name || t.name
                            }, nous vous confirmons que votre commerce "${t.name}" a été activé avec succès sur Kuettu Global POS ! 🎉\n\nVous pouvez dès maintenant vous connecter à votre caisse sur https://globalpos.app/auth/login avec votre numéro (${t.phone}) et votre code PIN.\n\nNotre équipe reste à votre entière écoute.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                          title="Notifier le gérant par WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => handleCleanTenantData(t)}
                        className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
                        title="Nettoyer / Purger toutes les données (ventes, articles, clients)"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(t)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Modifier la boutique"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteTenant(t)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <PaginationControl
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredTenants.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Modal: Add Boutique */}
      {isAddTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Enregistrer une Nouvelle Boutique</h3>
              </div>
              <button
                onClick={() => setIsAddTenantModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenantSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nom du Commerce / Boutique *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alimentation Générale Victoire"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nom du Propriétaire / Gérant *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dieudonné Kasongo"
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Téléphone (Mobile Money) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+243 81 000 00 00"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Devise Principale</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="CDF">Franc Congolais (CDF)</option>
                    <option value="USD">Dollar Américain (USD $)</option>
                    <option value="XOF">Franc CFA (XOF)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Forfait Initial</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value as SubscriptionPlan)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="FREE">Gratuit (Découverte)</option>
                    <option value="BASIC">Basique</option>
                    <option value="PRO">PRO (Recommandé)</option>
                    <option value="BUSINESS">BUSINESS (Multi-Caisses)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Activité / Secteur</label>
                <input
                  type="text"
                  placeholder="Ex: Pharmacie, Quincaillerie, Supermarché, Restaurant..."
                  value={formBusinessType}
                  onChange={(e) => setFormBusinessType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Adresse Physique</label>
                <input
                  type="text"
                  placeholder="Ex: Av. Victoire, Matonge, Kinshasa"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Code PIN Caisse par défaut (4 chiffres)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={formPinCode}
                  onChange={(e) => setFormPinCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest text-center focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTenantModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all"
                >
                  {isSubmitting ? "Création en cours..." : "Créer dans Supabase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Boutique */}
      {isEditTenantModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Modifier {selectedTenant.name}</h3>
              <button
                onClick={() => setIsEditTenantModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditTenantSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Téléphone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Activité / Secteur</label>
                <input
                  type="text"
                  placeholder="Ex: Pharmacie, Quincaillerie, Plastiques..."
                  value={formBusinessType}
                  onChange={(e) => setFormBusinessType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Devise</label>
                <select
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="CDF">Franc Congolais (CDF)</option>
                  <option value="USD">Dollar Américain (USD $)</option>
                  <option value="XOF">Franc CFA (XOF)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditTenantModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
                >
                  {isSubmitting ? "Enregistrement..." : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Plan & Generate Invoice */}
      {isChangePlanModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 my-8 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Activation Manuelle & Facturation</span>
                </div>
                <h3 className="font-black text-white text-lg sm:text-xl">
                  Modifier le Forfait : {selectedTenant.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Devise du commerce : <b className="text-white">{selectedTenant.currency}</b> • Forfait actuel : <b className="text-blue-400">{selectedTenant.plan}</b>
                </p>
              </div>
              <button
                onClick={() => setIsChangePlanModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePlanSubmit} className="space-y-4">
              {/* 1. PLAN SELECTION */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  1. Sélectionner le Forfait
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "FREE", name: "Découverte", desc: "Gratuit • Quota limité" },
                    { key: "BASIC", name: "Basic", desc: "1 Caisse • Standard" },
                    { key: "PRO", name: "PRO", desc: "Multi-caisses • Mobile Money" },
                    { key: "BUSINESS", name: "BUSINESS", desc: "Multi-dépôts • Réseau" },
                  ].map((item) => {
                    const isSelected = newPlanChoice === item.key;
                    const price = getPlanPriceInfo(item.key as SubscriptionPlan, selectedTenant.currency);
                    return (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => handlePlanChangeSelect(item.key as SubscriptionPlan)}
                        className={`p-3 rounded-2xl border text-left transition-all relative ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/15 text-white ring-2 ring-blue-500/30"
                            : "border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs">{item.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {price.rawPriceStr}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. ACTIVATION TYPE (PAYANT VS GRATUIT) */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  2. Type d'Activation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFreeToggle(false)}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                      !isFreeActivation
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Payant (Perçu)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFreeToggle(true)}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                      isFreeActivation
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/20"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Offert / Gratuit</span>
                  </button>
                </div>
              </div>

              {/* 3. DURATION (MONTHS) */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>3. Durée de l'Abonnement (Nombre de mois)</span>
                  <span className="text-blue-400 font-bold font-mono">{planMonths} mois</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 6, 12].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => handleMonthsChange(m)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        planMonths === m
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60"
                      }`}
                    >
                      {m === 12 ? "1 an (12m)" : `${m}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. DETAILS ACCORDING TO FREE OR PAID */}
              {!isFreeActivation ? (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Montant Total Perçu ({selectedTenant.currency})
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={planAmount}
                        onChange={(e) => setPlanAmount(Number(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Mode de Règlement Perçu
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="CASH">Espèces (Cash en mains)</option>
                        <option value="MPESA">M-Pesa Direct (Hors PawaPay)</option>
                        <option value="AIRTEL_MONEY">Airtel Money Direct</option>
                        <option value="ORANGE_MONEY">Orange Money Direct</option>
                        <option value="AFRIMONEY">AfriMoney Direct</option>
                        <option value="WAVE">Wave Direct</option>
                        <option value="MTN_MOMO">MTN MoMo Direct</option>
                        <option value="CARD">Virement bancaire / Carte</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      N° Reçu / Réf. Transaction (Optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: BORD-2026-08 / Reçu Espèces #892"
                      value={receiptRef}
                      onChange={(e) => setReceiptRef(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>Activation Gracieuse / Offerte (0 {selectedTenant.currency})</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-amber-300 font-semibold block mb-1">
                      Motif de l'offre
                    </label>
                    <input
                      type="text"
                      value={freeReason}
                      onChange={(e) => setFreeReason(e.target.value)}
                      placeholder="Ex: Partenariat, Essai prolongé, Geste commercial"
                      className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* 5. SUMMARY BOX & CALCULATED EXPIRATION */}
              {(() => {
                const now = new Date();
                const expiry = new Date(now);
                expiry.setMonth(expiry.getMonth() + planMonths);
                const formattedExpiry = expiry.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                });

                return (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Date d'échéance calculée :</span>
                      <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formattedExpiry}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Montant total facturé :</span>
                      <span className="font-mono font-extrabold text-white text-sm">
                        {isFreeActivation ? (
                          <span className="text-amber-400">0 {selectedTenant.currency} (Offert)</span>
                        ) : (
                          `${Number(planAmount).toLocaleString("fr-FR")} ${selectedTenant.currency}`
                        )}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>
                        Une facture officielle d'abonnement sera générée et consultable par la boutique dans son espace Forfait.
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePlanModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all touch-press"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enregistrement & Facturation...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider & Générer la Facture</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. RETRACTABLE RIGHT SIDEBAR (TENANT DETAILS DRAWER) */}
      <TenantDetailsSidebar
        tenant={sidebarTenant}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onEdit={(t) => {
          setIsSidebarOpen(false);
          handleOpenEditModal(t);
        }}
        onChangePlan={(t) => {
          setIsSidebarOpen(false);
          handleOpenChangePlanModal(t);
        }}
        onToggleStatus={(t) => {
          handleToggleStatus(t);
        }}
      />

      {/* 5. SUPER ADMIN PASSWORD CONFIRMATION MODAL */}
      <AdminPasswordConfirmModal
        isOpen={securityModal.isOpen}
        actionType={securityModal.actionType}
        tenantName={securityModal.tenant?.name || "Boutique"}
        onClose={() => setSecurityModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteSecurityAction}
        isProcessing={isSecurityProcessing}
      />

      {/* 6. DEDUPLICATION & MERGE MODAL */}
      {isDeduplicateModalOpen && selectedDupGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Résolution & Fusion des Doublons</span>
                </div>
                <h3 className="font-black text-white text-lg">
                  Fusionner les comptes : {selectedDupGroup.name}
                </h3>
              </div>
              <button
                onClick={() => setIsDeduplicateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Le système va conserver la boutique principale active (avec ses articles, ventes et dépôts) et y rattacher les utilisateurs avant de supprimer le compte doublon vide.
            </p>

            {/* Comparison Cards */}
            <div className="space-y-3">
              {/* Primary Candidate */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-black text-xs text-emerald-300 uppercase tracking-wider">
                      Compte Principal à Conserver
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    Plan {selectedDupGroup.primary.plan}
                  </span>
                </div>

                <div className="text-xs text-white font-bold flex items-center justify-between">
                  <span>{selectedDupGroup.primary.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {selectedDupGroup.primary.id.slice(0, 13)}...
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 bg-slate-950/60 p-2 rounded-xl text-center text-[10px] font-mono">
                  <div>
                    <span className="text-slate-400 block text-[9px]">DÉPÔTS</span>
                    <span className="font-bold text-white">{selectedDupGroup.primary.stores?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">STAFF</span>
                    <span className="font-bold text-white">{selectedDupGroup.primary.users?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">ARTICLES</span>
                    <span className="font-bold text-white">{selectedDupGroup.primary._count?.products || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">VENTES</span>
                    <span className="font-bold text-emerald-400">{selectedDupGroup.primary._count?.sales || 0}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Gérant : <b className="text-slate-200">{selectedDupGroup.primary.users?.find((u) => u.role === "OWNER")?.name || selectedDupGroup.primary.name}</b> • Tél : {selectedDupGroup.primary.phone || "N/A"}
                </div>
              </div>

              {/* Duplicates to Merge */}
              {selectedDupGroup.duplicates.map((dup) => (
                <div key={dup.id} className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span className="font-black text-xs text-rose-300 uppercase tracking-wider">
                        Compte Doublon à Fusionner & Supprimer
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                      Plan {dup.plan}
                    </span>
                  </div>

                  <div className="text-xs text-white font-bold flex items-center justify-between">
                    <span>{dup.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {dup.id.slice(0, 13)}...
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 bg-slate-950/60 p-2 rounded-xl text-center text-[10px] font-mono">
                    <div>
                      <span className="text-slate-400 block text-[9px]">DÉPÔTS</span>
                      <span className="font-bold text-white">{dup.stores?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">STAFF</span>
                      <span className="font-bold text-white">{dup.users?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">ARTICLES</span>
                      <span className="font-bold text-white">{dup._count?.products || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">VENTES</span>
                      <span className="font-bold text-white">{dup._count?.sales || 0}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Gérant : <b className="text-slate-200">{dup.users?.find((u) => u.role === "OWNER")?.name || dup.name}</b> • Tél : {dup.phone || "N/A"}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeduplicateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleMergeDuplicatesSubmit}
                disabled={isMergingDuplicates}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all touch-press"
              >
                {isMergingDuplicates ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Fusion en cours...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Fusionner & Supprimer le Doublon</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
