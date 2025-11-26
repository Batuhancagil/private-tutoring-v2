# Story 9.2: Teacher-Student Messaging

Status: drafted

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

- [ ] Task 1: Extend messaging API for teacher-student conversations (AC: #1, #2, #3, #4)
  - [ ] Update `app/api/messages/route.ts` to handle teacher-student messaging
  - [ ] Validate teacher-student relationship exists (teacher owns student)
  - [ ] Ensure tenant isolation (teacher can only message their students)
  - [ ] Filter conversations by teacher-student relationship
  - [ ] Add helper function to find or create teacher-student conversation
  - [ ] Add error handling for invalid teacher-student pairs

- [ ] Task 2: Update recipient selector for teachers (AC: #1, #2)
  - [ ] Update `components/messaging/RecipientSelector.tsx` for teacher role
  - [ ] Query teacher's students from database
  - [ ] Display student list in selector
  - [ ] Filter to show only teacher's students (tenant isolation)
  - [ ] Add student name and identifier display

- [ ] Task 3: Update recipient selector for students (AC: #1, #3)
  - [ ] Update `components/messaging/RecipientSelector.tsx` for student role
  - [ ] Query student's teacher from database
  - [ ] Display teacher in selector (only one teacher per student)
  - [ ] Ensure student can only message their teacher

- [ ] Task 4: Create teacher messaging page (AC: #2)
  - [ ] Create `app/teacher/messages/page.tsx` (or extend `app/messages/page.tsx`)
  - [ ] Filter conversations to show only teacher-student conversations
  - [ ] Display student list/conversation list
  - [ ] Show conversation with selected student
  - [ ] Ensure mobile-responsive layout

- [ ] Task 5: Create student messaging page (AC: #3)
  - [ ] Create `app/student/messages/page.tsx` (or extend `app/messages/page.tsx`)
  - [ ] Show conversation with teacher (single conversation)
  - [ ] Display message thread
  - [ ] Allow sending messages to teacher
  - [ ] Ensure mobile-responsive layout

- [ ] Task 6: Add conversation context (AC: #1, #4)
  - [ ] Display teacher/student name in conversation header
  - [ ] Show relationship context (e.g., "Conversation with Student: John Doe")
  - [ ] Add assignment context if messaging about specific assignment (future enhancement)

- [ ] Task 7: Testing (AC: #1, #2, #3, #4)
  - [ ] Test teacher sending message to student
  - [ ] Test student sending message to teacher
  - [ ] Test teacher viewing conversations with multiple students
  - [ ] Test student viewing conversation with teacher
  - [ ] Test tenant isolation (teacher cannot message other teachers' students)
  - [ ] Test conversation thread organization
  - [ ] Test message history preservation
  - [ ] Test mobile responsiveness

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

### File List

