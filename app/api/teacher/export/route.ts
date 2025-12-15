import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/teacher/export
 * Export all tenant data for a teacher (GDPR compliance)
 * Returns JSON export of all data associated with the teacher's tenant
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const teacherId = user.userId;

    // Export all tenant data
    const exportData = {
      exportDate: new Date().toISOString(),
      teacher: {
        id: user.userId,
        username: user.username,
        role: user.role,
      },
      students: await prisma.user.findMany({
        where: {
          role: UserRole.STUDENT,
          teacherId,
        },
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      assignments: await prisma.assignment.findMany({
        where: {
          student: {
            teacherId,
          },
        },
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              lesson: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      progressLogs: await prisma.progressLog.findMany({
        where: {
          student: {
            teacherId,
          },
        },
        select: {
          id: true,
          studentId: true,
          assignmentId: true,
          date: true,
          rightCount: true,
          wrongCount: true,
          emptyCount: true,
          bonusCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      resources: await prisma.resource.findMany({
        where: {
          topic: {
            lesson: {
              teacherId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          questionCount: true,
          topicId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      messages: await prisma.message.findMany({
        where: {
          OR: [
            { senderId: teacherId },
            { receiverId: teacherId },
            {
              sender: {
                teacherId,
              },
            },
            {
              receiver: {
                teacherId,
              },
            },
          ],
        },
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          content: true,
          createdAt: true,
        },
      }),
    };

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    // Return JSON export
    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="data-export-${teacherId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[TeacherDataExport]',
      `Failed to export data: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to export data: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);

