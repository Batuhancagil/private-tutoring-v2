/**
 * Epic 7, Story 7.3: Parent Alerts API - Unit Tests
 * 
 * Tests for parent alerts API endpoint:
 * - Alert retrieval
 * - Tenant isolation
 * - Filtering by student
 * - Resolved status filtering
 */

import { NextRequest } from 'next/server';
import { GET as getHandler } from '@/app/api/parent/alerts/route';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    parentStudent: {
      findMany: jest.fn(),
    },
    accuracyAlert: {
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

describe('Story 7.3: Parent Alerts API [P0]', () => {
  const mockParentId = 'parent-123';
  const mockStudentId = 'student-123';

  const mockUser = {
    userId: mockParentId,
    role: UserRole.PARENT,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Alert Retrieval', () => {
    test('[P0] 7.3-UNIT-001: Returns alerts for parent\'s children', async () => {
      // Given: Parent has children with alerts
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.accuracyAlert.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'alert-1',
          studentId: mockStudentId,
          topicId: 'topic-1',
          accuracy: 65,
          threshold: 70,
          resolved: false,
          createdAt: new Date(),
          student: {
            id: mockStudentId,
            username: 'student1',
          },
          topic: {
            id: 'topic-1',
            name: 'Math Basics',
          },
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/parent/alerts');
      
      // When: Alerts are requested
      const response = await getHandler(request, mockUser);
      const data = await response.json();

      // Then: Alerts are returned
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('[P0] 7.3-UNIT-002: Returns empty array when no alerts', async () => {
      // Given: Parent has children but no alerts
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.accuracyAlert.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/parent/alerts');
      
      // When: Alerts are requested
      const response = await getHandler(request, mockUser);
      const data = await response.json();

      // Then: Empty array is returned
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    test('[P0] 7.3-UNIT-003: Filters by studentId', async () => {
      // Given: Parent requests alerts for specific student
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.accuracyAlert.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/parent/alerts?studentId=${mockStudentId}`
      );
      
      // When: Alerts are requested for specific student
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

    test('[P0] 7.3-UNIT-004: Filters by resolved status (default false)', async () => {
      // Given: Parent requests alerts
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.accuracyAlert.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/parent/alerts');
      
      // When: Alerts are requested without resolved param
      await getHandler(request, mockUser);

      // Then: Only unresolved alerts are returned
      expect(prisma.accuracyAlert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resolved: false,
          }),
        })
      );
    });
  });

  describe('Tenant Isolation', () => {
    test('[P0] 7.3-UNIT-005: Only returns alerts for parent\'s children', async () => {
      // Given: Parent requests alerts
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.accuracyAlert.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/parent/alerts');
      
      // When: Alerts are requested
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
});

