# Test Implementation Plan - Epics 1-6

**Date:** 2025-11-26  
**Status:** Framework Ready ✅  
**Next Phase:** P0 Test Implementation  
**Framework:** Playwright (configured and ready)

---

## Framework Status ✅

**Test Framework:** Playwright v1.48.0  
**Configuration:** `playwright.config.ts` ✅  
**Test Infrastructure:** ✅ Ready
- Fixtures: `tests/support/fixtures/` ✅
- Helpers: `tests/support/helpers/` ✅
- Factories: `tests/support/fixtures/factories/` ✅
- Example Tests: `tests/e2e/example.spec.ts` ✅

**Test Scripts Available:**
- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Interactive UI mode
- `npm run test:e2e:headed` - Headed mode
- `npm run test:e2e:debug` - Debug mode
- `npm run test:e2e:report` - View test report

---

## Implementation Priority

Based on the traceability assessment, implement tests in this order:

### Phase 1: P0 Critical Tests (Weeks 1-2) ⚠️ **BLOCKING**

**Goal:** Implement all P0 tests to unblock production deployment

#### Week 1: Foundation & Security (Epic 1)

**Day 1-2: Authentication & Security**
- [ ] `1.3-E2E-001` - User can login with valid credentials
- [ ] `1.3-E2E-002` - User sees error for invalid credentials
- [ ] `1.3-E2E-003` - User receives secure session token
- [ ] `1.3-E2E-004` - User redirected to role-specific dashboard
- [ ] `1.3-API-001` - POST `/api/auth/login` with valid credentials
- [ ] `1.3-API-002` - POST `/api/auth/login` with invalid credentials
- [ ] `1.3-API-003` - POST `/api/auth/login` rate limiting
- [ ] `1.3-API-004` - POST `/api/auth/logout` invalidates session
- [ ] `1.4-E2E-001` - Teacher cannot access Superadmin features
- [ ] `1.4-E2E-002` - Student cannot access Teacher features
- [ ] `1.4-API-001` - Teacher accessing `/api/admin/*` returns 403
- [ ] `1.4-API-002` - Student accessing `/api/teacher/*` returns 403
- [ ] `1.6-E2E-001` - Application enforces HTTPS
- [ ] `1.6-API-001` - Security headers present

**Day 3-4: Database & Tenant Isolation**
- [ ] `1.2-E2E-001` - Database connection succeeds
- [ ] `1.2-E2E-002` - Migrations run successfully
- [ ] `1.2-E2E-003` - Tenant isolation at database level
- [ ] `1.2-API-001` - Tenant-scoped queries return only teacher's data
- [ ] `1.2-API-002` - Superadmin can access all tenants
- [ ] `1.2-API-003` - Teacher cannot access other teachers' data

**Day 5: Health & Monitoring**
- [ ] `1.7-API-001` - GET `/api/health` returns database status
- [ ] `1.7-API-002` - GET `/api/health` returns application status
- [ ] `1.1-E2E-001` - Application builds successfully
- [ ] `1.1-E2E-002` - Application starts without errors
- [ ] `1.1-API-001` - Health endpoint responds

#### Week 2: Core Features (Epics 2-4)

**Day 1-2: User & Resource Management (Epic 2)**
- [ ] `2.1-E2E-001` - Superadmin creates teacher account
- [ ] `2.1-API-001` - POST `/api/admin/teachers` creates teacher
- [ ] `2.1-API-005` - Non-superadmin accessing endpoint returns 403
- [ ] `2.2-E2E-001` - Teacher creates student
- [ ] `2.2-API-001` - POST `/api/teacher/students` creates student
- [ ] `2.2-API-002` - GET `/api/teacher/students` returns only teacher's students
- [ ] `2.2-API-003` - Teacher cannot access other teacher's students
- [ ] `2.4-E2E-001` - Teacher creates lesson
- [ ] `2.4-E2E-002` - Teacher adds topic to lesson
- [ ] `2.4-E2E-003` - Teacher adds resource to topic
- [ ] `2.4-API-001` - POST `/api/teacher/lessons` creates lesson
- [ ] `2.4-API-002` - POST `/api/teacher/topics` creates topic
- [ ] `2.4-API-003` - POST `/api/teacher/resources` creates resource

**Day 3-4: Timeline & Assignments (Epic 3)**
- [ ] `3.1-E2E-001` - Teacher creates assignment
- [ ] `3.1-E2E-002` - End date calculated correctly
- [ ] `3.1-API-001` - POST `/api/teacher/assignments` creates assignment
- [ ] `3.1-API-002` - End date calculation logic correct
- [ ] `3.2-E2E-001` - Timeline displays assignments as bars
- [ ] `3.2-E2E-002` - Multiple students' assignments visible
- [ ] `3.2-E2E-003` - Daily/weekly/monthly view switching works
- [ ] `3.3-E2E-001` - Teacher drags assignment → dates update
- [ ] `3.3-E2E-002` - End date recalculates after drag

