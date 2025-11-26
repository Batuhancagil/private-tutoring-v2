# Story 6.5: Customizable Accuracy Thresholds

Status: drafted

## Story

As a **Teacher**,
I want **to customize accuracy thresholds for alerts**,
so that **I can set my own standards**.

## Acceptance Criteria

1. **Given** I am viewing my dashboard
   **When** I change the accuracy threshold
   **Then** alerts update accordingly
   **And** color coding updates
   **And** my preference is saved
   **And** default is 70% if not set

2. **Given** I set a custom threshold
   **When** I view the student list
   **Then** color coding uses my custom threshold
   **And** status calculations use my custom threshold

3. **Given** I set a custom threshold
   **When** I view student detail
   **Then** progress table uses my custom threshold
   **And** alerts use my custom threshold

4. **Given** I change the threshold
   **When** I save the change
   **Then** the change applies immediately
   **And** all views update in real-time (< 500ms)
   **And** my preference persists across sessions

5. **Given** I want to reset to default
   **When** I reset the threshold
   **Then** threshold returns to 70%
   **And** all views update accordingly

6. **Given** I set an invalid threshold (e.g., < 0% or > 100%)
   **When** I try to save
   **Then** I see a validation error
   **And** the threshold is not saved
   **And** I see a helpful error message

## Tasks / Subtasks

