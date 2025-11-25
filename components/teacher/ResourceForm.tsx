'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Resource {
  id?: string;
  name: string;
  description?: string | null;
  questionCount?: number | null;
  topicId: string;
}

interface ResourceFormProps {
  resource?: Resource | null;
  topicId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ResourceForm({
  resource,
  topicId,
  onSuccess,
  onCancel,
}: ResourceFormProps) {
  const [name, setName] = useState(resource?.name || '');
  const [description, setDescription] = useState(resource?.description || '');
  const [questionCount, setQuestionCount] = useState<string>(
    resource?.questionCount?.toString() || ''
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!resource;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Resource name is required');
      return;
    }

    try {
      setLoading(true);

      const url = isEditMode
        ? `/api/teacher/resources/${resource.id}`
        : '/api/teacher/resources';

      const method = isEditMode ? 'PUT' : 'POST';

      const body: {
        name: string;
        topicId?: string;
        questionCount?: number | null;
      } = {
        name: name.trim(),
      };

      if (!isEditMode) {
        body.topicId = topicId;
      }

      if (questionCount.trim()) {
        const count = parseInt(questionCount, 10);
        if (isNaN(count) || count <= 0) {
          setError('Question count must be a positive number');
          return;
        }
        body.questionCount = count;
      } else if (isEditMode) {
        body.questionCount = null;
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
        throw new Error(data.error || 'Failed to save resource');
      }

      setName('');
      setDescription('');
      setQuestionCount('');
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
        <CardTitle>{isEditMode ? 'Edit Resource' : 'Create Resource'}</CardTitle>
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
              Resource Name
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

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="questionCount">Question Count (optional)</Label>
            <Input
              id="questionCount"
              type="number"
              min="1"
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              disabled={loading}
              placeholder="Enter number of questions"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Leave blank if not applicable
            </p>
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

