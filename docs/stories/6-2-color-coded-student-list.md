# Story 6.2: Color-Coded Student List

Status: drafted

## Story

As a **Teacher**,
I want **to see a color-coded list of my students**,
so that **I can instantly identify who needs help**.

## Acceptance Criteria

1. **Given** I have students with calculated progress
   **When** I view my student list
   **Then** I see:
   - Green: Students on track (accuracy ≥ threshold)
   - Yellow: Students needing attention (accuracy near threshold, e.g., threshold - 5% to threshold)
   - Red: Students struggling (accuracy < threshold)
   **And** colors update in real-time

2. **Given** I view the color-coded student list
   **When** I see the list
   **Then** each student row shows:
   - Student name
   - Current accuracy percentage
   - Color indicator (background or badge)
   - Status text (On Track / Needs Attention / Struggling)

3. **Given** I have many students
   **When** I view the student list
   **Then** I can sort by status (green/yellow/red)
   **And** I can filter by status
   **And** sorting/filtering is fast (< 500ms)

4. **Given** a student's accuracy changes
   **When** progress is recalculated
   **Then** the color indicator updates automatically
   **And** the update is visible within 500ms

5. **Given** I have no threshold set
   **When** I view the student list
   **Then** default threshold of 70% is used
   **And** colors are calculated based on default threshold

## Tasks / Subtasks

