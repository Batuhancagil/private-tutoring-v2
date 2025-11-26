import { prisma } from '@/lib/prisma';
import { logApiError } from '@/lib/error-logger';

/**
 * Check if accuracy is below threshold and generate/update alert accordingly
 * 
 * @param studentId - Student ID
 * @param accuracy - Current accuracy percentage (0-100)
 * @param threshold - Threshold percentage (default 70)
 * @param topicId - Optional topic ID
 * @param lessonId - Optional lesson ID
 * @returns Created or updated alert, or null if no alert needed
 */
export async function checkAndGenerateAlert(
  studentId: string,
  accuracy: number | null,
  threshold: number = 70,
  topicId?: string,
  lessonId?: string
): Promise<any | null> {
  try {
    // If accuracy is null or undefined, don't generate alert
    if (accuracy === null || accuracy === undefined) {
      return null;
    }

    // Check if accuracy is below threshold
    const isBelowThreshold = accuracy < threshold;

    // Find existing unresolved alert for this student/topic/lesson combination
    const existingAlert = await prisma.accuracyAlert.findFirst({
      where: {
        studentId,
        topicId: topicId || null,
        lessonId: lessonId || null,
        resolved: false,
      },
    });

    if (isBelowThreshold) {
      // Accuracy is below threshold - create or update alert
      if (existingAlert) {
        // Update existing alert with new accuracy and timestamp
        return await prisma.accuracyAlert.update({
          where: { id: existingAlert.id },
          data: {
            accuracy,
            threshold,
            createdAt: new Date(), // Update timestamp to reflect latest check
          },
        });
      } else {
        // Create new alert
        return await prisma.accuracyAlert.create({
          data: {
            studentId,
            topicId: topicId || null,
            lessonId: lessonId || null,
            accuracy,
            threshold,
            resolved: false,
          },
        });
      }
    } else {
      // Accuracy is above threshold - auto-resolve existing alert if it exists
      if (existingAlert) {
        return await prisma.accuracyAlert.update({
          where: { id: existingAlert.id },
          data: {
            resolved: true,
            resolvedAt: new Date(),
          },
        });
      }
      // No alert to resolve
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[AlertService]',
      `Failed to check/generate alert: ${errorMessage}`,
      error,
      null as any
    );
    // Don't throw - alert generation failure shouldn't break progress calculation
    return null;
  }
}

/**
 * Resolve an alert manually
 * 
 * @param alertId - Alert ID
 * @param teacherId - Teacher ID for tenant isolation
 * @returns Updated alert
 */
export async function resolveAlert(
  alertId: string,
  teacherId: string
): Promise<any> {
  // Verify alert exists and belongs to teacher's student (tenant isolation)
  const alert = await prisma.accuracyAlert.findFirst({
    where: {
      id: alertId,
      student: {
        teacherId,
      },
    },
  });

  if (!alert) {
    throw new Error('Alert not found or access denied');
  }

  return await prisma.accuracyAlert.update({
    where: { id: alertId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
    },
  });
}

/**
 * Get alerts for a teacher's students
 * 
 * @param teacherId - Teacher ID
 * @param studentId - Optional student ID filter
 * @param resolved - Optional resolved filter (default false for unresolved only)
 * @returns Array of alerts
 */
export async function getAlerts(
  teacherId: string,
  studentId?: string,
  resolved: boolean = false
): Promise<any[]> {
  const where: any = {
    student: {
      teacherId,
    },
    resolved,
  };

  if (studentId) {
    where.studentId = studentId;
  }

  return await prisma.accuracyAlert.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          username: true,
        },
      },
      topic: {
        select: {
          id: true,
          name: true,
        },
      },
      lesson: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

