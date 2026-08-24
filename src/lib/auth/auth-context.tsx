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
  terminalTenant: Tenant | null;
  terminalUsers: User[];
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
  loginStaffWithPin: (userId: string, pinCode: string) => Promise<{ success: boolean; message: string }>;
  unlinkTerminal: () => Promise<void>;
  registerMerchant: (data: {
    storeName: string;
    ownerName: string;
    phone: string;
    email?: string;
    businessType?: string;
    address?: string;
    countryCode?: string;
    currency?: string;
    pinCode?: string;
    plan?: SubscriptionPlan;
    captchaToken?: string;
    captchaAnswer?: string;
    honeypot?: string;
  }) => Promise<{
    success: boolean;
    message: string;
    requiresVerification?: boolean;
    verificationMethod?: string;
    simCode?: string;
    identifier?: string;
  }>;
  logout: () => void;
  lockTerminal: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  updateTenantPlan: (plan: SubscriptionPlan) => Promise<void>;
  cancelSubscription: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenant: null,
  terminalTenant: null,
  terminalUsers: [],
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
  loginStaffWithPin: async () => ({ success: false, message: "" }),
  unlinkTerminal: async () => {},
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
  const [terminalTenant, setTerminalTenant] = useState<Tenant | null>(null);
  const [terminalUsers, setTerminalUsers] = useState<User[]>([]);
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

  const loadTerminalState = useCallback(async (tenantId?: string) => {
    try {
      const tid = tenantId || (typeof window !== "undefined" ? localStorage.getItem(AUTH_TENANT_KEY) : null);
      if (!tid) {
        setTerminalTenant(null);
        setTerminalUsers([]);
        return;
      }
      const t = await db.tenants.get(tid);
      if (t) {
        setTerminalTenant(t);
        const users = await db.users.where("tenantId").equals(t.id).filter((u) => u.isActive).toArray();
        setTerminalUsers(users);
      } else {
        setTerminalTenant(null);
        setTerminalUsers([]);
      }
    } catch (e) {
      console.warn("[Auth] Failed to load terminal state:", e);
    }
  }, []);

  // Initialize session on mount - checks if a user session was explicitly saved
  useEffect(() => {
    (async () => {
      try {
        const savedUserId = typeof window !== "undefined" ? localStorage.getItem(AUTH_USER_KEY) : null;
        const savedTenantId = typeof window !== "undefined" ? localStorage.getItem(AUTH_TENANT_KEY) : null;
        const savedStoreId = typeof window !== "undefined" ? localStorage.getItem(AUTH_STORE_KEY) : null;

        if (savedTenantId) {
          await loadTerminalState(savedTenantId);
        }

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
  }, [loadStores, loadTerminalState]);

  const bootstrapCloudDataIntoDexie = async (cloudData: any) => {
    try {
      if (cloudData.tenant) {
        await db.tenants.put(cloudData.tenant);
      }
      if (cloudData.stores && Array.isArray(cloudData.stores)) {
        for (const s of cloudData.stores) {
          await db.stores.put(s);
        }
      }
      if (cloudData.users && Array.isArray(cloudData.users)) {
        for (const u of cloudData.users) {
          await db.users.put(u);
        }
      }
      if (cloudData.products && Array.isArray(cloudData.products)) {
        for (const p of cloudData.products) {
          await db.products.put({ ...p, isSynced: true });
        }
      }
      if (cloudData.customers && Array.isArray(cloudData.customers)) {
        for (const c of cloudData.customers) {
          await db.customers.put({ ...c, isSynced: true });
        }
      }
      if (cloudData.sales && Array.isArray(cloudData.sales)) {
        for (const s of cloudData.sales) {
          const { items, ...saleRecord } = s;
          await db.sales.put({ ...saleRecord, isSynced: true });
          if (items && Array.isArray(items)) {
            for (const it of items) {
              let resolvedName = it.productName;
              if ((!resolvedName || resolvedName === "Article" || resolvedName === "Produit synchronisé") && it.productId) {
                const prod = await db.products.get(it.productId);
                if (prod?.name) resolvedName = prod.name;
              }
              await db.saleItems.put({
                ...it,
                productName: resolvedName || it.productName || "Article",
              });
            }
          }
        }
      }
      if (cloudData.debtPayments && Array.isArray(cloudData.debtPayments)) {
        for (const dp of cloudData.debtPayments) {
          await db.debtPayments.put({ ...dp, isSynced: true });
        }
      }
      if (cloudData.expenses && Array.isArray(cloudData.expenses)) {
        for (const exp of cloudData.expenses) {
          await db.expenses.put({ ...exp, isSynced: true });
        }
      }
    } catch (hydrateErr) {
      console.warn("[Auth] Bootstrap into Dexie warning:", hydrateErr);
    }
  };

  const unlinkTerminal = async (): Promise<void> => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TENANT_KEY);
      localStorage.removeItem(AUTH_STORE_KEY);
    }
    setUser(null);
    setTenant(null);
    setTerminalTenant(null);
    setTerminalUsers([]);
    setStore(null);
    setStores([]);
  };

  const loginStaffWithPin = async (userId: string, pinCode: string): Promise<{ success: boolean; message: string }> => {
    try {
      const cleanPin = pinCode.trim();
      let targetUser = await db.users.get(userId);

      // Verify locally if available
      if (targetUser && targetUser.pinCode === cleanPin) {
        const t = await db.tenants.get(targetUser.tenantId);
        const s = await db.stores.where("tenantId").equals(targetUser.tenantId).first();

        setUser(targetUser);
        if (t) {
          setTenant(t);
          setTerminalTenant(t);
          await loadStores(t.id);
          await loadTerminalState(t.id);
        }
        setStore(s || null);

        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_USER_KEY, targetUser.id);
          if (t) localStorage.setItem(AUTH_TENANT_KEY, t.id);
          if (s) localStorage.setItem(AUTH_STORE_KEY, s.id);
        }

        return { success: true, message: `Bienvenue, ${targetUser.name}` };
      }

      // If failed locally or not loaded, query Cloud
      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const isNative = typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.());
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://globalpos.app";
          const apiUrl = isNative
            ? `${baseUrl}/api/v1/auth/login`
            : "/api/v1/auth/login";

          const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, pinCode: cleanPin }),
          });

          const cloudData = await res.json();
          if (res.ok && cloudData.success && cloudData.user) {
            await bootstrapCloudDataIntoDexie(cloudData);
            targetUser = cloudData.user;
            const t = cloudData.tenant;
            const s = cloudData.stores?.[0] || null;

            setUser(targetUser || null);
            if (t) {
              setTenant(t);
              setTerminalTenant(t);
              await loadStores(t.id);
              await loadTerminalState(t.id);
            }
            setStore(s);

            if (typeof window !== "undefined" && targetUser) {
              localStorage.setItem(AUTH_USER_KEY, targetUser.id);
              if (t) localStorage.setItem(AUTH_TENANT_KEY, t.id);
              if (s) localStorage.setItem(AUTH_STORE_KEY, s.id);
            }

            return { success: true, message: `Bienvenue, ${targetUser?.name || ""}` };
          } else {
            return { success: false, message: cloudData.error || "Code PIN incorrect" };
          }
        } catch (cloudErr) {
          console.warn("[Auth] Cloud staff pin login fallback:", cloudErr);
        }
      }

      return { success: false, message: "Code PIN incorrect pour ce compte" };
    } catch (e: any) {
      return { success: false, message: e.message || "Erreur de connexion" };
    }
  };

  const loginWithPin = async (pinCode: string): Promise<{ success: boolean; message: string }> => {
    // If terminal has users, try first user or reject blind guessing
    if (terminalUsers.length === 1) {
      return loginStaffWithPin(terminalUsers[0].id, pinCode);
    }
    return {
      success: false,
      message: "Veuillez sélectionner votre nom de caissier ou vous connecter avec votre identifiant Gérant.",
    };
  };

  const login = async (identifier: string, pinOrPass: string): Promise<{ success: boolean; message: string }> => {
    try {
      const trimmed = identifier.trim();

      // 1. Check local Dexie first
      let foundUser = await db.users
        .filter(
          (u) =>
            u.phone === trimmed ||
            u.phone?.replace(/\D/g, "") === trimmed.replace(/\D/g, "") ||
            u.email?.toLowerCase() === trimmed.toLowerCase() ||
            u.name.toLowerCase().includes(trimmed.toLowerCase())
        )
        .first();

      let foundTenant = foundUser ? await db.tenants.get(foundUser.tenantId) : null;
      let foundStore = foundTenant ? await db.stores.where("tenantId").equals(foundTenant.id).first() : null;

      // 2. If not found locally, authenticate against Cloud API (Supabase)
      let cloudErrorMsg: string | null = null;
      if ((!foundUser || (foundUser && foundUser.pinCode !== pinOrPass)) && typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const isNative = typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.());
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://globalpos.app";
          const apiUrl = isNative
            ? `${baseUrl}/api/v1/auth/login`
            : "/api/v1/auth/login";

          const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: trimmed, pinCode: pinOrPass }),
          });

          const cloudData = await res.json();
          if (res.ok && cloudData.success && cloudData.user) {
            await bootstrapCloudDataIntoDexie(cloudData);
            foundUser = cloudData.user;
            foundTenant = cloudData.tenant;
            foundStore = cloudData.stores?.[0] || null;
            if (cloudData.token && typeof window !== "undefined") {
              localStorage.setItem("kuettu_session_token", cloudData.token);
            }
          } else {
            cloudErrorMsg = cloudData.error || "Identifiants incorrects";
          }
        } catch (cloudErr) {
          console.warn("[Auth] Cloud login check:", cloudErr);
        }
      }

      if (!foundUser) {
        return {
          success: false,
          message: cloudErrorMsg || "Aucun compte trouvé avec ce numéro ou email. Vérifiez vos identifiants.",
        };
      }

      if (foundUser.pinCode && foundUser.pinCode !== pinOrPass) {
        return { success: false, message: "Code PIN incorrect" };
      }

      if (!foundTenant) {
        foundTenant = (await db.tenants.get(foundUser.tenantId)) || null;
      }
      if (!foundStore && foundTenant) {
        foundStore = (await db.stores.where("tenantId").equals(foundTenant.id).first()) || null;
      }

      setUser(foundUser);
      if (foundTenant) {
        setTenant(foundTenant);
        setTerminalTenant(foundTenant);
        await loadStores(foundTenant.id);
        await loadTerminalState(foundTenant.id);
      }
      setStore(foundStore || null);

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
    email?: string;
    businessType?: string;
    address?: string;
    countryCode?: string;
    currency?: string;
    pinCode?: string;
    plan?: SubscriptionPlan;
    captchaToken?: string;
    captchaAnswer?: string;
    honeypot?: string;
  }): Promise<{
    success: boolean;
    message: string;
    requiresVerification?: boolean;
    verificationMethod?: string;
    simCode?: string;
    identifier?: string;
  }> => {
    try {
      const now = new Date().toISOString();
      const tenantId = generateUUID();
      const storeId = generateUUID();
      const userId = generateUUID();

      const newTenant: Tenant = {
        id: tenantId,
        name: data.storeName.trim(),
        slug: data.storeName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        businessType: data.businessType?.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim().toLowerCase(),
        address: data.address?.trim(),
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
        businessType: data.businessType?.trim(),
        currency: data.currency || "CDF",
        phone: data.phone.trim(),
        email: data.email?.trim().toLowerCase(),
        address: data.address?.trim(),
        ownerName: data.ownerName.trim(),
        createdAt: now,
        updatedAt: now,
      };

      const newUser: User = {
        id: userId,
        tenantId,
        name: data.ownerName.trim(),
        phone: data.phone.trim(),
        email: data.email ? data.email.trim().toLowerCase() : undefined,
        pinCode: data.pinCode || "1234",
        role: "OWNER",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      let requiresVerification = true;
      let verificationMethod = "SMS";
      let simCode: string | undefined;
      let targetIdentifier = data.phone;
      let sessionToken: string | undefined;

      // 2. Direct Cloud Registration API call (so the account is immediately active across all devices)
      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const isNative = typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.());
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://globalpos.app";
          const apiUrl = isNative
            ? `${baseUrl}/api/v1/auth/register`
            : "/api/v1/auth/register";

          const regRes = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantId,
              storeId,
              userId,
              storeName: data.storeName,
              ownerName: data.ownerName,
              phone: data.phone,
              email: data.email,
              businessType: data.businessType,
              address: data.address,
              countryCode: data.countryCode,
              currency: data.currency,
              pinCode: data.pinCode,
              plan: data.plan,
              captchaToken: data.captchaToken,
              captchaAnswer: data.captchaAnswer,
              honeypot: data.honeypot,
            }),
          });

          const regData = await regRes.json();
          if (regData.success) {
            requiresVerification = Boolean(regData.requiresVerification);
            verificationMethod = regData.verificationMethod || "SMS";
            simCode = regData.otp?.simulatedCode;
            targetIdentifier = regData.otp?.identifier || data.phone;
            sessionToken = regData.token;
          }
        } catch (cloudRegErr) {
          console.warn("[Auth] Cloud register background fallback:", cloudRegErr);
        }
      }

      // Update Dexie user and tenant active status based on verification requirement
      if (requiresVerification) {
        newUser.isActive = false;
        newTenant.isActive = false;
      }

      // 1. Add locally to Dexie
      await db.tenants.put(newTenant);
      await db.stores.put(newStore);
      await db.users.put(newUser);

      const cashierUser: User = {
        id: generateUUID(),
        tenantId,
        name: "Caissier (Principal)",
        pinCode: "0000",
        role: "CASHIER",
        isActive: !requiresVerification,
        createdAt: now,
        updatedAt: now,
      };
      await db.users.put(cashierUser);

      await enqueueSync({
        tenantId,
        storeId,
        entity: "tenant",
        action: "CREATE",
        payload: JSON.stringify(newTenant),
      });

      if (!requiresVerification) {
        setUser(newUser);
        setTenant(newTenant);
        setStore(newStore);
        setStores([newStore]);

        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_USER_KEY, userId);
          localStorage.setItem(AUTH_TENANT_KEY, tenantId);
          localStorage.setItem(AUTH_STORE_KEY, storeId);
          if (sessionToken) {
            localStorage.setItem("kuettu_session_token", sessionToken);
          }
        }
      }

      return {
        success: true,
        requiresVerification,
        verificationMethod,
        simCode,
        identifier: targetIdentifier,
        message: requiresVerification
          ? `Code de confirmation envoyé par ${verificationMethod === "EMAIL" ? "e-mail" : "SMS"}`
          : `Boutique "${data.storeName}" créée avec succès !`,
      };
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
    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const updated: Tenant = {
      ...tenant,
      plan: newPlan,
      planStatus: "ACTIVE",
      planExpiresAt: newPlan === "FREE" ? undefined : periodEnd,
      updatedAt: now,
    };
    await db.tenants.put(updated);
    setTenant(updated);

    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        await fetch("/api/v1/billing/update-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: tenant.id,
            plan: newPlan,
            planStatus: "ACTIVE",
          }),
        });
      } catch (e) {
        console.warn("[Auth] Cloud plan update fallback:", e);
      }
    }

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
      const updated: Tenant = {
        ...tenant,
        plan: "FREE",
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
        terminalTenant,
        terminalUsers,
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
        loginStaffWithPin,
        unlinkTerminal,
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
