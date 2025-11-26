'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { TimelineView } from './TimelineView';
import { transformAssignmentsForTimeline, TimelineItem } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface Assignment {
  id: string;
  studentId: string;
  topicId: string;
  startDate: string;
  endDate: string;
  questionCount: number;
  dailyTarget: number;
  examMode: boolean;
  student: {
    id: string;
    username: string;
  };
  topic: {
    id: string;
    name: string;
    lesson: {
      id: string;
      name: string;
    };
  };
}

export function TimelinePageClient() {
  const pathname = usePathname();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  // Fetch timeline data
  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('viewType', viewType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedStudentId) params.append('studentId', selectedStudentId);

      const response = await fetch(`/api/teacher/timeline?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch timeline');
      }

      setAssignments(data.data.assignments);
      setDateRange(data.data.dateRange);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [viewType, startDate, endDate, selectedStudentId]);

  // Initial load and refetch on filter changes
  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Transform assignments for timeline
  const timelineItems = useMemo(() => {
    return transformAssignmentsForTimeline(assignments, viewType);
  }, [assignments, viewType]);

  // Get unique students for filter
  const students = useMemo(() => {
    const studentMap = new Map<string, { id: string; name: string }>();
    assignments.forEach((assignment) => {
      if (!studentMap.has(assignment.studentId)) {
        studentMap.set(assignment.studentId, {
          id: assignment.studentId,
          name: assignment.student.username,
        });
      }
    });
    return Array.from(studentMap.values());
  }, [assignments]);

  // Handle view type change
  const handleViewTypeChange = useCallback((newViewType: 'daily' | 'weekly' | 'monthly') => {
    setViewType(newViewType);
  }, []);

  // Handle date range change
  const handleDateRangeChange = useCallback((start: Date, end: Date) => {
    setStartDate(start.toISOString());
    setEndDate(end.toISOString());
  }, []);

  // Handle assignment click
  const handleAssignmentClick = useCallback((assignment: any) => {
    window.location.href = `/teacher/assignments/${assignment.id}`;
  }, []);

  // Handle today button
  const handleToday = useCallback(() => {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);
    setStartDate(threeMonthsAgo.toISOString());
    setEndDate(threeMonthsLater.toISOString());
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setSelectedStudentId(null);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading timeline...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchTimeline}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                View Mode:
              </span>
              <Link href="/teacher/timeline">
                <Button
                  variant="outline"
                  size="sm"
                  className={pathname === '/teacher/timeline' ? 'bg-indigo-100 dark:bg-indigo-900' : ''}
                >
                  Timeline
                </Button>
              </Link>
              <Link href="/teacher/calendar">
                <Button
                  variant="outline"
                  size="sm"
                  className={pathname === '/teacher/calendar' ? 'bg-indigo-100 dark:bg-indigo-900' : ''}
                >
                  Calendar
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Student:
              </label>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(e.target.value || null)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date:
              </label>
              <input
                type="date"
                value={startDate ? startDate.split('T')[0] : ''}
                onChange={(e) =>
                  setStartDate(e.target.value ? new Date(e.target.value).toISOString() : null)
                }
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date:
              </label>
              <input
                type="date"
                value={endDate ? endDate.split('T')[0] : ''}
                onChange={(e) =>
                  setEndDate(e.target.value ? new Date(e.target.value).toISOString() : null)
                }
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <Button onClick={handleToday} variant="outline" size="sm">
              Today
            </Button>

            <Button onClick={handleClearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>

            <Button onClick={fetchTimeline} variant="secondary" size="sm">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px]">
            <TimelineView
              items={timelineItems}
              dateRange={dateRange}
              viewType={viewType}
              onViewTypeChange={handleViewTypeChange}
              onDateRangeChange={handleDateRangeChange}
              onAssignmentClick={handleAssignmentClick}
              onAssignmentUpdate={fetchTimeline}
            />
          </div>
        </CardContent>
      </Card>

      {/* Student Legend */}
      {students.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Student Colors
            </h3>
            <div className="flex flex-wrap gap-4">
              {students.map((student) => {
                const studentItems = timelineItems.filter(
                  (item) => item.studentId === student.id
                );
                const color = studentItems.length > 0 ? studentItems[0].color : '#3B82F6';
                return (
                  <div key={student.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {student.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

