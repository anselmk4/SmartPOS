"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { syncEngine } from "./sync-engine";
import { db, DEFAULT_STORE_ID, DEFAULT_TENANT_ID, repairAndRestoreStandardProductPrices } from "../db/dexie-db";
import { countPendingSyncItems } from "./sync-queue";
import { useAuth } from "../auth/auth-context";
import type { Store } from "../shared/types";

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  callingCode: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "CD", name: "RDC (RD Congo)", flag: "🇨🇩", currency: "CDF", currencySymbol: "FC", callingCode: "+243" },
  { code: "CG", name: "Congo-Brazzaville", flag: "🇨🇬", currency: "XAF", currencySymbol: "FCFA", callingCode: "+242" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", currencySymbol: "FCFA", callingCode: "+225" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "XOF", currencySymbol: "FCFA", callingCode: "+221" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF", currencySymbol: "FCFA", callingCode: "+237" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", currency: "XAF", currencySymbol: "FCFA", callingCode: "+241" },
  { code: "GN", name: "Guinée (Conakry)", flag: "🇬🇳", currency: "GNF", currencySymbol: "FG", callingCode: "+224" },
  { code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF", currencySymbol: "FCFA", callingCode: "+223" },
  { code: "TG", name: "Togo", flag: "🇹🇬", currency: "XOF", currencySymbol: "FCFA", callingCode: "+228" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", currency: "XOF", currencySymbol: "FCFA", callingCode: "+229" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF", currencySymbol: "FCFA", callingCode: "+226" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", currency: "RWF", currencySymbol: "FRw", callingCode: "+250" },
  { code: "BI", name: "Burundi", flag: "🇧🇮", currency: "BIF", currencySymbol: "FBu", callingCode: "+257" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", currency: "KES", currencySymbol: "KSh", callingCode: "+254" },
  { code: "UG", name: "Ouganda", flag: "🇺🇬", currency: "UGX", currencySymbol: "USh", callingCode: "+256" },
  { code: "TZ", name: "Tanzanie", flag: "🇹🇿", currency: "TZS", currencySymbol: "TSh", callingCode: "+255" },
  { code: "US", name: "Dollar US ($)", flag: "🇺🇸", currency: "USD", currencySymbol: "$", callingCode: "+1" },
  { code: "FR", name: "France / Zone Euro (€)", flag: "🇪🇺", currency: "EUR", currencySymbol: "€", callingCode: "+33" },
];

import { convertCurrency, EXCHANGE_RATES, getPlanPriceInfo } from "../constants/plans";
export { convertCurrency, EXCHANGE_RATES, getPlanPriceInfo };

export const CURRENCY_SYMBOLS: Record<string, string> = {
  CDF: "FC",
  USD: "$",
  XOF: "FCFA",
  XAF: "FCFA",
  GNF: "FG",
  RWF: "FRw",
  BIF: "FBu",
  EUR: "€",
  KES: "KSh",
  TZS: "TSh",
  UGX: "USh",
};

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  store: Store | null;
  currency: string;
  rawCurrency: string;
  countryCode: string;
  formatMoney: (amount: number, overrideCurrency?: string) => string;
  convertAmount: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
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
  rawCurrency: "CDF",
  countryCode: "CD",
  formatMoney: (amt) => `${Math.round(amt || 0).toLocaleString("fr-FR")} FC`,
  convertAmount: (amt) => amt || 0,
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
    syncEngine.setActiveStoreId(activeStoreId);
  }, [activeStoreId]);

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
        try {
          await repairAndRestoreStandardProductPrices();
        } catch {}
        await updatePendingCount();
        const lastTime = localStorage.getItem("micro_erp_last_synced_time");
        if (lastTime) setLastSyncedAt(lastTime);
        // Check if > 10 minutes idle sync is needed on app load
        syncEngine.checkAndTriggerIdleSync(activeStoreId);
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

  const rawCurrency = store?.currency || tenant?.currency || "CDF";
  const countryCode = store?.countryCode || tenant?.countryCode || "CD";

  const currency = CURRENCY_SYMBOLS[rawCurrency] || rawCurrency;

  const formatMoney = useCallback(
    (amount: number, overrideCurrency?: string): string => {
      const val = amount || 0;
      const currCode = overrideCurrency || rawCurrency;
      const symbol = CURRENCY_SYMBOLS[currCode] || currCode;

      if (currCode === "USD" || symbol === "$") {
        return `$${val.toLocaleString("fr-FR", {
          minimumFractionDigits: val % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        })}`;
      }
      if (currCode === "EUR" || symbol === "€") {
        return `${val.toLocaleString("fr-FR", {
          minimumFractionDigits: val % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        })} €`;
      }

      const formatted = Math.round(val).toLocaleString("fr-FR");
      return `${formatted} ${symbol}`;
    },
    [rawCurrency]
  );

  const convertAmount = useCallback(
    (amount: number, fromCurrency?: string, toCurrency?: string): number => {
      const from = fromCurrency || rawCurrency;
      const to = toCurrency || rawCurrency;
      return convertCurrency(amount, from, to);
    },
    [rawCurrency]
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
        rawCurrency,
        countryCode,
        formatMoney,
        convertAmount,
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
