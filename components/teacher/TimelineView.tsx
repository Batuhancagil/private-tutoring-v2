'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { TimelineItem, getPixelsPerDay, daysBetween } from '@/lib/utils';
import { AssignmentDetailTooltip } from './AssignmentDetailTooltip';
import { calculateDateFromTimelinePosition, validateDragPosition, updateAssignmentDates } from '@/lib/timeline-helpers';

interface TimelineViewProps {
  items: TimelineItem[];
  dateRange: { start: string; end: string };
  viewType: 'daily' | 'weekly' | 'monthly';
  onViewTypeChange?: (viewType: 'daily' | 'weekly' | 'monthly') => void;
  onDateRangeChange?: (start: Date, end: Date) => void;
  onAssignmentClick?: (assignment: any) => void;
  onAssignmentUpdate?: () => void; // Callback to refresh timeline after update
}

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 60;
const SIDEBAR_WIDTH = 200;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

export function TimelineView({
  items,
  dateRange,
  viewType,
  onViewTypeChange,
  onDateRangeChange,
  onAssignmentClick,
  onAssignmentUpdate,
}: TimelineViewProps) {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [hoveredItem, setHoveredItem] = useState<TimelineItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  
  // Drag state
  const [draggedItem, setDraggedItem] = useState<TimelineItem | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [originalPosition, setOriginalPosition] = useState<{ x: number; y: number } | null>(null);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate timeline dimensions
  const startDate = useMemo(() => new Date(dateRange.start), [dateRange.start]);
  const endDate = useMemo(() => new Date(dateRange.end), [dateRange.end]);
  const totalDays = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);
  const pixelsPerDay = useMemo(() => getPixelsPerDay(viewType) * zoom, [viewType, zoom]);
  const timelineWidth = useMemo(() => totalDays * pixelsPerDay, [totalDays, pixelsPerDay]);

  // Get unique students for rows
  const students = useMemo(() => {
    const studentMap = new Map<string, { id: string; name: string; color: string }>();
    items.forEach((item) => {
      if (!studentMap.has(item.studentId)) {
        studentMap.set(item.studentId, {
          id: item.studentId,
          name: item.studentName,
          color: item.color,
        });
      }
    });
    return Array.from(studentMap.values());
  }, [items]);

  // Group items by student
  const itemsByStudent = useMemo(() => {
    const grouped = new Map<string, TimelineItem[]>();
    items.forEach((item) => {
      if (!grouped.has(item.studentId)) {
        grouped.set(item.studentId, []);
      }
      grouped.get(item.studentId)!.push(item);
    });
    return grouped;
  }, [items]);

  // Calculate position for a date
  const getDatePosition = useCallback(
    (date: Date) => {
      const daysFromStart = daysBetween(startDate, date) - 1;
      return daysFromStart * pixelsPerDay;
    },
    [startDate, pixelsPerDay]
  );

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, MIN_ZOOM));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  // Handle item hover
  const handleItemHover = useCallback(
    (item: TimelineItem, event: React.MouseEvent) => {
      if (isDragging) return; // Don't show tooltip while dragging
      setHoveredItem(item);
      const rect = event.currentTarget.getBoundingClientRect();
      const containerRect = timelineRef.current?.getBoundingClientRect();
      if (containerRect) {
        setTooltipPosition({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 10,
        });
      }
    },
    [isDragging]
  );

  const handleItemLeave = useCallback(() => {
    if (!isDragging) {
      setHoveredItem(null);
      setTooltipPosition(null);
    }
  }, [isDragging]);

  // Handle item click
  const handleItemClick = useCallback(
    (item: TimelineItem, event?: React.MouseEvent) => {
      if (isDragging) return; // Don't trigger click during drag
      if (onAssignmentClick) {
        onAssignmentClick(item.assignment);
      }
    },
    [onAssignmentClick, isDragging]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (item: TimelineItem, event: React.MouseEvent) => {
      // Check if exam mode - disable drag
      if (item.assignment?.examMode) {
        return; // Don't allow drag for exam mode assignments
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const containerRect = timelineRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const startPos = getDatePosition(item.start);
      const mouseX = event.clientX - containerRect.left - SIDEBAR_WIDTH;
      
      setDraggedItem(item);
      setDragOffset({
        x: mouseX - startPos,
        y: 0,
      });
      setOriginalPosition({ x: startPos, y: 0 });
      setIsDragging(true);
      setHoveredItem(null);
      setTooltipPosition(null);
      
      // Prevent default drag behavior
      event.preventDefault();
      event.stopPropagation();
    },
    [getDatePosition]
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !draggedItem || !dragOffset || !timelineRef.current) return;

      const containerRect = timelineRef.current.getBoundingClientRect();
      const mouseX = event.clientX - containerRect.left - SIDEBAR_WIDTH;
      const newX = mouseX - dragOffset.x;

      // Constrain to timeline bounds
      const constrainedX = Math.max(0, Math.min(newX, timelineWidth - (getDatePosition(draggedItem.end) - getDatePosition(draggedItem.start))));
      
      setDragPosition({ x: constrainedX, y: 0 });
    },
    [isDragging, draggedItem, dragOffset, timelineWidth, getDatePosition]
  );

  // Handle drag end
  const handleDragEnd = useCallback(async () => {
    if (!isDragging || !draggedItem || !dragPosition || !originalPosition) {
      setIsDragging(false);
      setDraggedItem(null);
      setDragPosition(null);
      setDragOffset(null);
      setOriginalPosition(null);
      return;
    }

    // Calculate new start date from drag position
    const newStartDate = calculateDateFromTimelinePosition(
      dragPosition.x,
      viewType,
      startDate,
      scrollLeft,
      zoom
    );

    // Validate drag position
    const validation = validateDragPosition(draggedItem.assignment, newStartDate, items.map(i => i.assignment));
    
    if (!validation.valid) {
      // Revert to original position
      setSaveStatus('error');
      setSaveError(validation.error || 'Invalid drag position');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveError(null);
      }, 3000);
      
      setIsDragging(false);
      setDraggedItem(null);
      setDragPosition(null);
      setDragOffset(null);
      setOriginalPosition(null);
      return;
    }

    // Save assignment
    try {
      setIsSaving(true);
      setSaveStatus('saving');
      
      await updateAssignmentDates(draggedItem.assignment.id, newStartDate);
      
      setSaveStatus('success');
      
      // Refresh timeline
      if (onAssignmentUpdate) {
        onAssignmentUpdate();
      }
      
      // Reset drag state after a short delay
      setTimeout(() => {
        setIsDragging(false);
        setDraggedItem(null);
        setDragPosition(null);
        setDragOffset(null);
        setOriginalPosition(null);
        setSaveStatus('idle');
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Failed to save assignment');
      
      // Revert to original position
      setIsDragging(false);
      setDraggedItem(null);
      setDragPosition(null);
      setDragOffset(null);
      setOriginalPosition(null);
      
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveError(null);
        setIsSaving(false);
      }, 3000);
    }
  }, [isDragging, draggedItem, dragPosition, originalPosition, viewType, startDate, scrollLeft, zoom, items, onAssignmentUpdate]);

  // Set up global mouse event listeners for drag
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
      const handleMouseUp = () => handleDragEnd();
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Generate date labels
  const dateLabels = useMemo(() => {
    const labels: { date: Date; position: number }[] = [];
    const step = viewType === 'daily' ? 1 : viewType === 'weekly' ? 7 : 30;
    
    for (let i = 0; i <= totalDays; i += step) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      labels.push({
        date,
        position: i * pixelsPerDay,
      });
    }
    
    return labels;
  }, [startDate, totalDays, pixelsPerDay, viewType]);

  // Render timeline bars
  const renderBars = useCallback(() => {
    const bars: JSX.Element[] = [];
    let rowIndex = 0;

    students.forEach((student) => {
      const studentItems = itemsByStudent.get(student.id) || [];
      
      studentItems.forEach((item) => {
        const isItemDragged = draggedItem?.id === item.id;
        const isExamMode = item.assignment?.examMode === true;
        
        // Check if assignment is past (endDate < today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(item.end);
        endDate.setHours(0, 0, 0, 0);
        const isPast = endDate < today;
        
        // Use drag position if this item is being dragged, otherwise use calculated position
        let startPos: number;
        let opacity = 1;
        let cursor = 'pointer';
        
        if (isItemDragged && dragPosition) {
          startPos = dragPosition.x;
          opacity = 0.7; // Visual feedback during drag
          cursor = 'grabbing';
        } else {
          startPos = getDatePosition(item.start);
          if (isExamMode) {
            cursor = 'not-allowed';
            opacity = 0.6; // Visual indicator for exam mode
          } else if (isPast) {
            opacity = 0.5; // Visual distinction for past assignments (grayed out)
          }
        }
        
        const endPos = isItemDragged && dragPosition 
          ? dragPosition.x + (getDatePosition(item.end) - getDatePosition(item.start))
          : getDatePosition(item.end);
        const width = endPos - startPos;
        const y = HEADER_HEIGHT + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2 - 10;

        bars.push(
          <g key={item.id}>
            {/* Exam mode lock icon */}
            {isExamMode && (
              <g>
                <circle
                  cx={startPos + 10}
                  cy={y + 10}
                  r={8}
                  fill="rgba(0, 0, 0, 0.5)"
                />
                <text
                  x={startPos + 10}
                  y={y + 13}
                  textAnchor="middle"
                  className="text-xs fill-white pointer-events-none"
                  style={{ fontSize: '10px' }}
                >
                  🔒
                </text>
              </g>
            )}
            <rect
              x={startPos}
              y={y}
              width={Math.max(width, 4)}
              height={20}
              fill={isPast ? '#9CA3AF' : item.color} // Gray color for past assignments
              rx={4}
              opacity={opacity}
              className={`transition-opacity ${isExamMode ? 'cursor-not-allowed' : isDragging && isItemDragged ? 'cursor-grabbing' : 'cursor-grab'} ${isPast ? 'opacity-50' : ''}`}
              style={{ cursor }}
              onMouseDown={(e) => !isExamMode && !isPast && handleDragStart(item, e)}
              onMouseEnter={(e) => handleItemHover(item, e)}
              onMouseLeave={handleItemLeave}
              onClick={(e) => handleItemClick(item, e)}
              role="button"
              aria-label={
                isExamMode 
                  ? `Assignment: ${item.label} (Exam Mode - Dates locked)` 
                  : isPast
                  ? `Past Assignment: ${item.label}`
                  : `Drag to reschedule assignment: ${item.label}`
              }
              tabIndex={isExamMode || isPast ? -1 : 0}
              onKeyDown={(e) => {
                if (!isExamMode && !isPast && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  // Keyboard drag could be implemented here
                }
              }}
            />
            {width > 60 && (
              <text
                x={startPos + width / 2}
                y={y + 14}
                textAnchor="middle"
                className={`text-xs pointer-events-none ${isPast ? 'fill-gray-600 dark:fill-gray-400' : 'fill-white'}`}
                style={{ fontSize: '11px', fontWeight: 500 }}
              >
                {item.label.length > 20 ? item.label.substring(0, 20) + '...' : item.label}
              </text>
            )}
            {/* Past assignment indicator */}
            {isPast && (
              <text
                x={startPos + 5}
                y={y + 12}
                textAnchor="start"
                className="text-xs fill-gray-500 dark:fill-gray-500 pointer-events-none"
                style={{ fontSize: '9px' }}
              >
                Past
              </text>
            )}
          </g>
        );
      });

      rowIndex++;
    });

    return bars;
  }, [students, itemsByStudent, getDatePosition, handleItemHover, handleItemLeave, handleItemClick, handleDragStart, draggedItem, dragPosition, isDragging]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Save status indicator */}
      {saveStatus !== 'idle' && (
        <div className="mb-2 p-2 rounded text-sm">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Saving assignment...</span>
            </div>
          )}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <span>✓</span>
              <span>Assignment saved successfully</span>
            </div>
          )}
          {saveStatus === 'error' && saveError && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <span>✗</span>
              <span>{saveError}</span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">View:</span>
          <button
            onClick={() => onViewTypeChange?.('daily')}
            className={`px-3 py-1 text-sm rounded ${
              viewType === 'daily'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => onViewTypeChange?.('weekly')}
            className={`px-3 py-1 text-sm rounded ${
              viewType === 'weekly'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => onViewTypeChange?.('monthly')}
            className={`px-3 py-1 text-sm rounded ${
              viewType === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Monthly
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const today = new Date();
              const todayPos = getDatePosition(today);
              if (timelineRef.current) {
                timelineRef.current.scrollLeft = todayPos - timelineRef.current.clientWidth / 2;
              }
            }}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            Today
          </button>
          <button
            onClick={handleZoomOut}
            className="px-2 py-1 text-sm bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
            disabled={zoom <= MIN_ZOOM}
          >
            −
          </button>
          <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="px-2 py-1 text-sm bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
            disabled={zoom >= MAX_ZOOM}
          >
            +
          </button>
          <button
            onClick={handleZoomReset}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            Reset Zoom
          </button>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        ref={timelineRef}
        className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded relative"
        onScroll={handleScroll}
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      >
        <div style={{ width: timelineWidth + SIDEBAR_WIDTH, height: HEADER_HEIGHT + students.length * ROW_HEIGHT, position: 'relative' }}>
          {/* SVG Timeline */}
          <svg
            ref={svgRef}
            width={timelineWidth + SIDEBAR_WIDTH}
            height={HEADER_HEIGHT + students.length * ROW_HEIGHT}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {/* Date header */}
            <g transform={`translate(${SIDEBAR_WIDTH}, 0)`}>
              {dateLabels.map((label, index) => (
                <g key={index}>
                  <line
                    x1={label.position}
                    y1={0}
                    x2={label.position}
                    y2={HEADER_HEIGHT}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                  <text
                    x={label.position}
                    y={HEADER_HEIGHT - 10}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 dark:fill-gray-400"
                    style={{ fontSize: '11px' }}
                  >
                    {label.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </text>
                </g>
              ))}
            </g>

            {/* Student rows */}
            {students.map((student, index) => {
              const y = HEADER_HEIGHT + index * ROW_HEIGHT;
              return (
                <g key={student.id}>
                  {/* Student label */}
                  <rect
                    x={0}
                    y={y}
                    width={SIDEBAR_WIDTH}
                    height={ROW_HEIGHT}
                    fill="#f9fafb"
                    className="dark:fill-gray-800"
                  />
                  <text
                    x={SIDEBAR_WIDTH - 10}
                    y={y + ROW_HEIGHT / 2 + 4}
                    textAnchor="end"
                    className="text-sm fill-gray-700 dark:fill-gray-300"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                  >
                    {student.name}
                  </text>
                  {/* Color indicator */}
                  <circle
                    cx={SIDEBAR_WIDTH - 20}
                    cy={y + ROW_HEIGHT / 2}
                    r={6}
                    fill={student.color}
                  />
                  {/* Row separator */}
                  <line
                    x1={0}
                    y1={y + ROW_HEIGHT}
                    x2={timelineWidth + SIDEBAR_WIDTH}
                    y2={y + ROW_HEIGHT}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                </g>
              );
            })}

            {/* Timeline bars */}
            <g transform={`translate(${SIDEBAR_WIDTH}, 0)`}>{renderBars()}</g>
          </svg>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredItem && tooltipPosition && !isDragging && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <AssignmentDetailTooltip
            assignment={hoveredItem.assignment}
            position={{ x: 0, y: 0 }}
          />
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">No assignments found</p>
            <p className="text-sm">Create assignments to see them on the timeline</p>
          </div>
        </div>
      )}
    </div>
  );
}