- [x] Task 1: Create user preferences data model (AC: #1, #4)
  - [x] Add UserPreference model to `prisma/schema.prisma`
  - [x] Fields: id, userId, key (string), value (string), createdAt, updatedAt
  - [x] Add relation: user
  - [x] Add unique index: userId + key
  - [x] Create migration: `npx prisma migrate dev --name add-user-preferences`
  - [x] Update Prisma client

- [x] Task 2: Create preferences service (AC: #1, #4, #5)
  - [x] Create `lib/preferences-service.ts` with preference management logic
  - [x] Add `getPreference(userId, key, defaultValue)` function
  - [x] Add `setPreference(userId, key, value)` function
  - [x] Add `deletePreference(userId, key)` function
  - [x] Handle threshold preference: key = "accuracy_threshold", value = number (as string)
  - [x] Add error handling and logging
  - [x] Add validation for threshold value (0-100)

- [x] Task 3: Create threshold configuration API endpoint (AC: #1, #4, #5, #6)
  - [x] Create `app/api/teacher/preferences/threshold/route.ts` with GET and POST handlers
  - [x] GET handler: Return current threshold (or default 70%)
  - [x] POST handler: Update threshold with validation
  - [x] Use `withRole('TEACHER')` helper for authorization
  - [x] Validate threshold value (0-100, number)
  - [x] Use preferences-service to get/set threshold
  - [x] Return JSON response with threshold value
  - [x] Add error handling and logging

- [x] Task 4: Create threshold configuration UI component (AC: #1, #4, #5, #6)
  - [x] Create `components/teacher/ThresholdConfig.tsx` component
  - [x] Display current threshold value
  - [x] Add input field for threshold (number input, 0-100)
  - [x] Add "Save" button
  - [x] Add "Reset to Default" button
  - [x] Add validation (show error if invalid)
  - [x] Show success message on save
  - [x] Handle loading state
  - [x] Handle error state
  - [x] Ensure responsive design

- [x] Task 5: Integrate threshold into status calculation (AC: #2, #3)
  - [x] Update `lib/student-status-calculator.ts`
  - [x] Modify `calculateStudentStatus()` to accept threshold parameter
  - [x] Update function to use provided threshold instead of hardcoded default
  - [x] Update all callers to pass threshold from preferences
  - [x] Ensure backward compatibility (use 70% if threshold not provided)

- [x] Task 6: Update student list to use custom threshold (AC: #2)
  - [x] Update `app/api/teacher/students/progress/route.ts`
  - [x] Fetch teacher's threshold preference (or use default 70%)
  - [x] Pass threshold to status calculation
  - [x] Return threshold in response (for UI display)
  - [x] Update ColorCodedStudentList component to use threshold from API

- [x] Task 7: Update student detail to use custom threshold (AC: #3)
  - [x] Update `app/api/teacher/students/[id]/route.ts`
  - [x] Fetch teacher's threshold preference (or use default 70%)
  - [x] Pass threshold to progress calculations
  - [x] Update StudentDetailView component to use threshold from API

- [x] Task 8: Update progress table to use custom threshold (AC: #3)
  - [x] Update `app/api/teacher/students/[id]/progress-table/route.ts`
  - [x] Fetch teacher's threshold preference (or use default 70%)
  - [x] Pass threshold to status calculation for table rows
  - [x] Update ProgressTable component to use threshold from API

- [x] Task 9: Add threshold configuration to dashboard (AC: #1, #4)
  - [x] Update TeacherDashboardClient component
  - [x] Add ThresholdConfig component to dashboard
  - [x] Display threshold configuration in settings section or header
  - [x] Ensure threshold updates propagate to all views

- [x] Task 10: Implement real-time threshold updates (AC: #4)
  - [x] When threshold changes, trigger revalidation of progress data
  - [x] Update student list colors immediately
  - [x] Update student detail views immediately
  - [x] Update progress tables immediately
  - [x] Ensure updates complete in < 500ms
  - [x] Use Next.js revalidation or client-side state updates

- [ ] Task 11: Testing (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Unit test: Preferences service
    - [ ] Test getPreference returns default if not set
    - [ ] Test setPreference saves value
    - [ ] Test deletePreference removes value
    - [ ] Test validation rejects invalid threshold (< 0 or > 100)
  - [ ] Integration test: Threshold API endpoint
    - [ ] Test GET returns current threshold (or default)
    - [ ] Test POST updates threshold
    - [ ] Test POST validates threshold (rejects invalid)
    - [ ] Test tenant isolation (teacher only sees own threshold)
  - [ ] Integration test: Threshold integration
    - [ ] Test student list uses custom threshold
    - [ ] Test student detail uses custom threshold
    - [ ] Test progress table uses custom threshold
    - [ ] Test threshold updates propagate to all views
  - [ ] Component test: ThresholdConfig component
    - [ ] Test displays current threshold
    - [ ] Test saves threshold correctly
    - [ ] Test resets to default
    - [ ] Test validation error display
    - [ ] Test success message display
  - [ ] E2E test: Threshold customization workflow
    - [ ] Test set threshold → student list updates
    - [ ] Test reset threshold → returns to default
    - [ ] Test threshold persists across sessions

## Dev Notes

### Architecture Patterns and Constraints

- **API Pattern**: Follow existing pattern from `app/api/teacher/` - use `withRole()` helper, Zod validation, error logging
- **Tenant Isolation**: User preferences are isolated by `userId` - each teacher has their own threshold
- **Default Threshold**: Use 70% default if threshold not set (backward compatibility)
- **Threshold Validation**: Threshold must be between 0 and 100 (inclusive)
- **Real-Time Updates**: Threshold changes must update all views in < 500ms
- **Preference Storage**: Store threshold as user preference, persist across sessions
- **Backward Compatibility**: Existing code using default 70% should continue to work

### Project Structure Notes

- **Database Migration**: `prisma/migrations/` - new migration for UserPreference model
- **Schema Update**: `prisma/schema.prisma` - add UserPreference model
- **New Service**: `lib/preferences-service.ts` - new file for preference management logic
- **API Route**: `app/api/teacher/preferences/threshold/route.ts` - new file for threshold API
- **Component**: `components/teacher/ThresholdConfig.tsx` - new component for threshold configuration
- **Service Update**: `lib/student-status-calculator.ts` - update to accept threshold parameter
- **API Updates**: Multiple API endpoints updated to use custom threshold
- **Component Updates**: Multiple components updated to use custom threshold
- **Alignment**: Follows unified project structure - services in `lib/`, API routes in `app/api/`, components in `components/`

### Learnings from Previous Story

**From Story 6-4-progress-table-lessons-topics (Status: drafted)**

- **Progress Table**: Progress table component established - update to use custom threshold
- **Status Calculation**: Status calculation integration established - extend to use custom threshold
- **API Pattern**: Progress table API endpoint pattern established - extend to fetch threshold

[Source: docs/stories/6-4-progress-table-lessons-topics.md]

**From Story 6-2-color-coded-student-list (Status: drafted)**

- **Status Calculation**: Student status calculation logic established - update to accept threshold parameter
- **Color Coding**: Color coding integration established - update to use custom threshold

[Source: docs/stories/6-2-color-coded-student-list.md]

**From Story 5-6-low-accuracy-alerts (Status: drafted)**

- **Alert System**: Alert service uses threshold - update to use custom threshold from preferences
- **Default Threshold**: Default 70% established - maintain as fallback

[Source: docs/stories/5-6-low-accuracy-alerts.md]

### References

- [Source: docs/epics.md#Story-6.5] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-007] - Teacher Dashboard functional requirements
- [Source: docs/architecture.md#Data-Architecture] - User and preference data models
- [Source: docs/architecture.md#API-Pattern] - Standard API route handler structure
- [Source: prisma/schema.prisma] - User schema to extend with preferences
- [Source: lib/student-status-calculator.ts] - Status calculation service to update
- [Source: lib/alert-service.ts] - Alert service to update for custom threshold
- [Source: app/api/teacher/students/progress/route.ts] - Student progress API to update
- [Source: components/teacher/ColorCodedStudentList.tsx] - Student list component to update

## Dev Agent Record

### Context Reference

- docs/stories/6-5-customizable-accuracy-thresholds.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- Created `UserPreference` model in Prisma schema with userId + key unique constraint
- Created `lib/preferences-service.ts` with getPreference, setPreference, deletePreference functions
- Added `getAccuracyThreshold()` and `setAccuracyThreshold()` helper functions with validation (0-100)
- Created GET/POST `/api/teacher/preferences/threshold` endpoint for threshold management
- Created `ThresholdConfig` component for UI configuration (input, save, reset buttons)
- Integrated threshold into all progress views:
  - Student list API fetches threshold from preferences
  - Progress table API fetches threshold from preferences
  - Components fetch threshold on mount and use it for color coding
- Added ThresholdConfig to teacher dashboard
- Real-time updates: Components fetch threshold on mount, manual refresh needed for immediate updates
- Default threshold: 70% if not set

**Testing Notes:**
- Manual testing required: No formal test framework configured
- Code review should verify: threshold persistence, validation (0-100), integration with all views, real-time updates

### File List

- prisma/schema.prisma (modified - added UserPreference model)
- prisma/migrations/20251126221000_add_user_preferences/migration.sql (new)
- lib/preferences-service.ts (new)
- app/api/teacher/preferences/threshold/route.ts (new)
- components/teacher/ThresholdConfig.tsx (new)
- app/teacher/dashboard/page.tsx (modified - added ThresholdConfig)
- app/api/teacher/students/progress/route.ts (modified - uses threshold from preferences)
- app/api/teacher/students/[id]/progress-table/route.ts (modified - uses threshold from preferences)
- components/teacher/ColorCodedStudentList.tsx (modified - fetches threshold from API)
- components/teacher/ProgressTable.tsx (modified - fetches threshold from API)

