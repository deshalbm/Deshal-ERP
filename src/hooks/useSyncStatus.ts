/**
 * useSyncStatus Hook
 * Subscribes to SyncEngine updates and provides real-time connectivity and queue state.
 */

import { useState, useEffect } from 'react';
import { syncEngine, SyncEngineStatus } from '../lib/offline/syncEngine';
import { clearQueue } from '../lib/offline/indexedDBQueue';

export function useSyncStatus(): SyncEngineStatus & {
  triggerManualSync: () => Promise<void>;
  clearStaleQueue: () => Promise<void>;
} {
  const [status, setStatus] = useState<SyncEngineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
    lastSyncedAt: null,
    lastError: null,
  });

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const triggerManualSync = async () => {
    await syncEngine.triggerSync();
  };

  const clearStaleQueue = async () => {
    await clearQueue();
    await syncEngine.triggerSync();
  };

  return {
    ...status,
    triggerManualSync,
    clearStaleQueue,
  };
}
