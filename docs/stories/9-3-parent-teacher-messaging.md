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

- [ ] Task 1: Extend messaging API for parent-teacher conversations (AC: #1, #2, #3, #4)
  - [ ] Update `app/api/messages/route.ts` to handle parent-teacher messaging
  - [ ] Validate parent-teacher relationship exists (parent is assigned to teacher's student)
  - [ ] Ensure tenant isolation (teacher can only message parents of their students)
  - [ ] Filter conversations by parent-teacher relationship
  - [ ] Add helper function to find or create parent-teacher conversation
  - [ ] Add error handling for invalid parent-teacher pairs

- [ ] Task 2: Update recipient selector for teachers (AC: #1, #2)
  - [ ] Update `components/messaging/RecipientSelector.tsx` for teacher role
  - [ ] Query parents of teacher's students (via ParentStudent relationship)
  - [ ] Display parent list in selector
  - [ ] Filter to show only parents of teacher's students (tenant isolation)
  - [ ] Add parent name and associated student name display

- [ ] Task 3: Update recipient selector for parents (AC: #1, #3)
  - [ ] Update `components/messaging/RecipientSelector.tsx` for parent role
  - [ ] Query parent's child's teacher from database (via ParentStudent → Student → Teacher)
  - [ ] Display teacher in selector
  - [ ] Ensure parent can only message their child's teacher

- [ ] Task 4: Create parent messaging page (AC: #3)
  - [ ] Create `app/parent/messages/page.tsx` (or extend `app/messages/page.tsx`)
  - [ ] Show conversation with teacher (single conversation per child)
  - [ ] Display message thread
  - [ ] Allow sending messages to teacher
  - [ ] If multiple children, show conversation for each child's teacher
  - [ ] Ensure mobile-responsive layout

- [ ] Task 5: Update teacher messaging page for parents (AC: #2)
  - [ ] Update `app/teacher/messages/page.tsx` to include parent conversations
  - [ ] Show both student and parent conversations
  - [ ] Filter conversations by type (student vs. parent)
  - [ ] Display parent name and associated student name
  - [ ] Ensure mobile-responsive layout

- [ ] Task 6: Add conversation context (AC: #1, #4)
  - [ ] Display parent/teacher name in conversation header
  - [ ] Show relationship context (e.g., "Conversation with Parent: Jane Doe (Student: John Doe)")
  - [ ] Add student context in parent-teacher conversations

- [ ] Task 7: Testing (AC: #1, #2, #3, #4)
  - [ ] Test teacher sending message to parent
  - [ ] Test parent sending message to teacher
  - [ ] Test teacher viewing conversations with multiple parents
  - [ ] Test parent viewing conversation with teacher
  - [ ] Test tenant isolation (teacher cannot message parents of other teachers' students)
  - [ ] Test parent can only message their child's teacher
  - [ ] Test conversation thread organization
  - [ ] Test message history preservation
  - [ ] Test mobile responsiveness

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

### File List

