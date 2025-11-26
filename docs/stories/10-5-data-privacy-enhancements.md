# Story 10.5: Data Privacy Enhancements

Status: ready-for-dev

## Story

As a **system**,
I want **to ensure complete data privacy**,
so that **student data is protected**.

## Acceptance Criteria

1. **Given** the system is deployed
   **When** data is handled
   **Then** it:
   - Requires parental consent for student accounts (COPPA)
   - Allows student privacy controls
   - Supports data export per tenant (GDPR)
   - Encrypts data properly
   - Maintains data isolation

2. **Given** a student account is created
   **When** the account is set up
   **Then** parental consent is required (if student is under 13)
   **And** consent is recorded
   **And** consent status is tracked

3. **Given** a tenant requests data export
   **When** data export is requested
   **Then** all tenant data is exported
   **And** data is in a standard format (JSON/CSV)
   - **And** export includes all student data, progress logs, assignments, etc.

4. **Given** data is stored or transmitted
   **When** data is handled
   **Then** it is encrypted:
   - Data at rest is encrypted (database encryption)
   - Data in transit is encrypted (HTTPS/TLS)
   - Sensitive data is properly protected

## Tasks / Subtasks

- [ ] Task 1: Implement parental consent workflow (AC: #1, #2)
  - [ ] Add consent fields to Student model (if not exists)
  - [ ] Fields: parentalConsentGiven, consentDate, consentMethod
  - [ ] Create consent form/UI for parents
  - [ ] Add consent validation when creating student accounts
  - [ ] Require consent for students under 13 (COPPA)
  - [ ] Record consent in database
  - [ ] Create migration: `npx prisma migrate dev --name add_parental_consent`

- [ ] Task 2: Implement student privacy controls (AC: #1)
  - [ ] Add privacy settings to Student model (if not exists)
  - [ ] Allow students to control data visibility (if age-appropriate)
  - [ ] Add privacy settings UI (optional, for older students)
  - [ ] Document privacy controls

- [ ] Task 3: Implement data export functionality (AC: #1, #3)
  - [ ] Create `app/api/admin/export/route.ts` with GET handler
  - [ ] Use `withRole('SUPERADMIN')` or `withRole('TEACHER')` for authorization
  - [ ] Export all tenant data (teacher's data):
    - Students
    - Progress logs
    - Assignments
    - Resources
    - Messages (if applicable)
  - [ ] Format data as JSON or CSV
  - [ ] Generate export file
  - [ ] Provide download link
  - [ ] Ensure tenant isolation (only export own data)

- [ ] Task 4: Add data export UI (AC: #3)
  - [ ] Create `components/admin/DataExport.tsx` component
  - [ ] Add "Export Data" button to admin/teacher dashboard
  - [ ] Show export status
  - [ ] Provide download link when export is ready
  - [ ] Ensure mobile-responsive

- [ ] Task 5: Verify data encryption (AC: #1, #4)
  - [ ] Verify database encryption (Railway PostgreSQL encryption)
  - [ ] Verify HTTPS/TLS is enabled (check deployment)
  - [ ] Verify sensitive data handling (passwords hashed, not plain text)
  - [ ] Review data storage practices
  - [ ] Document encryption measures

- [ ] Task 6: Add privacy policy and terms (AC: #1)
  - [ ] Create privacy policy page: `app/privacy/page.tsx`
  - [ ] Create terms of service page: `app/terms/page.tsx`
  - [ ] Add links to privacy policy and terms in footer/login
  - [ ] Ensure policies are accessible

- [ ] Task 7: Implement data retention policies (AC: #1)
  - [ ] Document data retention policy
  - [ ] Add data retention fields to models (if needed)
  - [ ] Implement data deletion workflow (if needed)
  - [ ] Ensure compliance with data retention requirements

- [ ] Task 8: Add privacy compliance documentation (AC: #1, #2, #3, #4)
  - [ ] Document COPPA compliance measures
  - [ ] Document GDPR compliance measures
  - [ ] Document data encryption measures
  - [ ] Document data export process
  - [ ] Create privacy compliance checklist

- [ ] Task 9: Testing (AC: #1, #2, #3, #4)
  - [ ] Test parental consent workflow
  - [ ] Test consent validation
  - [ ] Test data export functionality
  - [ ] Test data export tenant isolation
  - [ ] Test encryption verification
  - [ ] Test privacy controls
  - [ ] Validate compliance measures

## Dev Notes

### Architecture Patterns and Constraints

- **COPPA Compliance**: Require parental consent for students under 13 per [Source: docs/epics.md#Story-10.5]
- **GDPR Compliance**: Support data export per tenant (GDPR right to data portability)
- **Data Encryption**: Verify encryption at rest and in transit per [Source: docs/architecture.md#Security]
- **Tenant Isolation**: Ensure data export respects tenant boundaries
- **Privacy by Design**: Implement privacy measures from the start

### Project Structure Notes

- **Schema Update**: `prisma/schema.prisma` - add consent and privacy fields
- **Migration**: `prisma/migrations/` - create migration for consent fields
- **API Route**: `app/api/admin/export/route.ts` - new file for data export
- **Component**: `components/admin/DataExport.tsx` - new file for export UI
- **Page**: `app/privacy/page.tsx` - new file for privacy policy
- **Page**: `app/terms/page.tsx` - new file for terms of service
- **Alignment**: Follows unified project structure - privacy features integrated consistently

### Learnings from Previous Story

**From Story 1-6-https-security-basics (Status: done)**

- **Security Basics**: HTTPS/TLS encryption already implemented - verify and document
- **Security Patterns**: Security patterns established - extend for privacy

**From Story 2-3-teacher-assigns-parents-to-students (Status: done)**

- **Parent-Student Relationship**: ParentStudent model exists - use for consent workflow
- **Parent Access**: Parent access patterns established - extend for consent

[Source: docs/stories/1-6-https-security-basics.md]
[Source: docs/stories/2-3-teacher-assigns-parents-to-students.md]

### References

- [Source: docs/epics.md#Story-10.5] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-012] - Data Privacy functional requirements
- [Source: docs/architecture.md#Security] - Security and encryption guidelines
- [Source: prisma/schema.prisma] - Database schema to update
- [Source: docs/architecture.md#API-Pattern] - Standard API route handler structure
- [COPPA Guidelines] - Children's Online Privacy Protection Act
- [GDPR Guidelines] - General Data Protection Regulation

## Dev Agent Record

### Context Reference

- docs/stories/10-5-data-privacy-enhancements.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

