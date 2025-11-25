import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const createTopicSchema = z.object({
  name: z.string().min(1, 'Topic name is required'),
  lessonId: z.string().min(1, 'Lesson ID is required'),
});

/**
 * GET /api/teacher/topics
 * List all topics for current teacher (via lesson ownership)
 * Query params: ?scope=all|global|custom (default: all)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Get scope filter from query params (default: 'all')
    const scope = request.nextUrl.searchParams.get('scope') || 'all';

    // Build lesson filter based on scope
    let lessonFilter: { teacherId?: string | null } | { OR: Array<{ teacherId: string | null }> } =
      {};

    if (scope === 'global') {
      // Only topics from global lessons (teacherId=null)
      lessonFilter = { teacherId: null };
    } else if (scope === 'custom') {
      // Only topics from custom lessons (teacherId=teacher's ID)
      lessonFilter = { teacherId: user.userId };
    } else {
      // All topics: from both global (teacherId=null) and custom (teacherId=teacher's ID) lessons
      lessonFilter = {
        OR: [
          { teacherId: null },
          { teacherId: user.userId },
        ],
      };
    }

    // Fetch all topics where lesson belongs to current teacher (or is global)
    const topics = await prisma.topic.findMany({
      where: {
        lesson: lessonFilter,
      },
      select: {
        id: true,
        name: true,
        lessonId: true,
        createdAt: true,
        updatedAt: true,
        lesson: {
          select: {
            id: true,
            name: true,
            teacherId: true,
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
        data: topics,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[TopicList]', `Failed to fetch topics: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to fetch topics: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/topics
 * Create a new topic (Teacher only)
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { name, lessonId } = createTopicSchema.parse(body);

    // Verify lesson exists and belongs to current teacher (or is global)
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        OR: [
          { teacherId: user.userId }, // Tenant isolation: current teacher's lessons
          { teacherId: null }, // Global lessons accessible to all teachers
        ],
      },
    });

    if (!lesson) {
      statusCode = 403; // Forbidden - lesson doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[TopicCreation]',
        `Lesson not found or access denied: ${lessonId}`,
        new Error('Lesson not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Lesson not found or access denied' },
        { status: 403 }
      );
    }

    // Create topic
    const topic = await prisma.topic.create({
      data: {
        name,
        lessonId,
      },
      select: {
        id: true,
        name: true,
        lessonId: true,
        createdAt: true,
        updatedAt: true,
        lesson: {
          select: {
            id: true,
            name: true,
            teacherId: true,
          },
        },
      },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: topic,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[TopicCreation]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[TopicCreation]', `Failed to create topic: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to create topic: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);
export const POST = withRole(UserRole.TEACHER, POSTHandler);

