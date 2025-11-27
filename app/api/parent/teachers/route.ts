import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';

/**
 * GET /api/parent/teachers
 * Get teachers of parent's children (with tenant isolation)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Get parent's children via ParentStudent relationship
    const parentStudents = await prisma.parentStudent.findMany({
      where: { parentId: user.userId },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            teacherId: true,
          },
        },
      },
    });

    if (parentStudents.length === 0) {
      statusCode = 200;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        {
          success: true,
          data: [],
        },
        { status: 200 }
      );
    }

    // Get unique teacher IDs
    const teacherIds = parentStudents
      .map((ps) => ps.student.teacherId)
      .filter((id): id is string => id !== null);

    if (teacherIds.length === 0) {
      statusCode = 200;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        {
          success: true,
          data: [],
        },
        { status: 200 }
      );
    }

    // Fetch teacher users
    const teachers = await prisma.user.findMany({
      where: {
        id: { in: teacherIds },
        role: UserRole.TEACHER,
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: teachers,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[ParentTeachers]', `Failed to fetch teachers: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to fetch teachers: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export const GET = withRole(UserRole.PARENT, GETHandler);

