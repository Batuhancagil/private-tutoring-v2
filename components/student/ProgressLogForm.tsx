'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { saveOfflineLog } from '@/lib/offline-storage';
import { syncPendingLogs } from '@/lib/sync-manager';

interface TodaysAssignment {
  id: string;
  topic: string;
  questionTarget: number;
}

interface ProgressLogData {
  rightCount: number;
  wrongCount: number;
  emptyCount: number;
  bonusCount: number;
}

interface ProgressLogResponse {
  assignmentId: string;
  date: string;
  log: ProgressLogData | null;
}

export function ProgressLogForm() {
  const { isOnline } = useOnlineStatus();
  const [assignment, setAssignment] = useState<TodaysAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [formData, setFormData] = useState<ProgressLogData>({
    rightCount: 0,
    wrongCount: 0,
    emptyCount: 0,
    bonusCount: 0,
  });

  const [validationErrors, setValidationErrors] = useState<{
    rightCount?: string;
    wrongCount?: string;
    emptyCount?: string;
    bonusCount?: string;
    total?: string;
    date?: string;
  }>({});

  // Get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get max date (today) and min date (1 year ago) for date picker
  const getMaxDate = () => getTodayDateString();
  const getMinDate = () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return oneYearAgo.toISOString().split('T')[0];
  };

  // Fetch assignment and existing log for selected date
  const fetchDataForDate = async (date: string) => {
    setLoading(true);
    setError(null);
    setAssignment(null);
    setFormData({
      rightCount: 0,
      wrongCount: 0,
      emptyCount: 0,
      bonusCount: 0,
    });

    try {
      // Fetch assignment for selected date
      const assignmentResponse = await fetch(`/api/student/assignments?date=${date}`);
      if (!assignmentResponse.ok) {
        const errorResult = await assignmentResponse.json();
        throw new Error(errorResult.error || 'Failed to fetch assignment');
      }
      const assignmentResult = await assignmentResponse.json();
      
      if (assignmentResult.success && assignmentResult.data.today) {
        setAssignment({
          id: assignmentResult.data.today.id,
          topic: assignmentResult.data.today.topic,
          questionTarget: assignmentResult.data.today.questionTarget,
        });
      } else {
        setError('No assignment found for selected date');
        setLoading(false);
        return;
      }

      // Fetch existing progress log for selected date
      const progressResponse = await fetch(`/api/student/progress?date=${date}`);
      if (progressResponse.ok) {
        const progressResult = await progressResponse.json();
        if (progressResult.success && progressResult.data.log) {
          setFormData(progressResult.data.log);
        }
      } else if (progressResponse.status === 404) {
        // No log exists for this date, which is fine
        setFormData({
          rightCount: 0,
          wrongCount: 0,
          emptyCount: 0,
          bonusCount: 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's assignment and existing log on mount
  useEffect(() => {
    fetchDataForDate(selectedDate);
  }, []);

  // Try to sync pending logs when component mounts and is online
  useEffect(() => {
    if (isOnline) {
      syncPendingLogs().catch((error) => {
        // Silently fail - sync manager will handle retries
        console.error('Background sync failed:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const today = getTodayDateString();
    
    // Validate date is not in the future
    if (newDate > today) {
      setValidationErrors((prev) => ({
        ...prev,
        date: 'Cannot log progress for future dates',
      }));
      return;
    }

    // Validate date is not too far in the past
    const minDate = getMinDate();
    if (newDate < minDate) {
      setValidationErrors((prev) => ({
        ...prev,
        date: 'Cannot log progress for dates more than 1 year ago',
      }));
      return;
    }

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.date;
      return newErrors;
    });
    setSelectedDate(newDate);
    fetchDataForDate(newDate);
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    let isValid = true;

    // Validate non-negative numbers
    if (formData.rightCount < 0) {
      errors.rightCount = 'Right count cannot be negative';
      isValid = false;
    }
    if (formData.wrongCount < 0) {
      errors.wrongCount = 'Wrong count cannot be negative';
      isValid = false;
    }
    if (formData.emptyCount < 0) {
      errors.emptyCount = 'Empty count cannot be negative';
      isValid = false;
    }
    if (formData.bonusCount < 0) {
      errors.bonusCount = 'Bonus count cannot be negative';
      isValid = false;
    }

    // Validate total <= 1000
    const total =
      formData.rightCount +
      formData.wrongCount +
      formData.emptyCount +
      formData.bonusCount;
    if (total > 1000) {
      errors.total = `Total questions cannot exceed 1000 (current: ${total})`;
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setOfflineSaved(false);

    if (!validateForm() || !assignment) {
      return;
    }

    // Validate date
    const today = getTodayDateString();
    if (selectedDate > today) {
      setValidationErrors((prev) => ({
        ...prev,
        date: 'Cannot log progress for future dates',
      }));
      return;
    }

    setSubmitting(true);

    try {
      // If offline, save to local storage
      if (!isOnline) {
        saveOfflineLog({
          assignmentId: assignment.id,
          rightCount: formData.rightCount,
          wrongCount: formData.wrongCount,
          emptyCount: formData.emptyCount,
          bonusCount: formData.bonusCount,
          date: selectedDate !== getTodayDateString() ? selectedDate : getTodayDateString(),
        });

        setOfflineSaved(true);
        // Reset offline saved message after 5 seconds
        setTimeout(() => setOfflineSaved(false), 5000);
        setSubmitting(false);
        return;
      }

      // If online, submit normally
      const response = await fetch('/api/student/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: assignment.id,
          rightCount: formData.rightCount,
          wrongCount: formData.wrongCount,
          emptyCount: formData.emptyCount,
          bonusCount: formData.bonusCount,
          date: selectedDate !== getTodayDateString() ? selectedDate : undefined,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save progress');
      }

      setSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

      // Try to sync any pending offline logs
      try {
        await syncPendingLogs();
      } catch (syncError) {
        // Don't show sync errors to user, just log
        console.error('Failed to sync pending logs:', syncError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ProgressLogData, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setFormData((prev) => ({ ...prev, [field]: numValue }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (validationErrors.total) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.total;
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Log Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assignment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Log Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No assignment available for today. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalQuestions =
    formData.rightCount +
    formData.wrongCount +
    formData.emptyCount +
    formData.bonusCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Progress</CardTitle>
      </CardHeader>
      <CardContent>
          <div className="mb-4 space-y-3">
            <div>
              <Label htmlFor="logDate">Date</Label>
              <Input
                id="logDate"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={getMaxDate()}
                min={getMinDate()}
                error={validationErrors.date}
                className="h-12 text-lg"
              />
              {selectedDate !== getTodayDateString() && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Logging for a past date
                </p>
              )}
            </div>

          {assignment && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Topic: {assignment.topic}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Daily Target: {assignment.questionTarget} questions
              </p>
            </div>
          )}
        </div>

        {assignment && (
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <Label htmlFor="rightCount" required>
              Right Answers
            </Label>
            <Input
              id="rightCount"
              type="number"
              inputMode="numeric"
              min="0"
              value={formData.rightCount}
              onChange={(e) => handleInputChange('rightCount', e.target.value)}
              error={validationErrors.rightCount}
              className="h-12 text-lg"
            />
          </div>

          <div>
            <Label htmlFor="wrongCount" required>
              Wrong Answers
            </Label>
            <Input
              id="wrongCount"
              type="number"
              inputMode="numeric"
              min="0"
              value={formData.wrongCount}
              onChange={(e) => handleInputChange('wrongCount', e.target.value)}
              error={validationErrors.wrongCount}
              className="h-12 text-lg"
            />
          </div>

          <div>
            <Label htmlFor="emptyCount" required>
              Empty Answers
            </Label>
            <Input
              id="emptyCount"
              type="number"
              inputMode="numeric"
              min="0"
              value={formData.emptyCount}
              onChange={(e) => handleInputChange('emptyCount', e.target.value)}
              error={validationErrors.emptyCount}
              className="h-12 text-lg"
            />
          </div>

          <div className="border-l-4 border-green-600 dark:border-green-500 pl-4 bg-green-50 dark:bg-green-900/10 py-3 rounded-r-md">
            <Label htmlFor="bonusCount" className="text-green-700 dark:text-green-400 font-semibold">
              ⭐ Bonus Questions (Optional)
            </Label>
            <p className="text-xs text-green-600 dark:text-green-400 mb-2">
              Extra work beyond your daily target
            </p>
            <Input
              id="bonusCount"
              type="number"
              inputMode="numeric"
              min="0"
              value={formData.bonusCount}
              onChange={(e) => handleInputChange('bonusCount', e.target.value)}
              error={validationErrors.bonusCount}
              className="h-12 text-lg border-green-300 dark:border-green-700 focus:ring-green-500"
            />
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Assigned: <span className="font-semibold">{totalQuestions - formData.bonusCount}</span>
              </p>
              {formData.bonusCount > 0 && (
                <p className="text-sm text-green-700 dark:text-green-400 font-semibold">
                  Bonus: <span className="font-bold">{formData.bonusCount}</span>
                </p>
              )}
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              Total: <span className="text-lg">{totalQuestions}</span> questions
            </p>
            {validationErrors.total && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                {validationErrors.total}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-base font-medium text-green-600 dark:text-green-400">
                ✓ Progress saved successfully!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                You can continue logging or update your progress anytime.
              </p>
            </div>
          )}

          {offlineSaved && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-base font-medium text-yellow-600 dark:text-yellow-400">
                ⚠ Progress saved offline
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                Your progress has been saved locally and will sync automatically when you're back online.
              </p>
            </div>
          )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 text-lg font-semibold"
            >
              {submitting
                ? 'Saving...'
                : formData.rightCount +
                    formData.wrongCount +
                    formData.emptyCount +
                    formData.bonusCount >
                  0
                  ? 'Update Progress'
                  : 'Log Progress'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

