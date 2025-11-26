'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressGraphs } from './ProgressGraphs';
import { DateRangeSelector, DateRange } from './DateRangeSelector';
import { LowAccuracyAlerts } from './LowAccuracyAlerts';
import { TeacherNotes } from './TeacherNotes';

interface Child {
  id: string;
  username: string;
}

interface ProgressDataPoint {
  date: string;
  totalQuestions: number;
  rightCount: number;
  wrongCount: number;
  emptyCount: number;
  bonusCount: number;
  accuracy: number | null;
}

interface DashboardData {
  children: Child[];
  progressData: ProgressDataPoint[];
}

export function ParentDashboardClient() {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ range: '30d' });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/parent/progress');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch dashboard data');
        }

        setDashboardData(result.data);
        // Auto-select first child if available
        if (result.data.children.length > 0 && !selectedChildId) {
          setSelectedChildId(result.data.children[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount to fetch initial dashboard data

  useEffect(() => {
    async function fetchProgressData() {
      if (!selectedChildId) return;

      try {
        setLoading(true);
        setError(null);

        // Build query params
        const params = new URLSearchParams();
        params.append('studentId', selectedChildId);
        params.append('range', dateRange.range);
        if (dateRange.startDate) {
          params.append('startDate', dateRange.startDate);
        }
        if (dateRange.endDate) {
          params.append('endDate', dateRange.endDate);
        }

        const response = await fetch(`/api/parent/progress?${params.toString()}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch progress data');
        }

        setDashboardData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load progress data');
      } finally {
        setLoading(false);
      }
    }

    fetchProgressData();
  }, [selectedChildId, dateRange]);

  if (loading && !dashboardData) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  const children = dashboardData?.children || [];
  const progressData = dashboardData?.progressData || [];

  return (
    <div className="space-y-6">
      {/* Low Accuracy Alerts - Display prominently at top */}
      <LowAccuracyAlerts studentId={selectedChildId || undefined} />

      {/* Child Selector */}
      {children.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Child</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.username}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {/* Date Range Selector */}
      <DateRangeSelector onRangeChange={setDateRange} loading={loading} />

      {/* Progress Graphs */}
      <ProgressGraphs data={progressData} loading={loading} dateRange={dateRange} />

      {/* Teacher Notes */}
      <TeacherNotes studentId={selectedChildId || undefined} />
    </div>
  );
}

