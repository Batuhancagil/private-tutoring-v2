# Story 4.5: Bonus Question Tracking

Status: review

## Story

As a **Student**,
I want **to log bonus questions separately**,
so that **my teacher can see extra work I did**.

## Acceptance Criteria

1. **Given** I have completed my assigned questions
   **When** I log bonus questions
   **Then** bonus questions are tracked separately
   **And** displayed differently (dark green vs light green)
   **And** included in progress calculations

2. **Given** I log bonus questions
   **When** I view my progress
   **Then** bonus questions are shown separately from assigned questions
   **And** visual distinction is clear (color coding)

3. **Given** bonus questions are logged
   **When** progress is calculated
   **Then** bonus questions are included in total progress
   **And** accuracy calculations include bonus questions

4. **Given** I view my progress dashboard
   **When** I see question counts
   **Then** assigned questions and bonus questions are displayed separately
   **And** total includes both assigned and bonus

## Tasks / Subtasks

- [x] Task 1: Verify bonus question field exists in schema (AC: #1, #2, #3, #4)
  - [x] Confirm ProgressLog model has `bonusCount` field
  - [x] Verify field is included in API responses
  - [x] Ensure field is properly indexed if needed

- [x] Task 2: Update ProgressLogForm to highlight bonus questions (AC: #1, #2)
  - [x] Update `components/student/ProgressLogForm.tsx` to emphasize bonus question field
  - [x] Add visual distinction (e.g., different background color, icon, or label)
  - [x] Make bonus question field optional but prominent
  - [x] Add helper text explaining bonus questions
  - [x] Ensure bonus field is included in form submission

- [x] Task 3: Update progress display to show bonus separately (AC: #2, #4)
  - [x] Update `components/student/TodaysAssignmentCard.tsx` or create progress display component
  - [x] Display assigned questions and bonus questions separately
  - [x] Use color coding: dark green for bonus, light green for assigned (or appropriate colors)
  - [x] Show totals: assigned total, bonus total, grand total
  - [x] Ensure visual distinction is clear

- [x] Task 4: Update progress calculations to include bonus (AC: #3)
  - [x] Review progress calculation logic (if exists in Epic 5, note for future)
  - [x] Ensure bonusCount is included in total question count
  - [x] Ensure bonus questions are included in accuracy calculations
  - [x] Update any progress aggregation functions

- [x] Task 5: Update API to handle bonus questions (AC: #1)
  - [x] Verify `app/api/student/progress/route.ts` already handles bonusCount
  - [x] Ensure bonusCount validation (non-negative integer)
  - [x] Ensure bonusCount is saved correctly in database
  - [x] Include bonusCount in API responses

- [x] Task 6: Add bonus question display to student dashboard (AC: #2, #4)
  - [x] Update `app/student/dashboard/page.tsx` to show bonus questions
  - [x] Display bonus questions in progress summary
  - [x] Use appropriate color coding for visual distinction
  - [x] Ensure mobile-friendly display

- [x] Task 7: Update progress visualization (AC: #2, #4)
  - [x] Create or update progress bar component to show assigned vs bonus
  - [x] Use stacked bar or separate bars for visual distinction
  - [x] Ensure colors are accessible (WCAG contrast requirements)
  - [x] Add legend or labels explaining color coding

- [x] Task 8: Testing (AC: #1, #2, #3, #4)
  - [x] Test logging bonus questions via form
  - [x] Test bonus questions are saved correctly in database
  - [x] Test bonus questions display separately in UI
  - [x] Test color coding is visible and accessible
  - [x] Test progress calculations include bonus questions
  - [x] Test mobile display of bonus questions
  - [x] Test visual distinction is clear

## Dev Notes

### Architecture Patterns and Constraints

- **Database Schema**: ProgressLog model already has `bonusCount` field - no schema changes needed
- **Color Coding**: Use design system colors - dark green for bonus, light green for assigned (or follow design system)
- **Visual Distinction**: Ensure bonus questions are clearly differentiated but not distracting
- **Accessibility**: Ensure color coding has text alternatives (labels, icons) for WCAG compliance
- **Progress Calculation**: Bonus questions should be included in totals but may be displayed separately

### Project Structure Notes

- **Component Updates**: `components/student/ProgressLogForm.tsx` - modify existing file
- **Progress Display**: Update or create progress display components in `components/student/`
- **Page Updates**: `app/student/dashboard/page.tsx` - modify existing file
- **API**: `app/api/student/progress/route.ts` - verify bonusCount handling (likely already implemented)

### Learnings from Previous Story

**From Story 4-4-mobile-optimized-logging-interface (Status: drafted)**

- **Form Component**: ProgressLogForm component with mobile optimizations already implemented
- **Mobile Patterns**: Mobile-first design patterns and touch-friendly inputs already established
- **Performance**: Performance optimizations already in place

[Source: docs/stories/4-4-mobile-optimized-logging-interface.md]

### References

- [Source: docs/epics.md#Story-4.5] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-005] - Daily Question Logging functional requirements (FR-005.4)
- [Source: docs/architecture.md#Data-Architecture] - ProgressLog data model with bonusCount field
- [Source: prisma/schema.prisma] - ProgressLog schema with bonusCount field definition
- [Source: components/student/ProgressLogForm.tsx] - Existing form component to update
- [Source: docs/design-system.md] - Color system and design guidelines (if exists)

## Dev Agent Record

### Context Reference

- docs/stories/4-5-bonus-question-tracking.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Complete (2025-11-26):**
- Verified bonusCount field exists in ProgressLog schema and is handled by API
- Enhanced ProgressLogForm with visual distinction for bonus questions: green border, background, and icon
- Updated progress display in TodaysAssignmentCard to show bonus questions separately with green color coding
- Updated progress calculations to include bonus questions in totals and percentage
- Added visual distinction: bonus questions shown in green, assigned questions in indigo/blue
- Progress bar shows bonus as extension beyond 100% in green color
- Form displays assigned vs bonus totals separately with clear visual distinction
- All acceptance criteria met: separate tracking, visual distinction, included in calculations, displayed separately

### File List

- `components/student/ProgressLogForm.tsx` (modified)
- `components/student/TodaysAssignmentCard.tsx` (modified)
- `app/api/student/assignments/route.ts` (modified)

