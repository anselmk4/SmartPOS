"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useSidebar } from "./sidebar-context";
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
} from "lucide-react";
import CashReconciliationModal from "@/components/pos/cash-reconciliation-modal";
import ExportReportModal from "@/components/reports/export-report-modal";

export function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, store, stores, isAuthenticated, isOwner, isCashier, plan, canAccess, selectStore } = useAuth();
  const { isCollapsed, toggleCollapse, isMobileOpen, setIsMobileOpen } = useSidebar();

  // Modals state
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);

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
      bgActive: "bg-blue-600 text-white shadow-md shadow-blue-600/30",
      allowed: true,
    },
    {
      label: "Carnet de Dettes",
      shortLabel: "Dettes",
      href: "/debts",
      icon: BookOpen,
      color: "text-rose-600",
      bgActive: "bg-rose-600 text-white shadow-md shadow-rose-600/30",
      allowed: true,
    },
    {
      label: "Dépenses & Frais",
      shortLabel: "Dépenses",
      href: "/expenses",
      icon: Wallet,
      color: "text-red-500",
      bgActive: "bg-red-600 text-white shadow-md shadow-red-600/30",
      allowed: !isCashier,
    },
    {
      label: "Stocks & Articles",
      shortLabel: "Stocks",
      href: "/inventory",
      icon: Package,
      color: "text-indigo-600",
      bgActive: "bg-indigo-600 text-white shadow-md shadow-indigo-600/30",
      allowed: !isCashier,
    },
    {
      label: "Bilan & Marges",
      shortLabel: "Bilan",
      href: "/dashboard",
      icon: BarChart3,
      color: "text-emerald-600",
      bgActive: "bg-emerald-600 text-white shadow-md shadow-emerald-600/30",
      allowed: !isCashier,
    },
    {
      label: "Espace Gérant",
      shortLabel: "Gérant",
      href: "/owner",
      icon: Crown,
      color: "text-amber-500",
      bgActive: "bg-amber-600 text-white shadow-md shadow-amber-600/30",
      allowed: isOwner,
    },
    {
      label: "Forfaits & SaaS",
      shortLabel: "Forfaits",
      href: "/billing",
      icon: Zap,
      color: "text-purple-600",
      bgActive: "bg-purple-600 text-white shadow-md shadow-purple-600/30",
      allowed: isOwner,
    },
    {
      label: "Paramètres",
      shortLabel: "Réglages",
      href: "/settings",
      icon: Settings,
      color: "text-slate-600",
      bgActive: "bg-slate-800 text-white shadow-md shadow-slate-800/30",
      allowed: !isCashier,
    },
  ].filter((item) => item.allowed);

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white border-r border-slate-200/90 shadow-sm select-none">
      {/* 1. Header: Kuettu Platform Brand */}
      <div className="p-3.5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <Link
            href="/pos"
            className={`flex items-center gap-2.5 overflow-hidden transition-all ${
              isCollapsed ? "justify-center w-full" : ""
            }`}
            title="Kuettu SMART POS"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
              <StoreIcon className="w-5 h-5" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900 text-sm tracking-tight">
                    Kuettu <span className="text-blue-600">SMART POS</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-400">
                    Offline-First SaaS
                  </span>
                </div>
              </div>
            )}
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
              Boutique Active
            </label>
            <select
              value={store?.id || ""}
              onChange={(e) => selectStore(e.target.value)}
              className="w-full p-2 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 rounded-xl text-xs font-bold border border-indigo-200/80 outline-none cursor-pointer truncate transition-colors"
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
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1.5 no-scrollbar">
        {!isCollapsed && (
          <div className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Navigation Caisse
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
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all relative touch-press ${
                isActive
                  ? item.bgActive
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              } ${isCollapsed ? "justify-center px-2" : ""}`}
              title={item.label}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? "text-white" : item.color
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
          <div className="pt-4 mt-2 border-t border-slate-100 space-y-1.5">
            <div className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Raccourcis Directs
            </div>

            {canAccess("canPerformCashClosing") && (
              <button
                onClick={() => {
                  setIsCashClosingOpen(true);
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/70 transition-colors touch-press text-left"
              >
                <Receipt className="w-3.5 h-3.5 shrink-0" />
                <span>Ticket Z (Clôture)</span>
              </button>
            )}

            {canAccess("canExportReports") && (
              <button
                onClick={() => {
                  setIsExportReportOpen(true);
                  setIsMobileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/70 transition-colors touch-press text-left"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span>Export Excel / CSV</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer with User Role & Collapse Toggle */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/50">
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2 rounded-xl bg-white border border-slate-200/80">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || "US"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500 font-medium truncate">
                {isOwner ? "Gérant Propriétaire" : isCashier ? "Caissier" : "Manager"}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex w-full items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-all"
          title={isCollapsed ? "Déplier le menu" : "Replier le menu"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-blue-600" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
              <span className="text-[11px]">Replier le menu</span>
            </>
          )}
        </button>
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
