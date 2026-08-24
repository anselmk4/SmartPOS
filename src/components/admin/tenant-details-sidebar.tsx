"use client";

import React, { useEffect, useState } from "react";
import type { SubscriptionPlan } from "@/lib/shared/types";
import {
  X,
  Store,
  Globe,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CreditCard,
  Layers,
  Users,
  Package,
  Receipt,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
  Edit2,
  Ban,
  Play,
  ArrowRight,
  TrendingUp,
  Activity,
  Cpu,
} from "lucide-react";

export interface TenantWithDetails {
  id: string;
  name: string;
  slug: string;
  businessType?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  countryCode: string;
  currency: string;
  plan: SubscriptionPlan;
  planStatus: string;
  planExpiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stores?: Array<{ id: string; name: string; address?: string | null; ownerName?: string | null; currency?: string }>;
  users?: Array<{ id: string; name: string; phone?: string | null; email?: string | null; role: string; isActive: boolean; lastLoginAt?: string | null }>;
  subscriptions?: Array<{ id: string; plan: string; amount: number; currency: string; paymentMethod: string; paymentStatus: string; periodStart: string; periodEnd: string; createdAt: string }>;
  _count?: {
    products: number;
    sales: number;
    customers: number;
    subscriptions: number;
  };
}

interface TenantDetailsSidebarProps {
  tenant: TenantWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tenant: TenantWithDetails) => void;
  onChangePlan: (tenant: TenantWithDetails) => void;
  onToggleStatus: (tenant: TenantWithDetails) => void;
}

const COUNTRY_MAP: Record<string, { name: string; flag: string; ipRegion: string }> = {
  CD: { name: "RD Congo", flag: "🇨🇩", ipRegion: "Kinshasa / Lubumbashi (Afrique Centrale)" },
  CI: { name: "Côte d'Ivoire", flag: "🇨🇮", ipRegion: "Abidjan (Afrique de l'Ouest)" },
  SN: { name: "Sénégal", flag: "🇸🇳", ipRegion: "Dakar (Afrique de l'Ouest)" },
  CM: { name: "Cameroun", flag: "🇨🇲", ipRegion: "Douala / Yaoundé (Afrique Centrale)" },
  GN: { name: "Guinée", flag: "🇬🇳", ipRegion: "Conakry (Afrique de l'Ouest)" },
  ML: { name: "Mali", flag: "🇲🇱", ipRegion: "Bamako (Afrique de l'Ouest)" },
  BF: { name: "Burkina Faso", flag: "🇧🇫", ipRegion: "Ouagadougou (Afrique de l'Ouest)" },
  CG: { name: "Congo Brazzaville", flag: "🇨🇬", ipRegion: "Brazzaville / Pointe-Noire" },
  GA: { name: "Gabon", flag: "🇬🇦", ipRegion: "Libreville (Afrique Centrale)" },
  TG: { name: "Togo", flag: "🇹🇬", ipRegion: "Lomé (Afrique de l'Ouest)" },
  BJ: { name: "Bénin", flag: "🇧🇯", ipRegion: "Cotonou (Afrique de l'Ouest)" },
  RW: { name: "Rwanda", flag: "🇷🇼", ipRegion: "Kigali (Afrique de l'Est)" },
};

