import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';
import { calculateTopicProgress } from '@/lib/progress-calculator';
import { getProgressColor } from '@/lib/progress-helpers';
import { getAccuracyThreshold } from '@/lib/preferences-service';

/**
 * GET /api/teacher/students/:id/progress-table
 * Get progress table data (lessons → topics) for a student
 * Query params: ?threshold=70 (optional, default 70)
 */
async function GETHandler(
  request: NextRequest,
  user: any,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { id } = await params;

    // Get threshold from user preferences (or query param override, or default 70)
    const thresholdParam = request.nextUrl.searchParams.get('threshold');
    const threshold = thresholdParam
      ? parseFloat(thresholdParam)
      : await getAccuracyThreshold(user.userId, 70);

    // Verify student exists and belongs to current teacher (tenant isolation)
    const student = await prisma.user.findFirst({
      where: {
        id,
        role: UserRole.STUDENT,
        teacherId: user.userId,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 404 }
      );
    }

    // Query all lessons for teacher (global + teacher-specific)
    const lessons = await prisma.lesson.findMany({
      where: {
        OR: [
          { teacherId: user.userId },
          { teacherId: null },
        ],
      },
      include: {
        topics: {
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build progress table data
    const tableData = await Promise.all(
      lessons.map(async (lesson) => {
        const topicsData = await Promise.all(
          lesson.topics.map(async (topic) => {
            try {
              const progress = await calculateTopicProgress(
                student.id,
                topic.id,
                user.userId
              );
              const { color, status } = getProgressColor(progress.accuracy, threshold);

              return {
                topicId: topic.id,
                topicName: topic.name,
                accuracy: progress.accuracy,
                totalQuestions: progress.totalQuestions,
                rightCount: progress.rightCount,
                wrongCount: progress.wrongCount,
                emptyCount: progress.emptyCount,
                bonusCount: progress.bonusCount,
                status,
                color,
                lastUpdated: progress.lastUpdated,
              };
            } catch (error) {
              // Topic with no progress
              return {
                topicId: topic.id,
                topicName: topic.name,
                accuracy: null,
                totalQuestions: 0,
                rightCount: 0,
                wrongCount: 0,
                emptyCount: 0,
                bonusCount: 0,
                status: 'No data',
                color: 'red' as const,
                lastUpdated: null,
              };
            }
          })
        );

        return {
          lessonId: lesson.id,
          lessonName: lesson.name,
          topics: topicsData,
        };
      })
    );

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: tableData,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[ProgressTableGet]',
      `Failed to fetch progress table: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch progress table: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.TEACHER, async (req, user) =>
    GETHandler(req, user, { params })
  )(request);
}

