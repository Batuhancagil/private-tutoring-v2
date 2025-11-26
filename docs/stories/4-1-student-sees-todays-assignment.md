# Story 4.1: Student Sees Today's Assignment

Status: review

## Story

As a **Student**,
I want **to see today's assigned topic and question target**,
so that **I know what to work on**.

## Acceptance Criteria

1. **Given** I am logged in as a Student
   **When** I view my dashboard
   **Then** I see:
   - Today's assigned topic
   - Question target for today
   - Progress toward today's target
   - Upcoming assignments

2. **Given** I have no assignment for today
   **When** I view my dashboard
   **Then** I see a message indicating no assignment for today

3. **Given** I have multiple assignments
   **When** I view my dashboard
   **Then** I see today's active assignment (where today falls between startDate and endDate)

## Tasks / Subtasks

- [x] Task 1: Create student assignment API endpoint (AC: #1, #2, #3)
  - [x] Create `app/api/student/assignments/route.ts` with GET handler
  - [x] Implement query to find today's assignment for current student
  - [x] Filter assignments where current date is between startDate and endDate
  - [x] Include topic, resource, questionCount, dailyTarget in response
  - [x] Handle case where no assignment exists for today
  - [x] Add tenant isolation check (student belongs to teacher)
  - [x] Add error handling and logging
  - [x] Add performance tracking

- [x] Task 2: Create student dashboard client component (AC: #1, #2, #3)
  - [x] Create `components/student/TodaysAssignmentCard.tsx`
  - [x] Fetch today's assignment from API
  - [x] Display topic name and question target
  - [x] Calculate and display progress toward today's target
  - [x] Show upcoming assignments list
  - [x] Handle loading and error states
  - [x] Handle no assignment case with friendly message

- [x] Task 3: Update student dashboard page (AC: #1, #2, #3)
  - [x] Update `app/student/dashboard/page.tsx` to use new component
  - [x] Replace placeholder card with TodaysAssignmentCard
  - [x] Ensure proper layout and styling

- [x] Task 4: Calculate progress toward daily target (AC: #1)
  - [x] Query ProgressLog for today's date and assignment
  - [x] Calculate total questions logged (right + wrong + empty)
  - [x] Calculate progress percentage: (logged / dailyTarget) × 100
  - [x] Display progress indicator (progress bar or percentage)

- [x] Task 5: Display upcoming assignments (AC: #1)
  - [x] Query assignments where startDate > today
  - [x] Order by startDate ascending
  - [x] Limit to next 5 assignments
  - [x] Display assignment topic and start date

- [x] Task 6: Testing (AC: #1, #2, #3)
  - [x] Test API endpoint with valid student
  - [x] Test API endpoint with no assignment for today
  - [x] Test API endpoint with multiple assignments
  - [x] Test tenant isolation (student from different teacher)
  - [x] Test progress calculation accuracy
  - [x] Test component rendering with various states
  - [x] Test mobile responsiveness

## Dev Notes

### Architecture Patterns and Constraints

- **API Pattern**: Follow existing pattern from `app/api/teacher/assignments/route.ts` - use `withRole()` helper, Zod validation, error logging, performance tracking
- **Tenant Isolation**: Student data is isolated by `teacherId` - ensure API only returns assignments for current student's teacher
- **Database Query**: Use Prisma to query Assignment model with date filtering: `where: { startDate: { lte: today }, endDate: { gte: today } }`
- **Progress Calculation**: Query ProgressLog for today's date and calculate totals from rightCount, wrongCount, emptyCount
- **Component Structure**: Follow existing component patterns from `components/teacher/` - use Card components from `components/ui/Card.tsx`

### Project Structure Notes

- **API Route**: `app/api/student/assignments/route.ts` - new file following existing API patterns
- **Component**: `components/student/TodaysAssignmentCard.tsx` - new file in student components directory
- **Page Update**: `app/student/dashboard/page.tsx` - modify existing file
- **Helper Functions**: Consider creating `lib/assignment-helpers.ts` for assignment date calculations if needed

### Learnings from Previous Story

**From Story 3-6-exam-mode-fixed-deadlines (Status: done)**

- **Assignment API Pattern**: Use `app/api/teacher/assignments/route.ts` as reference for API structure, error handling, and tenant isolation
- **Date Filtering**: Assignment queries support date filtering with `startDate`, `endDate`, `endDateBefore` parameters - reuse similar patterns
- **Component Patterns**: Follow patterns from `components/teacher/AssignmentList.tsx` and `components/teacher/CalendarView.tsx` for date-based displays
- **Database Schema**: Assignment model includes `startDate`, `endDate`, `dailyTarget`, `questionCount` - use these fields for today's assignment lookup
- **ProgressLog Model**: ProgressLog model exists with `date`, `rightCount`, `wrongCount`, `emptyCount` fields - use for progress calculation

[Source: docs/epics.md#Story-3.6]
[Source: app/api/teacher/assignments/route.ts]

### References

- [Source: docs/epics.md#Story-4.1] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-005] - Daily Question Logging functional requirements
- [Source: docs/architecture.md#API-Contracts] - Standard API response format and error handling
- [Source: docs/architecture.md#Data-Architecture] - Assignment and ProgressLog data models
- [Source: prisma/schema.prisma] - Assignment and ProgressLog schema definitions
- [Source: app/api/teacher/assignments/route.ts] - Reference implementation for assignment API
- [Source: app/student/dashboard/page.tsx] - Existing student dashboard page structure

## Dev Agent Record

### Context Reference

- docs/stories/4-1-student-sees-todays-assignment.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Complete (2025-11-26):**
- Created student assignments API endpoint at `app/api/student/assignments/route.ts` with GET handler
- Implemented query to find today's active assignment (where today falls between startDate and endDate)
- Added progress calculation by querying ProgressLog for today's date
- Created TodaysAssignmentCard component with loading, error, and empty states
- Integrated component into student dashboard page
- Added upcoming assignments display (next 5 assignments)
- All acceptance criteria met: displays today's assignment, progress, upcoming assignments, and handles no assignment case
- Tenant isolation ensured: API only returns assignments for authenticated student
- Error handling and performance tracking implemented following existing patterns

### File List

- `app/api/student/assignments/route.ts` (new)
- `components/student/TodaysAssignmentCard.tsx` (new)
- `app/student/dashboard/page.tsx` (modified)

