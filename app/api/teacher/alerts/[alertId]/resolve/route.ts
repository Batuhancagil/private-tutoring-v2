import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { resolveAlert } from '@/lib/alert-service';

/**
 * POST /api/teacher/alerts/:alertId/resolve
 * Resolve an alert manually
 */
async function POSTHandler(
  request: NextRequest,
  user: any,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { alertId } = await params;

    if (!alertId) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Resolve alert
    const alert = await resolveAlert(alertId, user.userId);

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: alert,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof Error && error.message.includes('not found')) {
      statusCode = 404;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[AlertResolve]',
      `Failed to resolve alert: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to resolve alert: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  return withRole(UserRole.TEACHER, async (req, user) =>
    POSTHandler(req, user, { params })
  )(request);
}

