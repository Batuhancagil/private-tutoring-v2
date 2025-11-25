import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const updateResourceSchema = z.object({
  name: z.string().min(1, 'Resource name is required').optional(),
  questionCount: z.number().int().positive().nullable().optional(),
});

/**
 * GET /api/teacher/resources/[id]
 * Get resource details (with tenant check via topic's lesson)
 */
async function GETHandler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Find resource with tenant isolation check via topic's lesson
    const resource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        topic: {
          lesson: {
            OR: [
              { teacherId: user.userId }, // Tenant isolation: current teacher's lessons
              { teacherId: null }, // Global lessons accessible to all teachers
            ],
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
        topic: {
          select: {
            id: true,
            name: true,
            lessonId: true,
            lesson: {
              select: {
                id: true,
                name: true,
                teacherId: true,
              },
            },
          },
        },
      },
    });

    if (!resource) {
      statusCode = 403; // Forbidden - resource doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ResourceDetail]',
        `Resource not found or access denied: ${params.id}`,
        new Error('Resource not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Resource not found or access denied' },
        { status: 403 }
      );
    }

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: resource,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[ResourceDetail]', 'Failed to fetch resource', error, request);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/resources/[id]
 * Update resource (with tenant validation)
 */
async function PUTHandler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Check if resource exists and belongs to current teacher (tenant isolation via topic's lesson)
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        topic: {
          lesson: {
            OR: [
              { teacherId: user.userId }, // Tenant isolation: current teacher's lessons
              { teacherId: null }, // Global lessons accessible to all teachers
            ],
          },
        },
      },
    });

    if (!existingResource) {
      statusCode = 403; // Forbidden - resource doesn't belong to this teacher
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ResourceUpdate]',
        `Resource not found or access denied: ${params.id}`,
        new Error('Resource not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Resource not found or access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData = updateResourceSchema.parse(body);

    // Build update payload
    const updatePayload: {
      name?: string;
      questionCount?: number | null;
    } = {};

    if (updateData.name !== undefined) {
      updatePayload.name = updateData.name;
    }

    if (updateData.questionCount !== undefined) {
      updatePayload.questionCount = updateData.questionCount;
    }

    // Update resource
    const resource = await prisma.resource.update({
      where: { id: params.id },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        description: true,
        questionCount: true,
        topicId: true,
        createdAt: true,
        updatedAt: true,
        topic: {
          select: {
            id: true,
            name: true,
            lessonId: true,
            lesson: {
              select: {
                id: true,
                name: true,
                teacherId: true,
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
        data: resource,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[ResourceUpdate]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[ResourceUpdate]', 'Failed to update resource', error, request);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/resources/[id]
 * Delete resource (with tenant validation)
 */
async function DELETEHandler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    // Check if resource exists and belongs to current teacher (tenant isolation via topic's lesson)
    const existingResource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        topic: {
          lesson: {
            OR: [
              { teacherId: user.userId }, // Tenant isolation: current teacher's lessons
              { teacherId: null }, // Global lessons accessible to all teachers
            ],
          },
        },
      },
    });

    if (!existingResource) {
      statusCode = 403; // Forbidden - resource doesn't belong to this teacher
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[ResourceDelete]',
        `Resource not found or access denied: ${params.id}`,
        new Error('Resource not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Resource not found or access denied' },
        { status: 403 }
      );
    }

    // Delete resource
    await prisma.resource.delete({
      where: { id: params.id },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[ResourceDelete]', 'Failed to delete resource', error, request);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
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
  return withRole(UserRole.TEACHER, async (req, user) =>
    GETHandler(req, user, { params: await params })
  )(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.TEACHER, async (req, user) =>
    PUTHandler(req, user, { params: await params })
  )(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole(UserRole.TEACHER, async (req, user) =>
    DELETEHandler(req, user, { params: await params })
  )(request);
}

