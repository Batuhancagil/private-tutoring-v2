/**
 * Epic 7, Story 7.4: Parent Notes API - Unit Tests
 * 
 * Tests for parent notes API endpoint:
 * - Notes retrieval
 * - Tenant isolation
 * - Filtering by student
 * - Sorting (newest/oldest)
 */

import { NextRequest } from 'next/server';
import { GET as getHandler } from '@/app/api/parent/notes/route';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    parentStudent: {
      findMany: jest.fn(),
    },
    teacherNote: {
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

describe('Story 7.4: Parent Notes API [P0]', () => {
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

  describe('Notes Retrieval', () => {
    test('[P0] 7.4-UNIT-001: Returns notes for parent\'s children', async () => {
      // Given: Parent has children with teacher notes
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.teacherNote.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'note-1',
          teacherId: mockTeacherId,
          studentId: mockStudentId,
          note: 'Great progress!',
          createdAt: new Date('2025-11-25'),
          updatedAt: new Date('2025-11-25'),
          teacher: {
            id: mockTeacherId,
            username: 'teacher1',
          },
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/parent/notes');
      
      // When: Notes are requested
      const response = await getHandler(request, mockUser);
      const data = await response.json();

      // Then: Notes are returned
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('[P0] 7.4-UNIT-002: Returns empty array when no notes', async () => {
      // Given: Parent has children but no notes
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.teacherNote.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/parent/notes');
      
      // When: Notes are requested
      const response = await getHandler(request, mockUser);
      const data = await response.json();

      // Then: Empty array is returned
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    test('[P0] 7.4-UNIT-003: Filters by studentId', async () => {
      // Given: Parent requests notes for specific student
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.teacherNote.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/parent/notes?studentId=${mockStudentId}`
      );
      
      // When: Notes are requested for specific student
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

    test('[P0] 7.4-UNIT-004: Sorts by newest first (default)', async () => {
      // Given: Parent requests notes
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.teacherNote.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/parent/notes');
      
      // When: Notes are requested without sort param
      await getHandler(request, mockUser);

      // Then: Notes are sorted by newest first
      expect(prisma.teacherNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc',
          },
        })
      );
    });

    test('[P0] 7.4-UNIT-005: Sorts by oldest first when requested', async () => {
      // Given: Parent requests notes sorted oldest first
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.teacherNote.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/parent/notes?sort=oldest');
      
      // When: Notes are requested with sort=oldest
      await getHandler(request, mockUser);

      // Then: Notes are sorted by oldest first
      expect(prisma.teacherNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'asc',
          },
        })
      );
    });
  });

  describe('Tenant Isolation', () => {
    test('[P0] 7.4-UNIT-006: Only returns notes for parent\'s children', async () => {
      // Given: Parent requests notes
      (prisma.parentStudent.findMany as jest.Mock).mockResolvedValue([
        {
          studentId: mockStudentId,
          student: {
            id: mockStudentId,
            username: 'student1',
          },
        },
      ]);

      (prisma.teacherNote.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/parent/notes');
      
      // When: Notes are requested
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

