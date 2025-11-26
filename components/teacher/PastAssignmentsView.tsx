'use client';

import { useState } from 'react';
import { AssignmentList, AssignmentListRef } from './AssignmentList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { useRef } from 'react';

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
  isPast?: boolean;
  student: {
    id: string;
    username: string;
    role: string;
  };
  topic: {
    id: string;
    name: string;
    lesson: {
      id: string;
      name: string;
      teacherId: string | null;
    };
  };
}

interface PastAssignmentsViewProps {
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
}

export function PastAssignmentsView({ onEdit, onDelete }: PastAssignmentsViewProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const assignmentListRef = useRef<AssignmentListRef>(null);

  const handleDateRangeFilter = () => {
    // Trigger refresh in AssignmentList - the date range props will be used automatically
    if (assignmentListRef.current) {
      assignmentListRef.current.refresh();
    }
  };

  const handleEdit = (assignment: Assignment) => {
    if (onEdit) {
      onEdit(assignment);
    }
  };

  const handleDelete = (assignment: Assignment) => {
    if (onDelete) {
      onDelete(assignment);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Past Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            View and manage assignments that have ended. You can adjust question counts and other details for past assignments.
          </p>

          {/* Date Range Picker */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Label className="mb-2 block">Filter by Date Range (Optional)</Label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="pastStartDate" className="mb-2 block text-sm">Start Date</Label>
                <Input
                  id="pastStartDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="pastEndDate" className="mb-2 block text-sm">End Date</Label>
                <Input
                  id="pastEndDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleDateRangeFilter}
                  className="w-full sm:w-auto"
                >
                  Apply Filter
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment List - Pre-filtered to show past assignments */}
      <AssignmentList
        ref={assignmentListRef}
        onEdit={handleEdit}
        onDelete={handleDelete}
        defaultFilterType="past"
        startDate={startDate || undefined}
        endDate={endDate || undefined}
      />
    </div>
  );
}

