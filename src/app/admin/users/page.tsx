"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { adminFetch } from "@/lib/admin/admin-api";
import type { UserRole } from "@/lib/shared/types";
import {
  Users as UsersIcon,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  KeyRound,
  Shield,
  Phone,
  Mail,
  Store,
  UserCheck,
  UserX,
  X,
  Lock,
  RefreshCw,
  AlertCircle,
  Database,
} from "lucide-react";

interface UserWithTenant {
  id: string;
  tenantId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  pinCode?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

interface SimpleTenant {
  id: string;
  name: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithTenant[]>([]);
  const [tenants, setTenants] = useState<SimpleTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [tenantFilter, setTenantFilter] = useState<string>("ALL");

  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithTenant | null>(null);

  // Form state
  const [formTenantId, setFormTenantId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("+243 ");
  const [formEmail, setFormEmail] = useState("");
  const [formPinCode, setFormPinCode] = useState("1234");
  const [formRole, setFormRole] = useState<UserRole>("CASHIER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const [usersRes, tenantsRes] = await Promise.all([
        adminFetch<UserWithTenant[]>("/api/v1/admin/users"),
        adminFetch<SimpleTenant[]>("/api/v1/admin/tenants"),
      ]);

      if (usersRes.success && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      } else {
        setError(usersRes.error || "Erreur lors du chargement des utilisateurs");
      }

