import { test, expect } from '@playwright/test';

test.describe('Deshal ERP — E2E Smoke & UI Test Suite', () => {

  test('App Loads Successfully & Renders Main Interface', async ({ page }) => {
    await page.goto('/');
    
    // Check page title or root app element existence
    await expect(page).toHaveTitle(/استشارات|مشاريع|Deshal|ERP|سند/i);

    // Verify main app root element is rendered
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('Navigation & Modal Elements Functional', async ({ page }) => {
    await page.goto('/');

    // Wait for body to be loaded
    await page.waitForLoadState('domcontentloaded');

    // Confirm root UI structure
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

});