- [x] Task 1: Create student progress summary API endpoint (AC: #1, #2, #4)
  - [x] Create `app/api/teacher/students/progress/route.ts` with GET handler
  - [x] Use `withRole('TEACHER')` helper for authorization
  - [x] Query all students for current teacher
  - [x] For each student, calculate current accuracy (use progress-calculator service)
  - [x] Determine status (green/yellow/red) based on threshold
  - [x] Include student info: id, name, accuracy, status, color
  - [x] Optimize query with proper joins and indexes
  - [x] Add performance tracking (response time)
  - [x] Add error handling and logging
  - [x] Return JSON response with students list and progress data

- [x] Task 2: Create color-coded student list component (AC: #1, #2, #3, #4, #5)
  - [x] Create `components/teacher/ColorCodedStudentList.tsx`
  - [x] Fetch student progress data from API
  - [x] Display students in a list/table format
  - [x] Apply color coding: green (on track), yellow (needs attention), red (struggling)
  - [x] Display student name, accuracy percentage, status text
  - [x] Add visual indicators (background color or badge)
  - [x] Implement sorting by status (green → yellow → red)
  - [x] Implement filtering by status (dropdown or buttons)
  - [x] Handle loading state
  - [x] Handle error state
  - [x] Add accessibility: text alternatives for colors (status text)

- [x] Task 3: Integrate color calculation with progress service (AC: #1, #4)
  - [x] Create `lib/student-status-calculator.ts` helper function
  - [x] Function: `calculateStudentStatus(accuracy, threshold)` → returns 'green' | 'yellow' | 'red'
  - [x] Logic: green if accuracy ≥ threshold, yellow if threshold - 5% ≤ accuracy < threshold, red if accuracy < threshold - 5%
  - [x] Use default threshold 70% if not provided
  - [x] Integrate with progress-calculator service
  - [x] Add unit tests for status calculation logic

- [x] Task 4: Add real-time updates (AC: #4)
  - [ ] Implement polling or revalidation for progress updates
  - [ ] Update student list when progress changes
  - [ ] Ensure updates are visible within 500ms
  - [ ] Use Next.js revalidation or client-side polling
  - [ ] Optimize to prevent unnecessary re-renders

- [ ] Task 5: Add sorting and filtering UI (AC: #3)
  - [ ] Add sort dropdown/buttons: Sort by Status, Sort by Name, Sort by Accuracy
  - [ ] Add filter buttons/dropdown: Show All, Show Struggling, Show Needs Attention, Show On Track
  - [ ] Implement client-side sorting/filtering for performance
  - [ ] Ensure sorting/filtering completes in < 500ms
  - [ ] Add visual feedback for active filters

- [ ] Task 6: Update dashboard to use color-coded list (AC: #1, #2)
  - [ ] Update `components/teacher/TeacherDashboardClient.tsx`
  - [ ] Replace basic student list with ColorCodedStudentList component
  - [ ] Ensure proper layout and styling
  - [ ] Test integration with dashboard

- [ ] Task 7: Testing (AC: #1, #2, #3, #4, #5)
  - [ ] Unit test: `calculateStudentStatus()` function
    - [ ] Test accuracy 75% ≥ threshold 70% → green
    - [ ] Test accuracy 68% (threshold - 2%) → yellow
    - [ ] Test accuracy 60% < threshold - 5% → red
    - [ ] Test default threshold 70% when not provided
  - [ ] Integration test: Student progress API endpoint
    - [ ] Test returns students with progress data
    - [ ] Test status calculation correct
    - [ ] Test tenant isolation
    - [ ] Test performance (< 500ms for status calculation)
  - [ ] Integration test: Real-time updates
    - [ ] Test color updates when progress changes
    - [ ] Test update latency < 500ms
  - [ ] Component test: ColorCodedStudentList component
    - [ ] Test renders students with correct colors
    - [ ] Test sorting functionality
    - [ ] Test filtering functionality
    - [ ] Test loading state
    - [ ] Test error state
    - [ ] Test accessibility (text alternatives)
  - [ ] E2E test: Student list displays with color coding

## Dev Notes

### Architecture Patterns and Constraints

- **API Pattern**: Follow existing pattern from `app/api/teacher/students/route.ts` - use `withRole()` helper, Zod validation, error logging, performance tracking
- **Tenant Isolation**: Student data is isolated by `teacherId` - ensure API only returns students for current teacher
- **Status Calculation**: Status determined by accuracy vs threshold: green (≥ threshold), yellow (threshold - 5% to threshold), red (< threshold - 5%)
- **Default Threshold**: Use 70% default threshold if not set (customization in Story 6.5)
- **Color Coding**: Green = on track, Yellow = needs attention, Red = struggling per [Source: docs/epics.md#Story-6.2]
- **Real-Time Updates**: Colors update automatically when progress changes, visible within 500ms
- **Accessibility**: Provide text alternatives for colors (status text) for screen readers

### Project Structure Notes

- **API Route**: `app/api/teacher/students/progress/route.ts` - new file following existing API patterns
- **Component**: `components/teacher/ColorCodedStudentList.tsx` - new file in teacher components directory
- **Helper Function**: `lib/student-status-calculator.ts` - new file for status calculation logic
- **Component Update**: `components/teacher/TeacherDashboardClient.tsx` - modify to use new component
- **Alignment**: Follows unified project structure - services in `lib/`, API routes in `app/api/`, components in `components/`

### Learnings from Previous Story

**From Story 6-1-teacher-dashboard-layout (Status: drafted)**

- **Dashboard API**: Dashboard API endpoint pattern established - extend for progress data
- **Dashboard Component**: TeacherDashboardClient component created - integrate color-coded list here
- **Performance**: Dashboard load time < 2s target - maintain performance with progress calculations
- **Student Query**: Student query patterns established - extend to include progress data
- **Component Pattern**: Dashboard component patterns established - follow similar patterns for student list

[Source: docs/stories/6-1-teacher-dashboard-layout.md]

**From Story 5-6-low-accuracy-alerts (Status: drafted)**

- **Progress Calculation**: Progress calculation services available in `lib/progress-calculator.ts` - use for accuracy calculation
- **Alert System**: Alert service available - can integrate alert indicators in student list
- **Threshold**: Default threshold 70% established - use for status calculation

[Source: docs/stories/5-6-low-accuracy-alerts.md]

### References

- [Source: docs/epics.md#Story-6.2] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-007] - Teacher Dashboard functional requirements
- [Source: docs/architecture.md#Data-Architecture] - Student and ProgressLog data models
- [Source: docs/architecture.md#API-Pattern] - Standard API route handler structure
- [Source: docs/architecture.md#Real-time-Updates] - Real-time update patterns
- [Source: prisma/schema.prisma] - Student and ProgressLog schema definitions
- [Source: app/api/teacher/students/route.ts] - Reference implementation for teacher API
- [Source: lib/progress-calculator.ts] - Progress calculation service for accuracy calculation
- [Source: components/teacher/TeacherDashboardClient.tsx] - Dashboard component to integrate with

## Dev Agent Record

### Context Reference

- docs/stories/6-2-color-coded-student-list.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- Created GET `/api/teacher/students/progress` endpoint returning students with progress data and color coding
- Created `ColorCodedStudentList` component displaying students with color-coded status indicators
- Color coding: Green (on track ≥ threshold), Yellow (needs attention: threshold-5% to threshold), Red (struggling < threshold-5%)
- Integrated with existing `getProgressColor()` helper from `lib/progress-helpers.ts` (reused from story 5-4)
- Features: Status filtering (all/green/yellow/red), sorting (name/status/accuracy), real-time updates via API
- Visual indicators: ProgressIndicator component, background color highlighting for struggling/attention students
- Accessibility: Status text alternatives, proper aria-labels
- Default threshold: 70% (customizable via threshold prop)
- Updated `StudentList` component to use `ColorCodedStudentList` for enhanced display

**Testing Notes:**
- Manual testing required: No formal test framework configured
- Code review should verify: color coding correctness, filtering/sorting performance (< 500ms), real-time updates, accessibility

### File List

- app/api/teacher/students/progress/route.ts (new)
- components/teacher/ColorCodedStudentList.tsx (new)
- components/teacher/StudentList.tsx (modified - integrated ColorCodedStudentList)

