# Private Tutoring Dashboard Platform - Epic Breakdown

**Author:** BatuRUN
**Date:** 2025-11-14
**Project Level:** Level 2-3 (Medium Complexity SaaS B2B)
**Target Scale:** 1000+ Teachers, 10,000+ Students

---

## Overview

This document provides the complete epic and story breakdown for Private Tutoring Dashboard Platform, decomposing the requirements from the [PRD](./PRD.md) into implementable stories.

**Product Magic:** Instant visibility replaces manual Excel analysis. Teachers see at a glance which students need help - no more spreadsheet work.

**MVP Focus:** Time Savings + Visibility (core differentiators)

---

## Proposed Epic Structure

Based on analysis of the PRD requirements, I've identified **10 epics** that group related capabilities into logical, independently valuable deliverables:

### Epic 1: Foundation & Authentication
**Value:** Establishes the technical foundation and secure access control
**Scope:** Project setup, infrastructure, authentication, multi-tenant architecture basics, basic UI framework, deployment pipeline
**Why First:** Required foundation for all subsequent work (greenfield project requirement)

### Epic 2: User & Resource Management  
**Value:** Enables teachers to manage students and create educational resources
**Scope:** Student CRUD, resource management (lessons/topics/resources), pre-built library, user relationships
**Why Second:** Core data model needed before assignments and logging

### Epic 3: Timeline & Assignment System
**Value:** Visual timeline for managing assignments over time (core differentiator)
**Scope:** Visual timeline view, calendar system, assignment creation, drag-and-drop adjustments, exam mode
**Why Third:** Assignment system needed before students can log work

### Epic 4: Daily Question Logging
**Value:** Students can log daily progress (core feature)
**Scope:** Daily logging interface, retroactive logging, bonus questions, mobile optimization, validation
**Why Fourth:** Core logging functionality depends on assignments existing

### Epic 5: Progress Calculation & Visualization
**Value:** Real-time progress calculations and visual indicators
**Scope:** Dual metrics calculation, topic/lesson aggregation, color coding, progress bars, accuracy alerts
**Why Fifth:** Progress calculations depend on logged data

### Epic 6: Teacher Dashboard & Visibility
**Value:** **THE MAGIC MOMENT** - Instant visibility replaces Excel analysis
**Scope:** Dashboard, color-coded student list, drill-down views, progress tables, customizable thresholds
**Why Sixth:** Delivers the core value proposition - instant visibility

### Epic 7: Parent Portal
**Value:** Parents can monitor their child's progress
**Scope:** Progress graphs, historical data, low accuracy alerts, teacher notes viewing, mobile optimization
**Why Seventh:** Builds on progress visualization for parent audience

### Epic 8: Subscription Management
**Value:** Superadmin can manage teacher subscriptions and access control
**Scope:** Subscription CRUD, duration tracking, cash payments, expiration warnings, access restrictions
**Why Eighth:** Business operations feature, supports multi-tenant model

### Epic 9: Communication Features
**Value:** Enables teacher-student-parent communication
**Scope:** In-page messaging, conversation threads, message history
**Why Ninth:** Supporting feature, enhances collaboration

### Epic 10: Mobile Optimization & Polish
**Value:** Ensures excellent mobile experience and accessibility
**Scope:** Mobile responsiveness, performance optimization, offline support, accessibility (WCAG), polish
**Why Last:** Optimizes and polishes the complete system

**Epic Sequencing Rationale:**
- Epics 1-3: Foundation and core data model
- Epics 4-5: Core functionality (logging + progress)
- Epic 6: **Magic moment delivery** (instant visibility)
- Epics 7-9: Supporting features
- Epic 10: Optimization and polish

**MVP Scope:** Epics 1-7 deliver complete MVP (Time Savings + Visibility focus)

---

---

## Epic Breakdown

### Epic 1: Foundation & Authentication

**Goal:** Establish the technical foundation, secure authentication, and multi-tenant architecture basics. This epic creates the infrastructure that enables all subsequent development work.

**Covers FRs:** FR-001 (Authentication), FR-012 (Security basics), Infrastructure setup

**Stories:**

#### Story 1.1: Project Setup & Infrastructure

As a **developer**,
I want **project structure, build system, and deployment pipeline**,
So that **I have a solid foundation for building the application**.

**Acceptance Criteria:**

**Given** a greenfield project
**When** I initialize the project
**Then** I have:
- Repository structure with clear organization
- Build system configured (package.json, dependencies)
- Basic deployment pipeline (CI/CD basics)
- Development environment setup
- Code quality tools (linting, formatting)

