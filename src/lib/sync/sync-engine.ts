import { db, DEFAULT_STORE_ID, enqueueSync } from "../db/dexie-db";
import { getPendingSyncItems, removeSyncedItems, updateQueueItemStatus } from "./sync-queue";
import type { SyncPushRequest, SyncPushResponse } from "../shared/types";

const LAST_PULLED_KEY = "micro_erp_last_pulled_at";
const MAX_IDLE_SYNC_MS = 10 * 60 * 1000; // 10 minutes maximum without syncing

export class SyncEngine {
  private isSyncing = false;
  private syncTimer: any = null;
  private listeners: Array<() => void> = [];
  private activeStoreId: string = DEFAULT_STORE_ID;

  constructor() {
    if (typeof window !== "undefined") {
      // 1. Auto-sync immediately when network connection is restored
      window.addEventListener("online", () => {
        console.log("[SyncEngine] 🌐 Connexion rétablie -> Déclenchement de la synchronisation automatique");
        this.triggerSync(this.activeStoreId);
      });

      // 2. Auto-sync on window focus / visibility change if > 10 minutes elapsed
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.checkAndTriggerIdleSync(this.activeStoreId);
        }
      });

      window.addEventListener("focus", () => {
        this.checkAndTriggerIdleSync(this.activeStoreId);
      });
    }
  }

  public setActiveStoreId(storeId: string) {
    this.activeStoreId = storeId;
  }

  /**
   * Cron/Heartbeat check: checks if > 10 minutes elapsed or pending mutations exist
   */
  public checkAndTriggerIdleSync(storeId: string = this.activeStoreId) {
    if (typeof window === "undefined" || !navigator.onLine || this.isSyncing) return;

    const lastSyncedTimeStr = localStorage.getItem("micro_erp_last_synced_time");
    if (!lastSyncedTimeStr) {
      this.triggerSync(storeId);
      return;
    }

    const lastSyncedTime = new Date(lastSyncedTimeStr).getTime();
    const elapsed = Date.now() - lastSyncedTime;

    if (elapsed >= MAX_IDLE_SYNC_MS) {
      console.log(`[SyncEngine] ⏱️ Plus de 10 min sans synchronisation (${Math.round(elapsed / 60000)} min) -> Synchronisation automatique déclenchée`);
      this.triggerSync(storeId);
    }
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

  public startPeriodicSync(intervalMs = 30000) {
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (typeof window !== "undefined") {
      // Cron loop running every 30 seconds:
      // Checks for pending mutations OR > 10 min inactivity
      this.syncTimer = setInterval(async () => {
        if (navigator.onLine && !this.isSyncing) {
          const pending = await getPendingSyncItems(this.activeStoreId, 1);
          if (pending.length > 0) {
            this.triggerSync(this.activeStoreId);
          } else {
            this.checkAndTriggerIdleSync(this.activeStoreId);
          }
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

      // 2. Get pending mutations
      const pendingItems = await getPendingSyncItems(storeId, 100);
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

      const tenantId = pendingItems[0]?.tenantId || undefined;

      const syncRequest: SyncPushRequest = {
        tenantId,
        storeId,
        lastPulledAt,
        mutations,
      };

      // 3. Call /api/v1/sync (resolves cloud server URL when running in native APK)
      const isNative = typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.());
      const apiUrl = isNative
        ? (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/sync` : "https://globalpos.app/api/v1/sync")
        : "/api/v1/sync";

      const token = typeof window !== "undefined" ? localStorage.getItem("kuettu_session_token") || localStorage.getItem("kuettu_admin_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(syncRequest),
      });

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
        const { products, customers, sales, debtPayments, tenant: cloudTenant, stores: cloudStores } = syncResult.updates;

        if (cloudTenant) {
          const existingT = await db.tenants.get(cloudTenant.id);
          await db.tenants.put({
            ...existingT,
            ...cloudTenant,
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
      console.warn("[SyncEngine] Sync error (offline / network):", err.message);
      this.isSyncing = false;
      this.notify();
      return { success: false, message: err.message || "Erreur de synchronisation" };
    }
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

export const syncEngine = new SyncEngine();
