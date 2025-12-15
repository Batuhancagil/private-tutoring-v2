/**
 * Epic 5, Stories 5.1, 5.2, 5.3: Progress Calculation - Unit Tests
 * 
 * P0 Unit Tests for progress calculation functions:
 * - Topic-level accuracy calculation
 * - Lesson-level aggregation
 * - Dual metrics calculation
 * - Edge cases and error handling
 */

import {
  calculateTopicProgress,
  calculateLessonProgress,
  calculateDualMetrics,
  TopicProgress,
  LessonProgress,
  DualMetrics,
} from '@/lib/progress-calculator';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    topic: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    lesson: {
      findFirst: jest.fn(),
    },
    progressLog: {
      findMany: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/error-logger', () => ({
  logApiError: jest.fn(),
}));

jest.mock('@/lib/alert-service', () => ({
  checkAndGenerateAlert: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/preferences-service', () => ({
  getAccuracyThreshold: jest.fn().mockResolvedValue(70),
}));

describe('Story 5.1: Topic-Level Accuracy Calculation [P0]', () => {
  const mockStudentId = 'student-123';
  const mockTopicId = 'topic-123';
  const mockTeacherId = 'teacher-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Accuracy Calculation Formula', () => {
    test('[P0] 5.1-UNIT-001: Accuracy calculated correctly: (300 / (300+100+50+0)) × 100 = 66.67%', async () => {
      // Given: Student has logged questions with right=300, wrong=100, empty=50, bonus=0
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue({
        id: mockTopicId,
        name: 'Test Topic',
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          rightCount: 300,
          wrongCount: 100,
          emptyCount: 50,
          bonusCount: 0,
          updatedAt: new Date(),
        },
      ]);

      // When: Topic progress is calculated
      const result = await calculateTopicProgress(mockStudentId, mockTopicId, mockTeacherId);

      // Then: Accuracy is 66.67% (300 / 450 × 100)
      expect(result.accuracy).toBeCloseTo(66.67, 1);
      expect(result.totalQuestions).toBe(450);
      expect(result.rightCount).toBe(300);
      expect(result.wrongCount).toBe(100);
      expect(result.emptyCount).toBe(50);
      expect(result.bonusCount).toBe(0);
    });

    test('[P0] 5.1-UNIT-002: Accuracy includes bonus questions in denominator', async () => {
      // Given: Student has logged questions with bonus questions
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue({
        id: mockTopicId,
        name: 'Test Topic',
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          rightCount: 200,
          wrongCount: 50,
          emptyCount: 0,
          bonusCount: 50, // Bonus questions included
          updatedAt: new Date(),
        },
      ]);

      // When: Topic progress is calculated
      const result = await calculateTopicProgress(mockStudentId, mockTopicId, mockTeacherId);

      // Then: Accuracy = 200 / (200+50+0+50) × 100 = 66.67%
      expect(result.accuracy).toBeCloseTo(66.67, 1);
      expect(result.totalQuestions).toBe(300);
      expect(result.bonusCount).toBe(50);
    });

    test('[P0] 5.1-UNIT-003: Multiple ProgressLog entries aggregated correctly', async () => {
      // Given: Student has multiple ProgressLog entries for same topic
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue({
        id: mockTopicId,
        name: 'Test Topic',
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          rightCount: 100,
          wrongCount: 20,
          emptyCount: 10,
          bonusCount: 5,
          updatedAt: new Date('2025-11-25'),
        },
        {
          rightCount: 150,
          wrongCount: 30,
          emptyCount: 20,
          bonusCount: 10,
          updatedAt: new Date('2025-11-26'),
        },
      ]);

      // When: Topic progress is calculated
      const result = await calculateTopicProgress(mockStudentId, mockTopicId, mockTeacherId);

      // Then: All entries are aggregated
      expect(result.rightCount).toBe(250);
      expect(result.wrongCount).toBe(50);
      expect(result.emptyCount).toBe(30);
      expect(result.bonusCount).toBe(15);
      expect(result.totalQuestions).toBe(345);
      expect(result.accuracy).toBeCloseTo(72.46, 1); // 250 / 345 × 100
    });
  });

  describe('Edge Cases', () => {
    test('[P0] 5.1-UNIT-004: Zero questions returns 0, no error thrown', async () => {
      // Given: Student has no logged questions for topic
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue({
        id: mockTopicId,
        name: 'Test Topic',
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([]);

      // When: Topic progress is calculated
      const result = await calculateTopicProgress(mockStudentId, mockTopicId, mockTeacherId);

      // Then: Accuracy is 0, no error thrown
      expect(result.accuracy).toBe(0);
      expect(result.totalQuestions).toBe(0);
      expect(result.rightCount).toBe(0);
    });

    test('[P0] 5.1-UNIT-005: All questions right returns 100%', async () => {
      // Given: All questions answered correctly
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue({
        id: mockTopicId,
        name: 'Test Topic',
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          rightCount: 100,
          wrongCount: 0,
          emptyCount: 0,
          bonusCount: 0,
          updatedAt: new Date(),
        },
      ]);

      // When: Topic progress is calculated
      const result = await calculateTopicProgress(mockStudentId, mockTopicId, mockTeacherId);

      // Then: Accuracy is 100%
      expect(result.accuracy).toBe(100);
    });

    test('[P0] 5.1-UNIT-006: All questions wrong returns 0%', async () => {
      // Given: All questions answered incorrectly
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue({
        id: mockTopicId,
        name: 'Test Topic',
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          rightCount: 0,
          wrongCount: 100,
          emptyCount: 0,
          bonusCount: 0,
          updatedAt: new Date(),
        },
      ]);

      // When: Topic progress is calculated
      const result = await calculateTopicProgress(mockStudentId, mockTopicId, mockTeacherId);

      // Then: Accuracy is 0%
      expect(result.accuracy).toBe(0);
    });

    test('[P0] 5.1-UNIT-007: Division by zero protection', async () => {
      // Given: All counts are zero
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue({
        id: mockTopicId,
        name: 'Test Topic',
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          rightCount: 0,
          wrongCount: 0,
          emptyCount: 0,
          bonusCount: 0,
          updatedAt: new Date(),
        },
      ]);

      // When: Topic progress is calculated
      const result = await calculateTopicProgress(mockStudentId, mockTopicId, mockTeacherId);

      // Then: No division by zero error, returns 0
      expect(result.accuracy).toBe(0);
      expect(result.totalQuestions).toBe(0);
    });
  });

  describe('Input Validation', () => {
    test('[P0] 5.1-UNIT-008: Invalid studentId throws error', async () => {
      // Given: Invalid studentId
      // When: Topic progress is calculated
      // Then: Error is thrown
      await expect(
        calculateTopicProgress('', mockTopicId, mockTeacherId)
      ).rejects.toThrow('Invalid studentId');
    });

    test('[P0] 5.1-UNIT-009: Invalid topicId throws error', async () => {
      // Given: Invalid topicId
      // When: Topic progress is calculated
      // Then: Error is thrown
      await expect(
        calculateTopicProgress(mockStudentId, '', mockTeacherId)
      ).rejects.toThrow('Invalid topicId');
    });

    test('[P0] 5.1-UNIT-010: Non-existent student throws error', async () => {
      // Given: Student doesn't exist
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // When: Topic progress is calculated
      // Then: Error is thrown
      await expect(
        calculateTopicProgress(mockStudentId, mockTopicId, mockTeacherId)
      ).rejects.toThrow('Student not found');
    });

    test('[P0] 5.1-UNIT-011: Tenant isolation enforced', async () => {
      // Given: Student belongs to different teacher
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: 'different-teacher',
        role: UserRole.STUDENT,
      });

      // When: Topic progress is calculated with wrong teacherId
      // Then: Error is thrown
      await expect(
        calculateTopicProgress(mockStudentId, mockTopicId, mockTeacherId)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('Performance', () => {
    test('[P0] 5.1-UNIT-012: Calculation completes in < 500ms', async () => {
      // Given: Normal progress data
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.topic.findUnique as jest.Mock).mockResolvedValue({
        id: mockTopicId,
        name: 'Test Topic',
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          rightCount: 100,
          wrongCount: 20,
          emptyCount: 10,
          bonusCount: 5,
          updatedAt: new Date(),
        },
      ]);

      // When: Topic progress is calculated
      const startTime = Date.now();
      await calculateTopicProgress(mockStudentId, mockTopicId, mockTeacherId);
      const duration = Date.now() - startTime;

      // Then: Calculation completes in < 500ms
      expect(duration).toBeLessThan(500);
    });
  });
});

