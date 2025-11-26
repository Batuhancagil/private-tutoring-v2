# Test Suite Documentation

This directory contains the end-to-end (E2E) test suite for the Private Tutoring Dashboard Platform.

## Overview

The test suite uses **Playwright** for browser automation and E2E testing. Tests are organized using a fixture-based architecture with data factories and helper utilities for maintainable, isolated tests.

## Architecture

### Directory Structure

```
tests/
├── e2e/                          # E2E test files (*.spec.ts)
├── support/                      # Test infrastructure
│   ├── fixtures/                 # Test fixtures and factories
│   │   ├── index.ts             # Main fixture definitions
│   │   └── factories/           # Data factories (user-factory.ts)
│   ├── helpers/                 # Utility functions
│   │   └── auth-helpers.ts      # Authentication helpers
│   └── page-objects/            # Page Object Models (optional)
└── README.md                     # This file
```

### Key Patterns

#### 1. Fixture Architecture

Fixtures provide reusable test data and utilities with automatic cleanup:

```typescript
import { test, expect } from '../support/fixtures';

test('example', async ({ page, userFactory }) => {
  const user = await userFactory.createUser();
  // Test code...
  // User is automatically cleaned up after test
});
```

#### 2. Data Factories

Factories create realistic test data using Faker.js:

```typescript
const user = await userFactory.createUser({
  email: 'custom@example.com',
  role: 'teacher',
});
```

#### 3. Authentication Helpers

Pre-built helpers for common authentication flows:

```typescript
import { loginAsTeacher, logout } from '../support/helpers/auth-helpers';

test('example', async ({ page }) => {
  await loginAsTeacher(page);
  // Test authenticated flow...
  await logout(page);
});
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install Playwright and all required dependencies, including:
- `@playwright/test` - Playwright test framework
- `@faker-js/faker` - Test data generation

### 2. Install Playwright Browsers

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers required for testing.

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your test environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your test credentials:
- `BASE_URL` - Your application URL (default: http://localhost:3000)
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password
- Other role-specific credentials as needed

### 4. Start Your Application

Before running tests, ensure your application is running:

```bash
npm run dev
```

Or tests will automatically start the dev server (configured in `playwright.config.ts`).

## Running Tests

### Basic Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Advanced Usage

```bash
# Run specific test file
npx playwright test tests/e2e/example.spec.ts

# Run tests matching a pattern
npx playwright test --grep "login"

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests with specific timeout
npx playwright test --timeout=120000

# Run tests in parallel (default)
npx playwright test --workers=4

# Run tests sequentially
npx playwright test --workers=1
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../support/fixtures';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Using Fixtures

```typescript
import { test, expect } from '../support/fixtures';

test('should create and use test user', async ({ page, userFactory }) => {
  // Create test user
  const user = await userFactory.createUser({ role: 'student' });
  
  // Use user in test
  await page.goto(`/users/${user.id}`);
  await expect(page.locator('[data-testid="user-name"]')).toContainText(user.name);
  
  // User is automatically cleaned up after test
});
```

### Using Authentication Helpers

```typescript
import { test, expect } from '../support/fixtures';
import { loginAsTeacher, logout } from '../support/helpers/auth-helpers';

test('should access teacher dashboard', async ({ page }) => {
  await loginAsTeacher(page);
  await expect(page).toHaveURL(/\/teacher\/dashboard/);
  await logout(page);
});
```

## Best Practices

### 1. Selector Strategy

**Always use `data-testid` attributes** for UI elements:

```typescript
// ✅ Good
await page.click('[data-testid="submit-button"]');

// ❌ Bad - Brittle CSS selectors
await page.click('.btn-primary');
```

Add `data-testid` attributes to your components:

```tsx
<button data-testid="submit-button">Submit</button>
```

### 2. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
// ✅ Good - Each test is independent
test('test 1', async ({ page, userFactory }) => {
  const user = await userFactory.createUser();
  // Test code...
});

