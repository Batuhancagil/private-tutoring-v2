import { prisma } from '@/lib/prisma';
import { logApiError } from '@/lib/error-logger';

/**
 * Check if accuracy is below threshold and generate/update alert accordingly
 * 
 * Automatically generates or updates accuracy alerts based on student performance.
 * If accuracy falls below threshold, creates a new alert or updates existing unresolved alert.
 * If accuracy improves above threshold, automatically resolves existing alerts.
 * 
 * This function is designed to be called during progress calculation and should not
 * throw errors that would interrupt the calculation flow.
 * 
 * @param studentId - Student ID (required, must be valid UUID)
 * @param accuracy - Current accuracy percentage (0-100, or null if no data)
 * @param threshold - Threshold percentage for alert generation (default: 70)
 * @param topicId - Optional topic ID for topic-specific alerts
 * @param lessonId - Optional lesson ID for lesson-specific alerts
 * @returns Promise resolving to created/updated alert object, or null if no action needed
 * @throws Never throws - errors are logged but not propagated to prevent breaking progress calculation
 * 
 * @example
 * ```typescript
 * // Generate alert for low accuracy
 * const alert = await checkAndGenerateAlert('student-123', 65, 70, 'topic-456');
 * // alert will be created if accuracy < threshold
 * 
 * // Auto-resolve when accuracy improves
 * const resolved = await checkAndGenerateAlert('student-123', 75, 70, 'topic-456');
 * // existing alert will be resolved if accuracy >= threshold
 * ```
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
 * Marks an alert as resolved and sets the resolvedAt timestamp. Ensures tenant
 * isolation by verifying the alert belongs to a student of the specified teacher.
 * 
 * @param alertId - Alert ID to resolve (required, must be valid UUID)
 * @param teacherId - Teacher ID for tenant isolation validation (required)
 * @returns Promise resolving to updated alert object with resolved=true and resolvedAt timestamp
 * @throws {Error} If alert not found or doesn't belong to teacher's student (access denied)
 * 
 * @example
 * ```typescript
 * const resolvedAlert = await resolveAlert('alert-123', 'teacher-789');
 * console.log(`Alert resolved at: ${resolvedAlert.resolvedAt}`);
 * ```
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
 * Retrieves accuracy alerts for all students belonging to the specified teacher,
 * with optional filtering by student ID and resolution status. Results are sorted
 * by creation date (most recent first) and include related student, topic, and
 * lesson data.
 * 
 * @param teacherId - Teacher ID for tenant isolation (required, must be valid UUID)
 * @param studentId - Optional student ID filter to get alerts for specific student
 * @param resolved - Optional filter for resolved status (default: false = unresolved only)
 * @returns Promise resolving to array of alert objects with related data
 * 
 * @example
 * ```typescript
 * // Get all unresolved alerts for teacher's students
 * const alerts = await getAlerts('teacher-789');
 * 
 * // Get resolved alerts for specific student
 * const resolvedAlerts = await getAlerts('teacher-789', 'student-123', true);
 * ```
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

