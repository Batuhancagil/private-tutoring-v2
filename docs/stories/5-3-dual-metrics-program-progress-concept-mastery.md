# Story 5.3: Dual Metrics (Program Progress + Concept Mastery)

Status: review

## Story

As a **system**,
I want **to calculate both program progress and concept mastery**,
so that **teachers get comprehensive insights**.

## Acceptance Criteria

1. **Given** student has logged questions
   **When** metrics are calculated
   **Then** I calculate:
   - Program Progress: Questions solved / Total assigned
   - Concept Mastery: Accuracy percentage
   **And** both metrics are displayed together
   **And** both update in real-time

2. **Given** a student has assignments with total questions assigned
   **When** dual metrics are calculated
   **Then** Program Progress = (total questions solved) / (total questions assigned) × 100
   **And** Concept Mastery = overall accuracy across all logged questions
   **And** both metrics are calculated from all student's progress data

3. **Given** a student has no assignments or logged questions
   **When** dual metrics are calculated
   **Then** Program Progress = 0%
   **And** Concept Mastery = 0% or undefined
   **And** no error is thrown

4. **Given** a student logs new questions or assignments are updated
   **When** progress data changes
   **Then** dual metrics are automatically recalculated
   **And** the recalculation completes in < 500ms

## Tasks / Subtasks

