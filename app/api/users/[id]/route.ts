import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { UserRole } from '@prisma/client';

/**
 * GET /api/users/[id]
 * Get user information by ID (with tenant isolation)
 */
async function GETHandler(
  request: NextRequest,
  user: any,
  params: { id: string }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const userId = params.id;

    // Fetch user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        teacherId: true,
      },
    });

    if (!targetUser) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Enforce tenant isolation
    if (user.role === UserRole.TEACHER) {
      // Teachers can only see their students or themselves
      if (targetUser.role === UserRole.STUDENT && targetUser.teacherId !== user.userId) {
        statusCode = 403;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    } else if (user.role === UserRole.STUDENT) {
      // Students can only see their teacher or themselves
      if (targetUser.role === UserRole.TEACHER && targetUser.id !== user.teacherId) {
        statusCode = 403;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: targetUser,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[UserInfo]', `Failed to fetch user: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to fetch user: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler - Note: Next.js dynamic route params are now Promise-based
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, user) =>
    GETHandler(req, user, await params)
  )(request);
}

