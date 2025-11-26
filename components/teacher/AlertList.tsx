'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressIndicator } from './ProgressIndicator';

interface Alert {
  id: string;
  studentId: string;
  topicId: string | null;
  lessonId: string | null;
  accuracy: number;
  threshold: number;
  resolved: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
  student: {
    id: string;
    username: string;
  };
  topic: {
    id: string;
    name: string;
  } | null;
  lesson: {
    id: string;
    name: string;
  } | null;
}

interface AlertListProps {
  studentId?: string;
}

/**
 * AlertList Component
 * Displays list of low accuracy alerts
 */
export function AlertList({ studentId }: AlertListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (studentId) {
          params.append('studentId', studentId);
        }
        params.append('resolved', showResolved.toString());

        const response = await fetch(`/api/teacher/alerts?${params.toString()}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch alerts');
        }

        const result = await response.json();
        setAlerts(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alerts');
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, [studentId, showResolved]);

  async function handleResolve(alertId: string) {
    try {
      const response = await fetch(`/api/teacher/alerts/${alertId}/resolve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resolve alert');
      }

      // Remove resolved alert from list if showing unresolved only
      if (!showResolved) {
        setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      } else {
        // Refresh alerts to get updated resolved status
        const refreshResponse = await fetch(
          `/api/teacher/alerts?resolved=${showResolved}`
        );
        if (refreshResponse.ok) {
          const result = await refreshResponse.json();
          setAlerts(result.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve alert');
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading alerts...</div>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Low Accuracy Alerts</CardTitle>
          <Button
            onClick={() => setShowResolved(!showResolved)}
            variant="outline"
            size="sm"
          >
            {showResolved ? 'Show Unresolved' : 'Show Resolved'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {showResolved
              ? 'No resolved alerts'
              : 'No active alerts - all students are on track!'}
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {alert.student.username}
                      </h4>
                      <ProgressIndicator
                        accuracy={alert.accuracy}
                        threshold={alert.threshold}
                        showLabel={true}
                        size="sm"
                      />
                    </div>
                    {alert.topic && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Topic: {alert.topic.name}
                      </p>
                    )}
                    {alert.lesson && !alert.topic && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Lesson: {alert.lesson.name}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Accuracy: {alert.accuracy.toFixed(1)}% (Threshold: {alert.threshold}%)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {alert.resolved
                        ? `Resolved: ${new Date(alert.resolvedAt!).toLocaleString()}`
                        : `Created: ${new Date(alert.createdAt).toLocaleString()}`}
                    </p>
                  </div>
                  {!alert.resolved && (
                    <Button
                      onClick={() => handleResolve(alert.id)}
                      variant="outline"
                      size="sm"
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

