/**
 * DESHAL ERP — PHASE 53B WORKSPACE TEST SUITE
 * 
 * Clean Architecture Verification Gate for Phase 53B Enterprise Personalized Workspace.
 * Validates deterministic execution of role-tailored personalization, module access gating,
 * granular RBAC permission enforcement, company/branch context re-resolution, Website Requests
 * widget integration, quick action filtering, and resilient error boundary handling.
 * 
 * Run with: npx tsx src/tests/phase53bWorkspace.test.ts
 */

import {
  resolveWorkspacePersona,
  isWidgetAuthorized,
  filterAuthorizedQuickActions,
  WorkspaceContextInput,
  WorkspaceWidgetConfig
} from '../lib/domain/workspace/workspacePersonalizationDomain';
import {
  buildPersonalizedWorkspaceState,
  PersonalizedWorkspaceState
} from '../lib/application/services/workspacePersonalizationService';

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ [PASS]: ${testName}`);
  } else {
    console.error(`❌ [FAIL]: ${testName}`);
  }
}

async function runPhase53bWorkspaceTests() {
  console.log('\n======================================================');
  console.log('DESHAL ERP — PHASE 53B PERSONALIZED WORKSPACE TEST SUITE');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // 1. ROLE-BASED PERSONA RESOLUTION TESTS
  // ----------------------------------------------------

  // Test 1: Platform Admin persona resolution
  {
    const ctx: WorkspaceContextInput = {
      isPlatformAdmin: true,
      platformRole: 'PLATFORM_ADMIN',
      activeCompanyId: 'platform'
    };
    const persona = resolveWorkspacePersona(ctx);
    assert(persona === 'PLATFORM_ADMIN', 'Test 1: Resolves PLATFORM_ADMIN persona when platform admin context is active');
  }

  // Test 2: Receptionist persona resolution
  {
    const ctx: WorkspaceContextInput = {
      primaryRole: 'RECEPTIONIST_SO HAR'
    };
    const persona = resolveWorkspacePersona(ctx);
    assert(persona === 'RECEPTION', 'Test 2: Resolves RECEPTION persona for front desk roles');
  }

  // Test 3: HR Specialist persona resolution
  {
    const ctx: WorkspaceContextInput = {
      primaryRole: 'HR_OFFICER',
      permissions: ['manage_employees']
    };
    const persona = resolveWorkspacePersona(ctx);
    assert(persona === 'HR', 'Test 3: Resolves HR persona for HR roles with employee management permissions');
  }

  // Test 4: Accountant persona resolution
  {
    const ctx: WorkspaceContextInput = {
      primaryRole: 'CHIEF_ACCOUNTANT',
      permissions: ['view_financial_reports', 'create_vouchers']
    };
    const persona = resolveWorkspacePersona(ctx);
    assert(persona === 'ACCOUNTANT', 'Test 4: Resolves ACCOUNTANT persona for accounting & finance roles');
  }

  // Test 5: Operations Manager persona resolution
  {
    const ctx: WorkspaceContextInput = {
      primaryRole: 'GENERAL_MANAGER'
    };
    const persona = resolveWorkspacePersona(ctx);
    assert(persona === 'OPERATIONS_MANAGER', 'Test 5: Resolves OPERATIONS_MANAGER persona for management roles');
  }

  // ----------------------------------------------------
  // 2. MODULE & PERMISSION ACCESS GATING TESTS
  // ----------------------------------------------------

  // Test 6: Disabled module hides corresponding widget
  {
    const widget: WorkspaceWidgetConfig = {
      id: 'website_requests',
      titleAr: 'طلبات الموقع',
      titleEn: 'Website Requests',
      requiredModule: 'requests',
      order: 1
    };
    const ctxDisabledModule: WorkspaceContextInput = { enabledModules: ['pos', 'crm'] };
    const isAuth = isWidgetAuthorized(widget, ctxDisabledModule);
    assert(isAuth === false, 'Test 6: Widget requiring disabled module "requests" is cleanly hidden');
  }

  // Test 7: Enabled module allows corresponding widget
  {
    const widget: WorkspaceWidgetConfig = {
      id: 'website_requests',
      titleAr: 'طلبات الموقع',
      titleEn: 'Website Requests',
      requiredModule: 'requests',
      order: 1
    };
    const ctxEnabledModule: WorkspaceContextInput = { enabledModules: ['pos', 'requests'] };
    const isAuth = isWidgetAuthorized(widget, ctxEnabledModule);
    assert(isAuth === true, 'Test 7: Widget requiring enabled module "requests" is authorized');
  }

  // Test 8: Missing RBAC permission hides widget
  {
    const widget: WorkspaceWidgetConfig = {
      id: 'hr_attendance_contracts',
      titleAr: 'الحضور والعقود',
      titleEn: 'Attendance',
      requiredPermission: 'manage_employees',
      order: 2
    };
    const ctxNoPermission: WorkspaceContextInput = { permissions: ['view_financial_reports'] };
    const isAuth = isWidgetAuthorized(widget, ctxNoPermission);
    assert(isAuth === false, 'Test 8: Widget requiring "manage_employees" permission is hidden when permission is absent');
  }

  // ----------------------------------------------------
  // 3. QUICK ACTIONS PERMISSION FILTERING TESTS
  // ----------------------------------------------------

  // Test 9: Authorized Quick Actions filtering
  {
    const ctx: WorkspaceContextInput = {
      enabledModules: ['crm', 'accounting'],
      permissions: ['manage_customers', 'create_vouchers']
    };
    const actions = filterAuthorizedQuickActions(ctx);
    const hasCustomerAction = actions.some(a => a.id === 'new_customer');
    const hasVoucherAction = actions.some(a => a.id === 'new_voucher');
    const hasEmployeeAction = actions.some(a => a.id === 'new_employee');

    assert(
      hasCustomerAction && hasVoucherAction && !hasEmployeeAction,
      'Test 9: Quick actions list includes only authorized module & permission actions'
    );
  }

  // ----------------------------------------------------
  // 4. WEBSITE REQUESTS WIDGET INTEGRATION & COMPANY ISOLATION
  // ----------------------------------------------------

  // Test 10: Website requests count respects active company scope
  {
    const mockRequests = [
      { id: '1', request_number: 'REQ-WEB-001', company_id: 'company-a', status: 'SUBMITTED' },
      { id: '2', request_number: 'REQ-WEB-002', company_id: 'company-a', status: 'PENDING' },
      { id: '3', request_number: 'REQ-WEB-003', company_id: 'company-b', status: 'SUBMITTED' } // Company B
    ];

    const ctxCompanyA: WorkspaceContextInput = { activeCompanyId: 'company-a', enabledModules: ['requests'] };
    const state = buildPersonalizedWorkspaceState(ctxCompanyA, mockRequests, [], []);

    assert(
      state.websiteRequests.newCount === 1 && state.websiteRequests.totalActive === 2,
      'Test 10: Website Requests widget filters items strictly by active companyId (Company A = 2, excludes Company B)'
    );
  }

  // ----------------------------------------------------
  // 5. CONTEXT SWITCHING & RE-RESOLUTION TESTS
  // ----------------------------------------------------

  // Test 11: Switching company re-resolves workspace state dynamically
  {
    const mockRequests = [
      { id: '1', request_number: 'REQ-WEB-100', company_id: 'company-a', status: 'SUBMITTED' },
      { id: '2', request_number: 'REQ-WEB-200', company_id: 'company-b', status: 'SUBMITTED' }
    ];

    const stateCompanyA = buildPersonalizedWorkspaceState({ activeCompanyId: 'company-a', enabledModules: ['requests'] }, mockRequests, [], []);
    const stateCompanyB = buildPersonalizedWorkspaceState({ activeCompanyId: 'company-b', enabledModules: ['requests'] }, mockRequests, [], []);

    assert(
      stateCompanyA.websiteRequests.newCount === 1 &&
      stateCompanyB.websiteRequests.newCount === 1 &&
      stateCompanyA.priorityItems[0]?.id === '1' &&
      stateCompanyB.priorityItems[0]?.id === '2',
      'Test 11: Company switch dynamically re-resolves priority work items without stale cross-company data'
    );
  }

  // ----------------------------------------------------
  // 6. OPERATIONAL KPIS & EMPTY STATES TESTS
  // ----------------------------------------------------

  // Test 12: Handles empty data gracefully without UI crashes
  {
    const emptyState = buildPersonalizedWorkspaceState({ activeCompanyId: 'company-a' }, [], [], []);
    assert(
      emptyState.websiteRequests.newCount === 0 &&
      emptyState.kpis.todayCollectionsOmr === 0 &&
      emptyState.priorityItems.length === 0,
      'Test 12: Safely builds empty workspace state with zero indicators when datasets are empty'
    );
  }

  // Summary
  console.log('\n======================================================');
  console.log(`Phase 53B Test Suite Complete: ${passedCount}/${totalCount} Passed`);
  console.log('======================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runPhase53bWorkspaceTests().catch(err => {
  console.error('Fatal Workspace Test Error:', err);
  process.exit(1);
});
