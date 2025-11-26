'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressIndicator } from './ProgressIndicator';
import { getProgressColorClasses } from '@/lib/progress-helpers';

interface TopicProgress {
  topicId: string;
  topicName: string;
  accuracy: number | null;
  totalQuestions: number;
  rightCount: number;
  wrongCount: number;
  emptyCount: number;
  bonusCount: number;
  status: string;
  color: 'green' | 'yellow' | 'red';
  lastUpdated: Date | null;
}

interface LessonData {
  lessonId: string;
  lessonName: string;
  topics: TopicProgress[];
}

interface ProgressTableProps {
  studentId: string;
  threshold?: number;
}

/**
 * ProgressTable Component
 * Displays hierarchical table of student progress by lessons and topics
 */
export function ProgressTable({ studentId, threshold: thresholdProp }: ProgressTableProps) {
  const [data, setData] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonFilter, setLessonFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');
  const [sortBy, setSortBy] = useState<'lesson' | 'topic' | 'accuracy'>('lesson');
  const [threshold, setThreshold] = useState<number>(thresholdProp ?? 70);

  useEffect(() => {
    async function fetchThreshold() {
      try {
        const response = await fetch('/api/teacher/preferences/threshold');
        const result = await response.json();
        if (response.ok && result.data?.threshold) {
          setThreshold(result.data.threshold);
        }
      } catch (err) {
        // Use default if fetch fails
      }
    }

    fetchThreshold();
  }, []);

  useEffect(() => {
    async function fetchProgressTable() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/teacher/students/${studentId}/progress-table`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch progress table');
        }

        setData(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load progress table');
      } finally {
        setLoading(false);
      }
    }

    fetchProgressTable();
  }, [studentId]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply lesson filter
    if (lessonFilter !== 'all') {
      filtered = filtered.filter((lesson) => lesson.lessonId === lessonFilter);
    }

    // Apply status filter to topics
    if (statusFilter !== 'all') {
      filtered = filtered.map((lesson) => ({
        ...lesson,
        topics: lesson.topics.filter((topic) => topic.color === statusFilter),
      }));
    }

    // Apply sorting
    const sorted = [...filtered].map((lesson) => {
      const sortedTopics = [...lesson.topics].sort((a, b) => {
        switch (sortBy) {
          case 'topic':
            return a.topicName.localeCompare(b.topicName);
          case 'accuracy':
            const aAcc = a.accuracy ?? -1;
            const bAcc = b.accuracy ?? -1;
            return bAcc - aAcc; // Descending
          case 'lesson':
          default:
            return 0; // Keep original order
        }
      });
      return { ...lesson, topics: sortedTopics };
    });

    return sorted;
  }, [data, lessonFilter, statusFilter, sortBy]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading progress table...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  // Flatten data for table display
  const tableRows = filteredAndSortedData.flatMap((lesson) =>
    lesson.topics.map((topic) => ({
      lessonName: lesson.lessonName,
      lessonId: lesson.lessonId,
      ...topic,
    }))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Table</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Lesson:
            </label>
            <select
              value={lessonFilter}
              onChange={(e) => setLessonFilter(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">All Lessons</option>
              {data.map((lesson) => (
                <option key={lesson.lessonId} value={lesson.lessonId}>
                  {lesson.lessonName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">All</option>
              <option value="green">On Track</option>
              <option value="yellow">Needs Attention</option>
              <option value="red">Struggling</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="lesson">Lesson</option>
              <option value="topic">Topic</option>
              <option value="accuracy">Accuracy</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lesson
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Topic
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Accuracy
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Questions
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Breakdown
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No progress data found
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => {
                  const colorClasses = getProgressColorClasses(row.color);
                  return (
                    <tr
                      key={`${row.lessonId}-${row.topicId}`}
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        row.color === 'red'
                          ? 'bg-red-50/50 dark:bg-red-900/10'
                          : row.color === 'yellow'
                          ? 'bg-yellow-50/50 dark:bg-yellow-900/10'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {row.lessonName}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {row.topicName}
                      </td>
                      <td className="px-4 py-3">
                        <ProgressIndicator
                          accuracy={row.accuracy}
                          threshold={threshold}
                          showLabel={false}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {row.accuracy !== null ? `${row.accuracy.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {row.totalQuestions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-500">
                        R:{row.rightCount} W:{row.wrongCount} E:{row.emptyCount}
                        {row.bonusCount > 0 && ` B:${row.bonusCount}`}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-500">
                        {row.lastUpdated
                          ? new Date(row.lastUpdated).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

