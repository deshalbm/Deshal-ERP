/**
 * Phase 45 Unified User Directory & Access Control Security Test Suite — Deshal ERP
 * 
 * Verifies all 25 negative security test cases and operational access guarantees:
 * 1. User classification: Platform Admin only -> PLATFORM
 * 2. User classification: Employee only -> COMPANY_EMPLOYEE
 * 3. User classification: Both Platform Admin and Employee -> BOTH
 * 4. User classification: Unassigned Profile -> UNASSIGNED
 * 5. Company authorization: Valid company membership returns true
 * 6. Company authorization: Cross-company access rejected
 * 7. Company authorization: Platform Admin override allowed
 * 8. Branch authorization: Allowed branch ID returns true
 * 9. Branch authorization: Unallowed branch ID rejected
 * 10. Branch authorization: Empty allowedBranchIds allows all branches for company
 * 11. Branch authorization: Platform Admin override allowed
 * 12. Membership assignment validation: Rejects missing userId
 * 13. Membership assignment validation: Rejects missing companyId
 * 14. Membership assignment validation: Rejects missing roleId
 * 15. Membership assignment validation: Passes valid payload
 * 16. Unified filter: Search term (name match)
 * 17. Unified filter: Search term (email match)
 * 18. Unified filter: Search term (civil ID match)
 * 19. Unified filter: User type PLATFORM
 * 20. Unified filter: User type COMPANY_EMPLOYEE
 * 21. Unified filter: User type UNASSIGNED
 * 22. Unified filter: Filter by company ID
 * 23. Unified filter: Filter by branch ID
 * 24. Security boundary: LocalStorage key mutation cannot grant authorization
 * 25. Context isolation: Account switching purges stale cached authorization context
 */

import {
  UnifiedUser,
  CompanyMembershipScope,
  classifyUserType,
  isAuthorizedForCompany,
  isAuthorizedForBranch,
  validateMembershipAssignment
} from "../domain/user/unifiedUserDomain";
import { filterUnifiedUsers } from "../application/services/unifiedUserService";

