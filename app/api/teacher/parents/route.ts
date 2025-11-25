import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { hashPassword, validatePassword } from '@/lib/auth';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const createParentSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * GET /api/teacher/parents
 * List all parents for current teacher (teacher-scoped via students)
 * Parents are identified through ParentStudent relationships with teacher's students
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Fetch all parents that are linked to current teacher's students via ParentStudent
    // This ensures tenant isolation: only parents linked to this teacher's students
    const parentStudents = await prisma.parentStudent.findMany({
      where: {
        student: {
          teacherId: user.userId, // Tenant isolation: only students belonging to current teacher
        },
      },
      include: {
        parent: {
          select: {
            id: true,
            username: true,
            role: true,
            teacherId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // Extract unique parents (one parent can be linked to multiple students)
    const parentMap = new Map();
    parentStudents.forEach((ps) => {
      if (!parentMap.has(ps.parent.id)) {
        parentMap.set(ps.parent.id, ps.parent);
      }
    });

    const parents = Array.from(parentMap.values());

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: parents,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[ParentList]', 'Failed to fetch parents', error, request);
    return NextResponse.json(
      { error: 'Failed to fetch parents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/parents
 * Create a new parent account (Teacher only)
 * Note: Parent's teacherId will be set when they are assigned to a student
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { username, password } = createParentSchema.parse(body);

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ParentCreation]',
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

    // Check if username already exists (global uniqueness)
    const existingUser = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (existingUser) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ParentCreation]',
        `Failed to create parent: username already exists - ${username}`,
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

    // Create parent account
    // Note: teacherId will be inherited from student relationship when parent is assigned
    // For now, we can set it to current teacher's ID for tenant scope
    const parent = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: UserRole.PARENT,
        teacherId: user.userId, // Set tenant scope to current teacher
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
        data: parent,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[ParentCreation]', 'Validation error', error, request);
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
        '[ParentCreation]',
        `Failed to create parent: username already exists`,
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
      '[ParentCreation]',
      'Failed to create parent',
      error,
      request
    );
    return NextResponse.json(
      { error: 'Failed to create parent' },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);
export const POST = withRole(UserRole.TEACHER, POSTHandler);

