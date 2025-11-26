'use client';

import { useState, useMemo, useCallback } from 'react';
import { getCalendarMonthDays, getCalendarWeekDays, getAssignmentsForDate, formatCalendarDate, navigateMonth, navigateWeek, navigateDay, isToday, isCurrentMonth } from '@/lib/calendar-helpers';
import { getStudentColor } from '@/lib/utils';
import { AssignmentDetailTooltip } from './AssignmentDetailTooltip';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface CalendarViewProps {
  assignments: any[];
  viewType: 'monthly' | 'weekly' | 'daily';
  onViewTypeChange?: (viewType: 'monthly' | 'weekly' | 'daily') => void;
  onDateChange?: (date: Date) => void;
  onAssignmentClick?: (assignment: any) => void;
}

export function CalendarView({
  assignments,
  viewType,
  onViewTypeChange,
  onDateChange,
  onAssignmentClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredAssignment, setHoveredAssignment] = useState<any | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dailyDetailOpen, setDailyDetailOpen] = useState(false);

  // Get calendar days based on view type
  const calendarDays = useMemo(() => {
    switch (viewType) {
      case 'monthly':
        return getCalendarMonthDays(currentDate);
      case 'weekly':
        return getCalendarWeekDays(currentDate);
      case 'daily':
        return [currentDate];
      default:
        return getCalendarMonthDays(currentDate);
    }
  }, [viewType, currentDate]);

  // Group assignments by date
  const assignmentsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    calendarDays.forEach((day) => {
      const dayKey = formatCalendarDate(day, 'yyyy-MM-dd');
      const dayAssignments = getAssignmentsForDate(assignments, day);
      if (dayAssignments.length > 0) {
        map.set(dayKey, dayAssignments);
      }
    });
    return map;
  }, [calendarDays, assignments]);

  // Get unique students for color mapping
  const studentColors = useMemo(() => {
    const colors = new Map<string, string>();
    assignments.forEach((assignment) => {
      if (!colors.has(assignment.studentId)) {
        colors.set(assignment.studentId, getStudentColor(assignment.studentId));
      }
    });
    return colors;
  }, [assignments]);

  // Handle navigation
  const handlePrev = useCallback(() => {
    let newDate: Date;
    switch (viewType) {
      case 'monthly':
        newDate = navigateMonth(currentDate, 'prev');
        break;
      case 'weekly':
        newDate = navigateWeek(currentDate, 'prev');
        break;
      case 'daily':
        newDate = navigateDay(currentDate, 'prev');
        break;
      default:
        newDate = currentDate;
    }
    setCurrentDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  }, [currentDate, viewType, onDateChange]);

  const handleNext = useCallback(() => {
    let newDate: Date;
    switch (viewType) {
      case 'monthly':
        newDate = navigateMonth(currentDate, 'next');
        break;
      case 'weekly':
        newDate = navigateWeek(currentDate, 'next');
        break;
      case 'daily':
        newDate = navigateDay(currentDate, 'next');
        break;
      default:
        newDate = currentDate;
    }
    setCurrentDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  }, [currentDate, viewType, onDateChange]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    if (onDateChange) {
      onDateChange(today);
    }
  }, [onDateChange]);

  // Handle day click
  const handleDayClick = useCallback((day: Date) => {
    setSelectedDay(day);
    setDailyDetailOpen(true);
  }, []);

  // Handle assignment hover
  const handleAssignmentHover = useCallback((assignment: any, event: React.MouseEvent) => {
    setHoveredAssignment(assignment);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  }, []);

  const handleAssignmentLeave = useCallback(() => {
    setHoveredAssignment(null);
    setTooltipPosition(null);
  }, []);

  // Handle assignment click
  const handleAssignmentClick = useCallback((assignment: any, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onAssignmentClick) {
      onAssignmentClick(assignment);
    }
  }, [onAssignmentClick]);

  // Get assignments for selected day
  const selectedDayAssignments = useMemo(() => {
    if (!selectedDay) return [];
    return getAssignmentsForDate(assignments, selectedDay);
  }, [selectedDay, assignments]);

  // Render monthly view
  const renderMonthlyView = () => {
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    calendarDays.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === calendarDays.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return (
      <div className="w-full">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2 hidden sm:block"
            >
              {day}
            </div>
          ))}
          {/* Mobile: Show abbreviated headers */}
          <div className="grid grid-cols-7 gap-1 mb-2 sm:hidden">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <div
                key={idx}
                className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayKey = formatCalendarDate(day, 'yyyy-MM-dd');
            const dayAssignments = assignmentsByDate.get(dayKey) || [];
            const isCurrentMonthDay = isCurrentMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`
                  min-h-[80px] sm:min-h-[100px] border border-gray-200 dark:border-gray-700 rounded p-1 sm:p-2
                  cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                  ${!isCurrentMonthDay ? 'opacity-40' : ''}
                  ${isTodayDate ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      text-xs sm:text-sm font-medium
                      ${isTodayDate ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}
                    `}
                  >
                    {formatCalendarDate(day, 'd')}
                  </span>
                </div>

                {/* Assignment indicators */}
                <div className="space-y-0.5 sm:space-y-1">
                  {dayAssignments.slice(0, 2).map((assignment) => {
                    // Check if assignment is past
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const endDate = new Date(assignment.endDate);
                    endDate.setHours(0, 0, 0, 0);
                    const isPast = endDate < today;
                    const color = studentColors.get(assignment.studentId) || '#3B82F6';
                    return (
                      <div
                        key={assignment.id}
                        className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded truncate ${
                          isPast ? 'opacity-50 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : ''
                        }`}
                        style={isPast ? {} : { backgroundColor: color + '40', color: color }}
                        onMouseEnter={(e) => handleAssignmentHover(assignment, e)}
                        onMouseLeave={handleAssignmentLeave}
                        onClick={(e) => handleAssignmentClick(assignment, e)}
                      >
                        <span className="hidden sm:inline">{assignment.topic.name}</span>
                        <span className="sm:hidden">•</span>
                        {isPast && <span className="ml-1 text-[8px]">(Past)</span>}
                      </div>
                    );
                  })}
                  {dayAssignments.length > 2 && (
                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 px-1 sm:px-1.5">
                      +{dayAssignments.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render weekly view
  const renderWeeklyView = () => {
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekDaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="w-full">
        {/* Week day headers - Desktop */}
        <div className="hidden sm:grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, index) => {
            const calendarDay = calendarDays[index];
            const dayKey = formatCalendarDate(calendarDay, 'yyyy-MM-dd');
            const dayAssignments = assignmentsByDate.get(dayKey) || [];
            const isTodayDate = isToday(calendarDay);

            return (
              <div
                key={index}
                className={`
                  border border-gray-200 dark:border-gray-700 rounded p-3
                  ${isTodayDate ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''}
                `}
              >
                <div className="text-center mb-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400">{day}</div>
                  <div
                    className={`
                      text-lg font-semibold mt-1
                      ${isTodayDate ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}
                    `}
                  >
                    {formatCalendarDate(calendarDay, 'd')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCalendarDate(calendarDay, 'MMM')}
                  </div>
                </div>

                {/* Assignments */}
                <div className="space-y-2">
                  {dayAssignments.map((assignment) => {
                    // Check if assignment is past
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const endDate = new Date(assignment.endDate);
                    endDate.setHours(0, 0, 0, 0);
                    const isPast = endDate < today;
                    const color = studentColors.get(assignment.studentId) || '#3B82F6';
                    return (
                      <div
                        key={assignment.id}
                        className={`text-xs p-2 rounded border ${
                          isPast ? 'opacity-50 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800' : ''
                        }`}
                        style={isPast ? {} : { borderColor: color, backgroundColor: color + '20' }}
                        onMouseEnter={(e) => handleAssignmentHover(assignment, e)}
                        onMouseLeave={handleAssignmentLeave}
                        onClick={(e) => handleAssignmentClick(assignment, e)}
                      >
                        <div className="font-medium" style={isPast ? { color: '#6B7280' } : { color }}>
                          {assignment.student.username}
                          {isPast && <span className="ml-2 text-[10px] text-gray-500">(Past)</span>}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 mt-1">
                          {assignment.topic.name}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 mt-1">
                          {assignment.questionCount} questions
                        </div>
                      </div>
                    );
                  })}
                  {dayAssignments.length === 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">
                      No assignments
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: Single column scrollable */}
        <div className="sm:hidden space-y-4">
          {calendarDays.map((calendarDay, index) => {
            const dayKey = formatCalendarDate(calendarDay, 'yyyy-MM-dd');
            const dayAssignments = assignmentsByDate.get(dayKey) || [];
            const isTodayDate = isToday(calendarDay);

            return (
              <div
                key={index}
                onClick={() => handleDayClick(calendarDay)}
                className={`
                  border border-gray-200 dark:border-gray-700 rounded-lg p-4
                  cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                  ${isTodayDate ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''}
                `}
              >
                <div className="text-center mb-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{weekDaysShort[index]}</div>
                  <div
                    className={`
                      text-xl font-semibold mt-1
                      ${isTodayDate ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}
                    `}
                  >
                    {formatCalendarDate(calendarDay, 'd')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCalendarDate(calendarDay, 'MMM yyyy')}
                  </div>
                </div>

                {/* Assignments */}
                <div className="space-y-2">
                  {dayAssignments.map((assignment) => {
                    // Check if assignment is past
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const endDate = new Date(assignment.endDate);
                    endDate.setHours(0, 0, 0, 0);
                    const isPast = endDate < today;
                    const color = studentColors.get(assignment.studentId) || '#3B82F6';
                    return (
                      <div
                        key={assignment.id}
                        className={`text-sm p-3 rounded border ${
                          isPast ? 'opacity-50 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800' : ''
                        }`}
                        style={isPast ? {} : { borderColor: color, backgroundColor: color + '20' }}
                        onClick={(e) => handleAssignmentClick(assignment, e)}
                      >
                        <div className="font-medium" style={isPast ? { color: '#6B7280' } : { color }}>
                          {assignment.student.username}
                          {isPast && <span className="ml-2 text-xs text-gray-500">(Past)</span>}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 mt-1">
                          {assignment.topic.name}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 mt-1">
                          {assignment.questionCount} questions
                        </div>
                      </div>
                    );
                  })}
                  {dayAssignments.length === 0 && (
                    <div className="text-sm text-gray-400 dark:text-gray-600 text-center py-4">
                      No assignments
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render daily view
  const renderDailyView = () => {
    const day = calendarDays[0];
    const dayKey = formatCalendarDate(day, 'yyyy-MM-dd');
    const dayAssignments = assignmentsByDate.get(dayKey) || [];
    const isTodayDate = isToday(day);

    return (
      <div className="w-full">
        <div
          className={`
            border border-gray-200 dark:border-gray-700 rounded-lg p-6
            ${isTodayDate ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''}
          `}
        >
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCalendarDate(day, 'EEEE, MMMM d, yyyy')}
            </div>
            {isTodayDate && (
              <div className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">Today</div>
            )}
          </div>

          {/* Assignments */}
          <div className="space-y-3">
            {dayAssignments.map((assignment) => {
              // Check if assignment is past
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const endDate = new Date(assignment.endDate);
              endDate.setHours(0, 0, 0, 0);
              const isPast = endDate < today;
              const color = studentColors.get(assignment.studentId) || '#3B82F6';
              return (
                <div
                  key={assignment.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${
                    isPast ? 'opacity-50 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900' : ''
                  }`}
                  style={isPast ? {} : { borderColor: color }}
                  onMouseEnter={(e) => handleAssignmentHover(assignment, e)}
                  onMouseLeave={handleAssignmentLeave}
                  onClick={(e) => handleAssignmentClick(assignment, e)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {assignment.student.username}
                          {isPast && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Past)</span>}
                        </span>
                      </div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {assignment.topic.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {assignment.topic.lesson.name}
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{assignment.questionCount} questions</span>
                        <span>{assignment.dailyTarget} questions/day</span>
                        {assignment.examMode && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs">
                            Exam Mode
                          </span>
                        )}
                        {isPast && (
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                            Past Assignment
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {dayAssignments.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                No assignments for this day
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Get current period label
  const getPeriodLabel = () => {
    switch (viewType) {
      case 'monthly':
        return formatCalendarDate(currentDate, 'MMMM yyyy');
      case 'weekly':
        const weekStart = calendarDays[0];
        const weekEnd = calendarDays[calendarDays.length - 1];
        return `${formatCalendarDate(weekStart, 'MMM d')} - ${formatCalendarDate(weekEnd, 'MMM d, yyyy')}`;
      case 'daily':
        return formatCalendarDate(currentDate, 'EEEE, MMMM d, yyyy');
      default:
        return '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium hidden sm:inline">View:</span>
          <button
            onClick={() => onViewTypeChange?.('monthly')}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded ${
              viewType === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => onViewTypeChange?.('weekly')}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded ${
              viewType === 'weekly'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => onViewTypeChange?.('daily')}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded ${
              viewType === 'daily'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Daily
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          <button
            onClick={handlePrev}
            className="px-2 sm:px-3 py-1 text-sm bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 min-h-[32px] min-w-[32px]"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            onClick={handleToday}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            Today
          </button>
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[150px] sm:min-w-[200px] text-center">
            {getPeriodLabel()}
          </span>
          <button
            onClick={handleNext}
            className="px-2 sm:px-3 py-1 text-sm bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 min-h-[32px] min-w-[32px]"
            aria-label="Next"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-auto">
        {viewType === 'monthly' && renderMonthlyView()}
        {viewType === 'weekly' && renderWeeklyView()}
        {viewType === 'daily' && renderDailyView()}
      </div>

      {/* Tooltip */}
      {hoveredAssignment && tooltipPosition && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <AssignmentDetailTooltip
            assignment={hoveredAssignment}
            position={{ x: 0, y: 0 }}
          />
        </div>
      )}

      {/* Daily detail modal */}
      <Dialog
        open={dailyDetailOpen}
        onClose={() => {
          setDailyDetailOpen(false);
          setSelectedDay(null);
        }}
        title={selectedDay ? formatCalendarDate(selectedDay, 'EEEE, MMMM d, yyyy') : 'Daily Details'}
        footer={
          <Button variant="outline" onClick={() => {
            setDailyDetailOpen(false);
            setSelectedDay(null);
          }}>
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          {selectedDayAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-600">
              No assignments for this day
            </div>
          ) : (
            selectedDayAssignments.map((assignment) => {
              const color = studentColors.get(assignment.studentId) || '#3B82F6';
              const startDate = new Date(assignment.startDate);
              const endDate = new Date(assignment.endDate);
              return (
                <div
                  key={assignment.id}
                  className="p-4 rounded-lg border-2"
                  style={{ borderColor: color }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {assignment.student.username}
                        </span>
                      </div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {assignment.topic.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {assignment.topic.lesson.name}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Start:</span>{' '}
                          {startDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div>
                          <span className="font-medium">End:</span>{' '}
                          {endDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div>
                          <span className="font-medium">Questions:</span> {assignment.questionCount}
                        </div>
                        <div>
                          <span className="font-medium">Daily Target:</span> {assignment.dailyTarget}
                        </div>
                      </div>
                      {assignment.examMode && (
                        <div className="mt-2">
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs">
                            Exam Mode
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Dialog>
    </div>
  );
}

