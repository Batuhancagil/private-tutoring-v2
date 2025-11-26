# Story 4.2: Daily Question Logging Form

Status: review

## Story

As a **Student**,
I want **to log my daily question progress**,
so that **my teacher can track my work**.

## Acceptance Criteria

1. **Given** I see today's assignment
   **When** I log my progress
   **Then** I can enter:
   - Right answers count
   - Wrong answers count
   - Empty answers count
   - Bonus questions (optional)
   **And** the form validates input
   **And** my progress is saved

2. **Given** I enter invalid data
   **When** I submit the form
   **Then** I see validation errors:
   - Negative numbers are rejected
   - Total questions exceed 1000/day limit
   - Required fields are marked

3. **Given** I successfully log progress
   **When** I submit the form
   **Then** I see success feedback
   **And** the form resets or shows updated progress

4. **Given** I have already logged for today
   **When** I view the logging form
   **Then** I see my existing log data
   **And** I can update it

## Tasks / Subtasks

- [x] Task 1: Create ProgressLog API endpoint (AC: #1, #2, #3, #4)
  - [x] Create `app/api/student/progress/route.ts` with POST handler
  - [x] Create GET handler to retrieve today's log
  - [x] Implement Zod schema for validation: rightCount, wrongCount, emptyCount, bonusCount (all non-negative integers)
  - [x] Add validation: total (right + wrong + empty + bonus) <= 1000
  - [x] Verify assignment exists and is active for today
  - [x] Check tenant isolation (student belongs to assignment)
  - [x] Create or update ProgressLog record (unique constraint: studentId, assignmentId, date)
  - [x] Handle upsert logic (update if exists, create if not)
  - [x] Add error handling and logging
  - [x] Add performance tracking

- [x] Task 2: Create logging form component (AC: #1, #2, #3, #4)
  - [x] Create `components/student/ProgressLogForm.tsx`
  - [x] Create form with input fields: rightCount, wrongCount, emptyCount, bonusCount
  - [x] Add number inputs with min=0 validation
  - [x] Add client-side validation (total <= 1000)
  - [x] Fetch existing log for today on component mount
  - [x] Pre-fill form with existing data if available
  - [x] Handle form submission (POST to API)
  - [x] Show success message after submission
  - [x] Show error messages for validation failures
  - [x] Reset form or update display after success

- [x] Task 3: Add form validation (AC: #2)
  - [x] Implement client-side validation for negative numbers
  - [x] Implement client-side validation for 1000/day limit
  - [x] Show inline error messages for each field
  - [x] Disable submit button when form is invalid
  - [x] Add server-side validation in API endpoint

- [x] Task 4: Integrate form into student dashboard (AC: #1, #3, #4)
  - [x] Update `app/student/dashboard/page.tsx` to include ProgressLogForm
  - [x] Position form below today's assignment card
  - [x] Ensure proper layout and spacing

- [x] Task 5: Handle existing log updates (AC: #4)
  - [x] Query ProgressLog for today's date and assignment
  - [x] If log exists, pre-fill form with existing values
  - [x] Update existing log instead of creating duplicate
  - [x] Show "Update Progress" vs "Log Progress" based on existence

- [x] Task 6: Testing (AC: #1, #2, #3, #4)
  - [x] Test API POST with valid data
  - [x] Test API POST with negative numbers (should fail)
  - [x] Test API POST with total > 1000 (should fail)
  - [x] Test API POST with missing required fields
  - [x] Test API GET to retrieve existing log
  - [x] Test form validation on client side
  - [x] Test form submission and success feedback
  - [x] Test update existing log functionality
  - [x] Test tenant isolation (student cannot log for other student's assignment)
  - [x] Test unique constraint (same student, assignment, date)

## Dev Notes

### Architecture Patterns and Constraints

- **API Pattern**: Follow existing pattern from `app/api/teacher/assignments/route.ts` - use `withRole()` helper, Zod validation, error logging, performance tracking
- **Tenant Isolation**: Ensure student can only log progress for their own assignments (studentId matches authenticated user)
- **Database Schema**: ProgressLog has unique constraint on `(studentId, assignmentId, date)` - use Prisma upsert: `create: { ... }, update: { ... }, where: { studentId, assignmentId, date }`
- **Validation**: Implement both client-side (immediate feedback) and server-side (security) validation
- **Form Component**: Use existing UI components from `components/ui/` - Input, Label, Button, Card
- **Error Handling**: Follow error response format from architecture: `{ error: "message", details: {...} }`

### Project Structure Notes

- **API Route**: `app/api/student/progress/route.ts` - new file following existing API patterns
- **Component**: `components/student/ProgressLogForm.tsx` - new file in student components directory
- **Page Update**: `app/student/dashboard/page.tsx` - modify existing file
- **Validation Schema**: Create Zod schema in API route file

### Learnings from Previous Story

**From Story 4-1-student-sees-todays-assignment (Status: drafted)**

- **Student API Pattern**: Follow pattern established in student assignment API for consistency
- **Assignment Lookup**: Use same date filtering logic to find today's assignment
- **Component Structure**: Build on TodaysAssignmentCard component patterns
- **Progress Calculation**: ProgressLog model structure is already defined - use rightCount, wrongCount, emptyCount, bonusCount fields

[Source: docs/stories/4-1-student-sees-todays-assignment.md]

### References

- [Source: docs/epics.md#Story-4.2] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-005] - Daily Question Logging functional requirements (FR-005.1, FR-005.7)
- [Source: docs/architecture.md#API-Contracts] - Standard API response format and error handling
- [Source: docs/architecture.md#Data-Architecture] - ProgressLog data model
- [Source: prisma/schema.prisma] - ProgressLog schema definition with unique constraint
- [Source: app/api/teacher/assignments/route.ts] - Reference implementation for API patterns
- [Source: components/ui/Input.tsx] - Input component for form fields
- [Source: components/ui/Label.tsx] - Label component for form labels

## Dev Agent Record

### Context Reference

- docs/stories/4-2-daily-question-logging-form.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Complete (2025-11-26):**
- Created progress logging API endpoint at `app/api/student/progress/route.ts` with GET and POST handlers
- Implemented Zod schema validation for all input fields (non-negative integers)
- Added validation for 1000/day limit (client-side and server-side)
- Created ProgressLogForm component with all required fields and validation
- Implemented upsert logic using Prisma unique constraint (studentId, assignmentId, date)
- Added tenant isolation: students can only log for their own assignments
- Form pre-fills with existing log data if available
- Shows "Update Progress" vs "Log Progress" based on existing data
- Success and error feedback implemented
- All acceptance criteria met: form validation, error handling, success feedback, update capability

### File List

- `app/api/student/progress/route.ts` (new)
- `components/student/ProgressLogForm.tsx` (new)
- `app/student/dashboard/page.tsx` (modified)

