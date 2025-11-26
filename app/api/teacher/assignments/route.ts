import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { invalidateDualMetricsCache } from '@/lib/progress-calculator';
import { calculateEndDate } from '@/lib/utils';
import { z } from 'zod';

const createAssignmentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  topicId: z.string().min(1, 'Topic ID is required'),
  resourceId: z.string().optional(),
  startDate: z.string().datetime({ message: 'Start date must be a valid ISO 8601 datetime' }),
  questionCount: z.number().int().positive('Question count must be positive'),
  dailyTarget: z.number().int().positive('Daily target must be positive').default(100),
  examMode: z.boolean().default(false),
});

/**
 * GET /api/teacher/assignments
 * List all assignments for current teacher's students (tenant-scoped)
 * Query params: ?studentId=xxx&topicId=xxx&startDate=xxx&endDate=xxx&endDateBefore=xxx
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Get query parameters
    const studentId = request.nextUrl.searchParams.get('studentId');
    const topicId = request.nextUrl.searchParams.get('topicId');
    const startDateParam = request.nextUrl.searchParams.get('startDate');
    const endDateParam = request.nextUrl.searchParams.get('endDate');
    const endDateBeforeParam = request.nextUrl.searchParams.get('endDateBefore'); // For past assignment filtering

    // Build filter conditions
    const where: any = {
      // Tenant isolation: only assignments for current teacher's students
      student: {
        teacherId: user.userId,
      },
    };

    // Add optional filters
    if (studentId) {
      where.studentId = studentId;
    }
    if (topicId) {
      where.topicId = topicId;
    }
    if (startDateParam) {
      where.startDate = { gte: new Date(startDateParam) };
    }
    if (endDateParam) {
      where.endDate = { lte: new Date(endDateParam) };
    }
    // Past assignment filtering: endDateBefore filters assignments with endDate < endDateBefore
    if (endDateBeforeParam) {
      where.endDate = { ...where.endDate, lt: new Date(endDateBeforeParam) };
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
        startDate: 'desc',
      },
    });

    // Add computed isPast field to each assignment
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    const assignmentsWithIsPast = assignments.map((assignment) => {
      const endDate = new Date(assignment.endDate);
      endDate.setHours(0, 0, 0, 0);
      return {
        ...assignment,
        isPast: endDate < today,
      };
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: assignmentsWithIsPast,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[AssignmentList]', `Failed to fetch assignments: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to fetch assignments: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/assignments
 * Create a new assignment (Teacher only)
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const validatedData = createAssignmentSchema.parse(body);

    // Verify student exists and belongs to current teacher (tenant isolation)
    const student = await prisma.user.findFirst({
      where: {
        id: validatedData.studentId,
        role: UserRole.STUDENT,
        teacherId: user.userId, // Tenant isolation: student must belong to current teacher
      },
    });

    if (!student) {
      statusCode = 403; // Forbidden - student doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[AssignmentCreation]',
        `Student not found or access denied: ${validatedData.studentId}`,
        new Error('Student not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      );
    }

    // Verify topic exists and is accessible (global or teacher's custom topic)
    const topic = await prisma.topic.findFirst({
      where: {
        id: validatedData.topicId,
        lesson: {
          OR: [
            { teacherId: user.userId }, // Tenant isolation: current teacher's topics
            { teacherId: null }, // Global topics accessible to all teachers
          ],
        },
      },
    });

    if (!topic) {
      statusCode = 403; // Forbidden - topic doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[AssignmentCreation]',
        `Topic not found or access denied: ${validatedData.topicId}`,
        new Error('Topic not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Topic not found or access denied' },
        { status: 403 }
      );
    }

    // Verify resource if provided
    if (validatedData.resourceId) {
      const resource = await prisma.resource.findFirst({
        where: {
          id: validatedData.resourceId,
          topicId: validatedData.topicId, // Resource must belong to selected topic
          topic: {
            lesson: {
              OR: [
                { teacherId: user.userId },
                { teacherId: null },
              ],
            },
          },
        },
      });

      if (!resource) {
        statusCode = 403; // Forbidden - resource doesn't belong to selected topic or doesn't exist
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        logApiError(
          '[AssignmentCreation]',
          `Resource not found or access denied: ${validatedData.resourceId}`,
          new Error('Resource not found or access denied'),
          request
        );
        return NextResponse.json(
          { error: 'Resource not found or access denied' },
          { status: 403 }
        );
      }
    }

    // Parse start date
    const startDate = new Date(validatedData.startDate);

    // Calculate end date using helper function
    const endDate = calculateEndDate(
      startDate,
      validatedData.questionCount,
      validatedData.dailyTarget
    );

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        studentId: validatedData.studentId,
        topicId: validatedData.topicId,
        resourceId: validatedData.resourceId || null,
        startDate,
        endDate,
        questionCount: validatedData.questionCount,
        dailyTarget: validatedData.dailyTarget,
        examMode: validatedData.examMode,
      },
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
    });

    // Invalidate dual metrics cache since assignment count affects program progress
    try {
      invalidateDualMetricsCache(validatedData.studentId);
    } catch (cacheError) {
      // Log but don't fail the request if cache invalidation fails
      logApiError(
        '[AssignmentCreation]',
        'Failed to invalidate dual metrics cache',
        cacheError instanceof Error ? cacheError : new Error('Unknown cache error'),
        request
      );
    }

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: assignment,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[AssignmentCreation]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[AssignmentCreation]', `Failed to create assignment: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to create assignment: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);
export const POST = withRole(UserRole.TEACHER, POSTHandler);

