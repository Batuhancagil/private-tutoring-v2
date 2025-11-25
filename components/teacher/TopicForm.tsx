'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Topic {
  id?: string;
  name: string;
  lessonId: string;
}

interface TopicFormProps {
  topic?: Topic | null;
  lessonId: string;
  lessonIsGlobal?: boolean; // Indicates if the parent lesson is global
  onSuccess: () => void;
  onCancel: () => void;
}

export function TopicForm({
  topic,
  lessonId,
  lessonIsGlobal = false,
  onSuccess,
  onCancel,
}: TopicFormProps) {
  const [name, setName] = useState(topic?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!topic;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Topic name is required');
      return;
    }

    try {
      setLoading(true);

      const url = isEditMode
        ? `/api/teacher/topics/${topic.id}`
        : '/api/teacher/topics';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          lessonId: isEditMode ? topic.lessonId : lessonId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save topic');
      }

      setName('');
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
        <CardTitle>{isEditMode ? 'Edit Topic' : 'Create Topic'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          {lessonIsGlobal && !isEditMode && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
              <p className="font-medium">⚠️ Creating topic under global lesson</p>
              <p className="mt-1">
                This topic will be created under a global (pre-built) lesson. All teachers will be able to see and use this topic.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="name" required>
              Topic Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

