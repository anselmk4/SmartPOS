"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSync } from "@/lib/sync/sync-context";
import { useAuth } from "@/lib/auth/auth-context";
import CashReconciliationModal from "@/components/pos/cash-reconciliation-modal";
import ExportReportModal from "@/components/reports/export-report-modal";
import {
  ShoppingCart,
  BookOpen,
  Package,
  BarChart3,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Store as StoreIcon,
  CheckCircle2,
  Lock,
  Zap,
  Crown,
  UserCheck,
  LogOut,
  ArrowRight,
  Sparkles,
  Receipt,
  FileSpreadsheet,
  ChevronDown,
  Building,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOnline, isSyncing, pendingCount, syncNow } = useSync();
  const { user, tenant, store, stores, isAuthenticated, isOwner, isCashier, plan, canAccess, selectStore, lockTerminal, logout } = useAuth();
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Modals state
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);

  // Authenticated internal menu items
  const internalNavItems = [
    { label: "Caisse", href: "/pos", icon: ShoppingCart, allowed: true },
    { label: "Dettes", href: "/debts", icon: BookOpen, allowed: true },
    { label: "Stocks", href: "/inventory", icon: Package, allowed: !isCashier },
    { label: "Bilan", href: "/dashboard", icon: BarChart3, allowed: !isCashier },
    { label: "Gérant", href: "/owner", icon: Crown, allowed: isOwner },
    { label: "Forfaits", href: "/billing", icon: Zap, allowed: isOwner },
    { label: "Réglages", href: "/settings", icon: Settings, allowed: !isCashier },
  ].filter((item) => item.allowed);

  // Public visitor menu items
  const publicNavItems = [
    { label: "Accueil", href: "/", icon: StoreIcon },
    { label: "Tarifs SaaS", href: "/billing", icon: Zap },
  ];

  const handleSyncClick = async () => {
    const res = await syncNow();
    setSyncToast(res.message);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleLockClick = () => {
    lockTerminal();
    router.push("/auth/login");
  };

  const handleLogoutClick = () => {
    if (confirm("Voulez-vous vraiment vous déconnecter de votre session ?")) {
      logout();
      router.push("/auth/login");
    }
  };

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Store info */}
          <div className="flex items-center gap-3">
            <Link href={isAuthenticated ? "/pos" : "/"} className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <StoreIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-slate-900 leading-tight text-sm sm:text-base">
                    {isAuthenticated ? store?.name || tenant?.name || "Smart POS" : "Smart POS"}
                  </h1>
                  {isAuthenticated && (
                    <Link
                      href="/billing"
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${
                        plan === "BUSINESS"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                          : plan === "PRO"
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                      title="Changer de forfait"
                    >
                      {plan === "BUSINESS" ? "Business" : plan === "PRO" ? "Pro" : "Gratuit"}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  {isAuthenticated ? (
                    <>
                      <span>{store?.managerName || user?.name}</span>
                      <span>•</span>
                      <span className="font-semibold text-blue-700">
                        {isOwner ? "Gérant" : "Caissier"}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">Offline-First Caisse & Dettes</span>
                  )}
                </div>
              </div>
            </Link>

            {/* Business Plan Multi-Store Switcher */}
            {isAuthenticated && plan === "BUSINESS" && stores.length > 1 && (
              <div className="flex items-center ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-slate-200">
                <select
                  value={store?.id || ""}
                  onChange={(e) => selectStore(e.target.value)}
                  className="p-1 sm:p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 rounded-lg text-[11px] sm:text-xs font-bold border border-indigo-200 outline-none cursor-pointer max-w-[140px] sm:max-w-[220px] truncate"
                  title="Changer de boutique active"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      🏬 {s.name} {s.managerName ? `(Gérant: ${s.managerName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            {isAuthenticated
              ? internalNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href === "/pos" && pathname === "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-white text-blue-700 shadow-sm font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })
              : publicNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-white text-blue-700 shadow-sm font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
          </nav>

          {/* Actions & Status */}
          <div className="flex items-center gap-2">
            {/* Quick Action: Cash Closing (Ticket Z) for Pro & Business */}
            {isAuthenticated && canAccess("canPerformCashClosing") && (
              <button
                onClick={() => setIsCashClosingOpen(true)}
                className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all"
                title="Clôture de Caisse Journalière (Ticket Z)"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ticket Z</span>
              </button>
            )}

            {/* Quick Action: Export Excel for Business */}
            {isAuthenticated && canAccess("canExportReports") && (
              <button
                onClick={() => setIsExportReportOpen(true)}
                className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all"
                title="Export Comptable (Excel / PDF)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            )}

            {/* Online / Offline status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isOnline
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-blue-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span className="hidden sm:inline">{isOnline ? "En ligne" : "Hors-ligne"}</span>
            </div>

            {isAuthenticated ? (
              <>
                {/* Sync Button */}
                <button
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                    pendingCount > 0
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  }`}
                  title="Synchroniser"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-500" : ""}`} />
                  <span className="hidden sm:inline">{isSyncing ? "Synchro..." : "Synchro"}</span>
                  {pendingCount > 0 && (
                    <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>

                {/* Lock Terminal Button */}
                <button
                  onClick={handleLockClick}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors text-xs font-semibold flex items-center gap-1"
                  title="Verrouiller la caisse (Code PIN)"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Verrouiller</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogoutClick}
                  className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors text-xs font-semibold flex items-center gap-1"
                  title="Se déconnecter de la session"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Connexion PIN</span>
                </Link>

                <Link
                  href="/auth/register"
                  className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all hidden sm:flex items-center gap-1"
                >
                  <span>Créer Boutique</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Sync Toast */}
        {syncToast && (
          <div className="absolute left-1/2 -translate-x-1/2 top-14 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-xl flex items-center gap-2 animate-bounce z-50">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>{syncToast}</span>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Shown only when authenticated) */}
      {isAuthenticated && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5">
          <div
            className="grid gap-1 max-w-md mx-auto"
            style={{ gridTemplateColumns: `repeat(${Math.min(6, internalNavItems.length + 1)}, minmax(0, 1fr))` }}
          >
            {internalNavItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                    isActive
                      ? "text-blue-600 font-bold bg-blue-50/80"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-blue-600 stroke-[2.5]" : "stroke-2"}`} />
                  <span className="text-[10px] mt-0.5">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogoutClick}
              className="flex flex-col items-center justify-center py-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50/80 transition-all"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5 stroke-2" />
              <span className="text-[10px] mt-0.5">Quitter</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CashReconciliationModal
        isOpen={isCashClosingOpen}
        onClose={() => setIsCashClosingOpen(false)}
      />

      <ExportReportModal
        isOpen={isExportReportOpen}
        onClose={() => setIsExportReportOpen(false)}
      />
    </>
  );
}
export default Navbar;
