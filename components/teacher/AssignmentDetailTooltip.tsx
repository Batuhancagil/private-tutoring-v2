'use client';

import { useMemo } from 'react';
import Link from 'next/link';

interface AssignmentDetailTooltipProps {
  assignment: {
    id: string;
    studentId: string;
    topicId: string;
    startDate: string;
    endDate: string;
    questionCount: number;
    dailyTarget: number;
    examMode: boolean;
    student: {
      id: string;
      username: string;
    };
    topic: {
      id: string;
      name: string;
      lesson: {
        id: string;
        name: string;
      };
    };
  };
  position: { x: number; y: number };
}

export function AssignmentDetailTooltip({
  assignment,
  position,
}: AssignmentDetailTooltipProps) {
  const startDate = useMemo(() => new Date(assignment.startDate), [assignment.startDate]);
  const endDate = useMemo(() => new Date(assignment.endDate), [assignment.endDate]);
  const duration = useMemo(() => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [startDate, endDate]);

  return (
    <div
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 10}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="space-y-2">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
            {assignment.topic.name}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {assignment.topic.lesson.name}
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Student:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {assignment.student.username}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
            <span className="text-gray-900 dark:text-white">
              {startDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">End Date:</span>
            <span className="text-gray-900 dark:text-white">
              {endDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Duration:</span>
            <span className="text-gray-900 dark:text-white">
              {duration} {duration === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Questions:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {assignment.questionCount}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Daily Target:</span>
            <span className="text-gray-900 dark:text-white">
              {assignment.dailyTarget} questions/day
            </span>
          </div>

          {assignment.examMode && (
            <div className="flex items-center gap-1 text-xs">
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                Exam Mode
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
          <Link
            href={`/teacher/assignments/${assignment.id}`}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}

