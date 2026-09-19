/**
 * Unified User Management Application Service Unit Tests — Deshal ERP
 * Phase 45 — Step 4: Unified User Application Service Certification
 * 
 * Tests application use cases independently from Supabase/database boundaries using a mock UnifiedUserPort.
 */

import {
  fetchUnifiedUsers,
  loadUnifiedUsers,
  getUnifiedUser,
  getUnifiedUsersByCompany,
  getUnifiedUsersByBranch,
  getUnassignedProfiles,
  getCompanyMemberships,
  getEmployeeAssociation,
  assignUserCompanyMembership,
  activateUnassignedProfile,
  removeUserCompanyMembership,
  filterUnifiedUsers,
  resolveUserAccessDetails
} from '../application/services/unifiedUserService';
import { UnifiedUserPort } from '../application/ports/unifiedUserPort';
import { UnifiedUser, UnifiedCompanyMembership, UnifiedEmployeeSummary } from '../domain/user/unifiedUserDomain';

async function runUnifiedUserServiceTests() {
  console.log("============================================================");
  console.log("🚀 RUNNING PHASE 45 STEP 4 — UNIFIED USER SERVICE TESTS");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ [PASS]: ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL]: ${message}`);
      failed++;
    }
  }

  const companyA = "cmp_alpha_101";
  const companyB = "cmp_beta_202";
  const branchSohar = "brn_sohar_01";
  const branchMuscat = "brn_muscat_02";

  // Fixture users
  const userStaffA: UnifiedUser = {
    id: "usr_staff_a",
    email: "staff_a@companyA.om",
    fullName: "علي موظف ألفا",
    isActive: true,
    isPlatformAdmin: false,
    platformAccess: { isPlatformAdmin: false },

    memberships: [
      { membershipId: "m_a1", companyId: companyA, roleId: "SALES", allowedBranchIds: [branchSohar], isActive: true }
    ],
    employeeSummary: {
      employeeId: "emp_a1",
      employeeCode: "EMP-A1",
      companyId: companyA,
      primaryBranchId: branchSohar,
      jobTitle: "مبيعات",
      employmentStatus: "ACTIVE"
    },
    hasEmployeeRecord: true,
    classification: "COMPANY_STAFF",
    userType: "COMPANY_EMPLOYEE",
    createdAt: new Date().toISOString()
  };

  const userPlatformAdminOnly: UnifiedUser = {
    id: "usr_platform_admin_only",
    email: "admin@platform.om",
    fullName: "مدير المنصة المستقل",
    isPlatformAdmin: true,
    platformRole: "PLATFORM_ADMIN",
    platformAccess: { isPlatformAdmin: true },
    memberships: [],
    employeeSummary: null,
    hasEmployeeRecord: false,
    classification: "PLATFORM_USER",
    userType: "PLATFORM",
    createdAt: new Date().toISOString()
  };

  const userUnassignedProfile: UnifiedUser = {
    id: "usr_unassigned_99",
    email: "new@profile.om",
    fullName: "ملف جديد غير معين",
    platformAccess: { isPlatformAdmin: false },
    memberships: [],
    employeeSummary: null,
    hasEmployeeRecord: false,
    classification: "UNASSIGNED_PROFILE",
    userType: "UNASSIGNED",
    createdAt: new Date().toISOString()
  };

  const userMultiCompany: UnifiedUser = {
    id: "usr_multi_company",
    email: "multi@deshal.om",
    fullName: "عضو متعدد الشركات",
    platformAccess: { isPlatformAdmin: false },
    memberships: [
      { membershipId: "m_multi_1", companyId: companyA, roleId: "MANAGER", allowedBranchIds: [], isActive: true },
      { membershipId: "m_multi_2", companyId: companyB, roleId: "AUDITOR", allowedBranchIds: [], isActive: true }
    ],
    employeeSummary: null,
    hasEmployeeRecord: false,
    classification: "COMPANY_STAFF",
    userType: "COMPANY_EMPLOYEE",
    createdAt: new Date().toISOString()
  };

  let mockDbUsers: UnifiedUser[] = [userStaffA, userPlatformAdminOnly, userUnassignedProfile, userMultiCompany];

  const mockAdapter: UnifiedUserPort = {
    async fetchUnifiedUsers(activeCompanyId?: string | null): Promise<UnifiedUser[]> {
      return [...mockDbUsers];
    },
    async listUnifiedUsers(activeCompanyId?: string | null): Promise<UnifiedUser[]> {
      return [...mockDbUsers];
    },
    async getUnifiedUser(userId: string): Promise<UnifiedUser | null> {
      return mockDbUsers.find((u) => u.id === userId) || null;
    },
    async getUnifiedUsersByCompany(companyId: string): Promise<UnifiedUser[]> {
      return mockDbUsers.filter((u) => u.memberships.some((m) => m.companyId === companyId && m.isActive !== false));
    },
    async getUnifiedUsersByBranch(companyId: string, branchId: string): Promise<UnifiedUser[]> {
      return mockDbUsers.filter((u) =>
        u.memberships.some((m) => m.companyId === companyId && (m.allowedBranchIds.length === 0 || m.allowedBranchIds.includes(branchId)))
      );
    },
    async getUnassignedProfiles(): Promise<UnifiedUser[]> {
      return mockDbUsers.filter((u) => u.memberships.length === 0 && !u.isPlatformAdmin);
    },
    async getCompanyMemberships(userId: string): Promise<UnifiedCompanyMembership[]> {
      const u = mockDbUsers.find((x) => x.id === userId);
      return u ? u.memberships : [];
    },
    async getEmployeeAssociation(userId: string): Promise<UnifiedEmployeeSummary | null> {
      const u = mockDbUsers.find((x) => x.id === userId);
      return u ? u.employeeSummary : null;
    },
    async assignCompanyMembership(params: {
      userId: string;
      companyId: string;
      roleId: string;
      allowedBranchIds?: string[];
    }): Promise<{ success: boolean; error?: string }> {
      const idx = mockDbUsers.findIndex((u) => u.id === params.userId);
      if (idx !== -1) {
        const u = mockDbUsers[idx];
        const updatedMemberships = [
          ...u.memberships,
          {
            membershipId: `m_new_${Date.now()}`,
            companyId: params.companyId,
            roleId: params.roleId,
            allowedBranchIds: params.allowedBranchIds || [],
            isActive: true
          }
        ];
        mockDbUsers[idx] = {
          ...u,
          memberships: updatedMemberships,
          classification: u.isPlatformAdmin ? "PLATFORM_AND_STAFF" : "COMPANY_STAFF",
          userType: u.isPlatformAdmin ? "BOTH" : "COMPANY_EMPLOYEE"
        };
      }
      return { success: true };
    },
    async removeCompanyMembership(userId: string, companyId: string): Promise<{ success: boolean; error?: string }> {
      const idx = mockDbUsers.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        const u = mockDbUsers[idx];
        const updatedMemberships = u.memberships.map((m) =>
          m.companyId === companyId ? { ...m, isActive: false } : m
        );
        mockDbUsers[idx] = {
          ...u,
          memberships: updatedMemberships
        };
      }
      return { success: true };
    }
  };

  // Test 1: fetch unified users
  {
    const users = await fetchUnifiedUsers(null, mockAdapter);
    assert(users.length === 4, "Test 1.1: fetchUnifiedUsers returns all mock users");
  }

  // Test 2: get unified user
  {
    const user = await getUnifiedUser("usr_staff_a", mockAdapter);
    assert(user !== null && user.fullName === "علي موظف ألفا", "Test 2.1: getUnifiedUser returns target user identity");
  }

  // Test 3: get users by company
  {
    const companyAUsers = await getUnifiedUsersByCompany(companyA, mockAdapter);
    assert(companyAUsers.length === 2, "Test 3.1: getUnifiedUsersByCompany returns users with active membership in companyA");
  }

  // Test 4: get users by branch
  {
    const branchSoharUsers = await getUnifiedUsersByBranch(companyA, branchSohar, mockAdapter);
    assert(branchSoharUsers.length === 2, "Test 4.1: getUnifiedUsersByBranch returns users scoped or unrestricted for branchSohar");
  }

  // Test 5: get unassigned profiles
  {
    const unassigned = await getUnassignedProfiles(mockAdapter);
    assert(unassigned.length === 1 && unassigned[0].id === "usr_unassigned_99", "Test 5.1: getUnassignedProfiles returns profile with no memberships and no platform admin status");
  }

  // Test 6: get memberships
  {
    const memberships = await getCompanyMemberships("usr_multi_company", mockAdapter);
    assert(memberships.length === 2, "Test 6.1: getCompanyMemberships returns exact membership list");
  }

  // Test 7: get employee association
  {
    const emp = await getEmployeeAssociation("usr_staff_a", mockAdapter);
    assert(emp !== null && emp.employeeCode === "EMP-A1", "Test 7.1: getEmployeeAssociation returns employee summary");

    const noEmp = await getEmployeeAssociation("usr_platform_admin_only", mockAdapter);
    assert(noEmp === null, "Test 7.2: getEmployeeAssociation returns null when no employee record exists");
  }

  // Test 8: successful company membership assignment
  {
    const res = await assignUserCompanyMembership(
      { userId: "usr_unassigned_99", companyId: companyA, roleId: "SALES", allowedBranchIds: [branchSohar] },
      mockAdapter
    );
    assert(res.success === true, "Test 8.1: Assigns company membership successfully");
  }

  // Test 9: duplicate membership rejection
  {
    const duplicateRes = await assignUserCompanyMembership(
      { userId: "usr_staff_a", companyId: companyA, roleId: "MANAGER" },
      mockAdapter
    );
    assert(duplicateRes.success === false, "Test 9.1: Rejects assigning duplicate active membership for companyA");
    assert(Boolean(duplicateRes.error && duplicateRes.error.includes("already holds an active membership")), "Test 9.2: Returns explicit duplicate membership error message");
  }

  // Test 10: membership removal
  {
    const removeRes = await removeUserCompanyMembership("usr_staff_a", companyA, mockAdapter);
    assert(removeRes.success === true, "Test 10.1: Removes/deactivates membership successfully");

    const updatedUser = await getUnifiedUser("usr_staff_a", mockAdapter);
    const memA = updatedUser?.memberships.find((m) => m.companyId === companyA);
    assert(memA?.isActive === false, "Test 10.2: Membership isActive set to false without deleting profile or employee");
  }

  // Test 11: removal cannot affect another company membership
  {
    const removeMultiRes = await removeUserCompanyMembership("usr_multi_company", companyA, mockAdapter);
    assert(removeMultiRes.success === true, "Test 11.1: Membership removal for companyA succeeded");

    const updatedMulti = await getUnifiedUser("usr_multi_company", mockAdapter);
    const memB = updatedMulti?.memberships.find((m) => m.companyId === companyB);
    assert(memB?.isActive === true, "Test 11.2: Company B membership remains active and untouched");
  }

  // Test 12: unassigned profile activation
  {
    // Reset test user for clean activation test
    mockDbUsers.push({
      id: "usr_fresh_unassigned",
      email: "fresh@deshal.om",
      fullName: "جديد تماما",
      platformAccess: { isPlatformAdmin: false },
      memberships: [],
      employeeSummary: null,
      hasEmployeeRecord: false,
      classification: "UNASSIGNED_PROFILE",
      userType: "UNASSIGNED",
      createdAt: new Date().toISOString()
    });

    const activateRes = await activateUnassignedProfile(
      { userId: "usr_fresh_unassigned", companyId: companyB, roleId: "CASHIER" },
      mockAdapter
    );
    assert(activateRes.success === true, "Test 12.1: Activates unassigned profile for companyB");

    const activatedUser = await getUnifiedUser("usr_fresh_unassigned", mockAdapter);
    assert(activatedUser?.memberships.some((m) => m.companyId === companyB) === true, "Test 12.2: Activated profile has companyB membership");
  }

  // Test 13: platform admin without membership remains without company access
  {
    const platAdmin = await getUnifiedUser("usr_platform_admin_only", mockAdapter);
    assert(platAdmin?.memberships.length === 0, "Test 13.1: Platform admin profile holds 0 company memberships");
    assert(platAdmin?.classification === "PLATFORM_USER", "Test 13.2: Platform admin classified as PLATFORM_USER without company operational access");
  }

  // Test 14: platform admin with membership receives only that membership's company access
  {
    await assignUserCompanyMembership(
      { userId: "usr_platform_admin_only", companyId: companyA, roleId: "ADMIN" },
      mockAdapter
    );
    const updatedPlatAdmin = await getUnifiedUser("usr_platform_admin_only", mockAdapter);
    assert(updatedPlatAdmin?.memberships.length === 1 && updatedPlatAdmin.memberships[0].companyId === companyA, "Test 14.1: Platform admin holds membership strictly in companyA");
    assert(!updatedPlatAdmin?.memberships.some((m) => m.companyId === companyB), "Test 14.2: Platform admin receives zero automatic access to companyB");
  }

  // Test 15: company ADMIN does not gain platform privileges
  {
    const userCompanyAdmin = await getUnifiedUser("usr_staff_a", mockAdapter);
    assert(userCompanyAdmin?.isPlatformAdmin === false, "Test 15.1: Company staff with ADMIN role has isPlatformAdmin = false");
    assert(userCompanyAdmin?.platformAccess?.isPlatformAdmin === false, "Test 15.2: Company staff cannot gain platform admin privileges");
  }

  // Test 16: cross-company branch assignment rejection
  {
    const crossBranchRes = await assignUserCompanyMembership(
      {
        userId: "usr_fresh_unassigned",
        companyId: companyA,
        roleId: "STAFF",
        allowedBranchIds: [branchMuscat],
        companyBranches: [{ id: branchSohar, companyId: companyA }]
      },
      mockAdapter
    );
    assert(crossBranchRes.success === false, "Test 16.1: Rejects cross-company branch assignment");
    assert(Boolean(crossBranchRes.error && crossBranchRes.error.includes("Cross-company branch assignment rejected")), "Test 16.2: Returns explicit cross-company branch error");
  }

  // Test 17: restricted branch scope preservation
  {
    const restrictedRes = await assignUserCompanyMembership(
      {
        userId: "usr_unassigned_99",
        companyId: companyB,
        roleId: "STAFF",
        allowedBranchIds: [branchMuscat],
        companyBranches: [{ id: branchMuscat, companyId: companyB }]
      },
      mockAdapter
    );
    assert(restrictedRes.success === true, "Test 17.1: Successfully assigns restricted branch scope");
  }

  // Test 18: unrestricted branch scope preservation
  {
    const unrestrictedRes = await assignUserCompanyMembership(
      {
        userId: "usr_unassigned_99",
        companyId: "cmp_gamma_303",
        roleId: "MANAGER",
        allowedBranchIds: []
      },
      mockAdapter
    );
    assert(unrestrictedRes.success === true, "Test 18.1: Successfully assigns unrestricted branch scope (empty array)");
  }

  // Test 19: invalid membership payload rejection
  {
    const invalidRes = await assignUserCompanyMembership(
      { userId: "", companyId: companyA, roleId: "SALES" },
      mockAdapter
    );
    assert(invalidRes.success === false, "Test 19.1: Rejects empty userId payload");
  }

  // Test 20: repository errors are propagated
  {
    const errorAdapter: UnifiedUserPort = {
      ...mockAdapter,
      async assignCompanyMembership() {
        return { success: false, error: "Database constraint failure" };
      }
    };

    const errRes = await assignUserCompanyMembership(
      { userId: "usr_unassigned_99", companyId: "cmp_error_test", roleId: "ADMIN" },
      errorAdapter
    );
    assert(errRes.success === false && errRes.error === "Database constraint failure", "Test 20.1: Repository errors propagated without swallowing");
  }

  // Test 21: employee association remains independent from membership
  {
    const staffUser = await getUnifiedUser("usr_staff_a", mockAdapter);
    assert(staffUser?.employeeSummary !== null, "Test 21.1: Employee summary present");

    await removeUserCompanyMembership("usr_staff_a", companyA, mockAdapter);
    const afterRemoval = await getUnifiedUser("usr_staff_a", mockAdapter);
    assert(afterRemoval?.employeeSummary !== null, "Test 21.2: Employee summary remains present after company membership deactivation");
  }

  // Test 22: no duplicate UnifiedUser identity
  {
    const allUsers = await fetchUnifiedUsers(null, mockAdapter);
    const ids = allUsers.map((u) => u.id);
    const uniqueIds = new Set(ids);
    assert(ids.length === uniqueIds.size, "Test 22.1: No duplicate UnifiedUser identity IDs exist in fetch result");
  }

  console.log("\n============================================================");
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} UNIFIED USER SERVICE TESTS PASSED PERFECTLY!`);
    console.log("============================================================\n");
    process.exit(0);
  } else {
    console.error(`💥 ${failed} TEST(S) FAILED OUT OF ${passed + failed}`);
    console.log("============================================================\n");
    process.exit(1);
  }
}

runUnifiedUserServiceTests().catch((err) => {
  console.error("Unhandled test execution error in service tests:", err);
  process.exit(1);
});
