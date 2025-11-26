'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Subscription {
  id?: string;
  teacherId: string;
  startDate: string;
  endDate: string;
}

interface Teacher {
  id: string;
  username: string;
}

interface SubscriptionFormProps {
  subscription?: Subscription | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SubscriptionForm({
  subscription,
  onSuccess,
  onCancel,
}: SubscriptionFormProps) {
  const [teacherId, setTeacherId] = useState(subscription?.teacherId || '');
  const [startDate, setStartDate] = useState(
    subscription?.startDate ? new Date(subscription.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    subscription?.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : ''
  );
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const isEditMode = !!subscription;

  // Fetch teachers list
  useEffect(() => {
    async function fetchTeachers() {
      try {
        const response = await fetch('/api/admin/teachers');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch teachers');
        }

        setTeachers(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teachers');
      } finally {
        setLoadingTeachers(false);
      }
    }

    fetchTeachers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!teacherId) {
      setError('Teacher is required');
      return;
    }

    if (!startDate) {
      setError('Start date is required');
      return;
    }

    if (!endDate) {
      setError('End date is required');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Invalid date format');
      return;
    }

    if (end <= start) {
      setError('End date must be after start date');
      return;
    }

    try {
      setLoading(true);

      const url = isEditMode
        ? `/api/admin/subscriptions/${subscription.id}`
        : '/api/admin/subscriptions';

      const method = isEditMode ? 'PUT' : 'POST';

      const body: any = {
        teacherId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };

      // For updates, only send changed fields
      if (isEditMode) {
        const updateBody: any = {};
        if (startDate !== subscription.startDate) {
          updateBody.startDate = start.toISOString();
        }
        if (endDate !== subscription.endDate) {
          updateBody.endDate = end.toISOString();
        }
        // Note: teacherId cannot be changed (unique constraint)
        Object.assign(body, updateBody);
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save subscription');
      }

      // Success - reset form and call callback
      setTeacherId('');
      setStartDate('');
      setEndDate('');
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Subscription' : 'Create Subscription'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="teacherId" required>
              Teacher
            </Label>
            <select
              id="teacherId"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              disabled={loading || loadingTeachers || isEditMode}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.username}
                </option>
              ))}
            </select>
            {isEditMode && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Teacher cannot be changed for existing subscriptions
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="startDate" required>
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <Label htmlFor="endDate" required>
              End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              disabled={loading}
              required
            />
            {startDate && endDate && new Date(endDate) <= new Date(startDate) && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                End date must be after start date
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingTeachers}>
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

