'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ParentAssignment } from './ParentAssignment';
import { ParentList } from './ParentList';
import { DualMetricsDisplay } from './DualMetricsDisplay';
import { ProgressIndicator } from './ProgressIndicator';
import { AlertList } from './AlertList';
import { ProgressTable } from './ProgressTable';

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
  const [detailData, setDetailData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetailData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/teacher/students/${student.id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch student detail');
        }

        setDetailData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load student detail');
      } finally {
        setLoading(false);
      }
    }

    fetchDetailData();
  }, [student.id]);

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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading student details...</p>
      </div>
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

      {/* Progress Metrics */}
      {detailData && (
        <>
          <DualMetricsDisplay studentId={student.id} />

          {/* Question Counts Breakdown */}
          {detailData.questionCounts && (
            <Card>
              <CardHeader>
                <CardTitle>Question Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Right</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {detailData.questionCounts.right.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Wrong</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {detailData.questionCounts.wrong.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Empty</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {detailData.questionCounts.empty.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bonus</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {detailData.questionCounts.bonus.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {detailData.questionCounts.total.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Low Accuracy Alerts */}
          {detailData.alerts && detailData.alerts.length > 0 && (
            <AlertList studentId={student.id} />
          )}

          {/* Topics Progress */}
          {detailData.topics && detailData.topics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Progress by Topic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {detailData.topics.map((topic: any) => (
                    <div
                      key={topic.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {topic.name}
                            </h4>
                            {topic.progress && (
                              <ProgressIndicator
                                accuracy={topic.progress.accuracy}
                                threshold={70}
                                showLabel={false}
                                size="sm"
                              />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Lesson: {topic.lesson.name}
                          </p>
                          {topic.progress && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <p>
                                Accuracy: {topic.progress.accuracy !== null ? `${topic.progress.accuracy.toFixed(1)}%` : 'N/A'}
                              </p>
                              <p>
                                Questions: {topic.progress.totalQuestions.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Table */}
          <ProgressTable studentId={student.id} threshold={70} />
        </>
      )}

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

