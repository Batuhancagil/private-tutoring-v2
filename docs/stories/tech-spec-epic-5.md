# Epic Technical Specification: Progress Calculation & Visualization

Date: 2025-11-25
Author: BatuRUN
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 implements the core progress calculation and visualization system that enables the "instant visibility" magic moment for teachers. This epic transforms raw question logging data (from Epic 4) into actionable insights through real-time accuracy calculations, dual metrics (Program Progress and Concept Mastery), and visual indicators. The system calculates topic-level accuracy, aggregates to lesson-level metrics, and provides color-coded progress indicators that instantly communicate student status. This epic directly addresses FR-006 (Progress Calculation & Visualization) and is critical for delivering the core value proposition: replacing Excel analysis with instant visibility.

## Objectives and Scope

**In Scope:**
*   **Topic-Level Accuracy Calculation:** Calculate accuracy per topic using formula: (Right / (Right + Wrong + Empty)) × 100, updating in real-time (< 500ms) when students log questions.
*   **Lesson-Level Aggregation:** Aggregate topic metrics to lesson level (average accuracy, sum of question counts) with automatic updates.
*   **Dual Metrics System:** Calculate both Program Progress (questions solved / total assigned) and Concept Mastery (accuracy percentage) simultaneously.
*   **Color-Coded Progress Indicators:** Display visual status indicators (green = on track ≥ threshold, yellow = attention needed, red = struggling < threshold) with text alternatives for accessibility.
*   **Progress Bars & Percentages:** Visual progress bars and percentage indicators with responsive design for mobile devices.
*   **Low Accuracy Alerts:** Generate alerts when student accuracy falls below customizable threshold (default 70%) visible to teachers and parents.
*   **Real-Time Updates:** All calculations update automatically when ProgressLog entries are created or updated.

**Out of Scope:**
*   **Historical Trend Analysis:** Trend graphs and historical data visualization (covered in Epic 7 - Parent Portal).
*   **Advanced Analytics:** Predictive analytics, learning curves, or AI-powered insights (deferred to future).
*   **Notification System:** Email or SMS notifications for alerts (deferred to v2).
*   **Dashboard Layout:** Teacher dashboard layout and student list display (covered in Epic 6).
*   **Custom Threshold Configuration UI:** UI for teachers to customize thresholds (covered in Epic 6).

## System Architecture Alignment

This epic implements the "Progress Calculation & Visualization" components defined in the [Architecture](./architecture.md). Specifically:
*   **Real-Time Updates:** Uses Next.js Server Actions with revalidation (no extra infrastructure) as defined in ADR-007.
*   **Performance:** Calculations are lightweight and run in-memory (no background job queue needed) per ADR-008.
*   **API Pattern:** Follows standard `app/api/*` route handler structure with Zod validation and tenant isolation.
*   **Data Model:** Uses existing `ProgressLog` model with `rightCount`, `wrongCount`, `emptyCount`, `bonusCount` fields from Epic 4.
*   **Multi-Tenancy:** All calculations respect tenant isolation via `teacherId` foreign key pattern (ADR-005).
*   **Caching Strategy:** Calculation results can be cached in-memory or database for performance optimization.

## Detailed Design

### Services and Modules

| Module/Service | Responsibility | Inputs | Outputs | Owner |
| :--- | :--- | :--- | :--- | :--- |
| **Progress Calculation Service** (`lib/progress-calculator.ts`) | Calculates topic-level accuracy, lesson-level aggregation, and dual metrics. | ProgressLog data, Assignment data | Accuracy percentages, progress metrics | Backend |
| **Progress API** (`app/api/teacher/progress/*`) | Endpoints for retrieving calculated progress metrics. | Student ID, Topic ID, Lesson ID | JSON with accuracy, progress, metrics | Backend |
| **Progress Visualization Components** (`components/teacher/ProgressIndicator.tsx`, `components/teacher/ProgressBar.tsx`) | Displays color-coded indicators, progress bars, and percentage displays. | Progress metrics, threshold config | Rendered UI components | Frontend |
| **Alert Service** (`lib/alert-service.ts`) | Generates and stores low accuracy alerts. | Student accuracy, threshold | Alert records | Backend |
| **Alert API** (`app/api/teacher/alerts/route.ts`) | Endpoints for retrieving and managing alerts. | Teacher ID, Student ID | Alert list JSON | Backend |

### Data Models and Contracts

