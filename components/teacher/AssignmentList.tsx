'use client';

import { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface Assignment {
  id: string;
  studentId: string;
  topicId: string;
  resourceId?: string | null;
  startDate: string;
  endDate: string;
  questionCount: number;
  dailyTarget: number;
  examMode: boolean;
  isPast?: boolean; // Computed field from API
  student: {
    id: string;
    username: string;
    role: string;
  };
  topic: {
    id: string;
    name: string;
    lesson: {
      id: string;
      name: string;
      teacherId: string | null;
    };
  };
}

interface AssignmentListProps {
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  startDate?: string; // Optional date range filter start date
  endDate?: string; // Optional date range filter end date
  defaultFilterType?: FilterType; // Optional default filter type
}

export interface AssignmentListRef {
  refresh: () => Promise<void>;
}

type FilterType = 'all' | 'current-future' | 'past' | 'custom-range';

export const AssignmentList = forwardRef<AssignmentListRef, AssignmentListProps>(
  ({ onEdit, onDelete, startDate: propStartDate, endDate: propEndDate, defaultFilterType }, ref) => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<FilterType>(defaultFilterType || 'all');
    const [customStartDate, setCustomStartDate] = useState(propStartDate || '');
    const [customEndDate, setCustomEndDate] = useState(propEndDate || '');

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters based on filter type
        const params = new URLSearchParams();
        
        if (filterType === 'past') {
          // Filter for past assignments (endDate < today or propEndDate)
          // If propEndDate is provided, use it; otherwise use today
          const endDateThreshold = propEndDate ? new Date(propEndDate) : new Date();
          endDateThreshold.setHours(0, 0, 0, 0);
          params.append('endDateBefore', endDateThreshold.toISOString());
          
          // If propStartDate is provided, add start date filter
          if (propStartDate) {
            const startDate = new Date(propStartDate);
            startDate.setHours(0, 0, 0, 0);
            params.append('startDate', startDate.toISOString());
          }
        } else if (filterType === 'current-future') {
          // Filter for current/future assignments (endDate >= today)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          params.append('endDate', today.toISOString());
        } else if (filterType === 'custom-range') {
          // Custom date range filtering
          if (customStartDate) {
            params.append('startDate', new Date(customStartDate).toISOString());
          }
          if (customEndDate) {
            params.append('endDate', new Date(customEndDate).toISOString());
          }
        }

        const response = await fetch(`/api/teacher/assignments?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch assignments');
        }

        setAssignments(data.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load assignments'
        );
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchAssignments();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterType, customStartDate, customEndDate, propStartDate, propEndDate]);

    // Filter assignments client-side for additional filtering (e.g., past vs current)
    const filteredAssignments = useMemo(() => {
      if (filterType === 'all') {
        return assignments;
      } else if (filterType === 'current-future') {
        // Additional client-side filtering to ensure we only show current/future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return assignments.filter((assignment) => {
          const endDate = new Date(assignment.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate >= today;
        });
      } else if (filterType === 'past') {
        // Additional client-side filtering to ensure we only show past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return assignments.filter((assignment) => {
          const endDate = new Date(assignment.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate < today;
        });
      }
      return assignments;
    }, [assignments, filterType]);

    // Expose refresh function to parent component
    useImperativeHandle(ref, () => ({
      refresh: fetchAssignments,
    }));

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    if (loading) {
      return (
        <Card>
          <CardContent>
            <div className="py-8 text-center text-gray-600 dark:text-gray-400">
              Loading assignments...
            </div>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <CardContent>
            <div className="py-8 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={fetchAssignments} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (filteredAssignments.length === 0 && !loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-gray-600 dark:text-gray-400">
              {filterType === 'all' 
                ? 'No assignments found. Create your first assignment to get started.'
                : `No ${filterType === 'past' ? 'past' : filterType === 'current-future' ? 'current or future' : 'matching'} assignments found.`
              }
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="mb-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <Label htmlFor="filterType" className="mb-2 block">Filter Assignments</Label>
                <select
                  id="filterType"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Assignments</option>
                  <option value="current-future">Current/Future</option>
                  <option value="past">Past Assignments</option>
                  <option value="custom-range">Custom Date Range</option>
                </select>
              </div>

              {filterType === 'custom-range' && (
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex-1">
                    <Label htmlFor="customStartDate" className="mb-2 block">Start Date</Label>
                    <Input
                      id="customStartDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="customEndDate" className="mb-2 block">End Date</Label>
                    <Input
                      id="customEndDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Student
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Topic
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Start Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                    End Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Questions
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Daily Target
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => {
                  const isPast = assignment.isPast ?? (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const endDate = new Date(assignment.endDate);
                    endDate.setHours(0, 0, 0, 0);
                    return endDate < today;
                  })();
                  
                  return (
                  <tr
                    key={assignment.id}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      isPast ? 'opacity-60 bg-gray-50 dark:bg-gray-900/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {assignment.student.username}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {assignment.topic.name}
                        {assignment.topic.lesson.teacherId === null && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            (Global)
                          </span>
                        )}
                        {isPast && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            Past
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {formatDateTime(assignment.startDate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {formatDateTime(assignment.endDate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {assignment.questionCount}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {assignment.dailyTarget}/day
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(assignment)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(assignment)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }
);

AssignmentList.displayName = 'AssignmentList';

