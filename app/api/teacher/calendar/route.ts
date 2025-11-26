import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const calendarQuerySchema = z.object({
  startDate: z.string().datetime({ message: 'Start date must be a valid ISO 8601 datetime' }),
  endDate: z.string().datetime({ message: 'End date must be a valid ISO 8601 datetime' }),
  studentId: z.string().optional(),
});

/**
 * GET /api/teacher/calendar
 * Get assignments for calendar view (date range with tenant isolation)
 * Query params: ?startDate=ISO8601&endDate=ISO8601&studentId=xxx (optional)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Get and validate query parameters
    const startDateParam = request.nextUrl.searchParams.get('startDate');
    const endDateParam = request.nextUrl.searchParams.get('endDate');
    const studentIdParam = request.nextUrl.searchParams.get('studentId');

    if (!startDateParam || !endDateParam) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'startDate and endDate query parameters are required' },
        { status: 400 }
      );
    }

    // Validate query parameters
    const validatedParams = calendarQuerySchema.parse({
      startDate: startDateParam,
      endDate: endDateParam,
      studentId: studentIdParam || undefined,
    });

    // Build filter conditions
    const where: any = {
      // Tenant isolation: only assignments for current teacher's students
      student: {
        teacherId: user.userId,
      },
      // Date range filter: assignments that overlap with the requested range
      OR: [
        // Assignment starts within range
        {
          startDate: {
            gte: new Date(validatedParams.startDate),
            lte: new Date(validatedParams.endDate),
          },
        },
        // Assignment ends within range
        {
          endDate: {
            gte: new Date(validatedParams.startDate),
            lte: new Date(validatedParams.endDate),
          },
        },
        // Assignment spans the entire range
        {
          AND: [
            { startDate: { lte: new Date(validatedParams.startDate) } },
            { endDate: { gte: new Date(validatedParams.endDate) } },
          ],
        },
      ],
    };

    // Add optional student filter
    if (validatedParams.studentId) {
      where.studentId = validatedParams.studentId;
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

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: assignments,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[Calendar]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[Calendar]', `Failed to fetch calendar assignments: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to fetch calendar assignments: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);

