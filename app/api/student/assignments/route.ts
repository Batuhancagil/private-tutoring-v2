import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';

/**
 * GET /api/student/assignments
 * Get assignment for today or specified date, and upcoming assignments for current student
 * Query params: ?date=YYYY-MM-DD (optional, defaults to today)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Get date parameter or default to today
    const dateParam = request.nextUrl.searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    // Validate date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate > today) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Cannot retrieve assignments for future dates' },
        { status: 400 }
      );
    }

    // Find assignment active for target date (where targetDate falls between startDate and endDate)
    const targetAssignment = await prisma.assignment.findFirst({
      where: {
        studentId: user.userId, // Tenant isolation: only current student's assignments
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            lesson: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        logs: {
          where: {
            date: {
              equals: targetDate, // ProgressLog.date is @db.Date, so compare date-only
            },
          },
          select: {
            rightCount: true,
            wrongCount: true,
            emptyCount: true,
            bonusCount: true,
            date: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    // Calculate progress for target date's assignment
    let progress = null;
    if (targetAssignment) {
      const targetLog = targetAssignment.logs.find(
        (log) => log.date.toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]
      );
      const loggedQuestions = targetLog
        ? targetLog.rightCount + targetLog.wrongCount + targetLog.emptyCount
        : 0;
      const bonusQuestions = targetLog ? targetLog.bonusCount : 0;
      const totalQuestions = loggedQuestions + bonusQuestions;
      const progressPercentage =
        targetAssignment.dailyTarget > 0
          ? (totalQuestions / targetAssignment.dailyTarget) * 100
          : 0;

      progress = {
        logged: loggedQuestions,
        bonus: bonusQuestions,
        target: targetAssignment.dailyTarget,
        percentage: progressPercentage,
      };
    }

    // Find upcoming assignments (startDate > today) - only show if querying today
    const upcomingAssignments =
      targetDate.getTime() === today.getTime()
        ? await prisma.assignment.findMany({
            where: {
              studentId: user.userId,
              startDate: { gt: today },
            },
            include: {
              topic: {
                select: {
                  id: true,
                  name: true,
                  lesson: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              startDate: 'asc',
            },
            take: 5, // Limit to next 5 assignments
          })
        : [];

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    const response = NextResponse.json(
      {
        success: true,
        data: {
          today: targetAssignment
            ? {
                id: targetAssignment.id,
                topic: targetAssignment.topic.name,
                lesson: targetAssignment.topic.lesson.name,
                questionTarget: targetAssignment.dailyTarget,
                questionCount: targetAssignment.questionCount,
                startDate: targetAssignment.startDate,
                endDate: targetAssignment.endDate,
                progress,
                date: targetDate.toISOString().split('T')[0],
              }
            : null,
          upcoming: upcomingAssignments.map((assignment) => ({
            id: assignment.id,
            topic: assignment.topic.name,
            lesson: assignment.topic.lesson.name,
            questionTarget: assignment.dailyTarget,
            startDate: assignment.startDate,
          })),
        },
      },
      { status: 200 }
    );

    // Add caching headers (cache for 30 seconds, stale-while-revalidate for 60 seconds)
    response.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=60');

    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[StudentAssignments]',
      `Failed to fetch assignments: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch assignments: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.STUDENT, GETHandler);

