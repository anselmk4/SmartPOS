"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, generateUUID, DEFAULT_STORE_ID, updateStaffUser, deleteStaffUser } from "@/lib/db/dexie-db";
import { useAuth } from "@/lib/auth/auth-context";
import { useSync } from "@/lib/sync/sync-context";
import { PinLockScreen } from "@/components/auth/pin-lock-screen";
import { UpgradePromptModal } from "@/components/plans/upgrade-prompt-modal";
import type { User, UserRole, Store } from "@/lib/shared/types";
import {
  ShieldAlert,
  Users,
  Smartphone,
  TrendingUp,
  CreditCard,
  BookOpen,
  DollarSign,
  UserPlus,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Eye,
  Crown,
  LockKeyhole,
  Building,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  X,
} from "lucide-react";

export default function OwnerSupervisionPage() {
  const {
    tenant,
    user,
    store: authStore,
    stores,
    role,
    switchRole,
    isAuthenticated,
    isOwner,
    isLoading,
    plan,
    canAccess,
    createAdditionalStore,
    assignStoreManager,
    selectStore,
  } = useAuth();
  const { formatMoney } = useSync();

  const currentStoreId = authStore?.id || DEFAULT_STORE_ID;
  const currentTenantId = tenant?.id;

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editUserPin, setEditUserPin] = useState("0000");
  const [editUserRole, setEditUserRole] = useState<UserRole>("CASHIER");
  const [editUserStoreId, setEditUserStoreId] = useState("");

  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [isAssignManagerModalOpen, setIsAssignManagerModalOpen] = useState(false);
  const [selectedStoreForManager, setSelectedStoreForManager] = useState<Store | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Add User Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPin, setNewUserPin] = useState("0000");
  const [newUserRole, setNewUserRole] = useState<UserRole>("CASHIER");
  const [newUserStoreId, setNewUserStoreId] = useState("");

  // Add Store Form State with Manager
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");
  const [newStorePhone, setNewStorePhone] = useState("");
  const [newStoreManagerOption, setNewStoreManagerOption] = useState<"new" | "existing" | "none">("new");
  const [newStoreManagerName, setNewStoreManagerName] = useState("");
  const [newStoreManagerPhone, setNewStoreManagerPhone] = useState("");
  const [newStoreManagerPin, setNewStoreManagerPin] = useState("1234");
  const [newStoreExistingManagerId, setNewStoreExistingManagerId] = useState("");

  // Assign Manager Form State
  const [assignManagerOption, setAssignManagerOption] = useState<"existing" | "new">("existing");
  const [assignExistingUserId, setAssignExistingUserId] = useState("");
  const [assignNewName, setAssignNewName] = useState("");
  const [assignNewPhone, setAssignNewPhone] = useState("");
  const [assignNewPin, setAssignNewPin] = useState("1234");

  const users = useLiveQuery(async () => {
    if (!currentTenantId) return [];
    return await db.users.filter((u) => u.tenantId === currentTenantId || !u.tenantId).toArray();
  }, [currentTenantId]) || [];

  const allProducts = useLiveQuery(() => db.products.toArray()) || [];
  const allSales = useLiveQuery(() => db.sales.toArray()) || [];

  // Scoped strictly to active store
  const sales = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.sales
      .filter((s) => s.storeId === currentStoreId)
      .reverse()
      .sortBy("createdAt");
  }, [currentStoreId]) || [];

  const saleItems = useLiveQuery(() => db.saleItems.toArray()) || [];

  const customers = useLiveQuery(async () => {
    if (!currentStoreId) return [];
    return await db.customers
      .filter((c) => c.storeId === currentStoreId)
      .toArray();
  }, [currentStoreId]) || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Chargement de l'espace gérant...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen title="Espace Propriétaire Verrouillé" />;
  }

  // Locked for FREE plan users
  if (plan === "FREE") {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-100">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center border border-slate-200 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8" />
          </div>

          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Forfait Commerçant Pro & Business
          </span>

          <h3 className="font-black text-slate-900 text-2xl mt-3 mb-2">
            Supervision Gérant à Distance
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
            Suivez depuis votre smartphone le montant réel d'espèces dans le tiroir-caisse, les flux Mobile Money en direct, et créez des accès caissiers avec code PIN distinct.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2 mb-6 text-xs text-slate-700">
            <div className="flex items-center gap-2">✓ Suivi du tiroir-caisse et des encaissements journaliers</div>
            <div className="flex items-center gap-2">✓ Marges bénéficiaires et radar financier en temps réel</div>
            <div className="flex items-center gap-2">✓ Gestion des employés & codes PIN sans accès aux prix d'achat</div>
            <div className="flex items-center gap-2">✓ Ventes et caisse illimitées</div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/pos"
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
            >
              Retour à la Caisse
            </Link>
            <Link
              href="/billing"
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20"
            >
              Débloquer avec Pro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-100">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center border border-slate-200 shadow-lg">
          <LockKeyhole className="w-12 h-12 text-rose-500 mx-auto mb-2" />
          <h3 className="font-extrabold text-slate-900 text-lg">Accès Restreint</h3>
          <p className="text-xs text-slate-500 mt-1">
            Cet écran est réservé au Propriétaire / Gérant du commerce. Votre compte actuel est configuré en rôle Caissier.
          </p>
          <div className="mt-4 flex gap-2 justify-center">
            <Link
              href="/pos"
              className="py-2 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Aller à la Caisse
            </Link>
            <button
              onClick={() => switchRole("OWNER")}
              className="py-2 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
            >
              Simuler rôle Gérant
            </button>
          </div>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr));

  const todayTotalRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const todayCashInRegister = todaySales
    .filter((s) => s.paymentMethod === "CASH")
    .reduce((sum, s) => sum + s.amountPaid, 0);
  const todayMobileMoney = todaySales
    .filter((s) => s.paymentMethod !== "CASH" && s.paymentMethod !== "CREDIT")
    .reduce((sum, s) => sum + s.amountPaid, 0);
  const todayDebtsGiven = todaySales.reduce((sum, s) => sum + s.debtAmount, 0);

  const todayGrossProfit = (() => {
    const todayIds = new Set(todaySales.map((s) => s.id));
    const items = saleItems.filter((it) => todayIds.has(it.saleId));
    return items.reduce((sum, it) => sum + (it.unitPrice - (it.costPrice || it.unitPrice * 0.8)) * it.quantity, 0);
  })();

  const totalDebtsOutstanding = customers.reduce(
    (sum, c) => sum + (c.currentDebtBalance > 0 ? c.currentDebtBalance : 0),
    0
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !tenant) return;

    const newUser: User = {
      id: generateUUID(),
      tenantId: tenant.id,
      storeId: newUserStoreId || currentStoreId,
      name: newUserName.trim(),
      phone: newUserPhone.trim() || undefined,
      pinCode: newUserPin.trim() || "0000",
      role: newUserRole,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.users.add(newUser);
    setNewUserName("");
    setNewUserPhone("");
    setNewUserPin("0000");
    setNewUserStoreId("");
    setIsAddUserModalOpen(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editUserName.trim()) return;

    try {
      await updateStaffUser(editingUser.id, {
        name: editUserName.trim(),
        phone: editUserPhone.trim() || undefined,
        pinCode: editUserPin.trim() || "0000",
        role: editUserRole,
        storeId: editUserStoreId || undefined,
      });

      setIsEditUserModalOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      alert("Erreur modification utilisateur : " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      alert("Vous ne pouvez pas supprimer votre propre compte actif.");
      return;
    }

    if (confirm("Voulez-vous vraiment supprimer cet utilisateur du personnel ?")) {
      await deleteStaffUser(userId);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    try {
      const newStore = await createAdditionalStore({
        name: newStoreName.trim(),
        address: newStoreAddress.trim() || undefined,
        phone: newStorePhone.trim() || undefined,
        managerOption: newStoreManagerOption,
        newManagerName: newStoreManagerOption === "new" ? newStoreManagerName : undefined,
        newManagerPhone: newStoreManagerOption === "new" ? newStoreManagerPhone : undefined,
        newManagerPin: newStoreManagerOption === "new" ? newStoreManagerPin : undefined,
        existingManagerId: newStoreManagerOption === "existing" ? newStoreExistingManagerId : undefined,
      });

      // Auto-switch to the newly created store with fresh isolated state
      await selectStore(newStore.id);

      setNewStoreName("");
      setNewStoreAddress("");
      setNewStorePhone("");
      setNewStoreManagerName("");
      setNewStoreManagerPhone("");
      setNewStoreManagerPin("1234");
      setNewStoreExistingManagerId("");
      setIsAddStoreModalOpen(false);
    } catch (err: any) {
      alert("Erreur création boutique : " + err.message);
    }
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreForManager) return;

    try {
      await assignStoreManager({
        storeId: selectedStoreForManager.id,
        managerOption: assignManagerOption,
        existingManagerId: assignManagerOption === "existing" ? assignExistingUserId : undefined,
        newManagerName: assignManagerOption === "new" ? assignNewName : undefined,
        newManagerPhone: assignManagerOption === "new" ? assignNewPhone : undefined,
        newManagerPin: assignManagerOption === "new" ? assignNewPin : undefined,
      });

      setIsAssignManagerModalOpen(false);
      setSelectedStoreForManager(null);
      setAssignNewName("");
      setAssignNewPhone("");
      setAssignNewPin("1234");
      setAssignExistingUserId("");
    } catch (err: any) {
      alert("Erreur attribution gérant : " + err.message);
    }
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" />
              <span>Espace Propriétaire SaaS ({plan})</span>
            </span>
            <span className="text-xs text-slate-400">Boutique : {authStore?.name || tenant?.name}</span>
          </div>
          <h2 className="text-2xl font-black">Supervision à Distance de la Boutique</h2>
          <p className="text-xs text-slate-300 mt-1">
            Suivez les ventes de vos caissiers, vos espèces et vos marges en direct depuis votre smartphone.
          </p>
        </div>

        {/* Demo Quick Role Switcher */}
        <div className="bg-white/10 backdrop-blur p-3 rounded-2xl border border-white/10 flex flex-col gap-1.5 shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
            Rôle Actif (Simulation) :
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => switchRole("OWNER")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                role === "OWNER"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              Propriétaire (Gérant)
            </button>
            <button
              onClick={() => switchRole("CASHIER")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                role === "CASHIER"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              Caissier (Encaissement)
            </button>
            <button
              onClick={() => switchRole("WAITER")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                role === "WAITER"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              Serveur(se) (Prise de commande)
            </button>
          </div>
        </div>
      </div>

      {/* Financial Radar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-blue-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Espèces en Caisse (Tiroir)
            </span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700">
            {formatMoney(todayCashInRegister)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">À récupérer ce soir</p>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
              Mobile Money (M-Pesa/Airtel/Orange/Afrimoney)
            </span>
            <Smartphone className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-700">
            {formatMoney(todayMobileMoney)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Encaissé sur les téléphones</p>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
              Marge Bénéficiaire (Jour)
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600">
            +{formatMoney(todayGrossProfit)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Bénéfice brut estimé</p>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-rose-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Crédits Accordés (Jour)
            </span>
            <BookOpen className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            {formatMoney(todayDebtsGiven)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Total dettes : {formatMoney(totalDebtsOutstanding)}</p>
        </div>
      </div>

      {/* Multi-Stores Management (Business Plan) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <span>Réseau de Magasins & Boutiques ({stores.length})</span>
              </h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                plan === "BUSINESS" ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-600"
              }`}>
                {plan === "BUSINESS" ? "Multi-Boutiques Actif" : "1 Boutique (Passez à Business)"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Gérez plusieurs points de vente ou dépôts sous le même compte avec consolidation du chiffre d'affaires
            </p>
          </div>

          <button
            onClick={() => {
              if (plan !== "BUSINESS") {
                setIsUpgradeModalOpen(true);
              } else {
                setIsAddStoreModalOpen(true);
              }
            }}
            className="py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 touch-press"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Boutique</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {stores.map((s) => {
            const isActive = s.id === authStore?.id;
            const storeProductsCount = allProducts.filter((p) => p.storeId === s.id).length;
            const storeTodaySales = allSales
              .filter((sal) => sal.storeId === s.id && sal.createdAt.startsWith(todayStr))
              .reduce((acc, it) => acc + it.totalAmount, 0);

            return (
              <div
                key={s.id}
                className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm"
                    : "bg-slate-50 hover:bg-white border-slate-200/80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>🏬</span>
                      <span>{s.name}</span>
                    </h4>
                    {isActive ? (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                        Boutique Active
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400">
                        {s.currency}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{s.address || "Kinshasa, RDC"}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.phone || "Sans téléphone direct"}</div>

                  {/* Assigned Manager Badge */}
                  <div className="mt-3 p-2.5 bg-white/90 rounded-xl border border-slate-200/80 text-xs">
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Gérant du Magasin
                    </div>
                    {s.managerName ? (
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span>👤</span>
                          <span>{s.managerName}</span>
                        </span>
                        {s.managerPhone && (
                          <span className="text-slate-500 font-mono text-[11px]">{s.managerPhone}</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-amber-600 font-semibold mt-1 flex items-center gap-1 text-[11px]">
                        <span>⚠️ Aucun gérant assigné</span>
                      </div>
                    )}
                  </div>

                  {/* Store Live Metrics */}
                  <div className="flex items-center justify-between text-xs text-slate-600 mt-2.5 px-1 font-medium">
                    <span>📦 {storeProductsCount} article{storeProductsCount > 1 ? "s" : ""}</span>
                    <span className="font-bold text-indigo-700">Ventes : {formatMoney(storeTodaySales)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60">
                  {!isActive && (
                    <button
                      onClick={() => selectStore(s.id)}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all touch-press flex items-center justify-center gap-1"
                    >
                      <span>Basculer ici</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedStoreForManager(s);
                      setAssignExistingUserId(s.managerId || "");
                      setAssignNewName("");
                      setAssignNewPhone("");
                      setIsAssignManagerModalOpen(true);
                    }}
                    className={`py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-white transition-all text-slate-700 ${
                      isActive ? "flex-1 text-center font-bold bg-white" : ""
                    }`}
                  >
                    👤 {s.managerName ? "Changer Gérant" : "Choisir Gérant"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Management (Cashiers & Managers) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Gestion du Personnel & Caissiers</span>
              </h3>
              {!canAccess("canCreateMultipleCashiers") && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Plan Payant
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Créez et gérez des accès caisse avec code PIN sécurisé sans visibilité sur vos marges d'achat
            </p>
          </div>

          <button
            onClick={() => {
              if (!canAccess("canCreateMultipleCashiers")) {
                setIsUpgradeModalOpen(true);
              } else {
                setIsAddUserModalOpen(true);
              }
            }}
            className="py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 touch-press"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Membre</span>
          </button>
        </div>

        {!canAccess("canCreateMultipleCashiers") ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">Débloquez la Gestion d'Équipe Multi-Caissiers</h4>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
              Créez des profils dédiés pour vos caissiers et gérants avec codes PIN 4 chiffres distincts pour chaque boutique.
            </p>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="mt-3 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20"
            >
              Passer au Forfait Pro / Business
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((u) => {
              const assignedStore = stores.find((st) => st.id === u.storeId || st.managerId === u.id);
              const isCurrentUser = u.id === user?.id;

              return (
                <div
                  key={u.id}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{u.name}</h4>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          u.role === "OWNER"
                            ? "bg-amber-100 text-amber-800"
                            : u.role === "MANAGER"
                            ? "bg-indigo-100 text-indigo-800"
                            : u.role === "WAITER"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {u.role === "OWNER"
                          ? "Propriétaire"
                          : u.role === "MANAGER"
                          ? "Gérant"
                          : u.role === "WAITER"
                          ? "Serveur(se)"
                          : "Caissier"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1">{u.phone || "Sans téléphone"}</div>

                    {assignedStore && (
                      <div className="text-[11px] font-medium text-indigo-700 mt-1 flex items-center gap-1">
                        <span>🏬 {assignedStore.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-2">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      <span>Code PIN : <b className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{u.pinCode || "0000"}</b></span>
                    </div>
                  </div>

                  {/* Actions for paid plans */}
                  <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setEditUserName(u.name);
                        setEditUserPhone(u.phone || "");
                        setEditUserPin(u.pinCode || "0000");
                        setEditUserRole(u.role);
                        setEditUserStoreId(u.storeId || currentStoreId);
                        setIsEditUserModalOpen(true);
                      }}
                      className="py-1 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Modifier</span>
                    </button>

                    {!isCurrentUser && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="py-1 px-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Supprimer</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Add User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Ajouter un Membre du Personnel</h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Nom complet de l'Employé / Gérant *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Fatou Bamba"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  placeholder="+243 81 11 22 33 44"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Rôle attribué
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                  >
                    <option value="WAITER">Serveur / Serveuse (Prise de commande & Table)</option>
                    <option value="CASHIER">Caissier (Encaissement)</option>
                    <option value="MANAGER">Gérant Magasin</option>
                    <option value="OWNER">Propriétaire</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Code PIN Caisse (4 chiffres)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="0000"
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-mono font-bold tracking-widest border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                  />
                </div>
              </div>

              {/* Store assignment */}
              {stores.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Boutique assignée
                  </label>
                  <select
                    value={newUserStoreId || currentStoreId}
                    onChange={(e) => setNewUserStoreId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-semibold border border-slate-200 focus:bg-white"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        🏬 {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
              >
                Créer l'accès
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Edit User */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateUser}
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Modifier le Membre du Personnel</h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Rôle
                  </label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white font-bold"
                  >
                    <option value="WAITER">Serveur / Serveuse</option>
                    <option value="CASHIER">Caissier</option>
                    <option value="MANAGER">Gérant</option>
                    <option value="OWNER">Propriétaire</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Code PIN Caisse
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={editUserPin}
                    onChange={(e) => setEditUserPin(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-mono font-bold tracking-widest border border-slate-200 focus:bg-white text-center"
                  />
                </div>
              </div>

              {/* Store assignment */}
              {stores.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Boutique assignée
                  </label>
                  <select
                    value={editUserStoreId}
                    onChange={(e) => setEditUserStoreId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-semibold border border-slate-200 focus:bg-white"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        🏬 {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
              >
                Enregistrer les Modifications
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Add Store (Business Multi-Magasins) with Manager Selection */}
      {isAddStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateStore}
            className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 my-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Ajouter un Nouveau Magasin / Dépôt</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStoreModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Nom du Point de Vente / Dépôt *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Dépôt Marché Central"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Adresse / Commune
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Av. du Commerce, Gombe"
                    value={newStoreAddress}
                    onChange={(e) => setNewStoreAddress(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Téléphone Magasin
                  </label>
                  <input
                    type="tel"
                    placeholder="+243 81 999 88 77"
                    value={newStorePhone}
                    onChange={(e) => setNewStorePhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Gérant Selection Section */}
              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <span>👤</span>
                    <span>Gérant de ce nouveau magasin</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-indigo-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewStoreManagerOption("new")}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all ${
                      newStoreManagerOption === "new"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Nouveau Gérant
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStoreManagerOption("existing")}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all ${
                      newStoreManagerOption === "existing"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Membre Existant
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStoreManagerOption("none")}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all ${
                      newStoreManagerOption === "none"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Plus tard
                  </button>
                </div>

                {newStoreManagerOption === "new" && (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Nom complet du gérant *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Patrick Lumbala"
                        value={newStoreManagerName}
                        onChange={(e) => setNewStoreManagerName(e.target.value)}
                        className="w-full p-2 bg-white rounded-xl text-xs border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          placeholder="+243 82 000 11 22"
                          value={newStoreManagerPhone}
                          onChange={(e) => setNewStoreManagerPhone(e.target.value)}
                          className="w-full p-2 bg-white rounded-xl text-xs border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          PIN Caisse (4 chiffres)
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="1234"
                          value={newStoreManagerPin}
                          onChange={(e) => setNewStoreManagerPin(e.target.value)}
                          className="w-full p-2 bg-white rounded-xl text-xs font-mono font-bold tracking-widest text-center border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {newStoreManagerOption === "existing" && (
                  <div className="pt-1">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Sélectionner l'utilisateur assigné comme gérant
                    </label>
                    <select
                      value={newStoreExistingManagerId}
                      onChange={(e) => setNewStoreExistingManagerId(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white rounded-xl text-xs font-medium border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Choisir un utilisateur --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === "OWNER" ? "Propriétaire" : u.role === "MANAGER" ? "Gérant" : "Caissier"}) - {u.phone || "Sans tél"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddStoreModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                Créer & Basculer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Assign / Change Store Manager */}
      {isAssignManagerModalOpen && selectedStoreForManager && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAssignManager}
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Assigner le Gérant</h3>
                  <p className="text-xs text-indigo-700 font-medium">Boutique : {selectedStoreForManager.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAssignManagerModalOpen(false);
                  setSelectedStoreForManager(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setAssignManagerOption("existing")}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    assignManagerOption === "existing"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Membre Existant
                </button>
                <button
                  type="button"
                  onClick={() => setAssignManagerOption("new")}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    assignManagerOption === "new"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Nouveau Gérant
                </button>
              </div>

              {assignManagerOption === "existing" ? (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Sélectionner parmi le personnel
                  </label>
                  <select
                    value={assignExistingUserId}
                    onChange={(e) => setAssignExistingUserId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-medium border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choisir un utilisateur --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === "OWNER" ? "Propriétaire" : u.role === "MANAGER" ? "Gérant" : "Caissier"}) - {u.phone || "Sans tél"}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Nom complet du nouveau gérant *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Jean-Paul Mutombo"
                      value={assignNewName}
                      onChange={(e) => setAssignNewName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        placeholder="+243 81 222 33 44"
                        value={assignNewPhone}
                        onChange={(e) => setAssignNewPhone(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">
                        Code PIN Caisse
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="1234"
                        value={assignNewPin}
                        onChange={(e) => setAssignNewPin(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-mono font-bold tracking-widest text-center border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAssignManagerModalOpen(false);
                  setSelectedStoreForManager(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UPGRADE PROMPT MODAL */}
      <UpgradePromptModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Gestion Multi-Boutiques & Multi-Caisses"
        description="Le module multi-magasins permet de gérer plusieurs points de vente et dépôts sous le même compte avec consolidation du chiffre d'affaires. Cette fonctionnalité est exclusive au forfait Business."
        targetPlan="BUSINESS"
        features={[
          "Multi-boutiques & Multi-caisses illimitées",
          "Transferts de stock inter-magasins",
          "Export comptable complet en Excel & PDF",
          "Support prioritaire WhatsApp dédié",
        ]}
      />
    </div>
  );
}
