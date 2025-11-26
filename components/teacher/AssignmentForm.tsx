'use client';

import { useState, FormEvent, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface User {
  id: string;
  username: string;
  role: string;
}

interface Topic {
  id: string;
  name: string;
  lesson: {
    id: string;
    name: string;
    teacherId: string | null;
  };
}

interface Resource {
  id: string;
  name: string;
  topicId: string;
}

interface Assignment {
  id?: string;
  studentId: string;
  topicId: string;
  resourceId?: string | null;
  startDate: string;
  endDate?: string;
  questionCount: number;
  dailyTarget: number;
  examMode?: boolean;
}

interface AssignmentFormProps {
  assignment?: Assignment | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AssignmentForm({
  assignment,
  onSuccess,
  onCancel,
}: AssignmentFormProps) {
  const [students, setStudents] = useState<User[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  
  const [studentId, setStudentId] = useState(assignment?.studentId || '');
  const [topicId, setTopicId] = useState(assignment?.topicId || '');
  const [resourceId, setResourceId] = useState(assignment?.resourceId || '');
  // Format start date for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    // Convert to local time and format as YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [startDate, setStartDate] = useState(
    assignment?.startDate ? formatDateForInput(assignment.startDate) : ''
  );
  const [questionCount, setQuestionCount] = useState<string>(
    assignment?.questionCount?.toString() || ''
  );
  const [dailyTarget, setDailyTarget] = useState<string>(
    assignment?.dailyTarget?.toString() || '100'
  );
  const [examMode, setExamMode] = useState(assignment?.examMode || false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const isEditMode = !!assignment;
  
  // Check if assignment is past (endDate < today)
  const isPastAssignment = useMemo(() => {
    if (!assignment?.endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(assignment.endDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  }, [assignment?.endDate]);

  // Fetch students, topics on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);
        
        // Fetch students
        const studentsResponse = await fetch('/api/teacher/students');
        const studentsData = await studentsResponse.json();
        if (studentsData.success) {
          setStudents(studentsData.data);
        }

        // Fetch topics (all: global + custom)
        const topicsResponse = await fetch('/api/teacher/topics?scope=all');
        const topicsData = await topicsResponse.json();
        if (topicsData.success) {
          setTopics(topicsData.data);
        }
      } catch (err) {
        setError('Failed to load form data');
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, []);

  // Fetch resources when topic changes
  useEffect(() => {
    async function fetchResources() {
      if (!topicId) {
        setResources([]);
        setResourceId('');
        return;
      }

      try {
        const response = await fetch(`/api/teacher/resources?scope=all&topicId=${topicId}`);
        const data = await response.json();
        if (data.success) {
          setResources(data.data);
        } else {
          setResources([]);
        }
        // Reset resource selection when topic changes
        setResourceId('');
      } catch (err) {
        setResources([]);
        setResourceId('');
      }
    }

    fetchResources();
  }, [topicId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!studentId) {
      setError('Student is required');
      return;
    }
    if (!topicId) {
      setError('Topic is required');
      return;
    }
    if (!startDate) {
      setError('Start date is required');
      return;
    }
    if (!questionCount.trim()) {
      setError('Question count is required');
      return;
    }
    const questionCountNum = parseInt(questionCount, 10);
    if (isNaN(questionCountNum) || questionCountNum <= 0) {
      setError('Question count must be a positive number');
      return;
    }
    if (!dailyTarget.trim()) {
      setError('Daily target is required');
      return;
    }
    const dailyTargetNum = parseInt(dailyTarget, 10);
    if (isNaN(dailyTargetNum) || dailyTargetNum <= 0) {
      setError('Daily target must be a positive number');
      return;
    }

    try {
      setLoading(true);

      const url = isEditMode
        ? `/api/teacher/assignments/${assignment.id}`
        : '/api/teacher/assignments';

      const method = isEditMode ? 'PUT' : 'POST';

      // Format start date as ISO 8601 datetime
      const startDateISO = new Date(startDate).toISOString();

      const body: any = {
        studentId,
        topicId,
        startDate: startDateISO,
        questionCount: questionCountNum,
        dailyTarget: dailyTargetNum,
        examMode,
      };

      // Add resourceId if selected
      if (resourceId) {
        body.resourceId = resourceId;
      } else if (isEditMode) {
        body.resourceId = null;
      }

      // Add endDate for edit mode if provided and not exam mode
      // Note: For exam mode, endDate modifications are prevented by API validation
      if (isEditMode && assignment?.endDate && !examMode) {
        // Only include endDate if we're recalculating it (which happens automatically)
        // Don't send endDate if exam mode to prevent API rejection
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save assignment');
      }

      // Reset form if creating new assignment
      if (!isEditMode) {
        setStudentId('');
        setTopicId('');
        setResourceId('');
        setStartDate('');
        setQuestionCount('');
        setDailyTarget('100');
        setExamMode(false);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600 dark:text-gray-400">Loading form data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Assignment' : 'Create Assignment'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Past assignment warning */}
          {isEditMode && isPastAssignment && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ You are editing a past assignment. Changes will affect historical data and may trigger progress recalculation.
              </p>
            </div>
          )}

          {/* Exam mode restriction notice */}
          {isEditMode && examMode && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                🔒 Exam Mode: Date modifications are disabled for exam mode assignments. You can still modify question counts and daily targets.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="studentId">Student *</Label>
            <select
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              disabled={isEditMode}
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="topicId">Topic *</Label>
            <select
              id="topicId"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name} {topic.lesson.teacherId === null ? '(Global)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="resourceId">Resource (Optional)</Label>
            <select
              id="resourceId"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={!topicId}
            >
              <option value="">No resource (optional)</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
            {!topicId && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a topic first to see available resources
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={isEditMode && examMode}
              className={isEditMode && examMode ? 'opacity-50 cursor-not-allowed' : ''}
            />
            {isEditMode && examMode && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start date cannot be modified for exam mode assignments
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="questionCount">Question Count *</Label>
            <Input
              id="questionCount"
              type="number"
              min="1"
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              placeholder="e.g., 500"
              required
            />
          </div>

          <div>
            <Label htmlFor="dailyTarget">Daily Target (Questions per day) *</Label>
            <Input
              id="dailyTarget"
              type="number"
              min="1"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
              placeholder="e.g., 100"
              required
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              End date will be calculated automatically based on question count and daily target
            </p>
          </div>

          <div className="flex items-center">
            <input
              id="examMode"
              type="checkbox"
              checked={examMode}
              onChange={(e) => setExamMode(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <Label htmlFor="examMode" className="ml-2 mb-0">
              Exam Mode (Fixed deadlines)
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditMode ? 'Update Assignment' : 'Create Assignment'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

