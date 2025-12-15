import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/api-helpers';
import { UserRole } from '@prisma/client';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Date range presets
const DATE_RANGE_PRESETS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  'all': null, // null means no limit
} as const;

const querySchema = z.object({
  studentId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  range: z.enum(['7d', '30d', '90d', 'all', 'custom']).optional(),
});

// Helper function to validate and parse dates
function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD`);
  }
  return date;
}

// Helper function to get date range from preset or custom dates
function getDateRange(range?: string, startDate?: string, endDate?: string): { start: Date | null; end: Date | null } {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  // If custom range is specified, use provided dates
  if (range === 'custom' || (!range && (startDate || endDate))) {
    const start = startDate ? parseDate(startDate) : null;
    const end = endDate ? parseDate(endDate) : today;
    
    // Validate dates
    if (start && end && start > end) {
      throw new Error('Start date must be before or equal to end date');
    }
    if (end && end > today) {
      throw new Error('End date cannot be in the future');
    }
    
    return { start, end };
  }
  
  // Handle preset ranges
  if (range && range !== 'custom' && range in DATE_RANGE_PRESETS) {
    const days = DATE_RANGE_PRESETS[range as keyof typeof DATE_RANGE_PRESETS];
    if (days === null) {
      // All time - no date filter
      return { start: null, end: null };
    }
    
    const start = new Date(today);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    
    return { start, end: today };
  }
  
  // Default: no date filter (all time)
  return { start: null, end: null };
}

/**
 * GET /api/parent/progress
 * Get progress data for parent's children
 * Query params: 
 *   - studentId: string (optional) - Filter by specific student
 *   - range: '7d' | '30d' | '90d' | 'all' | 'custom' (optional) - Preset date range
 *   - startDate: YYYY-MM-DD (optional) - Custom start date (requires range='custom' or endDate)
 *   - endDate: YYYY-MM-DD (optional) - Custom end date (requires range='custom' or startDate)
 */
async function GETHandler(request: NextRequest, user: any) {
  const startTime = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  let statusCode = 500;

  try {
    const { studentId, startDate, endDate, range } = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    
    // Get date range from preset or custom dates
    const { start, end } = getDateRange(range, startDate, endDate);

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
          data: {
            children: [],
            progressData: [],
          },
        },
        { status: 200 }
      );
    }

    const studentIds = parentStudents.map((ps) => ps.studentId);

    // Build date filter
    const dateFilter: any = {};
    if (start) {
      dateFilter.gte = start;
    }
    if (end) {
      dateFilter.lte = end;
    }

    // Query ProgressLog entries for parent's children
    const progressLogs = await prisma.progressLog.findMany({
      where: {
        studentId: { in: studentIds },
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      include: {
        assignment: {
          include: {
            topic: {
              select: {
                id: true,
                name: true,
                lesson: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Determine if we should aggregate by week (for ranges >= 3 months)
    const shouldAggregateByWeek = start && end && (end.getTime() - start.getTime()) >= 90 * 24 * 60 * 60 * 1000;
    
    // Helper function to get week key (YYYY-WW format)
    function getWeekKey(date: Date): string {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      // Get the week number
      const oneJan = new Date(d.getFullYear(), 0, 1);
      const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const week = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${week.toString().padStart(2, '0')}`;
    }

    // Aggregate progress data by date or week
    const progressByDate = new Map<string, {
      date: string;
      totalQuestions: number;
      rightCount: number;
      wrongCount: number;
      emptyCount: number;
      bonusCount: number;
      accuracy: number | null;
      dataPointCount: number; // For calculating averages when aggregating
    }>();

    for (const log of progressLogs) {
      const dateKey = shouldAggregateByWeek 
        ? getWeekKey(log.date)
        : log.date.toISOString().split('T')[0];
      
      const existing = progressByDate.get(dateKey) || {
        date: dateKey,
        totalQuestions: 0,
        rightCount: 0,
        wrongCount: 0,
        emptyCount: 0,
        bonusCount: 0,
        accuracy: null,
        dataPointCount: 0,
      };

      existing.totalQuestions +=
        log.rightCount + log.wrongCount + log.emptyCount + log.bonusCount;
      existing.rightCount += log.rightCount;
      existing.wrongCount += log.wrongCount;
      existing.emptyCount += log.emptyCount;
      existing.bonusCount += log.bonusCount;
      existing.dataPointCount += 1;

      progressByDate.set(dateKey, existing);
    }

    // Calculate accuracy for each date/week
    const progressData = Array.from(progressByDate.values()).map((item) => {
      const totalAttempted = item.rightCount + item.wrongCount + item.emptyCount;
      const accuracy =
        totalAttempted > 0 ? (item.rightCount / totalAttempted) * 100 : null;
      return {
        date: item.date,
        totalQuestions: item.totalQuestions,
        rightCount: item.rightCount,
        wrongCount: item.wrongCount,
        emptyCount: item.emptyCount,
        bonusCount: item.bonusCount,
        accuracy: accuracy !== null ? Math.round(accuracy * 100) / 100 : null,
      };
    }).sort((a, b) => a.date.localeCompare(b.date)); // Sort by date

    statusCode = 200;
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    return NextResponse.json(
      {
        success: true,
        data: {
          children: parentStudents.map((ps) => ({
            id: ps.student.id,
            username: ps.student.username,
          })),
          progressData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    trackPerformance(endpoint, method, responseTime, statusCode);

    if (error instanceof z.ZodError) {
      statusCode = 400;
      logApiError('[ParentProgressGet]', 'Validation error', error, request);
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      '[ParentProgressGet]',
      `Failed to fetch parent progress: ${errorMessage}`,
      error,
      request
    );
    return NextResponse.json(
      { error: `Failed to fetch parent progress: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Export handler with role-based access control
export const GET = withRole(UserRole.PARENT, GETHandler);

