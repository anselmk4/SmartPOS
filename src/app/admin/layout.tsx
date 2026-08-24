"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/lib/admin/admin-context";
import { adminFetch } from "@/lib/admin/admin-api";
import { AdminThemeProvider } from "@/lib/admin/admin-theme-context";
import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  Package,
  Settings,
  LogOut,
  ShieldCheck,
  Activity,
  ExternalLink,
  ChevronRight,
  Database,
  RefreshCw,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isAdminAuthenticated, isLoading, logoutAdmin } = useAdminAuth();

  // Real Database aggregate counts for badges
  const [counts, setCounts] = useState<{
    tenants: number;
    users: number;
    subscriptions: number;
    products: number;
  }>({
    tenants: 0,
    users: 0,
    subscriptions: 0,
    products: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRealCounts = useCallback(async () => {
    try {
      const res = await adminFetch("/api/v1/admin/overview");
      if (res.success && res.data?.counts) {
        setCounts({
          tenants: res.data.counts.tenants || 0,
          users: res.data.counts.users || 0,
          subscriptions: res.data.counts.subscriptions || 0,
          products: res.data.counts.products || 0,
        });
      }
    } catch (err) {
      console.error("[Admin Layout] Error fetching Supabase counts:", err);
    }
  }, []);

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchRealCounts();
      // Auto refresh counts every 60 seconds
      const interval = setInterval(fetchRealCounts, 60000);
      return () => clearInterval(interval);
    }
  }, [isAdminAuthenticated, fetchRealCounts, pathname]);

  // Allow login page without layout guard
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Vérification des accréditations Super Admin...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    router.push("/admin/login");
    return null;
  }

  const navItems = [
    { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard, count: null },
    { label: "Boutiques & Commerces", href: "/admin/tenants", icon: Store, count: counts.tenants },
    { label: "Utilisateurs & Caissiers", href: "/admin/users", icon: Users, count: counts.users },
    { label: "Abonnements & Mobile Money", href: "/admin/subscriptions", icon: CreditCard, count: counts.subscriptions },
    { label: "Catalogue & Stocks Réseau", href: "/admin/catalog", icon: Package, count: counts.products },
    { label: "Paramètres Système", href: "/admin/settings", icon: Settings, count: null },
  ];

  return (
    <AdminThemeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans transition-colors duration-200">
        {/* Super Admin Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between shrink-0 p-4 transition-colors duration-200">
          <div>
            {/* Brand & Badge */}
            <div className="pb-5 mb-5 border-b border-slate-800 flex items-center justify-between">
              <Link href="/admin" className="flex items-center gap-3">
                <div className="bg-white px-2 py-1 rounded-2xl border border-slate-700 shadow-md">
                  <img src="/images/logo.png" alt="Global POS" className="h-6 w-auto object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Supabase Live
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400 transition-colors"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.count !== null && item.count >= 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                        }`}>
                          {item.count}
                        </span>
                      )}
                      <ChevronRight className={`w-3 h-3 ${isActive ? "text-white" : "text-slate-600 group-hover:text-slate-400 transition-transform group-hover:translate-x-0.5"}`} />
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom session & shortcuts */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  SA
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{admin?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{admin?.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/pos"
                target="_blank"
                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                title="Ouvrir le terminal POS client"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Vue Caisse</span>
              </Link>

              <button
                onClick={logoutAdmin}
                className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                title="Se déconnecter de l'administration"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin Master Node</span>
              </div>

              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                <Database className="w-3 h-3" />
                <span>PostgreSQL Live</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Dark / Light Mode Switcher */}
              <AdminThemeToggle />

              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  await fetchRealCounts();
                  setTimeout(() => setIsRefreshing(false), 500);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Actualiser les compteurs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
              </button>

              <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Temps Réel</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AdminThemeProvider>
  );
}
