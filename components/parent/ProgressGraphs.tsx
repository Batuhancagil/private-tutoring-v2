'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DateRange } from './DateRangeSelector';

interface ProgressDataPoint {
  date: string;
  totalQuestions: number;
  rightCount: number;
  wrongCount: number;
  emptyCount: number;
  bonusCount: number;
  accuracy: number | null;
}

interface ProgressGraphsProps {
  data: ProgressDataPoint[];
  loading?: boolean;
  dateRange?: DateRange;
}

interface TrendAnalysis {
  weekOverWeek: number | null;
  monthOverMonth: number | null;
  overallTrend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
}

/**
 * ProgressGraphs Component
 * Displays question count and accuracy trend graphs with trend analysis
 */
export function ProgressGraphs({ data, loading, dateRange }: ProgressGraphsProps) {
  // Calculate trend analysis
  const trendAnalysis = useMemo((): TrendAnalysis => {
    if (data.length < 2) {
      return {
        weekOverWeek: null,
        monthOverMonth: null,
        overallTrend: 'stable',
        trendPercentage: 0,
      };
    }

    // Get accuracy values (filter out nulls)
    const accuracies = data
      .map((d) => d.accuracy)
      .filter((acc): acc is number => acc !== null);

    if (accuracies.length < 2) {
      return {
        weekOverWeek: null,
        monthOverMonth: null,
        overallTrend: 'stable',
        trendPercentage: 0,
      };
    }

    // Calculate overall trend (first half vs second half)
    const midPoint = Math.floor(accuracies.length / 2);
    const firstHalfAvg =
      accuracies.slice(0, midPoint).reduce((sum, acc) => sum + acc, 0) / midPoint;
    const secondHalfAvg =
      accuracies.slice(midPoint).reduce((sum, acc) => sum + acc, 0) /
      (accuracies.length - midPoint);

    const trendPercentage = firstHalfAvg > 0 
      ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 
      : 0;

    let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (trendPercentage > 2) {
      overallTrend = 'improving';
    } else if (trendPercentage < -2) {
      overallTrend = 'declining';
    }

    // Calculate week-over-week (last 2 data points if available)
    let weekOverWeek: number | null = null;
    if (accuracies.length >= 2) {
      const lastWeek = accuracies[accuracies.length - 1];
      const prevWeek = accuracies[accuracies.length - 2];
      if (prevWeek > 0) {
        weekOverWeek = ((lastWeek - prevWeek) / prevWeek) * 100;
      }
    }

    // Calculate month-over-month (first vs last if >= 4 data points)
    let monthOverMonth: number | null = null;
    if (accuracies.length >= 4) {
      const firstMonth = accuracies.slice(0, Math.floor(accuracies.length / 4))
        .reduce((sum, acc) => sum + acc, 0) / Math.floor(accuracies.length / 4);
      const lastMonth = accuracies.slice(-Math.floor(accuracies.length / 4))
        .reduce((sum, acc) => sum + acc, 0) / Math.floor(accuracies.length / 4);
      if (firstMonth > 0) {
        monthOverMonth = ((lastMonth - firstMonth) / firstMonth) * 100;
      }
    }

    return {
      weekOverWeek,
      monthOverMonth,
      overallTrend,
      trendPercentage,
    };
  }, [data]);

  // Format data for charts
  const chartData = useMemo(() => {
    const isWeekly = dateRange?.range === '90d' || dateRange?.range === 'all';
    
    return data.map((item) => {
      const date = new Date(item.date);
      let dateLabel: string;
      
      if (isWeekly && item.date.includes('W')) {
        // Weekly format: YYYY-WW
        dateLabel = item.date;
      } else {
        // Daily format
        dateLabel = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
      
      return {
        date: dateLabel,
        fullDate: item.date,
        questions: item.totalQuestions,
        right: item.rightCount,
        wrong: item.wrongCount,
        empty: item.emptyCount,
        bonus: item.bonusCount,
        accuracy: item.accuracy ?? 0,
      };
    });
  }, [data, dateRange]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12 text-gray-500">Loading graphs...</div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Graphs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No progress data available for the selected date range.</p>
            <p className="text-sm">Try selecting a different date range or wait for progress data to be logged.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trend indicator component
  const TrendIndicator = ({ 
    label, 
    value, 
    trend 
  }: { 
    label: string; 
    value: number | null; 
    trend: 'improving' | 'declining' | 'stable' 
  }) => {
    if (value === null) return null;
    
    const isPositive = value > 0;
    const color = trend === 'improving' ? 'text-green-600' : trend === 'declining' ? 'text-red-600' : 'text-gray-600';
    const arrow = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}:</span>
        <span className={`text-sm font-semibold ${color}`}>
          {arrow} {Math.abs(value).toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Trend Analysis Summary */}
      {trendAnalysis.weekOverWeek !== null || trendAnalysis.monthOverMonth !== null ? (
        <Card>
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-4">
                <TrendIndicator 
                  label="Week-over-Week" 
                  value={trendAnalysis.weekOverWeek} 
                  trend={trendAnalysis.overallTrend} 
                />
                <TrendIndicator 
                  label="Month-over-Month" 
                  value={trendAnalysis.monthOverMonth} 
                  trend={trendAnalysis.overallTrend} 
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Overall Trend:</span>
                  <span className={`text-sm font-semibold ${
                    trendAnalysis.overallTrend === 'improving' ? 'text-green-600' :
                    trendAnalysis.overallTrend === 'declining' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {trendAnalysis.overallTrend === 'improving' ? '↑ Improving' :
                     trendAnalysis.overallTrend === 'declining' ? '↓ Declining' :
                     '→ Stable'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {/* Question Count Graph */}
      <Card>
        <CardHeader>
          <CardTitle>
            {dateRange?.range === '90d' || dateRange?.range === 'all' 
              ? 'Weekly Question Count' 
              : 'Daily Question Count'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Bar dataKey="right" stackId="a" fill="#10b981" name="Right" />
              <Bar dataKey="wrong" stackId="a" fill="#ef4444" name="Wrong" />
              <Bar dataKey="empty" stackId="a" fill="#6b7280" name="Empty" />
              <Bar dataKey="bonus" stackId="a" fill="#3b82f6" name="Bonus" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Accuracy Trend Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Accuracy Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Accuracy"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