**Day 5: Daily Logging (Epic 4)**
- [ ] `4.1-E2E-001` - Student sees today's assigned topic
- [ ] `4.1-API-001` - GET `/api/student/assignments` returns today's assignment
- [ ] `4.2-E2E-001` - Student logs right/wrong/empty counts
- [ ] `4.2-E2E-002` - Form validates input (max 1000/day)
- [ ] `4.2-API-001` - POST `/api/student/progress` creates progress log
- [ ] `4.2-API-002` - Input validation enforced

---

### Phase 2: P0 Progress & Dashboard (Week 3) ⚠️ **BLOCKING**

**Goal:** Complete P0 tests for progress calculation and teacher dashboard (THE MAGIC MOMENT)

**Epic 5: Progress Calculation**
- [ ] `5.1-E2E-001` - Accuracy calculated correctly
- [ ] `5.1-E2E-002` - Calculation updates in real-time (< 500ms)
- [ ] `5.1-API-001` - GET `/api/teacher/progress/[student_id]/[topic_id]` returns accuracy
- [ ] `5.1-UNIT-001` - Accuracy formula correct
- [ ] `5.2-API-001` - Lesson accuracy = average of topic accuracies
- [ ] `5.2-UNIT-001` - Aggregation logic correct
- [ ] `5.3-E2E-001` - Both metrics displayed together
- [ ] `5.3-API-001` - Dual metrics calculated correctly
- [ ] `5.4-E2E-001` - Green displayed for accuracy ≥ threshold
- [ ] `5.4-E2E-002` - Yellow displayed for threshold-5% to threshold
- [ ] `5.4-E2E-003` - Red displayed for accuracy < threshold-5%
- [ ] `5.6-E2E-001` - Alert generated when accuracy < threshold
- [ ] `5.6-E2E-002` - Alert visible to teacher
- [ ] `5.6-API-001` - GET `/api/teacher/alerts` returns low accuracy alerts

**Epic 6: Teacher Dashboard (THE MAGIC MOMENT)**
- [ ] `6.1-E2E-001` - Dashboard loads in < 2 seconds
- [ ] `6.1-API-001` - GET `/api/teacher/dashboard` returns data quickly
- [ ] `6.2-E2E-001` - Green displayed for students on track
- [ ] `6.2-E2E-002` - Yellow displayed for students needing attention
- [ ] `6.2-E2E-003` - Red displayed for students struggling
- [ ] `6.2-E2E-004` - Colors update in real-time
- [ ] `6.3-E2E-001` - Click student → detail view opens
- [ ] `6.3-E2E-002` - Detailed progress metrics displayed
- [ ] `6.3-API-001` - GET `/api/teacher/students/[id]` returns detailed progress
- [ ] `6.4-E2E-001` - Progress grouped by lessons
- [ ] `6.4-E2E-002` - Topics within each lesson displayed
- [ ] `6.5-E2E-001` - Teacher changes threshold → alerts update
- [ ] `6.5-E2E-002` - Teacher changes threshold → color coding updates
- [ ] `6.5-API-001` - PUT `/api/teacher/preferences` updates threshold

---

### Phase 3: P1 High Priority Tests (Week 4)

**Goal:** Implement P1 tests for PR quality gates

**Epic 1: UI Framework**
- [ ] `1.5-E2E-001` - Navigation displays correctly for each role
- [ ] `1.5-E2E-002` - Responsive layout works on mobile/tablet/desktop
- [ ] `1.5-COMP-001` - Navigation component renders correctly

**Epic 2: Resource Management**
- [ ] `2.3-E2E-001` - Teacher assigns parent to student
- [ ] `2.3-API-001` - POST `/api/teacher/students/[id]/parents` creates relationship
- [ ] `2.5-E2E-001` - Superadmin adds resource to library
- [ ] `2.5-API-001` - POST `/api/admin/resources` creates pre-built resource

**Epic 3: Timeline Features**
- [ ] `3.4-E2E-001` - Calendar view displays monthly grid
- [ ] `3.4-E2E-002` - Assignments shown on correct dates
- [ ] `3.5-E2E-001` - Teacher views past assignments
- [ ] `3.6-E2E-001` - Teacher enables exam mode → dates locked

**Epic 4: Logging Features**
- [ ] `4.3-E2E-001` - Student selects past date → sees that day's assignment
- [ ] `4.4-E2E-001` - Mobile interface loads in < 1 second
- [ ] `4.5-E2E-001` - Bonus questions tracked separately

**Epic 5: Visualization**
- [ ] `5.5-E2E-001` - Progress bars display correctly

---

## Test File Organization

### Recommended Structure

