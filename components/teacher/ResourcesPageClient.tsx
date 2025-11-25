'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ResourceHierarchy } from './ResourceHierarchy';
import { LessonForm } from './LessonForm';
import { TopicForm } from './TopicForm';
import { ResourceForm } from './ResourceForm';
import { ConfirmDialog } from '@/components/ui/Dialog';

interface Lesson {
  id: string;
  name: string;
  teacherId: string | null;
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

export function ResourcesPageClient() {
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

      const response = await fetch('/api/teacher/resources/hierarchy');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch resources');
      }

      setHierarchy(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load resources'
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
        url = `/api/teacher/lessons/${deletingItem.id}`;
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

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="py-8 text-center text-gray-600 dark:text-gray-400">
            Loading resources...
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
        <LessonForm
          lesson={editingLesson}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
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
            <Button onClick={handleCreateLesson}>Create Lesson</Button>
          </div>
          <ResourceHierarchy
            hierarchy={hierarchy}
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
            ? 'This will also delete all topics and resources in this lesson.'
            : deletingItem?.type === 'topic'
            ? 'This will also delete all resources in this topic.'
            : ''
        } This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}

