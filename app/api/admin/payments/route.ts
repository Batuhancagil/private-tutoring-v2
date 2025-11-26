import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

const createPaymentSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  notes: z.string().optional(),
});

const querySchema = z.object({
  subscriptionId: z.string().optional(),
});

/**
 * GET /api/admin/payments
 * List all payments (Superadmin only)
 * Query params: ?subscriptionId=xxx (optional filter)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { subscriptionId } = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    const payments = await prisma.payment.findMany({
      where: {
        ...(subscriptionId && { subscriptionId }),
      },
      include: {
        subscription: {
          include: {
            teacher: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: payments.map((payment) => ({
          id: payment.id,
          subscriptionId: payment.subscriptionId,
          subscription: payment.subscription,
          amount: payment.amount.toString(),
          paymentDate: payment.paymentDate,
          notes: payment.notes,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[PaymentList]', `Failed to fetch payments: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to fetch payments: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payments
 * Create a new payment (Superadmin only)
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { subscriptionId, amount, paymentDate, notes } = createPaymentSchema.parse(body);

    // Parse date
    const date = new Date(paymentDate);
    if (isNaN(date.getTime())) {
      statusCode = 400;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Verify subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
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

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        subscriptionId,
        amount: new Decimal(amount),
        paymentDate: date,
        notes: notes || null,
      },
      include: {
        subscription: {
          include: {
            teacher: {
              select: {
                id: true,
                username: true,
              },
            },
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
        data: {
          ...payment,
          amount: payment.amount.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      logApiError('[PaymentCreation]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[PaymentCreation]', `Failed to create payment: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to create payment: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handlers with role-based access control
export const GET = withRole(UserRole.SUPERADMIN, GETHandler);
export const POST = withRole(UserRole.SUPERADMIN, POSTHandler);

