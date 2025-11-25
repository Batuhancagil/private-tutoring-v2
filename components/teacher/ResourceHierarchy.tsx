'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Lesson {
  id: string;
  name: string;
  teacherId: string | null;
  isGlobal?: boolean; // Added for global resource indicator
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

interface ResourceHierarchyProps {
  hierarchy: { lessons: Lesson[] } | null;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lesson: Lesson) => void;
  onCreateTopic: (lessonId: string) => void;
  onEditTopic: (topic: Topic) => void;
  onDeleteTopic: (topic: Topic) => void;
  onCreateResource: (topicId: string) => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (resource: Resource) => void;
  isAdmin?: boolean; // If true, allows editing/deleting global lessons
}

export function ResourceHierarchy({
  hierarchy,
  onEditLesson,
  onDeleteLesson,
  onCreateTopic,
  onEditTopic,
  onDeleteTopic,
  onCreateResource,
  onEditResource,
  onDeleteResource,
  isAdmin = false,
}: ResourceHierarchyProps) {
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleLesson = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  if (!hierarchy || hierarchy.lessons.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="py-8 text-center text-gray-600 dark:text-gray-400">
            <p className="mb-2">No lessons found.</p>
            <p className="text-sm">Create your first lesson to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lessons → Topics → Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hierarchy.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLesson(lesson.id)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    {expandedLessons.has(lesson.id) ? '▼' : '▶'}
                  </button>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {lesson.name}
                  </h3>
                  {(lesson.isGlobal ?? lesson.teacherId === null) && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded border border-blue-200 dark:border-blue-800">
                      🌐 Global
                    </span>
                  )}
                  {!(lesson.isGlobal ?? lesson.teacherId === null) && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-700">
                      Custom
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCreateTopic(lesson.id)}
                  >
                    Add Topic
                  </Button>
                  {/* Admin can edit/delete global lessons, teachers can only edit/delete custom lessons */}
                  {(isAdmin || !(lesson.isGlobal ?? lesson.teacherId === null)) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditLesson(lesson)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDeleteLesson(lesson)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {expandedLessons.has(lesson.id) && lesson.topics && (
                <div className="ml-6 mt-3 space-y-3">
                  {lesson.topics.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No topics yet. Click &quot;Add Topic&quot; to create one.
                    </p>
                  ) : (
                    lesson.topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleTopic(topic.id)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                              {expandedTopics.has(topic.id) ? '▼' : '▶'}
                            </button>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {topic.name}
                            </h4>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCreateResource(topic.id)}
                            >
                              Add Resource
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditTopic(topic)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => onDeleteTopic(topic)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        {expandedTopics.has(topic.id) && topic.resources && (
                          <div className="ml-6 mt-2 space-y-2">
                            {topic.resources.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No resources yet. Click &quot;Add Resource&quot; to create one.
                              </p>
                            ) : (
                              topic.resources.map((resource) => (
                                <div
                                  key={resource.id}
                                  className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
                                >
                                  <div>
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                                      {resource.name}
                                    </p>
                                    {resource.questionCount !== null &&
                                      resource.questionCount !== undefined && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {resource.questionCount} questions
                                        </p>
                                      )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onEditResource(resource)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => onDeleteResource(resource)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