**And** the project is ready for adding features

**Prerequisites:** None (first story)

**Technical Notes:**
- Choose tech stack (to be determined in architecture workflow)
- Set up version control
- Configure development environment
- Set up basic CI/CD pipeline
- Establish coding standards

---

#### Story 1.2: Database Schema & Multi-Tenant Foundation

As a **developer**,
I want **database schema with multi-tenant support**,
So that **data is properly isolated between teachers**.

**Acceptance Criteria:**

**Given** a database system
**When** I create the schema
**Then** I have:
- User table with role field (Superadmin, Teacher, Student, Parent)
- Tenant isolation (teacher_id foreign key on all tenant-scoped tables)
- Indexes for performance
- Migration system set up

**And** data isolation is enforced at the database level

**Prerequisites:** Story 1.1

**Technical Notes:**
- Multi-tenant architecture: Teacher = Tenant
- All tenant-scoped tables include teacher_id
- Superadmin can access all tenants
- Database migrations configured
- Indexes for common queries

---

#### Story 1.3: Authentication System

As a **user**,
I want **to log in with username and password**,
So that **I can access the system securely**.

**Acceptance Criteria:**

**Given** a user account exists
**When** I enter username and password
**Then** I am authenticated
**And** I receive a secure session token
**And** I am redirected to my role-specific dashboard

**Given** invalid credentials
**When** I attempt to log in
**Then** I see an error message
**And** I remain on the login page

**Prerequisites:** Story 1.2

**Technical Notes:**
- Secure password hashing (bcrypt/argon2)
- Session token generation (JWT or session-based)
- Session timeout: 24 hours
- Password validation rules
- Login rate limiting (prevent brute force)

---

#### Story 1.4: Role-Based Access Control (RBAC)

As a **system**,
I want **to enforce role-based permissions**,
So that **users can only access features appropriate for their role**.

**Acceptance Criteria:**

**Given** a user is authenticated
**When** they attempt to access a feature
**Then** the system checks their role
**And** grants or denies access based on permission matrix

**Given** a Teacher tries to access Superadmin features
**When** they make a request
**Then** access is denied
**And** they see an appropriate error message

**Prerequisites:** Story 1.3

**Technical Notes:**
- Middleware for RBAC checks
- Permission matrix implementation
- Role-based route protection
- API endpoint authorization
- Error handling for unauthorized access

---

#### Story 1.5: Basic UI Framework & Layout

As a **user**,
I want **a consistent UI framework and layout**,
So that **I have a familiar interface across all features**.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate the application
**Then** I see:
- Consistent navigation
- Role-specific menu items
- Responsive layout
- Basic styling system

**And** the UI framework supports future features

**Prerequisites:** Story 1.4

**Technical Notes:**
- Choose UI framework (React/Vue/etc. - to be determined)
- Set up component library or design system
- Create base layout components
- Responsive design foundation
- Navigation structure

---

#### Story 1.6: HTTPS & Security Basics

As a **system**,
I want **HTTPS encryption and basic security measures**,
So that **data is protected in transit and at rest**.

**Acceptance Criteria:**

**Given** the application is deployed
**When** users access it
**Then** all connections use HTTPS/TLS 1.3
**And** data at rest is encrypted (AES-256)
**And** security headers are configured

**Prerequisites:** Story 1.5

**Technical Notes:**
- SSL/TLS certificate configuration
- HTTPS enforcement
- Security headers (CSP, HSTS, etc.)
- Data encryption at rest
- Environment variable management for secrets

---

### Epic 2: User & Resource Management

**Goal:** Enable teachers to manage students and create educational resources (lessons, topics, resources). This epic establishes the core data model for the educational content system.

**Covers FRs:** FR-002 (Student Management), FR-003 (Resource Management)

**Stories:**

#### Story 2.1: Superadmin Creates Teacher Accounts

As a **Superadmin**,
I want **to create and manage Teacher accounts**,
So that **teachers can access the platform**.

**Acceptance Criteria:**

**Given** I am logged in as Superadmin
**When** I create a new Teacher account
**Then** the teacher account is created
**And** the teacher receives login credentials
**And** I can view/edit/delete teacher accounts

**Prerequisites:** Story 1.6

**Technical Notes:**
- Teacher account creation form
- Username/password generation
- Teacher list view
- CRUD operations for teachers
- Superadmin-only access

---

#### Story 2.2: Teacher Creates Student Accounts

As a **Teacher**,
I want **to create and manage Student accounts**,
So that **I can track their progress**.

