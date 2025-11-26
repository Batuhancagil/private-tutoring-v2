'use client';

import { getProgressColor, getProgressColorClasses } from '@/lib/progress-helpers';

interface ProgressIndicatorProps {
  accuracy: number | null;
  threshold?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * ProgressIndicator Component
 * Displays color-coded progress indicator with accessibility support
 */
export function ProgressIndicator({
  accuracy,
  threshold = 70,
  showLabel = true,
  size = 'md',
  className = '',
}: ProgressIndicatorProps) {
  const { color, status } = getProgressColor(accuracy, threshold);
  const colorClasses = getProgressColorClasses(color);

  // Size classes
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  // Format accuracy for display
  const accuracyText =
    accuracy !== null && accuracy !== undefined
      ? `${accuracy.toFixed(1)}%`
      : 'N/A';

  // Screen reader text
  const ariaLabel = `Status: ${status}, Accuracy: ${accuracyText}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Color indicator dot */}
      <div
        className={`${sizeClasses[size]} ${colorClasses.bg} rounded-full border-2 ${colorClasses.border}`}
        role="img"
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        {/* Screen reader only text */}
        <span className="sr-only">{ariaLabel}</span>
      </div>

      {/* Status text (optional) */}
      {showLabel && (
        <span
          className={`text-sm font-medium ${colorClasses.text}`}
          aria-label={`Status: ${status}`}
        >
          {status}
        </span>
      )}
    </div>
  );
}

