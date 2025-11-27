'use client';

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { getPendingLogsCount } from '@/lib/offline-storage';
import { syncPendingLogs } from '@/lib/sync-manager';

export function OfflineIndicator() {
  const { isOnline, isOffline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Update pending count periodically
  useEffect(() => {
    const updatePendingCount = () => {
      setPendingCount(getPendingLogsCount());
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      handleSync();
    }
  }, [isOnline, pendingCount, isSyncing]);

  const handleSync = async () => {
    if (isSyncing || pendingCount === 0) {
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      const result = await syncPendingLogs();
      setPendingCount(getPendingLogsCount());

      if (result.failed === 0) {
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      } else {
        setSyncError(`${result.failed} log(s) failed to sync`);
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show indicator if online and no pending logs
  if (isOnline && pendingCount === 0 && !syncSuccess && !syncError) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:left-auto md:right-4 md:bottom-4 md:w-80">
      <div
        className={`
          p-3 sm:p-4 shadow-lg rounded-t-lg md:rounded-lg border-t md:border
          ${
            isOffline
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : syncError
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : syncSuccess
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : isSyncing
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }
        `}
      >
        {isOffline ? (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                You're offline
              </p>
              {pendingCount > 0 && (
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  {pendingCount} log{pendingCount !== 1 ? 's' : ''} will sync when online
                </p>
              )}
            </div>
          </div>
        ) : isSyncing ? (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Syncing {pendingCount} log{pendingCount !== 1 ? 's' : ''}...
              </p>
            </div>
          </div>
        ) : syncSuccess ? (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                All logs synced successfully
              </p>
            </div>
          </div>
        ) : syncError ? (
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Sync error
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {syncError}
              </p>
              {pendingCount > 0 && (
                <button
                  onClick={handleSync}
                  className="mt-2 text-xs font-medium text-red-800 dark:text-red-200 underline"
                >
                  Retry sync
                </button>
              )}
            </div>
          </div>
        ) : pendingCount > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-gray-600 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {pendingCount} log{pendingCount !== 1 ? 's' : ''} pending sync
              </p>
              <button
                onClick={handleSync}
                className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300 underline"
              >
                Sync now
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

