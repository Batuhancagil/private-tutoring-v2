'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ColorCodedStudentList } from './ColorCodedStudentList';

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

  // Use ColorCodedStudentList for display, but keep edit/delete functionality
  // For now, show color-coded list. Edit/Delete can be added to ColorCodedStudentList later
  return <ColorCodedStudentList threshold={70} />;
  }
);

StudentList.displayName = 'StudentList';

