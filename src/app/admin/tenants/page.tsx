"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, generateUUID, enqueueSync } from "@/lib/db/dexie-db";
import { useSync } from "@/lib/sync/sync-context";
import type { Tenant, Store, User, SubscriptionPlan } from "@/lib/shared/types";
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
  ExternalLink,
} from "lucide-react";

export default function AdminTenantsPage() {
  const { formatMoney } = useSync();

  // Reactive DB queries
  const tenants = useLiveQuery(() => db.tenants.toArray()) || [];
  const stores = useLiveQuery(() => db.stores.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Form State for new boutique
  const [formName, setFormName] = useState("");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formPhone, setFormPhone] = useState("+243 ");
  const [formCurrency, setFormCurrency] = useState("CDF");
  const [formPlan, setFormPlan] = useState<SubscriptionPlan>("PRO");
  const [formAddress, setFormAddress] = useState("");
  const [formPinCode, setFormPinCode] = useState("1234");

  // Plan change form state
  const [newPlanChoice, setNewPlanChoice] = useState<SubscriptionPlan>("PRO");

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

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

  // Actions
  const handleOpenAddModal = () => {
    setFormName("");
    setFormOwnerName("");
    setFormPhone("+243 ");
    setFormCurrency("CDF");
    setFormPlan("PRO");
    setFormAddress("");
    setFormPinCode("1234");
    setIsAddTenantModalOpen(true);
  };

  const handleOpenEditModal = (t: Tenant) => {
    setSelectedTenant(t);
    setFormName(t.name);
    setFormPhone(t.phone || "");
    setFormCurrency(t.currency);
    setFormPlan(t.plan);
    setIsEditTenantModalOpen(true);
  };

  const handleOpenChangePlanModal = (t: Tenant) => {
    setSelectedTenant(t);
    setNewPlanChoice(t.plan);
    setIsChangePlanModalOpen(true);
  };

  const handleCreateTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formOwnerName.trim()) return;

    const now = new Date();
    const tenantId = generateUUID();
    const storeId = generateUUID();
    const userId = generateUUID();

    const slug = formName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    const newTenant: Tenant = {
      id: tenantId,
      name: formName.trim(),
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      phone: formPhone.trim() || undefined,
      countryCode: "CD",
      currency: formCurrency,
      plan: formPlan,
      planStatus: "ACTIVE",
      planExpiresAt:
        formPlan === "FREE"
          ? undefined
          : new Date(now.getTime() + 30 * 86400000).toISOString(),
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const newStore: Store = {
      id: storeId,
      tenantId,
      name: formName.trim(),
      currency: formCurrency,
      phone: formPhone.trim() || undefined,
      address: formAddress.trim() || undefined,
      ownerName: formOwnerName.trim(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const newUser: User = {
      id: userId,
      tenantId,
      name: formOwnerName.trim(),
      phone: formPhone.trim() || undefined,
      pinCode: formPinCode.trim() || "1234",
      role: "OWNER",
      isActive: true,
      lastLoginAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await db.tenants.add(newTenant);
    await db.stores.add(newStore);
    await db.users.add(newUser);

    setIsAddTenantModalOpen(false);
    showToast(`Boutique "${newTenant.name}" créée avec succès dans la base !`);
  };

  const handleEditTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !formName.trim()) return;

    const now = new Date().toISOString();
    await db.tenants.update(selectedTenant.id, {
      name: formName.trim(),
      phone: formPhone.trim() || undefined,
      currency: formCurrency,
      plan: formPlan,
      updatedAt: now,
    });

    setIsEditTenantModalOpen(false);
    showToast(`Boutique "${formName}" mise à jour avec succès.`);
  };

  const handleChangePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    const now = new Date();
    await db.tenants.update(selectedTenant.id, {
      plan: newPlanChoice,
      planStatus: "ACTIVE",
      planExpiresAt:
        newPlanChoice === "FREE"
          ? undefined
          : new Date(now.getTime() + 30 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    });

    setIsChangePlanModalOpen(false);
    showToast(`Forfait de "${selectedTenant.name}" passé en ${newPlanChoice} !`);
  };

  const handleToggleActive = async (t: Tenant) => {
    const newActive = !t.isActive;
    await db.tenants.update(t.id, {
      isActive: newActive,
      updatedAt: new Date().toISOString(),
    });
    showToast(`Boutique "${t.name}" ${newActive ? "réactivée" : "suspendue"} en base.`);
  };

  const handleExtend30Days = async (t: Tenant) => {
    const currentExp = t.planExpiresAt ? new Date(t.planExpiresAt) : new Date();
    const newExp = new Date(currentExp.getTime() + 30 * 86400000).toISOString();

    await db.tenants.update(t.id, {
      planExpiresAt: newExp,
      planStatus: "ACTIVE",
      updatedAt: new Date().toISOString(),
    });

    showToast(`Abonnement de "${t.name}" prolongé jusqu'au ${new Date(newExp).toLocaleDateString("fr-FR")}.`);
  };

  const handleDeleteTenant = async (t: Tenant) => {
    if (confirm(`Voulez-vous vraiment supprimer définitivement la boutique "${t.name}" et ses données associées ?`)) {
      await db.tenants.delete(t.id);
      // Clean up stores & users associated with this tenant
      const tenantStores = await db.stores.filter((s) => s.tenantId === t.id).toArray();
      for (const s of tenantStores) await db.stores.delete(s.id);
      const tenantUsers = await db.users.filter((u) => u.tenantId === t.id).toArray();
      for (const u of tenantUsers) await db.users.delete(u.id);

      showToast(`Boutique "${t.name}" supprimée de la base.`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-blue-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-blue-200" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold mb-2">
            <StoreIcon className="w-3.5 h-3.5" />
            <span>Gestion Multi-Tenants RDC</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Boutiques & Commerces ({tenants.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Création, modification, changement de forfait et suspension des comptes boutiques.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all touch-press"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Boutique</span>
        </button>
      </div>

      {/* Filters & Controls */}
      <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom de boutique, téléphone ou slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 rounded-xl text-xs border border-slate-700 focus:outline-none focus:border-blue-500 text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="p-2 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
          >
            <option value="ALL">Tous les forfaits</option>
            <option value="FREE">Découverte (Gratuit)</option>
            <option value="PRO">Commerçant Pro</option>
            <option value="BUSINESS">Business Réseau</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actifs uniquement</option>
            <option value="SUSPENDED">Suspendus uniquement</option>
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm overflow-hidden">
        {filteredTenants.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <StoreIcon className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-bold text-slate-400">Aucune boutique trouvée</p>
            <p className="text-xs mt-0.5">Modifiez vos critères de recherche ou créez un nouveau commerce.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Commerce & Identifiant</th>
                  <th className="pb-3">Forfait</th>
                  <th className="pb-3">Devise</th>
                  <th className="pb-3">Points de Vente</th>
                  <th className="pb-3">Échéance Abonnement</th>
                  <th className="pb-3">Statut</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTenants.map((t) => {
                  const boutiqueStores = stores.filter((s) => s.tenantId === t.id);
                  const isExpiringSoon =
                    t.planExpiresAt &&
                    new Date(t.planExpiresAt).getTime() - Date.now() < 7 * 86400000;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 font-bold text-white">
                        <div className="text-sm">{t.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{t.phone || "Sans téléphone"}</span>
                          <span>•</span>
                          <span>{t.slug}</span>
                        </div>
                      </td>

                      <td className="py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            t.plan === "BUSINESS"
                              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                              : t.plan === "PRO"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {t.plan}
                        </span>
                      </td>

                      <td className="py-4 font-mono font-bold text-slate-400">
                        {t.currency}
                      </td>

                      <td className="py-4 font-mono text-slate-300">
                        {boutiqueStores.length} point(s)
                      </td>

                      <td className="py-4 font-mono">
                        {t.planExpiresAt ? (
                          <div className={isExpiringSoon ? "text-amber-400 font-bold" : "text-slate-300"}>
                            {new Date(t.planExpiresAt).toLocaleDateString("fr-FR")}
                            {isExpiringSoon && (
                              <span className="text-[10px] block text-amber-500">Exp. imminente</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">Illimité (Gratuit)</span>
                        )}
                      </td>

                      <td className="py-4">
                        <button
                          onClick={() => handleToggleActive(t)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            t.isActive
                              ? "bg-emerald-500/20 text-emerald-400 hover:bg-rose-500/20 hover:text-rose-400"
                              : "bg-rose-500/20 text-rose-400 hover:bg-emerald-500/20 hover:text-emerald-400"
                          }`}
                          title="Cliquer pour activer ou suspendre le compte"
                        >
                          {t.isActive ? "✓ En activité" : "✕ Suspendu"}
                        </button>
                      </td>

                      <td className="py-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleExtend30Days(t)}
                          className="py-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-[10px] border border-emerald-500/20"
                          title="Prolonger de 30 jours"
                        >
                          +30 Jours
                        </button>

                        <button
                          onClick={() => handleOpenChangePlanModal(t)}
                          className="py-1.5 px-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-[10px] border border-blue-500/30"
                        >
                          Changer Forfait
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteTenant(t)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Create New Tenant */}
      {isAddTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTenantSubmit}
            className="bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-800 text-white space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Créer une Nouvelle Boutique</h3>
              <button
                type="button"
                onClick={() => setIsAddTenantModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nom du Commerce / Boutique *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Superette Bravo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nom du Propriétaire / Gérant *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Jean-Marc Mbemba"
                  value={formOwnerName}
                  onChange={(e) => setFormOwnerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Téléphone WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+243 81 000 00 00"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Devise Monétaire
                </label>
                <select
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
                >
                  <option value="CDF">CDF - Franc Congolais</option>
                  <option value="USD">USD - Dollar Américain ($)</option>
                  <option value="XOF">XOF - Franc CFA (UEMOA)</option>
                  <option value="XAF">XAF - Franc CFA (CEMAC)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Forfait Initial
                </label>
                <select
                  value={formPlan}
                  onChange={(e) => setFormPlan(e.target.value as SubscriptionPlan)}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
                >
                  <option value="FREE">Découverte (Gratuit)</option>
                  <option value="PRO">Commerçant Pro (15 000 FC/m)</option>
                  <option value="BUSINESS">Business Réseau (45 000 FC/m)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Code PIN de caisse (4 chiffres)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={formPinCode}
                  onChange={(e) => setFormPinCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-mono font-bold tracking-widest border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Adresse physique du magasin
              </label>
              <input
                type="text"
                placeholder="ex: Croisement Av. Kasa-Vubu, Kinshasa"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-xs border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
            >
              Créer la Boutique & Initialiser le Compte
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Change Plan */}
      {isChangePlanModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleChangePlanSubmit}
            className="bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-800 text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                Modifier le Forfait : {selectedTenant.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsChangePlanModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {[
                { id: "FREE", name: "Découverte (Gratuit)", price: "0 FC / mois", desc: "1 Caisse • 100 ventes/mois • Pas de Cloud" },
                { id: "PRO", name: "Commerçant Pro", price: "15 000 FC / mois", desc: "Ventes illimitées • Relances WhatsApp • Marges nettes" },
                { id: "BUSINESS", name: "Business Multi-Magasins", price: "45 000 FC / mois", desc: "Multi-boutiques • Transferts • Export Excel" },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setNewPlanChoice(p.id as SubscriptionPlan)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    newPlanChoice === p.id
                      ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30"
                      : "border-slate-800 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>{p.name}</span>
                    <span className="text-blue-400">{p.price}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{p.desc}</p>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
            >
              Appliquer le Nouveau Forfait
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Edit Tenant */}
      {isEditTenantModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleEditTenantSubmit}
            className="bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-800 text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                Modifier Boutique : {selectedTenant.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditTenantModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nom du Commerce *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-xs border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Téléphone Boutique
              </label>
              <input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-xs border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Devise Monétaire
              </label>
              <select
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value)}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
              >
                <option value="CDF">CDF - Franc Congolais</option>
                <option value="USD">USD - Dollar Américain ($)</option>
                <option value="XOF">XOF - Franc CFA</option>
                <option value="XAF">XAF - Franc CFA</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
            >
              Enregistrer les Modifications
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
