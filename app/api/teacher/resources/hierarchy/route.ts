import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';

/**
 * GET /api/teacher/resources/hierarchy
 * Get hierarchical structure: lessons with topics and resources
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

    // Transform to hierarchical structure
    const hierarchy = lessons.map((lesson) => ({
      id: lesson.id,
      name: lesson.name,
      teacherId: lesson.teacherId,
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
    logApiError(
      '[ResourceHierarchy]',
      'Failed to fetch resource hierarchy',
      error,
      request
    );
    return NextResponse.json(
      { error: 'Failed to fetch resource hierarchy' },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);

