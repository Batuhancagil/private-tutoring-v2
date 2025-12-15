import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

// Force dynamic rendering since this route uses cookies for authentication
export const dynamic = 'force-dynamic';

const createGlobalLessonSchema = z.object({
  name: z.string().min(1, 'Lesson name is required'),
});

/**
 * GET /api/admin/resources/lessons
 * List all global lessons (teacherId=null) with their hierarchy
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Fetch all global lessons (teacherId=null) with their topics and resources
    const lessons = await prisma.lesson.findMany({
      where: {
        teacherId: null, // Only global lessons
      },
      include: {
        topics: {
          include: {
            resources: {
              select: {
                id: true,
                name: true,
                description: true,
                questionCount: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[GlobalLessonList]',
      `Failed to fetch global lessons: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch global lessons: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/resources/lessons
 * Create a new global lesson (teacherId=null) - Superadmin only
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { name } = createGlobalLessonSchema.parse(body);

    // Create global lesson with teacherId=null
    const lesson = await prisma.lesson.create({
      data: {
        name,
        teacherId: null, // Global lesson - accessible to all teachers
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
      logApiError('[GlobalLessonCreation]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[GlobalLessonCreation]',
      `Failed to create global lesson: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to create global lesson: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control (Superadmin only)
export const GET = withRole(UserRole.SUPERADMIN, GETHandler);
export const POST = withRole(UserRole.SUPERADMIN, POSTHandler);


