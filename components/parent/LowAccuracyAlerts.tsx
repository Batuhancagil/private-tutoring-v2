'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Alert {
  id: string;
  topicId: string | null;
  topicName: string | null;
  lessonId: string | null;
  lessonName: string | null;
  accuracy: number;
  threshold: number;
  resolved: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
}

interface ChildAlerts {
  child: {
    id: string;
    username: string;
  };
  alerts: Alert[];
}

interface LowAccuracyAlertsProps {
  studentId?: string; // Optional filter by specific student
}

/**
 * LowAccuracyAlerts Component
 * Displays low accuracy alerts for parent's children
 */
export function LowAccuracyAlerts({ studentId }: LowAccuracyAlertsProps) {
  const [alertsData, setAlertsData] = useState<ChildAlerts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (studentId) {
          params.append('studentId', studentId);
        }
        params.append('resolved', 'false'); // Only show unresolved alerts

        const response = await fetch(`/api/parent/alerts?${params.toString()}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch alerts');
        }

        setAlertsData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alerts');
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, [studentId]);

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

  // Filter out children with no alerts
  const childrenWithAlerts = alertsData.filter((childData) => childData.alerts.length > 0);

  if (childrenWithAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Low Accuracy Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No active alerts.</p>
            <p className="text-sm">Your children are performing well!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to determine alert severity color
  const getSeverityColor = (accuracy: number, threshold: number) => {
    const difference = threshold - accuracy;
    if (difference > 20) {
      return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
    } else if (difference > 10) {
      return 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400';
    } else {
      return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Low Accuracy Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {childrenWithAlerts.map((childData) => (
            <div key={childData.child.id} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {childData.child.username}
              </h3>
              <div className="space-y-2">
                {childData.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.accuracy, alert.threshold)}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-semibold mb-1">
                          {alert.topicName || alert.lessonName || 'Unknown Topic'}
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Accuracy:</span>{' '}
                            <span className="font-bold">{alert.accuracy.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="font-medium">Threshold:</span>{' '}
                            {alert.threshold}%
                          </div>
                          <div className="text-xs opacity-75">
                            Alert created:{' '}
                            {new Date(alert.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Needs Help
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

