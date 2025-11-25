import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const assignParentSchema = z.object({
  parentId: z.string().min(1, 'Parent ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
});

/**
 * POST /api/teacher/parents/assign
 * Create ParentStudent relationship (assign parent to student)
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { parentId, studentId } = assignParentSchema.parse(body);

    // Verify student exists and belongs to current teacher (tenant isolation)
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: UserRole.STUDENT,
        teacherId: user.userId, // Tenant isolation: only current teacher's students
      },
    });

    if (!student) {
      statusCode = 403; // Forbidden - student doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ParentAssignment]',
        `Student not found or access denied: ${studentId}`,
        new Error('Student not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      );
    }

    // Verify parent exists and has PARENT role
    const parent = await prisma.user.findFirst({
      where: {
        id: parentId,
        role: UserRole.PARENT,
      },
    });

    if (!parent) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ParentAssignment]',
        `Parent not found: ${parentId}`,
        new Error('Parent not found'),
        request
      );
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    // Check if relationship already exists (unique constraint)
    const existingRelationship = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
    });

    if (existingRelationship) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ParentAssignment]',
        `Parent-student relationship already exists: ${parentId} -> ${studentId}`,
        new Error('Relationship already exists'),
        request
      );
      return NextResponse.json(
        { error: 'Parent is already assigned to this student' },
        { status: 400 }
      );
    }

    // Create ParentStudent relationship
    const parentStudent = await prisma.parentStudent.create({
      data: {
        parentId,
        studentId,
      },
      include: {
        parent: {
          select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
          },
        },
        student: {
          select: {
            id: true,
            username: true,
            role: true,
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
        data: {
          id: parentStudent.id,
          parentId: parentStudent.parentId,
          studentId: parentStudent.studentId,
          createdAt: parentStudent.createdAt,
          parent: parentStudent.parent,
          student: parentStudent.student,
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
      logApiError('[ParentAssignment]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint violation
    if (
      error instanceof Error &&
      (error.message.includes('Unique constraint') ||
        error.message.includes('parentId_studentId'))
    ) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ParentAssignment]',
        `Failed to assign parent: relationship already exists`,
        error,
        request
      );
      return NextResponse.json(
        { error: 'Parent is already assigned to this student' },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[ParentAssignment]', 'Failed to assign parent', error, request);
    return NextResponse.json(
      { error: 'Failed to assign parent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/parents/assign
 * Remove ParentStudent relationship (unassign parent from student)
 */
async function DELETEHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { parentId, studentId } = assignParentSchema.parse(body);

    // Verify student exists and belongs to current teacher (tenant isolation)
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: UserRole.STUDENT,
        teacherId: user.userId, // Tenant isolation: only current teacher's students
      },
    });

    if (!student) {
      statusCode = 403; // Forbidden - student doesn't belong to this teacher
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ParentUnassignment]',
        `Student not found or access denied: ${studentId}`,
        new Error('Student not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      );
    }

    // Find and delete the relationship
    const relationship = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
    });

    if (!relationship) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ParentUnassignment]',
        `Parent-student relationship not found: ${parentId} -> ${studentId}`,
        new Error('Relationship not found'),
        request
      );
      return NextResponse.json(
        { error: 'Parent-student relationship not found' },
        { status: 404 }
      );
    }

    // Delete the relationship
    await prisma.parentStudent.delete({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
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

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[ParentUnassignment]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError(
      '[ParentUnassignment]',
      'Failed to unassign parent',
      error,
      request
    );
    return NextResponse.json(
      { error: 'Failed to unassign parent' },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
export const POST = withRole(UserRole.TEACHER, POSTHandler);
export const DELETE = withRole(UserRole.TEACHER, DELETEHandler);