**Acceptance Criteria:**

**Given** I am logged in as a Teacher
**When** I create a new Student account
**Then** the student account is created
**And** the student is assigned to me (my tenant)
**And** I can view/edit/delete my students
**And** I can see a list of all my students

**Prerequisites:** Story 2.1

**Technical Notes:**
- Student CRUD operations
- Tenant isolation (students belong to teacher)
- Student list view with inline editing
- Student form with validation
- Teacher-scoped queries

---

#### Story 2.3: Teacher Assigns Parents to Students

As a **Teacher**,
I want **to assign Parents to Students**,
So that **parents can view their child's progress**.

**Acceptance Criteria:**

**Given** I have created Student accounts
**When** I assign a Parent to a Student
**Then** the parent-student relationship is created
**And** one student can have multiple parents
**And** I can view/edit parent assignments

**Prerequisites:** Story 2.2

**Technical Notes:**
- Parent-student relationship table
- Many-to-many relationship (student can have multiple parents)
- Parent assignment UI
- Parent account creation (if needed)
- Relationship management

---

#### Story 2.4: Teacher Creates Lessons, Topics, and Resources

As a **Teacher**,
I want **to create Lessons, Topics, and Resources**,
So that **I can organize educational content**.

**Acceptance Criteria:**

**Given** I am logged in as a Teacher
**When** I create a Lesson
**Then** the lesson is created
**And** I can add Topics to the Lesson
**And** I can add Resources to Topics
**And** I can specify question counts per Resource/Topic

**Given** I have created content
**When** I view my resources
**Then** I see the hierarchical structure: Lessons → Topics → Resources

**Prerequisites:** Story 2.2

**Technical Notes:**
- Hierarchical data model (Lessons → Topics → Resources)
- CRUD operations for each level
- Question count specification
- Resource library structure
- Teacher-scoped resources

---

#### Story 2.5: Pre-Built Resource Library

As a **Superadmin**,
I want **to populate a pre-built resource library**,
So that **all teachers can access common educational content**.

**Acceptance Criteria:**

**Given** I am logged in as Superadmin
**When** I add resources to the library
**Then** all teachers can see and use these resources
**And** teachers can create their own custom resources
**And** pre-built and custom resources are clearly distinguished

**Prerequisites:** Story 2.4

**Technical Notes:**
- Global resource library (not tenant-scoped)
- Resource sharing mechanism
- Resource tagging/categorization
- Superadmin resource management UI
- Resource visibility controls

---

### Epic 3: Timeline & Assignment System

**Goal:** Create the visual timeline system for managing assignments over time. This is a core differentiator - Jira/Notion-style timeline vs. basic calendars.

**Covers FRs:** FR-004 (Timeline/Calendar Assignment System)

**Stories:**

#### Story 3.1: Assignment Data Model & Basic Creation

As a **Teacher**,
I want **to create assignments for students**,
So that **students know what topics to work on**.

**Acceptance Criteria:**

**Given** I have students and resources
**When** I create an assignment
**Then** I can:
- Select a student
- Choose a topic/resource
- Set start date
- Set question count
- System calculates end date based on daily targets

**And** the assignment is saved

**Prerequisites:** Story 2.5

**Technical Notes:**
- Assignment data model (student_id, topic_id, start_date, end_date, question_count)
- Assignment creation form
- End date calculation logic
- Assignment storage
- Basic assignment list view

---

#### Story 3.2: Visual Timeline View (Jira/Notion-Style)

As a **Teacher**,
I want **to see assignments in a visual timeline**,
So that **I can see the flow of assignments over time**.

**Acceptance Criteria:**

**Given** I have created assignments
**When** I view the timeline
**Then** I see:
- Assignments as horizontal bars over time
- Multiple students' assignments visible
- Daily, weekly, monthly view options
- Timeline scrollable and zoomable

**And** the timeline is interactive

**Prerequisites:** Story 3.1

**Technical Notes:**
- Timeline visualization library (e.g., Gantt chart component)
- Timeline rendering with assignments as bars
- View switching (daily/weekly/monthly)
- Timeline navigation (scroll, zoom)
- Performance optimization for many assignments

---

#### Story 3.3: Drag-and-Drop Timeline Adjustments

As a **Teacher**,
I want **to drag assignments on the timeline to adjust dates**,
So that **I can easily reschedule assignments**.

**Acceptance Criteria:**

**Given** I have assignments on the timeline
**When** I drag an assignment bar to a new date
**Then** the assignment dates update
**And** the end date recalculates if needed
**And** changes are saved automatically

