import { TimelineItem, getPixelsPerDay, daysBetween } from './utils';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Calculate date from timeline pixel position
 * Converts timeline pixel position to date based on view type and timeline scale
 * 
 * @param x - Pixel position on timeline (relative to timeline start, after sidebar)
 * @param viewType - Timeline view type (daily/weekly/monthly)
 * @param timelineStartDate - Start date of the timeline
 * @param scrollLeft - Current scroll position (optional, defaults to 0)
 * @param zoom - Current zoom level (optional, defaults to 1)
 * @returns Calculated date
 */
export function calculateDateFromTimelinePosition(
  x: number,
  viewType: 'daily' | 'weekly' | 'monthly',
  timelineStartDate: Date,
  scrollLeft: number = 0,
  zoom: number = 1
): Date {
  // Account for scroll position
  const adjustedX = x + scrollLeft;
  
  // Get pixels per day for the view type (accounting for zoom)
  const pixelsPerDay = getPixelsPerDay(viewType) * zoom;
  
  // Calculate days from start
  const daysFromStart = Math.floor(adjustedX / pixelsPerDay);
  
  // Calculate date
  const date = new Date(timelineStartDate);
  date.setDate(date.getDate() + daysFromStart);
  
  // Round to appropriate precision based on view type
  if (viewType === 'daily') {
    // Day-level precision - already precise
    return date;
  } else if (viewType === 'weekly') {
    // Week-level precision - round to start of week
    const dayOfWeek = date.getDay();
    date.setDate(date.getDate() - dayOfWeek);
    return date;
  } else {
    // Month-level precision - round to start of month
    date.setDate(1);
    return date;
  }
}

/**
 * Validate drag position for an assignment
 * Checks for overlapping assignments and invalid date ranges
 * 
 * @param assignment - Assignment being dragged
 * @param newStartDate - New start date from drag position
 * @param allAssignments - All assignments for validation
 * @returns Validation result with error message if invalid
 */
export function validateDragPosition(
  assignment: any,
  newStartDate: Date,
  allAssignments: any[]
): ValidationResult {
  // Calculate new end date (maintains duration)
  const duration = daysBetween(new Date(assignment.startDate), new Date(assignment.endDate));
  const newEndDate = new Date(newStartDate);
  newEndDate.setDate(newEndDate.getDate() + duration - 1);
  
  // Check for overlapping assignments (same student, overlapping date ranges)
  const overlappingAssignment = allAssignments.find((a) => {
    // Skip the assignment being dragged
    if (a.id === assignment.id) {
      return false;
    }
    
    // Only check same student
    if (a.studentId !== assignment.studentId) {
      return false;
    }
    
    // Check for date overlap
    const aStart = new Date(a.startDate);
    const aEnd = new Date(a.endDate);
    
    // Check if date ranges overlap
    return (
      (newStartDate >= aStart && newStartDate <= aEnd) ||
      (newEndDate >= aStart && newEndDate <= aEnd) ||
      (newStartDate <= aStart && newEndDate >= aEnd)
    );
  });
  
  if (overlappingAssignment) {
    return {
      valid: false,
      error: `Assignment overlaps with another assignment for this student`,
    };
  }
  
  // Check for invalid date ranges (past dates - optional restriction)
  // For now, we allow past dates, but this can be enabled if needed
  // const today = new Date();
  // today.setHours(0, 0, 0, 0);
  // if (newStartDate < today) {
  //   return {
  //     valid: false,
  //     error: 'Cannot move assignment to a past date',
  //   };
  // }
  
  return { valid: true };
}

/**
 * Update assignment dates via API
 * 
 * @param assignmentId - Assignment ID
 * @param newStartDate - New start date
 * @returns Updated assignment
 */
export async function updateAssignmentDates(
  assignmentId: string,
  newStartDate: Date
): Promise<any> {
  const response = await fetch(`/api/teacher/assignments/${assignmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: newStartDate.toISOString(),
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update assignment');
  }
  
  const result = await response.json();
  return result.data;
}

