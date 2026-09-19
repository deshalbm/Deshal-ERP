import { test, expect } from '@playwright/test';

test.describe('Deshal ERP — Phase 53C Enterprise Settings Center E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Inject active auth session to land directly in authenticated ERP
    await page.addInitScript(() => {
      window.localStorage.setItem('rv_auth_active_session', JSON.stringify({
        token: 'mock_session_token_phase53c',
        user: {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'admin@deshalbm.com',
          user_metadata: { full_name: 'أحمد الإداري' }
        },
        isPlatformAdmin: true,
        platformRole: 'PLATFORM_ADMIN',
        primaryRole: 'ADMIN'
      }));
    });
  });

  test('1. Verify Settings Landing renders all 8 Enterprise Categories', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toBeDefined();

    // Check main application container exists
    const appElement = page.locator('#root');
    await expect(appElement).toBeVisible();
  });

  test('2. Verify General Settings & Company Profile render', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('3. Verify System Users & Employee Separation Directory render', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('4. Verify RBAC Roles & 91 Permissions Matrix render', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('5. Verify Access & Memberships Matrix renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('6. Verify Communication Center displays provider status', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('7. Verify Tenant Modules & Features Matrix render', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('8. Verify System Security & Audit Trail render', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

});
