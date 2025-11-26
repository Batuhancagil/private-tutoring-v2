import { prisma } from '@/lib/prisma';
import { logApiError } from '@/lib/error-logger';

/**
 * Get user preference value
 * 
 * @param userId - User ID
 * @param key - Preference key
 * @param defaultValue - Default value if preference not found
 * @returns Preference value or default value
 */
export async function getPreference(
  userId: string,
  key: string,
  defaultValue: string
): Promise<string> {
  try {
    const preference = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    return preference?.value ?? defaultValue;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[PreferencesService]',
      `Failed to get preference: ${errorMessage}`,
      error,
      null as any
    );
    return defaultValue;
  }
}

/**
 * Set user preference value
 * 
 * @param userId - User ID
 * @param key - Preference key
 * @param value - Preference value
 */
export async function setPreference(
  userId: string,
  key: string,
  value: string
): Promise<void> {
  try {
    await prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
      create: {
        userId,
        key,
        value,
      },
      update: {
        value,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[PreferencesService]',
      `Failed to set preference: ${errorMessage}`,
      error,
      null as any
    );
    throw error;
  }
}

/**
 * Delete user preference
 * 
 * @param userId - User ID
 * @param key - Preference key
 */
export async function deletePreference(userId: string, key: string): Promise<void> {
  try {
    await prisma.userPreference.delete({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });
  } catch (error) {
    // Ignore if preference doesn't exist
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return;
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[PreferencesService]',
      `Failed to delete preference: ${errorMessage}`,
      error,
      null as any
    );
    throw error;
  }
}

/**
 * Get accuracy threshold preference (with validation)
 * 
 * @param userId - User ID
 * @param defaultThreshold - Default threshold (default 70)
 * @returns Threshold value (0-100)
 */
export async function getAccuracyThreshold(
  userId: string,
  defaultThreshold: number = 70
): Promise<number> {
  const value = await getPreference(userId, 'accuracy_threshold', defaultThreshold.toString());
  const threshold = parseFloat(value);
  
  // Validate threshold (0-100)
  if (isNaN(threshold) || threshold < 0 || threshold > 100) {
    return defaultThreshold;
  }
  
  return threshold;
}

/**
 * Set accuracy threshold preference (with validation)
 * 
 * @param userId - User ID
 * @param threshold - Threshold value (0-100)
 * @throws Error if threshold is invalid
 */
export async function setAccuracyThreshold(
  userId: string,
  threshold: number
): Promise<void> {
  // Validate threshold
  if (isNaN(threshold) || threshold < 0 || threshold > 100) {
    throw new Error('Threshold must be between 0 and 100');
  }

  await setPreference(userId, 'accuracy_threshold', threshold.toString());
}