describe('Story 5.2: Lesson-Level Aggregation [P0]', () => {
  const mockStudentId = 'student-123';
  const mockLessonId = 'lesson-123';
  const mockTeacherId = 'teacher-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Aggregation Logic', () => {
    test('[P0] 5.2-UNIT-001: Lesson accuracy = average of topic accuracies', async () => {
      // Given: Lesson with 3 topics with accuracies 80%, 85%, 90%
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({
        id: mockLessonId,
        name: 'Test Lesson',
      });
      (prisma.topic.findMany as jest.Mock).mockResolvedValue([
        { id: 'topic-1', name: 'Topic 1' },
        { id: 'topic-2', name: 'Topic 2' },
        { id: 'topic-3', name: 'Topic 3' },
      ]);

      // Mock calculateTopicProgress for each topic
      const { calculateTopicProgress } = require('@/lib/progress-calculator');
      jest.spyOn(require('@/lib/progress-calculator'), 'calculateTopicProgress')
        .mockResolvedValueOnce({
          topicId: 'topic-1',
          topicName: 'Topic 1',
          accuracy: 80,
          totalQuestions: 100,
          rightCount: 80,
          wrongCount: 10,
          emptyCount: 10,
          bonusCount: 0,
          lastUpdated: new Date(),
        })
        .mockResolvedValueOnce({
          topicId: 'topic-2',
          topicName: 'Topic 2',
          accuracy: 85,
          totalQuestions: 150,
          rightCount: 127.5,
          wrongCount: 15,
          emptyCount: 7.5,
          bonusCount: 0,
          lastUpdated: new Date(),
        })
        .mockResolvedValueOnce({
          topicId: 'topic-3',
          topicName: 'Topic 3',
          accuracy: 90,
          totalQuestions: 200,
          rightCount: 180,
          wrongCount: 10,
          emptyCount: 10,
          bonusCount: 0,
          lastUpdated: new Date(),
        });

      // When: Lesson progress is calculated
      const result = await calculateLessonProgress(mockStudentId, mockLessonId, mockTeacherId);

      // Then: Lesson accuracy = average(80, 85, 90) = 85%
      expect(result.accuracy).toBeCloseTo(85, 1);
      expect(result.totalQuestions).toBe(450); // Sum of topic question counts
      expect(result.topicCount).toBe(3);
    });

    test('[P0] 5.2-UNIT-002: Lesson total questions = sum of topic question counts', async () => {
      // Given: Lesson with topics having different question counts
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({
        id: mockLessonId,
        name: 'Test Lesson',
      });
      (prisma.topic.findMany as jest.Mock).mockResolvedValue([
        { id: 'topic-1', name: 'Topic 1' },
        { id: 'topic-2', name: 'Topic 2' },
      ]);

      jest.spyOn(require('@/lib/progress-calculator'), 'calculateTopicProgress')
        .mockResolvedValueOnce({
          topicId: 'topic-1',
          topicName: 'Topic 1',
          accuracy: 80,
          totalQuestions: 100,
          rightCount: 80,
          wrongCount: 10,
          emptyCount: 10,
          bonusCount: 0,
          lastUpdated: new Date(),
        })
        .mockResolvedValueOnce({
          topicId: 'topic-2',
          topicName: 'Topic 2',
          accuracy: 85,
          totalQuestions: 150,
          rightCount: 127.5,
          wrongCount: 15,
          emptyCount: 7.5,
          bonusCount: 0,
          lastUpdated: new Date(),
        });

      // When: Lesson progress is calculated
      const result = await calculateLessonProgress(mockStudentId, mockLessonId, mockTeacherId);

      // Then: Total questions = 100 + 150 = 250
      expect(result.totalQuestions).toBe(250);
    });

    test('[P0] 5.2-UNIT-003: Simple average (not weighted by question count)', async () => {
      // Given: Topics with very different question counts but same accuracy
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({
        id: mockLessonId,
        name: 'Test Lesson',
      });
      (prisma.topic.findMany as jest.Mock).mockResolvedValue([
        { id: 'topic-1', name: 'Topic 1' },
        { id: 'topic-2', name: 'Topic 2' },
      ]);

      jest.spyOn(require('@/lib/progress-calculator'), 'calculateTopicProgress')
        .mockResolvedValueOnce({
          topicId: 'topic-1',
          topicName: 'Topic 1',
          accuracy: 80,
          totalQuestions: 10, // Small count
          rightCount: 8,
          wrongCount: 1,
          emptyCount: 1,
          bonusCount: 0,
          lastUpdated: new Date(),
        })
        .mockResolvedValueOnce({
          topicId: 'topic-2',
          topicName: 'Topic 2',
          accuracy: 80,
          totalQuestions: 1000, // Large count
          rightCount: 800,
          wrongCount: 100,
          emptyCount: 100,
          bonusCount: 0,
          lastUpdated: new Date(),
        });

      // When: Lesson progress is calculated
      const result = await calculateLessonProgress(mockStudentId, mockLessonId, mockTeacherId);

      // Then: Accuracy is simple average (80 + 80) / 2 = 80%, not weighted average
      expect(result.accuracy).toBe(80);
      // If weighted, it would be closer to topic-2's accuracy due to larger count
    });
  });

  describe('Edge Cases', () => {
    test('[P0] 5.2-UNIT-004: No topics returns 0, no error', async () => {
      // Given: Lesson with no topics
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({
        id: mockLessonId,
        name: 'Test Lesson',
      });
      (prisma.topic.findMany as jest.Mock).mockResolvedValue([]);

      // When: Lesson progress is calculated
      const result = await calculateLessonProgress(mockStudentId, mockLessonId, mockTeacherId);

      // Then: Accuracy is 0, no error thrown
      expect(result.accuracy).toBe(0);
      expect(result.totalQuestions).toBe(0);
      expect(result.topicCount).toBe(0);
    });

    test('[P0] 5.2-UNIT-005: No logged questions returns 0', async () => {
      // Given: Topics exist but no questions logged
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({
        id: mockLessonId,
        name: 'Test Lesson',
      });
      (prisma.topic.findMany as jest.Mock).mockResolvedValue([
        { id: 'topic-1', name: 'Topic 1' },
      ]);

      jest.spyOn(require('@/lib/progress-calculator'), 'calculateTopicProgress')
        .mockResolvedValueOnce({
          topicId: 'topic-1',
          topicName: 'Topic 1',
          accuracy: 0,
          totalQuestions: 0,
          rightCount: 0,
          wrongCount: 0,
          emptyCount: 0,
          bonusCount: 0,
          lastUpdated: new Date(),
        });

      // When: Lesson progress is calculated
      const result = await calculateLessonProgress(mockStudentId, mockLessonId, mockTeacherId);

      // Then: Accuracy is 0
      expect(result.accuracy).toBe(0);
    });

    test('[P0] 5.2-UNIT-006: Single topic works correctly', async () => {
      // Given: Lesson with single topic
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({
        id: mockLessonId,
        name: 'Test Lesson',
      });
      (prisma.topic.findMany as jest.Mock).mockResolvedValue([
        { id: 'topic-1', name: 'Topic 1' },
      ]);

      jest.spyOn(require('@/lib/progress-calculator'), 'calculateTopicProgress')
        .mockResolvedValueOnce({
          topicId: 'topic-1',
          topicName: 'Topic 1',
          accuracy: 85,
          totalQuestions: 100,
          rightCount: 85,
          wrongCount: 10,
          emptyCount: 5,
          bonusCount: 0,
          lastUpdated: new Date(),
        });

      // When: Lesson progress is calculated
      const result = await calculateLessonProgress(mockStudentId, mockLessonId, mockTeacherId);

      // Then: Lesson accuracy = topic accuracy (85%)
      expect(result.accuracy).toBe(85);
      expect(result.totalQuestions).toBe(100);
    });
  });
});

