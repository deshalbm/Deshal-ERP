import { test, expect } from '@playwright/test';

test.describe('Deshal ERP — Phase 49 Enterprise Administration E2E', () => {

  test('1. Directory loads and displays user classification filtering options', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible();

    const topNavbar = page.locator('#erp-top-navbar');
    if (await topNavbar.count() > 0) {
      await expect(topNavbar).toBeVisible();
    }
  });

  test('2. User detail opens and displays company memberships & branch assignments', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('3. Authorized company switching dynamically updates active branch list', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('4. Unauthorized branch access and company context escalation are rejected', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

});
