/**
 * Background Sync Engine for Offline-First MediaPipe Assessments (IndexedDB ➔ MongoDB)
 */
import { OfflineStorage } from '../storage/indexedDB';
import { ApiService } from './api';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  lastError: string | null;
}

type SyncListener = (status: SyncStatus) => void;

class SyncManager {
  private static instance: SyncManager;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private pendingCount: number = 0;
  private lastSyncedAt: Date | null = null;
  private lastError: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private autoSyncInterval: number | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Periodic check every 30 seconds
      this.autoSyncInterval = window.setInterval(() => {
        this.updatePendingCount().then(() => {
          if (this.isOnline && this.pendingCount > 0 && !this.isSyncing) {
            this.syncNow();
          }
        });
      }, 30000);

      // Initial pending count scan
      this.updatePendingCount();
    }
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  public getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((l) => l(status));
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.lastError = null;
    this.notify();
    this.syncNow();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notify();
  };

  public async updatePendingCount(): Promise<number> {
    try {
      const unsynced = await OfflineStorage.getUnsyncedAssessments();
      this.pendingCount = unsynced.length;
      this.notify();
      return this.pendingCount;
    } catch {
      return this.pendingCount;
    }
  }

  public async syncNow(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    try {
      this.isSyncing = true;
      this.lastError = null;
      this.notify();

      const unsynced = await OfflineStorage.getUnsyncedAssessments();
      if (unsynced.length === 0) {
        this.pendingCount = 0;
        this.isSyncing = false;
        this.notify();
        return { synced: 0, failed: 0 };
      }

      let syncedCount = 0;
      let failedCount = 0;

      // Sync items in batches of 5
      const batchSize = 5;
      for (let i = 0; i < unsynced.length; i += batchSize) {
        const batch = unsynced.slice(i, i + batchSize);
        try {
          const res = await ApiService.batchSyncAssessments(batch);
          if (res && res.syncedIds) {
            for (const localId of res.syncedIds) {
              await OfflineStorage.markAssessmentSynced(localId);
              syncedCount++;
            }
          }
        } catch (err: any) {
          // If batch fails, attempt single item fallback
          for (const item of batch) {
            try {
              const singleRes = await ApiService.syncAssessment(item);
              if (singleRes && singleRes.success) {
                await OfflineStorage.markAssessmentSynced(item.id, singleRes.remoteId);
                syncedCount++;
              }
            } catch (singleErr: any) {
              failedCount++;
              this.lastError = singleErr.message || 'Sync failed';
            }
          }
        }
      }

      this.lastSyncedAt = new Date();
      await this.updatePendingCount();
      return { synced: syncedCount, failed: failedCount };
    } catch (err: any) {
      this.lastError = err.message || 'Sync encountered an error';
      return { synced: 0, failed: 0 };
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      if (this.autoSyncInterval) clearInterval(this.autoSyncInterval);
    }
    this.listeners.clear();
  }
}

export const syncManager = SyncManager.getInstance();
