# Story 4.3: Retroactive Logging (Past Days)

Status: review

## Story

As a **Student**,
I want **to log progress for past days**,
so that **I can catch up if I missed logging**.

## Acceptance Criteria

1. **Given** I missed logging yesterday
   **When** I log retroactively
   **Then** I can:
   - Select a past date
   - See that day's assignment
   - Log right/wrong/empty counts
   - Save the retroactive log
   **And** the log is associated with the correct date

2. **Given** I try to log for a future date
   **When** I select a date
   **Then** future dates are disabled or rejected
   **And** I see an error message

3. **Given** I select a past date with no assignment
   **When** I view the logging form
   **Then** I see a message indicating no assignment for that date

4. **Given** I have already logged for a past date
   **When** I select that date
   **Then** I see my existing log data
   **And** I can update it

## Tasks / Subtasks

- [x] Task 1: Extend ProgressLog API to support date parameter (AC: #1, #2, #3, #4)
  - [x] Update `app/api/student/progress/route.ts` POST handler to accept optional `date` parameter
  - [x] Default to today's date if not provided
  - [x] Validate date is not in the future
  - [x] Validate date is not too far in the past (e.g., max 1 year)
  - [x] Update assignment lookup to use provided date instead of today
  - [x] Update ProgressLog upsert to use provided date
  - [x] Add date validation error handling

- [x] Task 2: Create date picker component (AC: #1, #2)
  - [x] Add date picker to `components/student/ProgressLogForm.tsx`
  - [x] Use HTML5 date input or date picker library
  - [x] Set max date to today (disable future dates)
  - [x] Set min date to reasonable past (e.g., 1 year ago)
  - [x] Default to today's date
  - [x] Handle date change event

- [x] Task 3: Update form to fetch assignment for selected date (AC: #1, #3)
  - [x] Update ProgressLogForm to accept date prop or state
  - [x] Fetch assignment for selected date when date changes
  - [x] Display assignment information for selected date
  - [x] Handle case where no assignment exists for selected date
  - [x] Show appropriate message when no assignment found

- [x] Task 4: Update API GET handler to support date parameter (AC: #4)
  - [x] Update GET handler in `app/api/student/progress/route.ts` to accept optional `date` query parameter
  - [x] Default to today if not provided
  - [x] Query ProgressLog for student, assignment, and specified date
  - [x] Return log data if exists, null if not

- [x] Task 5: Update form to load existing log for selected date (AC: #4)
  - [x] When date changes, fetch existing log for that date
  - [x] Pre-fill form with existing log data if available
  - [x] Show "Update Progress" vs "Log Progress" based on existence
  - [x] Handle loading state while fetching

- [x] Task 6: Add date selection UI to dashboard (AC: #1, #2)
  - [x] Add date selector above or within ProgressLogForm
  - [x] Allow switching between "Today" and "Past Date" modes
  - [x] Show selected date clearly
  - [x] Ensure mobile-friendly date picker

- [x] Task 7: Testing (AC: #1, #2, #3, #4)
  - [x] Test API POST with past date
  - [x] Test API POST with future date (should fail)
  - [x] Test API POST with date too far in past (should fail)
  - [x] Test API GET with date parameter
  - [x] Test date picker component (future dates disabled)
  - [x] Test form with past date assignment lookup
  - [x] Test form with past date and no assignment
  - [x] Test updating existing log for past date
  - [x] Test tenant isolation (student cannot log for other student's assignment)

## Dev Notes

### Architecture Patterns and Constraints

- **API Pattern**: Extend existing `app/api/student/progress/route.ts` - add date parameter support
- **Date Handling**: Use JavaScript Date objects, convert to ISO date string (YYYY-MM-DD) for database
- **Validation**: Validate date is not future, not too far in past (reasonable limit: 1 year)
- **Assignment Lookup**: Query Assignment where `startDate <= selectedDate <= endDate`
- **Database Query**: ProgressLog date field is `@db.Date` type - use date comparison, not datetime
- **Component Pattern**: Extend ProgressLogForm component - add date picker and date state management

### Project Structure Notes

- **API Route**: `app/api/student/progress/route.ts` - modify existing file
- **Component**: `components/student/ProgressLogForm.tsx` - modify existing file
- **Date Picker**: Consider using native HTML5 date input or lightweight date picker library (e.g., react-datepicker if needed)

### Learnings from Previous Story

**From Story 4-2-daily-question-logging-form (Status: drafted)**

- **ProgressLog API**: API endpoint structure and validation patterns already established
- **Form Component**: ProgressLogForm component structure and validation logic already created
- **Upsert Pattern**: ProgressLog upsert logic using unique constraint already implemented
- **Component Patterns**: Form validation and error handling patterns already established

[Source: docs/stories/4-2-daily-question-logging-form.md]

### References

- [Source: docs/epics.md#Story-4.3] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-005] - Daily Question Logging functional requirements (FR-005.3)
- [Source: docs/architecture.md#API-Contracts] - Standard API response format and error handling
- [Source: docs/architecture.md#Data-Architecture] - ProgressLog data model with date field
- [Source: prisma/schema.prisma] - ProgressLog schema with date field definition
- [Source: app/api/student/progress/route.ts] - Existing progress API to extend
- [Source: components/student/ProgressLogForm.tsx] - Existing form component to extend

## Dev Agent Record

### Context Reference

- docs/stories/4-3-retroactive-logging-past-days.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Complete (2025-11-26):**
- Extended progress logging API to support date parameter in both GET and POST handlers
- Added date validation: no future dates, max 1 year in past
- Updated assignments API to accept date parameter for past date assignment lookup
- Added HTML5 date picker to ProgressLogForm component with min/max date constraints
- Form now fetches assignment and existing log for selected date
- Date picker defaults to today, allows selection of past dates up to 1 year ago
- Future dates are disabled in date picker and validated on submit
- Form shows appropriate messages when no assignment exists for selected date
- All acceptance criteria met: past date selection, assignment lookup, log updates, date validation

### File List

- `app/api/student/progress/route.ts` (modified)
- `app/api/student/assignments/route.ts` (modified)
- `components/student/ProgressLogForm.tsx` (modified)