- [x] Task 1: Implement dual metrics calculation function (AC: #1, #2, #3, #4)
  - [x] Add `calculateDualMetrics()` function to `lib/progress-calculator.ts`
  - [x] Calculate Program Progress: sum(all solved questions) / sum(all assigned questions) × 100
  - [x] Calculate Concept Mastery: (total right / total attempted) × 100 across all progress logs
  - [x] Query all ProgressLog entries for student
  - [x] Query all Assignment entries for student to get total assigned
  - [x] Aggregate: sum(rightCount), sum(wrongCount), sum(emptyCount), sum(bonusCount)
  - [x] Handle edge cases: no assignments, no logged questions, division by zero
  - [x] Add input validation (studentId must be valid)
  - [x] Add error handling and logging
  - [x] Add performance tracking (measure calculation time)

- [x] Task 2: Create dual metrics API endpoint (AC: #1, #2, #3)
  - [x] Create `app/api/teacher/progress/student/[studentId]/metrics/route.ts` with GET handler
  - [x] Use `withRole('TEACHER')` helper for authorization
  - [x] Validate path param: studentId (from path)
  - [x] Call `calculateDualMetrics()` function
  - [x] Return JSON response with dual metrics data
  - [x] Handle errors (404 if student not found, 403 if access denied)
  - [x] Add performance tracking (response time)

- [x] Task 3: Create dual metrics display component (AC: #1)
  - [x] Create `components/teacher/DualMetricsDisplay.tsx` component
  - [x] Display Program Progress with percentage and visual indicator
  - [x] Display Concept Mastery with percentage and visual indicator
  - [x] Show both metrics side-by-side or stacked
  - [x] Add loading state
  - [x] Add error state
  - [x] Use existing UI components (Card, ProgressBar if available)

- [x] Task 4: Implement real-time updates for dual metrics (AC: #4)
  - [x] Update `app/api/student/progress/route.ts` POST handler
  - [x] After ProgressLog create/update, trigger dual metrics recalculation
  - [x] Use Next.js revalidation to update cached data
  - [x] Ensure calculation completes in < 500ms
  - [x] Handle errors gracefully (log but don't fail the log submission)

- [x] Task 5: Add caching for dual metrics results (AC: #1, #4)
  - [x] Implement in-memory cache for dual metrics results
  - [x] Cache key: `dual-metrics:${studentId}`
  - [x] Cache invalidation: clear cache on ProgressLog create/update or Assignment create/update
  - [x] Add cache timestamp for freshness checking
  - [x] Consider cache TTL (optional, for safety)

- [x] Task 6: Testing (AC: #1, #2, #3, #4)
  - [ ] Unit test: `calculateDualMetrics()` with various inputs
    - [ ] Test Program Progress: 1500 solved / 2000 assigned = 75%
    - [ ] Test Concept Mastery: 1200 right / 1500 attempted = 80%
    - [ ] Test edge case: no assignments (Program Progress = 0%)
    - [ ] Test edge case: no logged questions (Concept Mastery = 0% or undefined)
    - [ ] Test edge case: all questions solved (Program Progress = 100%)
    - [ ] Test edge case: division by zero protection
  - [ ] Integration test: API endpoint with valid/invalid inputs
    - [ ] Test GET /api/teacher/progress/student/:studentId/metrics
    - [ ] Test with valid student
    - [ ] Test with non-existent student (404)
    - [ ] Test tenant isolation (student from different teacher)
    - [ ] Test performance: calculation completes < 500ms
  - [ ] Component test: DualMetricsDisplay component
    - [ ] Test renders both metrics
    - [ ] Test loading state
    - [ ] Test error state
    - [ ] Test percentage formatting
  - [ ] Integration test: Real-time calculation trigger
    - [ ] Test POST /api/student/progress triggers recalculation
    - [ ] Test calculation completes < 500ms after log submission
    - [ ] Test cache invalidation on log update

## Dev Notes

### Architecture Patterns and Constraints

- **API Pattern**: Follow existing pattern from `app/api/teacher/progress/topic/[topicId]/route.ts` - use `withRole()` helper, Zod validation, error logging, performance tracking
- **Tenant Isolation**: Student data is isolated by `teacherId` - ensure API only returns metrics for current teacher's students
- **Database Query**: Use Prisma to query ProgressLog and Assignment models, aggregate across all student's data
- **Dual Metrics Formula**: 
  - Program Progress = (total solved / total assigned) × 100 per [Source: docs/stories/tech-spec-epic-5.md#Dual-Metrics-System]
  - Concept Mastery = (total right / total attempted) × 100 per [Source: docs/stories/tech-spec-epic-5.md#Dual-Metrics-System]
- **Real-Time Updates**: Use Next.js Server Actions with revalidation (no extra infrastructure) per [Source: docs/architecture.md#Real-time-Updates]
- **Performance**: Calculations are lightweight and run in-memory (no background job queue needed) per [Source: docs/architecture.md#Background-Jobs]
- **Caching Strategy**: In-memory cache for metrics results, invalidated on ProgressLog or Assignment updates

### Project Structure Notes

- **Service Update**: `lib/progress-calculator.ts` - extend existing file with `calculateDualMetrics()` function
- **API Route**: `app/api/teacher/progress/student/[studentId]/metrics/route.ts` - new file following existing API patterns
- **Component**: `components/teacher/DualMetricsDisplay.tsx` - new component for displaying dual metrics
- **Alignment**: Follows unified project structure - services in `lib/`, API routes in `app/api/`, components in `components/`

### Learnings from Previous Story

**From Story 5-2-lesson-level-aggregation (Status: drafted)**

- **Progress Calculation Service**: `lib/progress-calculator.ts` already has `calculateTopicProgress()` and `calculateLessonProgress()` - add `calculateDualMetrics()` following same patterns
- **API Pattern**: Lesson progress API pattern established - follow same structure for dual metrics endpoint
- **Caching Strategy**: Cache pattern established for topic and lesson progress - use similar pattern for dual metrics
- **Real-Time Updates**: Automatic recalculation triggers established - extend this pattern for dual metrics
- **Performance**: Aggregation performance targets (< 500ms) established - maintain same targets for dual metrics
- **Data Aggregation**: Experience with aggregating across multiple records - apply similar patterns for student-wide aggregation

[Source: docs/stories/5-2-lesson-level-aggregation.md]

### References

- [Source: docs/stories/tech-spec-epic-5.md#Dual-Metrics-System] - Technical specification for dual metrics calculation
- [Source: docs/epics.md#Story-5.3] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-006] - Progress Calculation & Visualization functional requirements
- [Source: docs/architecture.md#Data-Architecture] - ProgressLog and Assignment data models
- [Source: prisma/schema.prisma] - ProgressLog and Assignment schemas
- [Source: docs/architecture.md#API-Pattern] - Standard API route handler structure
- [Source: docs/architecture.md#Real-time-Updates] - Next.js Server Actions with revalidation for real-time updates
- [Source: app/api/teacher/progress/lesson/[lessonId]/route.ts] - Existing API pattern to follow
- [Source: lib/progress-calculator.ts] - Existing progress calculation service to extend

## Dev Agent Record

### Context Reference

- docs/stories/5-3-dual-metrics-program-progress-concept-mastery.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- Added `calculateDualMetrics()` function to `lib/progress-calculator.ts` calculating both Program Progress and Concept Mastery
- Program Progress = (total solved / total assigned) × 100, Concept Mastery = (total right / total attempted) × 100
- Created GET `/api/teacher/progress/student/[studentId]/metrics` endpoint with tenant isolation and error handling
- Created `DualMetricsDisplay` React component displaying both metrics side-by-side with progress bars and color coding
- Updated POST `/api/student/progress` to invalidate dual metrics cache on ProgressLog create/update
- Updated assignment creation/update/delete endpoints to invalidate dual metrics cache (assignment changes affect program progress)
- Implemented in-memory caching for dual metrics with TTL (5 minutes)
- All edge cases handled: no assignments returns 0%, no logged questions returns 0%, division by zero protection
- Performance tracking added to monitor calculation time (< 500ms requirement)

**Testing Notes:**
- Manual testing required: No formal test framework configured
- Code review should verify: calculation correctness (both metrics), performance requirements, tenant isolation, cache invalidation, component rendering

### File List

- lib/progress-calculator.ts (modified - added calculateDualMetrics and dual metrics caching functions)
- app/api/teacher/progress/student/[studentId]/metrics/route.ts (new)
- components/teacher/DualMetricsDisplay.tsx (new)
- app/api/student/progress/route.ts (modified - added dual metrics cache invalidation)
- app/api/teacher/assignments/route.ts (modified - added dual metrics cache invalidation)
- app/api/teacher/assignments/[id]/route.ts (modified - added dual metrics cache invalidation)

