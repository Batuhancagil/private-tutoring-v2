/**
 * Subscription expiration helper functions
 */

export type ExpirationStatus = 'critical' | 'warning' | 'info' | 'none' | 'expired';

export interface ExpirationInfo {
  daysUntilExpiration: number;
  status: ExpirationStatus;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

/**
 * Calculate days until expiration
 * @param endDate - Subscription end date
 * @returns Number of days until expiration (negative if expired)
 */
export function calculateDaysUntilExpiration(endDate: Date | string): number {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determine expiration status based on days until expiration
 * @param daysUntilExpiration - Days until expiration (can be negative if expired)
 * @returns ExpirationStatus
 */
export function getExpirationStatus(daysUntilExpiration: number): ExpirationStatus {
  if (daysUntilExpiration < 0) {
    return 'expired';
  } else if (daysUntilExpiration < 3) {
    return 'critical';
  } else if (daysUntilExpiration < 7) {
    return 'warning';
  } else if (daysUntilExpiration < 14) {
    return 'info';
  } else {
    return 'none';
  }
}

/**
 * Get expiration info for a subscription
 * @param endDate - Subscription end date
 * @returns ExpirationInfo object
 */
export function getExpirationInfo(endDate: Date | string): ExpirationInfo {
  const daysUntilExpiration = calculateDaysUntilExpiration(endDate);
  const status = getExpirationStatus(daysUntilExpiration);
  
  return {
    daysUntilExpiration,
    status,
    isExpired: status === 'expired',
    isExpiringSoon: status === 'critical' || status === 'warning' || status === 'info',
  };
}

/**
 * Get color class for expiration status badge
 * @param status - Expiration status
 * @returns Tailwind CSS color classes
 */
export function getExpirationStatusColor(status: ExpirationStatus): string {
  switch (status) {
    case 'expired':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'info':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'none':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
}

/**
 * Get expiration status label
 * @param status - Expiration status
 * @returns Human-readable label
 */
export function getExpirationStatusLabel(status: ExpirationStatus): string {
  switch (status) {
    case 'expired':
      return 'Expired';
    case 'critical':
      return 'Expiring Soon';
    case 'warning':
      return 'Expiring Soon';
    case 'info':
      return 'Expiring Soon';
    case 'none':
      return 'Active';
    default:
      return 'Active';
  }
}

/**
 * Check if a subscription is currently active
 * @param startDate - Subscription start date
 * @param endDate - Subscription end date
 * @returns true if subscription is active, false otherwise
 */
export function isSubscriptionActive(
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  
  return now >= start && now <= end;
}

