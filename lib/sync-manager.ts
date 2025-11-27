/**
 * Sync Manager
 * Handles syncing offline logs to the server
 */

import {
  getPendingLogs,
  markLogAsSynced,
  updateSyncAttempts,
  removeOfflineLog,
  OfflineLog,
} from './offline-storage';

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime?: number;
  lastSyncError?: string;
}

const MAX_SYNC_ATTEMPTS = 3;
const SYNC_RETRY_DELAY = 5000; // 5 seconds

/**
 * Sync a single offline log to the server
 */
async function syncSingleLog(log: OfflineLog): Promise<boolean> {
  try {
    const response = await fetch('/api/student/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignmentId: log.assignmentId,
        rightCount: log.rightCount,
        wrongCount: log.wrongCount,
        emptyCount: log.emptyCount,
        bonusCount: log.bonusCount,
        date: log.date,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to sync log');
    }

    // Mark as synced
    markLogAsSynced(log.id);
    return true;
  } catch (error) {
    // Update sync attempts
    const newAttempts = log.syncAttempts + 1;
    updateSyncAttempts(log.id, newAttempts, Date.now());

    // If max attempts reached, keep log but don't retry automatically
    if (newAttempts >= MAX_SYNC_ATTEMPTS) {
      console.error(`Max sync attempts reached for log ${log.id}:`, error);
    }

    throw error;
  }
}

/**
 * Sync all pending logs to the server
 * Processes logs in order (oldest first)
 */
export async function syncPendingLogs(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ logId: string; error: string }>;
}> {
  const pendingLogs = getPendingLogs();
  
  // Sort by creation time (oldest first) to preserve order
  pendingLogs.sort((a, b) => a.createdAt - b.createdAt);

  let success = 0;
  let failed = 0;
  const errors: Array<{ logId: string; error: string }> = [];

  for (const log of pendingLogs) {
    // Skip logs that have exceeded max sync attempts
    if (log.syncAttempts >= MAX_SYNC_ATTEMPTS) {
      failed++;
      errors.push({
        logId: log.id,
        error: 'Max sync attempts reached',
      });
      continue;
    }

    try {
      await syncSingleLog(log);
      success++;
    } catch (error) {
      failed++;
      errors.push({
        logId: log.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { success, failed, errors };
}

/**
 * Retry syncing failed logs
 */
export async function retryFailedSyncs(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ logId: string; error: string }>;
}> {
  const pendingLogs = getPendingLogs();
  
  // Filter logs that have failed but haven't exceeded max attempts
  const failedLogs = pendingLogs.filter(
    (log) => log.syncAttempts > 0 && log.syncAttempts < MAX_SYNC_ATTEMPTS
  );

  // Sort by last sync attempt (oldest first)
  failedLogs.sort((a, b) => (a.lastSyncAttempt || 0) - (b.lastSyncAttempt || 0));

  let success = 0;
  let failed = 0;
  const errors: Array<{ logId: string; error: string }> = [];

  for (const log of failedLogs) {
    // Only retry if enough time has passed since last attempt
    const timeSinceLastAttempt = log.lastSyncAttempt
      ? Date.now() - log.lastSyncAttempt
      : Infinity;

    if (timeSinceLastAttempt < SYNC_RETRY_DELAY) {
      continue; // Skip if not enough time has passed
    }

    try {
      await syncSingleLog(log);
      success++;
    } catch (error) {
      failed++;
      errors.push({
        logId: log.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { success, failed, errors };
}

/**
 * Initialize sync manager - sets up automatic syncing
 */
export function initializeSyncManager(
  onSyncStatusChange?: (status: SyncStatus) => void
): () => void {
  let syncInterval: NodeJS.Timeout | null = null;
  let isSyncing = false;

  const performSync = async () => {
    if (isSyncing) {
      return; // Already syncing
    }

    const pendingCount = getPendingLogs().length;
    if (pendingCount === 0) {
      return; // Nothing to sync
    }

    isSyncing = true;
    onSyncStatusChange?.({ isSyncing: true, pendingCount });

    try {
      const result = await syncPendingLogs();
      const remainingPending = getPendingLogs().length;

      onSyncStatusChange?.({
        isSyncing: false,
        pendingCount: remainingPending,
        lastSyncTime: Date.now(),
        lastSyncError:
          result.failed > 0
            ? `${result.failed} log(s) failed to sync`
            : undefined,
      });
    } catch (error) {
      onSyncStatusChange?.({
        isSyncing: false,
        pendingCount: getPendingLogs().length,
        lastSyncError: error instanceof Error ? error.message : 'Sync failed',
      });
    } finally {
      isSyncing = false;
    }
  };

  // Sync immediately if online
  if (typeof window !== 'undefined' && navigator.onLine) {
    performSync();
  }

  // Set up online event listener
  const handleOnline = () => {
    performSync();
  };

  // Set up periodic sync (every 30 seconds when online)
  syncInterval = setInterval(() => {
    if (typeof window !== 'undefined' && navigator.onLine && !isSyncing) {
      performSync();
    }
  }, 30000);

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
  }

  // Cleanup function
  return () => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
    }
  };
}

