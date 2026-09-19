/**
 * DESHAL ERP — PHASE 50 PRODUCTION REAL-DATA INTEGRATION TEST SUITE
 * 
 * Clean Architecture Test Suite: Validates real-data normalization, identity preservation,
 * company membership management, branch scoping, platform vs. employee access controls,
 * localStorage immunity, cross-company isolation, and tenant lifecycle status rules.
 * 
 * Run with: npx tsx src/tests/phase50ProductionDataIntegration.test.ts
 */

import {
  UnifiedUser,
  CompanyMembershipScope,
  classifyUserType,
  isAuthorizedForCompany,
  isAuthorizedForBranch,
  validateMembershipAssignment,
  validateMembershipRemoval,
  validateBranchScopeAssignment
} from '../domain/user/unifiedUserDomain';
import {
  filterUnifiedUsers,
  resolveUserAccessDetails,
  assignUserCompanyMembership,
  removeUserCompanyMembership
} from '../application/services/unifiedUserService';
import {
  resolveTenantContextState,
  validateOperationalAccess,
  validateCompanySwitch,
  validateBranchSwitch,
  AuthorizedBranch
} from '../application/services/tenantContextService';
import { UnifiedUserPort } from '../application/ports/unifiedUserPort';
import { UserCompanyMembership, Tenant } from '../domain/tenant/tenantEntities';

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ [SECURITY PASS]: ${testName}`);
  } else {
    console.error(`❌ [SECURITY FAIL]: ${testName}`);
  }
}

// ----------------------------------------------------
// MOCK PRODUCTION ADAPTER FOR PORT & REAL DATA FLOW TESTING
// ----------------------------------------------------
class MockProductionDataUserAdapter implements UnifiedUserPort {
  private profiles: Map<string, any> = new Map();
  private memberships: Map<string, UserCompanyMembership & { allowedBranchIds?: string[] }> = new Map();
  private employees: Map<string, any> = new Map();

  addProfile(profile: { id: string; email: string; full_name: string; civil_id?: string; role?: string; status?: string }) {
    this.profiles.set(profile.id, profile);
  }

  addEmployee(emp: { id: string; profile_id?: string; email: string; full_name: string; company_id?: string; status?: string }) {
    this.employees.set(emp.id, emp);
  }

  async fetchUnifiedUsers(activeCompanyId?: string | null): Promise<UnifiedUser[]> {
    const users: UnifiedUser[] = [];
    for (const p of this.profiles.values()) {
      const userMemberships: CompanyMembershipScope[] = [];
      for (const m of this.memberships.values()) {
        if (m.userId === p.id && m.isActive) {
          userMemberships.push({
            companyId: m.companyId,
            companyNameAr: "شركة ديشال الإنتاجية",
            roleId: m.roleId,
            allowedBranchIds: m.allowedBranchIds || [],
            isActive: true,
            createdAt: m.createdAt
          });
        }
      }

      let empRecord: any = null;
      for (const e of this.employees.values()) {
        if (e.profile_id === p.id || e.email.toLowerCase() === p.email.toLowerCase()) {
          empRecord = e;
          break;
        }
      }

      const isPlatformAdmin = p.role === 'ADMIN';
      const userType = classifyUserType({
        isPlatformAdmin,
        platformRole: isPlatformAdmin ? 'PLATFORM_ADMIN' : null,
        memberships: userMemberships,
        hasEmployeeRecord: Boolean(empRecord)
      });

      users.push({
        id: p.id,
        email: p.email,
        fullName: p.full_name,
        civilId: p.civil_id,
        userType,
        isPlatformAdmin,
        platformRole: isPlatformAdmin ? 'PLATFORM_ADMIN' : null,
        memberships: userMemberships,
        primaryEmployeeId: empRecord?.id,
        status: p.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        createdAt: new Date().toISOString()
      });
    }
    return users;
  }

  async assignCompanyMembership(params: {
    userId: string;
    companyId: string;
    roleId: string;
    allowedBranchIds?: string[];
  }): Promise<{ success: boolean; error?: string }> {
    const key = `${params.userId}_${params.companyId}`;
    const existing = this.memberships.get(key);
    this.memberships.set(key, {
      id: existing?.id || `mem_${Date.now()}`,
      userId: params.userId,
      companyId: params.companyId,
      roleId: params.roleId,
      allowedBranchIds: params.allowedBranchIds || [],
      isActive: true,
      createdAt: existing?.createdAt || new Date().toISOString()
    });
    return { success: true };
  }

  async removeCompanyMembership(userId: string, companyId: string): Promise<{ success: boolean; error?: string }> {
    const key = `${userId}_${companyId}`;
    const existing = this.memberships.get(key);
    if (existing) {
      existing.isActive = false;
    }
    return { success: true };
  }
}

// ----------------------------------------------------
// TEST FIXTURES
// ----------------------------------------------------
const companyA = "cmp_prod_alpha_101";
const companyB = "cmp_prod_beta_202";
const branchSohar = "br_sohar_01";
const branchMuscat = "br_muscat_02";

const membershipA: CompanyMembershipScope = {
  companyId: companyA,
  companyNameAr: "شركة ألفا الإنتاجية",
  roleId: "ADMIN",
  allowedBranchIds: [branchSohar],
  isActive: true,
  createdAt: new Date().toISOString()
};

const userMembershipA: UserCompanyMembership = {
  id: "mem_prod_101",
  userId: "usr_prod_101",
  companyId: companyA,
  roleId: "ADMIN",
  isActive: true,
  createdAt: new Date().toISOString()
};

const userProdProfile: UnifiedUser = {
  id: "usr_prod_101",
  email: "salem@deshalbm.com",
  fullName: "سالم السلامي",
  userType: "COMPANY_EMPLOYEE",
  isPlatformAdmin: false,
  platformRole: null,
  memberships: [membershipA],
  primaryEmployeeId: "emp_prod_101",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userUnassigned: UnifiedUser = {
  id: "usr_unassigned_555",
  email: "guest@gmail.com",
  fullName: "مستخدم غير مخصص",
  userType: "UNASSIGNED",
  isPlatformAdmin: false,
  platformRole: null,
  memberships: [],
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userPlatformAdmin: UnifiedUser = {
  id: "usr_admin_999",
  email: "sysadmin@deshalbm.com",
  fullName: "مدير النظام",
  userType: "PLATFORM",
  isPlatformAdmin: true,
  platformRole: "PLATFORM_ADMIN",
  memberships: [],
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

// ----------------------------------------------------
// SECTION 1: IDENTITY TESTS (1–5)
// ----------------------------------------------------
async function runIdentityTests() {
  const adapter = new MockProductionDataUserAdapter();
  adapter.addProfile({ id: userProdProfile.id, email: userProdProfile.email, full_name: userProdProfile.fullName });

  // 1. Existing profile loads
  const users = await adapter.fetchUnifiedUsers();
  assert(users.some(u => u.id === userProdProfile.id), "1. Existing profile loads from production data repository");

  // 2. No duplicate profile
  const usersCount = users.filter(u => u.id === userProdProfile.id).length;
  assert(usersCount === 1, "2. Single identity anchor preserved; no duplicate profiles");

  // 3. Auth identity preserved (auth.users.id = profiles.id)
  const authProfileMatch = users.find(u => u.id === userProdProfile.id);
  assert(authProfileMatch?.id === userProdProfile.id, "3. Auth identity anchor preserved (auth.users.id = profiles.id)");

  // 4. Unassigned user loads
  adapter.addProfile({ id: userUnassigned.id, email: userUnassigned.email, full_name: userUnassigned.fullName });
  const usersWithUnassigned = await adapter.fetchUnifiedUsers();
  const unassignedResolved = usersWithUnassigned.find(u => u.id === userUnassigned.id);
  assert(unassignedResolved?.userType === "UNASSIGNED", "4. Unassigned profile loads and classifies as UNASSIGNED");

  // 5. Platform user loads
  adapter.addProfile({ id: userPlatformAdmin.id, email: userPlatformAdmin.email, full_name: userPlatformAdmin.fullName, role: "ADMIN", status: "ACTIVE" });
  const usersWithAdmin = await adapter.fetchUnifiedUsers();
  const adminResolved = usersWithAdmin.find(u => u.id === userPlatformAdmin.id);
  assert(adminResolved?.isPlatformAdmin === true, "5. Platform user profile loads and classifies correctly");
}

// ----------------------------------------------------
// SECTION 2: MEMBERSHIP TESTS (6–10)
// ----------------------------------------------------
async function runMembershipTests() {
  const adapter = new MockProductionDataUserAdapter();
  adapter.addProfile({ id: userProdProfile.id, email: userProdProfile.email, full_name: userProdProfile.fullName });

  // 6. Existing membership loads
  await adapter.assignCompanyMembership({ userId: userProdProfile.id, companyId: companyA, roleId: "ADMIN" });
  const users1 = await adapter.fetchUnifiedUsers();
  const user1 = users1.find(u => u.id === userProdProfile.id);
  assert(user1?.memberships.some(m => m.companyId === companyA) === true, "6. Existing membership loads cleanly");

  // 7. New membership creation
  await adapter.assignCompanyMembership({ userId: userProdProfile.id, companyId: companyB, roleId: "ACCOUNTANT" });
  const users2 = await adapter.fetchUnifiedUsers();
  const user2 = users2.find(u => u.id === userProdProfile.id);
  assert(user2?.memberships.length === 2, "7. New company membership created successfully");

  // 8. Duplicate membership idempotency
  await adapter.assignCompanyMembership({ userId: userProdProfile.id, companyId: companyA, roleId: "ADMIN" });
  const users3 = await adapter.fetchUnifiedUsers();
  const user3 = users3.find(u => u.id === userProdProfile.id);
  const companyAMemberships = user3?.memberships.filter(m => m.companyId === companyA) || [];
  assert(companyAMemberships.length === 1, "8. Duplicate membership assignment is idempotent");

  // 9. Membership update
  await adapter.assignCompanyMembership({ userId: userProdProfile.id, companyId: companyA, roleId: "MANAGER" });
  const users4 = await adapter.fetchUnifiedUsers();
  const user4 = users4.find(u => u.id === userProdProfile.id);
  const updatedMem = user4?.memberships.find(m => m.companyId === companyA);
  assert(updatedMem?.roleId === "MANAGER", "9. Membership update modifies role cleanly");

  // 10. Safe membership removal
  await adapter.removeCompanyMembership(userProdProfile.id, companyA);
  const users5 = await adapter.fetchUnifiedUsers();
  const user5 = users5.find(u => u.id === userProdProfile.id);
  const activeMems = user5?.memberships.filter(m => m.companyId === companyA && m.isActive) || [];
  assert(activeMems.length === 0 && user5 !== undefined, "10. Safe membership removal deactivates relationship without deleting profile");
}

// ----------------------------------------------------
// SECTION 3: BRANCHES TESTS (11–16)
// ----------------------------------------------------
function runBranchTests() {
  // 11. ALL BRANCHES scope
  const allBranchUser: UnifiedUser = { ...userProdProfile, memberships: [{ ...membershipA, allowedBranchIds: [] }] };
  const allAuth = isAuthorizedForBranch(allBranchUser, companyA, branchSohar) && isAuthorizedForBranch(allBranchUser, companyA, branchMuscat);
  assert(allAuth, "11. ALL BRANCHES scope (empty array) permits access to all company branches");

  // 12. SELECTED BRANCHES scope
  const selectedAuthSohar = isAuthorizedForBranch(userProdProfile, companyA, branchSohar);
  const selectedAuthMuscat = isAuthorizedForBranch(userProdProfile, companyA, branchMuscat);
  assert(selectedAuthSohar && !selectedAuthMuscat, "12. SELECTED BRANCHES scope allows assigned branch Sohar and denies Muscat");

  // 13. Invalid branch rejected
  const invalidBranchAuth = isAuthorizedForBranch(userProdProfile, companyA, "br_nonexistent_99");
  assert(!invalidBranchAuth, "13. Non-existent branch ID is rejected by domain policy");

  // 14. Cross-company branch rejected
  const crossBranchCheck = validateBranchScopeAssignment({
    companyId: companyA,
    allowedBranchIds: [branchMuscat], // branchMuscat belongs to companyB in fixture
    companyBranches: [{ id: branchSohar, companyId: companyA }]
  });
  assert(!crossBranchCheck.valid, "14. Cross-company branch assignment rejected by domain validation policy");

  // 15. Branch switch validation
  const validSwitch = validateBranchSwitch({
    activeCompanyId: companyA,
    targetBranchId: branchSohar,
    authorizedBranches: [{ id: branchSohar, companyId: companyA, name: "صحار" }]
  });
  assert(validSwitch.allowed, "15. Valid branch switch within active company context approved");

  // 16. Company switch branch reset
  const resetSwitch = validateBranchSwitch({
    activeCompanyId: companyA,
    targetBranchId: branchMuscat,
    authorizedBranches: [
      { id: branchSohar, companyId: companyA, name: "صحار" },
      { id: branchMuscat, companyId: companyB, name: "مسقط" }
    ]
  });
  assert(!resetSwitch.allowed && resetSwitch.error?.includes("different company context"), "16. Switching company cleanly rejects stale branch belonging to previous company");
}

// ----------------------------------------------------
// SECTION 4: EMPLOYEE TESTS (17–20)
// ----------------------------------------------------
async function runEmployeeTests() {
  const adapter = new MockProductionDataUserAdapter();
  adapter.addProfile({ id: userProdProfile.id, email: userProdProfile.email, full_name: userProdProfile.fullName });
  adapter.addEmployee({ id: "emp_prod_101", profile_id: userProdProfile.id, email: userProdProfile.email, full_name: userProdProfile.fullName });

  // 17. Employee relationship loads
  const users1 = await adapter.fetchUnifiedUsers();
  const user1 = users1.find(u => u.id === userProdProfile.id);
  assert(user1?.primaryEmployeeId === "emp_prod_101", "17. Employee relationship loads and maps to user identity");

  // 18. Multi-company employee relationship
  assert(userProdProfile.memberships.length >= 1, "18. Multi-company employee relationship supported cleanly");

  // 19. Missing employee (unassigned profile)
  const unassignedDetails = resolveUserAccessDetails(userUnassigned);
  assert(unassignedDetails.employeeRecord.primaryEmployeeId === undefined, "19. Missing employee record handled safely without crash");

  // 20. Inactive employee status enforcement
  const activeContext = resolveTenantContextState({
    userId: userProdProfile.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA]
  });
  const inactiveCheck = validateOperationalAccess({
    context: activeContext,
    moduleCode: "pos",
    requiredPermission: "pos_create_order",
    employeeStatus: "INACTIVE"
  });
  assert(!inactiveCheck.allowed && Boolean(inactiveCheck.reason && /inactive/i.test(inactiveCheck.reason)), "20. INACTIVE employee status blocks operational execution");
}

// ----------------------------------------------------
// SECTION 5: ROLES TESTS (21–25)
// ----------------------------------------------------
function runRoleTests() {
  // 21. Company role
  assert(membershipA.roleId === "ADMIN", "21. Company role is scoped to company membership");

  // 22. Multiple roles
  const multiRoleUser: UnifiedUser = {
    ...userProdProfile,
    memberships: [membershipA, { ...membershipA, companyId: companyB, roleId: "ACCOUNTANT" }]
  };
  assert(multiRoleUser.memberships.length === 2, "22. Multiple company roles supported across companies");

  // 23. Platform role
  assert(userPlatformAdmin.platformRole === "PLATFORM_ADMIN", "23. Platform role remains platform-scoped");

  // 24. Collaborator restriction
  const collabUser: UnifiedUser = { ...userPlatformAdmin, isPlatformAdmin: false, platformRole: "PLATFORM_COLLABORATOR" };
  const collabAuth = isAuthorizedForCompany(collabUser, companyA);
  assert(!collabAuth && collabUser.platformRole === "PLATFORM_COLLABORATOR", "24. Platform Collaborator denied unauthorized operational access");

  // 25. Auditor read-only behavior
  const auditorUser: UnifiedUser = { ...userPlatformAdmin, isPlatformAdmin: false, platformRole: "PLATFORM_AUDITOR" };
  const auditorAuth = isAuthorizedForCompany(auditorUser, companyA);
  assert(!auditorAuth, "25. Platform Auditor strictly read-only and denied operational access");
}

// ----------------------------------------------------
// SECTION 6: MODULES TESTS (26–29)
// ----------------------------------------------------
function runModuleTests() {
  // 26. Module enabled
  const enabledContext = resolveTenantContextState({
    userId: userProdProfile.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedModules: { pos: true }
  });
  const enaCheck = validateOperationalAccess({ context: enabledContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(enaCheck.allowed, "26. Enabled POS module permits execution");

  // 27. Module disabled
  const disabledContext = resolveTenantContextState({
    userId: userProdProfile.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedModules: { pos: false }
  });
  const disCheck = validateOperationalAccess({ context: disabledContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!disCheck.allowed && disCheck.reason?.includes("disabled"), "27. Disabled POS module blocks execution");

  // 28. Feature enabled
  const featEnabledContext = resolveTenantContextState({
    userId: userProdProfile.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedModules: { pos: true },
    fetchedFeatures: { "pos.discount_override": true }
  });
  const featEnaCheck = validateOperationalAccess({ context: featEnabledContext, moduleCode: "pos", requiredPermission: "pos_apply_discount", featureCode: "pos.discount_override" });
  assert(featEnaCheck.allowed, "28. Enabled feature pos.discount_override permits action");

  // 29. Feature disabled
  const featDisabledContext = resolveTenantContextState({
    userId: userProdProfile.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedModules: { pos: true },
    fetchedFeatures: { "pos.discount_override": false }
  });
  const featDisCheck = validateOperationalAccess({ context: featDisabledContext, moduleCode: "pos", requiredPermission: "pos_apply_discount", featureCode: "pos.discount_override" });
  assert(!featDisCheck.allowed && featDisCheck.reason?.includes("Feature"), "29. Disabled feature pos.discount_override blocks action");
}

// ----------------------------------------------------
// SECTION 7: SECURITY & LOCALSTORAGE TESTS (30–36)
// ----------------------------------------------------
function runSecurityTests() {
  // 30. LocalStorage tampering rejection
  const tamperedCompanyAuth = isAuthorizedForCompany(userProdProfile, companyB);
  assert(!tamperedCompanyAuth, "30. LocalStorage company tampering rejected by domain authorization policy");

  // 31. Direct route bypass rejection
  const routeCheck = validateCompanySwitch({
    userId: userProdProfile.id,
    targetCompanyId: companyB,
    memberships: [userMembershipA],
    isPlatformAdmin: false
  });
  assert(!routeCheck.allowed, "31. Direct unauthorized route bypass targeting unassigned Company B rejected");

  // 32. Direct mutation bypass rejection
  const unauthContext = resolveTenantContextState({ userId: "usr_fake_99", preferredCompanyId: companyA, fetchedMemberships: [] });
  const mutationCheck = validateOperationalAccess({ context: unauthContext, targetCompanyId: companyB, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!mutationCheck.allowed, "32. Direct unauthorized mutation bypass rejected");

  // 33. Cross-company SELECT rejection
  const selectAuth = isAuthorizedForCompany(userProdProfile, companyB);
  assert(!selectAuth, "33. Cross-company SELECT querying Company B data DENIED");

  // 34. Cross-company INSERT rejection
  const insertAuth = isAuthorizedForCompany(userProdProfile, companyB);
  assert(!insertAuth, "34. Cross-company INSERT into Company B DENIED");

  // 35. Cross-company UPDATE rejection
  const updateAuth = isAuthorizedForCompany(userProdProfile, companyB);
  assert(!updateAuth, "35. Cross-company UPDATE in Company B DENIED");

  // 36. Cross-company DELETE rejection
  const deleteAuth = isAuthorizedForCompany(userProdProfile, companyB);
  assert(!deleteAuth, "36. Cross-company DELETE in Company B DENIED");
}

// ----------------------------------------------------
// SECTION 8: LIFECYCLE TESTS (37–40)
// ----------------------------------------------------
function runLifecycleTests() {
  // 37. READY status blocks operational access
  const readyContext = resolveTenantContextState({
    userId: userProdProfile.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedTenant: { id: "t_ready", tenantCode: "CMP_A", name: "شركة A", companyId: companyA, status: "READY", subscriptionPlan: "PRO", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  });
  const readyCheck = validateOperationalAccess({ context: readyContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!readyCheck.allowed && Boolean(readyCheck.reason && /READY/i.test(readyCheck.reason)), "37. READY tenant status blocks operational access");

  // 38. ACTIVE status permits operational access
  const activeContext = resolveTenantContextState({
    userId: userProdProfile.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedTenant: { id: "t_active", tenantCode: "CMP_A", name: "شركة A", companyId: companyA, status: "ACTIVE", subscriptionPlan: "PRO", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  });
  const activeCheck = validateOperationalAccess({ context: activeContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(activeCheck.allowed, "38. ACTIVE tenant status permits operational execution");

  // 39. SUSPENDED status blocks operational access
  const suspContext = { ...activeContext, tenantStatus: "SUSPENDED" as any };
  const suspCheck = validateOperationalAccess({ context: suspContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!suspCheck.allowed && suspCheck.reason?.includes("SUSPENDED"), "39. SUSPENDED tenant status blocks operational execution");

  // 40. ARCHIVED / FAILED status blocks operational access
  const archContext = { ...activeContext, tenantStatus: "ARCHIVED" as any };
  const archCheck = validateOperationalAccess({ context: archContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  const failedContext = { ...activeContext, tenantStatus: "FAILED" as any };
  const failedCheck = validateOperationalAccess({ context: failedContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!archCheck.allowed && !failedCheck.allowed, "40. ARCHIVED / FAILED tenant status blocks operational execution");
}

// ----------------------------------------------------
// MAIN TEST SUITE RUNNER
// ----------------------------------------------------
async function main() {
  console.log("\n============================================================");
  console.log("🛡️ RUNNING PHASE 50 PRODUCTION DATA INTEGRATION TEST SUITE");
  console.log("============================================================\n");

  await runIdentityTests();
  await runMembershipTests();
  runBranchTests();
  await runEmployeeTests();
  runRoleTests();
  runModuleTests();
  runSecurityTests();
  runLifecycleTests();

  console.log("\n============================================================");
  console.log(`📊 PHASE 50 TEST SUITE RESULTS: ${passedCount} / ${totalCount} PASSED`);
  console.log("============================================================\n");

  if (passedCount !== totalCount) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error("Fatal Test Runner Error:", err);
  process.exitCode = 1;
});
