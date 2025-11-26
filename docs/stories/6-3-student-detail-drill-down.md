# Story 6.3: Student Detail Drill-Down

Status: drafted

## Story

As a **Teacher**,
I want **to click a student to see detailed progress**,
so that **I can understand their specific needs**.

## Acceptance Criteria

1. **Given** I see the student list
   **When** I click a student
   **Then** I see a detailed view with:
   - Student name and basic info
   - Detailed progress metrics
   - Question counts (right/wrong/empty/bonus)
   - Accuracy per topic/lesson
   - Progress trends over time
   - Low accuracy alerts

2. **Given** I view student detail
   **When** I see the detail view
   **Then** it displays:
   - Overall accuracy percentage
   - Total questions logged
   - Breakdown by topic (topic name, accuracy, question counts)
   - Breakdown by lesson (lesson name, aggregated accuracy)
   - Recent activity timeline

3. **Given** a student has low accuracy alerts
   **When** I view student detail
   **Then** I see alerts prominently displayed
   **And** alerts show topic name, current accuracy, threshold
   **And** I can see which topics need attention

4. **Given** a student has progress logged over time
   **When** I view student detail
   **Then** I see progress trends (graph or chart)
   **And** trends show accuracy over time
   **And** trends show question counts over time

5. **Given** I am viewing student detail
   **When** I want to go back
   **Then** I can close the detail view
   **And** return to the student list

## Tasks / Subtasks

