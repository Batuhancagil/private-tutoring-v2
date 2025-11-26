import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';
import { getCachedDualMetrics, calculateDualMetrics } from '@/lib/progress-calculator';
import { getProgressColor } from '@/lib/progress-helpers';
import { getAccuracyThreshold } from '@/lib/preferences-service';

/**
 * GET /api/teacher/students/progress
 * Get student list with progress data and color coding
 * Query params: ?threshold=70 (optional, default 70)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Get threshold from user preferences (or query param override, or default 70)
    const thresholdParam = request.nextUrl.searchParams.get('threshold');
    const threshold = thresholdParam
      ? parseFloat(thresholdParam)
      : await getAccuracyThreshold(user.userId, 70);

    // Query all students for current teacher (tenant isolation)
    const students = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        teacherId: user.userId,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    // Get progress data for each student
    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        // Try cached first, then calculate if needed
        let metrics = getCachedDualMetrics(student.id);
        if (!metrics) {
          try {
            metrics = await calculateDualMetrics(student.id, user.userId);
          } catch (error) {
            // If calculation fails, use null metrics
            metrics = null;
          }
        }

        // Get concept mastery for color coding (use concept mastery as accuracy)
        const accuracy = metrics?.conceptMastery ?? null;
        const { color, status } = getProgressColor(accuracy, threshold);

        return {
          ...student,
          accuracy,
          status,
          color,
          programProgress: metrics?.programProgress ?? null,
          conceptMastery: metrics?.conceptMastery ?? null,
        };
      })
    );

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: studentsWithProgress,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[StudentProgressList]',
      `Failed to fetch student progress: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch student progress: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);

