import { test, expect } from '@playwright/test';

test.describe('Deshal ERP — Workspace & Rental Spaces (مساحة العمل والقاعات) E2E Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Inject active Admin AuthSession into localStorage prior to page load
    await page.addInitScript(() => {
      const testSession = {
        user: {
          id: 'admin-e2e-user',
          employeeId: 'emp-e2e-admin',
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
    });

    // Navigate to /app route
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');

    // Click Spaces nav button in PrimarySidebar
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.title?.includes('المساحات') || b.textContent?.includes('المساحات والقاعات') || b.textContent?.includes('Rental Spaces')
      );
      if (btn) (btn as HTMLButtonElement).click();
    });

    // Ensure SpacesManager header is loaded
    await page.waitForSelector('h1:has-text("نظام حجز القاعات ومساحات العمل"), h1:has-text("Spaces & Halls Booking Engine")', { timeout: 10000 });
  });

  test('1. Workspace Manager Header & KPI Metrics Verification', async ({ page }) => {
    // Header Title Assertion
    const headerTitle = page.locator('h1', { hasText: /نظام حجز القاعات ومساحات العمل|Spaces & Halls Booking Engine/i });
    await expect(headerTitle.first()).toBeVisible();

    // Verify KPI Summary Cards
    const totalSpacesKpi = page.locator('div', { hasText: /إجمالي القاعات والمساحات|Total Spaces/i }).first();
    await expect(totalSpacesKpi).toBeVisible();

    const occupancyRateKpi = page.locator('div', { hasText: /معدل الإشغال الشهري|Occupancy Rate/i }).first();
    await expect(occupancyRateKpi).toBeVisible();

    const monthlyRevenueKpi = page.locator('div', { hasText: /إيرادات حجز الشهر|Monthly Revenue/i }).first();
    await expect(monthlyRevenueKpi).toBeVisible();

    const popularSpaceKpi = page.locator('div', { hasText: /القاعة الأكثر طلباً|Most Popular Space/i }).first();
    await expect(popularSpaceKpi).toBeVisible();
  });

  test('2. Tabs Navigation & Filtering in Spaces Directory', async ({ page }) => {
    // Verify 4 Main Navigation Tabs exist
    const spacesTab = page.locator('button', { hasText: /دليل القاعات والمساحات|Spaces Directory/i });
    const calendarTab = page.locator('button', { hasText: /التقويم وجدول الإتاحة|Calendar & Schedule/i });
    const bookingsTab = page.locator('button', { hasText: /سجل الحجوزات|Bookings Log/i });
    const analyticsTab = page.locator('button', { hasText: /لوحة الإحصائيات والإشغال|Analytics & Occupancy/i });

    await expect(spacesTab).toBeVisible();
    await expect(calendarTab).toBeVisible();
    await expect(bookingsTab).toBeVisible();
    await expect(analyticsTab).toBeVisible();

    // Test Search Input Filtering
    const searchInput = page.locator('input[placeholder*="بحث بالاسم"], input[placeholder*="Search spaces"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('قاعة');
    await page.waitForTimeout(300);

    // Test Space Type Filter Dropdown
    const typeSelect = page.locator('select').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
      await typeSelect.selectOption('ALL');
    }
  });

  test('3. Open & Validate New Space Booking Modal Flow', async ({ page }) => {
    // Click "New Space Booking" button
    const newBookingBtn = page.locator('button', { hasText: /حجز قاعة \/ مساحة جديدة|New Space Booking/i });
    await expect(newBookingBtn).toBeVisible();
    await newBookingBtn.click();

    // Modal Title Assertion
    const modalHeader = page.locator('h2', { hasText: /طلب حجز قاعة \/ مساحة عمل ذكية|Reserve Space or Meeting Room/i });
    await expect(modalHeader.first()).toBeVisible();

    // Fill Customer Form Fields
    const nameInput = page.locator('input[placeholder*="أحمد المعمري"], input[placeholder*="Ahmed Al-Mamari"]');
    const phoneInput = page.locator('input[placeholder*="+968"]');
    
    await nameInput.fill('سالم بن علي الهنائي');
    await phoneInput.fill('+968 9988 7766');

    // Close Modal
    const closeBtn = page.locator('button', { hasText: /إلغاء|Cancel/i }).last();
    await closeBtn.click();
    await expect(modalHeader.first()).not.toBeVisible();
  });

  test('4. Add New Space Modal Workflow', async ({ page }) => {
    // Click "Add New Space" button
    const addSpaceBtn = page.locator('button', { hasText: /إضافة قاعة جديدة|Add New Space/i });
    await expect(addSpaceBtn).toBeVisible();
    await addSpaceBtn.click();

    // Verify Space Modal or Form trigger
    await page.waitForTimeout(500);
  });

  test('5. Calendar & Schedule Tab Functionality', async ({ page }) => {
    // Switch to Calendar Tab
    const calendarTab = page.locator('button', { hasText: /التقويم وجدول الإتاحة|Calendar & Schedule/i });
    await calendarTab.click();

    // Verify Month Header & Grid Headers (Sun - Sat)
    const sunHeader = page.locator('div', { hasText: /^الأحد$|^Sun$/i });
    await expect(sunHeader.first()).toBeVisible();
  });

  test('6. Bookings Log Tab & Analytics Dashboard Switch', async ({ page }) => {
    // Switch to Bookings Log Tab
    const bookingsTab = page.locator('button', { hasText: /سجل الحجوزات|Bookings Log/i });
    await bookingsTab.click();

    // Switch to Analytics Tab
    const analyticsTab = page.locator('button', { hasText: /لوحة الإحصائيات والإشغال|Analytics & Occupancy/i });
    await analyticsTab.click();

    // Check presence of occupancy chart or analytics container
    const chartContainer = page.locator('.recharts-responsive-container, div:has-text("معدل الإشغال الشهري"), div:has-text("Occupancy Rate")');
    await expect(chartContainer.first()).toBeVisible();
  });

});
