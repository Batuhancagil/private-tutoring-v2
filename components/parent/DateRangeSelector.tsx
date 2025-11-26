'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export type DateRangePreset = '7d' | '30d' | '90d' | 'all' | 'custom';

export interface DateRange {
  range: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

interface DateRangeSelectorProps {
  onRangeChange: (range: DateRange) => void;
  loading?: boolean;
}

/**
 * DateRangeSelector Component
 * Allows parents to select date ranges for viewing historical progress data
 */
export function DateRangeSelector({ onRangeChange, loading }: DateRangeSelectorProps) {
  const [selectedRange, setSelectedRange] = useState<DateRangePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const handlePresetClick = (preset: DateRangePreset) => {
    setSelectedRange(preset);
    if (preset === 'custom') {
      // Don't trigger change until dates are selected
      return;
    }
    onRangeChange({ range: preset });
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      onRangeChange({
        range: 'custom',
        startDate: customStartDate,
        endDate: customEndDate,
      });
    }
  };

  const presetButtons = [
    { key: '7d' as const, label: 'Last 7 Days' },
    { key: '30d' as const, label: 'Last 30 Days' },
    { key: '90d' as const, label: 'Last 3 Months' },
    { key: 'all' as const, label: 'All Time' },
    { key: 'custom' as const, label: 'Custom Range' },
  ];

  // Get today's date in YYYY-MM-DD format for max date
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date Range</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {presetButtons.map((preset) => (
              <Button
                key={preset.key}
                onClick={() => handlePresetClick(preset.key)}
                disabled={loading}
                className={
                  selectedRange === preset.key
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          {selectedRange === 'custom' && (
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="start-date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    max={customEndDate || today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="end-date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                    max={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Button
                onClick={handleCustomDateChange}
                disabled={loading || !customStartDate || !customEndDate}
                className="w-full sm:w-auto"
              >
                Apply Custom Range
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              Loading data...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

