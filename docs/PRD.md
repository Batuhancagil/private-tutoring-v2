# Private Tutoring Dashboard Platform - Product Requirements Document

**Author:** BatuRUN
**Date:** 2025-11-14
**Version:** 1.0

---

## Executive Summary

A private tutoring dashboard platform that replaces Excel-based student progress tracking with intelligent daily question logging and visual timeline-based assignment management. The platform enables teachers to track every question students solve (right/wrong/empty), monitor daily progress, and manage assignments through an adaptive timeline system - solving a critical pain point for private tutors who currently struggle with manual Excel tracking.

**Vision Alignment:** Transform the daily grind of Excel spreadsheet management into instant, visual progress insights. Teachers see at a glance which students need help, students understand their progress clearly, and parents finally have real-time visibility into their child's learning journey.

### What Makes This Special

**The Product Magic:** Instant visibility replaces manual analysis. The moment a teacher opens their dashboard, they immediately see which students are struggling (red indicators), which are on track (green progress), and exactly where each student is in their learning journey - all without opening Excel or doing manual calculations. This is the "wow" moment: replacing hours of spreadsheet work with a single glance.

**Core Differentiators:**
1. **Daily Granularity:** Track every question, every day - not just weekly or session-based
2. **Question-Level Metrics:** Right/wrong/empty tracking provides actionable insights
3. **Visual Timeline:** Jira/Notion-style timeline vs. basic calendars - see assignment flow over time
4. **Adaptive Intelligence:** Timeline auto-adjusts while maintaining teacher control
5. **Intuitive Design:** Easy-to-use screens that require no training

---

## Project Classification

**Technical Type:** SaaS B2B (Web Application)
**Domain:** EdTech (Education Technology)
**Complexity:** Medium

**Project Classification Details:**

This is a **SaaS B2B web application** in the **EdTech domain** with **medium complexity**. The platform serves private tutoring businesses (B2B) with a multi-tenant architecture supporting multiple teachers, students, and parents. The domain complexity is medium due to:

- **Educational Privacy Requirements:** Student data privacy (COPPA/FERPA considerations)
- **Multi-User Role System:** Complex permission matrix (Superadmin, Teacher, Student, Parent)
- **Timeline/Calendar System:** Sophisticated assignment scheduling and adaptive timeline logic
- **Progress Calculation:** Dual metrics (program progress + concept mastery) with real-time updates

**Key Technical Characteristics:**
- Web application (primary platform)
- Mobile-responsive (critical for students/parents)
- Desktop-optimized (for teachers)
- Multi-tenant SaaS architecture
- Real-time progress tracking

---

## Success Criteria

**What Winning Looks Like:**

**For Early Adopters (Friend & Network):**
1. **Ease of Use:** Intuitive screens, easy navigation, no training needed - teachers can use it immediately
2. **Progress Visibility:** Teachers can easily see student progress at a glance - instant insights replace manual Excel analysis
3. **Time Savings:** Some time saved vs. Excel tracking (even 30 minutes/week is meaningful) - measurable efficiency gain
4. **Easy Tracking:** Simple, fast daily logging for students - frictionless data entry
5. **Friend Recommendation:** Friend would recommend to other tutors - organic growth signal

**For Broader Market:**
1. **Teacher Adoption:** Growing number of teachers actively using the platform - sustainable growth
2. **Time Savings:** Measurable time reduction vs. Excel tracking - ROI demonstration
3. **Student Engagement:** High percentage of students logging daily - product stickiness
4. **Parent Satisfaction:** Parents report better visibility into child's progress - value delivery
5. **Core Workflow:** Complete workflow from assignment creation → student logging → progress tracking works smoothly - product maturity

**Success Means:** Teachers experience the "instant visibility" magic moment and save meaningful time, students engage daily with easy logging, and parents finally understand their child's progress - all replacing the Excel tracking pain point.

### Business Metrics

**Early Stage (MVP):**
- 10+ active teachers within 3 months
- 80%+ daily student logging rate
- 2+ hours/week time savings per teacher
- Friend recommendation rate: 80%+

**Growth Stage (v1.5+):**
- Teacher retention: 90%+ monthly active
- Student engagement: 85%+ daily logging
- Time savings: 3+ hours/week per teacher
- Net Promoter Score: 50+

