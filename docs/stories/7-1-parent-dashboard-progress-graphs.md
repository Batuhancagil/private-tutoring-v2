# Story 7.1: Parent Dashboard & Progress Graphs

Status: review

## Story

As a **Parent**,
I want **to see my child's progress in graphs**,
so that **I can understand how they're doing**.

## Acceptance Criteria

1. **Given** I am logged in as a Parent
   **When** I view my child's progress
   **Then** I see:
   - Progress graphs (question counts, accuracy)
   - Trend lines over time
   - Visual indicators
   - Mobile-optimized display

2. **Given** I have multiple children
   **When** I view the parent dashboard
   **Then** I can select which child's progress to view
   **And** graphs update to show that child's data

3. **Given** my child has logged questions
   **When** I view progress graphs
   **Then** I see:
   - Question count graph showing daily progress
   - Accuracy trend graph showing performance over time
   - Both graphs are interactive and responsive
   - Data is displayed clearly on mobile devices

4. **Given** my child has no logged questions yet
   **When** I view the parent dashboard
   **Then** I see a message indicating no data available
   **And** graphs show empty state with helpful message

## Tasks / Subtasks

- [ ] Task 1: Create parent progress API endpoint (AC: #1, #2, #3, #4)
  - [ ] Create `app/api/parent/progress/route.ts` with GET handler
  - [ ] Use `withRole('PARENT')` helper for authorization
  - [ ] Query ProgressLog entries for parent's children (via ParentStudent relationship)
  - [ ] Aggregate progress data by date (question counts, accuracy)
  - [ ] Include topic-level breakdown if needed
  - [ ] Ensure tenant isolation (parent can only see their children's data)
  - [ ] Add error handling and logging
  - [ ] Add performance tracking

- [ ] Task 2: Create parent dashboard page (AC: #1, #2, #3, #4)
  - [ ] Create `app/parent/dashboard/page.tsx` with parent dashboard layout
  - [ ] Add child selector dropdown (if multiple children)
  - [ ] Fetch progress data from API
  - [ ] Display loading and error states
  - [ ] Handle empty state (no data available)
  - [ ] Ensure mobile-responsive layout

- [ ] Task 3: Create progress graph components (AC: #1, #3)
  - [ ] Create `components/parent/ProgressGraphs.tsx` component
  - [ ] Integrate charting library (e.g., recharts, chart.js)
  - [ ] Create question count graph (line chart showing daily totals)
  - [ ] Create accuracy trend graph (line chart showing accuracy over time)
  - [ ] Add interactive features (hover tooltips, zoom)
  - [ ] Ensure mobile responsiveness
  - [ ] Add accessibility features (ARIA labels, keyboard navigation)

- [ ] Task 4: Implement data aggregation for graphs (AC: #1, #3)
  - [ ] Aggregate ProgressLog entries by date
  - [ ] Calculate daily question totals (right + wrong + empty + bonus)
  - [ ] Calculate daily accuracy: (right / total) × 100
  - [ ] Handle date ranges (last 7 days, 30 days, all time)
  - [ ] Optimize queries for performance

- [ ] Task 5: Mobile optimization (AC: #1, #3)
  - [ ] Ensure graphs are touch-friendly
  - [ ] Optimize graph rendering for mobile screens
  - [ ] Test on various mobile devices
  - [ ] Ensure graphs load quickly (< 1s on mobile)

- [ ] Task 6: Testing (AC: #1, #2, #3, #4)
  - [ ] Test API endpoint with valid parent user
  - [ ] Test API endpoint with multiple children
  - [ ] Test API endpoint with no logged data
  - [ ] Test tenant isolation (parent cannot see other children)
  - [ ] Test graph rendering with various data sets
  - [ ] Test mobile responsiveness
  - [ ] Test accessibility (screen reader, keyboard navigation)

## Dev Notes

### Architecture Patterns and Constraints

- **API Pattern**: Follow existing pattern from `app/api/teacher/assignments/route.ts` - use `withRole()` helper, Zod validation, error logging, performance tracking
- **Tenant Isolation**: Parent data is isolated by ParentStudent relationship - ensure API only returns progress for parent's assigned children
- **Database Query**: Use Prisma to query ProgressLog with joins to Assignment, Student, and ParentStudent models
- **Chart Library**: Choose lightweight charting library (recharts recommended for React) per [Source: docs/architecture.md#Frontend-Libraries]
- **Mobile-First**: Parent portal is mobile-optimized per [Source: docs/architecture.md#Mobile-First]
- **Performance**: Graph data aggregation should complete in < 500ms per [Source: docs/architecture.md#Performance]

### Project Structure Notes

- **API Route**: `app/api/parent/progress/route.ts` - new file following existing API patterns
- **Page**: `app/parent/dashboard/page.tsx` - new file for parent dashboard
- **Component**: `components/parent/ProgressGraphs.tsx` - new file for graph components
- **Alignment**: Follows unified project structure - API routes in `app/api/`, pages in `app/parent/`, components in `components/parent/`

### Learnings from Previous Story

**From Story 6-5-customizable-accuracy-thresholds (Status: backlog)**

- **Progress Calculation**: Progress calculation services exist in `lib/progress-calculator.ts` - may need to extend for parent-specific queries
- **Dashboard Patterns**: Teacher dashboard patterns established - follow similar structure for parent dashboard
- **Data Access**: Parent-student relationship model exists - use ParentStudent model for data access control

[Source: docs/epics.md#Story-7.1]

### References

- [Source: docs/epics.md#Story-7.1] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-008] - Parent Portal functional requirements
- [Source: docs/architecture.md#Data-Architecture] - ParentStudent and ProgressLog data models
- [Source: prisma/schema.prisma] - ParentStudent and ProgressLog schema definitions
- [Source: docs/architecture.md#API-Pattern] - Standard API route handler structure
- [Source: app/api/teacher/assignments/route.ts] - Reference implementation for API pattern
- [Source: app/teacher/dashboard/page.tsx] - Reference implementation for dashboard layout

## Dev Agent Record

### Context Reference

- docs/stories/7-1-parent-dashboard-progress-graphs.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- Installed recharts library for charting
- Created GET `/api/parent/progress` endpoint with date range support and tenant isolation
- Created `ProgressGraphs` component with two charts: Daily Question Count (stacked bar) and Accuracy Trend (line)
- Created `ParentDashboardClient` component with child selector and progress data fetching
- Updated parent dashboard page to use new client component
- Features: Child selector for multiple children, date aggregation, accuracy calculation, empty states, loading/error handling
- Mobile-responsive: Charts use ResponsiveContainer, touch-friendly tooltips
- Performance: Optimized queries with proper date filtering

**Testing Notes:**
- Manual testing required: No formal test framework configured
- Code review should verify: tenant isolation, graph rendering, mobile responsiveness, date aggregation accuracy

### File List

- package.json (modified - added recharts dependency)
- app/api/parent/progress/route.ts (new)
- components/parent/ProgressGraphs.tsx (new)
- components/parent/ParentDashboardClient.tsx (new)
- app/parent/dashboard/page.tsx (modified - integrated ParentDashboardClient)

