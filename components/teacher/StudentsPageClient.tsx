'use client';

import { useState, useRef } from 'react';
import { StudentList, StudentListRef } from './StudentList';
import { StudentForm } from './StudentForm';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface Student {
  id: string;
  username: string;
  createdAt: string;
}

export function StudentsPageClient() {
  const studentListRef = useRef<StudentListRef>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCreateClick = () => {
    setEditingStudent(null);
    setShowForm(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleDelete = (student: Student) => {
    setDeletingStudent(student);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;

    try {
      const response = await fetch(`/api/teacher/students/${deletingStudent.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete student');
      }

      // Refresh the student list
      await studentListRef.current?.refresh();
      setDeletingStudent(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete student. Please try again.'
      );
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingStudent(null);
    // Refresh the student list
    await studentListRef.current?.refresh();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingStudent(null);
  };

  return (
    <>
      {!showForm ? (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={handleCreateClick}>Create Student</Button>
          </div>
          <StudentList ref={studentListRef} onEdit={handleEdit} onDelete={handleDelete} />
        </>
      ) : (
        <StudentForm
          student={editingStudent}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingStudent(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        message={`Are you sure you want to delete student "${deletingStudent?.username}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}