---

## Product Scope

### MVP - Minimum Viable Product

**MVP Focus:** Time Savings + Visibility (Core Priorities)

**Core Features:**

1. **Multi-User Role System**
   - Superadmin: Subscription management, teacher/student CRUD
   - Teacher: Student management, resource creation, assignment system
   - Student: Daily logging, progress viewing
   - Parent: Progress visibility, teacher communication

2. **Timeline/Calendar Assignment System**
   - Visual timeline (Jira/Notion-style) for topic scheduling
   - Calendar view with weekly detail expansion (Google Calendar-style)
   - Flexible timeline adjustments
   - Past topic access for question adjustments

3. **Daily Question Logging**
   - Students log right/wrong/empty question counts daily
   - Retroactive logging (catch-up from illness/excuses)
   - Bonus question tracking (dark green vs light green)
   - Mobile-optimized logging interface

4. **Progress Calculation & Visualization**
   - Dual metrics: Program progress + concept mastery
   - Topic-level accuracy calculations
   - Lesson-level aggregation
   - Visual progress indicators (color coding: green progress, red alerts)

5. **Teacher Dashboard**
   - Student management (inline editing, list view)
   - Resource management (pre-built library + teacher-created question banks)
   - Progress monitoring (question counts, accuracy metrics)
   - Low accuracy alerts (red indicators, customizable thresholds)

6. **Parent Portal** (Basic - Enhanced in v1.5)
   - Progress graphs and tables
   - Historical data access
   - Low accuracy alerts
   - Teacher notes viewing

7. **Subscription Management**
   - Cash-based initially (manual entry)
   - Duration tracking
   - Subscription expiration warnings

8. **Communication** (Basic - Enhanced in v1.5)
   - Simple notes (parent → teacher)
   - In-page chat (teacher ↔ student)

9. **Mobile-Responsive Design**
   - Mobile-first for students/parents
   - Desktop for teachers
   - Responsive calendar/timeline views

**MVP Success Criteria:**
- Complete workflow: Assignment creation → Student logging → Progress tracking → Parent visibility
- Time savings: 30+ minutes/week per teacher
- Instant visibility: Teachers see progress at a glance
- Easy logging: Students can log daily work in < 2 minutes

### Growth Features (Post-MVP)

**Phase 1.5 (Enhancement):**
- Enhanced parent communication features
- Improved parent portal with more detailed insights
- Better parent-teacher collaboration tools
- Bulk import and templates for teachers
- Advanced progress analytics

**Phase 2 (v2):**
- AI chatbot (24/7, teacher-visible Q&A)
- AI-suggested assignments (teacher-approved)
- Marketplace for resources + ebooks
- Advanced analytics and predictive insights
- Gamification elements
- Online payment integration (Turkish market)
- SMS notifications

### Vision (Future)

**Phase 3 (v3+):**
- AI-powered student path recommendations
- Predictive analytics (identify struggling students early)
- Multi-language support
- White-label platform option
- Advanced adaptive timeline with ML
- Photo sharing and online tutoring sessions
- Integration with educational platforms

---

## Domain-Specific Requirements

**EdTech Domain Considerations:**

This platform operates in the **Education Technology (EdTech)** domain, which requires attention to:

1. **Student Privacy & Data Protection:**
   - Student data privacy compliance (COPPA/FERPA considerations)
   - Parental consent for student accounts
   - Student-controlled visibility settings
   - Secure data storage and transmission
   - Data retention policies

2. **Educational Standards:**
   - Progress tracking aligned with educational best practices
   - Dual metrics: Program progress (completion) + Concept mastery (understanding)
   - Topic-level and lesson-level aggregation for meaningful insights

3. **Accessibility:**
   - WCAG compliance for students with disabilities
   - Mobile-first design for easy access
   - Clear, intuitive interfaces for all age groups

4. **Multi-Stakeholder System:**
   - Teacher-student-parent communication needs
   - Different permission levels and visibility controls
   - Student privacy while maintaining parent visibility

**These domain considerations shape all functional and non-functional requirements below.**

---

## SaaS B2B Specific Requirements

### Multi-Tenancy Architecture

