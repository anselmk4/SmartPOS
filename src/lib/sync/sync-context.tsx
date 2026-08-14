"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { syncEngine } from "./sync-engine";
import { db, DEFAULT_STORE_ID, DEFAULT_TENANT_ID } from "../db/dexie-db";
import { countPendingSyncItems } from "./sync-queue";
import { useAuth } from "../auth/auth-context";
import type { Store } from "../shared/types";

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  store: Store | null;
  currency: string;
  formatMoney: (amount: number) => string;
  syncNow: () => Promise<{ success: boolean; message: string }>;
  refreshStore: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  store: null,
  currency: "FC",
  formatMoney: (amt) => `${Math.round(amt || 0).toLocaleString("fr-FR")} FC`,
  syncNow: async () => ({ success: false, message: "" }),
  refreshStore: async () => {},
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { store: authStore, tenant } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(authStore || null);

  useEffect(() => {
    if (authStore) {
      setStore(authStore);
    }
  }, [authStore]);

  const activeStoreId = store?.id || DEFAULT_STORE_ID;

  const updatePendingCount = useCallback(async () => {
    try {
      const count = await countPendingSyncItems(activeStoreId);
      setPendingCount(count);
    } catch {
      // Ignored
    }
  }, [activeStoreId]);

  const refreshStore = useCallback(async () => {
    try {
      if (authStore) {
        const s = await db.stores.get(authStore.id);
        if (s) setStore(s);
      }
    } catch (e) {
      console.error("Failed to load store:", e);
    }
  }, [authStore]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        syncEngine.triggerSync(activeStoreId);
      };

      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      (async () => {
        await updatePendingCount();
        const lastTime = localStorage.getItem("micro_erp_last_synced_time");
        if (lastTime) setLastSyncedAt(lastTime);
      })();

      const unsubscribe = syncEngine.subscribe(() => {
        setIsSyncing(syncEngine.getIsSyncing());
        updatePendingCount();
        const lastTime = localStorage.getItem("micro_erp_last_synced_time");
        if (lastTime) setLastSyncedAt(lastTime);
      });

      syncEngine.startPeriodicSync(30000);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        unsubscribe();
        syncEngine.stopPeriodicSync();
      };
    }
  }, [activeStoreId, updatePendingCount]);

  const syncNow = async () => {
    setIsSyncing(true);
    const res = await syncEngine.triggerSync(activeStoreId);
    await updatePendingCount();
    setIsSyncing(false);
    return res;
  };

  const rawCurrency = tenant?.currency || store?.currency || "CDF";
  const currency =
    rawCurrency === "CDF"
      ? "FC"
      : rawCurrency === "USD"
      ? "$"
      : rawCurrency === "XOF" || rawCurrency === "XAF"
      ? "FCFA"
      : rawCurrency;

  const formatMoney = useCallback(
    (amount: number): string => {
      const val = amount || 0;
      if (currency === "$") {
        return `$${val.toLocaleString("fr-FR", { minimumFractionDigits: val % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
      }
      const formatted = Math.round(val).toLocaleString("fr-FR");
      return `${formatted} ${currency}`;
    },
    [currency]
  );

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncedAt,
        store,
        currency,
        formatMoney,
        syncNow,
        refreshStore,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
