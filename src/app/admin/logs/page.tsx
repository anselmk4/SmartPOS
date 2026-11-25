"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { adminFetch } from "@/lib/admin/admin-api";
import { PaginationControl } from "@/components/shared/pagination-control";
import {
  ScrollText,
  Search,
  RefreshCw,
  Store,
  ShoppingCart,
  Package,
  CreditCard,
  Users,
  Coins,
  RefreshCcw,
  Calendar,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
  FileText,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Activity,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  timestamp: string;
  type: "REGISTRATION" | "SALE" | "PRODUCT" | "SUBSCRIPTION" | "DEBT" | "USER" | "SYNC";
  categoryLabel: string;
  title: string;
  description: string;
  tenantId?: string;
  tenantName: string;
  storeName?: string;
  userName?: string;
  userRole?: string;
  amount?: number | null;
  currency?: string;
  status: string;
  metadata?: Record<string, any>;
}

interface SummaryCounts {
  total: number;
  registrations: number;
  sales: number;
  products: number;
  subscriptions: number;
  debts: number;
  users: number;
  sync: number;
  totalSalesAmount: number;
  totalSubAmount: number;
}

interface TenantFilterItem {
  id: string;
  name: string;
  plan: string;
  currency: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [summary, setSummary] = useState<SummaryCounts>({
    total: 0,
    registrations: 0,
    sales: 0,
    products: 0,
    subscriptions: 0,
    debts: 0,
    users: 0,
    sync: 0,
    totalSalesAmount: 0,
    totalSubAmount: 0,
  });
  const [tenants, setTenants] = useState<TenantFilterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [tenantFilter, setTenantFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modal details
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(
    async (showSilentLoading = false) => {
      if (!showSilentLoading) setIsRefreshing(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          category: categoryFilter,
          tenantId: tenantFilter,
          dateRange: dateRangeFilter,
          search: searchQuery,
          page: String(currentPage),
          limit: String(pageSize),
        });

        const res = await adminFetch(`/api/v1/admin/logs?${queryParams.toString()}`);
        if (res.success && res.data) {
          setLogs(res.data.logs || []);
          if (res.data.summary) setSummary(res.data.summary);
          if (res.data.tenants) setTenants(res.data.tenants);
          if (res.data.pagination) {
            setTotalPages(res.data.pagination.totalPages || 1);
            setTotalCount(res.data.pagination.total || 0);
          }
        } else {
          setError(res.error || "Impossible de charger les logs");
        }
      } catch (err: any) {
        setError(err.message || "Erreur de connexion");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [categoryFilter, tenantFilter, dateRangeFilter, searchQuery, currentPage, pageSize]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh every 15 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  // Reset to page 1 on filter changes
  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setCurrentPage(1);
  };

  const handleTenantChange = (tid: string) => {
    setTenantFilter(tid);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (dr: string) => {
    setDateRangeFilter(dr);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ["Date", "Type", "Commerce", "Magasin", "Utilisateur", "Rôle", "Titre", "Description", "Montant", "Devise", "Statut"];
    const rows = logs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString("fr-FR")}"`,
      `"${l.categoryLabel}"`,
      `"${l.tenantName.replace(/"/g, '""')}"`,
      `"${(l.storeName || "").replace(/"/g, '""')}"`,
      `"${(l.userName || "").replace(/"/g, '""')}"`,
      `"${(l.userRole || "").replace(/"/g, '""')}"`,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      l.amount !== undefined && l.amount !== null ? l.amount : "",
      `"${l.currency || ""}"`,
      `"${l.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-logs-globalpos-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeBadge = (type: AuditLogItem["type"]) => {
    switch (type) {
      case "REGISTRATION":
        return {
          icon: Store,
          label: "Inscription",
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        };
      case "SALE":
        return {
          icon: ShoppingCart,
          label: "Vente POS",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        };
      case "PRODUCT":
        return {
          icon: Package,
          label: "Article / Stock",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        };
      case "SUBSCRIPTION":
        return {
          icon: CreditCard,
          label: "Abonnement",
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        };
      case "DEBT":
        return {
          icon: Coins,
          label: "Règlement Dette",
          bg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
        };
      case "USER":
        return {
          icon: Users,
          label: "Utilisateur",
          bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
        };
      case "SYNC":
        return {
          icon: RefreshCcw,
          label: "Synchro",
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/30",
        };
      default:
        return {
          icon: ScrollText,
          label: "Événement",
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/30",
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-black uppercase tracking-wider mb-2">
            <ScrollText className="w-3.5 h-3.5" />
            <span>Audit Trail & Traçabilité Complète</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Journal des Opérations Utilisateurs</span>
            {isRefreshing && <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Consultez chaque opération effectuée par les commerçants et caissiers : créations de comptes, encaissements de ventes, mouvements de stock, paiements de forfaits et remboursements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Auto Refresh toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              autoRefresh
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
            title="Activer/Désactiver le rafraîchissement automatique toutes les 15s"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            <span>{autoRefresh ? "En direct (15s)" : "Direct en pause"}</span>
          </button>

          {/* Manual Refresh button */}
          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </button>

          {/* CSV Export */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!logs.length}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all touch-press"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Capsules */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Events */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Actions</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {summary.total.toLocaleString("fr-FR")}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Toutes opérations</span>
        </div>

        {/* Registrations */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Inscriptions</span>
            <Store className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
            {summary.registrations.toLocaleString("fr-FR")}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Nouveaux commerces</span>
        </div>

        {/* Sales */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ventes Caisse</span>
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {summary.sales.toLocaleString("fr-FR")}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Tickets encaissés</span>
        </div>

        {/* Subscriptions */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Paiements Forfait</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-400 font-mono">
            {summary.subscriptions.toLocaleString("fr-FR")}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Mobile Money & Cash</span>
        </div>

        {/* Products */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Mouvements Stock</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {summary.products.toLocaleString("fr-FR")}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Articles modifiés</span>
        </div>

        {/* Debts */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Dettes Remboursées</span>
            <Coins className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
            {summary.debts.toLocaleString("fr-FR")}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Règlements clients</span>
        </div>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900 rounded-2xl border border-slate-800/80 overflow-x-auto text-xs font-bold">
        {[
          { id: "ALL", label: "Toutes les opérations", icon: Activity, count: summary.total },
          { id: "REGISTRATION", label: "Inscriptions", icon: Store, count: summary.registrations },
          { id: "SALE", label: "Ventes POS", icon: ShoppingCart, count: summary.sales },
          { id: "PRODUCT", label: "Articles & Stock", icon: Package, count: summary.products },
          { id: "SUBSCRIPTION", label: "Abonnements", icon: CreditCard, count: summary.subscriptions },
          { id: "DEBT", label: "Dettes", icon: Coins, count: summary.debts },
          { id: "USER", label: "Utilisateurs", icon: Users, count: summary.users },
          { id: "SYNC", label: "Synchros", icon: RefreshCcw, count: summary.sync },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = categoryFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleCategoryChange(tab.id)}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-white/20 text-white font-bold" : "bg-slate-800 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Filter Bar (Search, Date Range, Tenant Select) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par boutique, caissier, article, référence..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Range Selector */}
        <div className="sm:col-span-3">
          <select
            value={dateRangeFilter}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            aria-label="Filtrer par période temporelle"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">Tout l'historique</option>
            <option value="TODAY">Aujourd'hui</option>
            <option value="7D">7 derniers jours</option>
            <option value="30D">30 derniers jours</option>
          </select>
        </div>

        {/* Tenant Select */}
        <div className="sm:col-span-4">
          <select
            value={tenantFilter}
            onChange={(e) => handleTenantChange(e.target.value)}
            aria-label="Filtrer par commerce ou boutique"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">Tous les commerces ({tenants.length})</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.plan})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Logs Table */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Chargement des opérations en direct...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2 text-rose-400">
            <AlertTriangle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
            <button
              type="button"
              onClick={() => fetchLogs()}
              className="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 text-xs font-bold"
            >
              Réessayer
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-3 text-slate-400">
            <ScrollText className="w-10 h-10 mx-auto text-slate-600" />
            <h3 className="text-sm font-bold text-slate-300">Aucune opération trouvée</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Aucun événement ne correspond à vos filtres actuels. Modifiez votre recherche ou la plage de dates.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Opération</th>
                  <th className="py-3 px-4">Commerce / Magasin</th>
                  <th className="py-3 px-4">Auteur</th>
                  <th className="py-3 px-4">Détail de l'Action</th>
                  <th className="py-3 px-4 text-right">Montant</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((log) => {
                  const badge = getTypeBadge(log.type);
                  const Icon = badge.icon;
                  const dateObj = new Date(log.timestamp);
                  const isToday = new Date().toDateString() === dateObj.toDateString();

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* 1. Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-200 font-bold">
                          {dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isToday ? "Aujourd'hui" : dateObj.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </td>

                      {/* 2. Type badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badge.bg}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* 3. Commerce / Boutique */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white max-w-[150px] truncate" title={log.tenantName}>
                          {log.tenantName}
                        </div>
                        {log.storeName && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {log.storeName}
                          </div>
                        )}
                      </td>

                      {/* 4. Auteur */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.userName ? (
                          <div>
                            <span className="font-bold text-slate-200 block max-w-[120px] truncate">
                              {log.userName}
                            </span>
                            {log.userRole && (
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-sm bg-slate-800 text-slate-400 font-semibold">
                                {log.userRole}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* 5. Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-200 truncate" title={log.title}>
                          {log.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate" title={log.description}>
                          {log.description}
                        </div>
                      </td>

                      {/* 6. Montant */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold">
                        {log.amount !== undefined && log.amount !== null ? (
                          <span className={log.type === "SALE" ? "text-emerald-400 font-black" : log.type === "SUBSCRIPTION" ? "text-purple-400 font-black" : "text-white"}>
                            {log.amount.toLocaleString("fr-FR")} {log.currency || "CDF"}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* 7. Statut */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.status === "COMPLETED" || log.status === "ACTIF" || log.status === "ACTIVE" || log.status === "ACQUITTÉ" || log.status === "SYNCED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : log.status === "FAILED" || log.status === "ALERTE STOCK" || log.status === "PAST_DUE"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          {log.status}
                        </span>
                      </td>

                      {/* 8. Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Voir les détails complets de l'opération"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="p-4 border-t border-slate-800">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        )}
      </div>

      {/* 6. Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl text-white space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <ScrollText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                    Détail Opération #{selectedLog.id}
                  </span>
                  <h3 className="text-base font-black text-white leading-tight">
                    {selectedLog.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Information Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Commerce</span>
                <span className="font-bold text-white">{selectedLog.tenantName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Point de Vente</span>
                <span className="font-bold text-slate-300">{selectedLog.storeName || "Principal"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Utilisateur</span>
                <span className="font-bold text-slate-300">
                  {selectedLog.userName ? `${selectedLog.userName} (${selectedLog.userRole || "USER"})` : "Système"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Date & Heure</span>
                <span className="font-mono text-slate-300">{new Date(selectedLog.timestamp).toLocaleString("fr-FR")}</span>
              </div>
              {selectedLog.amount !== undefined && selectedLog.amount !== null && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Montant</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {selectedLog.amount.toLocaleString("fr-FR")} {selectedLog.currency || "CDF"}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Statut</span>
                <span className="font-bold text-white">{selectedLog.status}</span>
              </div>
            </div>

            {/* Description Box */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Description de l'action :
              </span>
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 leading-relaxed font-mono">
                {selectedLog.description}
              </div>
            </div>

            {/* Metadata Payload (JSON) */}
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  Données Techniques & Métadonnées :
                </span>
                <pre className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-sky-300 overflow-x-auto max-h-48 leading-snug">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
