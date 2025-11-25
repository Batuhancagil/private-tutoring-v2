'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Student {
  id: string;
  username: string;
  createdAt: string;
}

interface StudentListProps {
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export interface StudentListRef {
  refresh: () => Promise<void>;
}

export const StudentList = forwardRef<StudentListRef, StudentListProps>(
  ({ onEdit, onDelete }, ref) => {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/teacher/students');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch students');
        }

        setStudents(data.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load students'
        );
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchStudents();
    }, []);

    // Expose refresh function to parent component
    useImperativeHandle(ref, () => ({
      refresh: fetchStudents,
    }));

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
            <Button onClick={fetchStudents}>Retry</Button>
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
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
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {student.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(student.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/teacher/students/${student.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(student)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(student)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
  }
);

StudentList.displayName = 'StudentList';

