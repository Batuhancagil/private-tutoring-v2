/**
 * Authentication Helpers
 * 
 * Utility functions for handling authentication in tests.
 * Provides login/logout helpers and session management.
 * 
 * Usage:
 *   import { loginAsTeacher, logout } from '../helpers/auth-helpers';
 * 
 *   test('example', async ({ page }) => {
 *     await loginAsTeacher(page);
 *     // ... test authenticated flow
 *   });
 */

import { Page } from '@playwright/test';

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login as a specific user
 * 
 * @param page - Playwright page object
 * @param credentials - User email and password
 */
export async function login(page: Page, credentials: LoginCredentials): Promise<void> {
  await page.goto('/login');
  
  // Wait for login form to be visible
  await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
  
  // Fill in credentials
  await page.fill('[data-testid="email-input"]', credentials.email);
  await page.fill('[data-testid="password-input"]', credentials.password);
  
  // Submit form
  await page.click('[data-testid="login-button"]');
  
  // Wait for navigation after login (adjust selector based on your app)
  await page.waitForURL(/\/dashboard|\/teacher\/dashboard|\/student\/dashboard|\/parent\/dashboard/, {
    timeout: 15000,
  });
}

/**
 * Login as admin user
 * 
 * Uses credentials from environment variables or defaults.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const credentials: LoginCredentials = {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'adminpassword123',
  };
  await login(page, credentials);
}

/**
 * Login as teacher user
 */
export async function loginAsTeacher(page: Page): Promise<void> {
  const credentials: LoginCredentials = {
    email: process.env.TEST_TEACHER_EMAIL || 'teacher@example.com',
    password: process.env.TEST_TEACHER_PASSWORD || 'teacherpassword123',
  };
  await login(page, credentials);
}

/**
 * Login as student user
 */
export async function loginAsStudent(page: Page): Promise<void> {
  const credentials: LoginCredentials = {
    email: process.env.TEST_STUDENT_EMAIL || 'student@example.com',
    password: process.env.TEST_STUDENT_PASSWORD || 'studentpassword123',
  };
  await login(page, credentials);
}

/**
 * Login as parent user
 */
export async function loginAsParent(page: Page): Promise<void> {
  const credentials: LoginCredentials = {
    email: process.env.TEST_PARENT_EMAIL || 'parent@example.com',
    password: process.env.TEST_PARENT_PASSWORD || 'parentpassword123',
  };
  await login(page, credentials);
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Try multiple logout button selectors
  const logoutSelectors = [
    'button:has-text("Logout")',
    'button:has-text("Sign out")',
    '[data-testid="logout-button"]',
    'button[class*="logout"]',
  ];

  let clicked = false;
  for (const selector of logoutSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        await button.click();
        clicked = true;
        break;
      }
    } catch {
      // Try next selector
    }
  }

  // If no button found, call logout API directly
  if (!clicked) {
    await page.request.post('/api/auth/logout');
  }
  
  // Wait for redirect to login page
  await page.waitForURL(/\/login/, { timeout: 10000 });
}

/**
 * Check if user is logged in
 * 
 * @returns true if user appears to be authenticated
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for presence of authenticated user indicator
    // Adjust selector based on your app's authenticated state indicators
    const userMenu = page.locator('[data-testid="user-menu"]');
    return await userMenu.isVisible({ timeout: 5000 });
  } catch {
    return false;
  }
}

