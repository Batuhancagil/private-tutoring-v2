import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { hashPassword, validatePassword } from '@/lib/auth';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const createTeacherSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * GET /api/admin/teachers
 * List all teachers (Superadmin only)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Fetch all teachers (role = TEACHER)
    const teachers = await prisma.user.findMany({
      where: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response with subscription status
    const teachersWithStatus = teachers.map((teacher) => {
      const subscription = teacher.subscriptions[0];
      const now = new Date();
      const isActive =
        subscription &&
        new Date(subscription.startDate) <= now &&
        new Date(subscription.endDate) >= now;

      return {
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
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: teachersWithStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[TeacherList]', 'Failed to fetch teachers', error, request);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/teachers
 * Create a new teacher account (Superadmin only)
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { username, password } = createTeacherSchema.parse(body);

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[TeacherCreation]',
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

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[TeacherCreation]',
        `Failed to create teacher: username already exists - ${username}`,
        new Error('Username already exists'),
        request
      );
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create teacher account
    // Teachers are tenants themselves, so teacherId = null
    const teacher = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: UserRole.TEACHER,
        teacherId: null, // Teachers are tenants themselves
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
      logApiError('[TeacherCreation]', 'Validation error', error, request);
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
        '[TeacherCreation]',
        `Failed to create teacher: username already exists`,
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
    logApiError(
      '[TeacherCreation]',
      'Failed to create teacher',
      error,
      request
    );
    return NextResponse.json(
      { error: 'Failed to create teacher' },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
export const GET = withRole(UserRole.SUPERADMIN, GETHandler);
export const POST = withRole(UserRole.SUPERADMIN, POSTHandler);

