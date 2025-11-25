import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const createLessonSchema = z.object({
  name: z.string().min(1, 'Lesson name is required'),
});

/**
 * GET /api/teacher/lessons
 * List all lessons for current teacher (teacher-scoped)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Fetch all lessons belonging to current teacher (tenant isolation)
    const lessons = await prisma.lesson.findMany({
      where: {
        teacherId: user.userId, // Tenant isolation: only current teacher's lessons
      },
      select: {
        id: true,
        name: true,
        teacherId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: lessons,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[LessonList]', 'Failed to fetch lessons', error, request);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/lessons
 * Create a new lesson (Teacher only)
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { name } = createLessonSchema.parse(body);

    // Create lesson with tenant isolation
    const lesson = await prisma.lesson.create({
      data: {
        name,
        teacherId: user.userId, // Tenant isolation: set to current teacher's ID
      },
      select: {
        id: true,
        name: true,
        teacherId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: lesson,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[LessonCreation]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[LessonCreation]', 'Failed to create lesson', error, request);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);
export const POST = withRole(UserRole.TEACHER, POSTHandler);

