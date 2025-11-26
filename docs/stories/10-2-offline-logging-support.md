# Story 10.2: Offline Logging Support

Status: ready-for-dev

## Story

As a **Student**,
I want **to log progress offline**,
so that **I can log even without internet**.

## Acceptance Criteria

1. **Given** I am offline
   **When** I log my progress
   **Then** log is saved locally
   **And** syncs when connection is restored
   **And** I see offline indicator
   **And** sync happens automatically

2. **Given** I log progress while offline
   **When** I submit the log
   **Then** I see confirmation that log was saved locally
   **And** log appears in my progress view
   **And** I can continue logging offline

3. **Given** I have offline logs pending sync
   **When** connection is restored
   **Then** logs sync automatically
   **And** I see sync status indicator
   **And** I receive confirmation when sync completes

4. **Given** sync fails (server error, network issue)
   **When** I try to sync
   **Then** logs remain in local storage
   **And** sync retries automatically
   **And** I see error message if sync fails repeatedly

## Tasks / Subtasks

- [ ] Task 1: Implement offline detection (AC: #1, #2, #3, #4)
  - [ ] Create `lib/offline-helpers.ts` with offline detection utilities
  - [ ] Use `navigator.onLine` API for online/offline detection
  - [ ] Add event listeners for online/offline events
  - [ ] Create React hook: `useOnlineStatus()` for components
  - [ ] Add offline indicator component

- [ ] Task 2: Implement local storage for offline logs (AC: #1, #2)
  - [ ] Create `lib/offline-storage.ts` for local storage management
  - [ ] Use localStorage or IndexedDB for storing offline logs
  - [ ] Store log data with metadata (timestamp, sync status)
  - [ ] Implement functions: saveLog(), getPendingLogs(), markAsSynced()
  - [ ] Handle storage quota limits

- [ ] Task 3: Update progress logging to support offline (AC: #1, #2)
  - [ ] Update `app/api/student/progress/route.ts` POST handler
  - [ ] Update `components/student/ProgressLogForm.tsx`
  - [ ] Check online status before submitting
  - [ ] If offline: save to local storage, show offline confirmation
  - [ ] If online: submit normally, also check for pending logs to sync
  - [ ] Update UI to show offline status

- [ ] Task 4: Implement sync mechanism (AC: #1, #3, #4)
  - [ ] Create `lib/sync-manager.ts` for sync logic
  - [ ] Detect when connection is restored
  - [ ] Retrieve pending logs from local storage
  - [ ] Submit logs to API in order (preserve order)
  - [ ] Handle sync errors (retry logic)
  - [ ] Mark logs as synced after successful submission
  - [ ] Show sync progress indicator

- [ ] Task 5: Add offline indicator UI (AC: #1, #3)
  - [ ] Create `components/OfflineIndicator.tsx` component
  - [ ] Display offline status banner/indicator
  - [ ] Show sync status when syncing
  - [ ] Show sync success/error messages
  - [ ] Ensure indicator is visible but not intrusive

- [ ] Task 6: Handle sync conflicts (AC: #3, #4)
  - [ ] Detect if log already exists on server (duplicate detection)
  - [ ] Handle conflicts (same date, same assignment)
  - [ ] Implement conflict resolution strategy (last write wins, or merge)
  - [ ] Show conflict resolution UI if needed

- [ ] Task 7: Add offline queue management (AC: #2, #3, #4)
  - [ ] Limit offline queue size (prevent storage overflow)
  - [ ] Add queue management UI (view pending logs)
  - [ ] Allow manual sync trigger
  - [ ] Show queue status (number of pending logs)

- [ ] Task 8: Testing (AC: #1, #2, #3, #4)
  - [ ] Test logging while offline (save to local storage)
  - [ ] Test sync when connection restored
  - [ ] Test sync with multiple pending logs
  - [ ] Test sync error handling and retry
  - [ ] Test conflict resolution
  - [ ] Test offline indicator display
  - [ ] Test on various browsers (localStorage support)
  - [ ] Test storage quota limits

## Dev Notes

### Architecture Patterns and Constraints

- **Offline Storage**: Use localStorage for MVP (simple, sufficient for logs) - can upgrade to IndexedDB later if needed
- **Sync Strategy**: Sync on connection restore + periodic sync attempts - simple queue-based sync
- **Conflict Resolution**: Last write wins for MVP - can enhance later with merge logic
- **Performance**: Sync should be fast and non-blocking - use background sync
- **Browser Support**: localStorage is widely supported - ensure graceful degradation

### Project Structure Notes

- **Helper Library**: `lib/offline-helpers.ts` - new file for offline detection
- **Helper Library**: `lib/offline-storage.ts` - new file for local storage management
- **Helper Library**: `lib/sync-manager.ts` - new file for sync logic
- **Component**: `components/OfflineIndicator.tsx` - new file for offline indicator
- **API Update**: `app/api/student/progress/route.ts` - modify to handle sync
- **Component Update**: `components/student/ProgressLogForm.tsx` - modify to support offline
- **Alignment**: Follows unified project structure - helpers in `lib/`, components in `components/`

### Learnings from Previous Story

**From Story 4-2-daily-question-logging-form (Status: review)**

- **Progress Logging**: `app/api/student/progress/route.ts` already exists - extend with offline support
- **Logging Form**: `components/student/ProgressLogForm.tsx` already exists - extend with offline support
- **Logging Pattern**: Progress logging pattern established - extend for offline capability

[Source: docs/stories/4-2-daily-question-logging-form.md]

### References

- [Source: docs/epics.md#Story-10.2] - Story acceptance criteria and technical notes
- [Source: docs/PRD.md#FR-011] - Mobile-Responsive Design functional requirements (offline support)
- [Source: docs/architecture.md#Mobile-First] - Mobile-first design principles
- [Source: app/api/student/progress/route.ts] - Existing progress logging API to extend
- [Source: components/student/ProgressLogForm.tsx] - Existing logging form to extend

## Dev Agent Record

### Context Reference

- docs/stories/10-2-offline-logging-support.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

