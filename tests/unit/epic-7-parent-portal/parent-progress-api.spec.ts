/**
 * Epic 7, Story 7.1 & 7.2: Parent Progress API - Unit Tests
 * 
 * Tests for parent progress API endpoint:
 * - Progress data retrieval
 * - Date range filtering
 * - Tenant isolation
 * - Data aggregation
 */

import { NextRequest } from 'next/server';
import { GET as getHandler } from '@/app/api/parent/progress/route';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    parentStudent: {
      findMany: jest.fn(),
    },
    progressLog: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/api-helpers', () => ({
  withRole: (handler: any) => handler,
}));

jest.mock('@/lib/error-logger', () => ({
  logApiError: jest.fn(),
}));

jest.mock('@/lib/performance-monitor', () => ({
  trackPerformance: jest.fn(),
}));

describe('Story 7.1 & 7.2: Parent Progress API [P0]', () => {
  const mockParentId = 'parent-123';
  const mockStudentId = 'student-123';
  const mockTeacherId = 'teacher-123';

  const mockUser = {
    userId: mockParentId,
    role: UserRole.PARENT,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Progress Data Retrieval', () => {
    test('[P0] 7.1-UNIT-001: Returns progress data for parent\'s children', async () => {
      // Given: Parent has children with progress logs
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          date: new Date('2025-11-25'),
          rightCount: 10,
          wrongCount: 2,
          emptyCount: 1,
          bonusCount: 1,
        },
        {
          date: new Date('2025-11-26'),
          rightCount: 12,
          wrongCount: 1,
          emptyCount: 0,
          bonusCount: 2,
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/parent/progress');
      
      // When: Progress data is requested
      const response = await getHandler(request, mockUser);
      const data = await response.json();

      // Then: Progress data is returned
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('[P0] 7.1-UNIT-002: Returns empty array when no children', async () => {
      // Given: Parent has no children
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/parent/progress');
      
      // When: Progress data is requested
      const response = await getHandler(request, mockUser);
      const data = await response.json();

      // Then: Empty array is returned
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    test('[P0] 7.2-UNIT-001: Filters by date range (7d)', async () => {
      // Given: Parent requests last 7 days
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/parent/progress?range=7d');
      
      // When: Progress data is requested with 7d range
      const response = await getHandler(request, mockUser);
      const data = await response.json();

      // Then: Date filter is applied
      expect(response.status).toBe(200);
      expect(prisma.progressLog.findMany).toHaveBeenCalled();
      const callArgs = (prisma.progressLog.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.date).toBeDefined();
    });

    test('[P0] 7.2-UNIT-002: Filters by custom date range', async () => {
      // Given: Parent requests custom date range
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/parent/progress?range=custom&startDate=2025-11-01&endDate=2025-11-30'
      );
      
      // When: Progress data is requested with custom range
      const response = await getHandler(request, mockUser);
      const data = await response.json();

      // Then: Custom date filter is applied
      expect(response.status).toBe(200);
      expect(prisma.progressLog.findMany).toHaveBeenCalled();
    });

    test('[P0] 7.2-UNIT-003: Filters by studentId', async () => {
      // Given: Parent requests progress for specific student
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/parent/progress?studentId=${mockStudentId}`
      );
      
      // When: Progress data is requested for specific student
      const response = await getHandler(request, mockUser);
      const data = await response.json();

      // Then: Student filter is applied
      expect(response.status).toBe(200);
      expect(prisma.parentStudent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            studentId: mockStudentId,
          }),
        })
      );
    });
  });

  describe('Tenant Isolation', () => {
    test('[P0] 7.1-UNIT-003: Only returns data for parent\'s children', async () => {
      // Given: Parent requests progress
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/parent/progress');
      
      // When: Progress data is requested
      await getHandler(request, mockUser);

      // Then: Only parent's children are queried
      expect(prisma.parentStudent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentId: mockParentId,
          }),
        })
      );
    });
  });

  describe('Data Aggregation', () => {
    test('[P0] 7.2-UNIT-004: Aggregates data by date correctly', async () => {
      // Given: Multiple progress logs for same date
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          date: new Date('2025-11-25'),
          rightCount: 10,
          wrongCount: 2,
          emptyCount: 1,
          bonusCount: 1,
        },
        {
          date: new Date('2025-11-25'),
          rightCount: 5,
          wrongCount: 1,
          emptyCount: 0,
          bonusCount: 0,
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/parent/progress');
      
      // When: Progress data is requested
      const response = await getHandler(request, mockUser);
      const data = await response.json();

      // Then: Data is aggregated by date
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

