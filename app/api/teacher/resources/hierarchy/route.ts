import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';

// Force dynamic rendering since this route uses cookies for authentication
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/teacher/resources/hierarchy
 * Get hierarchical structure: lessons with topics and resources
 * Query params: ?scope=all|global|custom (default: all)
 * Returns both global (teacherId=null) and custom (teacherId=teacher's ID) lessons
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Get scope filter from query params (default: 'all')
    const scope = request.nextUrl.searchParams.get('scope') || 'all';

    // Build where clause based on scope
    let whereClause: { teacherId?: string | null } | { OR: Array<{ teacherId: string | null }> } =
      {};

    if (scope === 'global') {
      // Only global lessons (teacherId=null)
      whereClause = { teacherId: null };
    } else if (scope === 'custom') {
      // Only custom lessons (teacherId=teacher's ID)
      whereClause = { teacherId: user.userId };
    } else {
      // All lessons: both global (teacherId=null) and custom (teacherId=teacher's ID)
      whereClause = {
        OR: [
          { teacherId: null },
          { teacherId: user.userId },
        ],
      };
    }

    // Fetch all lessons (global and custom) with their topics and resources
    const lessons = await prisma.lesson.findMany({
      where: whereClause,
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

    // Transform to hierarchical structure with isGlobal indicator
    const hierarchy = lessons.map((lesson) => ({
      id: lesson.id,
      name: lesson.name,
      teacherId: lesson.teacherId,
      isGlobal: lesson.teacherId === null, // Mark global resources
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      topics: lesson.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        lessonId: topic.lessonId,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
        resources: topic.resources,
      })),
    }));

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: { lessons: hierarchy },
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[ResourceHierarchy]',
      `Failed to fetch resource hierarchy: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch resource hierarchy: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);

