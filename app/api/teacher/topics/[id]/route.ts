import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { z } from 'zod';

const updateTopicSchema = z.object({
  name: z.string().min(1, 'Topic name is required'),
});

/**
 * GET /api/teacher/topics/[id]
 * Get topic details (with tenant check via lesson)
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
    // Find topic with tenant isolation check via lesson
    const topic = await prisma.topic.findFirst({
      where: {
        id: params.id,
        lesson: {
          OR: [
            { teacherId: user.userId }, // Tenant isolation: current teacher's lessons
            { teacherId: null }, // Global lessons accessible to all teachers
          ],
        },
      },
      select: {
        id: true,
        name: true,
        lessonId: true,
        createdAt: true,
        updatedAt: true,
        lesson: {
          select: {
            id: true,
            name: true,
            teacherId: true,
          },
        },
      },
    });

    if (!topic) {
      statusCode = 403; // Forbidden - topic doesn't belong to this teacher or doesn't exist
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[TopicDetail]',
        `Topic not found or access denied: ${params.id}`,
        new Error('Topic not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Topic not found or access denied' },
        { status: 403 }
      );
    }

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: topic,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[TopicDetail]', 'Failed to fetch topic', error, request);
    return NextResponse.json(
      { error: 'Failed to fetch topic' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/topics/[id]
 * Update topic (with tenant validation)
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
    // Check if topic exists and belongs to current teacher (tenant isolation via lesson)
    const existingTopic = await prisma.topic.findFirst({
      where: {
        id: params.id,
        lesson: {
          OR: [
            { teacherId: user.userId }, // Tenant isolation: current teacher's lessons
            { teacherId: null }, // Global lessons accessible to all teachers
          ],
        },
      },
    });

    if (!existingTopic) {
      statusCode = 403; // Forbidden - topic doesn't belong to this teacher
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[TopicUpdate]',
        `Topic not found or access denied: ${params.id}`,
        new Error('Topic not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Topic not found or access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = updateTopicSchema.parse(body);

    // Update topic
    const topic = await prisma.topic.update({
      where: { id: params.id },
      data: { name },
      select: {
        id: true,
        name: true,
        lessonId: true,
        createdAt: true,
        updatedAt: true,
        lesson: {
          select: {
            id: true,
            name: true,
            teacherId: true,
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
        data: topic,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError('[TopicUpdate]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    statusCode = 500;
    trackPerformance(endpoint, method, responseTime, statusCode);
    logApiError('[TopicUpdate]', 'Failed to update topic', error, request);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/topics/[id]
 * Delete topic (with cascade to resources and tenant validation)
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
    // Check if topic exists and belongs to current teacher (tenant isolation via lesson)
    const existingTopic = await prisma.topic.findFirst({
      where: {
        id: params.id,
        lesson: {
          OR: [
            { teacherId: user.userId }, // Tenant isolation: current teacher's lessons
            { teacherId: null }, // Global lessons accessible to all teachers
          ],
        },
      },
    });

    if (!existingTopic) {
      statusCode = 403; // Forbidden - topic doesn't belong to this teacher
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      logApiError(
        '[TopicDelete]',
        `Topic not found or access denied: ${params.id}`,
        new Error('Topic not found or access denied'),
        request
      );
      return NextResponse.json(
        { error: 'Topic not found or access denied' },
        { status: 403 }
      );
    }

    // Delete topic (cascade deletes will handle resources)
    await prisma.topic.delete({
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
    logApiError('[TopicDelete]', 'Failed to delete topic', error, request);
    return NextResponse.json(
      { error: 'Failed to delete topic' },
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

