"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  db,
  generateUUID,
  DEFAULT_TENANT_ID,
  DEFAULT_USER_ID,
  DEFAULT_STORE_ID,
  getOrCreateDefaultStore,
  enqueueSync,
  createStoreForTenant,
  assignManagerToStore,
} from "../db/dexie-db";
import type { User, Tenant, Store, UserRole, SubscriptionPlan, PlanConfig } from "../shared/types";
import { PLAN_CONFIGS } from "../shared/types";

export interface CreateStoreParams {
  name: string;
  address?: string;
  phone?: string;
  managerOption?: "existing" | "new" | "none";
  existingManagerId?: string;
  newManagerName?: string;
  newManagerPhone?: string;
  newManagerPin?: string;
}

export interface AssignManagerParams {
  storeId: string;
  managerOption: "existing" | "new" | "none";
  existingManagerId?: string;
  newManagerName?: string;
  newManagerPhone?: string;
  newManagerPin?: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  store: Store | null;
  stores: Store[];
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole;
  isOwner: boolean;
  isManager: boolean;
  isCashier: boolean;
  plan: SubscriptionPlan;
  planConfig: PlanConfig;
  canAccess: (feature: keyof PlanConfig) => boolean;
  selectStore: (storeId: string) => Promise<void>;
  createAdditionalStore: (params: CreateStoreParams) => Promise<Store>;
  assignStoreManager: (params: AssignManagerParams) => Promise<void>;
  login: (identifier: string, pinOrPass: string) => Promise<{ success: boolean; message: string }>;
  loginWithPin: (pinCode: string) => Promise<{ success: boolean; message: string }>;
  registerMerchant: (data: {
    storeName: string;
    ownerName: string;
    phone: string;
    countryCode?: string;
    currency?: string;
    pinCode?: string;
    plan?: SubscriptionPlan;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  lockTerminal: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  updateTenantPlan: (plan: SubscriptionPlan) => Promise<void>;
  cancelSubscription: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenant: null,
  store: null,
  stores: [],
  isAuthenticated: false,
  isLoading: true,
  role: "CASHIER",
  isOwner: false,
  isManager: false,
  isCashier: true,
  plan: "FREE",
  planConfig: PLAN_CONFIGS.FREE,
  canAccess: () => false,
  selectStore: async () => {},
  createAdditionalStore: async () => ({} as Store),
  assignStoreManager: async () => {},
  login: async () => ({ success: false, message: "" }),
  loginWithPin: async () => ({ success: false, message: "" }),
  registerMerchant: async () => ({ success: false, message: "" }),
  logout: () => {},
  lockTerminal: () => {},
  switchRole: async () => {},
  updateTenantPlan: async () => {},
  cancelSubscription: async () => ({ success: false, message: "" }),
});

const AUTH_USER_KEY = "micro_erp_auth_user_id";
const AUTH_TENANT_KEY = "micro_erp_auth_tenant_id";
const AUTH_STORE_KEY = "micro_erp_auth_store_id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadStores = useCallback(async (tenantId: string) => {
    try {
      const allStores = await db.stores.where("tenantId").equals(tenantId).toArray();
      setStores(allStores);
    } catch (e) {
      console.error("Failed to load stores:", e);
    }
  }, []);

  // Initialize session on mount - checks if a user session was explicitly saved
  useEffect(() => {
    (async () => {
      try {
        const savedUserId = typeof window !== "undefined" ? localStorage.getItem(AUTH_USER_KEY) : null;
        const savedTenantId = typeof window !== "undefined" ? localStorage.getItem(AUTH_TENANT_KEY) : null;
        const savedStoreId = typeof window !== "undefined" ? localStorage.getItem(AUTH_STORE_KEY) : null;

        if (savedUserId && savedTenantId) {
          const u = await db.users.get(savedUserId);
          const t = await db.tenants.get(savedTenantId);
          const s = savedStoreId ? await db.stores.get(savedStoreId) : await db.stores.where("tenantId").equals(savedTenantId).first();

          if (u && t && u.isActive) {
            setUser(u);
            setTenant(t);
            setStore(s || null);
            await loadStores(t.id);
            setIsLoading(false);
            return;
          }
        }

        setUser(null);
        setTenant(null);
        setStore(null);
        setStores([]);
      } catch (err) {
        console.error("Failed to initialize auth session:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadStores]);

  const loginWithPin = async (pinCode: string): Promise<{ success: boolean; message: string }> => {
    try {
      const foundUser = await db.users.where("pinCode").equals(pinCode).first();
      if (!foundUser) {
        return { success: false, message: "Code PIN incorrect" };
      }
      if (!foundUser.isActive) {
        return { success: false, message: "Ce compte utilisateur est désactivé" };
      }

      const foundTenant = await db.tenants.get(foundUser.tenantId);
      if (!foundTenant) {
        return { success: false, message: "Organisation introuvable" };
      }

      const foundStore = await db.stores.where("tenantId").equals(foundTenant.id).first();

      setUser(foundUser);
      setTenant(foundTenant);
      setStore(foundStore || null);
      await loadStores(foundTenant.id);

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_USER_KEY, foundUser.id);
        localStorage.setItem(AUTH_TENANT_KEY, foundTenant.id);
        if (foundStore) localStorage.setItem(AUTH_STORE_KEY, foundStore.id);
      }

      return { success: true, message: `Bienvenue, ${foundUser.name}` };
    } catch (e: any) {
      return { success: false, message: e.message || "Erreur de connexion" };
    }
  };

  const login = async (identifier: string, pinOrPass: string): Promise<{ success: boolean; message: string }> => {
    try {
      const trimmed = identifier.trim();
      const foundUser = await db.users
        .filter(
          (u) =>
            u.phone === trimmed ||
            u.email?.toLowerCase() === trimmed.toLowerCase() ||
            u.name.toLowerCase().includes(trimmed.toLowerCase())
        )
        .first();

      if (!foundUser) {
        return loginWithPin(pinOrPass);
      }

      if (foundUser.pinCode && foundUser.pinCode !== pinOrPass) {
        return { success: false, message: "Code PIN ou mot de passe invalide" };
      }

      const foundTenant = await db.tenants.get(foundUser.tenantId);
      const foundStore = foundTenant ? await db.stores.where("tenantId").equals(foundTenant.id).first() : null;

      setUser(foundUser);
      if (foundTenant) setTenant(foundTenant);
      setStore(foundStore || null);
      if (foundTenant) await loadStores(foundTenant.id);

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_USER_KEY, foundUser.id);
        if (foundTenant) localStorage.setItem(AUTH_TENANT_KEY, foundTenant.id);
        if (foundStore) localStorage.setItem(AUTH_STORE_KEY, foundStore.id);
      }

      return { success: true, message: `Connexion réussie : ${foundUser.name}` };
    } catch (e: any) {
      return { success: false, message: e.message || "Erreur de connexion" };
    }
  };

  const registerMerchant = async (data: {
    storeName: string;
    ownerName: string;
    phone: string;
    countryCode?: string;
    currency?: string;
    pinCode?: string;
    plan?: SubscriptionPlan;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const now = new Date().toISOString();
      const tenantId = generateUUID();
      const storeId = generateUUID();
      const userId = generateUUID();

      const newTenant: Tenant = {
        id: tenantId,
        name: data.storeName.trim(),
        slug: data.storeName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        phone: data.phone.trim(),
        countryCode: data.countryCode || "CD",
        currency: data.currency || "CDF",
        plan: data.plan || "PRO",
        planStatus: "ACTIVE",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const newStore: Store = {
        id: storeId,
        tenantId,
        name: data.storeName.trim(),
        currency: data.currency || "CDF",
        phone: data.phone.trim(),
        ownerName: data.ownerName.trim(),
        createdAt: now,
        updatedAt: now,
      };

      const newUser: User = {
        id: userId,
        tenantId,
        name: data.ownerName.trim(),
        phone: data.phone.trim(),
        pinCode: data.pinCode || "1234",
        role: "OWNER",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await db.tenants.add(newTenant);
      await db.stores.add(newStore);
      await db.users.add(newUser);

      const cashierUser: User = {
        id: generateUUID(),
        tenantId,
        name: "Caissier (Principal)",
        pinCode: "0000",
        role: "CASHIER",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      await db.users.add(cashierUser);

      await enqueueSync({
        tenantId,
        storeId,
        entity: "tenant",
        action: "CREATE",
        payload: JSON.stringify(newTenant),
      });

      setUser(newUser);
      setTenant(newTenant);
      setStore(newStore);
      setStores([newStore]);

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_USER_KEY, userId);
        localStorage.setItem(AUTH_TENANT_KEY, tenantId);
        localStorage.setItem(AUTH_STORE_KEY, storeId);
      }

      return { success: true, message: `Boutique "${data.storeName}" créée avec succès !` };
    } catch (e: any) {
      return { success: false, message: e.message || "Erreur lors de la création du compte marchand" };
    }
  };

  const selectStore = async (storeId: string) => {
    const s = await db.stores.get(storeId);
    if (s) {
      setStore(s);
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_STORE_KEY, storeId);
      }
    }
  };

  const createAdditionalStore = async (params: CreateStoreParams): Promise<Store> => {
    if (!tenant) throw new Error("Organisation introuvable");
    const currentPlanConfig = PLAN_CONFIGS[tenant.plan || "FREE"];
    if (stores.length >= currentPlanConfig.maxStores) {
      throw new Error(`Limite de magasins atteinte pour le forfait ${currentPlanConfig.name} (Max: ${currentPlanConfig.maxStores}).`);
    }

    const now = new Date().toISOString();
    let assignedManagerId: string | undefined;
    let assignedManagerName: string | undefined;
    let assignedManagerPhone: string | undefined;

    if (params.managerOption === "new" && params.newManagerName?.trim()) {
      const newUserId = generateUUID();
      const newManager: User = {
        id: newUserId,
        tenantId: tenant.id,
        name: params.newManagerName.trim(),
        phone: params.newManagerPhone?.trim() || undefined,
        pinCode: params.newManagerPin?.trim() || "1234",
        role: "MANAGER",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      await db.users.add(newManager);

      await enqueueSync({
        tenantId: tenant.id,
        storeId: DEFAULT_STORE_ID,
        entity: "user",
        action: "CREATE",
        payload: JSON.stringify(newManager),
      });

      assignedManagerId = newUserId;
      assignedManagerName = newManager.name;
      assignedManagerPhone = newManager.phone;
    } else if (params.managerOption === "existing" && params.existingManagerId) {
      const existing = await db.users.get(params.existingManagerId);
      if (existing) {
        assignedManagerId = existing.id;
        assignedManagerName = existing.name;
        assignedManagerPhone = existing.phone;
      }
    }

    const created = await createStoreForTenant({
      tenantId: tenant.id,
      name: params.name,
      address: params.address,
      phone: params.phone,
      currency: tenant.currency,
      ownerName: user?.name,
      managerId: assignedManagerId,
      managerName: assignedManagerName,
      managerPhone: assignedManagerPhone,
    });

    // Update user storeId if new manager was created or existing chosen
    if (assignedManagerId) {
      const u = await db.users.get(assignedManagerId);
      if (u) {
        const updatedUser = { ...u, storeId: created.id, updatedAt: now };
        await db.users.put(updatedUser);
      }
    }

    await loadStores(tenant.id);
    return created;
  };

  const assignStoreManager = async (params: AssignManagerParams): Promise<void> => {
    if (!tenant) throw new Error("Organisation introuvable");
    const targetStore = await db.stores.get(params.storeId);
    if (!targetStore) throw new Error("Magasin introuvable");

    const now = new Date().toISOString();
    let assignedManagerId: string | undefined;
    let assignedManagerName: string | undefined;
    let assignedManagerPhone: string | undefined;

    if (params.managerOption === "new" && params.newManagerName?.trim()) {
      const newUserId = generateUUID();
      const newManager: User = {
        id: newUserId,
        tenantId: tenant.id,
        storeId: targetStore.id,
        name: params.newManagerName.trim(),
        phone: params.newManagerPhone?.trim() || undefined,
        pinCode: params.newManagerPin?.trim() || "1234",
        role: "MANAGER",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      await db.users.add(newManager);

      await enqueueSync({
        tenantId: tenant.id,
        storeId: targetStore.id,
        entity: "user",
        action: "CREATE",
        payload: JSON.stringify(newManager),
      });

      assignedManagerId = newUserId;
      assignedManagerName = newManager.name;
      assignedManagerPhone = newManager.phone;
    } else if (params.managerOption === "existing" && params.existingManagerId) {
      const existing = await db.users.get(params.existingManagerId);
      if (existing) {
        assignedManagerId = existing.id;
        assignedManagerName = existing.name;
        assignedManagerPhone = existing.phone;

        await db.users.update(existing.id, {
          storeId: targetStore.id,
          updatedAt: now,
        });
      }
    }

    await assignManagerToStore(params.storeId, {
      managerId: assignedManagerId,
      managerName: assignedManagerName,
      managerPhone: assignedManagerPhone,
    });

    await loadStores(tenant.id);
    if (store && store.id === params.storeId) {
      const updated = await db.stores.get(params.storeId);
      if (updated) setStore(updated);
    }
  };

  const lockTerminal = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_USER_KEY);
    }
    setUser(null);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TENANT_KEY);
      localStorage.removeItem(AUTH_STORE_KEY);
    }
    setUser(null);
    setTenant(null);
    setStore(null);
    setStores([]);
  };

  const switchRole = async (newRole: UserRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole, updatedAt: new Date().toISOString() };
    await db.users.put(updated);
    setUser(updated);
  };

  const updateTenantPlan = async (newPlan: SubscriptionPlan) => {
    if (!tenant) return;
    const updated = { ...tenant, plan: newPlan, updatedAt: new Date().toISOString() };
    await db.tenants.put(updated);
    setTenant(updated);

    await enqueueSync({
      tenantId: tenant.id,
      storeId: store?.id || DEFAULT_STORE_ID,
      entity: "tenant",
      action: "UPDATE",
      payload: JSON.stringify(updated),
    });
  };

  const cancelSubscription = async (): Promise<{ success: boolean; message: string }> => {
    if (!tenant) return { success: false, message: "Organisation introuvable" };
    try {
      const now = new Date().toISOString();
      const updated = {
        ...tenant,
        planStatus: "CANCELLED" as any,
        updatedAt: now,
      };
      await db.tenants.put(updated);
      setTenant(updated);

      // Call PawaPay cancel API
      await fetch("/api/v1/payments/pawapay/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id }),
      }).catch(() => {});

      await enqueueSync({
        tenantId: tenant.id,
        storeId: store?.id || DEFAULT_STORE_ID,
        entity: "tenant",
        action: "UPDATE",
        payload: JSON.stringify(updated),
      });

      return { success: true, message: "Abonnement résilié avec succès." };
    } catch (e: any) {
      return { success: false, message: e.message || "Erreur lors de l'annulation de l'abonnement" };
    }
  };

  const isAuthenticated = !!user;
  const role = user?.role || "CASHIER";
  const isOwner = role === "OWNER";
  const isManager = role === "MANAGER" || isOwner;
  const isCashier = role === "CASHIER";
  const plan: SubscriptionPlan = tenant?.plan || "FREE";
  const planConfig: PlanConfig = PLAN_CONFIGS[plan] || PLAN_CONFIGS.FREE;

  const canAccess = (feature: keyof PlanConfig): boolean => {
    const val = planConfig[feature];
    if (typeof val === "boolean") return val;
    return val !== 0;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        store,
        stores,
        isAuthenticated,
        isLoading,
        role,
        isOwner,
        isManager,
        isCashier,
        plan,
        planConfig,
        canAccess,
        selectStore,
        createAdditionalStore,
        assignStoreManager,
        login,
        loginWithPin,
        registerMerchant,
        logout,
        lockTerminal,
        switchRole,
        updateTenantPlan,
        cancelSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
