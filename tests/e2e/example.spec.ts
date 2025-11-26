import { test, expect } from '../support/fixtures';
import { loginAsTeacher, logout } from '../support/helpers/auth-helpers';

/**
 * Example Test Suite
 * 
 * This file demonstrates the test framework patterns:
 * - Using custom fixtures (userFactory)
 * - Authentication helpers
 * - Page object patterns
 * - Test isolation and cleanup
 * 
 * These tests serve as templates for writing your own E2E tests.
 */

test.describe('Example Test Suite', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Assert page title or key element
    // Adjust selector based on your homepage structure
    const title = page.locator('h1').first();
    await expect(title).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click login link/button
    // Adjust selector based on your navigation structure
    const loginLink = page.locator('[data-testid="login-link"]').or(page.getByRole('link', { name: /login/i }));
    
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    } else {
      // If no login link, navigate directly
      await page.goto('/login');
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should create user and login', async ({ page, userFactory }) => {
    // Create test user using factory
    const user = await userFactory.createUser({
      email: 'test-user@example.com',
      name: 'Test User',
      role: 'student',
    });

    // Login with created user
    await page.goto('/login');
    
    // Wait for login form
    await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
    
    // Fill in credentials
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.password || 'testpassword123');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login (adjust selector based on your app)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    
    // Assert login success
    // Adjust selector based on your authenticated state indicators
    const userMenu = page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible({ timeout: 10000 });
  });

  test('should login as teacher using helper', async ({ page }) => {
    // Use authentication helper
    await loginAsTeacher(page);
    
    // Verify we're on teacher dashboard
    await expect(page).toHaveURL(/\/teacher\/dashboard/);
    
    // Verify teacher-specific content is visible
    // Adjust selectors based on your teacher dashboard
    const dashboardTitle = page.locator('h1, h2').first();
    await expect(dashboardTitle).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await loginAsTeacher(page);
    
    // Verify logged in
    const userMenu = page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
    
    // Logout
    await logout(page);
    
    // Verify redirected to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Try to login with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Wait for error message (adjust selector based on your error display)
    const errorMessage = page.locator('[data-testid="error-message"]').or(
      page.getByText(/invalid|error|incorrect/i)
    );
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verify we're still on login page
    await expect(page).toHaveURL(/\/login/);
  });
});

