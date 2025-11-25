'use client';

import { useState } from 'react';
import { TeacherList } from './TeacherList';
import { TeacherForm } from './TeacherForm';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface Teacher {
  id: string;
  username: string;
  createdAt: string;
  subscriptionStatus: 'active' | 'expired' | 'none';
  subscriptionEndDate: string | null;
}

export function TeachersPageClient() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCreateClick = () => {
    setEditingTeacher(null);
    setShowForm(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setShowForm(true);
  };

  const handleDelete = (teacher: Teacher) => {
    setDeletingTeacher(teacher);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTeacher) return;

    try {
      const response = await fetch(`/api/admin/teachers/${deletingTeacher.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete teacher');
      }

      // Refresh the page to update the list
      router.refresh();
      setDeletingTeacher(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete teacher. Please try again.'
      );
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTeacher(null);
    // Refresh the page to update the list
    router.refresh();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTeacher(null);
  };

  return (
    <>
      {!showForm ? (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={handleCreateClick}>Create Teacher</Button>
          </div>
          <TeacherList onEdit={handleEdit} onDelete={handleDelete} />
        </>
      ) : (
        <TeacherForm
          teacher={editingTeacher}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingTeacher(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Teacher"
        message={`Are you sure you want to delete teacher "${deletingTeacher?.username}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}

