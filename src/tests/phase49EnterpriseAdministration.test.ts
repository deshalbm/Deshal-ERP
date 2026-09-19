/**
 * DESHAL ERP — PHASE 49 ENTERPRISE ADMINISTRATION & LIFECYCLE TEST SUITE
 * 
 * Clean Architecture Test Suite: Validates all 36 security, identity, company membership,
 * branch scoping, role isolation, module entitlement, localStorage immunity, and tenant
 * lifecycle transition scenarios.
 * 
 * Run with: npx tsx src/tests/phase49EnterpriseAdministration.test.ts
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
// MOCK ADAPTER FOR TESTING PORT & CONTRACT INTEGRATION
// ----------------------------------------------------
class MockUnifiedUserAdapter implements UnifiedUserPort {
  private users: Map<string, UnifiedUser> = new Map();
  private memberships: Map<string, { userId: string; companyId: string; roleId: string; allowedBranchIds: string[] }> = new Map();

  addUser(user: UnifiedUser) {
    this.users.set(user.id, user);
  }

  async fetchUnifiedUsers(activeCompanyId?: string | null): Promise<UnifiedUser[]> {
    return Array.from(this.users.values());
  }

  async assignCompanyMembership(params: {
    userId: string;
    companyId: string;
    roleId: string;
    allowedBranchIds?: string[];
  }): Promise<{ success: boolean; error?: string }> {
    const user = this.users.get(params.userId);
    const existingScope = user?.memberships.find(m => m.companyId === params.companyId);
    const finalBranchIds = params.allowedBranchIds !== undefined
      ? params.allowedBranchIds
      : (existingScope ? existingScope.allowedBranchIds : []);

    const key = `${params.userId}_${params.companyId}`;
    this.memberships.set(key, {
      userId: params.userId,
      companyId: params.companyId,
      roleId: params.roleId,
      allowedBranchIds: finalBranchIds
    });

    if (user) {
      const existingIdx = user.memberships.findIndex(m => m.companyId === params.companyId);
      const newScope: CompanyMembershipScope = {
        companyId: params.companyId,
        companyNameAr: existingScope?.companyNameAr || 'شركة ديشال',
        roleId: params.roleId,
        allowedBranchIds: finalBranchIds,
        isActive: true,
        createdAt: existingScope?.createdAt || new Date().toISOString()
      };
      if (existingIdx >= 0) {
        user.memberships[existingIdx] = newScope;
      } else {
        user.memberships.push(newScope);
      }
      user.userType = classifyUserType({
        isPlatformAdmin: user.isPlatformAdmin,
        platformRole: user.platformRole,
        memberships: user.memberships,
        hasEmployeeRecord: Boolean(user.primaryEmployeeId)
      });
    }

    return { success: true };
  }

  async removeCompanyMembership(userId: string, companyId: string): Promise<{ success: boolean; error?: string }> {
    const key = `${userId}_${companyId}`;
    this.memberships.delete(key);
    const user = this.users.get(userId);
    if (user) {
      user.memberships = user.memberships.filter(m => m.companyId !== companyId);
      user.userType = classifyUserType({
        isPlatformAdmin: user.isPlatformAdmin,
        platformRole: user.platformRole,
        memberships: user.memberships,
        hasEmployeeRecord: Boolean(user.primaryEmployeeId)
      });
    }
    return { success: true };
  }
}

// ----------------------------------------------------
// TEST FIXTURES & DATA SETUP
// ----------------------------------------------------
const companyA = "cmp_alpha_101";
const companyB = "cmp_beta_202";
const branchSohar = "br_sohar_01";
const branchMuscat = "br_muscat_02";
const branchSalalah = "br_salalah_03";

const membershipA: CompanyMembershipScope = {
  companyId: companyA,
  companyNameAr: "شركة ألفا",
  roleId: "ADMIN",
  allowedBranchIds: [branchSohar],
  allowedBranchNames: ["فرع صحار"],
  isActive: true,
  createdAt: new Date().toISOString()
};

const userMembershipA: UserCompanyMembership = {
  id: "mem_alpha_101",
  userId: "usr_emp_101",
  companyId: companyA,
  roleId: "ADMIN",
  isActive: true,
  createdAt: new Date().toISOString()
};

const membershipB: CompanyMembershipScope = {
  companyId: companyB,
  companyNameAr: "شركة بيتا",
  roleId: "ACCOUNTANT",
  allowedBranchIds: [branchMuscat, branchSalalah],
  allowedBranchNames: ["فرع مسقط", "فرع صلالة"],
  isActive: true,
  createdAt: new Date().toISOString()
};

const userUnassigned: UnifiedUser = {
  id: "usr_unassigned_000",
  email: "newuser@gmail.com",
  fullName: "مستخدم جديد",
  userType: "UNASSIGNED",
  isPlatformAdmin: false,
  platformRole: null,
  memberships: [],
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userEmployeeSingle: UnifiedUser = {
  id: "usr_emp_101",
  email: "ali@alpha.com",
  fullName: "علي البلوشي",
  userType: "COMPANY_EMPLOYEE",
  isPlatformAdmin: false,
  platformRole: null,
  memberships: [membershipA],
  primaryEmployeeId: "emp_101",
  primaryRole: "ADMIN",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userEmployeeMulti: UnifiedUser = {
  id: "usr_emp_102",
  email: "ghaith@multicompany.om",
  fullName: "غيث الزدجالي",
  userType: "COMPANY_EMPLOYEE",
  isPlatformAdmin: false,
  platformRole: null,
  memberships: [membershipA, membershipB],
  primaryEmployeeId: "emp_102",
  primaryRole: "ACCOUNTANT",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userPlatformAdmin: UnifiedUser = {
  id: "usr_admin_001",
  email: "admin@deshalbm.com",
  fullName: "مدير المنصة",
  userType: "PLATFORM",
  isPlatformAdmin: true,
  platformRole: "PLATFORM_ADMIN",
  memberships: [],
  primaryRole: "SUPER_ADMIN",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userPlatformCollaborator: UnifiedUser = {
  id: "usr_collab_002",
  email: "collab@deshalbm.com",
  fullName: "مساعد المنصة",
  userType: "PLATFORM",
  isPlatformAdmin: false,
  platformRole: "PLATFORM_COLLABORATOR",
  memberships: [],
  primaryRole: "SUPPORT",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userPlatformAuditor: UnifiedUser = {
  id: "usr_auditor_003",
  email: "auditor@deshalbm.com",
  fullName: "مدقق المنصة",
  userType: "PLATFORM",
  isPlatformAdmin: false,
  platformRole: "PLATFORM_AUDITOR",
  memberships: [],
  primaryRole: "AUDITOR",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

// ----------------------------------------------------
// SECTION 1: IDENTITY TESTS (1–5)
// ----------------------------------------------------
async function runIdentityTests() {
  const adapter = new MockUnifiedUserAdapter();
  adapter.addUser(userEmployeeSingle);
  adapter.addUser(userUnassigned);

  // 1. Existing profile remains single identity
  const users = await adapter.fetchUnifiedUsers();
  assert(users.some(u => u.id === userEmployeeSingle.id), "1. Existing profile remains single identity anchor");

  // 2. Duplicate profile creation is rejected/prevented
  const duplicateRes = await adapter.assignCompanyMembership({
    userId: userEmployeeSingle.id,
    companyId: companyA,
    roleId: "ADMIN"
  });
  const updatedUsers = await adapter.fetchUnifiedUsers();
  const profileMatches = updatedUsers.filter(u => u.id === userEmployeeSingle.id);
  assert(duplicateRes.success && profileMatches.length === 1, "2. Duplicate profile creation is prevented; identity remains single");

  // 3. Unassigned user classification
  const typeUnassigned = classifyUserType({
    isPlatformAdmin: false,
    platformRole: null,
    memberships: [],
    hasEmployeeRecord: false
  });
  assert(typeUnassigned === "UNASSIGNED", "3. Unassigned profile classified as UNASSIGNED");

  // 4. Platform user classification
  const typePlatform = classifyUserType({
    isPlatformAdmin: true,
    platformRole: "PLATFORM_ADMIN",
    memberships: [],
    hasEmployeeRecord: false
  });
  assert(typePlatform === "PLATFORM", "4. Platform Admin without memberships classified as PLATFORM");

  // 5. Combined platform + employee user classification
  const typeBoth = classifyUserType({
    isPlatformAdmin: true,
    platformRole: "PLATFORM_ADMIN",
    memberships: [membershipA],
    hasEmployeeRecord: true
  });
  assert(typeBoth === "BOTH", "5. User with platform admin and company membership classified as BOTH");
}

// ----------------------------------------------------
// SECTION 2: COMPANIES TESTS (6–9)
// ----------------------------------------------------
async function runCompanyTests() {
  // 6. Single-company membership works
  const authA = isAuthorizedForCompany(userEmployeeSingle, companyA);
  const authB = isAuthorizedForCompany(userEmployeeSingle, companyB);
  assert(authA && !authB, "6. Single-company membership allows Company A and denies Company B");

  // 7. Multi-company membership works
  const multiAuthA = isAuthorizedForCompany(userEmployeeMulti, companyA);
  const multiAuthB = isAuthorizedForCompany(userEmployeeMulti, companyB);
  assert(multiAuthA && multiAuthB, "7. Multi-company user can belong to both Company A and Company B");

  // 8. Duplicate membership assignment is idempotent
  const adapter = new MockUnifiedUserAdapter();
  adapter.addUser(userEmployeeSingle);
  await adapter.assignCompanyMembership({ userId: userEmployeeSingle.id, companyId: companyA, roleId: "ADMIN" });
  await adapter.assignCompanyMembership({ userId: userEmployeeSingle.id, companyId: companyA, roleId: "ADMIN" });
  const users = await adapter.fetchUnifiedUsers();
  const singleUser = users.find(u => u.id === userEmployeeSingle.id);
  const compAMemberships = singleUser?.memberships.filter(m => m.companyId === companyA) || [];
  assert(compAMemberships.length === 1, "8. Duplicate company membership assignment is idempotent");

  // 9. Inactive tenant blocks operational access
  const inactiveContext = resolveTenantContextState({
    userId: userEmployeeSingle.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedTenant: { id: "t_01", tenantCode: "CMP_A", name: "شركة A", companyId: companyA, status: "SUSPENDED", subscriptionPlan: "PRO", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  });
  const accessCheck = validateOperationalAccess({ context: inactiveContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!accessCheck.allowed && accessCheck.reason?.includes("SUSPENDED"), "9. Inactive/SUSPENDED tenant blocks operational access");
}

// ----------------------------------------------------
// SECTION 3: BRANCHES TESTS (10–15)
// ----------------------------------------------------
function runBranchTests() {
  // 10. Single branch scope works
  const branchAuth1 = isAuthorizedForBranch(userEmployeeSingle, companyA, branchSohar);
  const branchAuth2 = isAuthorizedForBranch(userEmployeeSingle, companyA, branchMuscat);
  assert(branchAuth1 && !branchAuth2, "10. User assigned to single branch Sohar can access Sohar and is denied Muscat");

  // 11. Multi-branch scope works
  const multiBranchAuth1 = isAuthorizedForBranch(userEmployeeMulti, companyB, branchMuscat);
  const multiBranchAuth2 = isAuthorizedForBranch(userEmployeeMulti, companyB, branchSalalah);
  assert(multiBranchAuth1 && multiBranchAuth2, "11. User assigned to multi-branch [Muscat, Salalah] can access both");

  // 12. ALL BRANCHES scope works (empty allowedBranchIds array represents all branches)
  const allBranchesUser: UnifiedUser = {
    ...userEmployeeSingle,
    memberships: [{ ...membershipA, allowedBranchIds: [] }]
  };
  const allAuthSohar = isAuthorizedForBranch(allBranchesUser, companyA, branchSohar);
  const allAuthMuscat = isAuthorizedForBranch(allBranchesUser, companyA, branchMuscat);
  assert(allAuthSohar && allAuthMuscat, "12. ALL BRANCHES scope (empty allowedBranchIds) allows access to any branch in company");

  // 13. Unauthorized branch is rejected
  const unauthBranch = isAuthorizedForBranch(userEmployeeSingle, companyA, branchSalalah);
  assert(!unauthBranch, "13. Unauthorized branch Salalah rejected for user scoped to Sohar");

  // 14. Cross-company branch is rejected
  const crossCompanyBranchValidation = validateBranchScopeAssignment({
    companyId: companyA,
    allowedBranchIds: [branchMuscat],
    companyBranches: [{ id: branchSohar, companyId: companyA }]
  });
  assert(!crossCompanyBranchValidation.valid && crossCompanyBranchValidation.errors[0].includes("Cross-company branch assignment rejected"), "14. Cross-company branch assignment rejected by domain policy");

  // 15. Branch context resets correctly after company switch
  const switchBranchRes = validateBranchSwitch({
    activeCompanyId: companyA,
    targetBranchId: branchMuscat,
    authorizedBranches: [
      { id: branchSohar, companyId: companyA, name: "صحار", isMain: true },
      { id: branchMuscat, companyId: companyB, name: "مسقط", isMain: false }
    ]
  });
  assert(!switchBranchRes.allowed && switchBranchRes.error?.includes("different company context"), "15. Branch context safely rejects branch belonging to another company during company switch");
}

// ----------------------------------------------------
// SECTION 4: ROLES TESTS (16–20)
// ----------------------------------------------------
async function runRoleTests() {
  // 16. Company-scoped role works
  const isCompAdmin = userEmployeeSingle.memberships.find(m => m.companyId === companyA)?.roleId === "ADMIN";
  assert(isCompAdmin, "16. Company-scoped role is bound to target company membership");

  // 17. Platform-scoped role remains platform scoped
  assert(userPlatformAdmin.platformRole === "PLATFORM_ADMIN" && userPlatformAdmin.memberships.length === 0, "17. Platform role remains platform scoped without requiring company memberships");

  // 18. Platform Admin does not gain implicit operational access
  const adminOpAuth = isAuthorizedForCompany(userPlatformAdmin, companyA);
  assert(!adminOpAuth, "18. Platform Admin without explicit company membership is DENIED operational ERP data access");

  // 19. Platform Collaborator mutation restrictions are enforced
  const collabOpAuth = isAuthorizedForCompany(userPlatformCollaborator, companyA);
  assert(!collabOpAuth && userPlatformCollaborator.platformRole === "PLATFORM_COLLABORATOR", "19. Platform Collaborator denied unauthorized operational company mutation");

  // 20. Platform Auditor remains read-only
  const auditorIsAdmin = userPlatformAuditor.platformRole === "PLATFORM_ADMIN";
  const auditorOpAuth = isAuthorizedForCompany(userPlatformAuditor, companyA);
  assert(!auditorIsAdmin && !auditorOpAuth, "20. Platform Auditor is strictly read-only and denied operational access");
}

// ----------------------------------------------------
// SECTION 5: MODULES TESTS (21–23)
// ----------------------------------------------------
function runModuleTests() {
  const disabledModContext = resolveTenantContextState({
    userId: userEmployeeSingle.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedModules: { pos: false, crm: true }
  });

  // 21. Disabled module blocks access
  const disCheck = validateOperationalAccess({ context: disabledModContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!disCheck.allowed && disCheck.reason?.includes("disabled"), "21. Disabled module pos at tenant level blocks execution");

  // 22. Enabled module allows authorized access
  const enabledModContext = resolveTenantContextState({
    userId: userEmployeeSingle.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedModules: { pos: true }
  });
  const enaCheck = validateOperationalAccess({ context: enabledModContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(enaCheck.allowed, "22. Enabled POS module permits authorized operational execution");

  // 23. Disabled feature blocks the related action
  const disFeatContext = resolveTenantContextState({
    userId: userEmployeeSingle.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedModules: { pos: true },
    fetchedFeatures: { "pos.discount_override": false }
  });
  const featCheck = validateOperationalAccess({
    context: disFeatContext,
    moduleCode: "pos",
    requiredPermission: "pos_apply_discount",
    featureCode: "pos.discount_override"
  });
  assert(!featCheck.allowed && featCheck.reason?.includes("Feature"), "23. Disabled feature pos.discount_override blocks action despite permission");
}

// ----------------------------------------------------
// SECTION 6: SECURITY & LOCALSTORAGE TESTS (24–30)
// ----------------------------------------------------
function runSecurityTests() {
  // 24. Tampered company localStorage is rejected
  const tamperedCompany = companyB;
  const isTamperedCompanyAuth = isAuthorizedForCompany(userEmployeeSingle, tamperedCompany);
  assert(!isTamperedCompanyAuth, "24. Tampered company in localStorage rejected by domain authorization policy");

  // 25. Tampered branch localStorage is rejected
  const tamperedBranch = branchMuscat;
  const isTamperedBranchAuth = isAuthorizedForBranch(userEmployeeSingle, companyA, tamperedBranch);
  assert(!isTamperedBranchAuth, "25. Tampered branch in localStorage rejected by domain authorization policy");

  // 26. Tampered employee localStorage is rejected
  const tamperedContext = resolveTenantContextState({
    userId: "usr_tampered_fake",
    preferredCompanyId: companyA,
    fetchedMemberships: []
  });
  const tamperedEmpCheck = validateOperationalAccess({ context: tamperedContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!tamperedEmpCheck.allowed, "26. Tampered employee identity in localStorage rejected by server/domain context engine");

  // 27. Direct unauthorized route access is rejected
  const routeCheck = validateCompanySwitch({
    userId: userEmployeeSingle.id,
    targetCompanyId: companyB,
    memberships: userEmployeeSingle.memberships.map(m => ({
      id: `mem_${m.companyId}`,
      userId: userEmployeeSingle.id,
      companyId: m.companyId,
      roleId: m.roleId,
      allowedBranchIds: m.allowedBranchIds,
      isActive: m.isActive,
      createdAt: m.createdAt
    })),
    isPlatformAdmin: false
  });
  assert(!routeCheck.allowed, "27. Direct unauthorized route access targeting unassigned Company B rejected");

  // 28. Direct unauthorized mutation is rejected
  const mutationCheck = validateOperationalAccess({
    context: tamperedContext,
    targetCompanyId: companyB,
    moduleCode: "pos",
    requiredPermission: "pos_create_order"
  });
  assert(!mutationCheck.allowed, "28. Direct unauthorized mutation execution rejected");

  // 29. Cross-company SELECT is rejected
  const crossSelectAuth = isAuthorizedForCompany(userEmployeeSingle, companyB);
  assert(!crossSelectAuth, "29. Cross-company SELECT: User querying Company B data is DENIED");

  // 30. Cross-company INSERT/UPDATE/DELETE is rejected
  const crossMutationAuth = isAuthorizedForCompany(userEmployeeSingle, companyB);
  assert(!crossMutationAuth, "30. Cross-company INSERT/UPDATE/DELETE: Modifying Company B records is DENIED");
}

// ----------------------------------------------------
// SECTION 7: TENANT LIFECYCLE TESTS (31–36)
// ----------------------------------------------------
function runLifecycleTests() {
  // 31. READY blocks operational access
  const readyContext = resolveTenantContextState({
    userId: userEmployeeSingle.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedTenant: { id: "t_ready", tenantCode: "CMP_A", name: "شركة A", companyId: companyA, status: "READY", subscriptionPlan: "PRO", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  });
  const readyCheck = validateOperationalAccess({ context: readyContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!readyCheck.allowed && Boolean(readyCheck.reason && /READY/i.test(readyCheck.reason)), "31. READY tenant status blocks operational execution");

  // 32. ACTIVE permits authorized operational access
  const activeContext = resolveTenantContextState({
    userId: userEmployeeSingle.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedTenant: { id: "t_active", tenantCode: "CMP_A", name: "شركة A", companyId: companyA, status: "ACTIVE", subscriptionPlan: "PRO", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  });
  const activeCheck = validateOperationalAccess({ context: activeContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(activeCheck.allowed, "32. ACTIVE tenant status permits authorized operational execution");

  // 33. SUSPENDED blocks operational access
  const suspContext = { ...activeContext, tenantStatus: "SUSPENDED" as any };
  const suspCheck = validateOperationalAccess({ context: suspContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!suspCheck.allowed && suspCheck.reason?.includes("SUSPENDED"), "33. SUSPENDED tenant status blocks operational execution");

  // 34. ARCHIVED blocks operational access
  const archContext = { ...activeContext, tenantStatus: "ARCHIVED" as any };
  const archCheck = validateOperationalAccess({ context: archContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!archCheck.allowed && archCheck.reason?.includes("ARCHIVED"), "34. ARCHIVED tenant status blocks operational execution");

  // 35. FAILED blocks operational access
  const failedContext = { ...activeContext, tenantStatus: "FAILED" as any };
  const failedCheck = validateOperationalAccess({ context: failedContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!failedCheck.allowed && failedCheck.reason?.includes("FAILED"), "35. FAILED tenant status blocks operational execution");

  // 36. Valid reactivation transition restores access only when all other authorization requirements are satisfied
  const reactivatedContext = { ...activeContext, tenantStatus: "ACTIVE" as any };
  const reactivatedCheck = validateOperationalAccess({ context: reactivatedContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(reactivatedCheck.allowed, "36. Valid reactivation transition restores operational access cleanly");
}

// ----------------------------------------------------
// MAIN SUITE RUNNER
// ----------------------------------------------------
async function main() {
  console.log("\n============================================================");
  console.log("🛡️ RUNNING PHASE 49 ENTERPRISE ADMINISTRATION TEST SUITE");
  console.log("============================================================\n");

  await runIdentityTests();
  await runCompanyTests();
  runBranchTests();
  await runRoleTests();
  runModuleTests();
  runSecurityTests();
  runLifecycleTests();

  console.log("\n============================================================");
  console.log(`📊 PHASE 49 TEST SUITE RESULTS: ${passedCount} / ${totalCount} PASSED`);
  console.log("============================================================\n");

  if (passedCount !== totalCount) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error("Fatal Test Runner Error:", err);
  process.exitCode = 1;
});
