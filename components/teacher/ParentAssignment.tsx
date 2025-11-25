'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ParentForm } from './ParentForm';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface Parent {
  id: string;
  username: string;
}

interface ParentAssignmentProps {
  studentId: string;
  onAssigned?: () => void;
}

export function ParentAssignment({
  studentId,
  onAssigned,
}: ParentAssignmentProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSelectForm, setShowSelectForm] = useState(false);
  const [availableParents, setAvailableParents] = useState<Parent[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showSelectForm) {
      fetchAvailableParents();
    }
  }, [showSelectForm]);

  const fetchAvailableParents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/teacher/parents');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch parents');
      }

      setAvailableParents(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load parents'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssignExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedParentId) {
      setError('Please select a parent');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/teacher/parents/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: selectedParentId,
          studentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign parent');
      }

      // Success - reset form and call callback
      setSelectedParentId('');
      setShowSelectForm(false);
      if (onAssigned) {
        onAssigned();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleParentCreated = async (parent: Parent) => {
    // After creating parent, assign them to the student
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/teacher/parents/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: parent.id,
          studentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign parent');
      }

      // Success - reset form and call callback
      setShowCreateForm(false);
      if (onAssigned) {
        onAssigned();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to assign parent'
      );
    } finally {
      setLoading(false);
    }
  };

  if (showCreateForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create and Assign Parent</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}
          <ParentForm
            onSuccess={handleParentCreated}
            onCancel={() => {
              setShowCreateForm(false);
              setError(null);
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (showSelectForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assign Existing Parent</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          {loading && availableParents.length === 0 ? (
            <div className="py-4 text-center text-gray-600 dark:text-gray-400">
              Loading parents...
            </div>
          ) : availableParents.length === 0 ? (
            <div className="py-4 text-center text-gray-600 dark:text-gray-400">
              <p className="mb-4">No parents available.</p>
              <Button onClick={() => {
                setShowSelectForm(false);
                setShowCreateForm(true);
              }}>
                Create New Parent
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAssignExisting} className="space-y-4">
              <div>
                <Label htmlFor="parent" required>
                  Select Parent
                </Label>
                <select
                  id="parent"
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select a parent --</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSelectForm(false);
                    setSelectedParentId('');
                    setError(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Assigning...' : 'Assign Parent'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Parent</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="outline"
          >
            Create New Parent
          </Button>
          <Button onClick={() => setShowSelectForm(true)}>
            Assign Existing Parent
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

