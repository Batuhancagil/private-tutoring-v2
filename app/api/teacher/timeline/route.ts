import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const timelineQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  studentId: z.string().optional(),
  viewType: z.enum(['daily', 'weekly', 'monthly']).optional().default('weekly'),
});

/**
 * GET /api/teacher/timeline
 * Get assignments formatted for timeline display (Teacher only)
 * Query params: ?startDate=ISO8601&endDate=ISO8601&studentId=xxx&viewType=daily|weekly|monthly
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Parse and validate query parameters
    const startDateParam = request.nextUrl.searchParams.get('startDate');
    const endDateParam = request.nextUrl.searchParams.get('endDate');
    const studentIdParam = request.nextUrl.searchParams.get('studentId');
    const viewTypeParam = request.nextUrl.searchParams.get('viewType') || 'weekly';

    const validatedParams = timelineQuerySchema.parse({
      startDate: startDateParam || undefined,
      endDate: endDateParam || undefined,
      studentId: studentIdParam || undefined,
      viewType: viewTypeParam,
    });

    // Build filter conditions with tenant isolation
    const where: any = {
      // Tenant isolation: only assignments for current teacher's students
      student: {
        teacherId: user.userId,
      },
    };

    // Add optional filters
    if (validatedParams.studentId) {
      where.studentId = validatedParams.studentId;
    }

    // Date range filtering
    if (validatedParams.startDate) {
      where.startDate = { gte: new Date(validatedParams.startDate) };
    }
    if (validatedParams.endDate) {
      where.endDate = { lte: new Date(validatedParams.endDate) };
    }

    // If no date range provided, default to 3 months from now
    if (!validatedParams.startDate && !validatedParams.endDate) {
      const now = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(now.getMonth() + 3);

      where.startDate = { gte: threeMonthsAgo };
      where.endDate = { lte: threeMonthsLater };
    }

    // Fetch assignments with relations
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        topic: {
          select: {
            id: true,
            name: true,
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
        startDate: 'asc',
      },
    });

    // Calculate date range for response
    let dateRange = { start: '', end: '' };
    if (assignments.length > 0) {
      const dates = assignments.flatMap((a) => [
        new Date(a.startDate),
        new Date(a.endDate),
      ]);
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
      dateRange = {
        start: minDate.toISOString(),
        end: maxDate.toISOString(),
      };
    } else if (validatedParams.startDate && validatedParams.endDate) {
      dateRange = {
        start: validatedParams.startDate,
        end: validatedParams.endDate,
      };
    } else {
      // Default range if no assignments and no params
      const now = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(now.getMonth() + 3);
      dateRange = {
        start: threeMonthsAgo.toISOString(),
        end: threeMonthsLater.toISOString(),
      };
    }

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: {
          assignments,
          dateRange,
          viewType: validatedParams.viewType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[TimelineLoad]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[TimelineLoad]',
      `Failed to load timeline: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to load timeline: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);

