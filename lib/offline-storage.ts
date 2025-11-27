/**
 * Offline Storage Service
 * Manages offline log storage using localStorage
 */

export interface OfflineLog {
  id: string;
  assignmentId: string;
  rightCount: number;
  wrongCount: number;
  emptyCount: number;
  bonusCount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  createdAt: number; // Timestamp when saved locally
  synced: boolean; // Whether this log has been synced to server
  syncAttempts: number; // Number of sync attempts
  lastSyncAttempt?: number; // Timestamp of last sync attempt
}

const STORAGE_KEY = 'offline_progress_logs';
const MAX_STORAGE_SIZE = 100; // Maximum number of offline logs to store

/**
 * Get all offline logs from localStorage
 */
export function getOfflineLogs(): OfflineLog[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to read offline logs from localStorage:', error);
    return [];
  }
}

/**
 * Get pending (unsynced) logs
 */
export function getPendingLogs(): OfflineLog[] {
  return getOfflineLogs().filter((log) => !log.synced);
}

/**
 * Save a log to offline storage
 */
export function saveOfflineLog(log: Omit<OfflineLog, 'id' | 'createdAt' | 'synced' | 'syncAttempts'>): string {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is not available');
  }

  try {
    const logs = getOfflineLogs();
    const newLog: OfflineLog = {
      ...log,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      synced: false,
      syncAttempts: 0,
    };

    // Limit storage size - remove oldest synced logs if needed
    const syncedLogs = logs.filter((l) => l.synced).sort((a, b) => a.createdAt - b.createdAt);
    const unsyncedLogs = logs.filter((l) => !l.synced);
    
    if (unsyncedLogs.length + syncedLogs.length >= MAX_STORAGE_SIZE) {
      // Remove oldest synced logs to make room
      const logsToKeep = syncedLogs.slice(-(MAX_STORAGE_SIZE - unsyncedLogs.length - 1));
      const updatedLogs = [...unsyncedLogs, ...logsToKeep, newLog];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    } else {
      logs.push(newLog);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }

    return newLog.id;
  } catch (error) {
    console.error('Failed to save offline log:', error);
    throw error;
  }
}

/**
 * Mark a log as synced
 */
export function markLogAsSynced(logId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const logs = getOfflineLogs();
    const updatedLogs = logs.map((log) =>
      log.id === logId ? { ...log, synced: true } : log
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Failed to mark log as synced:', error);
  }
}

/**
 * Update sync attempts for a log
 */
export function updateSyncAttempts(logId: string, attempts: number, lastAttempt?: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const logs = getOfflineLogs();
    const updatedLogs = logs.map((log) =>
      log.id === logId
        ? { ...log, syncAttempts: attempts, lastSyncAttempt: lastAttempt }
        : log
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Failed to update sync attempts:', error);
  }
}

/**
 * Remove a log from offline storage
 */
export function removeOfflineLog(logId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const logs = getOfflineLogs();
    const updatedLogs = logs.filter((log) => log.id !== logId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Failed to remove offline log:', error);
  }
}

/**
 * Clear all synced logs (keep only pending logs)
 */
export function clearSyncedLogs(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const logs = getOfflineLogs();
    const pendingLogs = logs.filter((log) => !log.synced);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingLogs));
  } catch (error) {
    console.error('Failed to clear synced logs:', error);
  }
}

/**
 * Get count of pending logs
 */
export function getPendingLogsCount(): number {
  return getPendingLogs().length;
}

