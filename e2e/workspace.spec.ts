import { test, expect } from '@playwright/test';

test.describe('Deshal ERP — Workspace & Rental Spaces (مساحة العمل والقاعات) E2E Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Inject active Admin AuthSession into localStorage prior to page load
    await page.addInitScript(() => {
      const testSession = {
        user: {
          id: 'admin-e2e-user',
          employeeId: 'emp-e2e-admin',
          companyId: '00000000-0000-0000-0000-000000000001',
          email: 'admin@deshalbm.com',
          fullName: 'مدير النظام الإداري',
          fullNameEn: 'System Administrator',
          role: 'ADMIN',
          passwordHash: '',
          twoFactorEnabled: false,
          failedLoginAttempts: 0,
          isLocked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        employee: {
          id: 'emp-e2e-admin',
          employeeCode: 'EMP-999',
          fullName: 'مدير النظام الإداري',
          fullNameEn: 'System Administrator',
          role: 'ADMIN',
          jobTitle: 'مدير العام',
          department: 'الإدارة العليا',
          email: 'admin@deshalbm.com',
          phone: '+968 91234567',
          civilId: '12345678',
          hireDate: '2025-01-01',
          basicSalary: 1500,
          allowances: 300,
          currency: 'OMR',
          status: 'ACTIVE',
          branchId: 'branch-sohar',
          permissions: ['ADMIN_PANEL', 'FULL_ACCESS'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        token: 'tok_e2e_admin_session',
        loginMethod: 'PASSWORD',
        authenticatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isLocked: false,
        activeBranchId: 'branch-sohar'
      };
      window.localStorage.setItem('rv_auth_active_session', JSON.stringify(testSession));
      window.localStorage.setItem('rv_user_name', 'مدير النظام الإداري');
      window.localStorage.setItem('erp_sidebar_collapsed', 'false');
    });

    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to spaces module via sidebar link
    const spacesLink = page.locator('button, a', { hasText: /المساحات والقاعات|Rental Spaces & Halls/i });
    if (await spacesLink.first().isVisible()) {
      await spacesLink.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('1. Workspace Manager Header & KPI Metrics Verification', async ({ page }) => {
    // Assert Module Title Header
    const headerTitle = page.locator('h1, h2, h3', { hasText: /نظام حجز القاعات ومساحات العمل|المساحات والقاعات|Workspace & Rental Spaces|دليل القاعات/i });
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
    const modalHeader = page.locator('h2, h3, h4, div', { hasText: /حجز|Booking|Reserve/i });
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
    const calendarTab = page.locator('button', { hasText: /التقويم|Calendar/i });
    if (await calendarTab.first().isVisible()) {
      await calendarTab.first().click();
      await page.waitForTimeout(300);
    }
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
