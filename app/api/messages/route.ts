import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z.string().min(1, 'Message content is required'),
});

const querySchema = z.object({
  receiverId: z.string().optional(),
});

/**
 * GET /api/messages
 * Get messages for the current user
 * Query params: ?receiverId=xxx (optional filter by receiver)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { receiverId } = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    // Build where clause
    const where: any = {
      OR: [
        { senderId: user.userId },
        { receiverId: user.userId },
      ],
    };

    // Filter by receiver if specified (for conversation view)
    if (receiverId) {
      where.AND = [
        {
          OR: [
            { senderId: user.userId, receiverId },
            { senderId: receiverId, receiverId: user.userId },
          ],
        },
      ];
    }

    // Enforce tenant isolation for teachers
    if (user.role === UserRole.TEACHER) {
      // Teachers can only see messages with their students or students' parents
      const students = await prisma.user.findMany({
        where: { teacherId: user.userId, role: UserRole.STUDENT },
        select: { id: true },
      });
      const studentIds = students.map((s) => s.id);

      // Get parents of these students
      const parentStudents = await prisma.parentStudent.findMany({
        where: { studentId: { in: studentIds } },
        select: { parentId: true },
      });
      const parentIds = parentStudents.map((ps) => ps.parentId);

      const allowedUserIds = [user.userId, ...studentIds, ...parentIds];

      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { senderId: { in: allowedUserIds } },
            { receiverId: { in: allowedUserIds } },
          ],
        },
      ];
    } else if (user.role === UserRole.STUDENT) {
      // Students can only message their teacher
      const student = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { teacherId: true },
      });

      if (student?.teacherId) {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { senderId: user.userId, receiverId: student.teacherId },
              { senderId: student.teacherId, receiverId: user.userId },
            ],
          },
        ];
      }
    } else if (user.role === UserRole.PARENT) {
      // Parents can only message their child's teacher
      const parentStudents = await prisma.parentStudent.findMany({
        where: { parentId: user.userId },
        include: {
          student: {
            select: { teacherId: true },
          },
        },
      });

      const teacherIds = parentStudents
        .map((ps) => ps.student.teacherId)
        .filter((id): id is string => id !== null);

      if (teacherIds.length > 0) {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { senderId: user.userId, receiverId: { in: teacherIds } },
              { senderId: { in: teacherIds }, receiverId: user.userId },
            ],
          },
        ];
      }
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: messages,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[MessageList]', `Failed to fetch messages: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to fetch messages: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages
 * Send a new message
 */
async function POSTHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const body = await request.json();
    const { receiverId, content } = createMessageSchema.parse(body);

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, role: true, teacherId: true },
    });

    if (!receiver) {
      statusCode = 404;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Enforce tenant isolation and role-based permissions
    if (user.role === UserRole.TEACHER) {
      // Teachers can only message their students or students' parents
      if (receiver.role === UserRole.STUDENT) {
        if (receiver.teacherId !== user.userId) {
          statusCode = 403;
          const responseTime = Date.now() - startTime;
          trackPerformance(endpoint, method, responseTime, statusCode);
          return NextResponse.json(
            { error: 'Access denied: can only message your own students' },
            { status: 403 }
          );
        }
      } else if (receiver.role === UserRole.PARENT) {
        // Check if parent is linked to teacher's student
        const parentStudent = await prisma.parentStudent.findFirst({
          where: {
            parentId: receiverId,
            student: {
              teacherId: user.userId,
            },
          },
        });

        if (!parentStudent) {
          statusCode = 403;
          const responseTime = Date.now() - startTime;
          trackPerformance(endpoint, method, responseTime, statusCode);
          return NextResponse.json(
            { error: 'Access denied: can only message parents of your students' },
            { status: 403 }
          );
        }
      } else {
        statusCode = 403;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        return NextResponse.json(
          { error: 'Access denied: invalid recipient' },
          { status: 403 }
        );
      }
    } else if (user.role === UserRole.STUDENT) {
      // Students can only message their teacher
      if (receiver.role !== UserRole.TEACHER || receiver.id !== user.teacherId) {
        statusCode = 403;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        return NextResponse.json(
          { error: 'Access denied: can only message your teacher' },
          { status: 403 }
        );
      }
    } else if (user.role === UserRole.PARENT) {
      // Parents can only message their child's teacher
      const parentStudents = await prisma.parentStudent.findMany({
        where: { parentId: user.userId },
        include: {
          student: {
            select: { teacherId: true },
          },
        },
      });

      const teacherIds = parentStudents
        .map((ps) => ps.student.teacherId)
        .filter((id): id is string => id !== null);

      if (receiver.role !== UserRole.TEACHER || !teacherIds.includes(receiverId)) {
        statusCode = 403;
        const responseTime = Date.now() - startTime;
        trackPerformance(endpoint, method, responseTime, statusCode);
        return NextResponse.json(
          { error: 'Access denied: can only message your child\'s teacher' },
          { status: 403 }
        );
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: user.userId,
        receiverId,
        content: content.trim(),
        read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            role: true,
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
        data: message,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      logApiError('[MessageCreation]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError('[MessageCreation]', `Failed to create message: ${errorMessage}`, error, request);
    return NextResponse.json(
      { error: `Failed to create message: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handlers - all authenticated users can use messaging
export const GET = withAuth(GETHandler);
export const POST = withAuth(POSTHandler);

