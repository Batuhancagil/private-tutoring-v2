'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressIndicator } from './ProgressIndicator';
import { getProgressColorClasses } from '@/lib/progress-helpers';

interface StudentWithProgress {
  id: string;
  username: string;
  createdAt: string;
  accuracy: number | null;
  status: string;
  color: 'green' | 'yellow' | 'red';
  programProgress: number | null;
  conceptMastery: number | null;
}

interface ColorCodedStudentListProps {
  threshold?: number;
}

/**
 * ColorCodedStudentList Component
 * Displays students with color-coded status indicators
 */
export function ColorCodedStudentList({ threshold: thresholdProp }: ColorCodedStudentListProps) {
  const router = useRouter();
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'accuracy'>('name');
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
    async function fetchStudents() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/teacher/students/progress`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch students');
        }

        setStudents(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load students');
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((student) => student.color === statusFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'status':
          // Sort by color: green → yellow → red
          const colorOrder = { green: 0, yellow: 1, red: 2 };
          return colorOrder[a.color] - colorOrder[b.color];
        case 'accuracy':
          const aAcc = a.accuracy ?? -1;
          const bAcc = b.accuracy ?? -1;
          return bAcc - aAcc; // Descending
        case 'name':
        default:
          return a.username.localeCompare(b.username);
      }
    });

    return sorted;
  }, [students, statusFilter, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="py-8 text-center text-gray-600 dark:text-gray-400">
            Loading students...
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
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="py-8 text-center text-gray-600 dark:text-gray-400">
            <p className="mb-2">No students found.</p>
            <p className="text-sm">Create your first student account to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters and Sorting */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter:
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
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="accuracy">Accuracy</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Accuracy
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStudents.map((student) => {
                const colorClasses = getProgressColorClasses(student.color);
                return (
                  <tr
                    key={student.id}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      student.color === 'red'
                        ? 'bg-red-50/50 dark:bg-red-900/10'
                        : student.color === 'yellow'
                        ? 'bg-yellow-50/50 dark:bg-yellow-900/10'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <ProgressIndicator
                        accuracy={student.accuracy}
                        threshold={threshold}
                        showLabel={true}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {student.username}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {student.accuracy !== null
                        ? `${student.accuracy.toFixed(1)}%`
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(student.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/teacher/students/${student.id}`)}
                      >
                        View
                      </Button>
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

