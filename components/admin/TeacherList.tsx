'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Teacher {
  id: string;
  username: string;
  createdAt: string;
  subscriptionStatus: 'active' | 'expired' | 'none';
  subscriptionEndDate: string | null;
}

interface TeacherListProps {
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
}

export function TeacherList({ onEdit, onDelete }: TeacherListProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/teachers');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch teachers');
      }

      setTeachers(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load teachers'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            Active
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            None
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="py-8 text-center text-gray-600 dark:text-gray-400">
            Loading teachers...
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
            <Button onClick={fetchTeachers}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teachers.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="py-8 text-center text-gray-600 dark:text-gray-400">
            <p className="mb-2">No teachers found.</p>
            <p className="text-sm">Create your first teacher account to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teachers</CardTitle>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subscription
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {teacher.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(teacher.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getSubscriptionBadge(teacher.subscriptionStatus)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(teacher)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(teacher)}
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

