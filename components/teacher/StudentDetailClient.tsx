'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ParentAssignment } from './ParentAssignment';
import { ParentList } from './ParentList';

interface Student {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

interface StudentDetailClientProps {
  student: Student;
}

export function StudentDetailClient({ student }: StudentDetailClientProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleParentAssigned = () => {
    // Refresh parent list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">{student.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Created At
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {formatDate(student.createdAt)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Updated
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {formatDate(student.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parent Assignment */}
      <ParentAssignment
        studentId={student.id}
        onAssigned={handleParentAssigned}
      />

      {/* Assigned Parents List */}
      <ParentList
        key={refreshKey}
        studentId={student.id}
        onParentRemoved={handleParentAssigned}
      />

      {/* Back Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.push('/teacher/students')}>
          Back to Students
        </Button>
      </div>
    </div>
  );
}

