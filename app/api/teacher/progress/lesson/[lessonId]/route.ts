import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import {
  calculateLessonProgress,
  getCachedLessonProgress,
  setCachedLessonProgress,
} from '@/lib/progress-calculator';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/teacher/progress/lesson/:lessonId
 * Get lesson-level progress for a student
 * Query params: ?studentId=xxx (required)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Extract lessonId from path
    const lessonId = request.nextUrl.pathname.split('/').pop();
    if (!lessonId) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Get studentId from query params
    const studentId = request.nextUrl.searchParams.get('studentId');
    if (!studentId) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Student ID is required (query param: ?studentId=xxx)' },
        { status: 400 }
      );
    }

    // Verify student exists and belongs to current teacher (tenant isolation)
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: UserRole.STUDENT,
        teacherId: user.userId, // Tenant isolation: student must belong to current teacher
      },
      select: {
        id: true,
        teacherId: true,
      },
    });

    if (!student) {
      statusCode = 403; // Forbidden - student doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[LessonProgressGet]',
        `Student not found or access denied: ${studentId}`,
        new Error('Student not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      );
    }

    // Verify lesson exists and is accessible (global or teacher's custom lesson)
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        OR: [
          { teacherId: user.userId }, // Tenant isolation: current teacher's lessons
          { teacherId: null }, // Global lessons accessible to all teachers
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!lesson) {
      statusCode = 404; // Not Found - lesson doesn't exist or isn't accessible
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[LessonProgressGet]',
        `Lesson not found or access denied: ${lessonId}`,
        new Error('Lesson not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check cache first
    const cached = getCachedLessonProgress(studentId, lessonId);
    if (cached) {
      statusCode = 200;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        {
          success: true,
          data: cached,
          cached: true,
        },
        { status: 200 }
      );
    }

    // Calculate lesson progress
    const progress = await calculateLessonProgress(
      studentId,
      lessonId,
      user.userId
    );

    // Cache the result
    setCachedLessonProgress(studentId, lessonId, progress);

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: progress,
        cached: false,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[LessonProgressGet]',
      `Failed to fetch lesson progress: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch lesson progress: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);

