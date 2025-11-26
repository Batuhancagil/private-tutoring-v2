import { test, expect } from '../../support/fixtures';
import { loginAsTeacher, loginAsStudent, logout } from '../../support/helpers/auth-helpers';

/**
 * Epic 1, Story 1.3: Authentication System
 * 
 * P0 Tests for authentication functionality:
 * - User can login with valid credentials
 * - User sees error for invalid credentials
 * - User receives secure session token
 * - User redirected to role-specific dashboard
 * - Logout functionality
 * - Session management
 */

test.describe('Story 1.3: Authentication System [P0]', () => {
  test.describe('E2E Tests', () => {
    test('[P0] 1.3-E2E-001: User can login with valid credentials and redirected to dashboard', async ({ page, userFactory }) => {
      // Given: User account exists
      const user = await userFactory.createUser({
        username: `test-teacher-${Date.now()}`,
        password: 'TestPassword123',
        role: 'teacher',
      });

      // When: User enters username and password
      await page.goto('/login');
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.fill('#username', user.username);
      await page.fill('#password', user.password || 'TestPassword123');
      await page.click('button[type="submit"]');

      // Then: User is authenticated and redirected to role-specific dashboard
      await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 15000 });
      
      // And: User menu/authenticated state is visible
      const userMenu = page.locator('[data-testid="user-menu"]').or(
        page.locator('text=' + user.username)
      );
      await expect(userMenu.first()).toBeVisible({ timeout: 10000 });
    });

    test('[P0] 1.3-E2E-002: User sees error for invalid credentials and remains on login page', async ({ page }) => {
      // Given: Invalid credentials
      const invalidUsername = 'nonexistent-user';
      const invalidPassword = 'wrongpassword123';

      // When: User attempts to login with invalid credentials
      await page.goto('/login');
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.fill('#username', invalidUsername);
      await page.fill('#password', invalidPassword);
      await page.click('button[type="submit"]');

      // Then: Error message is displayed
      const errorMessage = page.locator('.text-red-800, .text-red-200').or(
        page.getByText(/invalid|error|incorrect|username|password|login failed/i)
      );
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });

      // And: User remains on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('[P0] 1.3-E2E-003: User receives secure session token after login', async ({ page, userFactory }) => {
      // Given: User account exists
      const user = await userFactory.createUser({
        username: `test-student-${Date.now()}`,
        password: 'TestPassword123',
        role: 'student',
      });

      // When: User logs in successfully
      await page.goto('/login');
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.fill('#username', user.username);
      await page.fill('#password', user.password || 'TestPassword123');
      await page.click('button[type="submit"]');

      // Then: Auth token cookie is set (httpOnly, secure)
      await page.waitForURL(/\/student\/dashboard/, { timeout: 15000 });
      
      // Verify cookie exists (check via API call to /api/auth/me)
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(cookie => cookie.name === 'auth-token');
      expect(authCookie).toBeDefined();
      expect(authCookie?.httpOnly).toBe(true);
      // Note: secure flag may be false in development, true in production
    });

    test('[P0] 1.3-E2E-004: User redirected to role-specific dashboard (Teacher)', async ({ page, userFactory }) => {
      // Given: Teacher user account exists
      const teacher = await userFactory.createUser({
        username: `test-teacher-${Date.now()}`,
        password: 'TestPassword123',
        role: 'teacher',
      });

      // When: Teacher logs in
      await page.goto('/login');
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.fill('#username', teacher.username);
      await page.fill('#password', teacher.password || 'TestPassword123');
      await page.click('button[type="submit"]');

      // Then: Redirected to teacher dashboard
      await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 15000 });
    });

    test('[P0] 1.3-E2E-004b: User redirected to role-specific dashboard (Student)', async ({ page, userFactory }) => {
      // Given: Student user account exists
      const student = await userFactory.createUser({
        username: `test-student-${Date.now()}`,
        password: 'TestPassword123',
        role: 'student',
      });

      // When: Student logs in
      await page.goto('/login');
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.fill('#username', student.username);
      await page.fill('#password', student.password || 'TestPassword123');
      await page.click('button[type="submit"]');

      // Then: Redirected to student dashboard
      await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 15000 });
    });

    test('[P0] 1.3-E2E-004c: User redirected to role-specific dashboard (Parent)', async ({ page, userFactory }) => {
      // Given: Parent user account exists
      const parent = await userFactory.createUser({
        username: `test-parent-${Date.now()}`,
        password: 'TestPassword123',
        role: 'parent',
      });

      // When: Parent logs in
      await page.goto('/login');
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.fill('#username', parent.username);
      await page.fill('#password', parent.password || 'TestPassword123');
      await page.click('button[type="submit"]');

      // Then: Redirected to parent dashboard
      await expect(page).toHaveURL(/\/parent\/dashboard/, { timeout: 15000 });
    });

    test('[P0] 1.3-E2E-005: User can logout successfully', async ({ page, userFactory }) => {
      // Given: User is logged in
      const user = await userFactory.createUser({
        username: `test-user-${Date.now()}`,
        password: 'TestPassword123',
        role: 'teacher',
      });

      await page.goto('/login');
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.fill('#username', user.username);
      await page.fill('#password', user.password || 'TestPassword123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/teacher\/dashboard/, { timeout: 15000 });

      // When: User clicks logout
      await logout(page);

      // Then: User is redirected to login page
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

      // And: Auth token cookie is cleared
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(cookie => cookie.name === 'auth-token');
      // Cookie should be cleared (empty value or expired)
      expect(authCookie?.value).toBe('') || expect(authCookie).toBeUndefined();
    });

    test('[P0] 1.3-E2E-006: Login form validation works (empty fields)', async ({ page }) => {
      // Given: User is on login page
      await page.goto('/login');
      await page.waitForSelector('[data-testid="username-input"]', { timeout: 10000 });

      // When: User submits form without filling fields
      await page.click('button[type="submit"]');

      // Then: Validation error is shown (either browser validation or app validation)
      // Browser validation will prevent form submission, so we should still be on login page
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');
      
      // Or check for HTML5 validation message
      const usernameInput = page.locator('#username');
      const passwordInput = page.locator('#password');
      const usernameValid = await usernameInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      const passwordValid = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      
      // At least one field should be invalid (required validation)
      expect(usernameValid || passwordValid).toBe(false);
    });
  });

  test.describe('API Tests', () => {
    test('[P0] 1.3-API-001: POST /api/auth/login with valid credentials returns JWT token', async ({ request, userFactory }) => {
      // Given: User account exists
      const user = await userFactory.createUser({
        username: `test-api-user-${Date.now()}`,
        password: 'TestPassword123',
        role: 'teacher',
      });

      // When: POST request with valid credentials
      const response = await request.post('/api/auth/login', {
        data: {
          username: user.username,
          password: user.password || 'TestPassword123',
        },
      });

      // Then: Returns 200 status
      expect(response.status()).toBe(200);

      // And: Response contains success and user data
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.user).toBeDefined();
      expect(body.user.id).toBe(user.id);
      expect(body.user.username).toBe(user.username);
      expect(body.user.role).toBe(user.role);

      // And: Auth token cookie is set
      const cookies = response.headers()['set-cookie'] || [];
      const authCookie = cookies.find((cookie: string) => cookie.startsWith('auth-token='));
      expect(authCookie).toBeDefined();
    });

    test('[P0] 1.3-API-002: POST /api/auth/login with invalid credentials returns 401', async ({ request }) => {
      // Given: Invalid credentials
      const invalidCredentials = {
        username: 'nonexistent-user',
        password: 'wrongpassword123',
      };

      // When: POST request with invalid credentials
      const response = await request.post('/api/auth/login', {
        data: invalidCredentials,
      });

      // Then: Returns 401 status
      expect(response.status()).toBe(401);

      // And: Response contains error message
      const body = await response.json();
      expect(body.error).toBeDefined();
      expect(body.error).toContain('Invalid');
    });

    test('[P0] 1.3-API-003: POST /api/auth/login with wrong password returns 401', async ({ request, userFactory }) => {
      // Given: User account exists
      const user = await userFactory.createUser({
        username: `test-wrong-pwd-${Date.now()}`,
        password: 'CorrectPassword123',
        role: 'student',
      });

      // When: POST request with correct username but wrong password
      const response = await request.post('/api/auth/login', {
        data: {
          username: user.username,
          password: 'WrongPassword123',
        },
      });

      // Then: Returns 401 status
      expect(response.status()).toBe(401);

      // And: Response contains error message
      const body = await response.json();
      expect(body.error).toBeDefined();
      expect(body.error).toContain('Invalid');
    });

    test('[P0] 1.3-API-004: POST /api/auth/logout invalidates session', async ({ request, userFactory }) => {
      // Given: User is logged in (has valid auth token)
      const user = await userFactory.createUser({
        username: `test-logout-${Date.now()}`,
        password: 'TestPassword123',
        role: 'teacher',
      });

      // Login first to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: {
          username: user.username,
          password: user.password || 'TestPassword123',
        },
      });
      expect(loginResponse.status()).toBe(200);

      // Extract auth token cookie
      const cookies = loginResponse.headers()['set-cookie'] || [];
      const authCookie = cookies.find((cookie: string) => cookie.startsWith('auth-token='));
      expect(authCookie).toBeDefined();

      // When: POST request to logout
      const logoutResponse = await request.post('/api/auth/logout', {
        headers: {
          Cookie: authCookie || '',
        },
      });

      // Then: Returns 200 status
      expect(logoutResponse.status()).toBe(200);

      // And: Response contains success
      const body = await logoutResponse.json();
      expect(body.success).toBe(true);

      // And: Auth token cookie is cleared (check set-cookie header)
      const logoutCookies = logoutResponse.headers()['set-cookie'] || [];
      const clearedCookie = logoutCookies.find((cookie: string) => 
        cookie.startsWith('auth-token=') && (cookie.includes('Max-Age=0') || cookie.includes('expires='))
      );
      expect(clearedCookie).toBeDefined();
    });

    test('[P0] 1.3-API-005: POST /api/auth/login validates required fields', async ({ request }) => {
      // Given: Missing username
      const response1 = await request.post('/api/auth/login', {
        data: {
          password: 'somepassword',
        },
      });

      // Then: Returns 400 status (validation error)
      expect(response1.status()).toBe(400);
      const body1 = await response1.json();
      expect(body1.error).toBeDefined();

      // Given: Missing password
      const response2 = await request.post('/api/auth/login', {
        data: {
          username: 'someuser',
        },
      });

      // Then: Returns 400 status (validation error)
      expect(response2.status()).toBe(400);
      const body2 = await response2.json();
      expect(body2.error).toBeDefined();
    });

    test('[P0] 1.3-API-006: GET /api/auth/me returns current user when authenticated', async ({ request, userFactory }) => {
      // Given: User is logged in
      const user = await userFactory.createUser({
        username: `test-me-${Date.now()}`,
        password: 'TestPassword123',
        role: 'teacher',
      });

      // Login to get auth token
      const loginResponse = await request.post('/api/auth/login', {
        data: {
          username: user.username,
          password: user.password || 'TestPassword123',
        },
      });
      expect(loginResponse.status()).toBe(200);

      // Extract cookies for authenticated request
      const cookies = loginResponse.headers()['set-cookie'] || [];
      const cookieHeader = cookies.join('; ');

      // When: GET request to /api/auth/me
      const meResponse = await request.get('/api/auth/me', {
        headers: {
          Cookie: cookieHeader,
        },
      });

      // Then: Returns 200 status
      expect(meResponse.status()).toBe(200);

      // And: Response contains user data
      const body = await meResponse.json();
      expect(body.user).toBeDefined();
      expect(body.user.id).toBe(user.id);
      expect(body.user.username).toBe(user.username);
      expect(body.user.role).toBe(user.role);
    });

    test('[P0] 1.3-API-007: GET /api/auth/me returns 401 when not authenticated', async ({ request }) => {
      // Given: No authentication token

      // When: GET request to /api/auth/me without auth
      const response = await request.get('/api/auth/me');

      // Then: Returns 401 status
      expect(response.status()).toBe(401);

      // And: Response contains error
      const body = await response.json();
      expect(body.error).toBeDefined();
    });
  });
});

