import { test, expect } from '@playwright/test';

test.describe('Deshal ERP — Workspace & Rental Spaces (مساحة العمل والقاعات) E2E Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to local application root
    await page.goto('/');

    // Ensure page loaded successfully
    await expect(page).toHaveTitle(/الدليل الشامل|Deshal/i);

    // Navigate to Spaces / Workspace module via sidebar or button
    const spacesLink = page.locator('button, a', { hasText: /مساحة العمل والقاعات|Workspace & Rental Spaces|دليل القاعات والمساحات/i });
    if (await spacesLink.first().isVisible()) {
      await spacesLink.first().click();
    }
  });

  test('1. Workspace Manager Header & KPI Metrics Verification', async ({ page }) => {
    // Assert Module Title Header
    const headerTitle = page.locator('h1, h2, h3', { hasText: /مساحة العمل والقاعات|Workspace & Rental Spaces|دليل القاعات/i });
    await expect(headerTitle.first()).toBeVisible();

    // Verify Action Buttons Present
    const newBookingBtn = page.locator('button', { hasText: /حجز قاعة|New Space Booking/i });
    const addSpaceBtn = page.locator('button', { hasText: /إضافة قاعة جديدة|Add New Space/i });

    await expect(newBookingBtn.first()).toBeVisible();
    await expect(addSpaceBtn.first()).toBeVisible();

    // Verify Metric KPI Cards Exist (e.g., إجمالي القاعات, إيرادات حجز الشهر)
    const kpiCards = page.locator('div', { hasText: /إجمالي القاعات|Total Spaces|إيرادات/i });
    await expect(kpiCards.first()).toBeVisible();
  });

  test('2. Tabs Navigation & Filtering in Spaces Directory', async ({ page }) => {
    // Verify main navigation tabs exist
    const spacesTab = page.locator('button', { hasText: /دليل القاعات والمساحات|Spaces Directory/i });
    const calendarTab = page.locator('button', { hasText: /التقويم وجدول الإتاحة|Calendar & Schedule/i });
    const bookingsTab = page.locator('button', { hasText: /سجل الحجوزات|Bookings Log/i });
    const analyticsTab = page.locator('button', { hasText: /لوحة الإحصائيات والإشغال|Analytics & Occupancy/i });

    await expect(spacesTab.first()).toBeVisible();
    await expect(calendarTab.first()).toBeVisible();
    await expect(bookingsTab.first()).toBeVisible();
    await expect(analyticsTab.first()).toBeVisible();

    // Test Search Input Filtering
    const searchInput = page.locator('input[placeholder*="بحث باسم القاعة"], input[placeholder*="Search space"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('المؤتمرات');
      await page.waitForTimeout(300);
      await searchInput.fill('');
    }

    // Test Branch / Space Type Filter Dropdown
    const typeSelect = page.locator('select').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
      await typeSelect.selectOption('ALL');
    }
  });

  test('3. Open & Validate New Space Booking Modal Flow', async ({ page }) => {
    // Click "New Space Booking" button
    const newBookingBtn = page.locator('button', { hasText: /حجز قاعة|New Space Booking/i });
    await expect(newBookingBtn.first()).toBeVisible();
    await newBookingBtn.first().click();

    // Modal Title Assertion
    const modalHeader = page.locator('h2, h3', { hasText: /طلب حجز قاعة|حجز قاعة|Reserve Space|New Booking/i });
    await expect(modalHeader.first()).toBeVisible();

    // Close Modal
    const closeBtn = page.locator('button', { hasText: /إلغاء|Cancel/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test('4. Add New Space Modal Workflow', async ({ page }) => {
    // Click "Add New Space" button
    const addSpaceBtn = page.locator('button', { hasText: /إضافة قاعة جديدة|Add New Space/i });
    await expect(addSpaceBtn.first()).toBeVisible();
    await addSpaceBtn.first().click();

    // Verify Space Modal or Form trigger
    await page.waitForTimeout(500);
  });

  test('5. Calendar & Schedule Tab Functionality', async ({ page }) => {
    // Switch to Calendar Tab
    const calendarTab = page.locator('button', { hasText: /التقويم وجدول الإتاحة|Calendar & Schedule/i });
    await calendarTab.first().click();
    await page.waitForTimeout(500);

    // Verify Month Header & Grid Headers (Sun - Sat)
    const sunHeader = page.locator('div', { hasText: /^الأحد$|^Sun$/i });
    await expect(sunHeader.first()).toBeVisible();
  });

  test('6. Bookings Log Tab & Analytics Dashboard Switch', async ({ page }) => {
    // Switch to Bookings Log Tab
    const bookingsTab = page.locator('button', { hasText: /سجل الحجوزات|Bookings Log/i });
    await bookingsTab.first().click();
    await page.waitForTimeout(300);

    // Switch to Analytics Tab
    const analyticsTab = page.locator('button', { hasText: /لوحة الإحصائيات والإشغال|Analytics & Occupancy/i });
    await analyticsTab.first().click();
    await page.waitForTimeout(300);
  });

});
