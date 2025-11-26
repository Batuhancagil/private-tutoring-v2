'use client';

import { useEffect, useState } from 'react';
import { getProgressColor, getProgressColorClasses } from '@/lib/progress-helpers';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number; // Default 100
  label?: string;
  showPercentage?: boolean;
  className?: string;
  color?: 'green' | 'yellow' | 'red' | 'auto'; // 'auto' uses getProgressColor
  threshold?: number; // Used when color='auto'
}

/**
 * ProgressBar Component
 * Displays a progress bar with smooth animations and percentage indicator
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  className = '',
  color = 'auto',
  threshold = 70,
}: ProgressBarProps) {
  // Animated value for smooth transitions
  const [animatedValue, setAnimatedValue] = useState(value);

  useEffect(() => {
    // Smooth animation to new value
    setAnimatedValue(value);
  }, [value]);

  // Calculate percentage
  const percentage = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;

  // Determine color
  let barColor: 'green' | 'yellow' | 'red';
  if (color === 'auto') {
    barColor = getProgressColor(percentage, threshold).color;
  } else {
    barColor = color;
  }

  const colorClasses = getProgressColorClasses(barColor);

  // Format percentage text
  const percentageText = `${percentage.toFixed(1)}%`;

  return (
    <div className={`w-full ${className}`}>
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {percentageText}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full ${colorClasses.bg} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${animatedValue}%` }}
          role="progressbar"
          aria-valuenow={animatedValue}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${percentageText}`}
        />
      </div>
    </div>
  );
}

