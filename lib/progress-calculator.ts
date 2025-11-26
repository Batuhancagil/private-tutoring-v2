import { prisma } from '@/lib/prisma';
import { logApiError } from '@/lib/error-logger';
import { trackPerformance } from '@/lib/performance-monitor';
import { checkAndGenerateAlert } from '@/lib/alert-service';
import { getAccuracyThreshold } from '@/lib/preferences-service';

/**
 * Topic progress calculation result
 */
export interface TopicProgress {
  topicId: string;
  topicName: string;
  accuracy: number | null; // null if no questions logged
  totalQuestions: number;
  rightCount: number;
  wrongCount: number;
  emptyCount: number;
  bonusCount: number;
  lastUpdated: Date;
}

/**
 * Calculate topic-level accuracy for a student
 * Formula: accuracy = (rightCount / (rightCount + wrongCount + emptyCount + bonusCount)) × 100
 * 
 * @param studentId - Student ID
 * @param topicId - Topic ID
 * @param teacherId - Teacher ID for tenant isolation (optional, for validation)
 * @returns TopicProgress object with calculated accuracy
 * @throws Error if studentId or topicId invalid, or tenant isolation violation
 */
export async function calculateTopicProgress(
  studentId: string,
  topicId: string,
  teacherId?: string
): Promise<TopicProgress> {
  const startTime = Date.now();
  const functionName = 'calculateTopicProgress';

  try {
    // Input validation
    if (!studentId || typeof studentId !== 'string' || studentId.trim().length === 0) {
      throw new Error('Invalid studentId: must be a non-empty string');
    }
    if (!topicId || typeof topicId !== 'string' || topicId.trim().length === 0) {
      throw new Error('Invalid topicId: must be a non-empty string');
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        teacherId: true,
        role: true,
      },
    });

    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    // Tenant isolation: verify student belongs to teacher if teacherId provided
    if (teacherId && student.teacherId !== teacherId) {
      throw new Error(`Access denied: student ${studentId} does not belong to teacher ${teacherId}`);
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!topic) {
      throw new Error(`Topic not found: ${topicId}`);
    }

    // Query all ProgressLog entries for this student and topic
    // Join with Assignment to filter by topicId
    const progressLogs = await prisma.progressLog.findMany({
      where: {
        studentId,
        assignment: {
          topicId,
        },
      },
      select: {
        rightCount: true,
        wrongCount: true,
        emptyCount: true,
        bonusCount: true,
        updatedAt: true,
      },
    });

    // Aggregate counts across all ProgressLog entries for this topic
    let rightCount = 0;
    let wrongCount = 0;
    let emptyCount = 0;
    let bonusCount = 0;
    let lastUpdated: Date | null = null;

    for (const log of progressLogs) {
      rightCount += log.rightCount;
      wrongCount += log.wrongCount;
      emptyCount += log.emptyCount;
      bonusCount += log.bonusCount;
      
      // Track most recent update
      if (!lastUpdated || log.updatedAt > lastUpdated) {
        lastUpdated = log.updatedAt;
      }
    }

    const totalQuestions = rightCount + wrongCount + emptyCount + bonusCount;

    // Calculate accuracy
    // Handle edge cases: zero questions, division by zero
    let accuracy: number | null = null;
    if (totalQuestions > 0) {
      accuracy = (rightCount / totalQuestions) * 100;
      // Round to 2 decimal places
      accuracy = Math.round(accuracy * 100) / 100;
    } else {
      // No questions logged - return 0 as per AC #3
      accuracy = 0;
    }

    // Performance tracking
    const calculationTime = Date.now() - startTime;
    if (calculationTime > 500) {
      // Log warning if calculation takes longer than 500ms
      console.warn(
        `[${functionName}] Calculation took ${calculationTime}ms (exceeds 500ms threshold)`
      );
    }

    const result: TopicProgress = {
      topicId: topic.id,
      topicName: topic.name,
      accuracy,
      totalQuestions,
      rightCount,
      wrongCount,
      emptyCount,
      bonusCount,
      lastUpdated: lastUpdated || new Date(),
    };

    // Check and generate alert if accuracy is below threshold
    // Don't fail progress calculation if alert generation fails
    try {
      // Get threshold from teacher preferences (default 70% if not set or teacherId missing)
      const threshold = student.teacherId
        ? await getAccuracyThreshold(student.teacherId, 70)
        : 70;
      
      await checkAndGenerateAlert(studentId, accuracy, threshold, topicId);
    } catch (alertError) {
      // Log but don't throw - alert generation failure shouldn't break progress calculation
      logApiError(
        '[calculateTopicProgress]',
        'Failed to generate alert',
        alertError instanceof Error ? alertError : new Error('Unknown alert error'),
        null as any
      );
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      `[${functionName}]`,
      `Failed to calculate topic progress: ${errorMessage}`,
      error,
      null as any // No request object in service function
    );
    throw error;
  }
}

