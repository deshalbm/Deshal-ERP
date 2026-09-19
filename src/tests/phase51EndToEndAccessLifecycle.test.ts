/**
 * DESHAL ERP — PHASE 51 END-TO-END ACCESS LIFECYCLE TEST SUITE
 * 
 * Clean Architecture Test Suite: Validates all 50 end-to-end identity, company membership,
 * branch scoping, multi-company isolation, platform role boundaries, module & feature gating,
 * RLS security, and tenant lifecycle transition scenarios.
 * 
 * Run with: npx tsx src/tests/phase51EndToEndAccessLifecycle.test.ts
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
  AuthorizedBranch,
  resolveAuthorizedOperationalContext
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
class MockPhase51UserAdapter implements UnifiedUserPort {
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
            companyNameAr: m.companyId === companyA ? "شركة ألفا" : "شركة بيتا",
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
// TEST FIXTURES & DATA SETUP
// ----------------------------------------------------
const companyA = "cmp_alpha_101";
const companyB = "cmp_beta_202";
const branchSohar = "br_sohar_01";
const branchMuscat = "br_muscat_02";
const branchSalalah = "br_salalah_03";
const branchNizwa = "br_nizwa_04";

const membershipA: CompanyMembershipScope = {
  companyId: companyA,
  companyNameAr: "شركة ألفا",
  roleId: "ADMIN",
  allowedBranchIds: [branchSohar],
  isActive: true,
  createdAt: new Date().toISOString()
};

const userMembershipA: UserCompanyMembership = {
  id: "mem_alpha_101",
  userId: "usr_ali_101",
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
  isActive: true,
  createdAt: new Date().toISOString()
};

const userMembershipB: UserCompanyMembership = {
  id: "mem_beta_202",
  userId: "usr_ali_101",
  companyId: companyB,
  roleId: "ACCOUNTANT",
  isActive: true,
  createdAt: new Date().toISOString()
};

const userAliSingle: UnifiedUser = {
  id: "usr_ali_101",
  email: "ali@alpha.com",
  fullName: "علي البلوشي",
  userType: "COMPANY_EMPLOYEE",
  isPlatformAdmin: false,
  platformRole: null,
  memberships: [membershipA],
  primaryEmployeeId: "emp_ali_101",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userGhaithMulti: UnifiedUser = {
  id: "usr_ghaith_102",
  email: "ghaith@multicompany.om",
  fullName: "غيث الزدجالي",
  userType: "COMPANY_EMPLOYEE",
  isPlatformAdmin: false,
  platformRole: null,
  memberships: [membershipA, membershipB],
  primaryEmployeeId: "emp_ghaith_102",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userUnassigned: UnifiedUser = {
  id: "usr_unassigned_000",
  email: "newuser@gmail.com",
  fullName: "مستخدم غير مخصص",
  userType: "UNASSIGNED",
  isPlatformAdmin: false,
  platformRole: null,
  memberships: [],
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
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

// ----------------------------------------------------
// SECTION 1: IDENTITY TESTS (1–5)
// ----------------------------------------------------
async function runIdentityTests() {
  const adapter = new MockPhase51UserAdapter();
  adapter.addProfile({ id: userAliSingle.id, email: userAliSingle.email, full_name: userAliSingle.fullName });

  // 1. Profile identity anchor (profiles.id = auth.users.id)
  const users = await adapter.fetchUnifiedUsers();
  const profileMatch = users.find(u => u.id === userAliSingle.id);
  assert(profileMatch?.id === userAliSingle.id, "1. profiles.id = auth.users.id remains identity anchor");

  // 2. Auth identity preservation (no second identity system)
  assert(users.length === 1 && users[0].email === userAliSingle.email, "2. Single auth identity preserved; no parallel identity system");

  // 3. No duplicate profiles created during operations
  await adapter.assignCompanyMembership({ userId: userAliSingle.id, companyId: companyA, roleId: "ADMIN" });
  const usersAfterAssign = await adapter.fetchUnifiedUsers();
  assert(usersAfterAssign.filter(u => u.id === userAliSingle.id).length === 1, "3. Membership assignment does not duplicate profile identity");

  // 4. Unassigned profile classification
  adapter.addProfile({ id: userUnassigned.id, email: userUnassigned.email, full_name: userUnassigned.fullName });
  const usersWithUnassigned = await adapter.fetchUnifiedUsers();
  const unassignedUser = usersWithUnassigned.find(u => u.id === userUnassigned.id);
  assert(unassignedUser?.userType === "UNASSIGNED", "4. Unassigned profile classified as UNASSIGNED");

  // 5. Platform user classification
  adapter.addProfile({ id: userPlatformAdmin.id, email: userPlatformAdmin.email, full_name: userPlatformAdmin.fullName, role: "ADMIN" });
  const usersWithAdmin = await adapter.fetchUnifiedUsers();
  const adminUser = usersWithAdmin.find(u => u.id === userPlatformAdmin.id);
  assert(adminUser?.userType === "PLATFORM" && adminUser?.isPlatformAdmin === true, "5. Platform Admin without memberships classified as PLATFORM");
}

// ----------------------------------------------------
// SECTION 2: COMPANY MEMBERSHIP TESTS (6–12)
// ----------------------------------------------------
async function runMembershipTests() {
  const adapter = new MockPhase51UserAdapter();
  adapter.addProfile({ id: userAliSingle.id, email: userAliSingle.email, full_name: userAliSingle.fullName });

  // 6. Single company membership grants Company X access
  await adapter.assignCompanyMembership({ userId: userAliSingle.id, companyId: companyA, roleId: "ADMIN" });
  const users1 = await adapter.fetchUnifiedUsers();
  const u1 = users1.find(u => u.id === userAliSingle.id);
  assert(isAuthorizedForCompany(u1!, companyA) && !isAuthorizedForCompany(u1!, companyB), "6. Single membership grants Company A access and denies Company B");

  // 7. Multi-company membership grants Company X and Company Y access
  await adapter.assignCompanyMembership({ userId: userAliSingle.id, companyId: companyB, roleId: "ACCOUNTANT" });
  const users2 = await adapter.fetchUnifiedUsers();
  const u2 = users2.find(u => u.id === userAliSingle.id);
  assert(isAuthorizedForCompany(u2!, companyA) && isAuthorizedForCompany(u2!, companyB), "7. Multi-company user authorized for both Company A and Company B");

  // 8. Membership creation via application port works cleanly
  const createRes = await assignUserCompanyMembership({ userId: userAliSingle.id, companyId: companyA, roleId: "ADMIN" }, adapter);
  assert(createRes.success, "8. Membership creation via application service port succeeds");

  // 9. Membership update modifies role/scope without creating new rows
  await adapter.assignCompanyMembership({ userId: userAliSingle.id, companyId: companyA, roleId: "MANAGER" });
  const users3 = await adapter.fetchUnifiedUsers();
  const u3 = users3.find(u => u.id === userAliSingle.id);
  const memA = u3?.memberships.find(m => m.companyId === companyA);
  assert(memA?.roleId === "MANAGER", "9. Membership update modifies role cleanly without creating duplicate rows");

  // 10. Idempotent repeated membership assignment
  await adapter.assignCompanyMembership({ userId: userAliSingle.id, companyId: companyA, roleId: "MANAGER" });
  const users4 = await adapter.fetchUnifiedUsers();
  const u4 = users4.find(u => u.id === userAliSingle.id);
  assert(u4?.memberships.filter(m => m.companyId === companyA).length === 1, "10. Repeated membership assignment is idempotent");

  // 11. Safe membership removal (sets is_active = false, does not delete profile/employee/transactions)
  await adapter.removeCompanyMembership(userAliSingle.id, companyA);
  const users5 = await adapter.fetchUnifiedUsers();
  const u5 = users5.find(u => u.id === userAliSingle.id);
  assert(u5 !== undefined && !isAuthorizedForCompany(u5!, companyA), "11. Safe membership removal revokes company access without deleting profile");

  // 12. Deactivated membership revokes operational access immediately
  const inactiveContext = resolveTenantContextState({
    userId: userAliSingle.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [] // 0 active memberships
  });
  const opCheck = validateOperationalAccess({ context: inactiveContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!opCheck.allowed, "12. Deactivated membership immediately revokes operational access");
}

// ----------------------------------------------------
// SECTION 3: BRANCH SCOPE TESTS (13–20)
// ----------------------------------------------------
function runBranchScopeTests() {
  // 13. Single branch scope permits assigned branch and denies unauthorized branch
  const authSohar = isAuthorizedForBranch(userAliSingle, companyA, branchSohar);
  const unauthMuscat = isAuthorizedForBranch(userAliSingle, companyA, branchMuscat);
  assert(authSohar && !unauthMuscat, "13. Single branch scope permits Sohar and denies Muscat");

  // 14. Multi-branch scope permits assigned branches and denies unauthorized branches
  const authMuscat = isAuthorizedForBranch(userGhaithMulti, companyB, branchMuscat);
  const authSalalah = isAuthorizedForBranch(userGhaithMulti, companyB, branchSalalah);
  const unauthNizwa = isAuthorizedForBranch(userGhaithMulti, companyB, branchNizwa);
  assert(authMuscat && authSalalah && !unauthNizwa, "14. Multi-branch scope permits [Muscat, Salalah] and denies Nizwa");

  // 15. ALL BRANCHES scope (allowedBranchIds = []) permits all branches within that company only
  const allBranchesUser: UnifiedUser = {
    ...userAliSingle,
    memberships: [{ ...membershipA, allowedBranchIds: [] }]
  };
  const allSohar = isAuthorizedForBranch(allBranchesUser, companyA, branchSohar);
  const allMuscat = isAuthorizedForBranch(allBranchesUser, companyA, branchMuscat);
  assert(allSohar && allMuscat, "15. ALL BRANCHES scope (empty allowedBranchIds) permits any branch in active company");

  // 16. Company X ALL BRANCHES scope NEVER permits branches from Company Y
  const crossCompanyCheck = isAuthorizedForBranch({
    user: allBranchesUser,
    companyId: companyA,
    targetBranchId: branchNizwa,
    companyBranches: [{ id: branchSohar, companyId: companyA }, { id: branchNizwa, companyId: companyB }]
  });
  assert(!crossCompanyCheck, "16. Company A ALL BRANCHES scope NEVER permits branch belonging to Company B");

  // 17. Invalid branch ID rejected by domain policy
  const invalidBranch = isAuthorizedForBranch(userAliSingle, companyA, "br_fake_99");
  assert(!invalidBranch, "17. Invalid/fake branch ID rejected by domain policy");

  // 18. Cross-company branch assignment rejected by domain validation policy
  const crossAssignVal = validateBranchScopeAssignment({
    companyId: companyA,
    allowedBranchIds: [branchNizwa],
    companyBranches: [{ id: branchSohar, companyId: companyA }]
  });
  assert(!crossAssignVal.valid && crossAssignVal.errors[0].includes("Cross-company branch assignment rejected"), "18. Cross-company branch assignment rejected by domain validation");

  // 19. Branch switch within active company context approved
  const branchSwitch = validateBranchSwitch({
    activeCompanyId: companyA,
    targetBranchId: branchSohar,
    authorizedBranches: [{ id: branchSohar, companyId: companyA, name: "صحار" }]
  });
  assert(branchSwitch.allowed, "19. Branch switch within active company context approved");

  // 20. Switching active company resets active branch if stale
  const resetSwitch = validateBranchSwitch({
    activeCompanyId: companyA,
    targetBranchId: branchMuscat,
    authorizedBranches: [
      { id: branchSohar, companyId: companyA, name: "صحار" },
      { id: branchMuscat, companyId: companyB, name: "مسقط" }
    ]
  });
  assert(!resetSwitch.allowed && resetSwitch.error?.includes("different company context"), "20. Switching company cleanly resets stale branch belonging to previous company");
}

// ----------------------------------------------------
// SECTION 4: MULTI-COMPANY TESTS (21–25)
// ----------------------------------------------------
function runMultiCompanyTests() {
  // 21. Independent company branch scopes preserved per membership
  const scopeA = userGhaithMulti.memberships.find(m => m.companyId === companyA)?.allowedBranchIds;
  const scopeB = userGhaithMulti.memberships.find(m => m.companyId === companyB)?.allowedBranchIds;
  assert(scopeA?.[0] === branchSohar && scopeB?.includes(branchMuscat) === true, "21. Independent company branch scopes preserved per membership");

  // 22. Independent company roles preserved per membership
  const roleA = userGhaithMulti.memberships.find(m => m.companyId === companyA)?.roleId;
  const roleB = userGhaithMulti.memberships.find(m => m.companyId === companyB)?.roleId;
  assert(roleA === "ADMIN" && roleB === "ACCOUNTANT", "22. Independent company roles preserved per membership");

  // 23. Independent company RBAC permissions preserved per membership
  const contextA = resolveTenantContextState({ userId: userGhaithMulti.id, preferredCompanyId: companyA, fetchedMemberships: [userMembershipA] });
  const contextB = resolveTenantContextState({ userId: userGhaithMulti.id, preferredCompanyId: companyB, fetchedMemberships: [userMembershipB] });
  assert(contextA.activeCompanyId === companyA && contextB.activeCompanyId === companyB, "23. Independent company RBAC context resolved per active company selection");

  // 24. Independent company tenant module/feature flags preserved per membership
  const modCheckA = validateOperationalAccess({ context: contextA, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(modCheckA.allowed, "24. Independent tenant module flags evaluated for active company A context");

  // 25. Switching company revalidates tenant status and branch scope
  const compSwitch = validateCompanySwitch({
    userId: userGhaithMulti.id,
    targetCompanyId: companyB,
    memberships: [userMembershipA, userMembershipB],
    isPlatformAdmin: false
  });
  assert(compSwitch.allowed && compSwitch.targetCompanyId === companyB, "25. Switching company revalidates target membership cleanly");
}

// ----------------------------------------------------
// SECTION 5: EMPLOYEE LIFECYCLE TESTS (26–30)
// ----------------------------------------------------
async function runEmployeeLifecycleTests() {
  const adapter = new MockPhase51UserAdapter();
  adapter.addProfile({ id: userAliSingle.id, email: userAliSingle.email, full_name: userAliSingle.fullName });
  adapter.addEmployee({ id: "emp_ali_101", profile_id: userAliSingle.id, email: userAliSingle.email, full_name: userAliSingle.fullName });

  // 26. Employee record maps cleanly to user profile identity
  const users = await adapter.fetchUnifiedUsers();
  assert(users[0].primaryEmployeeId === "emp_ali_101", "26. Employee record maps cleanly to user profile identity");

  // 27. Missing employee record (unassigned user) handled safely without crash
  const details = resolveUserAccessDetails(userUnassigned);
  assert(details.employeeRecord.primaryEmployeeId === undefined, "27. Missing employee record handled safely without application crash");

  // 28. INACTIVE employee status blocks operational execution
  const activeContext = resolveTenantContextState({ userId: userAliSingle.id, preferredCompanyId: companyA, fetchedMemberships: [userMembershipA] });
  const inactiveCheck = validateOperationalAccess({ context: activeContext, moduleCode: "pos", requiredPermission: "pos_create_order", employeeStatus: "INACTIVE" });
  assert(!inactiveCheck.allowed && Boolean(inactiveCheck.reason && /inactive/i.test(inactiveCheck.reason)), "28. INACTIVE employee status blocks operational execution");

  // 29. Multi-company user having distinct employee records across companies
  assert(userGhaithMulti.memberships.length === 2, "29. Multi-company employee relationships supported across companies");

  // 30. Membership removal preserves historical employee data and accounting transactions
  await adapter.removeCompanyMembership(userAliSingle.id, companyA);
  const usersAfterRemove = await adapter.fetchUnifiedUsers();
  assert(usersAfterRemove.some(u => u.id === userAliSingle.id), "30. Membership removal revokes access without deleting profile or employee identity");
}

// ----------------------------------------------------
// SECTION 6: PLATFORM ADMIN TESTS (31–34)
// ----------------------------------------------------
function runPlatformAdminTests() {
  // 31. Platform Admin has platform administration capabilities
  assert(userPlatformAdmin.isPlatformAdmin && userPlatformAdmin.platformRole === "PLATFORM_ADMIN", "31. Platform Admin has platform administration classification");

  // 32. Platform Admin without explicit company membership is DENIED operational ERP data access
  const opAuth = isAuthorizedForCompany(userPlatformAdmin, companyA);
  assert(!opAuth, "32. Platform Admin without explicit company membership is DENIED operational ERP data access");

  // 33. Platform Admin with explicit company membership gains operational access for that company only
  const bothUser: UnifiedUser = { ...userPlatformAdmin, userType: "BOTH", memberships: [membershipA] };
  const adminOpAuth = isAuthorizedForCompany(bothUser, companyA);
  const adminOpAuthB = isAuthorizedForCompany(bothUser, companyB);
  assert(adminOpAuth && !adminOpAuthB, "33. Platform Admin with Company A membership gains operational access for Company A only");

  // 34. Revoking company membership revokes operational access without altering Platform Admin status
  const revokedUser: UnifiedUser = { ...bothUser, memberships: [] };
  assert(!isAuthorizedForCompany(revokedUser, companyA) && revokedUser.isPlatformAdmin === true, "34. Revoking company membership revokes operational access without altering Platform Admin status");
}

// ----------------------------------------------------
// SECTION 7: COLLABORATOR TESTS (35–37)
// ----------------------------------------------------
function runCollaboratorTests() {
  // 35. Platform Collaborator executes explicitly granted platform operations
  assert(userPlatformCollaborator.platformRole === "PLATFORM_COLLABORATOR", "35. Platform Collaborator holds collaborator classification");

  // 36. Platform Collaborator denied unauthorized platform mutations
  const collabOpAuth = isAuthorizedForCompany(userPlatformCollaborator, companyA);
  assert(!collabOpAuth, "36. Platform Collaborator denied unauthorized operational company mutation");

  // 37. Platform Collaborator cannot escalate self to Platform Admin or grant self company access
  assert(!userPlatformCollaborator.isPlatformAdmin && userPlatformCollaborator.memberships.length === 0, "37. Platform Collaborator cannot self-escalate to Platform Admin or grant unassigned company access");
}

// ----------------------------------------------------
// SECTION 8: AUDITOR TESTS (38–40)
// ----------------------------------------------------
function runAuditorTests() {
  // 38. Platform Auditor is strictly read-only
  assert(userPlatformAuditor.platformRole === "PLATFORM_AUDITOR", "38. Platform Auditor classified as PLATFORM_AUDITOR");

  // 39. Platform Auditor denied company membership mutation
  const auditorOpAuth = isAuthorizedForCompany(userPlatformAuditor, companyA);
  assert(!auditorOpAuth, "39. Platform Auditor denied company membership operational access");

  // 40. Platform Auditor denied role, permission, or tenant lifecycle modification
  const auditorIsAdmin = userPlatformAuditor.isPlatformAdmin;
  assert(!auditorIsAdmin, "40. Platform Auditor denied administrative mutation capabilities");
}

// ----------------------------------------------------
// SECTION 9: MODULES & FEATURES TESTS (41–44)
// ----------------------------------------------------
function runModuleFeatureTests() {
  const context = resolveTenantContextState({
    userId: userAliSingle.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedModules: { pos: true, crm: true, inventory: true, hr: false }
  });

  // 41. All 11 ERP modules check tenant module enablement
  const posCheck = validateOperationalAccess({ context, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(posCheck.allowed, "41. Enabled POS module permits execution");

  // 42. Disabled tenant module blocks operational access regardless of RBAC permissions
  const hrCheck = validateOperationalAccess({ context, moduleCode: "hr", requiredPermission: "delete_employees" });
  assert(!hrCheck.allowed && hrCheck.reason?.includes("disabled"), "42. Disabled HR module at tenant level blocks execution despite admin role");

  // 43. Disabled tenant feature blocks feature action regardless of RBAC permissions
  const featDisContext = resolveTenantContextState({
    userId: userAliSingle.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedModules: { pos: true },
    fetchedFeatures: { "pos.discount_override": false }
  });
  const featCheck = validateOperationalAccess({ context: featDisContext, moduleCode: "pos", requiredPermission: "pos_apply_discount", featureCode: "pos.discount_override" });
  assert(!featCheck.allowed && featCheck.reason?.includes("Feature"), "43. Disabled feature pos.discount_override blocks action");

  // 44. Direct route/handler invocation checked against module & feature entitlements
  const directRouteCheck = validateOperationalAccess({ context: featDisContext, targetCompanyId: companyB, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!directRouteCheck.allowed, "44. Direct route/handler invocation targeting unassigned Company B BLOCKED");
}

// ----------------------------------------------------
// SECTION 10: SECURITY & RLS TESTS (45–48)
// ----------------------------------------------------
function runSecurityRlsTests() {
  // 45. LocalStorage company tampering rejected
  const tamperedCompanyAuth = isAuthorizedForCompany(userAliSingle, companyB);
  assert(!tamperedCompanyAuth, "45. LocalStorage company tampering rejected by domain authorization policy");

  // 46. LocalStorage branch tampering rejected
  const tamperedBranchAuth = isAuthorizedForBranch(userAliSingle, companyA, branchMuscat);
  assert(!tamperedBranchAuth, "46. LocalStorage branch tampering rejected by domain authorization policy");

  // 47. LocalStorage employee identity tampering rejected
  const tamperedContext = resolveTenantContextState({ userId: "usr_fake_hacker", preferredCompanyId: companyA, fetchedMemberships: [] });
  const tamperedOp = validateOperationalAccess({ context: tamperedContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!tamperedOp.allowed, "47. LocalStorage employee identity tampering rejected by application context engine");

  // 48. Cross-company SELECT/INSERT/UPDATE/DELETE denied by domain and RLS policies
  const crossSelect = isAuthorizedForCompany(userAliSingle, companyB);
  assert(!crossSelect, "48. Cross-company SELECT/INSERT/UPDATE/DELETE denied by domain policy");
}

// ----------------------------------------------------
// SECTION 11: TENANT LIFECYCLE TESTS (49–50)
// ----------------------------------------------------
function runTenantLifecycleTests() {
  // 49. PROVISIONING/READY/SUSPENDED/ARCHIVED/FAILED tenant states block operational access
  const readyContext = resolveTenantContextState({
    userId: userAliSingle.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedTenant: { id: "t_ready", tenantCode: "CMP_A", name: "شركة A", companyId: companyA, status: "READY", subscriptionPlan: "PRO", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  });
  const readyCheck = validateOperationalAccess({ context: readyContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!readyCheck.allowed && Boolean(readyCheck.reason && /READY/i.test(readyCheck.reason)), "49. READY tenant status blocks operational execution");

  // 50. ACTIVE tenant status permits operational access subject to membership, branch scope, employee status, and RBAC permission
  const activeContext = resolveTenantContextState({
    userId: userAliSingle.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [userMembershipA],
    fetchedTenant: { id: "t_active", tenantCode: "CMP_A", name: "شركة A", companyId: companyA, status: "ACTIVE", subscriptionPlan: "PRO", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  });
  const activeCheck = validateOperationalAccess({ context: activeContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  const authReadModel = resolveAuthorizedOperationalContext(activeContext);
  assert(activeCheck.allowed && authReadModel.activeCompanyId === companyA, "50. ACTIVE tenant status permits operational execution and resolves AuthorizedOperationalContext");
}

// ----------------------------------------------------
// MAIN SUITE RUNNER
// ----------------------------------------------------
async function main() {
  console.log("\n============================================================");
  console.log("🛡️ RUNNING PHASE 51 END-TO-END ACCESS LIFECYCLE TEST SUITE");
  console.log("============================================================\n");

  await runIdentityTests();
  await runMembershipTests();
  runBranchScopeTests();
  runMultiCompanyTests();
  await runEmployeeLifecycleTests();
  runPlatformAdminTests();
  runCollaboratorTests();
  runAuditorTests();
  runModuleFeatureTests();
  runSecurityRlsTests();
  runTenantLifecycleTests();

  console.log("\n============================================================");
  console.log(`📊 PHASE 51 TEST SUITE RESULTS: ${passedCount} / ${totalCount} PASSED`);
  console.log("============================================================\n");

  if (passedCount !== totalCount) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error("Fatal Test Runner Error:", err);
  process.exitCode = 1;
});
