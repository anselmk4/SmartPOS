"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSync, COUNTRIES } from "@/lib/sync/sync-context";
import { useAuth } from "@/lib/auth/auth-context";
import { useSidebar } from "./sidebar-context";
import CashReconciliationModal from "@/components/pos/cash-reconciliation-modal";
import ExportReportModal from "@/components/reports/export-report-modal";
import {
  Store as StoreIcon,
  RefreshCw,
  Lock,
  LogOut,
  Menu,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Layers,
  HelpCircle,
  Info,
  DollarSign,
  PanelLeft,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOnline, isSyncing, pendingCount, syncNow } = useSync();
  const { user, tenant, store, stores, isAuthenticated, isOwner, isCashier, plan, canAccess, selectStore, lockTerminal, logout } = useAuth();
  const { toggleCollapse, toggleMobileOpen, isCollapsed } = useSidebar();
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const activeCountry = COUNTRIES.find((c) => c.code === (store?.countryCode || tenant?.countryCode || "CD"));

  // Modals state
  const [isCashClosingOpen, setIsCashClosingOpen] = useState(false);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);

  // Public visitor menu items
  const publicNavItems = [
    { label: "Fonctionnalités", href: "/#features" },
    { label: "Types d'entreprises", href: "/#types" },
    { label: "Tarifs", href: "/#pricing" },
    { label: "À propos", href: "/#about" },
    { label: "FAQ", href: "/#faq" },
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

  const isLandingPage = pathname === "/" || pathname === "";
  const isAuthPage = pathname?.startsWith("/auth");
  const isDashboardView = isAuthenticated && !isLandingPage && !isAuthPage;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs px-3 sm:px-5 py-2.5">
        <div className="w-full mx-auto flex items-center justify-between gap-3">
          {/* ========================================================= */}
          {/* LEFT SECTION */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {isDashboardView ? (
              <>
                {/* Mobile Drawer Trigger */}
                <button
                  onClick={toggleMobileOpen}
                  className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Ouvrir le menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Desktop Sidebar Toggle Button */}
                <button
                  onClick={toggleCollapse}
                  className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title={isCollapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
                >
                  <PanelLeft className="w-5 h-5" />
                </button>

                {/* Store Identity, Custom Logo & Country */}
                <div className="flex items-center gap-2.5">
                  {store?.logoUrl ? (
                    <img
                      src={store.logoUrl}
                      alt={store.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
                      <StoreIcon className="w-4 h-4" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h1 className="font-black text-slate-900 leading-tight text-sm sm:text-base truncate max-w-[140px] sm:max-w-[220px]">
                        {store?.name || tenant?.name || "Kuettu Shop"}
                      </h1>

                      {/* Country Flag */}
                      {activeCountry && (
                        <span className="text-xs" title={`Pays : ${activeCountry.name}`}>
                          {activeCountry.flag}
                        </span>
                      )}

                      <Link
                        href="/billing"
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${
                          plan === "BUSINESS"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                            : plan === "PRO"
                            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            : plan === "BASIC"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Changer de forfait"
                      >
                        {plan === "BUSINESS" ? "Business" : plan === "PRO" ? "Pro" : plan === "BASIC" ? "Basic" : "Gratuit"}
                      </Link>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <span className="font-semibold text-slate-800">{user?.name || store?.name}</span>
                      <span>•</span>
                      <span className="font-semibold text-blue-700">
                        {user?.role === "OWNER"
                          ? "Gérant"
                          : user?.role === "MANAGER"
                          ? "Manager"
                          : user?.role === "CASHIER"
                          ? "Caissier"
                          : "Utilisateur"}
                      </span>
                    </div>
                  </div>

                  {/* Business Plan Multi-Store Switcher */}
                  {plan === "BUSINESS" && stores.length > 1 && (
                    <div className="hidden lg:flex items-center ml-2 pl-2 border-l border-slate-200">
                      <select
                        value={store?.id || ""}
                        onChange={(e) => selectStore(e.target.value)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 rounded-xl text-xs font-bold border border-indigo-200 outline-none cursor-pointer max-w-[180px] truncate"
                        title="Changer de boutique active"
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
              </>
            ) : (
              /* Public Brand Logo */
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                  <StoreIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
                      Kuettu <span className="text-blue-600">SMART POS</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Offline-First • Caisse, Dettes WhatsApp & Mobile Money
                  </p>
                </div>
              </Link>
            )}
          </div>

          {/* ========================================================= */}
          {/* CENTER SECTION: Public Landing Links (When on landing page) */}
          {/* ========================================================= */}
          {isLandingPage && (
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80">
              {publicNavItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-white transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* ========================================================= */}
          {/* RIGHT SECTION */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Actions for authenticated users on wide screens in dashboard */}
            {isDashboardView && canAccess("canPerformCashClosing") && (
              <button
                onClick={() => setIsCashClosingOpen(true)}
                className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all"
                title="Clôture de Caisse Journalière (Ticket Z)"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ticket Z</span>
              </button>
            )}

            {/* Online / Offline Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span className="hidden sm:inline">{isOnline ? "En ligne" : "Hors-ligne"}</span>
            </div>

            {isDashboardView ? (
              <>
                {/* Synchro Button */}
                <button
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs touch-press ${
                    pendingCount > 0
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 animate-pulse"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80"
                  }`}
                  title="Synchronisation Cloud"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-500" : "text-slate-500"}`} />
                  <span className="hidden sm:inline">{isSyncing ? "Synchro..." : "Synchro"}</span>
                  {pendingCount > 0 && (
                    <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                      {pendingCount}
                    </span>
                  )}
                </button>

                {/* Verrouiller (Lock Terminal) */}
                <button
                  onClick={handleLockClick}
                  className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-all text-xs font-bold flex items-center gap-1.5 touch-press"
                  title="Verrouiller l'écran (Code PIN)"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Verrouiller</span>
                </button>

                {/* Déconnecter (Logout) */}
                <button
                  onClick={handleLogoutClick}
                  className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all text-xs font-bold flex items-center gap-1.5 touch-press"
                  title="Fermer la session"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </>
            ) : isLandingPage && isAuthenticated ? (
              /* Landing Page with Active Session */
              <>
                <Link
                  href="/pos"
                  className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5 touch-press"
                >
                  <StoreIcon className="w-3.5 h-3.5" />
                  <span>Accéder à ma Caisse</span>
                </Link>

                <button
                  onClick={handleLogoutClick}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 transition-all text-xs font-bold flex items-center gap-1.5"
                  title="Fermer la session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </>
            ) : (
              /* Guest Actions */
              <>
                <Link
                  href="/auth/login"
                  className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Connexion PIN</span>
                </Link>

                <Link
                  href="/auth/register"
                  className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5 touch-press"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Créer Boutique</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Sync Toast Alert */}
        {syncToast && (
          <div className="absolute left-1/2 -translate-x-1/2 top-14 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce z-50 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncToast}</span>
          </div>
        )}
      </header>

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
