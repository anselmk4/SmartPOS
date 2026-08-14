"use client";

import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, generateUUID } from "@/lib/db/dexie-db";
import type { User, Tenant, UserRole } from "@/lib/shared/types";
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
} from "lucide-react";

export default function AdminUsersPage() {
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const tenants = useLiveQuery(() => db.tenants.toArray()) || [];

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [tenantFilter, setTenantFilter] = useState<string>("ALL");

  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formTenantId, setFormTenantId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("+243 ");
  const [formEmail, setFormEmail] = useState("");
  const [formPinCode, setFormPinCode] = useState("1234");
  const [formRole, setFormRole] = useState<UserRole>("CASHIER");

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

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

  const handleOpenPin = (u: User) => {
    setSelectedUser(u);
    setFormPinCode(u.pinCode || "1234");
    setIsPinModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
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

    const now = new Date().toISOString();
    const newUser: User = {
      id: generateUUID(),
      tenantId: formTenantId,
      name: formName.trim(),
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      pinCode: formPinCode.trim() || "1234",
      role: formRole,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await db.users.add(newUser);
    setIsAddUserModalOpen(false);
    showToast(`Utilisateur "${newUser.name}" ajouté avec succès dans la base.`);
  };

  const handleUpdatePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !formPinCode.trim()) return;

    await db.users.update(selectedUser.id, {
      pinCode: formPinCode.trim(),
      updatedAt: new Date().toISOString(),
    });

    setIsPinModalOpen(false);
    showToast(`Code PIN de "${selectedUser.name}" mis à jour : ${formPinCode}`);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !formName.trim()) return;

    await db.users.update(selectedUser.id, {
      name: formName.trim(),
      tenantId: formTenantId,
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      role: formRole,
      updatedAt: new Date().toISOString(),
    });

    setIsEditUserModalOpen(false);
    showToast(`Utilisateur "${formName}" mis à jour.`);
  };

  const handleToggleUserActive = async (u: User) => {
    const newStatus = !u.isActive;
    await db.users.update(u.id, {
      isActive: newStatus,
      updatedAt: new Date().toISOString(),
    });
    showToast(`Compte de "${u.name}" ${newStatus ? "activé" : "bloqué"}.`);
  };

  const handleDeleteUser = async (u: User) => {
    if (confirm(`Voulez-vous supprimer définitivement l'utilisateur "${u.name}" ?`)) {
      await db.users.delete(u.id);
      showToast(`Utilisateur "${u.name}" supprimé de la base.`);
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
            <UsersIcon className="w-3.5 h-3.5" />
            <span>Gestion des Utilisateurs & Caissiers</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Comptes & Permissions ({users.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Contrôle des codes PIN de caisse, affectation aux boutiques et gestion des rôles.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all touch-press"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Utilisateur</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 rounded-xl text-xs border border-slate-700 focus:outline-none focus:border-blue-500 text-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
          >
            <option value="ALL">Tous les rôles</option>
            <option value="OWNER">Propriétaire (Gérant)</option>
            <option value="MANAGER">Manager</option>
            <option value="CASHIER">Caissier</option>
          </select>

          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="p-2 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
          >
            <option value="ALL">Toutes les boutiques</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <UsersIcon className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-bold text-slate-400">Aucun utilisateur trouvé</p>
            <p className="text-xs mt-0.5">Modifiez vos critères de recherche ou créez un utilisateur.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Nom & Contact</th>
                  <th className="pb-3">Boutique Associée</th>
                  <th className="pb-3">Rôle</th>
                  <th className="pb-3">Code PIN Caisse</th>
                  <th className="pb-3">Dernière Connexion</th>
                  <th className="pb-3">Statut</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.map((u) => {
                  const userTenant = tenants.find((t) => t.id === u.tenantId);
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 font-bold text-white">
                        <div className="text-sm">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {u.phone || u.email || "Sans coordonnées"}
                        </div>
                      </td>

                      <td className="py-4 font-bold text-slate-300">
                        {userTenant ? (
                          <div className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>{userTenant.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Non assigné</span>
                        )}
                      </td>

                      <td className="py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            u.role === "OWNER"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/25"
                              : u.role === "MANAGER"
                              ? "bg-blue-500/15 text-blue-300 border-blue-500/25"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {u.role === "OWNER" ? "Gérant" : u.role === "MANAGER" ? "Manager" : "Caissier"}
                        </span>
                      </td>

                      <td className="py-4 font-mono font-black text-emerald-400 tracking-wider">
                        {u.pinCode ? `PIN : ${u.pinCode}` : "Non défini"}
                      </td>

                      <td className="py-4 font-mono text-slate-400">
                        {u.lastLoginAt ? (
                          <div>
                            <div>{new Date(u.lastLoginAt).toLocaleDateString("fr-FR")}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(u.lastLoginAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">Jamais</span>
                        )}
                      </td>

                      <td className="py-4">
                        <button
                          onClick={() => handleToggleUserActive(u)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            u.isActive
                              ? "bg-emerald-500/20 text-emerald-400 hover:bg-rose-500/20 hover:text-rose-400"
                              : "bg-rose-500/20 text-rose-400 hover:bg-emerald-500/20 hover:text-emerald-400"
                          }`}
                        >
                          {u.isActive ? "✓ Actif" : "✕ Bloqué"}
                        </button>
                      </td>

                      <td className="py-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenPin(u)}
                          className="py-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-[10px] border border-emerald-500/20"
                          title="Modifier le code PIN à 4 chiffres"
                        >
                          Modifier PIN
                        </button>

                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Modifier les infos"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Supprimer"
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

      {/* MODAL: Add User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUserSubmit}
            className="bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-800 text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Créer un Nouvel Utilisateur</h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Boutique de Rattachement *
              </label>
              <select
                value={formTenantId}
                onChange={(e) => setFormTenantId(e.target.value)}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    🏬 {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                required
                placeholder="ex: David Mulamba"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-xs border border-slate-700 text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  placeholder="+243 81..."
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Rôle
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
                >
                  <option value="CASHIER">Caissier</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Gérant / Propriétaire</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Code PIN Caisse (4 chiffres) *
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={formPinCode}
                onChange={(e) => setFormPinCode(e.target.value)}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-mono font-bold tracking-widest text-center border border-slate-700 text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
            >
              Enregistrer l'Utilisateur
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Reset PIN */}
      {isPinModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdatePinSubmit}
            className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-800 text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Modifier le Code PIN</h3>
                <p className="text-xs text-slate-400">{selectedUser.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Nouveau Code PIN à 4 Chiffres
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={formPinCode}
                onChange={(e) => setFormPinCode(e.target.value)}
                className="w-full p-3 bg-slate-800 rounded-2xl text-center font-mono font-black text-xl tracking-widest border border-slate-700 focus:outline-none text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
            >
              Sauvegarder le Nouveau Code PIN
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Edit User */}
      {isEditUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleEditUserSubmit}
            className="bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-800 text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Modifier Utilisateur</h3>
              <button
                type="button"
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-xs border border-slate-700 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Boutique Assignée
              </label>
              <select
                value={formTenantId}
                onChange={(e) => setFormTenantId(e.target.value)}
                className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    🏬 {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Rôle
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700 text-white focus:outline-none"
                >
                  <option value="CASHIER">Caissier</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Gérant / Propriétaire</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
            >
              Sauvegarder les Modifications
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
