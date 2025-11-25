import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { hashPassword, validatePassword } from '@/lib/auth';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const updateTeacherSchema = z.object({
  username: z.string().min(1, 'Username is required').optional(),
  password: z.string().min(1, 'Password is required').optional(),
});

/**
 * GET /api/admin/teachers/[id]
 * Get teacher details (Superadmin only)
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
    const teacher = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: UserRole.TEACHER,
      },
      select: {
        id: true,
        username: true,
        role: true,
        teacherId: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
          take: 1,
          orderBy: {
            endDate: 'desc',
          },
        },
      },
    });

    if (!teacher) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[TeacherDetail]',
        `Teacher not found: ${params.id}`,
        new Error('Teacher not found'),
        request
      );
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Format response with subscription status
    const subscription = teacher.subscriptions[0];
    const now = new Date();
    const isActive =
      subscription &&
      new Date(subscription.startDate) <= now &&
      new Date(subscription.endDate) >= now;

    const teacherWithStatus = {
      id: teacher.id,
      username: teacher.username,
      role: teacher.role,
      teacherId: teacher.teacherId,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      subscriptionStatus: subscription
        ? isActive
          ? 'active'
          : 'expired'
        : 'none',
      subscriptionEndDate: subscription?.endDate || null,
    };

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: teacherWithStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[TeacherDetail]', 'Failed to fetch teacher', error, request);
    return NextResponse.json(
      { error: 'Failed to fetch teacher' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/teachers/[id]
 * Update teacher account (Superadmin only)
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
    // Check if teacher exists
    const existingTeacher = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: UserRole.TEACHER,
      },
    });

    if (!existingTeacher) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[TeacherUpdate]',
        `Teacher not found: ${params.id}`,
        new Error('Teacher not found'),
        request
      );
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData = updateTeacherSchema.parse(body);

    // If username is being updated, check for uniqueness
    if (updateData.username && updateData.username !== existingTeacher.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: updateData.username },
      });

      if (usernameExists) {
        statusCode = 400;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        logApiError(
          '[TeacherUpdate]',
          `Username already exists: ${updateData.username}`,
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
    let hashedPassword = existingTeacher.password;
    if (updateData.password) {
      const passwordValidation = validatePassword(updateData.password);
      if (!passwordValidation.valid) {
        statusCode = 400;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        logApiError(
          '[TeacherUpdate]',
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

    // Update teacher
    const updatePayload: {
      username?: string;
      password: string;
    } = {
      password: hashedPassword,
    };

    if (updateData.username) {
      updatePayload.username = updateData.username;
    }

    const teacher = await prisma.user.update({
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
        data: teacher,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[TeacherUpdate]', 'Validation error', error, request);
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
        '[TeacherUpdate]',
        `Failed to update teacher: username already exists`,
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
    logApiError('[TeacherUpdate]', 'Failed to update teacher', error, request);
    return NextResponse.json(
      { error: 'Failed to update teacher' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/teachers/[id]
 * Delete teacher account (Superadmin only)
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
    // Check if teacher exists
    const existingTeacher = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: UserRole.TEACHER,
      },
    });

    if (!existingTeacher) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[TeacherDelete]',
        `Teacher not found: ${params.id}`,
        new Error('Teacher not found'),
        request
      );
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Delete teacher (cascade deletes will handle related records)
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
    logApiError('[TeacherDelete]', 'Failed to delete teacher', error, request);
    return NextResponse.json(
      { error: 'Failed to delete teacher' },
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
  return withRole(UserRole.SUPERADMIN, async (req, user) =>
    GETHandler(req, user, { params: await params })
  )(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.SUPERADMIN, async (req, user) =>
    PUTHandler(req, user, { params: await params })
  )(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.SUPERADMIN, async (req, user) =>
    DELETEHandler(req, user, { params: await params })
  )(request);
}

