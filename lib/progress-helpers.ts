/**
 * Progress helper functions for color coding and status determination
 */

export interface ProgressColorResult {
  color: 'green' | 'yellow' | 'red';
  status: string;
}

/**
 * Get progress color and status based on accuracy and threshold
 * 
 * @param accuracy - Accuracy percentage (0-100)
 * @param threshold - Threshold percentage (default 70)
 * @returns Object with color and status text
 */
export function getProgressColor(
  accuracy: number | null,
  threshold: number = 70
): ProgressColorResult {
  // Handle null/undefined accuracy
  if (accuracy === null || accuracy === undefined) {
    return {
      color: 'red',
      status: 'No data',
    };
  }

  // Green: accuracy ≥ threshold
  if (accuracy >= threshold) {
    return {
      color: 'green',
      status: 'On track',
    };
  }

  // Yellow: threshold - 5% ≤ accuracy < threshold
  if (accuracy >= threshold - 5) {
    return {
      color: 'yellow',
      status: 'Attention needed',
    };
  }

  // Red: accuracy < threshold - 5%
  return {
    color: 'red',
    status: 'Struggling',
  };
}

/**
 * Get Tailwind CSS color classes for progress indicators
 * 
 * @param color - Color name ('green' | 'yellow' | 'red')
 * @returns Object with background, text, and border color classes
 */
export function getProgressColorClasses(color: 'green' | 'yellow' | 'red'): {
  bg: string;
  text: string;
  border: string;
} {
  switch (color) {
    case 'green':
      return {
        bg: 'bg-green-500',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-500',
      };
    case 'yellow':
      return {
        bg: 'bg-yellow-500',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-500',
      };
    case 'red':
      return {
        bg: 'bg-red-500',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-500',
      };
  }
}

