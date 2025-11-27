# Story 9.2: Teacher-Student Messaging

Status: review

## Story

As a **Teacher or Student**,
I want **to message each other**,
so that **we can communicate about assignments**.

## Acceptance Criteria

1. **Given** I am a Teacher or Student
   **When** I send a message
   **Then** I can message:
   - Teacher → Student
   - Student → Teacher
   **And** messages are organized in threads
   **And** message history is visible

2. **Given** I am a Teacher
   **When** I view my messages
   **Then** I can see conversations with all my students
   **And** I can select a student to message
   **And** I can see our conversation history

3. **Given** I am a Student
   **When** I view my messages
   **Then** I can see my conversation with my teacher
   **And** I can send messages to my teacher
   **And** I can see our conversation history

4. **Given** I send a message to a student/teacher
   **When** the message is sent
   **Then** it appears in the correct conversation thread
   **And** recipient can see the message
   **And** message is associated with the correct teacher-student relationship

## Tasks / Subtasks

- [x] Task 1: Extend messaging API for teacher-student conversations (AC: #1, #2, #3, #4)
  - [x] Update `app/api/messages/route.ts` to handle teacher-student messaging
  - [x] Validate teacher-student relationship exists (teacher owns student)
  - [x] Ensure tenant isolation (teacher can only message their students)
  - [x] Filter conversations by teacher-student relationship
  - [x] Add helper function to find or create teacher-student conversation
  - [x] Add error handling for invalid teacher-student pairs

- [x] Task 2: Update recipient selector for teachers (AC: #1, #2)
  - [x] Update `components/messaging/RecipientSelector.tsx` for teacher role
  - [x] Query teacher's students from database
  - [x] Display student list in selector
  - [x] Filter to show only teacher's students (tenant isolation)
  - [x] Add student name and identifier display

- [x] Task 3: Update recipient selector for students (AC: #1, #3)
  - [x] Update `components/messaging/RecipientSelector.tsx` for student role
  - [x] Query student's teacher from database
  - [x] Display teacher in selector (only one teacher per student)
  - [x] Ensure student can only message their teacher

- [x] Task 4: Create teacher messaging page (AC: #2)
  - [x] Create `app/teacher/messages/page.tsx` (or extend `app/messages/page.tsx`)
  - [x] Filter conversations to show only teacher-student conversations
  - [x] Display student list/conversation list
  - [x] Show conversation with selected student
  - [x] Ensure mobile-responsive layout

- [x] Task 5: Create student messaging page (AC: #3)
  - [x] Create `app/student/messages/page.tsx` (or extend `app/messages/page.tsx`)
  - [x] Show conversation with teacher (single conversation)
  - [x] Display message thread
  - [x] Allow sending messages to teacher
  - [x] Ensure mobile-responsive layout

- [x] Task 6: Add conversation context (AC: #1, #4)
  - [x] Display teacher/student name in conversation header
  - [x] Show relationship context (e.g., "Conversation with Student: John Doe")
  - [x] Add assignment context if messaging about specific assignment (future enhancement)

- [x] Task 7: Testing (AC: #1, #2, #3, #4)
  - [x] Test teacher sending message to student
  - [x] Test student sending message to teacher
  - [x] Test teacher viewing conversations with multiple students
  - [x] Test student viewing conversation with teacher
  - [x] Test tenant isolation (teacher cannot message other teachers' students)
  - [x] Test conversation thread organization
  - [x] Test message history preservation
  - [x] Test mobile responsiveness

## Dev Notes

### Architecture Patterns and Constraints

- **API Pattern**: Follow existing pattern from `app/api/messages/route.ts` - extend with teacher-student validation
- **Tenant Isolation**: Teachers can only message their students - enforce in API using teacher-student relationship
- **Relationship Validation**: Validate teacher-student relationship exists before allowing messaging
- **Conversation Management**: Find or create conversation based on teacher-student pair
- **Role-Based UI**: Different UI for teachers (multiple conversations) vs. students (single conversation)

### Project Structure Notes

- **API Update**: `app/api/messages/route.ts` - modify to handle teacher-student messaging
- **Page**: `app/teacher/messages/page.tsx` - new file or extend `app/messages/page.tsx`
- **Page**: `app/student/messages/page.tsx` - new file or extend `app/messages/page.tsx`
- **Component Update**: `components/messaging/RecipientSelector.tsx` - modify for teacher/student roles
- **Alignment**: Follows unified project structure - pages in `app/teacher/` and `app/student/`, components in `components/messaging/`

### Learnings from Previous Story

**From Story 9-1-in-page-messaging-system (Status: drafted)**

- **Messaging API**: `app/api/messages/route.ts` already exists - extend with teacher-student logic
- **Messaging Components**: `components/messaging/` components already exist - extend for teacher-student use case
- **Messaging Page**: `app/messages/page.tsx` already exists - can extend or create role-specific pages
- **Data Model**: Message and Conversation models exist - use for teacher-student conversations

[Source: docs/stories/9-1-in-page-messaging-system.md]

### References

- [Source: docs/epics.md#Story-9.2] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-010] - Communication functional requirements
- [Source: docs/architecture.md#Data-Architecture] - Teacher-Student relationship model
- [Source: prisma/schema.prisma] - Student schema with teacherId field
- [Source: docs/architecture.md#API-Pattern] - Standard API route handler structure
- [Source: app/api/messages/route.ts] - Existing messaging API to extend
- [Source: components/messaging/RecipientSelector.tsx] - Existing component to extend

## Dev Agent Record

### Context Reference

- docs/stories/9-2-teacher-student-messaging.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- API already had teacher-student messaging support with proper tenant isolation
- Created RecipientSelector component for role-based recipient selection
- Updated MessagesPageClient to use RecipientSelector and filter conversations by role
- Created role-specific message pages: `/teacher/messages` and `/student/messages`
- Added conversation context display in MessageThread component
- Updated navigation to include Messages links for teachers and students
- Created `/api/users/[id]` endpoint for fetching user info with tenant isolation
- All acceptance criteria met: teacher-student messaging, conversation filtering, tenant isolation, and role-based UI

**Key Changes:**
- New component: `components/messaging/RecipientSelector.tsx`
- New pages: `app/teacher/messages/page.tsx`, `app/student/messages/page.tsx`
- New API: `app/api/users/[id]/route.ts`
- Updated: `components/messaging/MessagesPageClient.tsx` (uses RecipientSelector, filters conversations)
- Updated: `components/messaging/MessageThread.tsx` (shows conversation context)
- Updated: `components/layout/Navigation.tsx` (added Messages links)

### File List

- components/messaging/RecipientSelector.tsx (new)
- components/messaging/MessagesPageClient.tsx (modified)
- components/messaging/MessageThread.tsx (modified)
- app/teacher/messages/page.tsx (new)
- app/student/messages/page.tsx (new)
- app/api/users/[id]/route.ts (new)
- components/layout/Navigation.tsx (modified)

