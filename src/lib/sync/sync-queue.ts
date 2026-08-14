import { db } from "../db/dexie-db";
import type { SyncQueueItem, SyncStatus } from "../shared/types";

export async function getPendingSyncItems(storeId: string, limit = 50): Promise<SyncQueueItem[]> {
  return await db.syncQueue
    .where("storeId")
    .equals(storeId)
    .and((item) => item.status === "PENDING" || item.status === "FAILED")
    .limit(limit)
    .toArray();
}

export async function updateQueueItemStatus(
  id: string,
  status: SyncStatus,
  error?: string
): Promise<void> {
  const item = await db.syncQueue.get(id);
  if (item) {
    await db.syncQueue.update(id, {
      status,
      retryCount: status === "FAILED" ? item.retryCount + 1 : item.retryCount,
      lastError: error,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function removeSyncedItems(ids: string[]): Promise<void> {
  await db.syncQueue.bulkDelete(ids);
}

export async function countPendingSyncItems(storeId: string): Promise<number> {
  return await db.syncQueue
    .where("storeId")
    .equals(storeId)
    .and((item) => item.status === "PENDING" || item.status === "FAILED")
    .count();
}
