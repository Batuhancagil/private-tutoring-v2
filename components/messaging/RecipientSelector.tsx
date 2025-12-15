'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';

interface Recipient {
  id: string;
  username: string;
  role: string;
  studentName?: string; // For parents, show associated student name
}

interface RecipientSelectorProps {
  currentUserRole: string;
  currentUserId: string;
  selectedRecipientId: string | null;
  onSelectRecipient: (recipientId: string) => void;
  disabled?: boolean;
}

export function RecipientSelector({
  currentUserRole,
  currentUserId,
  selectedRecipientId,
  onSelectRecipient,
  disabled,
}: RecipientSelectorProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecipients() {
      try {
        setLoading(true);
        setError(null);

        if (currentUserRole === 'TEACHER') {
          // Fetch teacher's students and parents
          const [studentsResponse, parentsResponse] = await Promise.all([
            fetch('/api/teacher/students'),
            fetch('/api/teacher/parents'),
          ]);

          const studentsResult = await studentsResponse.json();
          const parentsResult = await parentsResponse.json();

          if (!studentsResponse.ok) {
            throw new Error(studentsResult.error || 'Failed to fetch students');
          }

          const studentRecipients = studentsResult.data.map((student: any) => ({
            id: student.id,
            username: student.username,
            role: 'STUDENT',
          }));

          // For parents, add them without student names for now
          // Student names can be shown in conversation context instead
          let parentRecipients: Recipient[] = [];
          if (parentsResponse.ok && parentsResult.data) {
            parentRecipients = parentsResult.data.map((parent: any) => ({
              id: parent.id,
              username: parent.username,
              role: 'PARENT',
            }));
          }

          setRecipients([...studentRecipients, ...parentRecipients]);
        } else if (currentUserRole === 'STUDENT') {
          // Fetch student's teacher
          const response = await fetch('/api/auth/me');
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch current user');
          }

          // Get teacher ID from student's teacherId
          if (result.data.teacherId) {
            const teacherResponse = await fetch(`/api/users/${result.data.teacherId}`);
            const teacherResult = await teacherResponse.json();

            if (teacherResponse.ok && teacherResult.data) {
              setRecipients([
                {
                  id: teacherResult.data.id,
                  username: teacherResult.data.username,
                  role: 'TEACHER',
                },
              ]);
            }
          }
        } else if (currentUserRole === 'PARENT') {
          // Fetch parent's children's teachers
          const response = await fetch('/api/parent/teachers');
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch teachers');
          }

          setRecipients(
            (result.data || []).map((teacher: any) => ({
              id: teacher.id,
              username: teacher.username,
              role: 'TEACHER',
            }))
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipients');
        console.error('Failed to fetch recipients:', err);
      } finally {
        setLoading(false);
      }
    }

    if (currentUserId && (currentUserRole === 'TEACHER' || currentUserRole === 'STUDENT' || currentUserRole === 'PARENT')) {
      fetchRecipients();
    }
  }, [currentUserRole, currentUserId]);

  // For students and parents, auto-select their teacher if only one recipient
  useEffect(() => {
    if ((currentUserRole === 'STUDENT' || currentUserRole === 'PARENT') && recipients.length === 1 && !selectedRecipientId) {
      onSelectRecipient(recipients[0].id);
    }
  }, [recipients, currentUserRole, selectedRecipientId, onSelectRecipient]);

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Loading recipients...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  if (recipients.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {currentUserRole === 'TEACHER'
          ? 'No students or parents available'
          : currentUserRole === 'STUDENT'
          ? 'No teacher assigned'
          : 'No teacher assigned'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {currentUserRole === 'TEACHER' ? 'Select Recipient' : currentUserRole === 'PARENT' ? 'Teacher' : 'Teacher'}
      </label>
      {currentUserRole === 'TEACHER' ? (
        <select
          value={selectedRecipientId || ''}
          onChange={(e) => onSelectRecipient(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select a recipient...</option>
          <optgroup label="Students">
            {recipients.filter((r) => r.role === 'STUDENT').map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.username}
              </option>
            ))}
          </optgroup>
          {recipients.filter((r) => r.role === 'PARENT').length > 0 && (
            <optgroup label="Parents">
              {recipients.filter((r) => r.role === 'PARENT').map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {recipient.username}{recipient.studentName ? ` (${recipient.studentName})` : ''}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      ) : (
        <div className="px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
          {recipients.length > 0 ? (
            recipients.length === 1 ? (
              recipients[0].username
            ) : (
              <select
                value={selectedRecipientId || ''}
                onChange={(e) => onSelectRecipient(e.target.value)}
                disabled={disabled}
                className="w-full bg-transparent border-0 text-gray-900 dark:text-white"
              >
                <option value="">Select a teacher...</option>
                {recipients.map((recipient) => (
                  <option key={recipient.id} value={recipient.id}>
                    {recipient.username}
                  </option>
                ))}
              </select>
            )
          ) : (
            'No teacher assigned'
          )}
        </div>
      )}
    </div>
  );
}