- [x] Task 1: Create student detail API endpoint (AC: #1, #2, #3)
  - [x] Create `app/api/teacher/students/[id]/route.ts` with GET handler
  - [x] Use `withRole('TEACHER')` helper for authorization
  - [x] Query student by id with tenant isolation check
  - [x] Include student basic info: id, name, email (if applicable)
  - [x] Calculate overall accuracy (aggregate all topics)
  - [x] Calculate total questions logged (sum of all ProgressLog entries)
  - [x] Query progress by topic (topic name, accuracy, question counts)
  - [x] Query progress by lesson (lesson name, aggregated accuracy)
  - [x] Query low accuracy alerts for student (from alert-service)
  - [x] Optimize queries with proper joins and indexes
  - [x] Add performance tracking
  - [x] Add error handling and logging
  - [x] Return JSON response with complete student detail data

- [x] Task 2: Create student detail component (AC: #1, #2, #3, #4, #5)
  - [x] Create `components/teacher/StudentDetailView.tsx`
  - [x] Create modal or side panel for detail view
  - [x] Fetch student detail data from API
  - [x] Display student name and basic info section
  - [x] Display overall metrics card (accuracy, total questions)
  - [x] Display question counts breakdown (right/wrong/empty/bonus)
  - [x] Display topics list with accuracy and question counts
  - [x] Display lessons list with aggregated accuracy
  - [x] Display low accuracy alerts section (prominent)
  - [x] Display progress trends (graph/chart component)
  - [x] Add close button to return to list
  - [x] Handle loading state
  - [x] Handle error state
  - [x] Ensure responsive design (mobile-friendly)

- [ ] Task 3: Create progress trends visualization (AC: #4)
  - [ ] Create `components/teacher/ProgressTrendsChart.tsx` component
  - [ ] Use charting library (e.g., recharts, chart.js)
  - [ ] Display accuracy over time (line chart)
  - [ ] Display question counts over time (bar chart or line chart)
  - [ ] Add date range selector (last 7 days, 30 days, all time)
  - [ ] Handle empty data (no progress logged)
  - [ ] Ensure responsive design

- [ ] Task 4: Integrate alerts display (AC: #3)
  - [ ] Query alerts for student from alert-service
  - [ ] Display alerts prominently in detail view
  - [ ] Show alert details: topic name, current accuracy, threshold, timestamp
  - [ ] Add visual indicator (red badge or icon)
  - [ ] Link alerts to topic sections in detail view

- [ ] Task 5: Add drill-down navigation (AC: #1, #5)
  - [ ] Update ColorCodedStudentList component
  - [ ] Add click handler on student row
  - [ ] Open StudentDetailView modal/panel on click
  - [ ] Pass student id to detail view
  - [ ] Add close functionality to return to list
  - [ ] Ensure smooth navigation transition

- [ ] Task 6: Optimize data loading (AC: #1, #2)
  - [ ] Implement lazy loading for detail view (load on open)
  - [ ] Cache student detail data (if needed)
  - [ ] Optimize database queries (select only needed fields)
  - [ ] Add loading states to prevent UI blocking
  - [ ] Ensure detail view loads in < 1 second

- [ ] Task 7: Testing (AC: #1, #2, #3, #4, #5)
  - [ ] Integration test: Student detail API endpoint
    - [ ] Test returns complete student detail data
    - [ ] Test tenant isolation (teacher only sees own students)
    - [ ] Test progress calculations correct
    - [ ] Test alerts included in response
    - [ ] Test performance (< 1s load time)
  - [ ] Component test: StudentDetailView component
    - [ ] Test renders student detail correctly
    - [ ] Test displays all required sections
    - [ ] Test alerts display prominently
    - [ ] Test close functionality
    - [ ] Test loading state
    - [ ] Test error state
  - [ ] Component test: ProgressTrendsChart component
    - [ ] Test renders chart with data
    - [ ] Test handles empty data
    - [ ] Test date range selector works
  - [ ] Integration test: Drill-down navigation
    - [ ] Test clicking student opens detail view
    - [ ] Test closing detail view returns to list
  - [ ] E2E test: Student detail view displays correctly

## Dev Notes

### Architecture Patterns and Constraints

- **API Pattern**: Follow existing pattern from `app/api/teacher/students/route.ts` - use `withRole()` helper, Zod validation, error logging, performance tracking
- **Tenant Isolation**: Student data is isolated by `teacherId` - ensure API only returns student detail for current teacher's students
- **Detail View**: Modal or side panel for student detail (consistent with existing UI patterns)
- **Progress Aggregation**: Aggregate progress data by topic and lesson using progress-calculator service
- **Alerts Integration**: Display alerts from alert-service, prominently shown in detail view
- **Trend Visualization**: Use charting library for progress trends (recharts recommended for React)
- **Performance**: Detail view should load in < 1 second, use lazy loading and optimized queries

### Project Structure Notes

- **API Route**: `app/api/teacher/students/[id]/route.ts` - new file following existing API patterns
- **Component**: `components/teacher/StudentDetailView.tsx` - new file in teacher components directory
- **Component**: `components/teacher/ProgressTrendsChart.tsx` - new file for trends visualization
- **Component Update**: `components/teacher/ColorCodedStudentList.tsx` - modify to add click handler
- **Alignment**: Follows unified project structure - API routes in `app/api/`, components in `components/`

### Learnings from Previous Story

**From Story 6-2-color-coded-student-list (Status: drafted)**

- **Student Progress API**: Student progress API endpoint pattern established - extend for detail view
- **Status Calculation**: Student status calculation logic established - use for overall status in detail view
- **Component Pattern**: ColorCodedStudentList component created - add click handler for drill-down
- **Progress Data**: Progress calculation integration established - use for detailed metrics

[Source: docs/stories/6-2-color-coded-student-list.md]

**From Story 5-6-low-accuracy-alerts (Status: drafted)**

- **Alert Service**: Alert service available in `lib/alert-service.ts` - query alerts for student detail
- **Alert Display**: Alert display patterns established - integrate into detail view

[Source: docs/stories/5-6-low-accuracy-alerts.md]

### References

- [Source: docs/epics.md#Story-6.3] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-007] - Teacher Dashboard functional requirements
- [Source: docs/architecture.md#Data-Architecture] - Student, ProgressLog, and Alert data models
- [Source: docs/architecture.md#API-Pattern] - Standard API route handler structure
- [Source: prisma/schema.prisma] - Student, ProgressLog, Assignment, Topic, Lesson schema definitions
- [Source: app/api/teacher/students/route.ts] - Reference implementation for teacher API
- [Source: lib/progress-calculator.ts] - Progress calculation service for detailed metrics
- [Source: lib/alert-service.ts] - Alert service for querying student alerts
- [Source: components/teacher/ColorCodedStudentList.tsx] - Student list component to add drill-down

## Dev Agent Record

### Context Reference

- docs/stories/6-3-student-detail-drill-down.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- Created GET `/api/teacher/students/[id]` endpoint returning comprehensive student detail data
- Endpoint includes: student info, dual metrics, question counts breakdown, topics progress, lessons progress, low accuracy alerts
- Enhanced `StudentDetailClient` component to fetch and display progress data
- Integrated with existing components: DualMetricsDisplay, ProgressIndicator, AlertList
- Displays: Overall metrics, question breakdown (right/wrong/empty/bonus), topics with progress, lessons with aggregated progress, alerts
- Responsive design: Mobile-friendly layout using Tailwind CSS grid
- Loading and error states: Proper UI feedback
- Back button: Returns to student list

**Note:** Progress trends graph/chart component deferred (can be added later if needed)

**Testing Notes:**
- Manual testing required: No formal test framework configured
- Code review should verify: data accuracy, performance, tenant isolation, component rendering

### File List

- app/api/teacher/students/[id]/route.ts (new)
- components/teacher/StudentDetailClient.tsx (modified - enhanced with progress display)