**Progress Calculation Result (In-Memory):**
```typescript
interface TopicProgress {
  topicId: string;
  topicName: string;
  accuracy: number; // 0-100 percentage
  totalQuestions: number; // right + wrong + empty + bonus
  rightCount: number;
  wrongCount: number;
  emptyCount: number;
  bonusCount: number;
  lastUpdated: Date;
}

interface LessonProgress {
  lessonId: string;
  lessonName: string;
  accuracy: number; // Average of topic accuracies
  totalQuestions: number; // Sum of topic question counts
  topicCount: number;
  topics: TopicProgress[];
  lastUpdated: Date;
}

interface DualMetrics {
  programProgress: number; // Questions solved / Total assigned (0-100)
  conceptMastery: number; // Accuracy percentage (0-100)
  totalSolved: number;
  totalAssigned: number;
}
```

**Alert Model (Potential Database Addition):**
```prisma
model AccuracyAlert {
  id        String   @id @default(cuid())
  studentId String
  topicId   String?
  lessonId  String?
  accuracy  Float    // Current accuracy that triggered alert
  threshold Float    // Threshold that was breached
  createdAt DateTime @default(now())
  resolved  Boolean  @default(false)
  resolvedAt DateTime?

  student User  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  topic   Topic? @relation(fields: [topicId], references: [id])
  lesson  Lesson? @relation(fields: [lessonId], references: [id])

  @@index([studentId])
  @@index([topicId])
  @@index([lessonId])
  @@index([resolved])
}
```

**Note:** Alert model may be deferred to Epic 6 if alerts are calculated on-the-fly initially.

### APIs and Interfaces

**1. Get Topic Progress (`GET /api/teacher/progress/topic/:topicId`)**
*   **Request:** Query params: `studentId` (required)
*   **Response (200):** 
```json
{
  "topicId": "string",
  "topicName": "string",
  "accuracy": 85.5,
  "totalQuestions": 450,
  "rightCount": 300,
  "wrongCount": 100,
  "emptyCount": 50,
  "bonusCount": 0,
  "lastUpdated": "2025-11-25T10:00:00Z"
}
```
*   **Response (404):** `{ "error": "Topic not found" }`
*   **Response (403):** `{ "error": "Access denied" }` (tenant isolation check)

**2. Get Lesson Progress (`GET /api/teacher/progress/lesson/:lessonId`)**
*   **Request:** Query params: `studentId` (required)
*   **Response (200):** 
```json
{
  "lessonId": "string",
  "lessonName": "string",
  "accuracy": 82.3,
  "totalQuestions": 1200,
  "topicCount": 3,
  "topics": [/* TopicProgress[] */],
  "lastUpdated": "2025-11-25T10:00:00Z"
}
```

**3. Get Dual Metrics (`GET /api/teacher/progress/student/:studentId/metrics`)**
*   **Request:** None (studentId in path)
*   **Response (200):** 
```json
{
  "programProgress": 75.5,
  "conceptMastery": 82.3,
  "totalSolved": 1510,
  "totalAssigned": 2000,
  "lastUpdated": "2025-11-25T10:00:00Z"
}
```

**4. Get Low Accuracy Alerts (`GET /api/teacher/alerts`)**
*   **Request:** Query params: `studentId?` (optional filter)
*   **Response (200):** 
```json
{
  "alerts": [
    {
      "id": "string",
      "studentId": "string",
      "studentName": "string",
      "topicId": "string",
      "topicName": "string",
      "accuracy": 65.5,
      "threshold": 70.0,
      "createdAt": "2025-11-25T10:00:00Z"
    }
  ]
}
```

**5. Calculate Progress (Internal/Server Action)**
*   **Trigger:** Automatically called when ProgressLog is created/updated
*   **Function:** `calculateTopicProgress(studentId: string, topicId: string): Promise<TopicProgress>`
*   **Function:** `calculateLessonProgress(studentId: string, lessonId: string): Promise<LessonProgress>`
*   **Function:** `calculateDualMetrics(studentId: string): Promise<DualMetrics>`

### Workflows and Sequencing

**Progress Calculation Flow:**
1. Student logs questions via `POST /api/student/progress` (Epic 4)
2. ProgressLog record created/updated in database
3. Server Action triggers progress recalculation:
   - Query all ProgressLog entries for student + topic
   - Sum: rightCount, wrongCount, emptyCount, bonusCount
   - Calculate accuracy: (rightCount / (rightCount + wrongCount + emptyCount + bonusCount)) × 100
   - Store result (in-memory cache or database)
4. If accuracy < threshold, generate alert
5. Revalidate relevant API routes for real-time updates
6. Frontend components automatically refresh via Next.js revalidation

**Lesson Aggregation Flow:**
1. Topic progress calculated (see above)
2. Query all topics for lesson
3. Calculate lesson accuracy: average of topic accuracies (simple average, not weighted)
4. Calculate lesson progress: sum of topic question counts
5. Store aggregated result
6. Update UI components

**Alert Generation Flow:**
1. After topic progress calculation
2. Compare accuracy to threshold (default 70%, customizable per teacher)
3. If accuracy < threshold:
   - Check if alert already exists (not resolved)
   - If not exists, create AccuracyAlert record
   - Include student, topic, accuracy, threshold, timestamp
