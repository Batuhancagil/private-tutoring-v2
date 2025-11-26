import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const createResourceSchema = z.object({
  name: z.string().min(1, 'Resource name is required'),
  topicId: z.string().min(1, 'Topic ID is required'),
  questionCount: z.number().int().positive().optional(),
});

/**
 * GET /api/teacher/resources
 * List all resources for current teacher (via topic's lesson ownership)
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
    const topicId = request.nextUrl.searchParams.get('topicId');

    // Build lesson filter based on scope
    let lessonFilter: { teacherId?: string | null } | { OR: Array<{ teacherId: string | null }> } =
      {};

    if (scope === 'global') {
      // Only resources from global lessons (teacherId=null)
      lessonFilter = { teacherId: null };
    } else if (scope === 'custom') {
      // Only resources from custom lessons (teacherId=teacher's ID)
      lessonFilter = { teacherId: user.userId };
    } else {
      // All resources: from both global (teacherId=null) and custom (teacherId=teacher's ID) lessons
      lessonFilter = {
        OR: [
          { teacherId: null },
          { teacherId: user.userId },
        ],
      };
    }

    // Build where clause
    const where: any = {
      topic: {
        lesson: lessonFilter,
      },
    };

    // Add topicId filter if provided
    if (topicId) {
      where.topicId = topicId;
    }

    // Fetch all resources where topic's lesson belongs to current teacher (or is global)
    const resources = await prisma.resource.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        questionCount: true,
        topicId: true,
        createdAt: true,
        updatedAt: true,
        topic: {
          select: {
            id: true,
            name: true,
            lessonId: true,
            lesson: {
              select: {
                id: true,
                name: true,
                teacherId: true,
              },
            },
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
        data: resources,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[ResourceList]', `Failed to fetch resources: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to fetch resources: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/resources
 * Create a new resource (Teacher only)
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { name, topicId, questionCount } = createResourceSchema.parse(body);

    // Verify topic exists and belongs to current teacher (or is global)
    const topic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        lesson: {
          OR: [
            { teacherId: user.userId }, // Tenant isolation: current teacher's lessons
            { teacherId: null }, // Global lessons accessible to all teachers
          ],
        },
      },
    });

    if (!topic) {
      statusCode = 403; // Forbidden - topic doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ResourceCreation]',
        `Topic not found or access denied: ${topicId}`,
        new Error('Topic not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Topic not found or access denied' },
        { status: 403 }
      );
    }

    // Create resource
    const resource = await prisma.resource.create({
      data: {
        name,
        topicId,
        questionCount,
      },
      select: {
        id: true,
        name: true,
        description: true,
        questionCount: true,
        topicId: true,
        createdAt: true,
        updatedAt: true,
        topic: {
          select: {
            id: true,
            name: true,
            lessonId: true,
            lesson: {
              select: {
                id: true,
                name: true,
                teacherId: true,
              },
            },
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
        data: resource,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[ResourceCreation]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[ResourceCreation]', `Failed to create resource: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to create resource: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);
export const POST = withRole(UserRole.TEACHER, POSTHandler);

