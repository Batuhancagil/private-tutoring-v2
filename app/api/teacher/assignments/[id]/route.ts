import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError, logInfo } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { invalidateDualMetricsCache } from '@/lib/progress-calculator';
import { calculateEndDate } from '@/lib/utils';
import { z } from 'zod';

const updateAssignmentSchema = z.object({
  startDate: z.string().datetime({ message: 'Start date must be a valid ISO 8601 datetime' }).optional(),
  endDate: z.string().datetime({ message: 'End date must be a valid ISO 8601 datetime' }).optional(),
  questionCount: z.number().int().positive('Question count must be positive').optional(),
  dailyTarget: z.number().int().positive('Daily target must be positive').optional(),
  resourceId: z.string().nullable().optional(),
  examMode: z.boolean().optional(),
});

/**
 * GET /api/teacher/assignments/[id]
 * Get single assignment detail (Teacher only)
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
    const assignmentId = params.id;

    // Fetch assignment with tenant isolation check
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        // Tenant isolation: assignment must belong to current teacher's student
        student: {
          teacherId: user.userId,
        },
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

    if (!assignment) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[AssignmentDetail]',
        `Assignment not found or access denied: ${assignmentId}`,
        new Error('Assignment not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[AssignmentDetail]', `Failed to fetch assignment: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to fetch assignment: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/assignments/[id]
 * Update assignment (Teacher only)
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
    const assignmentId = params.id;
    const body = await request.json();
    const validatedData = updateAssignmentSchema.parse(body);

    // Verify assignment exists and belongs to current teacher's student (tenant isolation)
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        student: {
          teacherId: user.userId,
        },
      },
    });

    if (!existingAssignment) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[AssignmentUpdate]',
        `Assignment not found or access denied: ${assignmentId}`,
        new Error('Assignment not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Handle date updates
    if (validatedData.startDate !== undefined) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = new Date(validatedData.endDate);
    }

    // Handle question count and daily target updates
    if (validatedData.questionCount !== undefined) {
      updateData.questionCount = validatedData.questionCount;
    }
    if (validatedData.dailyTarget !== undefined) {
      updateData.dailyTarget = validatedData.dailyTarget;
    }

    // Handle resource update
    if (validatedData.resourceId !== undefined) {
      updateData.resourceId = validatedData.resourceId;
    }

    // Handle exam mode update
    if (validatedData.examMode !== undefined) {
      updateData.examMode = validatedData.examMode;
    }

    // Recalculate end date if start date, question count, or daily target changes
    if (validatedData.startDate !== undefined || validatedData.questionCount !== undefined || validatedData.dailyTarget !== undefined) {
      const startDate = updateData.startDate || existingAssignment.startDate;
      const questionCount = updateData.questionCount || existingAssignment.questionCount;
      const dailyTarget = updateData.dailyTarget || existingAssignment.dailyTarget;
      
      updateData.endDate = calculateEndDate(startDate, questionCount, dailyTarget);
    }

    // Prevent date changes for exam mode assignments (AC: 7)
    if (existingAssignment.examMode && (validatedData.startDate !== undefined || validatedData.endDate !== undefined)) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[AssignmentUpdate]',
        'Cannot change dates for exam mode assignment',
        new Error('Exam mode restriction'),
        request
      );
      return NextResponse.json(
        { error: 'Cannot change dates for exam mode assignment. Exam mode assignments have fixed deadlines.' },
        { status: 400 }
      );
    }

    // Validate date range if both dates are provided
    if (updateData.startDate && updateData.endDate) {
      if (updateData.endDate < updateData.startDate) {
        statusCode = 400;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        logApiError(
          '[AssignmentUpdate]',
          'Invalid date range: end date must be after start date',
          new Error('Invalid date range'),
          request
        );
        return NextResponse.json(
          { error: 'Invalid date range: end date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Update assignment
    const assignment = await prisma.assignment.update({
      where: {
        id: assignmentId,
      },
      data: updateData,
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

    // Invalidate dual metrics cache since assignment changes affect program progress
    // (questionCount changes affect total assigned, which affects program progress calculation)
    try {
      invalidateDualMetricsCache(assignment.studentId);
    } catch (cacheError) {
      // Log but don't fail the request if cache invalidation fails
      logApiError(
        '[AssignmentUpdate]',
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
      logApiError('[AssignmentUpdate]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[AssignmentUpdate]', `Failed to update assignment: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to update assignment: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/assignments/[id]
 * Delete assignment (Teacher only)
 * Cascade delete: ProgressLogs deleted automatically via Prisma cascade
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
    const assignmentId = params.id;

    // Verify assignment exists and belongs to current teacher's student (tenant isolation)
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        student: {
          teacherId: user.userId,
        },
      },
    });

    if (!assignment) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[AssignmentDelete]',
        `Assignment not found or access denied: ${assignmentId}`,
        new Error('Assignment not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      );
    }

    // Delete assignment (ProgressLogs cascade deleted automatically)
    await prisma.assignment.delete({
      where: {
        id: assignmentId,
      },
    });

    // Invalidate dual metrics cache since assignment deletion affects program progress
    try {
      invalidateDualMetricsCache(assignment.studentId);
    } catch (cacheError) {
      // Log but don't fail the request if cache invalidation fails
      logApiError(
        '[AssignmentDelete]',
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
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[AssignmentDelete]', `Failed to delete assignment: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to delete assignment: ${errorMessage}` },
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

