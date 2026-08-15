import { db, DEFAULT_STORE_ID } from "../db/dexie-db";
import { getPendingSyncItems, removeSyncedItems, updateQueueItemStatus } from "./sync-queue";
import type { SyncPushRequest, SyncPushResponse } from "../shared/types";

const LAST_PULLED_KEY = "micro_erp_last_pulled_at";

export class SyncEngine {
  private isSyncing = false;
  private syncTimer: any = null;
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.triggerSync());
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
      this.syncTimer = setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.triggerSync();
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

  public async triggerSync(storeId: string = DEFAULT_STORE_ID): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: "Synchronisation déjà en cours" };
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { success: false, message: "Appareil hors-ligne" };
    }

    this.isSyncing = true;
    this.notify();

    try {
      // 1. Get pending mutations
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

      // 2. Call /api/v1/sync (resolves cloud server URL when running in native APK)
      const isNative = typeof window !== "undefined" && Boolean((window as any).Capacitor?.isNativePlatform?.());
      const apiUrl = isNative ? "https://smart-pos-azure-pi.vercel.app/api/v1/sync" : "/api/v1/sync";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const syncResult: SyncPushResponse = await response.json();

      if (!syncResult.success) {
        throw new Error("Échec du traitement de synchronisation par le serveur");
      }

      // 3. Mark pushed mutations as synced & clean queue
      if (syncResult.syncedIds && syncResult.syncedIds.length > 0) {
        await removeSyncedItems(syncResult.syncedIds);
      }

      // 4. Handle failed items if any
      if (syncResult.failedIds && syncResult.failedIds.length > 0) {
        for (const f of syncResult.failedIds) {
          await updateQueueItemStatus(f.id, "FAILED", f.error);
        }
      }

      // 5. Apply server updates (Pull) to local IndexedDB
      if (syncResult.updates) {
        const { products, customers, sales, debtPayments } = syncResult.updates;

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
            await db.sales.put({ ...sale, isSynced: true });
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
