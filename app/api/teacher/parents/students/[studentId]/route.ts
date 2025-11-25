import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';

/**
 * GET /api/teacher/parents/students/[studentId]
 * Get all parents for a specific student (with tenant check)
 */
async function GETHandler(
  request: NextRequest,
  user: any,
  { params }: { params: { studentId: string } }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Verify student exists and belongs to current teacher (tenant isolation)
    const student = await prisma.user.findFirst({
      where: {
        id: params.studentId,
        role: UserRole.STUDENT,
        teacherId: user.userId, // Tenant isolation: only current teacher's students
      },
    });

    if (!student) {
      statusCode = 403; // Forbidden - student doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[GetParentsForStudent]',
        `Student not found or access denied: ${params.studentId}`,
        new Error('Student not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      );
    }

    // Fetch all parents for this student
    const parentStudents = await prisma.parentStudent.findMany({
      where: {
        studentId: params.studentId,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Extract parent users
    const parents = parentStudents.map((ps) => ps.parent);

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
    logApiError(
      '[GetParentsForStudent]',
      'Failed to fetch parents for student',
      error,
      request
    );
    return NextResponse.json(
      { error: 'Failed to fetch parents for student' },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
// Note: Next.js dynamic route params need to be handled differently
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  return withRole(UserRole.TEACHER, async (req, user) =>
    GETHandler(req, user, { params: await params })
  )(request);
}