4. Alert visible in teacher dashboard (Epic 6) and parent portal (Epic 7)

## Non-Functional Requirements

### Performance

*   **Calculation Latency:** Topic-level accuracy calculation must complete in < 500ms from ProgressLog update (FR-006.5).
*   **API Response Time:** Progress API endpoints must respond in < 200ms for cached results, < 500ms for calculated results.
*   **Real-Time Updates:** Progress calculations update automatically within 500ms of ProgressLog creation/update.
*   **Caching Strategy:** Calculation results cached in-memory (or database) to avoid redundant calculations. Cache invalidated on ProgressLog updates.
*   **Database Optimization:** Use indexed queries on `ProgressLog.studentId`, `ProgressLog.assignmentId`, `ProgressLog.date` for efficient aggregation.

### Security

*   **Tenant Isolation:** All progress calculations respect `teacherId` isolation - teachers can only see progress for their own students.
*   **Authorization:** Progress API endpoints use `withRole('TEACHER')` helper to ensure only teachers can access progress data.
*   **Data Validation:** All API inputs validated with Zod schemas to prevent injection attacks.
*   **Access Control:** Students can only view their own progress; teachers can view all their students' progress; parents can view their children's progress.

### Reliability/Availability

*   **Calculation Accuracy:** Accuracy calculations must be mathematically correct - validated through unit tests with edge cases (zero questions, all wrong, all right, etc.).
*   **Error Handling:** If calculation fails, return cached result if available, otherwise return error response.
*   **Graceful Degradation:** If real-time calculation fails, fall back to last known good value with timestamp indicator.
*   **Data Consistency:** Progress calculations must be consistent - same input data produces same output.

### Observability

*   **Logging:** Log calculation operations with context: `[ProgressCalculation] Topic accuracy calculated for student: {studentId}, topic: {topicId}, accuracy: {accuracy}`
*   **Performance Monitoring:** Track calculation latency and cache hit rates.
*   **Error Tracking:** Log calculation errors with full context (studentId, topicId, error message, stack trace).
*   **Metrics:** Track number of calculations per minute, average calculation time, cache hit rate.

## Dependencies and Integrations

**Internal Dependencies:**
*   **Epic 4 (Daily Question Logging):** Requires `ProgressLog` model with `rightCount`, `wrongCount`, `emptyCount`, `bonusCount` fields.
*   **Epic 2 (User & Resource Management):** Requires `Assignment`, `Topic`, `Lesson` models for progress aggregation.
*   **Epic 1 (Foundation):** Requires authentication/authorization system (`withRole()` helper, tenant isolation).

**External Dependencies:**
*   **Next.js 14:** Server Actions and revalidation for real-time updates.
*   **Prisma 5.19.0:** Database queries and aggregation.
*   **Zod 3.23.8:** API input validation.

**Future Integrations:**
*   **Epic 6 (Teacher Dashboard):** Will consume progress APIs to display visualizations.
*   **Epic 7 (Parent Portal):** Will consume progress APIs for parent-facing views.

## Acceptance Criteria (Authoritative)

1. **Topic-Level Accuracy Calculation (Story 5.1):**
   - Given a student has logged questions for a topic
   - When progress is calculated
   - Then accuracy = (Right / (Right + Wrong + Empty + Bonus)) × 100
   - And the calculation updates in real-time (< 500ms)
   - And results are stored for quick retrieval

2. **Lesson-Level Aggregation (Story 5.2):**
   - Given topics have calculated accuracies
   - When lesson progress is calculated
   - Then lesson accuracy = average of topic accuracies
   - And lesson progress = sum of topic question counts
   - And aggregation updates automatically

3. **Dual Metrics Calculation (Story 5.3):**
   - Given student has logged questions
   - When metrics are calculated
   - Then Program Progress = Questions solved / Total assigned
   - And Concept Mastery = Accuracy percentage
   - And both metrics are displayed together
   - And both update in real-time

4. **Color-Coded Progress Indicators (Story 5.4):**
   - Given progress is calculated
   - When indicators are displayed
   - Then colors represent: Green (accuracy ≥ threshold), Yellow (near threshold), Red (accuracy < threshold)
   - And colors have text alternatives (accessibility)
   - And threshold is customizable (default 70%)

5. **Progress Bars & Percentages (Story 5.5):**
   - Given progress is calculated
   - When I view progress
   - Then I see progress bars showing completion
   - And percentage indicators
   - And clear visual representation
   - And responsive design (mobile-friendly)

6. **Low Accuracy Alerts (Story 5.6):**
   - Given a student's accuracy falls below threshold
   - When progress is calculated
   - Then a low accuracy alert is generated
   - And alert is visible to teacher
   - And alert is visible to parent
   - And threshold is customizable (default 70%)

