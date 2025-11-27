'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ProgressIndicator } from './ProgressIndicator';

interface Student {
  id: string;
  username: string;
  createdAt: Date;
  hasAlert: boolean;
  programProgress: number | null;
  conceptMastery: number | null;
}

interface DashboardData {
  students: Student[];
  summary: {
    totalStudents: number;
    studentsNeedingAttention: number;
    totalAlerts: number;
  };
}

/**
 * TeacherDashboardClient Component
 * Displays teacher dashboard with students list and summary metrics
 */
export function TeacherDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/teacher/dashboard');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch dashboard data');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Pagination
  const paginatedStudents = useMemo(() => {
    if (!data) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return data.students.slice(start, start + itemsPerPage);
  }, [data, currentPage]);

  const totalPages = useMemo(() => {
    if (!data) return 0;
    return Math.ceil(data.students.length / itemsPerPage);
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Skeleton for summary cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border p-4 sm:p-6">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        {/* Skeleton for student list */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 sm:p-6">
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
          <div className="space-y-2 sm:space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="text-center py-8 text-red-500">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.summary.totalStudents}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {data.summary.studentsNeedingAttention}
            </p>
            {data.summary.totalAlerts > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {data.summary.totalAlerts} active alert{data.summary.totalAlerts !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/teacher/students">
                <Button className="w-full" variant="outline">
                  Manage Students
                </Button>
              </Link>
              <Link href="/teacher/assignments">
                <Button className="w-full" variant="outline">
                  Create Assignment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          {data.students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don't have any students yet.
              </p>
              <Link href="/teacher/students">
                <Button>Add Your First Student</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2 sm:space-y-3">
                {paginatedStudents.map((student) => (
                  <Link
                    key={student.id}
                    href={`/teacher/students/${student.id}`}
                    className="block p-3 sm:p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-manipulation min-h-[60px]"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {student.username}
                          </h4>
                          {student.programProgress !== null && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Progress: {student.programProgress.toFixed(1)}%
                            </p>
                          )}
                        </div>
                        {student.conceptMastery !== null && (
                          <ProgressIndicator
                            accuracy={student.conceptMastery}
                            threshold={70}
                            showLabel={false}
                            size="sm"
                          />
                        )}
                      </div>
                      {student.hasAlert && (
                        <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded">
                          Alert
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

