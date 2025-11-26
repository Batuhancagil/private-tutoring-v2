import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  studentId: z.string().optional(),
  sort: z.enum(['newest', 'oldest']).optional(),
});

/**
 * GET /api/parent/notes
 * Get teacher notes for parent's children
 * Query params: ?studentId=xxx (optional), ?sort=newest|oldest (optional, default newest)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { studentId, sort } = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    // Get parent's children via ParentStudent relationship (tenant isolation)
    const parentStudents = await prisma.parentStudent.findMany({
      where: {
        parentId: user.userId,
        ...(studentId && { studentId }),
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (parentStudents.length === 0) {
      statusCode = 200;
      const responseTime = Date.now() - startTime;
      trackPerformance(endpoint, method, responseTime, statusCode);
      return NextResponse.json(
        {
          success: true,
          data: [],
        },
        { status: 200 }
      );
    }

    const studentIds = parentStudents.map((ps) => ps.studentId);

    // Query teacher notes for parent's children
    const notes = await prisma.teacherNote.findMany({
      where: {
        studentId: { in: studentIds },
      },
      include: {
        teacher: {
          select: {
            id: true,
            username: true,
          },
        },
        student: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: sort === 'oldest' ? 'asc' : 'desc',
      },
    });

    // Group notes by child for easier frontend consumption
    const notesByChild = parentStudents.map((ps) => {
      const childNotes = notes.filter((note) => note.studentId === ps.studentId);
      return {
        child: {
          id: ps.student.id,
          username: ps.student.username,
        },
        notes: childNotes.map((note) => ({
          id: note.id,
          note: note.note,
          teacher: {
            id: note.teacher.id,
            username: note.teacher.username,
          },
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        })),
      };
    });

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: notesByChild,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      logApiError('[ParentNotesGet]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[ParentNotesGet]',
      `Failed to fetch parent notes: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch parent notes: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.PARENT, GETHandler);

