import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { invalidateStudentTopicProgressCache, invalidateDualMetricsCache } from '@/lib/progress-calculator';
import { z } from 'zod';

const progressLogSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  rightCount: z.number().int().min(0, 'Right count must be non-negative'),
  wrongCount: z.number().int().min(0, 'Wrong count must be non-negative'),
  emptyCount: z.number().int().min(0, 'Empty count must be non-negative'),
  bonusCount: z.number().int().min(0, 'Bonus count must be non-negative').default(0),
  date: z.string().optional(), // ISO date string (YYYY-MM-DD), defaults to today
});

/**
 * GET /api/student/progress
 * Get progress log for today or specified date
 * Query params: ?date=YYYY-MM-DD (optional, defaults to today)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const dateParam = request.nextUrl.searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Validate date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate > today) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Cannot retrieve progress for future dates' },
        { status: 400 }
      );
    }

    // Validate date is not too far in the past (max 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);
    if (targetDate < oneYearAgo) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Cannot retrieve progress for dates more than 1 year ago' },
        { status: 400 }
      );
    }

    // Find today's active assignment
    const assignment = await prisma.assignment.findFirst({
      where: {
        studentId: user.userId,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });

    if (!assignment) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'No active assignment found for this date' },
        { status: 404 }
      );
    }

    // Find existing progress log for this date
    const progressLog = await prisma.progressLog.findUnique({
      where: {
        studentId_assignmentId_date: {
          studentId: user.userId,
          assignmentId: assignment.id,
          date: targetDate,
        },
      },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: {
          assignmentId: assignment.id,
          date: targetDate.toISOString().split('T')[0],
          log: progressLog
            ? {
                rightCount: progressLog.rightCount,
                wrongCount: progressLog.wrongCount,
                emptyCount: progressLog.emptyCount,
                bonusCount: progressLog.bonusCount,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[StudentProgressGet]',
      `Failed to fetch progress: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch progress: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/progress
 * Create or update progress log for today (or specified date)
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const validatedData = progressLogSchema.parse(body);

    // Validate total questions don't exceed 1000/day limit
    const totalQuestions =
      validatedData.rightCount +
      validatedData.wrongCount +
      validatedData.emptyCount +
      validatedData.bonusCount;

    if (totalQuestions > 1000) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Total questions cannot exceed 1000 per day', details: { totalQuestions } },
        { status: 400 }
      );
    }

    // Determine target date (default to today if not provided)
    const targetDate = validatedData.date ? new Date(validatedData.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Validate date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate > today) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Cannot log progress for future dates' },
        { status: 400 }
      );
    }

    // Verify assignment exists and is active for the target date
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: validatedData.assignmentId,
        studentId: user.userId, // Tenant isolation: ensure assignment belongs to current student
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });

    if (!assignment) {
      statusCode = 403; // Forbidden - assignment doesn't exist or doesn't belong to student
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[StudentProgressPost]',
        `Assignment not found or access denied: ${validatedData.assignmentId}`,
        new Error('Assignment not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 403 }
      );
    }

    // Upsert progress log (create if doesn't exist, update if exists)
    const progressLog = await prisma.progressLog.upsert({
      where: {
        studentId_assignmentId_date: {
          studentId: user.userId,
          assignmentId: validatedData.assignmentId,
          date: targetDate,
        },
      },
      create: {
        studentId: user.userId,
        assignmentId: validatedData.assignmentId,
        date: targetDate,
        rightCount: validatedData.rightCount,
        wrongCount: validatedData.wrongCount,
        emptyCount: validatedData.emptyCount,
        bonusCount: validatedData.bonusCount,
      },
      update: {
        rightCount: validatedData.rightCount,
        wrongCount: validatedData.wrongCount,
        emptyCount: validatedData.emptyCount,
        bonusCount: validatedData.bonusCount,
      },
    });

    // Trigger progress recalculation by invalidating caches
    // This ensures next API call will recalculate with fresh data
    // We invalidate all topic progress and dual metrics for this student since any ProgressLog update
    // could affect any topic or overall metrics (student might have multiple assignments on different topics)
    try {
      invalidateStudentTopicProgressCache(user.userId);
      invalidateDualMetricsCache(user.userId);
    } catch (cacheError) {
      // Log but don't fail the request if cache invalidation fails
      logApiError(
        '[StudentProgressPost]',
        'Failed to invalidate progress caches',
        cacheError instanceof Error ? cacheError : new Error('Unknown cache error'),
        request
      );
    }

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: progressLog.id,
          assignmentId: progressLog.assignmentId,
          date: progressLog.date.toISOString().split('T')[0],
          rightCount: progressLog.rightCount,
          wrongCount: progressLog.wrongCount,
          emptyCount: progressLog.emptyCount,
          bonusCount: progressLog.bonusCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[StudentProgressPost]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[StudentProgressPost]',
      `Failed to save progress: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to save progress: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
export const GET = withRole(UserRole.STUDENT, GETHandler);
export const POST = withRole(UserRole.STUDENT, POSTHandler);