**Prerequisites:** Story 3.2

**Technical Notes:**
- Drag-and-drop interaction
- Date update logic
- Auto-save on drag end
- Visual feedback during drag
- Timeline refresh after update

---

#### Story 3.4: Calendar View with Weekly Expansion

As a **Teacher**,
I want **to see assignments in a calendar view**,
So that **I can see weekly schedules clearly**.

**Acceptance Criteria:**

**Given** I have assignments
**When** I switch to calendar view
**Then** I see:
- Monthly calendar grid
- Assignments shown on their dates
- Weekly view expansion (Google Calendar-style)
- Daily detail view when clicking a day

**Prerequisites:** Story 3.2

**Technical Notes:**
- Calendar component
- View switching (month/week/day)
- Assignment display on calendar
- Weekly expansion interaction
- Daily detail modal/view

---

#### Story 3.5: Past Topic Access & Question Adjustments

As a **Teacher**,
I want **to access past topics and adjust question counts**,
So that **I can modify assignments retroactively**.

**Acceptance Criteria:**

**Given** I have past assignments
**When** I view past topics
**Then** I can:
- See all past assignments
- Adjust question counts
- Modify assignment details
- Changes reflect in progress calculations

**Prerequisites:** Story 3.3

**Technical Notes:**
- Past assignment filtering
- Assignment editing for past dates
- Question count adjustment
- Progress recalculation trigger
- Historical data access

---

#### Story 3.6: Exam Mode (Fixed Deadlines)

As a **Teacher**,
I want **to enable Exam Mode for assignments**,
So that **timeline adjustments are disabled for strict deadlines**.

**Acceptance Criteria:**

**Given** I have an assignment
**When** I enable Exam Mode
**Then** the assignment dates are locked
**And** drag-and-drop is disabled for this assignment
**And** the assignment shows an exam mode indicator

**Prerequisites:** Story 3.3

**Technical Notes:**
- Exam mode flag on assignments
- Timeline interaction disabling for exam mode
- Visual indicator (icon/badge)
- Exam mode toggle UI
- Validation to prevent exam mode changes

---

### Epic 4: Daily Question Logging

**Goal:** Enable students to log their daily question progress. This is the core feature that replaces Excel tracking.

**Covers FRs:** FR-005 (Daily Question Logging)

**Stories:**

#### Story 4.1: Student Sees Today's Assignment

As a **Student**,
I want **to see today's assigned topic and question target**,
So that **I know what to work on**.

**Acceptance Criteria:**

**Given** I am logged in as a Student
**When** I view my dashboard
**Then** I see:
- Today's assigned topic
- Question target for today
- Progress toward today's target
- Upcoming assignments

**Prerequisites:** Story 3.6

**Technical Notes:**
- Student dashboard
- Assignment lookup for current date
- Question target calculation
- Progress display
- Upcoming assignments list

---

#### Story 4.2: Daily Question Logging Form

As a **Student**,
I want **to log my daily question progress**,
So that **my teacher can track my work**.

**Acceptance Criteria:**

**Given** I see today's assignment
**When** I log my progress
**Then** I can enter:
- Right answers count
- Wrong answers count
- Empty answers count
- Bonus questions (optional)

**And** the form validates input
**And** my progress is saved

**Prerequisites:** Story 4.1

**Technical Notes:**
- Logging form UI
- Input validation (max 1000/day)
- Data submission
- Progress record creation
- Success feedback

---

#### Story 4.3: Retroactive Logging (Past Days)

As a **Student**,
I want **to log progress for past days**,
So that **I can catch up if I missed logging**.

**Acceptance Criteria:**

**Given** I missed logging yesterday
**When** I log retroactively
**Then** I can:
- Select a past date
- See that day's assignment
- Log right/wrong/empty counts
- Save the retroactive log

**And** the log is associated with the correct date

**Prerequisites:** Story 4.2

**Technical Notes:**
- Date picker for past dates
- Assignment lookup for selected date
- Retroactive log creation
- Date validation (not future dates)
- Historical assignment display

---

#### Story 4.4: Mobile-Optimized Logging Interface

As a **Student**,
I want **a fast, simple mobile interface for logging**,
So that **I can log my work quickly (< 2 minutes)**.

**Acceptance Criteria:**

