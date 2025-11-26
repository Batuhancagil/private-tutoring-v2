'use client';

import { getExpirationStatusColor, getExpirationStatusLabel } from '@/lib/subscription-helpers';
import type { ExpirationStatus } from '@/lib/subscription-helpers';

interface ExpirationWarningProps {
  daysUntilExpiration: number;
  status: ExpirationStatus;
}

export function ExpirationWarning({ daysUntilExpiration, status }: ExpirationWarningProps) {
  if (status === 'none') {
    return null;
  }

  const colorClass = getExpirationStatusColor(status);
  const label = getExpirationStatusLabel(status);
  
  let message: string;
  if (status === 'expired') {
    const daysAgo = Math.abs(daysUntilExpiration);
    message = `Expired ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
  } else {
    message = `${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''} remaining`;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      title={message}
    >
      {label}: {message}
    </span>
  );
}