test('test 2', async ({ page, userFactory }) => {
  const user = await userFactory.createUser();
  // Test code...
});

// ❌ Bad - Tests depend on each other
let sharedUser;
test('test 1', async () => {
  sharedUser = await createUser();
});

test('test 2', async () => {
  // Uses sharedUser - fragile!
});
```

### 3. Explicit Assertions

Always include explicit assertions:

```typescript
// ✅ Good
await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

// ❌ Bad - Implicit assertion
await page.locator('[data-testid="success-message"]').click(); // Assumes it exists
```

### 4. Deterministic Waiting

Use Playwright's built-in waiting mechanisms:

```typescript
// ✅ Good - Waits automatically
await page.click('[data-testid="button"]');
await expect(page.locator('[data-testid="result"]')).toBeVisible();

// ❌ Bad - Arbitrary delays
await page.click('[data-testid="button"]');
await page.waitForTimeout(5000); // Unreliable!
```

### 5. Test Length Limits

Keep tests focused and under 60 seconds:

- **Unit tests**: < 1 second
- **Integration tests**: < 10 seconds
- **E2E tests**: < 60 seconds (configurable in `playwright.config.ts`)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: test-results/
```

### Railway CI/CD

Tests run automatically on deployment. Configure in `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build && npm run test:e2e"
  }
}
```

## Test Reports

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

This opens an interactive report showing:
- Test results (passed/failed)
- Screenshots on failure
- Videos on failure
- Trace files for debugging

Reports are saved to `test-results/html/` directory.

## Debugging Failed Tests

### 1. Use UI Mode

```bash
npm run test:e2e:ui
```

This opens Playwright's interactive UI where you can:
- Step through tests
- Inspect page state
- View network requests
- See console logs

### 2. Use Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### 3. View Artifacts

Failed tests automatically capture:
- **Screenshots**: `test-results/` directory
- **Videos**: `test-results/` directory (if enabled)
- **Traces**: `test-results/` directory (Playwright trace viewer)

### 4. Check Logs

Enable verbose logging:

```bash
DEBUG=pw:api npx playwright test
```

## Knowledge Base References

For advanced testing patterns, refer to:

- **Fixture Architecture**: Pure function → fixture → `mergeTests` composition with auto-cleanup
- **Data Factories**: Faker-based factories with overrides, nested factories, API seeding
- **Network-First Testing**: Intercept before navigate, HAR capture, deterministic waiting
- **Playwright Configuration**: Environment-based config, timeout standards, artifact output
- **Test Quality**: Deterministic, isolated with cleanup, explicit assertions, length/time limits

## Troubleshooting

### Tests Fail with "Browser not found"

```bash
npx playwright install
```

### Tests Timeout

- Check if your application is running
- Verify `BASE_URL` in `.env` is correct
- Increase timeout in `playwright.config.ts` if needed

### Authentication Fails

- Verify test credentials in `.env`
- Check if test users exist in your database
- Ensure authentication endpoints are working

### Flaky Tests

- Avoid `waitForTimeout()` - use explicit waits instead
- Ensure tests are isolated (no shared state)
- Check for race conditions in async operations
- Use `test.step()` for complex flows

## Next Steps

1. **Write Your First Test**: Copy `tests/e2e/example.spec.ts` and modify for your features
2. **Add Data Test IDs**: Update your components with `data-testid` attributes
3. **Create Page Objects**: For complex pages, create page object models in `tests/support/page-objects/`
4. **Expand Factories**: Add more factories for other entities (lessons, assignments, etc.)
5. **Set Up CI/CD**: Integrate tests into your deployment pipeline

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Faker.js Documentation](https://fakerjs.dev/)
- [Test Architecture Knowledge Base](.bmad/bmm/testarch/knowledge/)

---

**Questions or Issues?** Contact the development team or refer to the project's architecture documentation.

