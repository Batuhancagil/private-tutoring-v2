import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getExpirationInfo } from '@/lib/subscription-helpers';

const querySchema = z.object({
  expiringSoon: z.enum(['true', 'false']).optional(),
  sort: z.enum(['expiration', 'created']).optional(),
});

const createSubscriptionSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

/**
 * GET /api/admin/subscriptions
 * List all subscriptions (Superadmin only)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { expiringSoon, sort } = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    const subscriptions = await prisma.subscription.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: sort === 'expiration' 
        ? { endDate: 'asc' }
        : { createdAt: 'desc' },
    });

    // Calculate status and expiration info for each subscription
    const now = new Date();
    let subscriptionsWithStatus = subscriptions.map((sub) => {
      const startDate = new Date(sub.startDate);
      const endDate = new Date(sub.endDate);
      
      let status: 'active' | 'expired' | 'upcoming';
      if (now < startDate) {
        status = 'upcoming';
      } else if (now > endDate) {
        status = 'expired';
      } else {
        status = 'active';
      }

      // Get expiration info
      const expirationInfo = getExpirationInfo(endDate);

      return {
        id: sub.id,
        teacherId: sub.teacherId,
        teacher: sub.teacher,
        startDate: sub.startDate,
        endDate: sub.endDate,
        status,
        expirationInfo,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      };
    });

    // Filter by expiring soon if requested
    if (expiringSoon === 'true') {
      subscriptionsWithStatus = subscriptionsWithStatus.filter(
        (sub) => sub.expirationInfo.isExpiringSoon || sub.expirationInfo.isExpired
      );
    }

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: subscriptionsWithStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[SubscriptionList]', `Failed to fetch subscriptions: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to fetch subscriptions: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/subscriptions
 * Create a new subscription (Superadmin only)
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { teacherId, startDate, endDate } = createSubscriptionSchema.parse(body);

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (end <= start) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Verify teacher exists and is a teacher
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, role: true },
    });

    if (!teacher) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    if (teacher.role !== UserRole.TEACHER) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'User is not a teacher' },
        { status: 400 }
      );
    }

    // Check if subscription already exists for this teacher
    const existingSubscription = await prisma.subscription.findUnique({
      where: { teacherId },
    });

    if (existingSubscription) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Subscription already exists for this teacher' },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        teacherId,
        startDate: start,
        endDate: end,
      },
      include: {
        teacher: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: subscription,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      logApiError('[SubscriptionCreation]', 'Validation error', error, request);
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
        '[SubscriptionCreation]',
        'Failed to create subscription: subscription already exists',
        error,
        request
      );
      return NextResponse.json(
        { error: 'Subscription already exists for this teacher' },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[SubscriptionCreation]', `Failed to create subscription: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to create subscription: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
export const GET = withRole(UserRole.SUPERADMIN, GETHandler);
export const POST = withRole(UserRole.SUPERADMIN, POSTHandler);

