'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Note {
  id: string;
  note: string;
  teacher: {
    id: string;
    username: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ChildNotes {
  child: {
    id: string;
    username: string;
  };
  notes: Note[];
}

interface TeacherNotesProps {
  studentId?: string; // Optional filter by specific student
}

/**
 * TeacherNotes Component
 * Displays teacher notes for parent's children
 */
export function TeacherNotes({ studentId }: TeacherNotesProps) {
  const [notesData, setNotesData] = useState<ChildNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchNotes() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (studentId) {
          params.append('studentId', studentId);
        }
        params.append('sort', sortOrder);

        const response = await fetch(`/api/parent/notes?${params.toString()}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch notes');
        }

        setNotesData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notes');
      } finally {
        setLoading(false);
      }
    }

    fetchNotes();
  }, [studentId, sortOrder]);

  // Filter notes by search query
  const filteredNotesData = useMemo(() => {
    if (!searchQuery.trim()) {
      return notesData;
    }

    const query = searchQuery.toLowerCase();
    return notesData.map((childData) => ({
      ...childData,
      notes: childData.notes.filter(
        (note) =>
          note.note.toLowerCase().includes(query) ||
          note.teacher.username.toLowerCase().includes(query)
      ),
    }));
  }, [notesData, searchQuery]);

  // Filter out children with no notes after filtering
  const childrenWithNotes = filteredNotesData.filter(
    (childData) => childData.notes.length > 0
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading notes...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  // Format date helper
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Format note content (preserve line breaks)
  const formatNoteContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (childrenWithNotes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teacher Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No teacher notes available.</p>
            <p className="text-sm">
              {searchQuery
                ? 'No notes match your search.'
                : 'Notes will appear here when teachers add them.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Teacher Notes</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
            {/* Sort */}
            <div className="flex gap-2">
              <Button
                onClick={() => setSortOrder('newest')}
                className={
                  sortOrder === 'newest'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }
              >
                Newest
              </Button>
              <Button
                onClick={() => setSortOrder('oldest')}
                className={
                  sortOrder === 'oldest'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }
              >
                Oldest
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {childrenWithNotes.map((childData) => (
            <div key={childData.child.id} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {childData.child.username}
              </h3>
              <div className="space-y-4">
                {childData.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {note.teacher.username}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(note.createdAt)}
                          {note.updatedAt.getTime() !== note.createdAt.getTime() && (
                            <span className="ml-2">(updated)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {formatNoteContent(note.note)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

