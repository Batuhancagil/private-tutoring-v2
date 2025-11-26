import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { getAlerts } from '@/lib/alert-service';

/**
 * GET /api/teacher/alerts
 * Get alerts for teacher's students
 * Query params: ?studentId=xxx (optional), ?resolved=true/false (optional, default false)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Get query parameters
    const studentId = request.nextUrl.searchParams.get('studentId');
    const resolvedParam = request.nextUrl.searchParams.get('resolved');
    const resolved = resolvedParam === 'true';

    // Get alerts
    const alerts = await getAlerts(user.userId, studentId || undefined, resolved);

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: alerts,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[AlertsGet]',
      `Failed to fetch alerts: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch alerts: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.TEACHER, GETHandler);

