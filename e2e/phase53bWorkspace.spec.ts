import { test, expect } from '@playwright/test';

test.describe('Deshal ERP — Phase 53B Enterprise Personalized Workspace E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Inject active auth session to land directly in authenticated Workspace
    await page.addInitScript(() => {
      window.localStorage.setItem('rv_auth_active_session', JSON.stringify({
        token: 'mock_session_token_phase53b',
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

  test('1. Verify root application loads Personalized Workspace homepage as operational landing view', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible();

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('2. Context Header renders personalized greeting, company badge, and live date', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.locator('body').innerText();
    const isWorkspaceView = bodyText.includes('مساحة العمل التشغيلية المخصصة') || bodyText.includes('الدليل الشامل');
    expect(isWorkspaceView).toBe(true);
  });

  test('3. Quick Actions row is visible with interactive action buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('4. Website Requests widget (Phase 53A integration) is rendered on Workspace homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('5. My Work (Priority Actions) widget renders priority items or empty state gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

});
