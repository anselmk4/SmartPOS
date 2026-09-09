import { db, DEFAULT_STORE_ID, enqueueSync, registerSyncEnqueueListener } from "../db/dexie-db";
import { getPendingSyncItems, removeSyncedItems, updateQueueItemStatus } from "./sync-queue";
import type { SyncPushRequest, SyncPushResponse } from "../shared/types";

const LAST_PULLED_KEY = "micro_erp_last_pulled_at";
const MAX_IDLE_SYNC_MS = 2 * 60 * 1000; // 2 minutes maximum without syncing

export class SyncEngine {
  private isSyncing = false;
  private syncTimer: any = null;
  private debounceTimer: any = null;
  private listeners: Array<() => void> = [];
  private activeStoreId: string = DEFAULT_STORE_ID;

  constructor() {
    if (typeof window !== "undefined") {
      // 1. Auto-sync immediately when network connection is restored
      window.addEventListener("online", () => {
        console.log("[SyncEngine] 🌐 Connexion rétablie -> Synchronisation immédiate");
        this.triggerSync(this.activeStoreId);
      });

      // 2. Auto-sync on window focus / visibility change
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.triggerSync(this.activeStoreId);
        }
      });

      window.addEventListener("focus", () => {
        this.triggerSync(this.activeStoreId);
      });

      // 3. Register real-time sync listener on local mutations (articles, users, sales, etc.)
      registerSyncEnqueueListener((storeId) => {
        this.triggerDebouncedSync(storeId || this.activeStoreId, 300);
      });
    }
  }

  public setActiveStoreId(storeId: string) {
    this.activeStoreId = storeId;
  }

  public triggerDebouncedSync(storeId: string = this.activeStoreId, delayMs = 150) {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.triggerSync(storeId);
    }, delayMs);
  }

  /**
   * Heartbeat check: checks if idle sync is needed
   */
  public checkAndTriggerIdleSync(storeId: string = this.activeStoreId) {
    if (typeof window === "undefined" || !navigator.onLine || this.isSyncing) return;
    this.triggerSync(storeId);
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public startPeriodicSync(intervalMs = 4000) {
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (typeof window !== "undefined") {
      // Periodic background sync loop (default 4s for rapid multi-device updates):
      this.syncTimer = setInterval(async () => {
        if (navigator.onLine && !this.isSyncing) {
          this.triggerSync(this.activeStoreId);
        }
      }, intervalMs);
    }
  }

  public stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  public async triggerSync(storeId: string = this.activeStoreId): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: "Synchronisation déjà en cours" };
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { success: false, message: "Appareil hors-ligne" };
    }

    this.isSyncing = true;
    this.notify();

    try {
      // 1. Check if there are any un-synced items in Dexie tables, and ensure they are enqueued
      const unsyncedSales = await db.sales.filter((s) => !s.isSynced).toArray();
      for (const s of unsyncedSales) {
        const existingQueue = await db.syncQueue
          .filter((q) => q.entity === "sale" && q.status === "PENDING")
          .toArray();
        const alreadyInQueue = existingQueue.some((q) => {
          try {
            const p = JSON.parse(q.payload);
            return p.id === s.id;
          } catch {
            return false;
          }
        });

        if (!alreadyInQueue) {
          const items = await db.saleItems.where("saleId").equals(s.id).toArray();
          await enqueueSync({
            tenantId: s.tenantId,
            storeId: s.storeId || storeId,
            entity: "sale",
            action: "CREATE",
            payload: JSON.stringify({ ...s, items }),
          });
        }
      }

      const unsyncedProducts = await db.products.filter((p) => !p.isSynced).toArray();
      for (const p of unsyncedProducts) {
        const existingQueue = await db.syncQueue
          .filter((q) => q.entity === "product" && q.status === "PENDING")
          .toArray();
        const alreadyInQueue = existingQueue.some((q) => {
          try {
            const parsed = JSON.parse(q.payload);
            return parsed.id === p.id;
          } catch {
            return false;
          }
        });

        if (!alreadyInQueue) {
          await enqueueSync({
            tenantId: p.tenantId,
            storeId: p.storeId || storeId,
            entity: "product",
            action: "CREATE",
            payload: JSON.stringify(p),
          });
        }
      }

      const unsyncedCustomers = await db.customers.filter((c) => !c.isSynced).toArray();
      for (const c of unsyncedCustomers) {
        const existingQueue = await db.syncQueue
          .filter((q) => q.entity === "customer" && q.status === "PENDING")
          .toArray();
        const alreadyInQueue = existingQueue.some((q) => {
          try {
            const parsed = JSON.parse(q.payload);
            return parsed.id === c.id;
          } catch {
            return false;
          }
        });

        if (!alreadyInQueue) {
          await enqueueSync({
            tenantId: c.tenantId,
            storeId: c.storeId || storeId,
            entity: "customer",
            action: "CREATE",
            payload: JSON.stringify(c),
          });
        }
      }

      // Clean up any duplicate or exhausted pending items to keep the queue fast and clean
      const allQueueItems = await db.syncQueue.toArray();
      const seenPayloadKeys = new Set<string>();
      const idsToDelete: string[] = [];
      for (const item of allQueueItems) {
        if (item.retryCount >= 5) {
          idsToDelete.push(item.id);
          continue;
        }
        try {
          const parsed = JSON.parse(item.payload);
          const key = `${item.entity}:${item.action}:${parsed.id || item.id}`;
          if (seenPayloadKeys.has(key)) {
            idsToDelete.push(item.id);
          } else {
            seenPayloadKeys.add(key);
          }
        } catch {
          // ignore
        }
      }
      if (idsToDelete.length > 0) {
        await db.syncQueue.bulkDelete(idsToDelete);
      }

      // 2. Get pending mutations
      const pendingItems = await getPendingSyncItems(storeId, 200);
      const lastPulledAt = typeof window !== "undefined" ? localStorage.getItem(LAST_PULLED_KEY) || undefined : undefined;

      const mutations = pendingItems.map((item) => {
        let parsedData: any = {};
        try {
          parsedData = typeof item.payload === "string" ? JSON.parse(item.payload) : item.payload;
        } catch {
          parsedData = item.payload;
        }
        return {
          id: item.id,
          entity: item.entity,
          action: item.action,
          data: parsedData,
          clientTimestamp: item.createdAt,
        };
      });

      let tenantId = pendingItems[0]?.tenantId;
      if (!tenantId && storeId) {
        const localStore = await db.stores.get(storeId);
        if (localStore?.tenantId) {
          tenantId = localStore.tenantId;
        }
      }
      if (!tenantId && typeof window !== "undefined") {
        tenantId = localStorage.getItem("micro_erp_auth_tenant_id") || undefined;
      }

      const syncRequest: SyncPushRequest = {
        tenantId,
        storeId,
        lastPulledAt,
        mutations,
      };

      // 3. Call /api/v1/sync (resolves cloud server URL when running in native APK)
      const isNative = typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.());
      let apiUrl = "/api/v1/sync";
      if (isNative) {
        const customUrl = typeof window !== "undefined" ? localStorage.getItem("pos_custom_api_url") : null;
        const envUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (customUrl) {
          apiUrl = `${customUrl.replace(/\/+$/, "")}/api/v1/sync`;
        } else if (envUrl && !envUrl.includes("globalpos.app")) {
          apiUrl = `${envUrl.replace(/\/+$/, "")}/api/v1/sync`;
        } else if (typeof window !== "undefined" && window.location.origin && !window.location.origin.startsWith("capacitor:") && !window.location.origin.startsWith("http://localhost")) {
          apiUrl = `${window.location.origin}/api/v1/sync`;
        }
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("kuettu_session_token") || localStorage.getItem("kuettu_admin_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let response: Response;
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(syncRequest),
        });
      } catch (fetchErr: any) {
        const msg = fetchErr?.message || "";
        console.warn("[SyncEngine] Network reachability issue:", msg);
        this.isSyncing = false;
        this.notify();
        return {
          success: false,
          message: "Mode hors-ligne : Serveur distant temporairement injoignable. Vos données locales sont bien enregistrées et sécurisées.",
        };
      }

      if (!response.ok) {
        let errorDetail = `Erreur serveur (${response.status})`;
        try {
          const errBody = await response.json();
          if (errBody?.error) {
            errorDetail = `${errBody.error} (${response.status})`;
          }
        } catch {
          // ignore
        }
        throw new Error(errorDetail);
      }

      const syncResult: SyncPushResponse & { refreshedToken?: string } = await response.json();

      if (!syncResult.success) {
        throw new Error("Échec du traitement de synchronisation par le serveur");
      }

      // Auto-update refreshed session token in localStorage
      if (syncResult.refreshedToken && typeof window !== "undefined") {
        localStorage.setItem("kuettu_session_token", syncResult.refreshedToken);
      }

      // 4. Mark pushed mutations as synced & clean queue
      if (syncResult.syncedIds && syncResult.syncedIds.length > 0) {
        await removeSyncedItems(syncResult.syncedIds);

        // Also update local tables to mark items isSynced: true
        for (const mutation of mutations) {
          if (syncResult.syncedIds.includes(mutation.id)) {
            if (mutation.entity === "product" && mutation.data?.id) {
              await db.products.update(mutation.data.id, { isSynced: true }).catch(() => {});
            } else if (mutation.entity === "customer" && mutation.data?.id) {
              await db.customers.update(mutation.data.id, { isSynced: true }).catch(() => {});
            } else if (mutation.entity === "sale" && mutation.data?.id) {
              await db.sales.update(mutation.data.id, { isSynced: true }).catch(() => {});
            }
          }
        }
      }

      // 5. Handle failed items if any
      if (syncResult.failedIds && syncResult.failedIds.length > 0) {
        for (const f of syncResult.failedIds) {
          await updateQueueItemStatus(f.id, "FAILED", f.error);
        }
      }

      // 5. Apply server updates (Pull) to local IndexedDB
      if (syncResult.updates) {
        const { products, customers, sales, debtPayments, tenant: cloudTenant, stores: cloudStores, users: cloudUsers } = syncResult.updates as any;

        if (cloudTenant) {
          const existingT = await db.tenants.get(cloudTenant.id);
          await db.tenants.put({
            ...existingT,
            ...cloudTenant,
            plan: cloudTenant.plan || existingT?.plan || "FREE",
            planStatus: cloudTenant.planStatus || existingT?.planStatus || "ACTIVE",
            planExpiresAt: cloudTenant.planExpiresAt !== undefined ? cloudTenant.planExpiresAt : existingT?.planExpiresAt,
            businessType: cloudTenant.businessType || existingT?.businessType,
          });
        }

        if (cloudStores && cloudStores.length > 0) {
          for (const s of cloudStores) {
            const existingS = await db.stores.get(s.id);
            await db.stores.put({
              ...existingS,
              ...s,
              businessType: s.businessType || existingS?.businessType,
            });
          }
        }

        if (cloudUsers && cloudUsers.length > 0) {
          for (const u of cloudUsers) {
            const existingU = await db.users.get(u.id);
            await db.users.put({
              ...existingU,
              ...u,
              pinCode: u.pinCode !== undefined && u.pinCode !== null && u.pinCode !== "" ? u.pinCode : (existingU?.pinCode || "1234"),
            });
          }
        }

        if (products && products.length > 0) {
          for (const prod of products) {
            await db.products.put({ ...prod, isSynced: true });
          }
        }

        if (customers && customers.length > 0) {
          for (const cust of customers) {
            await db.customers.put({ ...cust, isSynced: true });
          }
        }

        if (sales && sales.length > 0) {
          for (const sale of sales) {
            const { items, ...saleRecord } = sale;
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

        if (debtPayments && debtPayments.length > 0) {
          for (const pay of debtPayments) {
            await db.debtPayments.put({ ...pay, isSynced: true });
          }
        }
      }

      // 6. Update local lastPulledAt timestamp
      if (typeof window !== "undefined" && syncResult.serverTime) {
        localStorage.setItem(LAST_PULLED_KEY, syncResult.serverTime);
        localStorage.setItem("micro_erp_last_synced_time", new Date().toISOString());
      }

      this.isSyncing = false;
      this.notify();

      if (syncResult.failedIds && syncResult.failedIds.length > 0) {
        const failedCount = syncResult.failedIds.length;
        const syncedCount = syncResult.syncedIds?.length || 0;
        const firstErr = syncResult.failedIds[0]?.error || "Erreur serveur";
        return {
          success: false,
          message: `${syncedCount} synchronisé(s), ${failedCount} en échec : ${firstErr}`,
        };
      }

      return { success: true, message: "Synchronisation réussie" };
    } catch (err: any) {
      const errMsg = err?.message || "";
      const isFetchError =
        errMsg.toLowerCase().includes("failed to fetch") ||
        errMsg.toLowerCase().includes("networkerror") ||
        errMsg.toLowerCase().includes("load failed") ||
        errMsg.toLowerCase().includes("network request failed");

      const friendlyMessage = isFetchError
        ? "Mode hors-ligne : Impossible de joindre le serveur distant. Vos opérations locales sont sauvegardées."
        : errMsg || "Erreur de synchronisation";

      console.warn("[SyncEngine] Sync error:", friendlyMessage, err);
      this.isSyncing = false;
      this.notify();
      return { success: false, message: friendlyMessage };
    }
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

export const syncEngine = new SyncEngine();
