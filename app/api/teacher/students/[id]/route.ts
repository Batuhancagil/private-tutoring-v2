import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { hashPassword, validatePassword } from '@/lib/auth';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const updateStudentSchema = z.object({
  username: z.string().min(1, 'Username is required').optional(),
  password: z.string().min(1, 'Password is required').optional(),
});

/**
 * GET /api/teacher/students/[id]
 * Get student details (with tenant check)
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
    // Find student with tenant isolation check
    const student = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: UserRole.STUDENT,
        teacherId: user.userId, // Tenant isolation: only current teacher's students
      },
      select: {
        id: true,
        username: true,
        role: true,
        teacherId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!student) {
      statusCode = 403; // Forbidden - student doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[StudentDetail]',
        `Student not found or access denied: ${params.id}`,
        new Error('Student not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      );
    }

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: student,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[StudentDetail]', 'Failed to fetch student', error, request);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/students/[id]
 * Update student account (with tenant validation)
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
    // Check if student exists and belongs to current teacher (tenant isolation)
    const existingStudent = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: UserRole.STUDENT,
        teacherId: user.userId, // Tenant isolation: only current teacher's students
      },
    });

    if (!existingStudent) {
      statusCode = 403; // Forbidden - student doesn't belong to this teacher
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[StudentUpdate]',
        `Student not found or access denied: ${params.id}`,
        new Error('Student not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData = updateStudentSchema.parse(body);

    // If username is being updated, check for uniqueness within tenant scope
    if (updateData.username && updateData.username !== existingStudent.username) {
      const usernameExists = await prisma.user.findFirst({
        where: {
          username: updateData.username,
          teacherId: user.userId, // Tenant isolation: check uniqueness within tenant
          id: { not: params.id }, // Exclude current student from uniqueness check
        },
      });

      if (usernameExists) {
        statusCode = 400;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        logApiError(
          '[StudentUpdate]',
          `Username already exists within tenant: ${updateData.username}`,
          new Error('Username already exists'),
          request
        );
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }
    }

    // If password is being updated, validate and hash it
    let hashedPassword = existingStudent.password;
    if (updateData.password) {
      const passwordValidation = validatePassword(updateData.password);
      if (!passwordValidation.valid) {
        statusCode = 400;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        logApiError(
          '[StudentUpdate]',
          'Password validation failed',
          new Error(passwordValidation.errors.join(', ')),
          request
        );
        return NextResponse.json(
          {
            error: 'Password validation failed',
            details: passwordValidation.errors,
          },
          { status: 400 }
        );
      }
      hashedPassword = await hashPassword(updateData.password);
    }

    // Update student
    const updatePayload: {
      username?: string;
      password: string;
    } = {
      password: hashedPassword,
    };

    if (updateData.username) {
      updatePayload.username = updateData.username;
    }

    const student = await prisma.user.update({
      where: { id: params.id },
      data: updatePayload,
      select: {
        id: true,
        username: true,
        role: true,
        teacherId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: student,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[StudentUpdate]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[StudentUpdate]',
        `Failed to update student: username already exists`,
        error,
        request
      );
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[StudentUpdate]', 'Failed to update student', error, request);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/students/[id]
 * Delete student account (with tenant validation)
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
    // Check if student exists and belongs to current teacher (tenant isolation)
    const existingStudent = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: UserRole.STUDENT,
        teacherId: user.userId, // Tenant isolation: only current teacher's students
      },
    });

    if (!existingStudent) {
      statusCode = 403; // Forbidden - student doesn't belong to this teacher
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[StudentDelete]',
        `Student not found or access denied: ${params.id}`,
        new Error('Student not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      );
    }

    // Delete student (cascade deletes will handle related records)
    await prisma.user.delete({
      where: { id: params.id },
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
    logApiError('[StudentDelete]', 'Failed to delete student', error, request);
    return NextResponse.json(
      { error: 'Failed to delete student' },
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

