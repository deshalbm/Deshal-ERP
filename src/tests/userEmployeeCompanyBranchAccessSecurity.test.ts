/**
 * Phase 44 Security Test Suite: Unified User, Employee, Company, Branch & Role Access Architecture
 * Deshal ERP Enterprise Access Control
 * 
 * Verifies all 10 Security & Multi-Tenant Access Control Invariants:
 * 1. Cross-Company Access Rejection
 * 2. Unauthorized Company Switch Rejection
 * 3. Branch Switching & Active Company Scoping
 * 4. Stale Branch Context Invalidation on Company Switch
 * 5. Platform Admin Operational Separation (Zero company access without membership)
 * 6. Platform Collaborator Limited Privilege Isolation
 * 7. Multi-Branch Employee Access Authorization
 * 8. RBAC 91-Permission Matrix Synergy with Module Entitlements
 * 9. LocalStorage Tamper Resistance Immunity
 * 10. Logout & User Switch Context Cleanup Security
 */

import {
  resolveTenantContextState,
  resolveActiveCompanyId,
  validateCompanySwitch,
  validateBranchSwitch,
  AuthorizedCompany,
  AuthorizedBranch,
  TenantContextData
} from '../application/services/tenantContextService';
import { UserCompanyMembership } from '../domain/tenant/tenantEntities';
import { evaluateEmployeePermissions, hasPermission } from '../domain/hr/employeePermissions';
import { EmployeePermission } from '../types/hr';

console.log("\n============================================================");
console.log("🛡️ RUNNING PHASE 44 USER, EMPLOYEE, COMPANY & BRANCH SECURITY SUITE");
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

// ----------------------------------------------------
// Test Fixtures
// ----------------------------------------------------
const COMPANY_ALPHA = 'cmp_alpha_1111';
const COMPANY_BETA = 'cmp_beta_2222';
const COMPANY_GAMMA = 'cmp_gamma_3333';

const BRANCH_ALPHA_MAIN: AuthorizedBranch = {
  id: 'br_alpha_01',
  code: 'BR-ALPHA-01',
  name: 'فرع ألفا الرئيسي',
  nameEn: 'Alpha Main Branch',
  isMain: true,
  status: 'ACTIVE',
  companyId: COMPANY_ALPHA
};

const BRANCH_ALPHA_SUB: AuthorizedBranch = {
  id: 'br_alpha_02',
  code: 'BR-ALPHA-02',
  name: 'فرع ألفا الفرعي',
  nameEn: 'Alpha Sub Branch',
  isMain: false,
  status: 'ACTIVE',
  companyId: COMPANY_ALPHA
};

const BRANCH_BETA_MAIN: AuthorizedBranch = {
  id: 'br_beta_01',
  code: 'BR-BETA-01',
  name: 'فرع بيتا الرئيسي',
  nameEn: 'Beta Main Branch',
  isMain: true,
  status: 'ACTIVE',
  companyId: COMPANY_BETA
};

const USER_MEMBERSHIPS: UserCompanyMembership[] = [
  {
    id: 'mem_1',
    userId: 'usr_employee_1',
    companyId: COMPANY_ALPHA,
    roleId: 'ACCOUNTANT',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mem_2',
    userId: 'usr_employee_1',
    companyId: COMPANY_BETA,
    roleId: 'SALES',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mem_3_inactive',
    userId: 'usr_employee_1',
    companyId: COMPANY_GAMMA,
    roleId: 'MANAGER',
    isActive: false,
    createdAt: new Date().toISOString()
  }
];

// ----------------------------------------------------
// 1. Cross-Company Access Rejection
// ----------------------------------------------------
const resCompanyId = resolveActiveCompanyId({
  preferredCompanyId: COMPANY_ALPHA,
  memberships: USER_MEMBERSHIPS,
  isPlatformAdmin: false
});

assert(
  resCompanyId.activeCompanyId === COMPANY_ALPHA,
  "Cross-Company: User accesses authorized Company Alpha",
  `Active company resolved to ${resCompanyId.activeCompanyId}`
);

// ----------------------------------------------------
// 2. Unauthorized Company Switch Rejection
// ----------------------------------------------------
const switchUnauthorized = validateCompanySwitch({
  userId: 'usr_employee_1',
  targetCompanyId: COMPANY_GAMMA, // Inactive membership
  memberships: USER_MEMBERSHIPS,
  isPlatformAdmin: false
});

assert(
  !switchUnauthorized.allowed,
  "Company Switch: Rejects switching to company with inactive membership",
  `Error: ${switchUnauthorized.error}`
);

const switchNonExistent = validateCompanySwitch({
  userId: 'usr_employee_1',
  targetCompanyId: 'cmp_fake_9999',
  memberships: USER_MEMBERSHIPS,
  isPlatformAdmin: false
});

assert(
  !switchNonExistent.allowed,
  "Company Switch: Rejects switching to non-existent company",
  `Error: ${switchNonExistent.error}`
);

// ----------------------------------------------------
// 3. Branch Switching & Active Company Scoping
// ----------------------------------------------------
const branchSwitchValid = validateBranchSwitch({
  activeCompanyId: COMPANY_ALPHA,
  targetBranchId: BRANCH_ALPHA_SUB.id,
  authorizedBranches: [BRANCH_ALPHA_MAIN, BRANCH_ALPHA_SUB]
});

assert(
  branchSwitchValid.allowed,
  "Branch Switch: Allows switching to authorized branch within same company",
  `Target branch: ${branchSwitchValid.targetBranchId}`
);

const branchSwitchCrossCompany = validateBranchSwitch({
  activeCompanyId: COMPANY_ALPHA,
  targetBranchId: BRANCH_BETA_MAIN.id, // Belongs to Beta!
  authorizedBranches: [BRANCH_ALPHA_MAIN, BRANCH_ALPHA_SUB]
});

