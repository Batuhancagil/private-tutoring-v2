'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';

interface Parent {
  id: string;
  username: string;
  createdAt: string;
}

interface ParentListProps {
  studentId: string;
  onParentRemoved?: () => void;
}

export function ParentList({ studentId, onParentRemoved }: ParentListProps) {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    parent: Parent | null;
  }>({ open: false, parent: null });

  useEffect(() => {
    fetchParents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const fetchParents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teacher/parents/students/${studentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch parents');
      }

      setParents(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load parents'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (parent: Parent) => {
    try {
      const response = await fetch('/api/teacher/parents/assign', {
        method: 'DELETE',
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
        throw new Error(data.error || 'Failed to remove parent');
      }

      // Refresh parent list
      fetchParents();
      if (onParentRemoved) {
        onParentRemoved();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove parent'
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="py-4 text-center text-gray-600 dark:text-gray-400">
            Loading parents...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="py-4 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchParents}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (parents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Parents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center text-gray-600 dark:text-gray-400">
            <p>No parents assigned to this student.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Assigned Parents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {parents.map((parent) => (
              <div
                key={parent.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {parent.username}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Added {formatDate(parent.createdAt)}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    setDeleteConfirm({ open: true, parent })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, parent: null })}
        onConfirm={() => {
          if (deleteConfirm.parent) {
            handleRemove(deleteConfirm.parent);
          }
        }}
        title="Remove Parent"
        message={`Are you sure you want to remove ${deleteConfirm.parent?.username} from this student?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}

