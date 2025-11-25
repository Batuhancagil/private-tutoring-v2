'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ResourceHierarchy } from '@/components/teacher/ResourceHierarchy';
import { LessonForm } from '@/components/teacher/LessonForm';
import { TopicForm } from '@/components/teacher/TopicForm';
import { ResourceForm } from '@/components/teacher/ResourceForm';
import { ConfirmDialog } from '@/components/ui/Dialog';

interface Lesson {
  id: string;
  name: string;
  teacherId: string | null;
  isGlobal?: boolean;
  createdAt: string;
  updatedAt: string;
  topics?: Topic[];
}

interface Topic {
  id: string;
  name: string;
  lessonId: string;
  createdAt: string;
  updatedAt: string;
  resources?: Resource[];
}

interface Resource {
  id: string;
  name: string;
  description?: string | null;
  questionCount?: number | null;
  topicId: string;
  createdAt: string;
  updatedAt: string;
}

export function AdminResourcesPageClient() {
  const [hierarchy, setHierarchy] = useState<{ lessons: Lesson[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<{
    type: 'lesson' | 'topic' | 'resource';
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/resources/lessons');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch global resources');
      }

      // Transform to match hierarchy structure expected by ResourceHierarchy
      interface LessonResponse {
        id: string;
        name: string;
        teacherId: string | null;
        createdAt: string;
        updatedAt: string;
        topics?: Topic[];
      }
      const lessons = Array.isArray(data.data) ? (data.data as LessonResponse[]) : [];
      setHierarchy({ lessons: lessons.map((lesson) => ({ ...lesson, isGlobal: true })) });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load global resources'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = () => {
    setEditingLesson(null);
    setShowLessonForm(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setShowLessonForm(true);
  };

  const handleCreateTopic = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setEditingTopic(null);
    setShowTopicForm(true);
  };

  const handleEditTopic = (topic: Topic) => {
    setSelectedLessonId(topic.lessonId);
    setEditingTopic(topic);
    setShowTopicForm(true);
  };

  const handleCreateResource = (topicId: string) => {
    setSelectedTopicId(topicId);
    setEditingResource(null);
    setShowResourceForm(true);
  };

  const handleEditResource = (resource: Resource) => {
    setSelectedTopicId(resource.topicId);
    setEditingResource(resource);
    setShowResourceForm(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      let url = '';
      if (deletingItem.type === 'lesson') {
        // For global lessons, use admin endpoint
        url = `/api/admin/resources/lessons/${deletingItem.id}`;
      } else if (deletingItem.type === 'topic') {
        url = `/api/teacher/topics/${deletingItem.id}`;
      } else {
        url = `/api/teacher/resources/${deletingItem.id}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }

      fetchHierarchy();
      setDeletingItem(null);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to delete. Please try again.'
      );
    }
  };

  const handleFormSuccess = () => {
    setShowLessonForm(false);
    setShowTopicForm(false);
    setShowResourceForm(false);
    setEditingLesson(null);
    setEditingTopic(null);
    setEditingResource(null);
    setSelectedLessonId(null);
    setSelectedTopicId(null);
    fetchHierarchy();
  };

  const handleFormCancel = () => {
    setShowLessonForm(false);
    setShowTopicForm(false);
    setShowResourceForm(false);
    setEditingLesson(null);
    setEditingTopic(null);
    setEditingResource(null);
    setSelectedLessonId(null);
    setSelectedTopicId(null);
  };

  // Custom lesson form handler for global lessons
  const handleGlobalLessonSubmit = async (name: string) => {
    try {
      const url = editingLesson
        ? `/api/admin/resources/lessons/${editingLesson.id}`
        : '/api/admin/resources/lessons';
      const method = editingLesson ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save lesson');
      }

      handleFormSuccess();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to save lesson. Please try again.'
      );
    }
  };

  // Override lesson form to use admin endpoint
  const handleLessonFormSuccess = async (name: string) => {
    await handleGlobalLessonSubmit(name);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="py-8 text-center text-gray-600 dark:text-gray-400">
            Loading global resources...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchHierarchy}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showLessonForm ? (
        <Card>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                await handleGlobalLessonSubmit(name);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lesson Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingLesson?.name || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter lesson name"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {editingLesson
                    ? 'This is a global lesson accessible to all teachers'
                    : 'This will be a global lesson accessible to all teachers'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingLesson ? 'Update Global Lesson' : 'Create Global Lesson'}
                </Button>
                <Button type="button" variant="outline" onClick={handleFormCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : showTopicForm ? (
        <TopicForm
          topic={editingTopic}
          lessonId={selectedLessonId!}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      ) : showResourceForm ? (
        <ResourceForm
          resource={editingResource}
          topicId={selectedTopicId!}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={handleCreateLesson}>Create Global Lesson</Button>
          </div>
          <ResourceHierarchy
            hierarchy={hierarchy}
            isAdmin={true}
            onEditLesson={handleEditLesson}
            onDeleteLesson={(lesson) =>
              setDeletingItem({
                type: 'lesson',
                id: lesson.id,
                name: lesson.name,
              })
            }
            onCreateTopic={handleCreateTopic}
            onEditTopic={handleEditTopic}
            onDeleteTopic={(topic) =>
              setDeletingItem({
                type: 'topic',
                id: topic.id,
                name: topic.name,
              })
            }
            onCreateResource={handleCreateResource}
            onEditResource={handleEditResource}
            onDeleteResource={(resource) =>
              setDeletingItem({
                type: 'resource',
                id: resource.id,
                name: resource.name,
              })
            }
          />
        </>
      )}

      <ConfirmDialog
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title={`Delete ${deletingItem?.type}`}
        message={`Are you sure you want to delete "${deletingItem?.name}"? ${
          deletingItem?.type === 'lesson'
            ? 'This will permanently delete this global lesson and all its topics and resources. All teachers will lose access to this content immediately. This action cannot be undone.'
            : deletingItem?.type === 'topic'
            ? 'This will permanently delete this topic and all its resources from the global library. All teachers will lose access to this content immediately. This action cannot be undone.'
            : 'This will permanently delete this resource from the global library. All teachers will lose access to this content immediately. This action cannot be undone.'
        }`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}