      if (tenantsRes.success && Array.isArray(tenantsRes.data)) {
        setTenants(tenantsRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !searchQuery ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery)) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchTenant = tenantFilter === "ALL" || u.tenantId === tenantFilter;
      return matchSearch && matchRole && matchTenant;
    });
  }, [users, searchQuery, roleFilter, tenantFilter]);

  const handleOpenAdd = () => {
    if (tenants.length > 0) setFormTenantId(tenants[0].id);
    setFormName("");
    setFormPhone("+243 ");
    setFormEmail("");
    setFormPinCode("1234");
    setFormRole("CASHIER");
    setIsAddUserModalOpen(true);
  };

  const handleOpenPin = (u: UserWithTenant) => {
    setSelectedUser(u);
    setFormPinCode(u.pinCode || "1234");
    setIsPinModalOpen(true);
  };

  const handleOpenEdit = (u: UserWithTenant) => {
    setSelectedUser(u);
    setFormTenantId(u.tenantId);
    setFormName(u.name);
    setFormPhone(u.phone || "");
    setFormEmail(u.email || "");
    setFormRole(u.role);
    setIsEditUserModalOpen(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTenantId) return;

    setIsSubmitting(true);
    const res = await adminFetch("/api/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        tenantId: formTenantId,
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        pinCode: formPinCode.trim() || "1234",
        role: formRole,
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsAddUserModalOpen(false);
      showToast(`Utilisateur "${formName}" ajouté avec succès dans Supabase.`);
      loadData();
    } else {
      alert(res.error || "Erreur lors de la création");
    }
  };

  const handleUpdatePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !formPinCode.trim()) return;

    setIsSubmitting(true);
    const res = await adminFetch("/api/v1/admin/users", {
      method: "PUT",
      body: JSON.stringify({
        id: selectedUser.id,
        pinCode: formPinCode.trim(),
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsPinModalOpen(false);
      showToast(`Code PIN de "${selectedUser.name}" mis à jour dans Supabase.`);
      loadData();
    } else {
      alert(res.error || "Erreur lors de la mise à jour du code PIN");
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !formName.trim()) return;

    setIsSubmitting(true);
    const res = await adminFetch("/api/v1/admin/users", {
      method: "PUT",
      body: JSON.stringify({
        id: selectedUser.id,
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        role: formRole,
        tenantId: formTenantId,
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsEditUserModalOpen(false);
      showToast(`Utilisateur "${formName}" mis à jour dans Supabase.`);
      loadData();
    } else {
      alert(res.error || "Erreur lors de la mise à jour");
    }
  };

  const handleToggleUserStatus = async (u: UserWithTenant) => {
    const nextStatus = !u.isActive;
    const action = nextStatus ? "activer" : "désactiver";
    if (!confirm(`Voulez-vous ${action} l'utilisateur "${u.name}" dans Supabase ?`)) return;

    const res = await adminFetch("/api/v1/admin/users", {
      method: "PUT",
      body: JSON.stringify({
        id: u.id,
        isActive: nextStatus,
      }),
    });

    if (res.success) {
      showToast(`Utilisateur "${u.name}" ${nextStatus ? "activé" : "désactivé"}.`);
      loadData();
    } else {
      alert(res.error || "Erreur lors du changement de statut");
    }
  };

  const handleDeleteUser = async (u: UserWithTenant) => {
    if (!confirm(`Voulez-vous supprimer définitivement l'utilisateur "${u.name}" de Supabase ?`)) return;

    const res = await adminFetch(`/api/v1/admin/users?id=${u.id}`, {
      method: "DELETE",
    });

    if (res.success) {
      showToast(res.message || `Utilisateur "${u.name}" supprimé.`);
      loadData();
    } else {
      alert(res.error || "Erreur lors de la suppression");
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
            <span>Table `users` Supabase PostgreSQL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Gestion des Utilisateurs & Caissiers ({users.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervision des accès caisse, réinitialisation des codes PIN et attribution des rôles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsRefreshing(true);
              loadData();
            }}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all touch-press"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Utilisateur</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email..."
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
          {/* Boutique Filter */}
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Toutes les Boutiques</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tous les Rôles</option>
            <option value="OWNER">Gérant / Propriétaire</option>
            <option value="MANAGER">Superviseur / Manager</option>
            <option value="CASHIER">Caissier(ère)</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">Chargement des utilisateurs depuis Supabase...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="font-bold underline hover:text-white">
            Réessayer
          </button>
        </div>
      )}

      {/* Users Table / Cards */}
      {!isLoading && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-3.5">Utilisateur & Contact</th>
                  <th className="px-4 py-3.5">Boutique Rattachée</th>
                  <th className="px-4 py-3.5">Rôle</th>
                  <th className="px-4 py-3.5">Code PIN Caisse</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">{u.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          {u.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3" />
                              {u.phone}
                            </span>
                          )}
                          {u.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {u.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-200 block">
                          {u.tenant?.name || "Non affilié"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {u.tenantId}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${
                            u.role === "OWNER"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : u.role === "MANAGER"
                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {u.role === "OWNER"
                            ? "Propriétaire"
                            : u.role === "MANAGER"
                            ? "Superviseur"
                            : "Caissier"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                            {u.pinCode || "1234"}
                          </span>
                          <button
                            onClick={() => handleOpenPin(u)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Modifier le code PIN"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                            u.isActive
                              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                          }`}
                        >
                          {u.isActive ? "Actif" : "Désactivé"}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Modifier l'utilisateur"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Nouvel Utilisateur Caissier</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Boutique d'Affiliation *</label>
                <select
                  required
                  value={formTenantId}
                  onChange={(e) => setFormTenantId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nom Complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Jean Mukendi"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Rôle</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="CASHIER">Caissier(ère)</option>
                    <option value="MANAGER">Manager</option>
                    <option value="OWNER">Propriétaire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Email (optionnel)</label>
                <input
                  type="email"
                  placeholder="jean@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Code PIN de Connexion (4 chiffres) *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={formPinCode}
                  onChange={(e) => setFormPinCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest text-center focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg"
                >
                  {isSubmitting ? "Création..." : "Créer dans Supabase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update PIN */}
      {isPinModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Modifier le Code PIN</h3>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePinSubmit} className="space-y-3">
              <p className="text-xs text-slate-400">
                Nouveau code PIN de caisse pour <b className="text-white">{selectedUser.name}</b> :
              </p>

              <div>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  value={formPinCode}
                  onChange={(e) => setFormPinCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg text-white font-mono tracking-widest text-center focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg"
                >
                  {isSubmitting ? "Enregistrement..." : "Valider le PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {isEditUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Modifier {selectedUser.name}</h3>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Boutique d'Affiliation</label>
                <select
                  value={formTenantId}
                  onChange={(e) => setFormTenantId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-xs font-bold text-slate-300 block mb-1">Rôle</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="CASHIER">Caissier(ère)</option>
                    <option value="MANAGER">Manager</option>
                    <option value="OWNER">Propriétaire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
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
    </div>
  );
}