/**
 * In-memory cache for topic progress results
 * Cache key format: `topic-progress:${studentId}:${topicId}`
 */
const progressCache = new Map<string, { data: TopicProgress; timestamp: number }>();

/**
 * Cache TTL: 5 minutes (300000ms)
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get cached topic progress if available and fresh
 */
export function getCachedTopicProgress(
  studentId: string,
  topicId: string
): TopicProgress | null {
  const cacheKey = `topic-progress:${studentId}:${topicId}`;
  const cached = progressCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  // Check if cache is still valid
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    // Cache expired, remove it
    progressCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

/**
 * Cache topic progress result
 */
export function setCachedTopicProgress(
  studentId: string,
  topicId: string,
  data: TopicProgress
): void {
  const cacheKey = `topic-progress:${studentId}:${topicId}`;
  progressCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate cached topic progress for a student and topic
 */
export function invalidateTopicProgressCache(
  studentId: string,
  topicId: string
): void {
  const cacheKey = `topic-progress:${studentId}:${topicId}`;
  progressCache.delete(cacheKey);
}

/**
 * Invalidate all cached topic progress for a student (useful when any ProgressLog is updated)
 * Also invalidates lesson progress cache since lesson aggregation depends on topic progress
 */
export function invalidateStudentTopicProgressCache(studentId: string): void {
  const keysToDelete: string[] = [];
  for (const key of progressCache.keys()) {
    if (key.startsWith(`topic-progress:${studentId}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => progressCache.delete(key));
  
  // Also invalidate lesson progress cache since it depends on topic progress
  invalidateStudentLessonProgressCache(studentId);
}

/**
 * Lesson progress calculation result
 */
export interface LessonProgress {
  lessonId: string;
  lessonName: string;
  accuracy: number | null; // null if no questions logged
  totalQuestions: number;
  topicCount: number;
  topics: TopicProgress[];
  lastUpdated: Date;
}

/**
 * Calculate lesson-level progress for a student
 * Aggregates topic metrics: accuracy = simple average of topic accuracies, total questions = sum of topic question counts
 * 
 * @param studentId - Student ID
 * @param lessonId - Lesson ID
 * @param teacherId - Teacher ID for tenant isolation (optional, for validation)
 * @returns LessonProgress object with aggregated metrics
 * @throws Error if studentId or lessonId invalid, or tenant isolation violation
 */
export async function calculateLessonProgress(
  studentId: string,
  lessonId: string,
  teacherId?: string
): Promise<LessonProgress> {
  const startTime = Date.now();
  const functionName = 'calculateLessonProgress';

  try {
    // Input validation
    if (!studentId || typeof studentId !== 'string' || studentId.trim().length === 0) {
      throw new Error('Invalid studentId: must be a non-empty string');
    }
    if (!lessonId || typeof lessonId !== 'string' || lessonId.trim().length === 0) {
      throw new Error('Invalid lessonId: must be a non-empty string');
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        teacherId: true,
        role: true,
      },
    });

    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    // Tenant isolation: verify student belongs to teacher if teacherId provided
    if (teacherId && student.teacherId !== teacherId) {
      throw new Error(`Access denied: student ${studentId} does not belong to teacher ${teacherId}`);
    }

    // Verify lesson exists and is accessible (global or teacher's custom lesson)
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        OR: [
          { teacherId: teacherId || undefined }, // Tenant isolation: current teacher's lessons
          { teacherId: null }, // Global lessons accessible to all teachers
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!lesson) {
      throw new Error(`Lesson not found: ${lessonId}`);
    }

    // Query all topics for this lesson
    const topics = await prisma.topic.findMany({
      where: {
        lessonId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get topic progress for each topic
    const topicProgresses: TopicProgress[] = [];
    let totalQuestions = 0;
    let accuracySum = 0;
    let topicsWithQuestions = 0;
    let lastUpdated: Date | null = null;

    for (const topic of topics) {
      try {
        // Reuse calculateTopicProgress() for each topic
        const topicProgress = await calculateTopicProgress(
          studentId,
          topic.id,
          teacherId
        );

        topicProgresses.push(topicProgress);
        totalQuestions += topicProgress.totalQuestions;

        // Only include topics with questions in accuracy average
        if (topicProgress.accuracy !== null && topicProgress.totalQuestions > 0) {
          accuracySum += topicProgress.accuracy;
          topicsWithQuestions++;
        }

        // Track most recent update
        if (!lastUpdated || topicProgress.lastUpdated > lastUpdated) {
          lastUpdated = topicProgress.lastUpdated;
        }
      } catch (error) {
        // Log but continue with other topics if one fails
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logApiError(
          `[${functionName}]`,
          `Failed to calculate progress for topic ${topic.id}: ${errorMessage}`,
          error,
          null as any
        );
        // Add topic with zero progress to maintain consistency
        topicProgresses.push({
          topicId: topic.id,
          topicName: topic.name,
          accuracy: 0,
          totalQuestions: 0,
          rightCount: 0,
          wrongCount: 0,
          emptyCount: 0,
          bonusCount: 0,
          lastUpdated: new Date(),
        });
      }
    }

    // Calculate lesson accuracy: simple average of topic accuracies
    let accuracy: number | null = null;
    if (topicsWithQuestions > 0) {
      accuracy = accuracySum / topicsWithQuestions;
      // Round to 2 decimal places
      accuracy = Math.round(accuracy * 100) / 100;
    } else {
      // No topics with logged questions - return 0 as per AC #3
      accuracy = 0;
    }

    // Performance tracking
    const calculationTime = Date.now() - startTime;
    if (calculationTime > 500) {
      // Log warning if calculation takes longer than 500ms
      console.warn(
        `[${functionName}] Aggregation took ${calculationTime}ms (exceeds 500ms threshold)`
      );
    }

    const result: LessonProgress = {
      lessonId: lesson.id,
      lessonName: lesson.name,
      accuracy,
      totalQuestions,
      topicCount: topics.length,
      topics: topicProgresses,
      lastUpdated: lastUpdated || new Date(),
    };

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      `[${functionName}]`,
      `Failed to calculate lesson progress: ${errorMessage}`,
      error,
      null as any // No request object in service function
    );
    throw error;
  }
}

/**
 * In-memory cache for lesson progress results
 * Cache key format: `lesson-progress:${studentId}:${lessonId}`
 */
const lessonProgressCache = new Map<string, { data: LessonProgress; timestamp: number }>();

/**
 * Get cached lesson progress if available and fresh
 */
export function getCachedLessonProgress(
  studentId: string,
  lessonId: string
): LessonProgress | null {
  const cacheKey = `lesson-progress:${studentId}:${lessonId}`;
  const cached = lessonProgressCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  // Check if cache is still valid
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    // Cache expired, remove it
    lessonProgressCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

/**
 * Cache lesson progress result
 */
export function setCachedLessonProgress(
  studentId: string,
  lessonId: string,
  data: LessonProgress
): void {
  const cacheKey = `lesson-progress:${studentId}:${lessonId}`;
  lessonProgressCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate cached lesson progress for a student and lesson
 */
export function invalidateLessonProgressCache(
  studentId: string,
  lessonId: string
): void {
  const cacheKey = `lesson-progress:${studentId}:${lessonId}`;
  lessonProgressCache.delete(cacheKey);
}

/**
 * Invalidate all cached lesson progress for a student (useful when any topic progress updates)
 */
export function invalidateStudentLessonProgressCache(studentId: string): void {
  const keysToDelete: string[] = [];
  for (const key of lessonProgressCache.keys()) {
    if (key.startsWith(`lesson-progress:${studentId}:`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => lessonProgressCache.delete(key));
}

/**
 * Dual metrics calculation result
 */
export interface DualMetrics {
  programProgress: number; // Percentage: (total solved / total assigned) × 100
  conceptMastery: number | null; // Percentage: (total right / total attempted) × 100, null if no questions attempted
  totalSolved: number; // Total questions solved (right + wrong + empty + bonus)
  totalAssigned: number; // Total questions assigned across all assignments
  totalRight: number; // Total right answers
  totalAttempted: number; // Total attempted questions (right + wrong + empty + bonus)
  lastUpdated: Date;
}

/**
 * Calculate dual metrics (Program Progress + Concept Mastery) for a student
 * Program Progress = (total questions solved) / (total questions assigned) × 100
 * Concept Mastery = (total right / total attempted) × 100
 * 
 * @param studentId - Student ID
 * @param teacherId - Teacher ID for tenant isolation (optional, for validation)
 * @returns DualMetrics object with both metrics
 * @throws Error if studentId invalid, or tenant isolation violation
 */
export async function calculateDualMetrics(
  studentId: string,
  teacherId?: string
): Promise<DualMetrics> {
  const startTime = Date.now();
  const functionName = 'calculateDualMetrics';

  try {
    // Input validation
    if (!studentId || typeof studentId !== 'string' || studentId.trim().length === 0) {
      throw new Error('Invalid studentId: must be a non-empty string');
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        teacherId: true,
        role: true,
      },
    });

    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    // Tenant isolation: verify student belongs to teacher if teacherId provided
    if (teacherId && student.teacherId !== teacherId) {
      throw new Error(`Access denied: student ${studentId} does not belong to teacher ${teacherId}`);
    }

    // Query all ProgressLog entries for this student
    const progressLogs = await prisma.progressLog.findMany({
      where: {
        studentId,
      },
      select: {
        rightCount: true,
        wrongCount: true,
        emptyCount: true,
        bonusCount: true,
        updatedAt: true,
      },
    });

    // Query all Assignment entries for this student to get total assigned
    const assignments = await prisma.assignment.findMany({
      where: {
        studentId,
      },
      select: {
        questionCount: true,
        updatedAt: true,
      },
    });

    // Aggregate ProgressLog counts
    let totalRight = 0;
    let totalWrong = 0;
    let totalEmpty = 0;
    let totalBonus = 0;
    let lastProgressUpdate: Date | null = null;

    for (const log of progressLogs) {
      totalRight += log.rightCount;
      totalWrong += log.wrongCount;
      totalEmpty += log.emptyCount;
      totalBonus += log.bonusCount;
      
      // Track most recent update
      if (!lastProgressUpdate || log.updatedAt > lastProgressUpdate) {
        lastProgressUpdate = log.updatedAt;
      }
    }

    const totalSolved = totalRight + totalWrong + totalEmpty + totalBonus;
    const totalAttempted = totalSolved; // All logged questions are considered attempted

    // Aggregate Assignment question counts
    let totalAssigned = 0;
    let lastAssignmentUpdate: Date | null = null;

    for (const assignment of assignments) {
      totalAssigned += assignment.questionCount;
      
      // Track most recent update
      if (!lastAssignmentUpdate || assignment.updatedAt > lastAssignmentUpdate) {
        lastAssignmentUpdate = assignment.updatedAt;
      }
    }

    // Calculate Program Progress: (total solved / total assigned) × 100
    let programProgress = 0;
    if (totalAssigned > 0) {
      programProgress = (totalSolved / totalAssigned) * 100;
      // Round to 2 decimal places
      programProgress = Math.round(programProgress * 100) / 100;
    } else {
      // No assignments - return 0% as per AC #3
      programProgress = 0;
    }

    // Calculate Concept Mastery: (total right / total attempted) × 100
    let conceptMastery: number | null = null;
    if (totalAttempted > 0) {
      conceptMastery = (totalRight / totalAttempted) * 100;
      // Round to 2 decimal places
      conceptMastery = Math.round(conceptMastery * 100) / 100;
    } else {
      // No questions attempted - return 0% as per AC #3
      conceptMastery = 0;
    }

    // Determine most recent update timestamp
    const lastUpdated = lastProgressUpdate && lastAssignmentUpdate
      ? (lastProgressUpdate > lastAssignmentUpdate ? lastProgressUpdate : lastAssignmentUpdate)
      : (lastProgressUpdate || lastAssignmentUpdate || new Date());

    // Performance tracking
    const calculationTime = Date.now() - startTime;
    if (calculationTime > 500) {
      // Log warning if calculation takes longer than 500ms
      console.warn(
        `[${functionName}] Calculation took ${calculationTime}ms (exceeds 500ms threshold)`
      );
    }

    const result: DualMetrics = {
      programProgress,
      conceptMastery,
      totalSolved,
      totalAssigned,
      totalRight,
      totalAttempted,
      lastUpdated,
    };

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiError(
      `[${functionName}]`,
      `Failed to calculate dual metrics: ${errorMessage}`,
      error,
      null as any // No request object in service function
    );
    throw error;
  }
}

/**
 * In-memory cache for dual metrics results
 * Cache key format: `dual-metrics:${studentId}`
 */
const dualMetricsCache = new Map<string, { data: DualMetrics; timestamp: number }>();

/**
 * Get cached dual metrics if available and fresh
 */
export function getCachedDualMetrics(studentId: string): DualMetrics | null {
  const cacheKey = `dual-metrics:${studentId}`;
  const cached = dualMetricsCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  // Check if cache is still valid
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    // Cache expired, remove it
    dualMetricsCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

/**
 * Cache dual metrics result
 */
export function setCachedDualMetrics(studentId: string, data: DualMetrics): void {
  const cacheKey = `dual-metrics:${studentId}`;
  dualMetricsCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate cached dual metrics for a student (useful when ProgressLog or Assignment is updated)
 */
export function invalidateDualMetricsCache(studentId: string): void {
  const cacheKey = `dual-metrics:${studentId}`;
  dualMetricsCache.delete(cacheKey);
}

