'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CalendarView } from './CalendarView';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { getStudentColor } from '@/lib/utils';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

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
  resource?: {
    id: string;
    name: string;
  };
}

export function CalendarPageClient() {
  const pathname = usePathname();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Calculate date range based on view type
  const dateRange = useMemo(() => {
    let start: Date;
    let end: Date;

    switch (viewType) {
      case 'monthly':
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        // Extend to include full weeks
        const monthStart = startOfWeek(start, { weekStartsOn: 1 });
        const monthEnd = endOfWeek(end, { weekStartsOn: 1 });
        return { start: monthStart, end: monthEnd };
      case 'weekly':
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return { start, end };
      case 'daily':
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
        return { start, end };
      default:
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        return { start, end };
    }
  }, [viewType, currentDate]);

  // Fetch calendar data
  const fetchCalendar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('startDate', dateRange.start.toISOString());
      params.append('endDate', dateRange.end.toISOString());
      if (selectedStudentId) {
        params.append('studentId', selectedStudentId);
      }

      const response = await fetch(`/api/teacher/calendar?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch calendar');
      }

      setAssignments(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedStudentId]);

  // Initial load and refetch on changes
  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

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
  const handleViewTypeChange = useCallback((newViewType: 'monthly' | 'weekly' | 'daily') => {
    setViewType(newViewType);
  }, []);

  // Handle date change
  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Handle assignment click
  const handleAssignmentClick = useCallback((assignment: any) => {
    window.location.href = `/teacher/assignments/${assignment.id}`;
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSelectedStudentId(null);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading calendar...</p>
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
            <Button onClick={fetchCalendar}>Retry</Button>
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

            <Button onClick={handleClearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>

            <Button onClick={fetchCalendar} variant="secondary" size="sm">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px] p-4">
            <CalendarView
              assignments={assignments}
              viewType={viewType}
              onViewTypeChange={handleViewTypeChange}
              onDateChange={handleDateChange}
              onAssignmentClick={handleAssignmentClick}
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
                const color = getStudentColor(student.id);
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

