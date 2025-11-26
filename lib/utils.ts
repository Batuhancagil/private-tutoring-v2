import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Lesson } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a lesson is global (pre-built)
 * Global lessons have teacherId=null
 */
export function isGlobal(lesson: { teacherId: string | null }): boolean {
  return lesson.teacherId === null
}

/**
 * Calculate assignment end date based on start date, question count, and daily target
 * Formula: endDate = startDate + ceil(questionCount / dailyTarget) - 1 days
 * Minimum duration: 1 day (start date counts as day 1)
 * 
 * @param startDate - Assignment start date
 * @param questionCount - Total number of questions
 * @param dailyTarget - Questions per day (default: 100)
 * @returns Calculated end date
 */
export function calculateEndDate(
  startDate: Date,
  questionCount: number,
  dailyTarget: number = 100
): Date {
  // Ensure positive values
  if (questionCount <= 0) {
    questionCount = 1; // Minimum 1 question for 1 day duration
  }
  if (dailyTarget <= 0) {
    dailyTarget = 1; // Prevent division by zero
  }

  // Calculate days needed: ceil(questionCount / dailyTarget)
  const daysNeeded = Math.ceil(questionCount / dailyTarget);
  
  // Minimum 1 day duration (start date counts as day 1)
  const actualDays = Math.max(1, daysNeeded);
  
  // Calculate end date: startDate + (actualDays - 1) days
  // Subtract 1 because start date counts as day 1
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + actualDays - 1);
  
  return endDate;
}

/**
 * Generate a consistent color for a student based on their ID
 * Uses a simple hash function to ensure same student always gets same color
 */
export function getStudentColor(studentId: string): string {
  // Color palette with distinguishable colors
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Timeline data item interface
 */
export interface TimelineItem {
  id: string;
  start: Date;
  end: Date;
  label: string;
  color: string;
  studentId: string;
  studentName: string;
  assignment: any; // Full assignment object for details
}

/**
 * Transform assignments into timeline format
 * @param assignments - Array of assignment objects with student and topic relations
 * @param viewType - Timeline view type (daily/weekly/monthly)
 * @returns Array of timeline items
 */
export function transformAssignmentsForTimeline(
  assignments: any[],
  viewType: 'daily' | 'weekly' | 'monthly' = 'weekly'
): TimelineItem[] {
  return assignments.map((assignment) => {
    const startDate = new Date(assignment.startDate);
    const endDate = new Date(assignment.endDate);
    
    // Generate label: "Student Name - Topic Name"
    const label = `${assignment.student.username} - ${assignment.topic.name}`;
    
    // Get consistent color for student
    const color = getStudentColor(assignment.studentId);
    
    return {
      id: assignment.id,
      start: startDate,
      end: endDate,
      label,
      color,
      studentId: assignment.studentId,
      studentName: assignment.student.username,
      assignment,
    };
  });
}

/**
 * Calculate pixels per day based on view type
 */
export function getPixelsPerDay(viewType: 'daily' | 'weekly' | 'monthly'): number {
  switch (viewType) {
    case 'daily':
      return 100; // 100px per day
    case 'weekly':
      return 20; // 20px per day (140px per week)
    case 'monthly':
      return 5; // 5px per day (150px per month)
    default:
      return 20;
  }
}

/**
 * Calculate the number of days between two dates
 */
export function daysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
}