**Given** I am on a mobile device
**When** I open the logging interface
**Then** it:
- Loads in < 1 second
- Has large, touch-friendly inputs
- Pre-fills defaults (yesterday's topic)
- Requires minimal scrolling
- Submits quickly

**Prerequisites:** Story 4.2

**Technical Notes:**
- Mobile-first responsive design
- Touch-optimized inputs
- Performance optimization
- Default pre-filling logic
- Mobile UX best practices

---

#### Story 4.5: Bonus Question Tracking

As a **Student**,
I want **to log bonus questions separately**,
So that **my teacher can see extra work I did**.

**Acceptance Criteria:**

**Given** I have completed my assigned questions
**When** I log bonus questions
**Then** bonus questions are tracked separately
**And** displayed differently (dark green vs light green)
**And** included in progress calculations

**Prerequisites:** Story 4.2

**Technical Notes:**
- Bonus question field in logging form
- Separate tracking in database
- Visual distinction (color coding)
- Progress calculation inclusion
- Bonus question display

---

### Epic 5: Progress Calculation & Visualization

**Goal:** Calculate and visualize student progress in real-time. This enables the "instant visibility" magic moment.

**Covers FRs:** FR-006 (Progress Calculation & Visualization)

**Stories:**

#### Story 5.1: Topic-Level Accuracy Calculation

As a **system**,
I want **to calculate topic-level accuracy**,
So that **teachers can see student mastery per topic**.

**Acceptance Criteria:**

**Given** a student has logged questions for a topic
**When** progress is calculated
**Then** accuracy = (Right / (Right + Wrong + Empty)) × 100
**And** the calculation updates in real-time (< 500ms)
**And** results are stored for quick retrieval

**Prerequisites:** Story 4.5

**Technical Notes:**
- Accuracy calculation formula
- Real-time calculation trigger (on log submission)
- Cached calculation results
- Performance optimization
- Calculation accuracy validation

---

#### Story 5.2: Lesson-Level Aggregation

As a **system**,
I want **to aggregate topic metrics to lesson level**,
So that **teachers can see overall lesson progress**.

**Acceptance Criteria:**

**Given** topics have calculated accuracies
**When** lesson progress is calculated
**Then** lesson accuracy = average of topic accuracies
**And** lesson progress = sum of topic question counts
**And** aggregation updates automatically

**Prerequisites:** Story 5.1

**Technical Notes:**
- Aggregation logic
- Weighted vs simple average
- Performance optimization
- Cached aggregation results
- Update triggers

---

#### Story 5.3: Dual Metrics (Program Progress + Concept Mastery)

As a **system**,
I want **to calculate both program progress and concept mastery**,
So that **teachers get comprehensive insights**.

**Acceptance Criteria:**

**Given** student has logged questions
**When** metrics are calculated
**Then** I calculate:
- Program Progress: Questions solved / Total assigned
- Concept Mastery: Accuracy percentage
**And** both metrics are displayed together
**And** both update in real-time

**Prerequisites:** Story 5.2

**Technical Notes:**
- Dual metric calculation
- Metric display components
- Real-time updates
- Metric definitions clear
- Performance considerations

---

#### Story 5.4: Color-Coded Progress Indicators

As a **system**,
I want **to display color-coded progress indicators**,
So that **teachers can instantly see student status**.

**Acceptance Criteria:**

**Given** progress is calculated
**When** indicators are displayed
**Then** colors represent:
- Green: On track (accuracy ≥ threshold)
- Yellow: Attention needed (accuracy near threshold)
- Red: Struggling (accuracy < threshold)
**And** colors have text alternatives (accessibility)
**And** threshold is customizable (default 70%)

**Prerequisites:** Story 5.3

**Technical Notes:**
- Color coding logic
- Threshold configuration
- Accessibility (text alternatives)
- Visual indicator components
- Color scheme consistency

---

#### Story 5.5: Progress Bars & Percentage Indicators

As a **user**,
I want **to see progress bars and percentages**,
So that **I can quickly understand progress**.

**Acceptance Criteria:**

**Given** progress is calculated
**When** I view progress
**Then** I see:
- Progress bars showing completion
- Percentage indicators
- Clear visual representation
- Responsive design (mobile-friendly)

**Prerequisites:** Story 5.4

**Technical Notes:**
- Progress bar components
- Percentage calculation and display
- Visual design
- Responsive implementation
- Performance optimization

---

#### Story 5.6: Low Accuracy Alerts

As a **system**,
I want **to generate low accuracy alerts**,
So that **teachers are notified when students struggle**.

**Acceptance Criteria:**

**Given** a student's accuracy falls below threshold
**When** progress is calculated
**Then** a low accuracy alert is generated
**And** alert is visible to teacher
**And** alert is visible to parent
**And** threshold is customizable (default 70%)

**Prerequisites:** Story 5.4

**Technical Notes:**
- Alert generation logic
- Threshold checking
- Alert storage
- Alert display components
- Notification system (future enhancement)

---

### Epic 6: Teacher Dashboard & Visibility

**Goal:** **THE MAGIC MOMENT** - Deliver instant visibility that replaces Excel analysis. Teachers see at a glance which students need help.

**Covers FRs:** FR-007 (Teacher Dashboard)

**Stories:**

#### Story 6.1: Teacher Dashboard Layout

As a **Teacher**,
I want **a dashboard that loads quickly**,
So that **I can see student progress immediately**.

**Acceptance Criteria:**

**Given** I am logged in as a Teacher
**When** I open my dashboard
**Then** it loads in < 2 seconds
**And** displays key information immediately
**And** shows all my students

**Prerequisites:** Story 5.6

**Technical Notes:**
- Dashboard layout
- Performance optimization (< 2s load)
- Student list display
- Key metrics summary
- Responsive design

---

#### Story 6.2: Color-Coded Student List

As a **Teacher**,
I want **to see a color-coded list of my students**,
So that **I can instantly identify who needs help**.

**Acceptance Criteria:**

**Given** I have students with calculated progress
**When** I view my student list
**Then** I see:
- Green: Students on track
- Yellow: Students needing attention
- Red: Students struggling
**And** colors update in real-time
**And** I can sort/filter by status

**Prerequisites:** Story 6.1

**Technical Notes:**
- Color-coded list component
- Real-time color updates
- Sorting/filtering functionality
- Status calculation integration
- Visual design

---

#### Story 6.3: Student Detail Drill-Down

As a **Teacher**,
I want **to click a student to see detailed progress**,
So that **I can understand their specific needs**.

**Acceptance Criteria:**

**Given** I see the student list
**When** I click a student
**Then** I see:
- Detailed progress metrics
- Question counts (right/wrong/empty)
- Accuracy per topic/lesson
- Progress trends over time
- Low accuracy alerts

**Prerequisites:** Story 6.2

**Technical Notes:**
- Student detail view/modal
- Progress data display
- Trend visualization
- Drill-down navigation
- Data loading optimization

---

#### Story 6.4: Progress Table (Lessons & Topics)

As a **Teacher**,
I want **to see a table of student progress by lessons and topics**,
So that **I can identify weak areas**.

**Acceptance Criteria:**

**Given** I view student progress
**When** I see the progress table
**Then** it shows:
- Progress grouped by lessons
- Topics within each lesson
- Accuracy per topic
- Color-coded indicators
- Sortable/filterable columns

**Prerequisites:** Story 6.3

**Technical Notes:**
- Table component
- Grouping logic (lessons → topics)
- Sorting/filtering
- Color coding integration
- Performance for many topics

---

#### Story 6.5: Customizable Accuracy Thresholds

As a **Teacher**,
I want **to customize accuracy thresholds for alerts**,
So that **I can set my own standards**.

**Acceptance Criteria:**

**Given** I am viewing my dashboard
**When** I change the accuracy threshold
**Then** alerts update accordingly
**And** color coding updates
**And** my preference is saved
**And** default is 70% if not set

**Prerequisites:** Story 6.4

**Technical Notes:**
- Threshold configuration UI
- Preference storage
- Real-time threshold application
- Default value handling
- User preference management

---

### Epic 7: Parent Portal

**Goal:** Enable parents to monitor their child's progress. Builds on progress visualization for parent audience.

**Covers FRs:** FR-008 (Parent Portal)

**Stories:**

#### Story 7.1: Parent Dashboard & Progress Graphs

As a **Parent**,
I want **to see my child's progress in graphs**,
So that **I can understand how they're doing**.

**Acceptance Criteria:**

**Given** I am logged in as a Parent
**When** I view my child's progress
**Then** I see:
- Progress graphs (question counts, accuracy)
- Trend lines over time
- Visual indicators
- Mobile-optimized display

**Prerequisites:** Story 6.5

**Technical Notes:**
- Parent dashboard
- Graph/chart components
- Data visualization
- Mobile optimization
- Performance optimization

---

#### Story 7.2: Historical Data Access

As a **Parent**,
I want **to view historical progress data**,
So that **I can see trends over time**.

**Acceptance Criteria:**

**Given** I am viewing progress
**When** I select a date range
**Then** I see:
- Historical progress data
- Past weeks/months
- Trend analysis
- Comparison over time

**Prerequisites:** Story 7.1

**Technical Notes:**
- Date range selector
- Historical data queries
- Trend calculation
- Data display
- Performance for long ranges

---

#### Story 7.3: Parent Sees Low Accuracy Alerts

As a **Parent**,
I want **to see low accuracy alerts for my child**,
So that **I know when they need help**.

**Acceptance Criteria:**

**Given** my child's accuracy falls below threshold
**When** I view the parent portal
**Then** I see low accuracy alerts
**And** alerts are clearly visible
**And** I can see which topics are struggling

**Prerequisites:** Story 7.1

**Technical Notes:**
- Alert display for parents
- Alert filtering (parent's child only)
- Alert visibility
- Topic-level alert details
- Alert styling

---

#### Story 7.4: Parent Views Teacher Notes

As a **Parent**,
I want **to view teacher notes about my child**,
So that **I can see teacher feedback**.

**Acceptance Criteria:**

**Given** teacher has added notes
**When** I view the parent portal
**Then** I can see teacher notes
**And** notes are organized by date
**And** notes are clearly displayed

**Prerequisites:** Story 7.1

**Technical Notes:**
- Teacher notes display
- Notes organization
- Notes UI component
- Date sorting
- Notes visibility controls

---

### Epic 8: Subscription Management

**Goal:** Enable Superadmin to manage teacher subscriptions and access control. Supports the multi-tenant business model.

**Covers FRs:** FR-009 (Subscription Management)

**Stories:**

#### Story 8.1: Subscription CRUD Operations

As a **Superadmin**,
I want **to create and manage teacher subscriptions**,
So that **I can control access to the platform**.

**Acceptance Criteria:**

**Given** I am logged in as Superadmin
**When** I manage subscriptions
**Then** I can:
- Create new subscriptions (assign to teacher)
- Set start date and end date
- Edit subscription details
- Delete subscriptions
- View all subscriptions

**Prerequisites:** Story 1.6

**Technical Notes:**
- Subscription data model
- CRUD operations
- Subscription-teacher relationship
- Subscription list view
- Subscription form

---

#### Story 8.2: Cash Payment Recording

As a **Superadmin**,
I want **to record cash payments manually**,
So that **I can track subscription payments**.

**Acceptance Criteria:**

**Given** I am managing a subscription
**When** I record a cash payment
**Then** payment is recorded
**And** payment date is stored
**And** payment amount is stored
**And** payment history is visible

**Prerequisites:** Story 8.1

**Technical Notes:**
- Payment recording UI
- Payment data model
- Payment history display
- Manual entry form
- Payment validation

---

#### Story 8.3: Subscription Expiration Warnings

As a **system**,
I want **to warn about expiring subscriptions**,
So that **Superadmin can renew them in time**.

**Acceptance Criteria:**

**Given** a subscription is expiring soon (7 days)
**When** Superadmin views subscriptions
**Then** expiring subscriptions are highlighted
**And** warning messages are displayed
**And** expiration date is clearly shown

**Prerequisites:** Story 8.2

**Technical Notes:**
- Expiration calculation
- Warning display logic
- Visual indicators
- Warning thresholds (7 days)
- Notification system (future)

---

#### Story 8.4: Access Restriction on Expiration

As a **system**,
I want **to restrict teacher access when subscription expires**,
So that **only active subscribers can use the platform**.

**Acceptance Criteria:**

**Given** a teacher's subscription has expired
**When** they try to log in
**Then** access is denied
**And** they see an expiration message
**And** Superadmin can extend the subscription

**Prerequisites:** Story 8.3

**Technical Notes:**
- Subscription status check
- Access control middleware
- Expiration message
- Subscription extension UI
- Access restoration logic

---

### Epic 9: Communication Features

**Goal:** Enable teacher-student-parent communication. Supporting feature that enhances collaboration.

**Covers FRs:** FR-010 (Communication)

**Stories:**

#### Story 9.1: In-Page Messaging System

As a **user**,
I want **to send messages within the application**,
So that **I can communicate with teachers/parents/students**.

**Acceptance Criteria:**

**Given** I am logged in
**When** I send a message
**Then** message is delivered
**And** message appears in conversation thread
**And** recipient can see the message
**And** message history is preserved

**Prerequisites:** Story 6.5

**Technical Notes:**
- Messaging data model
- Message sending logic
- Conversation threading
- Message display components
- Real-time updates (future)

---

#### Story 9.2: Teacher-Student Messaging

As a **Teacher or Student**,
I want **to message each other**,
So that **we can communicate about assignments**.

**Acceptance Criteria:**

**Given** I am a Teacher or Student
**When** I send a message
**Then** I can message:
- Teacher → Student
- Student → Teacher
**And** messages are organized in threads
**And** message history is visible

**Prerequisites:** Story 9.1

**Technical Notes:**
- Teacher-student messaging
- Conversation threading
- Message permissions
- Message display
- Thread management

---

#### Story 9.3: Parent-Teacher Messaging

As a **Parent or Teacher**,
I want **to message each other**,
So that **we can discuss student progress**.

**Acceptance Criteria:**

**Given** I am a Parent or Teacher
**When** I send a message
**Then** I can message:
- Parent → Teacher
- Teacher → Parent
**And** messages are organized in threads
**And** message history is visible

**Prerequisites:** Story 9.1

**Technical Notes:**
- Parent-teacher messaging
- Conversation threading
- Message permissions
- Message display
- Thread management

---

### Epic 10: Mobile Optimization & Polish

**Goal:** Ensure excellent mobile experience, performance, and accessibility. Optimizes and polishes the complete system.

**Covers FRs:** FR-011 (Mobile-Responsive Design), FR-012 (Data Privacy enhancements), NFRs (Performance, Accessibility)

**Stories:**

#### Story 10.1: Comprehensive Mobile Responsiveness

As a **user on mobile**,
I want **all features to work well on mobile**,
So that **I can use the platform on any device**.

**Acceptance Criteria:**

**Given** I am on a mobile device
**When** I use any feature
**Then** it:
- Displays correctly on mobile
- Has touch-friendly interactions
- Loads quickly (< 1s for logging)
- Works in portrait and landscape
- Is usable on tablets

**Prerequisites:** Story 9.3

**Technical Notes:**
- Comprehensive responsive design
- Touch interaction optimization
- Mobile performance
- Tablet support
- Cross-device testing

---

#### Story 10.2: Offline Logging Support

As a **Student**,
I want **to log progress offline**,
So that **I can log even without internet**.

**Acceptance Criteria:**

**Given** I am offline
**When** I log my progress
**Then** log is saved locally
**And** syncs when connection is restored
**And** I see offline indicator
**And** sync happens automatically

**Prerequisites:** Story 10.1

**Technical Notes:**
- Offline storage (localStorage/IndexedDB)
- Sync mechanism
- Offline detection
- Sync conflict resolution
- User feedback

---

#### Story 10.3: Performance Optimization

As a **user**,
I want **the application to be fast**,
So that **I have a smooth experience**.

**Acceptance Criteria:**

**Given** I use any feature
**When** I interact with it
**Then** it:
- Loads quickly (dashboard < 2s, logging < 1s)
- Updates in real-time (< 500ms)
- Responds smoothly to interactions
- Handles peak load gracefully

**Prerequisites:** Story 10.1

**Technical Notes:**
- Performance profiling
- Optimization (caching, lazy loading)
- Database query optimization
- Frontend optimization
- Load testing

---

#### Story 10.4: WCAG Accessibility Compliance

As a **user with disabilities**,
I want **the application to be accessible**,
So that **I can use it with assistive technologies**.

**Acceptance Criteria:**

**Given** I use assistive technologies
**When** I navigate the application
**Then** it:
- Meets WCAG 2.1 Level AA standards
- Works with screen readers
- Has keyboard navigation
- Has text alternatives for colors
- Has clear form labels

**Prerequisites:** Story 10.1

**Technical Notes:**
- WCAG compliance audit
- Screen reader testing
- Keyboard navigation
- ARIA labels
- Accessibility testing

---

#### Story 10.5: Data Privacy Enhancements

As a **system**,
I want **to ensure complete data privacy**,
So that **student data is protected**.

**Acceptance Criteria:**

**Given** the system is deployed
**When** data is handled
**Then** it:
- Requires parental consent for student accounts (COPPA)
- Allows student privacy controls
- Supports data export per tenant (GDPR)
- Encrypts data properly
- Maintains data isolation

**Prerequisites:** Story 10.4

**Technical Notes:**
- Parental consent workflow
- Student privacy controls
- Data export functionality
- Encryption verification
- Privacy compliance audit

---

## Epic Coverage Summary

**Total Epics:** 10
**Total Stories:** 50+
**MVP Epics:** 1-7 (Foundation through Parent Portal)
**Growth Epics:** 8-9 (Subscription Management, Communication)
**Polish Epic:** 10 (Mobile Optimization & Polish)

**FR Coverage:** All 12 functional requirement areas covered
**NFR Coverage:** Performance, Security, Scalability, Accessibility addressed

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

