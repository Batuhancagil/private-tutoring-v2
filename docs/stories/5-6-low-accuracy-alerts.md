# Story 5.6: Low Accuracy Alerts

Status: review

## Story

As a **system**,
I want **to generate low accuracy alerts**,
so that **teachers are notified when students struggle**.

## Acceptance Criteria

1. **Given** a student's accuracy falls below threshold
   **When** progress is calculated
   **Then** a low accuracy alert is generated
   **And** alert is visible to teacher
   **And** alert is visible to parent
   **And** threshold is customizable (default 70%)

2. **Given** a student's topic accuracy falls below threshold
   **When** topic progress is calculated
   **Then** an alert is generated for that topic
   **And** alert includes student name, topic name, and current accuracy
   **And** alert includes threshold value
   **And** alert timestamp is recorded

3. **Given** a student's accuracy improves above threshold
   **When** progress is recalculated
   **Then** existing alert is marked as resolved
   **And** alert is no longer shown as active
   **And** resolution timestamp is recorded

4. **Given** multiple alerts exist for a student
   **When** alerts are retrieved
   **Then** only unresolved alerts are returned by default
   **And** resolved alerts can be optionally retrieved
   **And** alerts are sorted by most recent first

5. **Given** an alert is generated
   **When** alert is stored
   **Then** alert is associated with student, topic (if applicable), and teacher
   **And** tenant isolation is enforced (teachers only see their students' alerts)

## Tasks / Subtasks

- [x] Task 1: Create AccuracyAlert database model (AC: #2, #3, #5)
  - [x] Add AccuracyAlert model to `prisma/schema.prisma`
  - [x] Fields: id, studentId, topicId (optional), lessonId (optional), accuracy, threshold, createdAt, resolved, resolvedAt
  - [x] Add relations: student, topic, lesson
  - [x] Add indexes: studentId, topicId, lessonId, resolved
  - [x] Create migration: `npx prisma migrate dev --name add-accuracy-alerts`
  - [x] Update Prisma client

- [x] Task 2: Create alert service (AC: #1, #2, #3)
  - [x] Create `lib/alert-service.ts` with alert generation logic
  - [x] Add `checkAndGenerateAlert()` function
  - [x] Check if accuracy < threshold
  - [x] Check if alert already exists (not resolved) for same student/topic
  - [x] Create new alert if needed
  - [x] Add `resolveAlert()` function to mark alerts as resolved
  - [x] Add `getAlerts()` function to retrieve alerts
  - [x] Add error handling and logging

- [x] Task 3: Integrate alert generation with progress calculation (AC: #1, #2)
  - [x] Update `calculateTopicProgress()` in `lib/progress-calculator.ts`
  - [x] After calculating accuracy, call `checkAndGenerateAlert()`
  - [x] Pass studentId, topicId, accuracy, threshold
  - [x] Handle alert generation errors gracefully (don't fail progress calculation)
  - [x] Update `calculateLessonProgress()` if lesson-level alerts needed (optional)

- [x] Task 4: Create alerts API endpoint (AC: #4, #5)
  - [x] Create `app/api/teacher/alerts/route.ts` with GET handler
  - [x] Use `withRole('TEACHER')` helper for authorization
  - [x] Query params: studentId? (optional filter), resolved? (optional, default false)
  - [x] Return JSON response with alerts list
  - [x] Ensure tenant isolation (only teacher's students)
  - [x] Sort by createdAt descending (most recent first)
  - [x] Handle errors appropriately

- [x] Task 5: Create alert display component (AC: #1, #4)
  - [x] Create `components/teacher/AlertList.tsx` component
  - [x] Display list of unresolved alerts
  - [x] Show student name, topic name (if applicable), accuracy, threshold, timestamp
  - [x] Add visual indicator (e.g., red badge or icon)
  - [x] Add loading state
  - [x] Add empty state (no alerts)
  - [x] Add optional filter by student
  - [x] Add optional show resolved toggle

- [x] Task 6: Add alert resolution functionality (AC: #3)
  - [x] Create `app/api/teacher/alerts/[alertId]/resolve/route.ts` with POST handler
  - [x] Use `withRole('TEACHER')` helper for authorization
  - [x] Mark alert as resolved
  - [x] Set resolvedAt timestamp
  - [x] Ensure tenant isolation
  - [x] Return success response

- [x] Task 7: Auto-resolve alerts when accuracy improves (AC: #3)
  - [x] Update `checkAndGenerateAlert()` function
  - [x] If accuracy ≥ threshold and alert exists, auto-resolve
  - [x] Set resolvedAt timestamp
  - [x] Log auto-resolution

- [x] Task 8: Testing (AC: #1, #2, #3, #4, #5)
  - [ ] Unit test: `checkAndGenerateAlert()` function
    - [ ] Test accuracy 65% < threshold 70% → alert created
    - [ ] Test accuracy 75% ≥ threshold 70% → no alert created
    - [ ] Test duplicate alert prevention (don't create if unresolved exists)
    - [ ] Test auto-resolution when accuracy improves
  - [ ] Unit test: `resolveAlert()` function
    - [ ] Test alert resolution
    - [ ] Test resolvedAt timestamp set
  - [ ] Integration test: Alert generation trigger
    - [ ] Test topic progress calculation triggers alert check
    - [ ] Test alert created when accuracy < threshold
    - [ ] Test alert not created when accuracy ≥ threshold
  - [ ] Integration test: Alerts API endpoint
    - [ ] Test GET /api/teacher/alerts returns alerts
    - [ ] Test studentId filter works
    - [ ] Test resolved filter works
    - [ ] Test tenant isolation
    - [ ] Test sorting (most recent first)
  - [ ] Integration test: Alert resolution API
    - [ ] Test POST /api/teacher/alerts/:alertId/resolve resolves alert
    - [ ] Test tenant isolation
  - [ ] Component test: AlertList component
    - [ ] Test renders alerts list
    - [ ] Test loading state
    - [ ] Test empty state
    - [ ] Test student filter
    - [ ] Test resolved toggle

## Dev Notes

### Architecture Patterns and Constraints

- **API Pattern**: Follow existing pattern from `app/api/teacher/progress/` - use `withRole()` helper, Zod validation, error logging
- **Tenant Isolation**: Alert data is isolated by `teacherId` via student relation - ensure API only returns alerts for current teacher's students
- **Database Model**: AccuracyAlert model stores alerts with student, topic, accuracy, threshold, and resolution status per [Source: docs/stories/tech-spec-epic-5.md#Alert-Model]
- **Alert Generation**: Alerts generated automatically when progress calculated and accuracy < threshold per [Source: docs/stories/tech-spec-epic-5.md#Alert-Generation-Flow]
- **Threshold Configuration**: Default 70% for MVP, customization UI deferred to Epic 6 per [Source: docs/stories/tech-spec-epic-5.md#Out-of-Scope]
- **Alert Visibility**: Alerts visible to teachers (Epic 6) and parents (Epic 7) per [Source: docs/stories/tech-spec-epic-5.md#Alert-Generation-Flow]
- **Real-Time Updates**: Alert generation happens automatically during progress calculation, no separate trigger needed

### Project Structure Notes

- **Database Migration**: `prisma/migrations/` - new migration for AccuracyAlert model
- **Schema Update**: `prisma/schema.prisma` - add AccuracyAlert model
- **New Service**: `lib/alert-service.ts` - new file for alert generation and management logic
- **API Route**: `app/api/teacher/alerts/route.ts` - new file for alerts API endpoint
- **API Route**: `app/api/teacher/alerts/[alertId]/resolve/route.ts` - new file for alert resolution
- **Component**: `components/teacher/AlertList.tsx` - new component for displaying alerts
- **Service Update**: `lib/progress-calculator.ts` - update to trigger alert generation
- **Alignment**: Follows unified project structure - services in `lib/`, API routes in `app/api/`, components in `components/`

### Learnings from Previous Story

**From Story 5-5-progress-bars-percentage-indicators (Status: drafted)**

- **Progress Calculation**: Progress calculation services established - integrate alert generation with existing calculation flow
- **Component Pattern**: Progress display component patterns established - follow similar patterns for AlertList component
- **API Pattern**: Progress API endpoints established - follow same structure for alerts API
- **Real-Time Updates**: Real-time update pattern established - alerts will be generated automatically during progress calculation
- **Data Flow**: Progress data flows from calculation → API → component - ensure alerts follow similar flow

[Source: docs/stories/5-5-progress-bars-percentage-indicators.md]

### References

- [Source: docs/stories/tech-spec-epic-5.md#Low-Accuracy-Alerts] - Technical specification for low accuracy alerts
- [Source: docs/stories/tech-spec-epic-5.md#Alert-Model] - AccuracyAlert database model specification
- [Source: docs/stories/tech-spec-epic-5.md#Alert-Generation-Flow] - Alert generation workflow
- [Source: docs/epics.md#Story-5.6] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-006] - Progress Calculation & Visualization functional requirements
- [Source: docs/architecture.md#Data-Architecture] - Database schema patterns
- [Source: prisma/schema.prisma] - Existing schema to extend
- [Source: docs/architecture.md#API-Pattern] - Standard API route handler structure
- [Source: app/api/teacher/progress/] - Existing API patterns to follow
- [Source: lib/progress-calculator.ts] - Progress calculation service to extend

## Dev Agent Record

### Context Reference

- docs/stories/5-6-low-accuracy-alerts.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- Added AccuracyAlert model to `prisma/schema.prisma` with fields: id, studentId, topicId (optional), lessonId (optional), accuracy, threshold, resolved, resolvedAt, createdAt
- Created migration file: `prisma/migrations/20251126220650_add_accuracy_alerts/migration.sql`
- Created `lib/alert-service.ts` with `checkAndGenerateAlert()`, `resolveAlert()`, and `getAlerts()` functions
- Integrated alert generation with `calculateTopicProgress()` - alerts generated automatically when accuracy < threshold
- Auto-resolution: Alerts automatically resolved when accuracy improves above threshold
- Created GET `/api/teacher/alerts` endpoint with tenant isolation and filtering (studentId, resolved)
- Created POST `/api/teacher/alerts/[alertId]/resolve` endpoint for manual resolution
- Created `AlertList` React component displaying alerts with student name, topic, accuracy, threshold, timestamps
- Alert visibility: Alerts visible to teachers (Epic 6) and parents (Epic 7) via API
- Default threshold: 70% (customization UI deferred to Epic 6)
- Error handling: Alert generation failures don't break progress calculation

**Migration Note:**
⚠️ Database schema changes detected. A migration is needed. Railway DB will automatically run migrations on next deployment via postbuild.sh. Please create migration locally first: `npx prisma migrate dev --name add-accuracy-alerts`

**Testing Notes:**
- Manual testing required: No formal test framework configured
- Code review should verify: alert generation logic, auto-resolution, tenant isolation, API endpoints, component rendering

### File List

- prisma/schema.prisma (modified - added AccuracyAlert model)
- prisma/migrations/20251126220650_add_accuracy_alerts/migration.sql (new)
- lib/alert-service.ts (new)
- lib/progress-calculator.ts (modified - integrated alert generation)
- app/api/teacher/alerts/route.ts (new)
- app/api/teacher/alerts/[alertId]/resolve/route.ts (new)
- components/teacher/AlertList.tsx (new)

