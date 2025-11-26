import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';
import { getAlerts } from '@/lib/alert-service';
import { getCachedDualMetrics, calculateDualMetrics } from '@/lib/progress-calculator';

/**
 * GET /api/teacher/dashboard
 * Get dashboard data for teacher (students list and summary metrics)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Query all students for current teacher (tenant isolation)
    const students = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        teacherId: user.userId,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    // Get unresolved alerts count
    const alerts = await getAlerts(user.userId, undefined, false);
    const studentsNeedingAttention = new Set(
      alerts.map((alert) => alert.studentId)
    ).size;

    // Calculate summary metrics
    const totalStudents = students.length;

    // Get dual metrics for each student (cached when available)
    const studentsWithMetrics = await Promise.all(
      students.map(async (student) => {
        // Try cached first, then calculate if needed
        let metrics = getCachedDualMetrics(student.id);
        if (!metrics) {
          try {
            metrics = await calculateDualMetrics(student.id, user.userId);
          } catch (error) {
            // If calculation fails, use null metrics
            metrics = null;
          }
        }

        return {
          ...student,
          hasAlert: alerts.some((alert) => alert.studentId === student.id),
          programProgress: metrics?.programProgress ?? null,
          conceptMastery: metrics?.conceptMastery ?? null,
        };
      })
    );

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: {
          students: studentsWithMetrics,
          summary: {
            totalStudents,
            studentsNeedingAttention,
            totalAlerts: alerts.length,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[TeacherDashboardGet]',
      `Failed to fetch dashboard data: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch dashboard data: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);

