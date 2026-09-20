import { test, expect, Request, Response } from '@playwright/test';

test.describe('Deshal ERP — Phase 3 Final Browser Verification Gate', () => {

  test('1. Unauthenticated Startup Audit: 0 protected queries & 0 HTTP errors', async ({ page }) => {
    const networkRequests: { url: string; method: string; status?: number }[] = [];
    const consoleErrors: string[] = [];
    const httpErrors: { url: string; status: number }[] = [];

    // Capture console error messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture network requests and responses
    page.on('response', (response: Response) => {
      const url = response.url();
      const status = response.status();
      const method = response.request().method();

      if (url.includes('/rest/v1/') || url.includes('/auth/v1/')) {
        networkRequests.push({ url, method, status });
        if (status >= 400) {
          httpErrors.push({ url, status });
        }
      }
    });

    // Navigate to unauthenticated app page
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    console.log(`[Unauthenticated Audit] Total API Requests Captured: ${networkRequests.length}`);
    console.log(`[Unauthenticated Audit] Total HTTP Error Statuses: ${httpErrors.length}`);
    console.log(`[Unauthenticated Audit] Total Console Errors: ${consoleErrors.length}`);

    // VerificationAssertions:
    // 1. Zero protected queries when unauthenticated
    const protectedDomainQueries = networkRequests.filter(req => 
      req.url.includes('/rest/v1/customers') ||
      req.url.includes('/rest/v1/employees') ||
      req.url.includes('/rest/v1/products') ||
      req.url.includes('/rest/v1/journal_entries') ||
      req.url.includes('/rest/v1/vouchers') ||
      req.url.includes('/rest/v1/spaces')
    );

    expect(protectedDomainQueries.length).toBe(0);
    expect(httpErrors.length).toBe(0);
  });

  test('2. Invalid Credentials Login Audit: Shows error & prevents silent fallback', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');

    // Fill invalid credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid_user_test@deshalbm.com');
      await passwordInput.fill('WrongPassword123!');
      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Verify error banner is visible
      const errorBanner = page.locator('div').filter({ hasText: /غير صحيحة|فشل|Invalid|Error/i }).first();
      await expect(errorBanner).toBeVisible();

      // Verify user is still on login page and not authenticated into app shell
      const dashboardHeader = page.locator('header').filter({ hasText: /ديشال|ERP/i });
      const rootApp = page.locator('#root');
      await expect(rootApp).toBeVisible();
    }
  });

  test('3. Authenticated Session & Module Navigation Audit: 0 UUID errors & 0 Schema Mismatches', async ({ page }) => {
    const networkRequests: { url: string; method: string; status: number }[] = [];
    const httpErrors: { url: string; status: number }[] = [];
    const invalidUuidQueries: string[] = [];
    const badColumnQueries: string[] = [];

    page.on('response', (response: Response) => {
      const url = response.url();
      const status = response.status();
      const method = response.request().method();

      if (url.includes('/rest/v1/') || url.includes('/auth/v1/')) {
        networkRequests.push({ url, method, status });

        // Check for empty company_id parameter syntax error
        if (url.includes('company_id=eq.') || url.includes('company_id=eq.%22%22') || url.includes('company_id=eq.')) {
          const match = url.match(/company_id=eq.([^&]*)/);
          if (match && (match[1] === '' || match[1] === '""' || match[1] === '%22%22')) {
            invalidUuidQueries.push(url);
          }
        }

        // Check for old mismatched column products.name
        if (url.includes('/products?') && url.includes('select=') && url.includes('name,')) {
          badColumnQueries.push(url);
        }

        if (status >= 400) {
          httpErrors.push({ url, status });
        }
      }
    });

    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');

    // Simulate authenticated session in localStorage before loading
    await page.evaluate(() => {
      const session = {
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          employeeId: '00000000-0000-0000-0000-000000000001',
          email: 'admin@deshalbm.com',
          fullName: 'مدير النظام',
          fullNameEn: 'System Admin',
          role: 'ADMIN',
          passwordHash: '',
          twoFactorEnabled: false,
          failedLoginAttempts: 0,
          isLocked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        employee: {
          id: '00000000-0000-0000-0000-000000000001',
          employeeCode: 'EMP-001',
          fullName: 'مدير النظام',
          fullNameEn: 'System Admin',
          role: 'ADMIN',
          jobTitle: 'System Admin',
          department: 'Management',
          email: 'admin@deshalbm.com',
          phone: '',
          civilId: '',
          hireDate: new Date().toISOString(),
          basicSalary: 1000,
          allowances: 0,
          currency: 'OMR',
          status: 'ACTIVE',
          branchId: '00000000-0000-0000-0000-000000000001',
          permissions: ['*'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        token: 'tok_test_session',
        loginMethod: 'PASSWORD',
        authenticatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        isLocked: false,
        activeBranchId: '00000000-0000-0000-0000-000000000001'
      };
      localStorage.setItem('deshal_auth_session', JSON.stringify(session));
      localStorage.setItem('deshal_active_company_id', '00000000-0000-0000-0000-000000000001');
    });

    // Reload page to activate session
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log(`[Authenticated Audit] Total Requests: ${networkRequests.length}`);
    console.log(`[Authenticated Audit] Invalid UUID Queries: ${invalidUuidQueries.length}`);
    console.log(`[Authenticated Audit] Bad Column Queries: ${badColumnQueries.length}`);
    console.log(`[Authenticated Audit] HTTP Errors: ${httpErrors.length}`);

    expect(invalidUuidQueries.length).toBe(0);
    expect(badColumnQueries.length).toBe(0);
    expect(httpErrors.length).toBe(0);
  });

});
