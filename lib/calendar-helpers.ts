import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, addWeeks, addDays, format, getWeek, startOfYear } from 'date-fns';

/**
 * Get all days for a calendar month view
 * Includes days from previous/next month to fill the week
 */
export function getCalendarMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // Monday
  
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

/**
 * Get all days for a calendar week view
 */
export function getCalendarWeekDays(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Monday
  
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

/**
 * Check if an assignment overlaps with a specific date
 */
export function assignmentOverlapsDate(
  assignment: { startDate: Date | string; endDate: Date | string },
  date: Date
): boolean {
  const start = typeof assignment.startDate === 'string' ? new Date(assignment.startDate) : assignment.startDate;
  const end = typeof assignment.endDate === 'string' ? new Date(assignment.endDate) : assignment.endDate;
  
  return date >= start && date <= end;
}

/**
 * Get assignments for a specific date
 */
export function getAssignmentsForDate(
  assignments: any[],
  date: Date
): any[] {
  return assignments.filter((assignment) => assignmentOverlapsDate(assignment, date));
}

/**
 * Format date for display
 */
export function formatCalendarDate(date: Date, formatStr: string = 'd'): string {
  return format(date, formatStr);
}

/**
 * Navigate to previous/next month
 */
export function navigateMonth(currentDate: Date, direction: 'prev' | 'next'): Date {
  return addMonths(currentDate, direction === 'next' ? 1 : -1);
}

/**
 * Navigate to previous/next week
 */
export function navigateWeek(currentDate: Date, direction: 'prev' | 'next'): Date {
  return addWeeks(currentDate, direction === 'next' ? 1 : -1);
}

/**
 * Navigate to previous/next day
 */
export function navigateDay(currentDate: Date, direction: 'prev' | 'next'): Date {
  return addDays(currentDate, direction === 'next' ? 1 : -1);
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if date is in current month
 */
export function isCurrentMonth(date: Date, currentMonth: Date): boolean {
  return isSameMonth(date, currentMonth);
}

