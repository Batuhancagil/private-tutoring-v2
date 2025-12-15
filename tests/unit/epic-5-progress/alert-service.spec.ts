/**
 * Epic 5, Story 5.6: Low Accuracy Alerts - Unit Tests
 * 
 * P0 Unit Tests for alert service functions:
 * - Alert generation logic
 * - Threshold comparison
 * - Auto-resolution
 * - Duplicate prevention
 */

import { checkAndGenerateAlert, resolveAlert, getAlerts } from '@/lib/alert-service';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    accuracyAlert: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/error-logger', () => ({
  logApiError: jest.fn(),
}));

describe('Story 5.6: Alert Service [P0]', () => {
  const mockStudentId = 'student-123';
  const mockTopicId = 'topic-123';
  const mockTeacherId = 'teacher-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Alert Generation', () => {
    test('[P0] 5.6-UNIT-001: Accuracy 65% < threshold 70% → alert created', async () => {
      // Given: Accuracy is below threshold and no existing alert
      const accuracy = 65;
      const threshold = 70;
      (prisma.accuracyAlert.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.accuracyAlert.create as jest.Mock).mockResolvedValue({
        id: 'alert-123',
        studentId: mockStudentId,
        topicId: mockTopicId,
        accuracy,
        threshold,
        resolved: false,
        createdAt: new Date(),
      });

      // When: Alert is checked/generated
      const result = await checkAndGenerateAlert(mockStudentId, accuracy, threshold, mockTopicId);

      // Then: Alert is created
      expect(result).not.toBeNull();
      expect(prisma.accuracyAlert.create).toHaveBeenCalledWith({
        data: {
          studentId: mockStudentId,
          topicId: mockTopicId,
          accuracy,
          threshold,
          resolved: false,
        },
      });
    });

    test('[P0] 5.6-UNIT-002: Accuracy 75% ≥ threshold 70% → no alert created', async () => {
      // Given: Accuracy is above threshold
      const accuracy = 75;
      const threshold = 70;
      (prisma.accuracyAlert.findFirst as jest.Mock).mockResolvedValue(null);

      // When: Alert is checked/generated
      const result = await checkAndGenerateAlert(mockStudentId, accuracy, threshold, mockTopicId);

      // Then: No alert is created
      expect(result).toBeNull();
      expect(prisma.accuracyAlert.create).not.toHaveBeenCalled();
    });

    test('[P0] 5.6-UNIT-003: Duplicate alert prevention (don\'t create if unresolved exists)', async () => {
      // Given: Accuracy is below threshold and unresolved alert exists
      const accuracy = 65;
      const threshold = 70;
      const existingAlert = {
        id: 'alert-123',
        studentId: mockStudentId,
        topicId: mockTopicId,
        accuracy: 60,
        threshold: 70,
        resolved: false,
        createdAt: new Date(),
      };
      (prisma.accuracyAlert.findFirst as jest.Mock).mockResolvedValue(existingAlert);
      (prisma.accuracyAlert.update as jest.Mock).mockResolvedValue({
        ...existingAlert,
        accuracy,
        createdAt: new Date(),
      });

      // When: Alert is checked/generated
      const result = await checkAndGenerateAlert(mockStudentId, accuracy, threshold, mockTopicId);

      // Then: Existing alert is updated, not duplicated
      expect(result).not.toBeNull();
      expect(prisma.accuracyAlert.create).not.toHaveBeenCalled();
      expect(prisma.accuracyAlert.update).toHaveBeenCalled();
    });

    test('[P0] 5.6-UNIT-004: Auto-resolution when accuracy improves', async () => {
      // Given: Accuracy improves above threshold and unresolved alert exists
      const accuracy = 75;
      const threshold = 70;
      const existingAlert = {
        id: 'alert-123',
        studentId: mockStudentId,
        topicId: mockTopicId,
        accuracy: 65,
        threshold: 70,
        resolved: false,
        createdAt: new Date(),
      };
      (prisma.accuracyAlert.findFirst as jest.Mock).mockResolvedValue(existingAlert);
      (prisma.accuracyAlert.update as jest.Mock).mockResolvedValue({
        ...existingAlert,
        resolved: true,
        resolvedAt: new Date(),
      });

      // When: Alert is checked with improved accuracy
      const result = await checkAndGenerateAlert(mockStudentId, accuracy, threshold, mockTopicId);

      // Then: Alert is auto-resolved
      expect(result).not.toBeNull();
      expect(prisma.accuracyAlert.update).toHaveBeenCalledWith({
        where: { id: existingAlert.id },
        data: {
          resolved: true,
          resolvedAt: expect.any(Date),
        },
      });
    });

    test('[P0] 5.6-UNIT-005: Null accuracy doesn\'t generate alert', async () => {
      // Given: Accuracy is null
      const accuracy = null;
      const threshold = 70;

      // When: Alert is checked/generated
      const result = await checkAndGenerateAlert(mockStudentId, accuracy, threshold, mockTopicId);

      // Then: No alert is created
      expect(result).toBeNull();
      expect(prisma.accuracyAlert.findFirst).not.toHaveBeenCalled();
      expect(prisma.accuracyAlert.create).not.toHaveBeenCalled();
    });
  });

  describe('Alert Resolution', () => {
    test('[P0] 5.6-UNIT-006: Alert resolution sets resolvedAt timestamp', async () => {
      // Given: Alert exists and belongs to teacher's student
      const alertId = 'alert-123';
      const existingAlert = {
        id: alertId,
        studentId: mockStudentId,
        student: {
          teacherId: mockTeacherId,
        },
      };
      (prisma.accuracyAlert.findFirst as jest.Mock).mockResolvedValue(existingAlert);
      (prisma.accuracyAlert.update as jest.Mock).mockResolvedValue({
        ...existingAlert,
        resolved: true,
        resolvedAt: new Date(),
      });

      // When: Alert is resolved
      const result = await resolveAlert(alertId, mockTeacherId);

      // Then: Alert is marked as resolved with timestamp
      expect(result.resolved).toBe(true);
      expect(result.resolvedAt).toBeDefined();
      expect(prisma.accuracyAlert.update).toHaveBeenCalledWith({
        where: { id: alertId },
        data: {
          resolved: true,
          resolvedAt: expect.any(Date),
        },
      });
    });

    test('[P0] 5.6-UNIT-007: Tenant isolation enforced in resolution', async () => {
      // Given: Alert belongs to different teacher's student
      const alertId = 'alert-123';
      (prisma.accuracyAlert.findFirst as jest.Mock).mockResolvedValue(null);

      // When: Alert is resolved with wrong teacherId
      // Then: Error is thrown
      await expect(resolveAlert(alertId, mockTeacherId)).rejects.toThrow(
        'Alert not found or access denied'
      );
    });
  });

  describe('Alert Retrieval', () => {
    test('[P0] 5.6-UNIT-008: getAlerts returns only unresolved by default', async () => {
      // Given: Teacher has alerts (some resolved, some not)
      (prisma.accuracyAlert.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'alert-1',
          resolved: false,
          student: { id: 'student-1', username: 'student1' },
        },
        {
          id: 'alert-2',
          resolved: false,
          student: { id: 'student-2', username: 'student2' },
        },
      ]);

      // When: Alerts are retrieved
      const result = await getAlerts(mockTeacherId);

      // Then: Only unresolved alerts are returned
      expect(result.length).toBe(2);
      expect(result.every((alert: any) => !alert.resolved)).toBe(true);
      expect(prisma.accuracyAlert.findMany).toHaveBeenCalledWith({
        where: {
          student: { teacherId: mockTeacherId },
          resolved: false,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    test('[P0] 5.6-UNIT-009: getAlerts filters by studentId when provided', async () => {
      // Given: StudentId filter provided
      const studentId = 'student-123';
      (prisma.accuracyAlert.findMany as jest.Mock).mockResolvedValue([]);

      // When: Alerts are retrieved with studentId filter
      await getAlerts(mockTeacherId, studentId);

      // Then: Query includes studentId filter
      expect(prisma.accuracyAlert.findMany).toHaveBeenCalledWith({
        where: {
          student: { teacherId: mockTeacherId },
          studentId,
          resolved: false,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    test('[P0] 5.6-UNIT-010: getAlerts sorted by createdAt descending', async () => {
      // Given: Alerts exist
      (prisma.accuracyAlert.findMany as jest.Mock).mockResolvedValue([]);

      // When: Alerts are retrieved
      await getAlerts(mockTeacherId);

      // Then: Query includes orderBy createdAt desc
      expect(prisma.accuracyAlert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });
});

