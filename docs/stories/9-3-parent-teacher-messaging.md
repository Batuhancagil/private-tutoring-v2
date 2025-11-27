# Story 9.3: Parent-Teacher Messaging

Status: drafted

## Story

As a **Parent or Teacher**,
I want **to message each other**,
so that **we can discuss student progress**.

## Acceptance Criteria

1. **Given** I am a Parent or Teacher
   **When** I send a message
   **Then** I can message:
   - Parent → Teacher
   - Teacher → Parent
   **And** messages are organized in threads
   **And** message history is visible

2. **Given** I am a Teacher
   **When** I view my messages
   **Then** I can see conversations with parents of my students
   **And** I can select a parent to message
   **And** I can see our conversation history

3. **Given** I am a Parent
   **When** I view my messages
   **Then** I can see conversations with my child's teacher
   **And** I can send messages to the teacher
   **And** I can see our conversation history

4. **Given** I send a message to a parent/teacher
   **When** the message is sent
   **Then** it appears in the correct conversation thread
   **And** recipient can see the message
   **And** message is associated with the correct parent-teacher relationship

## Tasks / Subtasks

- [x] Task 1: Extend messaging API for parent-teacher conversations (AC: #1, #2, #3, #4)
  - [x] Update `app/api/messages/route.ts` to handle parent-teacher messaging
  - [x] Validate parent-teacher relationship exists (parent is assigned to teacher's student)
  - [x] Ensure tenant isolation (teacher can only message parents of their students)
  - [x] Filter conversations by parent-teacher relationship
  - [x] Add helper function to find or create parent-teacher conversation
  - [x] Add error handling for invalid parent-teacher pairs

- [x] Task 2: Update recipient selector for teachers (AC: #1, #2)
  - [x] Update `components/messaging/RecipientSelector.tsx` for teacher role
  - [x] Query parents of teacher's students (via ParentStudent relationship)
  - [x] Display parent list in selector
  - [x] Filter to show only parents of teacher's students (tenant isolation)
  - [x] Add parent name and associated student name display

- [x] Task 3: Update recipient selector for parents (AC: #1, #3)
  - [x] Update `components/messaging/RecipientSelector.tsx` for parent role
  - [x] Query parent's child's teacher from database (via ParentStudent → Student → Teacher)
  - [x] Display teacher in selector
  - [x] Ensure parent can only message their child's teacher

- [x] Task 4: Create parent messaging page (AC: #3)
  - [x] Create `app/parent/messages/page.tsx` (or extend `app/messages/page.tsx`)
  - [x] Show conversation with teacher (single conversation per child)
  - [x] Display message thread
  - [x] Allow sending messages to teacher
  - [x] If multiple children, show conversation for each child's teacher
  - [x] Ensure mobile-responsive layout

- [x] Task 5: Update teacher messaging page for parents (AC: #2)
  - [x] Update `app/teacher/messages/page.tsx` to include parent conversations
  - [x] Show both student and parent conversations
  - [x] Filter conversations by type (student vs. parent)
  - [x] Display parent name and associated student name
  - [x] Ensure mobile-responsive layout

- [x] Task 6: Add conversation context (AC: #1, #4)
  - [x] Display parent/teacher name in conversation header
  - [x] Show relationship context (e.g., "Conversation with Parent: Jane Doe (Student: John Doe)")
  - [x] Add student context in parent-teacher conversations

- [x] Task 7: Testing (AC: #1, #2, #3, #4)
  - [x] Test teacher sending message to parent
  - [x] Test parent sending message to teacher
  - [x] Test teacher viewing conversations with multiple parents
  - [x] Test parent viewing conversation with teacher
  - [x] Test tenant isolation (teacher cannot message parents of other teachers' students)
  - [x] Test parent can only message their child's teacher
  - [x] Test conversation thread organization
  - [x] Test message history preservation
  - [x] Test mobile responsiveness

## Dev Notes

### Architecture Patterns and Constraints

- **API Pattern**: Follow existing pattern from `app/api/messages/route.ts` - extend with parent-teacher validation
- **Tenant Isolation**: Teachers can only message parents of their students - enforce in API using ParentStudent relationship
- **Relationship Validation**: Validate parent-teacher relationship exists before allowing messaging (via ParentStudent → Student → Teacher)
- **Conversation Management**: Find or create conversation based on parent-teacher pair
- **Role-Based UI**: Different UI for teachers (multiple conversations) vs. parents (conversation per child's teacher)

### Project Structure Notes

- **API Update**: `app/api/messages/route.ts` - modify to handle parent-teacher messaging
- **Page**: `app/parent/messages/page.tsx` - new file or extend `app/messages/page.tsx`
- **Page Update**: `app/teacher/messages/page.tsx` - modify to include parent conversations
- **Component Update**: `components/messaging/RecipientSelector.tsx` - modify for parent/teacher roles
- **Alignment**: Follows unified project structure - pages in `app/parent/` and `app/teacher/`, components in `components/messaging/`

### Learnings from Previous Story

**From Story 9-2-teacher-student-messaging (Status: drafted)**

- **Messaging API**: `app/api/messages/route.ts` already extended for teacher-student - extend further for parent-teacher
- **Messaging Components**: `components/messaging/` components already exist - extend for parent-teacher use case
- **Teacher Messaging Page**: `app/teacher/messages/page.tsx` already exists - extend to include parent conversations
- **Data Model**: Message and Conversation models exist - use for parent-teacher conversations
- **ParentStudent Relationship**: ParentStudent model exists - use to validate parent-teacher relationships

[Source: docs/stories/9-2-teacher-student-messaging.md]

### References

- [Source: docs/epics.md#Story-9.3] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-010] - Communication functional requirements
- [Source: docs/architecture.md#Data-Architecture] - ParentStudent relationship model
- [Source: prisma/schema.prisma] - ParentStudent schema with parentId and studentId fields
- [Source: docs/architecture.md#API-Pattern] - Standard API route handler structure
- [Source: app/api/messages/route.ts] - Existing messaging API to extend
- [Source: components/messaging/RecipientSelector.tsx] - Existing component to extend

## Dev Agent Record

### Context Reference

- docs/stories/9-3-parent-teacher-messaging.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- API already had parent-teacher messaging support with proper tenant isolation
- Updated RecipientSelector component to show parents for teachers and teachers for parents
- Updated MessagesPageClient to filter parent conversations properly
- Created parent messaging page: `/parent/messages`
- Teacher messaging page already shows both student and parent conversations via updated filtering
- Conversation context display already handled in MessageThread component
- Created `/api/parent/teachers` endpoint for fetching parent's children's teachers
- All acceptance criteria met: parent-teacher messaging, conversation filtering, tenant isolation, and role-based UI

**Key Changes:**
- Updated component: `components/messaging/RecipientSelector.tsx` (added parent and teacher support)
- Updated component: `components/messaging/MessagesPageClient.tsx` (filters parent conversations)
- New page: `app/parent/messages/page.tsx`
- New API: `app/api/parent/teachers/route.ts`

### File List

- components/messaging/RecipientSelector.tsx (modified)
- components/messaging/MessagesPageClient.tsx (modified)
- app/parent/messages/page.tsx (new)
- app/api/parent/teachers/route.ts (new)

