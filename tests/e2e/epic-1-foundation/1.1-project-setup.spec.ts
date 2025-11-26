import { test, expect } from '../../support/fixtures';

/**
 * Epic 1, Story 1.1: Project Setup & Infrastructure
 * 
 * P0 Tests for project setup and infrastructure:
 * - Application builds successfully
 * - Application starts without errors
 * - Health endpoint responds
 * - Basic deployment pipeline works
 */

test.describe('Story 1.1: Project Setup & Infrastructure [P0]', () => {
  test.describe('E2E Tests', () => {
    test('[P0] 1.1-E2E-001: Application builds successfully', async ({ page }) => {
      // Given: Application is built
      // When: Application is accessed
      await page.goto('/');
      
      // Then: Page loads without build errors
      // Check that page loads (not a 500 error)
      const response = await page.goto('/');
      expect(response?.status()).not.toBe(500);
      
      // And: No console errors (build errors would show in console)
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/');
      // Allow some time for page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      // Filter out expected errors (like missing test data) but catch build errors
      const buildErrors = errors.filter(err => 
        err.includes('Module not found') || 
        err.includes('Cannot find module') ||
        err.includes('Build error')
      );
      expect(buildErrors.length).toBe(0);
    });

    test('[P0] 1.1-E2E-002: Application starts without errors', async ({ page }) => {
      // Given: Application is running
      // When: Root page is accessed
      await page.goto('/');
      
      // Then: Page loads successfully
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // And: No fatal errors in console
      const fatalErrors: string[] = [];
      page.on('pageerror', (error) => {
        fatalErrors.push(error.message);
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      // Should not have fatal JavaScript errors
      const criticalErrors = fatalErrors.filter(err => 
        !err.includes('favicon') && // Ignore favicon errors
        !err.includes('404') // Ignore 404 errors for missing assets
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('[P0] 1.1-E2E-003: Application has proper project structure', async ({ page }) => {
      // Given: Application is running
      // When: Checking for key files/pages
      
      // Then: Key pages exist and are accessible
      const pages = [
        { path: '/', name: 'Home page' },
        { path: '/login', name: 'Login page' },
      ];

      for (const { path, name } of pages) {
        const response = await page.goto(path);
        expect(response?.status()).not.toBe(404);
        expect(response?.status()).not.toBe(500);
      }
    });
  });

  test.describe('API Tests', () => {
    test('[P0] 1.1-API-001: Health endpoint responds', async ({ request }) => {
      // Given: Application is running
      // When: GET request to /api/health
      const response = await request.get('/api/health');

      // Then: Returns status (200 if healthy, 500 if database disconnected)
      expect([200, 500]).toContain(response.status());

      // And: Response contains health status
      const body = await response.json();
      expect(body.status).toBeDefined();
      expect(['ok', 'error']).toContain(body.status);
      expect(body.timestamp).toBeDefined();
    });

    test('[P0] 1.1-API-002: Health endpoint returns database status', async ({ request }) => {
      // Given: Application is running
      // When: GET request to /api/health
      const response = await request.get('/api/health');

      // Then: Response contains database status
      const body = await response.json();
      expect(body.database).toBeDefined();
      expect(['connected', 'disconnected']).toContain(body.database);
    });

    test('[P0] 1.1-API-003: Health endpoint returns application status', async ({ request }) => {
      // Given: Application is running
      // When: GET request to /api/health
      const response = await request.get('/api/health');

      // Then: Response contains application status
      const body = await response.json();
      expect(body.application).toBeDefined();
      expect(['healthy', 'unhealthy']).toContain(body.application);
    });

    test('[P0] 1.1-API-004: Health endpoint returns timestamp', async ({ request }) => {
      // Given: Application is running
      // When: GET request to /api/health
      const response = await request.get('/api/health');

      // Then: Response contains timestamp
      const body = await response.json();
      expect(body.timestamp).toBeDefined();
      expect(typeof body.timestamp).toBe('string');
      
      // And: Timestamp is valid ISO format
      const timestamp = new Date(body.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    test('[P0] 1.1-API-005: Health endpoint returns uptime', async ({ request }) => {
      // Given: Application is running
      // When: GET request to /api/health
      const response = await request.get('/api/health');
      const body = await response.json();

      // Then: Response contains uptime (if database is connected)
      if (body.status === 'ok') {
        expect(body.uptime).toBeDefined();
        expect(typeof body.uptime).toBe('number');
        expect(body.uptime).toBeGreaterThanOrEqual(0);
      } else {
        // If database is disconnected, uptime may not be present
        // This is acceptable - the endpoint still responds
        expect(body.status).toBe('error');
      }
    });
  });
});

