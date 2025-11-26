import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { hashPassword, validatePassword } from '@/lib/auth';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const createStudentSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * GET /api/teacher/students
 * List all students for current teacher (teacher-scoped)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Fetch all students belonging to current teacher (tenant isolation)
    const students = await prisma.user.findMany({
      where: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: students,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[StudentList]', 'Failed to fetch students', error, request);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/students
 * Create a new student account (Teacher only)
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { username, password } = createStudentSchema.parse(body);

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[StudentCreation]',
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

    // Check if username already exists within tenant scope
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        teacherId: user.userId, // Tenant isolation: check uniqueness within tenant
      },
    });

    if (existingUser) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[StudentCreation]',
        `Failed to create student: username already exists within tenant - ${username}`,
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

    // Create student account with tenant isolation
    const student = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: UserRole.STUDENT,
        teacherId: user.userId, // Tenant isolation: set to current teacher's ID
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
      logApiError('[StudentCreation]', 'Validation error', error, request);
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
        '[StudentCreation]',
        `Failed to create student: username already exists`,
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
      '[StudentCreation]',
      'Failed to create student',
      error,
      request
    );
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);
export const POST = withRole(UserRole.TEACHER, POSTHandler);




