import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';
import { calculateDualMetrics, getCachedDualMetrics } from '@/lib/progress-calculator';
import { getAlerts } from '@/lib/alert-service';
import { calculateTopicProgress } from '@/lib/progress-calculator';
import { calculateLessonProgress } from '@/lib/progress-calculator';

/**
 * GET /api/teacher/students/:id
 * Get detailed student information with progress data
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

    // Verify student exists and belongs to current teacher (tenant isolation)
    const student = await prisma.user.findFirst({
      where: {
        id,
        role: UserRole.STUDENT,
        teacherId: user.userId,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!student) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[StudentDetailGet]',
        `Student not found or access denied: ${id}`,
        new Error('Student not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 404 }
      );
    }

    // Get dual metrics (overall progress)
    let metrics = getCachedDualMetrics(student.id);
    if (!metrics) {
      try {
        metrics = await calculateDualMetrics(student.id, user.userId);
      } catch (error) {
        metrics = null;
      }
    }

    // Get all topics with progress
    const topics = await prisma.topic.findMany({
      where: {
        lesson: {
          OR: [
            { teacherId: user.userId },
            { teacherId: null },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        lessonId: true,
        lesson: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate progress for each topic
    const topicsWithProgress = await Promise.all(
      topics.map(async (topic) => {
        try {
          const progress = await calculateTopicProgress(
            student.id,
            topic.id,
            user.userId
          );
          return {
            ...topic,
            progress,
          };
        } catch (error) {
          return {
            ...topic,
            progress: null,
          };
        }
      })
    );

    // Group topics by lesson
    const lessonsMap = new Map<string, {
      id: string;
      name: string;
      topics: typeof topicsWithProgress;
    }>();

    topicsWithProgress.forEach((topicWithProgress) => {
      const lessonId = topicWithProgress.lessonId;
      if (!lessonsMap.has(lessonId)) {
        lessonsMap.set(lessonId, {
          id: topicWithProgress.lesson.id,
          name: topicWithProgress.lesson.name,
          topics: [],
        });
      }
      lessonsMap.get(lessonId)!.topics.push(topicWithProgress);
    });

    const lessons = Array.from(lessonsMap.values());

    // Calculate lesson-level progress
    const lessonsWithProgress = await Promise.all(
      lessons.map(async (lesson) => {
        try {
          const progress = await calculateLessonProgress(
            student.id,
            lesson.id,
            user.userId
          );
          return {
            ...lesson,
            progress,
          };
        } catch (error) {
          return {
            ...lesson,
            progress: null,
          };
        }
      })
    );

    // Get low accuracy alerts for this student
    const alerts = await getAlerts(user.userId, student.id, false);

    // Get total question counts from ProgressLog
    const progressLogs = await prisma.progressLog.findMany({
      where: {
        studentId: student.id,
      },
      select: {
        rightCount: true,
        wrongCount: true,
        emptyCount: true,
        bonusCount: true,
      },
    });

    const totalRight = progressLogs.reduce((sum, log) => sum + log.rightCount, 0);
    const totalWrong = progressLogs.reduce((sum, log) => sum + log.wrongCount, 0);
    const totalEmpty = progressLogs.reduce((sum, log) => sum + log.emptyCount, 0);
    const totalBonus = progressLogs.reduce((sum, log) => sum + log.bonusCount, 0);
    const totalQuestions = totalRight + totalWrong + totalEmpty + totalBonus;

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: {
          student,
          metrics: metrics || {
            programProgress: 0,
            conceptMastery: null,
            totalSolved: 0,
            totalAssigned: 0,
            totalRight: 0,
            totalAttempted: 0,
            lastUpdated: new Date(),
          },
          questionCounts: {
            right: totalRight,
            wrong: totalWrong,
            empty: totalEmpty,
            bonus: totalBonus,
            total: totalQuestions,
          },
          topics: topicsWithProgress,
          lessons: lessonsWithProgress,
          alerts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[StudentDetailGet]',
      `Failed to fetch student detail: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch student detail: ${errorMessage}` },
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