## Traceability Mapping

| AC | Spec Section | Component/API | Test Idea |
| :--- | :--- | :--- | :--- |
| AC-1 | Topic-Level Accuracy Calculation | `lib/progress-calculator.ts::calculateTopicProgress()` | Unit test: accuracy = (300 / (300+100+50+0)) × 100 = 66.67% |
| AC-1 | Real-Time Updates | `app/api/student/progress/route.ts` (POST handler) | Integration test: POST progress log → verify calculation completes < 500ms |
| AC-2 | Lesson Aggregation | `lib/progress-calculator.ts::calculateLessonProgress()` | Unit test: lesson accuracy = average([80, 85, 90]) = 85% |
| AC-3 | Dual Metrics | `lib/progress-calculator.ts::calculateDualMetrics()` | Unit test: programProgress = 1500/2000 = 75%, conceptMastery = 82% |
| AC-4 | Color Coding | `components/teacher/ProgressIndicator.tsx` | Component test: accuracy 75% (≥70%) → green, accuracy 65% (<70%) → red |
| AC-4 | Accessibility | `components/teacher/ProgressIndicator.tsx` | Accessibility test: color indicators have aria-labels |
| AC-5 | Progress Bars | `components/teacher/ProgressBar.tsx` | Component test: progress 75% → bar width 75%, displays "75%" |
| AC-6 | Alert Generation | `lib/alert-service.ts::checkAndGenerateAlert()` | Unit test: accuracy 65% < threshold 70% → alert created |
| AC-6 | Alert API | `app/api/teacher/alerts/route.ts` | Integration test: GET /api/teacher/alerts → returns alerts for teacher's students |

## Risks, Assumptions, Open Questions

**Risks:**
*   **Performance Risk:** Real-time calculation (< 500ms) may be challenging with large datasets (many ProgressLog entries). **Mitigation:** Implement caching, optimize database queries with indexes, consider pagination for very large datasets.
*   **Calculation Accuracy Risk:** Edge cases (zero questions, division by zero) may cause errors. **Mitigation:** Comprehensive unit tests covering all edge cases, validation before calculation.
*   **Cache Invalidation Risk:** Stale cache may show incorrect progress. **Mitigation:** Invalidate cache on every ProgressLog update, use timestamp-based cache validation.

**Assumptions:**
*   Progress calculations are lightweight enough to run in-memory (no background job queue needed).
*   Teachers will have reasonable number of students (< 100) and topics (< 50 per lesson) for acceptable performance.
*   Default threshold of 70% is acceptable for MVP; customization can be added in Epic 6.

**Open Questions:**
*   Should accuracy calculation include bonus questions in denominator? **Decision:** Yes, include bonus in total for accuracy calculation (FR-006.2 specifies Right / (Right + Wrong + Empty)).
*   Should lesson aggregation use weighted average (by question count) or simple average? **Decision:** Simple average for MVP (can be enhanced later).
*   Should alerts be stored in database or calculated on-the-fly? **Decision:** Store in database for Epic 6 dashboard, but can start with on-the-fly calculation.

## Test Strategy Summary

**Unit Tests:**
*   `lib/progress-calculator.ts`: Test accuracy calculation with various inputs (all right, all wrong, mixed, zero questions, edge cases).
*   `lib/progress-calculator.ts`: Test lesson aggregation (simple average, sum of questions).
*   `lib/progress-calculator.ts`: Test dual metrics calculation (program progress, concept mastery).
*   `lib/alert-service.ts`: Test alert generation logic (threshold comparison, duplicate prevention).

**Integration Tests:**
*   `app/api/teacher/progress/topic/:topicId`: Test API endpoint with valid/invalid inputs, tenant isolation.
*   `app/api/teacher/progress/lesson/:lessonId`: Test lesson aggregation API.
*   `app/api/teacher/progress/student/:studentId/metrics`: Test dual metrics API.
*   `app/api/teacher/alerts`: Test alert retrieval API.

**Component Tests:**
*   `components/teacher/ProgressIndicator.tsx`: Test color coding logic, accessibility attributes.
*   `components/teacher/ProgressBar.tsx`: Test progress bar rendering, percentage display, responsive design.

**Performance Tests:**
*   Measure calculation latency: target < 500ms for topic-level calculation.
*   Measure API response time: target < 200ms for cached, < 500ms for calculated.
*   Load test with multiple concurrent progress log updates.

**Edge Cases:**
*   Zero questions logged (accuracy = 0 or undefined?).
*   All questions wrong (accuracy = 0%).
*   All questions right (accuracy = 100%).
*   Division by zero protection.
*   Missing ProgressLog entries (no data for topic).
*   Multiple assignments for same topic.

