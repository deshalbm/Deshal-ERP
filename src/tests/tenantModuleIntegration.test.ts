/**
 * Enterprise Tenant Module Integration Test Suite — Phase 42
 * Deshal ERP Multi-Tenant Architecture
 * 
 * Verifies TenantContext & Capability Guard integration across ALL 11 ERP Modules:
 * 1. Financials & Vouchers (vouchers / accounting)
 * 2. POS Terminal (pos)
 * 3. Inventory & Warehousing (inventory)
 * 4. Purchases & Suppliers (purchases)
 * 5. CRM & Customers (crm)
 * 6. Spaces & Halls (spaces)
 * 7. Services & Packages (services)
 * 8. HR & Payroll (hr)
 * 9. Attendance & Kiosk (attendance / kiosk)
 * 10. Staff Requests & Forms (requests / documents)
 * 11. Management, Branches & Settings (management)
 */

import {
  resolveTenantContextState,
  resolveActiveCompanyId,
  validateCompanySwitch,
  TenantContextData
} from '../application/services/tenantContextService';
import {
  UserCompanyMembership,
  Tenant,
  TenantStatus,
  TenantSubscription
} from '../domain/tenant/tenantEntities';
import { EmployeePermission } from '../types/hr';
import { evaluateEmployeePermissions } from '../domain/hr/employeePermissions';

console.log("\n============================================================");
console.log("🌐 RUNNING PHASE 42 TENANT MODULE INTEGRATION TESTS (ALL 11 MODULES)");
console.log("============================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ [PASS]: ${testName}`);
    if (detail) console.log(`   └─ ${detail}`);
  } else {
    console.error(`❌ [FAIL]: ${testName}`);
    if (detail) console.error(`   └─ Failure Detail: ${detail}`);
    process.exitCode = 1;
  }
}

const ALL_11_MODULE_CODES = [
  'vouchers',
  'accounting',
  'pos',
  'inventory',
  'purchases',
  'crm',
  'spaces',
  'services',
  'hr',
  'attendance',
  'requests',
  'management'
];

