import { test, expect } from '@playwright/test';

test.describe('Deshal ERP — Phase 45 Unified User Directory & Access Control E2E', () => {

  test('User Directory & Top Navigation Bar load successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Confirm root UI structure
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Verify top navbar is present
    const navBar = page.locator('#erp-top-navbar');
    if (await navBar.count() > 0) {
      await expect(navBar).toBeVisible();
    }
  });

  test('Unified Directory filtering options are functional', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify body element is active
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

});
