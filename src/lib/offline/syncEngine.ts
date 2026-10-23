import { offlineDB } from "./db";
import { TransactionCreateInput, OfflineSyncItem } from "../types";
import { v4 as uuidv4 } from "uuid";

type SyncListener = (status: {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}) => void;

class SyncEngine {
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private isOnline = typeof window !== "undefined" ? navigator.onLine : true;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.notifyListeners();
        this.flushSyncQueue();
      });

      window.addEventListener("offline", () => {
        this.isOnline = false;
        this.notifyListeners();
      });

      // Periodic check if online
      setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.flushSyncQueue();
        }
      }, 30000);
    }
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    this.notifyListeners();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners() {
    let pendingCount = 0;
    if (offlineDB) {
      try {
        pendingCount = await offlineDB.pendingTransactions
          .where("status")
          .equals("PENDING")
          .count();
      } catch (e) {
        // ignore in SSR
      }
    }

    const state = {
      isOnline: this.isOnline,
      pendingCount,
      isSyncing: this.isSyncing,
    };

    this.listeners.forEach((fn) => fn(state));
  }

  /**
   * Enqueue a transaction locally in IndexedDB.
   * If online, attempts instant server submission. If fails or offline, stays queued.
   */
  public async enqueueTransaction(
    payload: TransactionCreateInput
  ): Promise<{
    localId: string;
    syncedImmediately: boolean;
    transaction?: any;
    receiptNumber?: string;
    receiptId?: string;
    temporaryReceiptNumber?: string;
  }> {
    const localId = payload.localId || uuidv4();
    const item: OfflineSyncItem = {
      localId,
      farmId: payload.farmId,
      payload: { ...payload, localId },
      status: "PENDING",
      retryCount: 0,
      createdAt: Date.now(),
    };

    if (offlineDB) {
      await offlineDB.pendingTransactions.put(item);
    }

    this.notifyListeners();

    // If online, attempt instant server submission first
    if (this.isOnline) {
      const syncResult = await this.syncSingle(item);
      if (syncResult.success) {
        return {
          localId,
          syncedImmediately: true,
          transaction: syncResult.transaction,
          receiptNumber: syncResult.transaction?.receiptNumber,
          receiptId: syncResult.transaction?.receiptId,
        };
      } else {
        // ONLINE AND SERVER REJECTED:
        // Do NOT treat validation/server failure as offline success!
        throw new Error(syncResult.error || "Failed to save transaction to server.");
      }
    }

    // Truly offline: queue locally in IndexedDB
    if (offlineDB) {
      await offlineDB.pendingTransactions.put(item);
    }
    this.notifyListeners();

    return {
      localId,
      syncedImmediately: false,
      temporaryReceiptNumber: `OFFLINE-${localId.slice(0, 8).toUpperCase()}`,
    };
  }

  /**
   * Sync a single item to the server.
   */
  private async syncSingle(
    item: OfflineSyncItem
  ): Promise<{ success: boolean; transaction?: any; error?: string }> {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (offlineDB) {
          // Cleanup synced items from offline queue
          await offlineDB.pendingTransactions.delete(item.localId);
        }
        this.notifyListeners();
        return { success: true, transaction: data.transaction };
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || `Server returned ${res.status}`;
        if (offlineDB) {
          await offlineDB.pendingTransactions.update(item.localId, {
            status: "FAILED",
            retryCount: item.retryCount + 1,
            lastError: errorMessage,
          });
        }
        this.notifyListeners();
        return { success: false, error: errorMessage };
      }
    } catch (err: any) {
      if (offlineDB) {
        await offlineDB.pendingTransactions.update(item.localId, {
          status: "PENDING",
          retryCount: item.retryCount + 1,
          lastError: err.message || "Network error",
        });
      }
      this.notifyListeners();
      return { success: false, error: err.message || "Network connection error" };
    }
  }

  /**
   * Flush all pending transactions in batch to /api/sync/batch.
   */
  public async flushSyncQueue(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline || this.isSyncing || !offlineDB) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const pending = await offlineDB.pendingTransactions
        .where("status")
        .anyOf(["PENDING", "FAILED"])
        .toArray();

      if (pending.length === 0) {
        this.isSyncing = false;
        this.notifyListeners();
        return { synced: 0, failed: 0 };
      }

      const payloads = pending.map((p: OfflineSyncItem) => p.payload);

      const res = await fetch("/api/sync/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: payloads }),
      });

      if (res.ok) {
        const data = await res.json();
        const syncedIds: string[] = data.syncedIds || [];

        for (const id of syncedIds) {
          await offlineDB.pendingTransactions.delete(id);
        }

        this.notifyListeners();
        return { synced: syncedIds.length, failed: pending.length - syncedIds.length };
      } else {
        // Increment retry counts
        for (const item of pending) {
          await offlineDB.pendingTransactions.update(item.localId, {
            retryCount: item.retryCount + 1,
          });
        }
        return { synced: 0, failed: pending.length };
      }
    } catch (e) {
      return { synced: 0, failed: 0 };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }
}

export const syncEngine = new SyncEngine();