**Tenant Model:**
- **Tenant = Teacher Account:** Each teacher operates as an independent tenant
- **Data Isolation:** Complete data isolation between teachers (students, assignments, progress)
- **Superadmin Overhead:** Superadmin can view all tenants for management purposes
- **Scalability:** Architecture supports 1000+ teachers (10,000+ students)

**Tenant Management:**
- Teacher account creation and management
- Subscription-based access control
- Tenant-level settings and configurations
- Data export/import per tenant

### Permissions & Roles

**Role Matrix:**

| Feature | Superadmin | Teacher | Student | Parent |
|---------|-----------|---------|---------|--------|
| **View All Teachers** | ✅ | ❌ | ❌ | ❌ |
| **Manage Subscriptions** | ✅ | ❌ | ❌ | ❌ |
| **Create/Edit Students** | ✅ | ✅ (own) | ❌ | ❌ |
| **Create Assignments** | ❌ | ✅ | ❌ | ❌ |
| **View Timeline** | ✅ (all) | ✅ (own) | ✅ (own) | ✅ (child) |
| **Log Daily Progress** | ❌ | ❌ | ✅ (own) | ❌ |
| **View Progress** | ✅ (all) | ✅ (own students) | ✅ (own) | ✅ (child) |
| **View Parent Portal** | ❌ | ❌ | ❌ | ✅ (child) |
| **Send Messages** | ✅ (all) | ✅ (students/parents) | ✅ (teacher) | ✅ (teacher) |

**Permission Details:**
- **Superadmin:** Full system access, can view any teacher's dashboard, manage subscriptions
- **Teacher:** Full control over own students, assignments, and progress tracking
- **Student:** Can log daily progress, view own timeline and progress, message teacher
- **Parent:** Can view child's progress, receive alerts, message teacher (read-only for child data)

### Subscription Tiers

**v1 (MVP):**
- Single tier: Duration-based subscription
- Cash payments (manual entry by superadmin)
- Subscription expiration warnings

**v2 (Future):**
- Multiple tiers based on student count
- Online payment integration
- Automatic renewal

### Platform Support

**Web Application:**
- **Primary Platform:** Web browser (Chrome, Firefox, Safari, Edge)
- **Mobile-Responsive:** Critical for students/parents
- **Desktop-Optimized:** For teachers (primary use case)
- **Browser Support:** Latest 2 versions of major browsers

**Responsive Design:**
- Mobile-first for students/parents (daily logging, progress viewing)
- Desktop-optimized for teachers (dashboard, timeline management)
- Tablet support for all roles

---

## User Experience Principles

**Visual Personality:**
- **Clean & Professional:** Educational, trustworthy, not distracting
- **Color-Coded Progress:** Green (on track), Yellow (attention), Red (struggling)
- **Intuitive Navigation:** No training needed - teachers can use immediately
- **Mobile-Friendly:** Fast, simple daily logging for students

**Key Interaction Patterns:**

1. **Instant Visibility:**
   - Dashboard loads with immediate progress indicators
   - Color-coded student list (green/yellow/red)
   - One-click drill-down to student details

