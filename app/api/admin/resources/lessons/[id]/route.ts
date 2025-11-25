import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const updateGlobalLessonSchema = z.object({
  name: z.string().min(1, 'Lesson name is required'),
});

/**
 * GET /api/admin/resources/lessons/[id]
 * Get global lesson details
 */
async function GETHandler(
  request: NextRequest,
  user: any,
  params: { id: string }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { id } = params;

    // Find global lesson (teacherId=null)
    const lesson = await prisma.lesson.findFirst({
      where: {
        id,
        teacherId: null, // Only global lessons
      },
      select: {
        id: true,
        name: true,
        teacherId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!lesson) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[GlobalLessonDetail]',
        `Global lesson not found: ${id}`,
        new Error('Global lesson not found'),
        request
      );
      return NextResponse.json(
        { error: 'Global lesson not found' },
        { status: 404 }
      );
    }

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[GlobalLessonDetail]',
      `Failed to fetch global lesson: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch global lesson: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/resources/lessons/[id]
 * Update a global lesson (Superadmin only)
 */
async function PUTHandler(
  request: NextRequest,
  user: any,
  params: { id: string }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { id } = params;
    const body = await request.json();
    const { name } = updateGlobalLessonSchema.parse(body);

    // Verify lesson exists and is global (teacherId=null)
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id,
        teacherId: null, // Only global lessons can be updated here
      },
    });

    if (!existingLesson) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[GlobalLessonUpdate]',
        `Global lesson not found: ${id}`,
        new Error('Global lesson not found'),
        request
      );
      return NextResponse.json(
        { error: 'Global lesson not found' },
        { status: 404 }
      );
    }

    // Update global lesson
    const lesson = await prisma.lesson.update({
      where: { id },
      data: { name },
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
      logApiError('[GlobalLessonUpdate]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[GlobalLessonUpdate]',
      `Failed to update global lesson: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to update global lesson: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/resources/lessons/[id]
 * Delete a global lesson (Superadmin only)
 */
async function DELETEHandler(
  request: NextRequest,
  user: any,
  params: { id: string }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { id } = params;

    // Verify lesson exists and is global (teacherId=null)
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id,
        teacherId: null, // Only global lessons can be deleted here
      },
    });

    if (!existingLesson) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[GlobalLessonDelete]',
        `Global lesson not found: ${id}`,
        new Error('Global lesson not found'),
        request
      );
      return NextResponse.json(
        { error: 'Global lesson not found' },
        { status: 404 }
      );
    }

    // Delete global lesson (cascade deletes topics and resources)
    await prisma.lesson.delete({
      where: { id },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        message: 'Global lesson deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[GlobalLessonDelete]',
      `Failed to delete global lesson: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to delete global lesson: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control (Superadmin only)
// Note: Next.js dynamic route params need to be handled differently
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.SUPERADMIN, async (req, user) =>
    GETHandler(req, user, await params)
  )(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.SUPERADMIN, async (req, user) =>
    PUTHandler(req, user, await params)
  )(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.SUPERADMIN, async (req, user) =>
    DELETEHandler(req, user, await params)
  )(request);
}