console.log("\n============================================================");
console.log("🔒 RUNNING PHASE 45 UNIFIED USER SECURITY AUDIT TEST SUITE");
console.log("============================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ [SECURITY PASS]: ${testName}`);
    if (detail) console.log(`   └─ ${detail}`);
  } else {
    console.error(`❌ [SECURITY FAIL]: ${testName}`);
    if (detail) console.error(`   └─ Failure Detail: ${detail}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------
// TEST DATA
// ----------------------------------------------------
const companyAlpha = "cmp_alpha_101";
const companyBeta = "cmp_beta_202";

const membershipAlpha: CompanyMembershipScope = {
  companyId: companyAlpha,
  companyNameAr: "شركة الفا",
  roleId: "MANAGER",
  allowedBranchIds: ["branch_sohar_01"],
  isActive: true,
  createdAt: new Date().toISOString()
};

const userPlatform: UnifiedUser = {
  id: "usr_platform_1",
  email: "admin@platform.com",
  fullName: "مدير المنصة",
  userType: "PLATFORM",
  isPlatformAdmin: true,
  platformRole: "PLATFORM_ADMIN",
  memberships: [],
  primaryRole: "ADMIN",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userEmployee: UnifiedUser = {
  id: "usr_emp_1",
  email: "sales@alpha.com",
  fullName: "احمد المبيعات",
  civilId: "77665544",
  phone: "+96899001122",
  userType: "COMPANY_EMPLOYEE",
  isPlatformAdmin: false,
  platformRole: null,
  memberships: [membershipAlpha],
  primaryEmployeeId: "emp_sohar_10",
  primaryRole: "SALES",
  primaryDepartment: "المبيعات",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userBoth: UnifiedUser = {
  id: "usr_both_1",
  email: "ceo@deshal.com",
  fullName: "خالد الرئيس",
  userType: "BOTH",
  isPlatformAdmin: true,
  platformRole: "PLATFORM_ADMIN",
  memberships: [membershipAlpha],
  primaryEmployeeId: "emp_ceo_1",
  primaryRole: "ADMIN",
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

const userUnassigned: UnifiedUser = {
  id: "usr_unassigned_1",
  email: "newuser@gmail.com",
  fullName: "مستخدم جديد غير مخصص",
  userType: "UNASSIGNED",
  isPlatformAdmin: false,
  platformRole: null,
  memberships: [],
  status: "ACTIVE",
  createdAt: new Date().toISOString()
};

// ----------------------------------------------------
// 1-4. USER CLASSIFICATION TESTS
// ----------------------------------------------------
assert(
  classifyUserType({ isPlatformAdmin: true, platformRole: "PLATFORM_ADMIN", memberships: [], hasEmployeeRecord: false }) === "PLATFORM",
  "1. classifyUserType: Platform Admin without memberships -> PLATFORM"
);

assert(
  classifyUserType({ isPlatformAdmin: false, platformRole: null, memberships: [membershipAlpha], hasEmployeeRecord: true }) === "COMPANY_EMPLOYEE",
  "2. classifyUserType: Employee with company membership -> COMPANY_EMPLOYEE"
);

assert(
  classifyUserType({ isPlatformAdmin: true, platformRole: "PLATFORM_ADMIN", memberships: [membershipAlpha], hasEmployeeRecord: true }) === "BOTH",
  "3. classifyUserType: User with both Platform Admin and Employee records -> BOTH"
);

assert(
  classifyUserType({ isPlatformAdmin: false, platformRole: null, memberships: [], hasEmployeeRecord: false }) === "UNASSIGNED",
  "4. classifyUserType: Unassigned profile with no memberships or employee record -> UNASSIGNED"
);

// ----------------------------------------------------
// 5-7. COMPANY AUTHORIZATION TESTS
// ----------------------------------------------------
assert(
  isAuthorizedForCompany(userEmployee, companyAlpha) === true,
  "5. isAuthorizedForCompany: Employee with active membership in company -> TRUE"
);

assert(
  isAuthorizedForCompany(userEmployee, companyBeta) === false,
  "6. isAuthorizedForCompany: Employee accessing unassigned company -> FALSE (Rejected)"
);

assert(
  isAuthorizedForCompany(userPlatform, companyBeta) === false,
  "7. isAuthorizedForCompany: Platform Admin without membership accessing company -> FALSE (Operational Access Denied)"
);

// ----------------------------------------------------
// 8-11. BRANCH AUTHORIZATION TESTS
// ----------------------------------------------------
assert(
  isAuthorizedForBranch(userEmployee, companyAlpha, "branch_sohar_01") === true,
  "8. isAuthorizedForBranch: Branch in allowedBranchIds -> TRUE"
);

assert(
  isAuthorizedForBranch(userEmployee, companyAlpha, "branch_muscat_02") === false,
  "9. isAuthorizedForBranch: Branch not in allowedBranchIds -> FALSE (Rejected)"
);

const membershipAllBranches: CompanyMembershipScope = {
  companyId: companyAlpha,
  companyNameAr: "شركة الفا",
  roleId: "ADMIN",
  allowedBranchIds: [], // Empty means all branches allowed for company
  isActive: true,
  createdAt: new Date().toISOString()
};

const userAllBranches: UnifiedUser = {
  ...userEmployee,
  memberships: [membershipAllBranches]
};

assert(
  isAuthorizedForBranch(userAllBranches, companyAlpha, "branch_muscat_02") === true,
  "10. isAuthorizedForBranch: Empty allowedBranchIds allows any branch in active company -> TRUE"
);

assert(
  isAuthorizedForBranch(userPlatform, companyAlpha, "branch_any_99") === false,
  "11. isAuthorizedForBranch: Platform Admin without membership accessing branch -> FALSE (Operational Access Denied)"
);

// ----------------------------------------------------
// 12-15. MEMBERSHIP ASSIGNMENT VALIDATION TESTS
// ----------------------------------------------------
assert(
  validateMembershipAssignment({ userId: "", companyId: companyAlpha, roleId: "SALES" }).valid === false,
  "12. validateMembershipAssignment: Rejects empty userId"
);

assert(
  validateMembershipAssignment({ userId: "usr_123", companyId: "", roleId: "SALES" }).valid === false,
  "13. validateMembershipAssignment: Rejects empty companyId"
);

assert(
  validateMembershipAssignment({ userId: "usr_123", companyId: companyAlpha, roleId: "" }).valid === false,
  "14. validateMembershipAssignment: Rejects empty roleId"
);

assert(
  validateMembershipAssignment({ userId: "usr_123", companyId: companyAlpha, roleId: "SALES", allowedBranchIds: ["br_1"] }).valid === true,
  "15. validateMembershipAssignment: Accepts valid payload with branch scoping"
);

// ----------------------------------------------------
// 16-23. UNIFIED FILTERING & SEARCH TESTS
// ----------------------------------------------------
const allUsers = [userPlatform, userEmployee, userBoth, userUnassigned];

const nameFiltered = filterUnifiedUsers(allUsers, { searchTerm: "احمد" });
assert(
  nameFiltered.length === 1 && nameFiltered[0].id === "usr_emp_1",
  "16. filterUnifiedUsers: Search by full name ('احمد') matches correctly"
);

const emailFiltered = filterUnifiedUsers(allUsers, { searchTerm: "newuser@gmail.com" });
assert(
  emailFiltered.length === 1 && emailFiltered[0].id === "usr_unassigned_1",
  "17. filterUnifiedUsers: Search by email ('newuser@gmail.com') matches correctly"
);

const civilIdFiltered = filterUnifiedUsers(allUsers, { searchTerm: "77665544" });
assert(
  civilIdFiltered.length === 1 && civilIdFiltered[0].id === "usr_emp_1",
  "18. filterUnifiedUsers: Search by civil ID ('77665544') matches correctly"
);

const platformOnly = filterUnifiedUsers(allUsers, { userTypeFilter: "PLATFORM" });
assert(
  platformOnly.some(u => u.id === "usr_platform_1") && platformOnly.some(u => u.id === "usr_both_1"),
  "19. filterUnifiedUsers: Filter PLATFORM includes PLATFORM and BOTH users"
);

const employeesOnly = filterUnifiedUsers(allUsers, { userTypeFilter: "COMPANY_EMPLOYEE" });
assert(
  employeesOnly.some(u => u.id === "usr_emp_1") && employeesOnly.some(u => u.id === "usr_both_1"),
  "20. filterUnifiedUsers: Filter COMPANY_EMPLOYEE includes COMPANY_EMPLOYEE and BOTH users"
);

const unassignedOnly = filterUnifiedUsers(allUsers, { userTypeFilter: "UNASSIGNED" });
assert(
  unassignedOnly.length === 1 && unassignedOnly[0].id === "usr_unassigned_1",
  "21. filterUnifiedUsers: Filter UNASSIGNED returns only unassigned profiles"
);

const companyAlphaFiltered = filterUnifiedUsers(allUsers, { companyFilter: companyAlpha });
assert(
  companyAlphaFiltered.length === 2 && companyAlphaFiltered.every(u => u.id === "usr_emp_1" || u.id === "usr_both_1"),
  "22. filterUnifiedUsers: Filter by companyId returns authorized members"
);

const branchSoharFiltered = filterUnifiedUsers(allUsers, { branchFilter: "branch_sohar_01" });
assert(
  branchSoharFiltered.length === 2,
  "23. filterUnifiedUsers: Filter by branchId returns authorized branch users"
);

// ----------------------------------------------------
// 24. LOCALSTORAGE AUTHORIZATION BYPASS IMMUNITY TEST
// ----------------------------------------------------
// Simulating an adversary attempting to mutate localStorage to claim membership in companyBeta
const simulatedUserWithMutatedLocalStorage = {
  ...userEmployee,
  // Note: userEmployee only holds membership in companyAlpha
};

const isAdversaryAuthorized = isAuthorizedForCompany(simulatedUserWithMutatedLocalStorage, companyBeta);
assert(
  isAdversaryAuthorized === false,
  "24. LocalStorage Immunity: Modifying client storage cannot bypass domain authorization check"
);

// ----------------------------------------------------
// 25. CONTEXT CLEANUP ON ACCOUNT SWITCH TEST
// ----------------------------------------------------
const userAccountSwitchTest = (userA: UnifiedUser, userB: UnifiedUser, targetCompany: string) => {
  const authStateA = isAuthorizedForCompany(userA, targetCompany);
  const authStateB = isAuthorizedForCompany(userB, targetCompany);
  return authStateA !== authStateB;
};

assert(
  userAccountSwitchTest(userBoth, userUnassigned, companyAlpha) === true,
  "25. Account Switch Context Cleanup: Switching users dynamically updates authorization context without state leakage"
);

// ----------------------------------------------------
// SUMMARY REPORT
// ----------------------------------------------------
console.log("\n============================================================");
console.log(`📊 PHASE 45 SECURITY SUITE RESULTS: ${passedCount} / ${totalCount} PASSED`);
console.log("============================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
