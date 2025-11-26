'use client';

import { useState, useRef } from 'react';
import { AssignmentList, AssignmentListRef } from './AssignmentList';
import { PastAssignmentsView } from './PastAssignmentsView';
import { AssignmentForm } from './AssignmentForm';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface Assignment {
  id: string;
  studentId: string;
  topicId: string;
  resourceId?: string | null;
  startDate: string;
  endDate: string;
  questionCount: number;
  dailyTarget: number;
  examMode: boolean;
}

type ViewType = 'all' | 'past';

export function AssignmentsPageClient() {
  const assignmentListRef = useRef<AssignmentListRef>(null);
  const [viewType, setViewType] = useState<ViewType>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCreateClick = () => {
    setEditingAssignment(null);
    setShowForm(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setShowForm(true);
  };

  const handleDelete = (assignment: Assignment) => {
    setDeletingAssignment(assignment);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAssignment) return;

    try {
      const response = await fetch(`/api/teacher/assignments/${deletingAssignment.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete assignment');
      }

      // Refresh the assignment list
      await assignmentListRef.current?.refresh();
      setDeletingAssignment(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete assignment. Please try again.'
      );
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingAssignment(null);
    // Refresh the assignment list
    await assignmentListRef.current?.refresh();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAssignment(null);
  };

  return (
    <>
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-4">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewType('all')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  viewType === 'all'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                All Assignments
              </button>
              <button
                onClick={() => setViewType('past')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  viewType === 'past'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Past Assignments
              </button>
            </div>
            <Button onClick={handleCreateClick}>Create Assignment</Button>
          </div>

          {viewType === 'all' ? (
            <AssignmentList ref={assignmentListRef} onEdit={handleEdit} onDelete={handleDelete} />
          ) : (
            <PastAssignmentsView onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </>
      ) : (
        <AssignmentForm
          assignment={editingAssignment}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingAssignment(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Assignment"
        message={`Are you sure you want to delete this assignment? This action cannot be undone and will also delete all associated progress logs.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}