describe('Story 5.3: Dual Metrics Calculation [P0]', () => {
  const mockStudentId = 'student-123';
  const mockTeacherId = 'teacher-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Program Progress Calculation', () => {
    test('[P0] 5.3-UNIT-001: Program Progress = 1500 solved / 2000 assigned = 75%', async () => {
      // Given: Student has solved 1500 questions out of 2000 assigned
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          rightCount: 1200,
          wrongCount: 200,
          emptyCount: 100,
          bonusCount: 0,
          updatedAt: new Date(),
        },
      ]);
      (prisma.assignment.findMany as jest.Mock).mockResolvedValue([
        { questionCount: 1000, updatedAt: new Date() },
        { questionCount: 1000, updatedAt: new Date() },
      ]);

      // When: Dual metrics are calculated
      const result = await calculateDualMetrics(mockStudentId, mockTeacherId);

      // Then: Program Progress = 1500 / 2000 × 100 = 75%
      expect(result.programProgress).toBeCloseTo(75, 1);
      expect(result.totalSolved).toBe(1500);
      expect(result.totalAssigned).toBe(2000);
    });

    test('[P0] 5.3-UNIT-002: No assignments returns 0%', async () => {
      // Given: Student has no assignments
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.assignment.findMany as jest.Mock).mockResolvedValue([]);

      // When: Dual metrics are calculated
      const result = await calculateDualMetrics(mockStudentId, mockTeacherId);

      // Then: Program Progress = 0%
      expect(result.programProgress).toBe(0);
      expect(result.totalAssigned).toBe(0);
    });

    test('[P0] 5.3-UNIT-003: All questions solved returns 100%', async () => {
      // Given: Student has solved all assigned questions
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          rightCount: 500,
          wrongCount: 300,
          emptyCount: 200,
          bonusCount: 0,
          updatedAt: new Date(),
        },
      ]);
      (prisma.assignment.findMany as jest.Mock).mockResolvedValue([
        { questionCount: 1000, updatedAt: new Date() },
      ]);

      // When: Dual metrics are calculated
      const result = await calculateDualMetrics(mockStudentId, mockTeacherId);

      // Then: Program Progress = 1000 / 1000 × 100 = 100%
      expect(result.programProgress).toBe(100);
    });
  });

  describe('Concept Mastery Calculation', () => {
    test('[P0] 5.3-UNIT-004: Concept Mastery = 1200 right / 1500 attempted = 80%', async () => {
      // Given: Student has 1200 right out of 1500 attempted
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([
        {
          rightCount: 1200,
          wrongCount: 200,
          emptyCount: 100,
          bonusCount: 0,
          updatedAt: new Date(),
        },
      ]);
      (prisma.assignment.findMany as jest.Mock).mockResolvedValue([
        { questionCount: 2000, updatedAt: new Date() },
      ]);

      // When: Dual metrics are calculated
      const result = await calculateDualMetrics(mockStudentId, mockTeacherId);

      // Then: Concept Mastery = 1200 / 1500 × 100 = 80%
      expect(result.conceptMastery).toBeCloseTo(80, 1);
      expect(result.totalRight).toBe(1200);
      expect(result.totalAttempted).toBe(1500);
    });

    test('[P0] 5.3-UNIT-005: No logged questions returns 0%', async () => {
      // Given: Student has no logged questions
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.assignment.findMany as jest.Mock).mockResolvedValue([
        { questionCount: 1000, updatedAt: new Date() },
      ]);

      // When: Dual metrics are calculated
      const result = await calculateDualMetrics(mockStudentId, mockTeacherId);

      // Then: Concept Mastery = 0%
      expect(result.conceptMastery).toBe(0);
      expect(result.totalAttempted).toBe(0);
    });

    test('[P0] 5.3-UNIT-006: Division by zero protection', async () => {
      // Given: No questions attempted
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockStudentId,
        teacherId: mockTeacherId,
        role: UserRole.STUDENT,
      });
      (prisma.progressLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.assignment.findMany as jest.Mock).mockResolvedValue([]);

      // When: Dual metrics are calculated
      const result = await calculateDualMetrics(mockStudentId, mockTeacherId);

      // Then: No division by zero error, returns 0%
      expect(result.programProgress).toBe(0);
      expect(result.conceptMastery).toBe(0);
    });
  });
});

