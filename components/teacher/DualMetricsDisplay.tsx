'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressBar } from './ProgressBar';
import { ProgressIndicator } from './ProgressIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface DualMetrics {
  programProgress: number;
  conceptMastery: number | null;
  totalSolved: number;
  totalAssigned: number;
  totalRight: number;
  totalAttempted: number;
  lastUpdated: Date;
}

interface DualMetricsDisplayProps {
  studentId: string;
}

/**
 * DualMetricsDisplay Component
 * Displays Program Progress and Concept Mastery metrics side-by-side
 */
export function DualMetricsDisplay({ studentId }: DualMetricsDisplayProps) {
  const [metrics, setMetrics] = useState<DualMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/teacher/progress/student/${studentId}/metrics`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch metrics');
        }

        const result = await response.json();
        setMetrics(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      fetchMetrics();
    }
  }, [studentId]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading metrics...</div>
        </CardContent>
      </Card>
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

  if (!metrics) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-gray-500">No metrics available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <Card>
          <CardContent>
            <div className="text-center py-8 text-red-500">
              Error loading progress metrics. Please try refreshing the page.
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Student Progress Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Program Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  Program Progress
                  <ProgressIndicator
                    accuracy={metrics.programProgress}
                    threshold={70}
                    showLabel={false}
                    size="sm"
                  />
                </h4>
              </div>
              <ProgressBar
                value={metrics.programProgress}
                label=""
                showPercentage={true}
                color="auto"
                threshold={70}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metrics.totalSolved.toLocaleString()} / {metrics.totalAssigned.toLocaleString()} questions solved
              </p>
            </div>

            {/* Concept Mastery */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  Concept Mastery
                  {metrics.conceptMastery !== null && (
                    <ProgressIndicator
                      accuracy={metrics.conceptMastery}
                      threshold={70}
                      showLabel={false}
                      size="sm"
                    />
                  )}
                </h4>
              </div>
              <ProgressBar
                value={metrics.conceptMastery ?? 0}
                label=""
                showPercentage={true}
                color={metrics.conceptMastery !== null ? 'auto' : 'red'}
                threshold={70}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metrics.totalRight.toLocaleString()} / {metrics.totalAttempted.toLocaleString()} correct
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}

