"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, generateUUID, enqueueSync } from "@/lib/db/dexie-db";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import type { Customer, Sale, SaleItem, DebtPayment } from "@/lib/shared/types";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Trophy,
  Crown,
  Medal,
  Award,
  TrendingUp,
  Receipt,
  Coins,
  ArrowRight,
  ChevronRight,
  Calendar,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Clock,
  Filter,
  Lock,
} from "lucide-react";

export default function CustomersPage() {
  const { tenant, store, user, isAuthenticated, isLoading, isWaiter } = useAuth();
  const { formatMoney } = useSync();

  const currentTenantId = tenant?.id;

  // Active Tab: "directory" or "leaderboard"
  const [activeTab, setActiveTab] = useState<"directory" | "leaderboard">("directory");

  // Leaderboard timeframe filter: "day" | "month" | "year" | "all"
  const [timeframe, setTimeframe] = useState<"day" | "month" | "year" | "all">("month");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  // Selected customer for detailed "Fiche Client"
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modal states for Create / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("+243 ");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Live queries from Dexie
  const customers =
    useLiveQuery(
      async () => {
        if (!currentTenantId) return [];
        return await db.customers
          .filter((c) => c.tenantId === currentTenantId || !c.tenantId)
          .toArray();
      },
      [currentTenantId]
    ) || [];

  const sales =
    useLiveQuery(
      async () => {
        if (!currentTenantId) return [];
        return await db.sales
          .filter((s) => s.tenantId === currentTenantId || !s.tenantId)
          .toArray();
      },
      [currentTenantId]
    ) || [];

  const saleItems =
    useLiveQuery(
      async () => {
        return await db.saleItems.toArray();
      },
      []
    ) || [];

  const products =
    useLiveQuery(
      async () => {
        return await db.products.toArray();
      },
      []
    ) || [];

  const productsMap = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.id && p.name) map.set(p.id, p.name);
    });
    return map;
  }, [products]);

  const getProductName = (it: SaleItem) => {
    if (it.productName && it.productName !== "Article" && it.productName !== "Produit synchronisé") {
      return it.productName;
    }
    if (it.productId && productsMap.has(it.productId)) {
      return productsMap.get(it.productId)!;
    }
    return it.productName || "Article";
  };

  // Auto-backfill missing productNames in Dexie saleItems
  React.useEffect(() => {
    if (products.length === 0 || saleItems.length === 0) return;
    (async () => {
      for (const item of saleItems) {
        if ((!item.productName || item.productName === "Article" || item.productName === "Produit synchronisé") && item.productId) {
          const foundProd = productsMap.get(item.productId);
          if (foundProd) {
            await db.saleItems.update(item.id, { productName: foundProd }).catch(() => {});
          }
        }
      }
    })();
  }, [products.length, saleItems.length, productsMap]);

  const debtPayments =
    useLiveQuery(
      async () => {
        if (!currentTenantId) return [];
        return await db.debtPayments
          .filter((dp) => dp.tenantId === currentTenantId || !dp.tenantId)
          .toArray();
      },
      [currentTenantId]
    ) || [];

  // Calculate customer metrics & purchase history
  const customerStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalSpent: number;
        salesCount: number;
        lastPurchaseDate: string | null;
        purchases: Sale[];
      }
    >();

    for (const s of sales) {
      if (!s.customerId) continue;
      const existing = map.get(s.customerId) || {
        totalSpent: 0,
        salesCount: 0,
        lastPurchaseDate: null,
        purchases: [],
      };
      existing.totalSpent += s.totalAmount || 0;
      existing.salesCount += 1;
      existing.purchases.push(s);
      if (!existing.lastPurchaseDate || s.createdAt > existing.lastPurchaseDate) {
        existing.lastPurchaseDate = s.createdAt;
      }
      map.set(s.customerId, existing);
    }
    return map;
  }, [sales]);

  // Filtered customer list for directory
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery) ||
        c.address?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (filterDebtOnly && (!(c.currentDebtBalance > 0) && !(c.totalDebt && c.totalDebt > 0))) return false;
      return true;
    });
  }, [customers, searchQuery, filterDebtOnly]);

  // Compute Top Clients Leaderboard according to timeframe
  const leaderboard = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (timeframe === "day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (timeframe === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (timeframe === "year") {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    } else {
      startDate = new Date(0);
    }

    const isoStart = startDate.toISOString();
    const periodSales = sales.filter((s) => s.createdAt >= isoStart && s.customerId);

    const clientTotals = new Map<string, { totalAmount: number; count: number; lastDate: string }>();

    for (const s of periodSales) {
      if (!s.customerId) continue;
      const cur = clientTotals.get(s.customerId) || { totalAmount: 0, count: 0, lastDate: s.createdAt };
      cur.totalAmount += s.totalAmount || 0;
      cur.count += 1;
      if (s.createdAt > cur.lastDate) cur.lastDate = s.createdAt;
      clientTotals.set(s.customerId, cur);
    }

    const list: Array<{
      customer: Customer;
      totalAmount: number;
      count: number;
      lastDate: string;
    }> = [];

    clientTotals.forEach((stats, cId) => {
      const cust = customers.find((c) => c.id === cId);
      if (cust) {
        list.push({
          customer: cust,
          totalAmount: stats.totalAmount,
          count: stats.count,
          lastDate: stats.lastDate,
        });
      }
    });

    // Sort by highest amount spent
    list.sort((a, b) => b.totalAmount - a.totalAmount);
    return list;
  }, [sales, customers, timeframe]);

  // Selected customer object
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedCustomerPurchases = useMemo(() => {
    if (!selectedCustomerId) return [];
    return sales
      .filter((s) => s.customerId === selectedCustomerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sales, selectedCustomerId]);

  const selectedCustomerPayments = useMemo(() => {
    if (!selectedCustomerId) return [];
    return debtPayments
      .filter((dp) => dp.customerId === selectedCustomerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [debtPayments, selectedCustomerId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen title="Gestion Clients Verrouillée" />;
  }

  if (isWaiter) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-100">
        <div className="max-w-md w-full p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Accès Restreint</h3>
          <p className="text-xs text-slate-500">
            Le répertoire et la gestion des clients sont réservés aux caissiers et gérants.
          </p>
          <Link
            href="/pos"
            className="inline-block py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            Retourner à la Caisse
          </Link>
        </div>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormName("");
    setFormPhone("+243 ");
    setFormEmail("");
    setFormAddress("");
    setFormNotes("");
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone || "+243 ");
    setFormEmail(c.email || "");
    setFormAddress(c.address || "");
    setFormNotes(c.notes || "");
    setIsFormModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const now = new Date().toISOString();

    if (editingCustomer) {
      const updated: Customer = {
        ...editingCustomer,
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim().toLowerCase() || undefined,
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined,
        updatedAt: now,
      };
      await db.customers.put(updated);
      await enqueueSync({
        tenantId: currentTenantId,
        storeId: store?.id || "",
        entity: "customer",
        action: "UPDATE",
        payload: JSON.stringify(updated),
      });
    } else {
      const newCustomer: Customer = {
        id: generateUUID(),
        tenantId: currentTenantId,
        storeId: store?.id || "",
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim().toLowerCase() || undefined,
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined,
        currentDebtBalance: 0,
        totalDebt: 0,
        totalSpent: 0,
        isSynced: false,
        createdAt: now,
        updatedAt: now,
      };
      await db.customers.add(newCustomer);
      await enqueueSync({
        tenantId: currentTenantId,
        storeId: store?.id || "",
        entity: "customer",
        action: "CREATE",
        payload: JSON.stringify(newCustomer),
      });
    }

    setIsFormModalOpen(false);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm("Supprimer ce client ? Ses transactions passées resteront enregistrées.")) {
      await db.customers.delete(id);
      await enqueueSync({
        tenantId: currentTenantId,
        storeId: store?.id || "",
        entity: "customer",
        action: "DELETE",
        payload: JSON.stringify({ id }),
      });
      if (selectedCustomerId === id) setSelectedCustomerId(null);
    }
  };

  const getWhatsAppThankYouUrl = (customer: Customer, amountSpent: number, rank: number) => {
    const phone = customer.phone ? customer.phone.replace(/[^0-9]/g, "") : "";
    const storeName = store?.name || tenant?.name || "Kuettu Shop";
    const text = `🌟 *REMERCIEMENT FIDÉLITÉ - ${storeName}*\n\nBonjour ${customer.name} !\nToute l'équipe de *${storeName}* vous remercie chaleureusement pour votre fidélité.\n\n🏆 Vous faites partie de nos *Meilleurs Clients* (${formatMoney(amountSpent)} d'achats réalisés).\n\nÀ très bientôt dans notre boutique !`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-6">
      {/* Header & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Fichier Clients & Fidélité</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Gestion des Clients & Top Acheteurs
          </h1>
          <p className="text-xs text-slate-500">
            Suivez l'historique d'achat de chaque client, identifiez vos meilleurs acheteurs et renforcez votre relation commerciale.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 touch-press"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Main Tabs Header */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("directory")}
          className={`pb-3 font-black text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "directory"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Annuaire & Fiches ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`pb-3 font-black text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "leaderboard"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>🏆 Classement Top Clients ({leaderboard.length})</span>
        </button>
      </div>

      {/* TAB 1: DIRECTORY & CLIENT PROFILES */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, commune..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-xs sm:text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setFilterDebtOnly(!filterDebtOnly)}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
                filterDebtOnly
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Avec Dettes Uniquement</span>
            </button>
          </div>

          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredCustomers.map((c) => {
              const stats = customerStatsMap.get(c.id) || {
                totalSpent: 0,
                salesCount: 0,
                lastPurchaseDate: null,
                purchases: [],
              };
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                            {c.name}
                          </h3>
                          {c.phone && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{c.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {(c.currentDebtBalance > 0 || (c.totalDebt && c.totalDebt > 0)) && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          Dette : {formatMoney(c.currentDebtBalance || c.totalDebt || 0)}
                        </span>
                      )}
                    </div>

                    {c.address && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}

                    {/* Stats summary row */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-left my-2 font-mono text-[11px]">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 font-sans">
                          Achats Cumulés
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatMoney(stats.totalSpent)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400 font-sans">
                          Commandes
                        </span>
                        <span className="font-bold text-slate-800">
                          {stats.salesCount} tickets
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-bold">
                    <span>Ouvrir la fiche client</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="col-span-full bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Aucun client trouvé</p>
                <p className="text-xs mt-1">Créez votre premier client ou modifiez votre recherche.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TOP CLIENTS LEADERBOARD (DAY / MONTH / YEAR) */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          {/* Timeframe Selector */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center gap-1.5 max-w-md mx-auto">
            {[
              { id: "day", label: "Aujourd'hui" },
              { id: "month", label: "Ce Mois" },
              { id: "year", label: "Cette Année" },
              { id: "all", label: "Tout l'Historique" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id as any)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                  timeframe === t.id
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Podium Top 3 */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-4xl mx-auto items-end pt-4">
              {/* 2nd Place (Silver) */}
              <div className="bg-gradient-to-b from-slate-100 to-white rounded-3xl p-5 border-2 border-slate-300 shadow-sm text-center order-2 sm:order-1 relative">
                <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-black text-sm flex items-center justify-center mx-auto -mt-9 mb-2 shadow">
                  2
                </div>
                <Medal className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <h3 className="font-extrabold text-slate-900 text-sm truncate">
                  {leaderboard[1].customer.name}
                </h3>
                <div className="text-base font-black text-slate-800 mt-1">
                  {formatMoney(leaderboard[1].totalAmount)}
                </div>
                <div className="text-[10px] text-slate-500">{leaderboard[1].count} achats</div>
                {leaderboard[1].customer.phone && (
                  <a
                    href={getWhatsAppThankYouUrl(leaderboard[1].customer, leaderboard[1].totalAmount, 2)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Remercier</span>
                  </a>
                )}
              </div>

              {/* 1st Place (Gold) */}
              <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-6 border-2 border-amber-400 shadow-xl text-center order-1 sm:order-2 relative -mt-4">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-900 font-black text-base flex items-center justify-center mx-auto -mt-11 mb-2 shadow-lg">
                  👑
                </div>
                <Crown className="w-8 h-8 text-amber-500 mx-auto mb-1" />
                <span className="text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Client VIP N°1
                </span>
                <h3 className="font-black text-slate-900 text-base mt-2 truncate">
                  {leaderboard[0].customer.name}
                </h3>
                <div className="text-xl font-black text-amber-600 mt-1">
                  {formatMoney(leaderboard[0].totalAmount)}
                </div>
                <div className="text-xs text-slate-500">{leaderboard[0].count} commandes</div>
                {leaderboard[0].customer.phone && (
                  <a
                    href={getWhatsAppThankYouUrl(leaderboard[0].customer, leaderboard[0].totalAmount, 1)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/25"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message VIP WhatsApp</span>
                  </a>
                )}
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="bg-gradient-to-b from-orange-50/50 to-white rounded-3xl p-5 border-2 border-orange-300 shadow-sm text-center order-3 relative">
                <div className="w-8 h-8 rounded-full bg-orange-300 text-orange-950 font-black text-sm flex items-center justify-center mx-auto -mt-9 mb-2 shadow">
                  3
                </div>
                <Award className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                <h3 className="font-extrabold text-slate-900 text-sm truncate">
                  {leaderboard[2].customer.name}
                </h3>
                <div className="text-base font-black text-slate-800 mt-1">
                  {formatMoney(leaderboard[2].totalAmount)}
                </div>
                <div className="text-[10px] text-slate-500">{leaderboard[2].count} achats</div>
                {leaderboard[2].customer.phone && (
                  <a
                    href={getWhatsAppThankYouUrl(leaderboard[2].customer, leaderboard[2].totalAmount, 3)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Remercier</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <h3 className="font-black text-slate-900 text-base mb-3">
              Classement Général ({timeframe === "day" ? "Aujourd'hui" : timeframe === "month" ? "Ce Mois" : timeframe === "year" ? "Cette Année" : "Tout l'Historique"})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[550px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black">
                    <th className="py-2.5 px-3">Rang</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3 text-right">Achats Réalisés</th>
                    <th className="py-2.5 px-3 text-center">Commandes</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {leaderboard.map((item, idx) => (
                    <tr key={item.customer.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-black text-slate-800">
                        {idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.customer.name}</div>
                        {item.customer.phone && (
                          <div className="text-[10px] text-slate-400">{item.customer.phone}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-blue-700 font-mono">
                        {formatMoney(item.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                        {item.count} tickets
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {item.customer.phone && (
                          <a
                            href={getWhatsAppThankYouUrl(item.customer, item.totalAmount, idx + 1)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold inline-flex items-center gap-1"
                            title="Envoyer un mot de remerciement"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {leaderboard.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aucune vente enregistrée sur cette période pour les clients identifiés.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED FICHE CLIENT MODAL / DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">{selectedCustomer.name}</h2>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                    {selectedCustomer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {selectedCustomer.phone}
                      </span>
                    )}
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {selectedCustomer.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(selectedCustomer)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                  title="Modifier le client"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Financial Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-left">
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                <span className="block text-[9px] uppercase font-bold text-slate-500 font-sans">
                  Total Achats
                </span>
                <span className="text-sm font-black text-blue-700">
                  {formatMoney(
                    selectedCustomerPurchases.reduce((acc, s) => acc + (s.totalAmount || 0), 0)
                  )}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="block text-[9px] uppercase font-bold text-slate-500 font-sans">
                  Commandes
                </span>
                <span className="text-sm font-black text-slate-800">
                  {selectedCustomerPurchases.length} tickets
                </span>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100">
                <span className="block text-[9px] uppercase font-bold text-slate-500 font-sans">
                  Dette Actuelle
                </span>
                <span className="text-sm font-black text-rose-700">
                  {formatMoney(selectedCustomer.currentDebtBalance || selectedCustomer.totalDebt || 0)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="block text-[9px] uppercase font-bold text-slate-500 font-sans">
                  Panier Moyen
                </span>
                <span className="text-sm font-black text-slate-800">
                  {selectedCustomerPurchases.length > 0
                    ? formatMoney(
                        Math.round(
                          selectedCustomerPurchases.reduce((acc, s) => acc + (s.totalAmount || 0), 0) /
                            selectedCustomerPurchases.length
                        )
                      )
                    : "0 FC"}
                </span>
              </div>
            </div>

            {/* Purchase Chronology */}
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm mb-2.5 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>Historique Chronologique des Achats</span>
              </h3>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selectedCustomerPurchases.map((sale) => {
                  const items = saleItems.filter((it) => it.saleId === sale.id);
                  return (
                    <div
                      key={sale.id}
                      className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-300 space-y-2 text-xs font-mono shadow-2xs transition-all"
                    >
                      <div className="flex items-center justify-between text-slate-800 font-bold">
                        <span className="font-sans text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {sale.receiptNumber ? `Ticket N° ${sale.receiptNumber}` : `Facture #${sale.id.slice(-6).toUpperCase()}`}
                        </span>
                        <span className="text-slate-900 font-black text-sm">{formatMoney(sale.totalAmount)}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans">
                        <span>
                          📅 {new Date(sale.createdAt).toLocaleDateString("fr-FR")} à {new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                          Mode : {sale.paymentMethod}
                        </span>
                      </div>

                      {items.length > 0 ? (
                        <div className="pt-2 text-[11px] text-slate-700 space-y-1 border-t border-slate-100 font-sans">
                          {items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-slate-700">
                              <span className="font-semibold truncate max-w-[240px]">
                                • {getProductName(it)} <span className="text-slate-400 font-normal">(x{it.quantity})</span>
                              </span>
                              <span className="font-bold text-slate-900">{formatMoney(it.quantity * it.unitPrice)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-1 text-[10px] text-slate-400 font-sans italic">
                          Détails des articles non disponibles
                        </div>
                      )}

                      {sale.debtAmount > 0 && (
                        <div className="flex justify-between items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 font-sans">
                          <span>Reste en Dette :</span>
                          <span className="font-black">{formatMoney(sale.debtAmount)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {selectedCustomerPurchases.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Aucun achat enregistré pour ce client pour le moment.
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="py-2 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                Fermer la Fiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingCustomer ? "Modifier la Fiche Client" : "Nouveau Client"}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Nom Complet du Client *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Papa Dieudonné Kasongo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-xs sm:text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Numéro Téléphone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+243 81 000 11 22"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-xs sm:text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Adresse Email
                </label>
                <input
                  type="email"
                  placeholder="client@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-xs sm:text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Adresse / Commune
                </label>
                <input
                  type="text"
                  placeholder="Av. Saio n° 12, Commune Ibanda"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-xs sm:text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Remarques / Préférences
                </label>
                <textarea
                  rows={2}
                  placeholder="Client fidèle, préfère payer par M-Pesa..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25"
                >
                  {editingCustomer ? "Enregistrer les modifications" : "Créer le client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