export function TenantDetailsSidebar({
  tenant,
  isOpen,
  onClose,
  onEdit,
  onChangePlan,
  onToggleStatus,
}: TenantDetailsSidebarProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"GENERAL" | "NETWORK" | "SUBSCRIPTIONS">("GENERAL");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !tenant) return null;

  const countryInfo = COUNTRY_MAP[tenant.countryCode] || {
    name: tenant.countryCode,
    flag: "🌍",
    ipRegion: `Région ${tenant.countryCode}`,
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const mainOwner =
    tenant.users?.find((u) => u.role === "OWNER")?.name ||
    tenant.stores?.[0]?.ownerName ||
    "Propriétaire / Gérant";

  const ownerPhone = tenant.phone || tenant.users?.find((u) => u.role === "OWNER")?.phone || "";
  const ownerEmail = tenant.email || tenant.users?.find((u) => u.role === "OWNER")?.email || "";

  const createdDate = new Date(tenant.createdAt);
  const formattedCreated = createdDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedCreatedTime = createdDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const timeAgoDays = Math.floor(
    (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const cleanPhoneDigits = ownerPhone.replace(/\D/g, "");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out z-50">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-slate-900/90 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg shrink-0 ${
                tenant.plan === "BUSINESS"
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20"
                  : tenant.plan === "PRO"
                  ? "bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/20"
                  : tenant.plan === "BASIC"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
                  : "bg-slate-800 border border-slate-700 text-slate-300"
              }`}
            >
              {tenant.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white truncate">{tenant.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    tenant.plan === "BUSINESS"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : tenant.plan === "PRO"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : tenant.plan === "BASIC"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {tenant.plan}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    tenant.isActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {tenant.isActive ? "En Ligne" : "Suspendu"}
                </span>
              </div>

              {/* ID with 1-click copy */}
              <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs font-mono">
                <span className="truncate max-w-[200px] sm:max-w-[280px]">ID: {tenant.id}</span>
                <button
                  onClick={() => copyToClipboard(tenant.id, "id")}
                  className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                  title="Copier l'identifiant"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copiedField === "id" && (
                  <span className="text-[10px] text-emerald-400 font-sans font-bold">Copié !</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950/60 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab("GENERAL")}
            className={`py-2 rounded-xl transition-all ${
              activeTab === "GENERAL"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Informations Clés
          </button>
          <button
            onClick={() => setActiveTab("NETWORK")}
            className={`py-2 rounded-xl transition-all ${
              activeTab === "NETWORK"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Équipe & Dépôts ({tenant.stores?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("SUBSCRIPTIONS")}
            className={`py-2 rounded-xl transition-all ${
              activeTab === "SUBSCRIPTIONS"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Forfait & Paiements
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: GENERAL INFO */}
          {activeTab === "GENERAL" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 4 KPIs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <Package className="w-3.5 h-3.5 text-blue-400" />
                    <span>Articles</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-white">
                    {tenant._count?.products || 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ventes</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-white">
                    {tenant._count?.sales || 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clients</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-white">
                    {tenant._count?.customers || 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                    <span>Factures</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-white">
                    {tenant._count?.subscriptions || 0}
                  </span>
                </div>
              </div>

              {/* Identity & Location Card */}
              <div className="bg-slate-800/40 rounded-3xl p-4 sm:p-5 border border-slate-800 space-y-3.5 text-xs">
                <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>Identité & Localisation Géographique</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Pays d'Implantation</span>
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span>{countryInfo.flag}</span>
                      <span>{countryInfo.name} ({tenant.countryCode})</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Devise d'Encaissement</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">
                      {tenant.currency}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Activité / Secteur</span>
                    <span className="font-bold text-slate-200">
                      {tenant.businessType || "Commerce Général / Détail"}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-0.5">IP & Réseau Régional</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {countryInfo.ipRegion}
                    </span>
                  </div>
                </div>

                {tenant.address && (
                  <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-slate-400 block">Adresse du Siège</span>
                      <span className="font-medium text-slate-200">{tenant.address}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Registration & Timeline Card */}
              <div className="bg-slate-800/40 rounded-3xl p-4 sm:p-5 border border-slate-800 space-y-3 text-xs">
                <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>Historique d'Inscription & Horodatage</span>
                </h3>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Date d'inscription :</span>
                    <span className="font-bold text-white font-mono">
                      {formattedCreated} à {formattedCreatedTime}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Ancienneté du compte :</span>
                    <span className="font-bold text-blue-400 font-mono">
                      {timeAgoDays === 0 ? "Aujourd'hui" : `Il y a ${timeAgoDays} jour(s)`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-400">Dernière synchronisation :</span>
                    <span className="font-mono text-slate-300">
                      {new Date(tenant.updatedAt).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(tenant.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner / Contact Card */}
              <div className="bg-slate-800/40 rounded-3xl p-4 sm:p-5 border border-slate-800 space-y-3 text-xs">
                <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Contact Gérant / Propriétaire</span>
                </h3>

                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-sm text-white">{mainOwner}</div>
                    <div className="font-mono text-slate-400 text-xs mt-0.5">{ownerPhone || "Aucun numéro"}</div>
                    {ownerEmail && <div className="text-slate-400 text-[11px]">{ownerEmail}</div>}
                  </div>

                  {cleanPhoneDigits && (
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(
                          `Bonjour ${mainOwner}, nous vous contactons depuis l'assistance SmartPOS Global concernant votre boutique "${tenant.name}".`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all touch-press"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${ownerPhone}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Appeler"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NETWORK & USERS */}
          {activeTab === "NETWORK" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stores / Dépôts List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-400" />
                    <span>Points de Vente & Dépôts ({tenant.stores?.length || 0})</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {tenant.stores && tenant.stores.length > 0 ? (
                    tenant.stores.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{s.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              {s.currency || tenant.currency}
                            </span>
                          </div>
                          {s.address && (
                            <div className="text-slate-400 text-[11px] mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{s.address}</span>
                            </div>
                          )}
                          {s.ownerName && (
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              Responsable : <b className="text-slate-300">{s.ownerName}</b>
                            </div>
                          )}
                          <div className="text-slate-500 font-mono text-[10px] mt-1 truncate">
                            ID: {s.id}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-800/30 text-center text-slate-400 text-xs">
                      Aucun dépôt configuré.
                    </div>
                  )}
                </div>
              </div>

              {/* Users & Cashiers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Comptes Utilisateurs & Caissiers ({tenant.users?.length || 0})</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {tenant.users && tenant.users.length > 0 ? (
                    tenant.users.map((u) => (
                      <div
                        key={u.id}
                        className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{u.name}</span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                                u.role === "OWNER"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : u.role === "MANAGER"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-slate-700 text-slate-300"
                              }`}
                            >
                              {u.role}
                            </span>
                            {!u.isActive && (
                              <span className="text-[9px] text-rose-400 font-bold bg-rose-500/10 px-1.5 rounded">
                                Inactif
                              </span>
                            )}
                          </div>

                          <div className="text-slate-400 text-[11px] mt-1 flex items-center gap-3 flex-wrap">
                            {u.phone && <span>📞 {u.phone}</span>}
                            {u.email && <span>✉️ {u.email}</span>}
                          </div>

                          {u.lastLoginAt && (
                            <div className="text-slate-500 text-[10px] mt-1 font-mono">
                              Dernière connexion : {new Date(u.lastLoginAt).toLocaleDateString("fr-FR")} à{" "}
                              {new Date(u.lastLoginAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-800/30 text-center text-slate-400 text-xs">
                      Aucun utilisateur associé.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTIONS & PAYMENTS */}
          {activeTab === "SUBSCRIPTIONS" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Current Active Plan Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900 border border-slate-700/80 shadow-md space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-sm text-white">Formule d'Abonnement Actuelle</span>
                  </div>
                  <button
                    onClick={() => onChangePlan(tenant)}
                    className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all touch-press"
                  >
                    Changer de Forfait
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Plan Souscrit</span>
                    <span className="text-base font-black text-blue-400 uppercase tracking-wider">
                      {tenant.plan}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Statut de Facturation</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {tenant.planStatus || "ACTIF"}
                    </span>
                  </div>
                </div>

                {tenant.planExpiresAt && (
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Date d'échéance :</span>
                    <span className="font-bold text-white font-mono">
                      {new Date(tenant.planExpiresAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                )}
              </div>

              {/* Subscriptions History List */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Historique des Factures & Renouvellements</span>
                </h3>

                <div className="space-y-2">
                  {tenant.subscriptions && tenant.subscriptions.length > 0 ? (
                    tenant.subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>Formule {sub.plan}</span>
                            <span className="font-mono text-emerald-400 font-extrabold">
                              {sub.amount} {sub.currency}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Règlement : <b className="text-slate-300">{sub.paymentMethod}</b> •{" "}
                            <span>{new Date(sub.createdAt).toLocaleDateString("fr-FR")}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {sub.paymentStatus || "PAYÉ"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-800/30 text-center text-slate-400 text-xs">
                      Aucun historique de paiement pour le moment.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between gap-2.5">
          <button
            onClick={() => onToggleStatus(tenant)}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              tenant.isActive
                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            }`}
          >
            {tenant.isActive ? <Ban className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{tenant.isActive ? "Suspendre la Boutique" : "Activer la Boutique"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(tenant)}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Modifier</span>
            </button>
            <button
              onClick={() => onChangePlan(tenant)}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all touch-press"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Forfait</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
