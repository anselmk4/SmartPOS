"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useSidebar } from "./sidebar-context";
import { useRouter } from "next/navigation";
import { useSync } from "@/lib/sync/sync-context";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/dexie-db";
import { PLAN_CONFIGS } from "@/lib/shared/types";
import { getPlanPriceInfo } from "@/lib/constants/plans";
import {
  ShoppingCart,
  BookOpen,
  Package,
  BarChart3,
  Settings,
  Store as StoreIcon,
  Crown,
  Zap,
  ChevronLeft,
  ChevronRight,
  Receipt,
  FileSpreadsheet,
  Building,
  User,
  X,
  Sparkles,
  Wallet,
  Power,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import CashReconciliationModal from "@/components/pos/cash-reconciliation-modal";
import ExportReportModal from "@/components/reports/export-report-modal";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    tenant,
    store,
    stores,
    isAuthenticated,
    isOwner,
    isCashier,
    isWaiter,
    isSimulating,
    plan,
    canAccess,
    selectStore,
    logout,
    restoreOwnerRole,
    terminalUsers,
  } = useAuth();
  const { isCollapsed, toggleCollapse, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { rawCurrency } = useSync();

  // Count sales made this month for quota check
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const monthlySalesCount =
    useLiveQuery(
      async () => {
        if (!tenant?.id) return 0;
        return await db.sales
          .filter((s) => (s.tenantId === tenant.id || !s.tenantId) && s.createdAt >= startOfMonth)
          .count();
      },
      [tenant?.id, startOfMonth]
    ) || 0;

  const currentPlanConfig = PLAN_CONFIGS[plan] || PLAN_CONFIGS.FREE;
  const maxSales = currentPlanConfig.maxSalesPerMonth;
  const percentUsed = maxSales ? Math.min(Math.round((monthlySalesCount / maxSales) * 100), 100) : 0;
  const nextPlan = plan === "FREE" ? "BASIC" : plan === "BASIC" ? "PRO" : plan === "PRO" ? "BUSINESS" : null;
  const nextPriceInfo = nextPlan ? getPlanPriceInfo(nextPlan, rawCurrency) : null;

  // Modals state
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreOwnerClick = async () => {
    setIsRestoring(true);
    const res = await restoreOwnerRole();
    setIsRestoring(false);

    if (res.success) {
      setIsMobileOpen(false);
      router.push("/owner");
    } else {
      setPinInput("");
      setPinError(null);
      setIsPinModalOpen(true);
    }
  };

  const handleVerifyPinAndRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4) {
      setPinError("Code PIN à 4 chiffres requis.");
      return;
    }

    setIsRestoring(true);
    const res = await restoreOwnerRole(pinInput);
    setIsRestoring(false);

    if (res.success) {
      setIsPinModalOpen(false);
      setIsMobileOpen(false);
      router.push("/owner");
    } else {
      setPinError(res.message || "Code PIN incorrect.");
      setPinInput("");
    }
  };

  // If not authenticated, on landing page (/), or on admin/auth pages, do not show the dashboard sidebar
  if (!isAuthenticated || pathname === "/" || pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) {
    return null;
  }

  const navItems = [
    {
      label: "Caisse & Vente",
      shortLabel: "Caisse",
      href: "/pos",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgActive: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
      allowed: true,
    },
    {
      label: "Journal des Ventes",
      shortLabel: "Ventes",
      href: "/sales",
      icon: Receipt,
      color: "text-blue-500",
      bgActive: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
      allowed: !isWaiter,
    },
    {
      label: "Carnet de Dettes",
      shortLabel: "Dettes",
      href: "/debts",
      icon: BookOpen,
      color: "text-rose-600",
      bgActive: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
      allowed: !isWaiter,
    },
    {
      label: "Clients & Fidélité",
      shortLabel: "Clients",
      href: "/customers",
      icon: User,
      color: "text-sky-600",
      bgActive: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
      allowed: true,
    },
    {
      label: "Dépenses & Frais",
      shortLabel: "Dépenses",
      href: "/expenses",
      icon: Wallet,
      color: "text-red-500",
      bgActive: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
      allowed: isOwner || isManager,
    },
    {
      label: "Stocks & Articles",
      shortLabel: "Stocks",
      href: "/inventory",
      icon: Package,
      color: "text-indigo-600",
      bgActive: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
      allowed: isOwner || isManager,
    },
    {
      label: "Bilan & Marges",
      shortLabel: "Bilan",
      href: "/dashboard",
      icon: BarChart3,
      color: "text-emerald-600",
      bgActive: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
      allowed: isOwner || isManager,
    },
    {
      label: "Espace Gérant",
      shortLabel: "Gérant",
      href: "/owner",
      icon: Crown,
      color: "text-amber-500",
      bgActive: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
      allowed: isOwner,
    },
    {
      label: "Forfaits & SaaS",
      shortLabel: "Forfaits",
      href: "/billing",
      icon: Zap,
      color: "text-purple-600",
      bgActive: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
      allowed: isOwner,
    },
    {
      label: "Paramètres",
      shortLabel: "Réglages",
      href: "/settings",
      icon: Settings,
      color: "text-slate-600",
      bgActive: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
      allowed: isOwner || isManager,
    },
  ].filter((item) => item.allowed);

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white border-r border-slate-100/90 shadow-xs select-none">
      {/* 1. Header: Platform Brand */}
      <div className="p-4 border-b border-slate-100/70">
        <div className="flex items-center justify-between">
          <Link
            href="/pos"
            className={`flex items-center overflow-hidden transition-all ${
              isCollapsed ? "justify-center w-full" : "gap-2"
            }`}
            title="Kuettu Global POS"
          >
            <img
              src="/images/logo.png"
              alt="Kuettu Global POS"
              className={isCollapsed ? "h-6 w-auto object-contain" : "h-7 sm:h-8 w-auto object-contain"}
            />
          </Link>

          {/* Close button for Mobile Drawer */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Store Switcher (Business Plan) */}
        {!isCollapsed && plan === "BUSINESS" && stores.length > 1 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Commerce Actif
            </label>
            <select
              value={store?.id || ""}
              onChange={(e) => selectStore(e.target.value)}
              className="w-full p-2 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-semibold border border-slate-200 outline-none cursor-pointer truncate transition-colors"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  🏬 {s.name} {s.managerName ? `(${s.managerName})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Navigation Menu Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Menu Principal
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/pos" && pathname === "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all relative touch-press ${
                isActive
                  ? item.bgActive
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              } ${isCollapsed ? "justify-center px-2" : ""}`}
              title={item.label}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800"
                }`}
              />

              {!isCollapsed ? (
                <span className="truncate">{item.label}</span>
              ) : (
                /* Tooltip for collapsed state */
                <span className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        {/* Quick Modals Shortcuts (Ticket Z & Export) */}
        {!isCollapsed && (
          <div className="pt-4 mt-3 border-t border-slate-100 space-y-1.5">
            <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Raccourcis Directs
            </div>

            {canAccess("canPerformCashClosing") && (
              <button
                onClick={() => {
                  setIsCashClosingOpen(true);
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors touch-press text-left"
              >
                <Receipt className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Ticket Z (Clôture)</span>
              </button>
            )}

            {canAccess("canExportReports") && (
              <button
                onClick={() => {
                  setIsExportReportOpen(true);
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors touch-press text-left"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Export Excel / CSV</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2B. RESTORE OWNER PROMPT WHEN SIMULATING OR AS CASHIER */}
      {!isOwner && (
        <div className="p-2 border-t border-slate-100 bg-amber-50/40">
          {!isCollapsed ? (
            <button
              onClick={handleRestoreOwnerClick}
              disabled={isRestoring}
              className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-sm shadow-amber-500/20 transition-all touch-press"
              title="Restaurer l'accès propriétaire et gérant"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Crown className="w-4 h-4 text-amber-100 shrink-0 animate-bounce" />
                <span className="truncate">Restaurer Propriétaire</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
            </button>
          ) : (
            <button
              onClick={handleRestoreOwnerClick}
              disabled={isRestoring}
              className="w-full flex items-center justify-center p-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-all"
              title="Restaurer l'accès Propriétaire"
            >
              <Crown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 2C. PLAN & QUOTA STATUS WIDGET (Directly under menus, above user profile) */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-md border border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px] font-black text-white truncate leading-tight">
                    Forfait {currentPlanConfig.name}
                  </span>
                  <span className="block text-[9px] text-slate-400 font-medium">
                    {maxSales ? `${monthlySalesCount} / ${maxSales} ventes` : "Ventes illimitées"}
                  </span>
                </div>
              </div>

              <Link
                href="/billing"
                onClick={() => setIsMobileOpen(false)}
                className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shrink-0 transition-colors flex items-center gap-0.5"
              >
                <span>Gérer</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>

            {maxSales ? (
              <div className="space-y-1">
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      percentUsed > 80 ? "bg-amber-500" : "bg-gradient-to-r from-blue-500 to-emerald-400"
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </div>
            ) : null}

            {nextPlan && (
              <div className="text-[10px] text-slate-300 flex items-center gap-1 leading-tight pt-1 border-t border-slate-800/80">
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">
                  {nextPlan === "BASIC" && `Basic : 1 000 ventes & 10 caissiers`}
                  {nextPlan === "PRO" && `Pro : Ventes illimitées & WhatsApp`}
                  {nextPlan === "BUSINESS" && `Business : Multi-Dépôts`}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-slate-100 flex justify-center">
          <Link
            href="/billing"
            className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center hover:bg-slate-800 shadow-sm transition-all group relative"
            title={`Forfait ${currentPlanConfig.name}`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Forfait {currentPlanConfig.name}
            </span>
          </Link>
        </div>
      )}

      {/* 3. Footer with Soft User Pill Card & Power Button (as in screenshot) */}
      <div className="p-3 border-t border-slate-100/80 bg-white">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-sky-50/70 border border-sky-100/80 transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Circular Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {user?.name?.slice(0, 1).toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {user?.name || "Utilisateur"}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {isOwner
                    ? "Gérant Propriétaire"
                    : isWaiter
                    ? "Serveur(se)"
                    : isCashier
                    ? "Caissier"
                    : "Manager"}
                </div>
              </div>
            </div>

            {/* Logout / Power Button */}
            <button
              onClick={() => {
                if (confirm("Voulez-vous vous déconnecter de la caisse ?")) {
                  logout();
                }
              }}
              className="p-1.5 rounded-xl text-blue-500 hover:text-rose-600 hover:bg-white transition-colors shrink-0"
              title="Déconnexion"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-xl text-blue-600 hover:bg-slate-100 transition-colors"
            title="Déplier le menu"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Collapse Toggle */}
        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden md:flex w-full items-center justify-center gap-1.5 mt-2 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Replier</span>
          </button>
        )}
      </div>

      {/* Modal Dialogs */}
      <CashReconciliationModal
        isOpen={isCashClosingOpen}
        onClose={() => setIsCashClosingOpen(false)}
      />

      <ExportReportModal
        isOpen={isExportReportOpen}
        onClose={() => setIsExportReportOpen(false)}
      />

      {/* PIN Verification Modal for Owner Restoration */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Restaurer Accès Propriétaire</h3>
                  <p className="text-[11px] text-slate-400">Accès total au tableau de bord</p>
                </div>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Veuillez saisir votre code PIN Propriétaire / Gérant pour réactiver immédiatement vos privilèges administrateur.
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPinAndRestore} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                  Code PIN Propriétaire (4 chiffres)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.6em] text-2xl font-mono py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length < 4 || isRestoring}
                  className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-amber-600/30"
                >
                  {isRestoring ? "Vérification..." : "Déverrouiller"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Collapsible Sidebar */}
      <aside
        className={`hidden md:block sticky top-0 h-screen shrink-0 transition-all duration-300 ease-in-out z-30 ${
          isCollapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer (Overlay) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200 z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
