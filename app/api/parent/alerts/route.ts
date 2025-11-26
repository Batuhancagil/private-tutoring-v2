import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  studentId: z.string().optional(),
  resolved: z.enum(['true', 'false']).optional(),
});

/**
 * GET /api/parent/alerts
 * Get low accuracy alerts for parent's children
 * Query params: ?studentId=xxx (optional), ?resolved=true/false (optional, default false)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { studentId, resolved } = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    // Get parent's children via ParentStudent relationship (tenant isolation)
    const parentStudents = await prisma.parentStudent.findMany({
      where: {
        parentId: user.userId,
        ...(studentId && { studentId }),
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (parentStudents.length === 0) {
      statusCode = 200;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        {
          success: true,
          data: [],
        },
        { status: 200 }
      );
    }

    const studentIds = parentStudents.map((ps) => ps.studentId);

    // Query alerts for parent's children
    // Filter by resolved status (default to unresolved only)
    const resolvedFilter = resolved === 'true';

    const alerts = await prisma.accuracyAlert.findMany({
      where: {
        studentId: { in: studentIds },
        resolved: resolvedFilter,
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
          },
        },
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
        lesson: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group alerts by child for easier frontend consumption
    const alertsByChild = parentStudents.map((ps) => {
      const childAlerts = alerts.filter((alert) => alert.studentId === ps.studentId);
      return {
        child: {
          id: ps.student.id,
          username: ps.student.username,
        },
        alerts: childAlerts.map((alert) => ({
          id: alert.id,
          topicId: alert.topicId,
          topicName: alert.topic?.name || null,
          lessonId: alert.lessonId,
          lessonName: alert.lesson?.name || null,
          accuracy: alert.accuracy,
          threshold: alert.threshold,
          resolved: alert.resolved,
          resolvedAt: alert.resolvedAt,
          createdAt: alert.createdAt,
        })),
      };
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: alertsByChild,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      logApiError('[ParentAlertsGet]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[ParentAlertsGet]',
      `Failed to fetch parent alerts: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch parent alerts: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.PARENT, GETHandler);