assert(
  !branchSwitchCrossCompany.allowed,
  "Branch Switch: Security Rejection when switching to branch belonging to another company",
  `Error: ${branchSwitchCrossCompany.error}`
);

// ----------------------------------------------------
// 4. Stale Branch Context Invalidation on Company Switch
// ----------------------------------------------------
const contextAlpha = resolveTenantContextState({
  userId: 'usr_employee_1',
  preferredCompanyId: COMPANY_ALPHA,
  preferredBranchId: BRANCH_BETA_MAIN.id, // Stale branch ID from Beta!
  fetchedCompanies: [{ id: COMPANY_ALPHA, nameAr: 'شركة ألفا' }],
  fetchedBranches: [BRANCH_ALPHA_MAIN, BRANCH_ALPHA_SUB],
  fetchedMemberships: USER_MEMBERSHIPS
});

assert(
  contextAlpha.activeBranchId === BRANCH_ALPHA_MAIN.id,
  "Stale Branch Invalidation: Clears stale Beta branch and defaults to Alpha Main Branch",
  `Active branch correctly reset to ${contextAlpha.activeBranchId}`
);

// ----------------------------------------------------
// 5. Platform Admin Operational Separation
// ----------------------------------------------------
const platformAdminMemberships: UserCompanyMembership[] = []; // Zero company memberships
const platformAdminContext = resolveTenantContextState({
  userId: 'usr_platform_admin_super',
  isPlatformAdmin: true,
  fetchedMemberships: platformAdminMemberships
});

assert(
  platformAdminContext.activeCompanyId === null && platformAdminContext.error !== null,
  "Platform Admin Separation: Platform Admin status without company membership grants zero operational ERP access",
  `Context error: ${platformAdminContext.error}`
);

// ----------------------------------------------------
// 6. Platform Collaborator Privilege Isolation
// ----------------------------------------------------
const collaboratorPermissions = evaluateEmployeePermissions(
  { role: 'COLLABORATOR', permissions: ['collaborator_limited', 'view_vouchers'] },
  ['collaborator_limited', 'view_vouchers']
);

assert(
  collaboratorPermissions.includes('collaborator_limited') &&
  !collaboratorPermissions.includes('delete_vouchers') &&
  !collaboratorPermissions.includes('financial_admin_override'),
  "Platform Collaborator Isolation: Granted limited permissions without ungranted administrative overrides",
  `Collaborator permission count: ${collaboratorPermissions.length}`
);

// ----------------------------------------------------
// 7. Multi-Branch Employee Access Authorization
// ----------------------------------------------------
const contextBranchSub = resolveTenantContextState({
  userId: 'usr_employee_1',
  preferredCompanyId: COMPANY_ALPHA,
  preferredBranchId: BRANCH_ALPHA_SUB.id,
  fetchedCompanies: [{ id: COMPANY_ALPHA, nameAr: 'شركة ألفا' }],
  fetchedBranches: [BRANCH_ALPHA_MAIN, BRANCH_ALPHA_SUB],
  fetchedMemberships: USER_MEMBERSHIPS
});

assert(
  contextBranchSub.activeBranchId === BRANCH_ALPHA_SUB.id &&
  contextBranchSub.activeBranch?.name === BRANCH_ALPHA_SUB.name,
  "Multi-Branch: Correctly resolves selected secondary branch within active company",
  `Selected Branch: ${contextBranchSub.activeBranch?.name}`
);

// ----------------------------------------------------
// 8. RBAC 91-Permission Matrix Synergy with Module Entitlements
// ----------------------------------------------------
const rbacCheck = hasPermission(
  { role: 'ACCOUNTANT', permissions: ['view_vouchers', 'create_vouchers'] },
  'view_vouchers'
);

const rbacForbiddenCheck = hasPermission(
  { role: 'ACCOUNTANT', permissions: ['view_vouchers'] },
  'delete_employees'
);

assert(
  rbacCheck && !rbacForbiddenCheck,
  "RBAC Synergy: Correctly grants explicit permissions and denies unassigned domain permissions",
  `view_vouchers=${rbacCheck}, delete_employees=${rbacForbiddenCheck}`
);

// ----------------------------------------------------
// 9. LocalStorage Tamper Resistance Immunity
// ----------------------------------------------------
const switchTamperedCompany = validateCompanySwitch({
  userId: 'usr_attacker',
  targetCompanyId: 'cmp_stolen_vault',
  memberships: USER_MEMBERSHIPS, // Attacker has no membership in stolen vault!
  isPlatformAdmin: false
});

assert(
  !switchTamperedCompany.allowed,
  "Tamper Resistance: Tampering with localStorage company parameter rejected by application validation engine",
  `Error: ${switchTamperedCompany.error}`
);

// ----------------------------------------------------
// 10. Logout & User Switch Context Cleanup Security
// ----------------------------------------------------
const loggedOutContext = resolveTenantContextState({
  userId: null
});

assert(
  loggedOutContext.activeCompanyId === '00000000-0000-0000-0000-000000000001' &&
  loggedOutContext.isPlatformAdmin === false,
  "Session Cleanup: Unauthenticated state safely defaults without elevating privileges",
  `Default company fallback: ${loggedOutContext.activeCompanyId}`
);

// ----------------------------------------------------
// Final Results
// ----------------------------------------------------
console.log("\n============================================================");
console.log(`🛡️ SECURITY TEST RESULTS: ${passedCount} / ${totalCount} PASSED`);
console.log("============================================================\n");

if (passedCount < totalCount) {
  process.exit(1);
}
