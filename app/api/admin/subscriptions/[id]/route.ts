import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSubscriptionSchema = z.object({
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

/**
 * GET /api/admin/subscriptions/[id]
 * Get a single subscription (Superadmin only)
 */
async function GETHandler(
  request: NextRequest,
  user: any,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { id } = await params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!subscription) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Calculate status
    const now = new Date();
    const startDate = new Date(subscription.startDate);
    const endDate = new Date(subscription.endDate);
    
    let status: 'active' | 'expired' | 'upcoming';
    if (now < startDate) {
      status = 'upcoming';
    } else if (now > endDate) {
      status = 'expired';
    } else {
      status = 'active';
    }

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...subscription,
          status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[SubscriptionGet]', `Failed to fetch subscription: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to fetch subscription: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/subscriptions/[id]
 * Update a subscription (Superadmin only)
 */
async function PUTHandler(
  request: NextRequest,
  user: any,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { id } = await params;
    const body = await request.json();
    const { startDate, endDate } = updateSubscriptionSchema.parse(body);

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        statusCode = 400;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        return NextResponse.json(
          { error: 'Invalid start date format' },
          { status: 400 }
        );
      }
      updateData.startDate = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        statusCode = 400;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        return NextResponse.json(
          { error: 'Invalid end date format' },
          { status: 400 }
        );
      }
      updateData.endDate = end;
    }

    // Validate dates if both are provided
    const finalStartDate = updateData.startDate || existingSubscription.startDate;
    const finalEndDate = updateData.endDate || existingSubscription.endDate;

    if (finalEndDate <= finalStartDate) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Update subscription
    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
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
      logApiError('[SubscriptionUpdate]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[SubscriptionUpdate]', `Failed to update subscription: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to update subscription: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/subscriptions/[id]
 * Delete a subscription (Superadmin only)
 */
async function DELETEHandler(
  request: NextRequest,
  user: any,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { id } = await params;

    // Check if subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Delete subscription
    await prisma.subscription.delete({
      where: { id },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[SubscriptionDelete]', `Failed to delete subscription: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to delete subscription: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
// Note: Next.js dynamic route params need to be handled differently
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.SUPERADMIN, async (req, user) =>
    GETHandler(req, user, { params })
  )(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.SUPERADMIN, async (req, user) =>
    PUTHandler(req, user, { params })
  )(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.SUPERADMIN, async (req, user) =>
    DELETEHandler(req, user, { params })
  )(request);
}