```
tests/
├── e2e/
│   ├── epic-1-foundation/
│   │   ├── 1.3-authentication.spec.ts
│   │   ├── 1.4-rbac.spec.ts
│   │   ├── 1.6-security.spec.ts
│   │   └── 1.7-health.spec.ts
│   ├── epic-2-users-resources/
│   │   ├── 2.1-teacher-accounts.spec.ts
│   │   ├── 2.2-student-accounts.spec.ts
│   │   └── 2.4-resources.spec.ts
│   ├── epic-3-timeline/
│   │   ├── 3.1-assignments.spec.ts
│   │   ├── 3.2-timeline-view.spec.ts
│   │   └── 3.3-drag-drop.spec.ts
│   ├── epic-4-logging/
│   │   ├── 4.1-todays-assignment.spec.ts
│   │   └── 4.2-daily-logging.spec.ts
│   ├── epic-5-progress/
│   │   ├── 5.1-accuracy-calculation.spec.ts
│   │   ├── 5.3-dual-metrics.spec.ts
│   │   └── 5.6-alerts.spec.ts
│   └── epic-6-dashboard/
│       ├── 6.1-dashboard-layout.spec.ts
│       ├── 6.2-color-coded-list.spec.ts
│       └── 6.3-student-detail.spec.ts
├── api/
│   ├── epic-1/
│   │   ├── auth.spec.ts
│   │   └── health.spec.ts
│   ├── epic-2/
│   │   ├── teachers.spec.ts
│   │   └── students.spec.ts
│   └── epic-5/
│       └── progress.spec.ts
├── unit/
│   ├── epic-1/
│   │   └── auth-service.spec.ts
│   └── epic-5/
│       └── progress-calculator.spec.ts
└── support/
    ├── fixtures/
    ├── helpers/
    └── page-objects/
```

---

## Test Implementation Guidelines

### 1. Test Naming Convention

Use the format: `{STORY_ID}-{TEST_LEVEL}-{SEQUENCE}`

Examples:
- `1.3-E2E-001` - Epic 1, Story 3, E2E test #1
- `5.1-API-002` - Epic 5, Story 1, API test #2
- `6.2-UNIT-001` - Epic 6, Story 2, Unit test #1

### 2. Test Structure

```typescript
import { test, expect } from '../support/fixtures';
import { loginAsTeacher } from '../support/helpers/auth-helpers';

test.describe('Story 1.3: Authentication System', () => {
  test('[P0] 1.3-E2E-001: User can login with valid credentials', async ({ page, userFactory }) => {
    // Given: User account exists
    const user = await userFactory.createUser({
      role: 'teacher',
      email: 'teacher@example.com',
    });

    // When: User enters username and password
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.password);
    await page.click('[data-testid="login-button"]');

    // Then: User is authenticated and redirected to dashboard
    await expect(page).toHaveURL(/\/teacher\/dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

### 3. Priority Tagging

Include priority in test name: `[P0]`, `[P1]`, `[P2]`, `[P3]`

### 4. Given-When-Then Comments

Always include Given-When-Then structure in comments for clarity.

### 5. Data Test IDs

Use `data-testid` attributes (not CSS classes) for selectors.

---

## Next Steps

### Immediate (Today)

1. **Review Test Infrastructure**
   - ✅ Framework configured
   - ✅ Fixtures ready
   - ✅ Helpers ready
   - ⚠️ Need: More factories (lessons, assignments, progress logs)
   - ⚠️ Need: More helpers (API helpers, page objects)

2. **Add Missing Test Infrastructure**
   - Create `assignment-factory.ts`
   - Create `progress-log-factory.ts`
   - Create `lesson-factory.ts`
   - Create API test helpers
   - Create page objects for complex pages

3. **Start P0 Test Implementation**
   - Begin with Epic 1, Story 1.3 (Authentication)
   - Follow test naming convention
   - Use Given-When-Then structure
   - Tag with [P0] priority

### This Week

1. **Complete Epic 1 P0 Tests**
   - Authentication (Story 1.3)
   - RBAC (Story 1.4)
   - Security (Story 1.6)
   - Health (Story 1.7)

2. **Run Tests and Fix Issues**
   - Run `npm run test:e2e` after each story
   - Fix any failures
   - Ensure all P0 tests pass

3. **Update Traceability Matrix**
   - Mark implemented tests as FULL coverage
   - Update coverage percentages
   - Re-run quality gate assessment

### Next Week

1. **Complete Epic 2-4 P0 Tests**
2. **Complete Epic 5-6 P0 Tests**
3. **Re-run Quality Gate**
4. **Target: PASS decision**

---

## Success Criteria

### Phase 1 Complete When:
- ✅ All Epic 1 P0 tests implemented and passing
- ✅ All Epic 2-4 P0 tests implemented and passing
- ✅ P0 coverage ≥ 100%
- ✅ All P0 tests pass in CI/CD

### Phase 2 Complete When:
- ✅ All Epic 5-6 P0 tests implemented and passing
- ✅ Quality gate decision: PASS
- ✅ Ready for production deployment

### Phase 3 Complete When:
- ✅ All P1 tests implemented and passing
- ✅ P1 coverage ≥ 90%
- ✅ Overall coverage ≥ 80%

---

## Resources

- **Test Assessment:** `docs/test-assessment-epics-1-6-2025-11-26.md`
- **Epic Breakdown:** `docs/epics.md`
- **Test Framework Docs:** `tests/README.md`
- **Playwright Config:** `playwright.config.ts`
- **Example Tests:** `tests/e2e/example.spec.ts`

---

**Status:** Framework Ready ✅  
**Next Action:** Implement Epic 1, Story 1.3 P0 tests  
**Target Date:** Week 1, Day 1-2

