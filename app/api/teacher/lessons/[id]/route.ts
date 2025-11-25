import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const updateLessonSchema = z.object({
  name: z.string().min(1, 'Lesson name is required'),
});

/**
 * GET /api/teacher/lessons/[id]
 * Get lesson details (with tenant check)
 */
async function GETHandler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Find lesson with tenant isolation check
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: params.id,
        teacherId: user.userId, // Tenant isolation: only current teacher's lessons
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
      statusCode = 403; // Forbidden - lesson doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[LessonDetail]',
        `Lesson not found or access denied: ${params.id}`,
        new Error('Lesson not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Lesson not found or access denied' },
        { status: 403 }
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
    logApiError('[LessonDetail]', 'Failed to fetch lesson', error, request);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/lessons/[id]
 * Update lesson (with tenant validation)
 */
async function PUTHandler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Check if lesson exists and belongs to current teacher (tenant isolation)
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id: params.id,
        teacherId: user.userId, // Tenant isolation: only current teacher's lessons
      },
    });

    if (!existingLesson) {
      statusCode = 403; // Forbidden - lesson doesn't belong to this teacher
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[LessonUpdate]',
        `Lesson not found or access denied: ${params.id}`,
        new Error('Lesson not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Lesson not found or access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = updateLessonSchema.parse(body);

    // Update lesson
    const lesson = await prisma.lesson.update({
      where: { id: params.id },
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
      logApiError('[LessonUpdate]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[LessonUpdate]', 'Failed to update lesson', error, request);
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/lessons/[id]
 * Delete lesson (with cascade to topics/resources and tenant validation)
 */
async function DELETEHandler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Check if lesson exists and belongs to current teacher (tenant isolation)
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        id: params.id,
        teacherId: user.userId, // Tenant isolation: only current teacher's lessons
      },
    });

    if (!existingLesson) {
      statusCode = 403; // Forbidden - lesson doesn't belong to this teacher
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[LessonDelete]',
        `Lesson not found or access denied: ${params.id}`,
        new Error('Lesson not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Lesson not found or access denied' },
        { status: 403 }
      );
    }

    // Delete lesson (cascade deletes will handle topics and resources)
    await prisma.lesson.delete({
      where: { id: params.id },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[LessonDelete]', 'Failed to delete lesson', error, request);
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
// Note: Next.js dynamic route params need to be handled differently
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.TEACHER, async (req, user) =>
    GETHandler(req, user, { params: await params })
  )(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.TEACHER, async (req, user) =>
    PUTHandler(req, user, { params: await params })
  )(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.TEACHER, async (req, user) =>
    DELETEHandler(req, user, { params: await params })
  )(request);
}