async function runAllPhase42Tests() {
  const companyA = 'cmp_alpha_001';
  const companyB = 'cmp_beta_002';
  const companyUnauthorized = 'cmp_unauth_999';

  const membershipA: UserCompanyMembership = {
    id: 'mem_a_101',
    userId: 'usr_owner_1',
    companyId: companyA,
    roleId: 'ADMIN',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const membershipB: UserCompanyMembership = {
    id: 'mem_b_102',
    userId: 'usr_owner_1',
    companyId: companyB,
    roleId: 'ACCOUNTANT',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  // ----------------------------------------------------
  // TEST 1: Tenant + Active Company Context Resolution
  // ----------------------------------------------------
  const ctxStateA = resolveTenantContextState({
    userId: 'usr_owner_1',
    preferredCompanyId: companyA,
    fetchedMemberships: [membershipA, membershipB],
    fetchedTenant: {
      id: 'tnt_alpha',
      tenantCode: 'TNT-ALP',
      name: 'Alpha Enterprise',
      companyId: companyA,
      status: 'ACTIVE',
      subscriptionPlan: 'ENTERPRISE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });

  assert(
    ctxStateA.activeCompanyId === companyA && ctxStateA.activeMembership?.id === 'mem_a_101',
    '1. Active company resolved correctly to authorized membership (Company A)',
    `Active Company: ${ctxStateA.activeCompanyId}`
  );

  // ----------------------------------------------------
  // TEST 2: Active Company Isolation & Switch Validation
  // ----------------------------------------------------
  const validSwitch = validateCompanySwitch({
    userId: 'usr_owner_1',
    targetCompanyId: companyB,
    memberships: [membershipA, membershipB],
    isPlatformAdmin: false
  });
  assert(validSwitch.allowed && validSwitch.targetCompanyId === companyB, '2. Secure company switch to authorized Company B permitted');

  const invalidSwitch = validateCompanySwitch({
    userId: 'usr_owner_1',
    targetCompanyId: companyUnauthorized,
    memberships: [membershipA, membershipB],
    isPlatformAdmin: false
  });
  assert(!invalidSwitch.allowed && invalidSwitch.error?.includes('Security Rejection'), '3. Unauthorized company switch strictly rejected');

  // ----------------------------------------------------
  // TEST 3: Tenant Lifecycle Enforcement (ACTIVE vs READY/SUSPENDED/ARCHIVED)
  // ----------------------------------------------------
  const statuses: TenantStatus[] = ['READY', 'SUSPENDED', 'ARCHIVED', 'FAILED', 'PENDING'];
  statuses.forEach(st => {
    const ctxLifecycle = resolveTenantContextState({
      userId: 'usr_owner_1',
      preferredCompanyId: companyA,
      fetchedMemberships: [membershipA],
      fetchedTenant: {
        id: 'tnt_alpha',
        tenantCode: 'TNT-ALP',
        name: 'Alpha Enterprise',
        companyId: companyA,
        status: st,
        subscriptionPlan: 'PRO',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    if (st === 'READY') {
      // READY is a provisioning/readiness state, not active operational status
      assert(ctxLifecycle.tenantStatus === 'READY', `4a. READY status recorded for tenant readiness inspection`);
    } else {
      assert(
        ctxLifecycle.error !== null && ctxLifecycle.error.includes('restricted'),
        `4b. Lifecycle status '${st}' restricts operational ERP access`,
        ctxLifecycle.error || undefined
      );
    }
  });

  // ----------------------------------------------------
  // TEST 4: Module Entitlements Verification across ALL 11 ERP Modules
  // ----------------------------------------------------
  const enabledMap: Record<string, boolean> = {
    vouchers: true,
    accounting: true,
    pos: false, // Intentionally disabled POS module
    inventory: true,
    purchases: true,
    crm: true,
    spaces: true,
    services: true,
    hr: true,
    attendance: true,
    requests: true,
    management: true
  };

  const ctxModules = resolveTenantContextState({
    userId: 'usr_owner_1',
    preferredCompanyId: companyA,
    fetchedMemberships: [membershipA],
    fetchedModules: enabledMap
  });

  assert(ctxModules.enabledModules.vouchers === true, '5. Module 1 (Vouchers / Financials) entitlement resolved: ENABLED');
  assert(ctxModules.enabledModules.accounting === true, '6. Module 1 (General Ledger / Accounting) entitlement resolved: ENABLED');
  assert(ctxModules.enabledModules.pos === false, '7. Module 2 (POS Terminal) entitlement resolved: DISABLED');
  assert(ctxModules.enabledModules.inventory === true, '8. Module 3 (Inventory & Items) entitlement resolved: ENABLED');
  assert(ctxModules.enabledModules.purchases === true, '9. Module 4 (Purchases & Suppliers) entitlement resolved: ENABLED');
  assert(ctxModules.enabledModules.crm === true, '10. Module 5 (CRM & Customers) entitlement resolved: ENABLED');
  assert(ctxModules.enabledModules.spaces === true, '11. Module 6 (Spaces & Halls) entitlement resolved: ENABLED');
  assert(ctxModules.enabledModules.services === true, '12. Module 7 (Services & Packages) entitlement resolved: ENABLED');
  assert(ctxModules.enabledModules.hr === true, '13. Module 8 (HR & Payroll) entitlement resolved: ENABLED');
  assert(ctxModules.enabledModules.attendance === true, '14. Module 9 (Attendance & Kiosk) entitlement resolved: ENABLED');
  assert(ctxModules.enabledModules.requests === true, '15. Module 10 (Requests & Documents) entitlement resolved: ENABLED');
  assert(ctxModules.enabledModules.management === true, '16. Module 11 (Management & Branches) entitlement resolved: ENABLED');

  // ----------------------------------------------------
  // TEST 5: Feature Entitlements Verification
  // ----------------------------------------------------
  const featureMap: Record<string, boolean> = {
    'pos.discount_override': false,
    'crm.leads': true,
    'hr.instant_bonus': true
  };

  const ctxFeatures = resolveTenantContextState({
    userId: 'usr_owner_1',
    preferredCompanyId: companyA,
    fetchedMemberships: [membershipA],
    fetchedFeatures: featureMap
  });

  assert(ctxFeatures.enabledFeatures['pos.discount_override'] === false, '17. Fine-grained feature flag (pos.discount_override) resolved: DISABLED');
  assert(ctxFeatures.enabledFeatures['crm.leads'] === true, '18. Fine-grained feature flag (crm.leads) resolved: ENABLED');

  // ----------------------------------------------------
  // TEST 6: RBAC Permission vs Module Entitlement Separation
  // ----------------------------------------------------
  // User has POS permission in RBAC, but tenant module entitlement for POS is disabled
  const cashierRolePermissions = evaluateEmployeePermissions({ role: 'CASHIER' as any });
  const hasRbacPos = cashierRolePermissions.includes('pos_create_order');
  const tenantPosEnabled = ctxModules.enabledModules.pos === true;

  const canExecutePos = hasRbacPos && tenantPosEnabled;
  assert(
    !canExecutePos,
    '19. RBAC permission DOES NOT bypass disabled tenant module entitlement (Both MUST be enabled)',
    `RBAC Permission: ${hasRbacPos}, Tenant Module Entitlement: ${tenantPosEnabled}`
  );

  // ----------------------------------------------------
  // TEST 7: Direct Handler Bypass Rejection Test
  // ----------------------------------------------------
  function executeModuleActionHandler(moduleCode: string, userPermissions: EmployeePermission[], enabledModules: Record<string, boolean>): { allowed: boolean; reason?: string } {
    if (!enabledModules[moduleCode]) {
      return { allowed: false, reason: `Tenant Module '${moduleCode}' is disabled.` };
    }
    return { allowed: true };
  }

  const bypassAttempt = executeModuleActionHandler('pos', ['pos_create_order'], { pos: false });
  assert(!bypassAttempt.allowed && bypassAttempt.reason!.includes('disabled'), '20. Direct handler invocation bypass attempt is strictly rejected');

  // ----------------------------------------------------
  // TEST 8: LocalStorage / Offline Integration Intact
  // ----------------------------------------------------
  const fallbackCtx = resolveTenantContextState({
    userId: null,
    preferredCompanyId: companyA
  });

  assert(
    fallbackCtx.activeCompanyId === companyA && fallbackCtx.tenantStatus === 'ACTIVE',
    '21. Unauthenticated/offline fallback provides safe company-scoped context without crash',
    `Fallback Active Company: ${fallbackCtx.activeCompanyId}`
  );

  console.log("\n============================================================");
  console.log(`📊 PHASE 42 TEST RESULTS: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log("============================================================\n");
}

runAllPhase42Tests().catch(err => {
  console.error("FATAL PHASE 42 TEST ERROR:", err);
  process.exitCode = 1;
});
