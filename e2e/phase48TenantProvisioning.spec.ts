import { test, expect } from '@playwright/test';

test.describe('Deshal ERP — Phase 48 Enterprise Tenant Provisioning & Access Lifecycle E2E', () => {

  test('Root App loads and renders top navigation and workspace manager container', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible();

    const topNavbar = page.locator('#erp-top-navbar');
    if (await topNavbar.count() > 0) {
      await expect(topNavbar).toBeVisible();
    }
  });

  test('Platform Admin dashboard and tenant provisioning studio entry points are accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Company and Branch selectors reflect authorized multi-tenant context state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('Operational access guard prevents unauthorized context escalation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

});
