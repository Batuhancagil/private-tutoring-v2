import { test as base } from '@playwright/test';
import { UserFactory } from './factories/user-factory';

/**
 * Test Fixtures
 * 
 * This file extends Playwright's base test with custom fixtures.
 * Fixtures provide reusable test data and utilities that are automatically
 * cleaned up after each test.
 * 
 * Usage:
 *   import { test, expect } from '../support/fixtures';
 * 
 *   test('example', async ({ page, userFactory }) => {
 *     const user = await userFactory.createUser();
 *     // ... test code
 *   });
 */

type TestFixtures = {
  userFactory: UserFactory;
};

export const test = base.extend<TestFixtures>({
  /**
   * User Factory Fixture
   * 
   * Provides a factory for creating test users with automatic cleanup.
   * All users created during a test are automatically deleted after the test completes.
   */
  userFactory: async ({}, use) => {
    const factory = new UserFactory();
    await use(factory);
    // Auto-cleanup: Delete all users created during the test
    await factory.cleanup();
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';

