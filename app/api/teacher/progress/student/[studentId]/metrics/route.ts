import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import {
  calculateDualMetrics,
  getCachedDualMetrics,
  setCachedDualMetrics,
} from '@/lib/progress-calculator';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/teacher/progress/student/:studentId/metrics
 * Get dual metrics (Program Progress + Concept Mastery) for a student
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Extract studentId from path
    const pathParts = request.nextUrl.pathname.split('/');
    const studentId = pathParts[pathParts.length - 2]; // studentId is second-to-last part (before 'metrics')
    
    if (!studentId) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Verify student exists and belongs to current teacher (tenant isolation)
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: UserRole.STUDENT,
        teacherId: user.userId, // Tenant isolation: student must belong to current teacher
      },
      select: {
        id: true,
        teacherId: true,
      },
    });

    if (!student) {
      statusCode = 403; // Forbidden - student doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[DualMetricsGet]',
        `Student not found or access denied: ${studentId}`,
        new Error('Student not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 403 }
      );
    }

    // Check cache first
    const cached = getCachedDualMetrics(studentId);
    if (cached) {
      statusCode = 200;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        {
          success: true,
          data: cached,
          cached: true,
        },
        { status: 200 }
      );
    }

    // Calculate dual metrics
    const metrics = await calculateDualMetrics(studentId, user.userId);

    // Cache the result
    setCachedDualMetrics(studentId, metrics);

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: metrics,
        cached: false,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[DualMetricsGet]',
      `Failed to fetch dual metrics: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch dual metrics: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);

