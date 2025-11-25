'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Lesson {
  id?: string;
  name: string;
}

interface LessonFormProps {
  lesson?: Lesson | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LessonForm({
  lesson,
  onSuccess,
  onCancel,
}: LessonFormProps) {
  const [name, setName] = useState(lesson?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!lesson;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Lesson name is required');
      return;
    }

    try {
      setLoading(true);

      const url = isEditMode
        ? `/api/teacher/lessons/${lesson.id}`
        : '/api/teacher/lessons';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save lesson');
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
        <CardTitle>{isEditMode ? 'Edit Lesson' : 'Create Lesson'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="name" required>
              Lesson Name
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