2. **Quick Daily Logging:**
   - Mobile-optimized form (< 2 minutes to log)
   - Pre-filled defaults (yesterday's topic)
   - Retroactive logging for missed days

3. **Visual Timeline:**
   - Jira/Notion-style timeline view
   - Drag-and-drop adjustments
   - Google Calendar-style weekly expansion

4. **Progress Tracking:**
   - Real-time updates (no refresh needed)
   - Visual indicators (progress bars, color coding)
   - Drill-down from lesson → topic → question level

**Critical User Flows:**

1. **Teacher Creates Assignment:**
   - Select student → Choose topic → Set question count → Timeline auto-adjusts → Done

2. **Student Logs Daily Work:**
   - Open app → See today's topic → Enter right/wrong/empty → Submit → < 2 minutes

3. **Teacher Views Progress:**
   - Open dashboard → See color-coded list → Click student → See detailed progress → Identify weak areas

4. **Parent Views Child Progress:**
   - Open app → See child's progress → View graphs → See teacher notes → Message teacher if needed

**The UI should reinforce the "instant visibility" magic through:**
- Immediate visual feedback (color coding, progress bars)
- Minimal clicks to key information
- Clear hierarchy (most important info first)
- Familiar patterns (Jira timeline, Google Calendar)

---

## Functional Requirements

**Organization:** Requirements are organized by capability area (not by technology stack) to focus on user value and business outcomes.

---

### FR-001: User Authentication & Authorization

**FR-001.1:** The system shall support four distinct user roles: Superadmin, Teacher, Student, and Parent.

**FR-001.2:** The system shall provide secure authentication for all user roles (username/password minimum, with future OAuth support).

**FR-001.3:** The system shall enforce role-based access control according to the permission matrix defined in SaaS B2B Requirements.

**FR-001.4:** The system shall support session management with secure session tokens and automatic timeout.

**FR-001.5:** The system shall allow Superadmin to create and manage Teacher accounts.

**FR-001.6:** The system shall allow Teachers to create Student and Parent accounts for their students.

**Acceptance Criteria:**
- Users can log in with username/password
- Role-based permissions are enforced at all endpoints
- Superadmin can create teacher accounts
- Teachers can create student/parent accounts
- Session expires after 24 hours of inactivity

---

### FR-002: Student Management

**FR-002.1:** The system shall allow Teachers to create, edit, and delete Student accounts.

**FR-002.2:** The system shall allow Teachers to view a list of all their students with inline editing capabilities.

**FR-002.3:** The system shall allow Teachers to assign Students to Parents (one student can have multiple parents).

**FR-002.4:** The system shall allow Superadmin to view all students across all teachers.

**FR-002.5:** The system shall display student information including name, assigned teacher, parent(s), and subscription status.

**Acceptance Criteria:**
- Teachers can create student accounts with name and basic info
- Teachers can edit student information inline in list view
- Teachers can assign parents to students
- Superadmin can view all students with teacher filter
- Student list displays with color-coded progress indicators

---

### FR-003: Resource Management

**FR-003.1:** The system shall allow Teachers to create and manage Resources (books, question banks, topics).

**FR-003.2:** The system shall support hierarchical structure: Lessons → Topics → Resources.

**FR-003.3:** The system shall provide a pre-built resource library that Superadmin can populate.

**FR-003.4:** The system shall allow Teachers to create custom Resources and assign them to Topics.

**FR-003.5:** The system shall allow Teachers to specify question counts per Resource/Topic combination.

**Acceptance Criteria:**
- Teachers can create lessons, topics, and resources
- Resources can be assigned to topics
- Question counts can be specified per resource/topic
- Pre-built library is accessible to all teachers
- Teachers can create and reuse custom resources

---

### FR-004: Timeline/Calendar Assignment System

**FR-004.1:** The system shall provide a visual timeline view (Jira/Notion-style) for managing assignments over time.

**FR-004.2:** The system shall allow Teachers to assign Topics to Students with start dates and question counts.

**FR-004.3:** The system shall automatically calculate end dates based on daily question targets and total question count.

**FR-004.4:** The system shall support flexible timeline adjustments (drag-and-drop, date changes).

**FR-004.5:** The system shall provide a calendar view with weekly detail expansion (Google Calendar-style).

**FR-004.6:** The system shall allow Teachers to access past topics for question adjustments.

**FR-004.7:** The system shall support "Exam Mode" where timeline adjustments are disabled for strict deadlines.

**FR-004.8:** The system shall display timeline in daily, weekly, and monthly views.

**Acceptance Criteria:**
- Timeline displays assignments as horizontal bars over time
- Teachers can drag assignments to adjust dates
- Calendar view expands to show daily details
- Past topics remain accessible for adjustments
- Exam mode locks timeline for specific assignments
- Timeline auto-adjusts based on progress (adaptive feature)

---

### FR-005: Daily Question Logging

**FR-005.1:** The system shall allow Students to log daily question progress with right/wrong/empty counts.

**FR-005.2:** The system shall display today's assigned topic and question target to Students.

**FR-005.3:** The system shall support retroactive logging (Students can log for past days).

**FR-005.4:** The system shall allow Students to log bonus questions (beyond assigned count).

**FR-005.5:** The system shall provide a mobile-optimized logging interface (< 2 minutes to complete).

**FR-005.6:** The system shall pre-fill defaults (yesterday's topic) to speed up logging.

**FR-005.7:** The system shall validate that logged questions don't exceed reasonable limits (e.g., 1000/day max).

**Acceptance Criteria:**
- Students see today's topic and question target
- Students can enter right/wrong/empty counts
- Students can log for past days (retroactive)
- Bonus questions are tracked separately (dark green vs light green)
- Mobile interface is fast and simple (< 2 minutes)
- Validation prevents unrealistic question counts

---

### FR-006: Progress Calculation & Visualization

**FR-006.1:** The system shall calculate dual metrics: Program Progress (questions solved) and Concept Mastery (accuracy).

**FR-006.2:** The system shall calculate topic-level accuracy: (Right / (Right + Wrong + Empty)) × 100.

**FR-006.3:** The system shall aggregate topic-level metrics to lesson-level metrics.

**FR-006.4:** The system shall display visual progress indicators (color coding: green = on track, yellow = attention, red = struggling).

**FR-006.5:** The system shall update progress calculations in real-time as students log work.

**FR-006.6:** The system shall display progress bars, percentage indicators, and trend graphs.

**FR-006.7:** The system shall calculate low accuracy alerts based on customizable thresholds (default 70%).

**Acceptance Criteria:**
- Progress calculations update in real-time
- Topic accuracy is calculated correctly
- Lesson-level aggregation is accurate
- Color coding reflects progress status
- Low accuracy alerts trigger at threshold
- Progress visualizations are clear and intuitive

---

### FR-007: Teacher Dashboard

**FR-007.1:** The system shall display a Teacher Dashboard with instant visibility into student progress.

**FR-007.2:** The system shall show a color-coded student list (green/yellow/red) indicating progress status.

**FR-007.3:** The system shall allow Teachers to click a student to see detailed progress.

**FR-007.4:** The system shall display question counts, accuracy metrics, and progress trends per student.

**FR-007.5:** The system shall show low accuracy alerts with red indicators.

**FR-007.6:** The system shall allow Teachers to customize accuracy thresholds for alerts.

**FR-007.7:** The system shall provide a table view of student progress grouped by lessons and topics.

**Acceptance Criteria:**
- Dashboard loads with immediate progress indicators
- Student list is color-coded (green/yellow/red)
- One-click drill-down to student details
- Low accuracy alerts are visible
- Customizable thresholds work correctly
- Progress table is organized by lessons/topics

---

### FR-008: Parent Portal

**FR-008.1:** The system shall provide a Parent Portal for viewing child's progress.

**FR-008.2:** The system shall display progress graphs and tables showing question counts, accuracy, and trends.

**FR-008.3:** The system shall allow Parents to view historical data (past weeks/months).

**FR-008.4:** The system shall display low accuracy alerts to Parents.

**FR-008.5:** The system shall allow Parents to view Teacher notes.

**FR-008.6:** The system shall provide mobile-optimized interface for Parents.

**Acceptance Criteria:**
- Parents can view child's progress graphs
- Historical data is accessible
- Low accuracy alerts are visible
- Teacher notes are displayed
- Mobile interface is optimized
- Parent can see progress by lesson/topic

---

### FR-009: Subscription Management

**FR-009.1:** The system shall allow Superadmin to manage Teacher subscriptions.

**FR-009.2:** The system shall track subscription duration (start date, end date).

**FR-009.3:** The system shall support cash-based payments (manual entry by Superadmin).

**FR-009.4:** The system shall display subscription expiration warnings (e.g., 7 days before expiration).

**FR-009.5:** The system shall restrict Teacher access when subscription expires.

**FR-009.6:** The system shall allow Superadmin to extend subscriptions manually.

**Acceptance Criteria:**
- Superadmin can create/edit subscriptions
- Subscription duration is tracked accurately
- Cash payments can be recorded manually
- Expiration warnings are displayed
- Expired subscriptions restrict access
- Subscription extensions work correctly

---

### FR-010: Communication

**FR-010.1:** The system shall allow Parents to send notes/messages to Teachers.

**FR-010.2:** The system shall allow Teachers to send messages to Students and Parents.

**FR-010.3:** The system shall allow Students to send messages to Teachers.

**FR-010.4:** The system shall provide an in-page chat interface (no external messaging).

**FR-010.5:** The system shall display message history in conversation threads.

**Acceptance Criteria:**
- Parents can message teachers
- Teachers can message students/parents
- Students can message teachers
- In-page chat interface works smoothly
- Message history is preserved
- Notifications for new messages (future enhancement)

---

### FR-011: Mobile-Responsive Design

**FR-011.1:** The system shall provide mobile-first design for Students and Parents.

**FR-011.2:** The system shall provide desktop-optimized design for Teachers.

**FR-011.3:** The system shall support responsive calendar/timeline views on all devices.

**FR-011.4:** The system shall ensure daily logging is fast and simple on mobile (< 2 minutes).

**FR-011.5:** The system shall support tablet devices for all roles.

**Acceptance Criteria:**
- Mobile interface is optimized for students/parents
- Desktop interface is optimized for teachers
- Calendar/timeline is responsive
- Daily logging is fast on mobile
- Tablet support works correctly
- All features are accessible on all devices

---

### FR-012: Data Privacy & Security

**FR-012.1:** The system shall ensure complete data isolation between Teachers (multi-tenant).

**FR-012.2:** The system shall require parental consent for Student accounts (COPPA compliance).

**FR-012.3:** The system shall allow Students to control visibility settings (privacy controls).

**FR-012.4:** The system shall encrypt data in transit (HTTPS) and at rest.

**FR-012.5:** The system shall implement secure authentication and session management.

**Acceptance Criteria:**
- Teacher data is completely isolated
- Parental consent is required for student accounts
- Student privacy controls work correctly
- Data encryption is implemented
- Secure authentication is enforced

---

## Non-Functional Requirements

**Focus:** Only document NFRs that matter for THIS product - skip categories that don't apply.

---

### Performance

**Why It Matters:** Real-time progress updates and fast mobile logging are critical for user experience and product adoption.

**Performance Requirements:**

**NFR-PERF-001:** Dashboard load time shall be < 2 seconds for Teachers (desktop).

**NFR-PERF-002:** Daily logging interface shall load in < 1 second on mobile devices.

**NFR-PERF-003:** Progress calculations shall update in real-time (< 500ms) as students log work.

**NFR-PERF-004:** Timeline view shall render smoothly with drag-and-drop interactions (< 100ms response time).

**NFR-PERF-005:** Mobile interface shall support offline logging with sync when connection restored.

**Acceptance Criteria:**
- Dashboard loads in < 2 seconds
- Mobile logging loads in < 1 second
- Progress updates appear instantly (< 500ms)
- Timeline interactions are smooth (< 100ms)
- Offline logging works correctly

---

### Security

**Why It Matters:** Student data privacy, multi-tenant isolation, and educational compliance are critical.

**Security Requirements:**

**NFR-SEC-001:** All data transmission shall use HTTPS/TLS 1.3 encryption.

**NFR-SEC-002:** Student data at rest shall be encrypted using AES-256 encryption.

**NFR-SEC-003:** Complete data isolation between Teachers (multi-tenant architecture).

**NFR-SEC-004:** Authentication shall use secure session tokens with automatic timeout (24 hours).

**NFR-SEC-005:** Role-based access control shall be enforced at all endpoints.

**NFR-SEC-006:** Student accounts shall require parental consent (COPPA compliance).

**NFR-SEC-007:** System shall support data export per tenant (GDPR compliance).

**Acceptance Criteria:**
- HTTPS encryption is enforced
- Data at rest is encrypted
- Teacher data is completely isolated
- Secure authentication is implemented
- RBAC is enforced everywhere
- Parental consent is required
- Data export is available

---

### Scalability

**Why It Matters:** Platform needs to support growth from early adopters (10 teachers) to broader market (1000+ teachers).

**Scalability Requirements:**

**NFR-SCAL-001:** System shall support 1000+ concurrent Teachers (10,000+ Students).

**NFR-SCAL-002:** Multi-tenant architecture shall scale horizontally (add servers as needed).

**NFR-SCAL-003:** Database shall support efficient queries for progress calculations across all tenants.

**NFR-SCAL-004:** Timeline/calendar views shall perform efficiently with large date ranges.

**NFR-SCAL-005:** System shall handle peak load during daily logging hours (evening rush).

**Acceptance Criteria:**
- System supports 1000+ teachers
- Horizontal scaling works correctly
- Database queries are optimized
- Timeline performance is maintained
- Peak load is handled gracefully

---

### Accessibility

**Why It Matters:** Students with disabilities need equal access, and mobile-first design benefits all users.

**Accessibility Requirements:**

**NFR-ACC-001:** System shall comply with WCAG 2.1 Level AA standards.

**NFR-ACC-002:** Mobile interface shall support screen readers and assistive technologies.

**NFR-ACC-003:** Color-coded progress indicators shall have text alternatives (not color-only).

**NFR-ACC-004:** All interactive elements shall be keyboard accessible.

**NFR-ACC-005:** Forms shall have clear labels and error messages.

**Acceptance Criteria:**
- WCAG 2.1 AA compliance verified
- Screen readers work correctly
- Color coding has text alternatives
- Keyboard navigation works
- Forms are accessible

---

### Integration (Future)

**Why It Matters:** Future integrations with payment systems, SMS, and educational platforms.

**Integration Requirements (v2+):**

**NFR-INT-001:** System shall support integration with Turkish payment gateways (v2).

**NFR-INT-002:** System shall support SMS notification services (v2).

**NFR-INT-003:** System architecture shall support future API integrations.

**Note:** Integration requirements are deferred to v2 and documented here for future planning.

---

## References

**Input Documents:**
- Product Brief: `docs/product-brief-private-tutoring-v2-2025-11-13.md`
- Competitive Research: `docs/research-competitive-2025-11-13.md`
- Brainstorming Session: `docs/bmm-brainstorming-session-2025-11-13.md`

**Key Insights Incorporated:**
- Daily question logging (right/wrong/empty) identified as unique differentiator
- Visual timeline system vs. basic calendars provides competitive advantage
- Time savings + visibility are core MVP priorities
- Mobile-first design critical for students/parents
- Multi-tenant SaaS architecture required for scalability

---

## Implementation Planning

### Epic Breakdown Required

Requirements must be decomposed into epics and bite-sized stories (200k context limit for AI agents).

**Next Step:** Run `workflow create-epics-and-stories` to create the implementation breakdown.

**Epic Structure Preview:**
- Epic 1: Foundation (Authentication, Multi-tenancy, Basic UI)
- Epic 2: Student & Resource Management
- Epic 3: Timeline/Calendar Assignment System
- Epic 4: Daily Question Logging
- Epic 5: Progress Calculation & Visualization
- Epic 6: Teacher Dashboard & Visibility
- Epic 7: Parent Portal
- Epic 8: Subscription Management
- Epic 9: Communication Features
- Epic 10: Mobile Optimization & Polish

---

## Next Steps

1. **Epic & Story Breakdown** (Required)
   - Run: `workflow create-epics-and-stories`
   - Transform FRs into implementable stories organized in epics

2. **UX Design** (Conditional - if UI exists)
   - Run: `workflow create-ux-design`
   - Detailed user experience design and wireframes

3. **Architecture** (Recommended)
   - Run: `workflow create-architecture`
   - Technical architecture decisions and system design

---

## Summary

**Product Vision:** Replace Excel tracking with intelligent daily progress monitoring. Track every question, every day, with visual timelines that adapt to your students' needs.

**Product Magic:** Instant visibility replaces manual analysis. Teachers see at a glance which students need help - no more Excel spreadsheets.

**MVP Focus:** Time savings + Visibility (core differentiators)

**Functional Requirements:** 12 capability areas, 60+ specific requirements

**Non-Functional Requirements:** Performance, Security, Scalability, Accessibility

**Success Criteria:** Teachers save time, students engage daily, parents see progress - all replacing Excel tracking pain point.

---

_This PRD captures the essence of Private Tutoring Dashboard Platform - instant visibility and time savings through intelligent daily progress tracking._

_Created through collaborative discovery between BatuRUN and AI facilitator using BMad Method PRD workflow._

_The magic of this product - instant visibility replacing manual Excel analysis - is woven throughout the PRD and will guide all subsequent work._

