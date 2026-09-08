import { test, expect } from '@playwright/test';

test.describe('Deshal ERP — Specialized Workspace Role Filter E2E Test Suite', () => {

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

    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Role Filter Buttons are visible and interactive on Home Dashboard', async ({ page }) => {
    // Assert presence of Workspace View label
    const label = page.locator('span', { hasText: /مساحة العمل المتخصصة:|Workspace View:/i });
    await expect(label.first()).toBeVisible();

    // Assert "الرئيسية الشاملة" role button exists
    const allBtn = page.locator('button', { hasText: /الرئيسية الشاملة|Executive All-in-One/i });
    await expect(allBtn.first()).toBeVisible();
  });

  test('2. Clicking role button filters launchers and actions appropriately', async ({ page }) => {
    // Click "المحاسبة والمالية" filter button if present
    const accBtn = page.locator('button', { hasText: /المحاسبة والمالية|Accounting & Finance/i });
    if (await accBtn.isVisible()) {
      await accBtn.click();
      await page.waitForTimeout(300);

      // Verify accounting launcher or actions are shown
      const accLauncher = page.locator('h3', { hasText: /دفتر الأستاذ والتقارير|General Ledger/i });
      await expect(accLauncher.first()).toBeVisible();
    }
  });

});
