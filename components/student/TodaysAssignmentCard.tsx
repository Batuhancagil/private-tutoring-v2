'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Progress {
  logged: number;
  bonus?: number;
  target: number;
  percentage: number;
}

interface TodaysAssignment {
  id: string;
  topic: string;
  lesson: string;
  questionTarget: number;
  questionCount: number;
  startDate: string;
  endDate: string;
  progress: Progress | null;
}

interface UpcomingAssignment {
  id: string;
  topic: string;
  lesson: string;
  questionTarget: number;
  startDate: string;
}

interface AssignmentsData {
  today: TodaysAssignment | null;
  upcoming: UpcomingAssignment[];
}

export function TodaysAssignmentCard() {
  const [data, setData] = useState<AssignmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const response = await fetch('/api/student/assignments');
        if (!response.ok) {
          throw new Error('Failed to fetch assignments');
        }
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch assignments');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.today) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No assignment for today. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { today, upcoming } = data;
  const progress = today.progress;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Topic</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {today.topic}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{today.lesson}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Question Target
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {today.questionTarget} questions
            </p>
          </div>

          {progress && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700 dark:text-gray-300">Progress</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {progress.logged} / {progress.target}
                  {progress.bonus && progress.bonus > 0 && (
                    <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                      (+{progress.bonus} bonus)
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 relative overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                />
                {progress.bonus && progress.bonus > 0 && progress.percentage > 100 && (
                  <div
                    className="bg-green-600 h-2.5 rounded-full absolute top-0 transition-all"
                    style={{
                      left: '100%',
                      width: `${Math.min(((progress.bonus / progress.target) * 100), 50)}%`,
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {progress.percentage.toFixed(0)}% complete
                {progress.bonus && progress.bonus > 0 && (
                  <span className="text-green-600 dark:text-green-400 ml-1">
                    • {progress.bonus} bonus questions
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {upcoming.map((assignment) => (
                <li key={assignment.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {assignment.topic}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {assignment.lesson} • {assignment.questionTarget} questions
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Starts:{' '}
                    {new Date(assignment.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

