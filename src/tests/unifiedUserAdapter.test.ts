/**
 * Unified User Infrastructure Adapter Unit Tests — Deshal ERP
 * Phase 45 — Step 3: Unified User Infrastructure Adapter Certification
 * 
 * Verifies repository data mapping, multi-company membership aggregation,
 * restricted branch scope preservation, platform admin isolation, employee association mapping,
 * and repository port interface operations.
 */

import { mapRowToUnifiedUser, defaultUnifiedUserAdapter } from '../lib/adapters/unifiedUserAdapter';
import { isPlatformUser, isCompanyStaff, isUnassignedProfile } from '../domain/user/unifiedUserDomain';

async function runUnifiedUserAdapterTests() {
  console.log("============================================================");
  console.log("🚀 RUNNING PHASE 45 STEP 3 — UNIFIED USER ADAPTER TESTS");
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

  // Test 1: Profile without employee
  {
    const user = mapRowToUnifiedUser({
      profile: {
        id: "usr_no_emp_01",
        email: "noemp@deshal.om",
        full_name: "مستقل بدون موظف",
        status: "ACTIVE",
        created_at: new Date().toISOString()
      },
      platformAdminRow: null,
      membershipRows: [],
      employeeRow: null
    });

    assert(user.id === "usr_no_emp_01", "Test 1.1: Preserves profile ID identity");
    assert(user.employeeSummary === null, "Test 1.2: employeeSummary is null when profile has no employee record");
    assert(user.hasEmployeeRecord === false, "Test 1.3: hasEmployeeRecord is false when profile has no employee record");
    assert(isUnassignedProfile(user), "Test 1.4: Classifies profile with no membership and no employee as UNASSIGNED_PROFILE");
  }

  // Test 2: Profile with employee
  {
    const user = mapRowToUnifiedUser({
      profile: {
        id: "usr_with_emp_02",
        email: "emp@deshal.om",
        full_name: "موظف رسمي",
        status: "ACTIVE"
      },
      platformAdminRow: null,
      membershipRows: [{ company_id: companyA, role_id: "SALES", is_active: true }],
      employeeRow: {
        id: "emp_999",
        employee_code: "EMP-0999",
        company_id: companyA,
        primary_branch_id: branchSohar,
        department: "المبيعات",
        role: "SALES",
        status: "ACTIVE"
      }
    });

    assert(user.employeeSummary !== null, "Test 2.1: employeeSummary is mapped when employee record exists");
    assert(user.employeeSummary?.employeeId === "emp_999", "Test 2.2: Mapped employeeId matches employee record");
    assert(user.employeeSummary?.employeeCode === "EMP-0999", "Test 2.3: Mapped employeeCode matches employee record");
    assert(user.hasEmployeeRecord === true, "Test 2.4: hasEmployeeRecord is true when employee record exists");
  }

  // Test 3: Profile with active company membership
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_active_mem", email: "active@deshal.om", full_name: "عضو active" },
      membershipRows: [{ id: "mem_101", company_id: companyA, role_id: "MANAGER", is_active: true }]
    });

    assert(user.memberships.length === 1, "Test 3.1: Mapped single membership correctly");
    assert(user.memberships[0].companyId === companyA, "Test 3.2: Membership companyId preserved");
    assert(user.memberships[0].isActive === true, "Test 3.3: Membership isActive flag preserved as true");
    assert(isCompanyStaff(user), "Test 3.4: Identified as COMPANY_STAFF");
  }

  // Test 4: Profile with multiple company memberships
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_multi_mem", email: "multi@deshal.om", full_name: "عضو multi" },
      membershipRows: [
        { id: "m1", company_id: companyA, role_id: "ADMIN", is_active: true },
        { id: "m2", company_id: companyB, role_id: "AUDITOR", is_active: true }
      ]
    });

    assert(user.memberships.length === 2, "Test 4.1: Mapped multiple memberships without combining or dropping rows");
    assert(user.memberships[0].companyId === companyA && user.memberships[1].companyId === companyB, "Test 4.2: Both company A and B memberships preserved");
  }

  // Test 5: Profile with restricted branch scope
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_restricted_branch", email: "restricted@deshal.om", full_name: "نطاق محدد" },
      membershipRows: [
        { id: "m1", company_id: companyA, role_id: "CASHIER", allowed_branch_ids: [branchSohar], is_active: true }
      ]
    });

    assert(Array.isArray(user.memberships[0].allowedBranchIds), "Test 5.1: allowedBranchIds is an array");
    assert(user.memberships[0].allowedBranchIds?.length === 1, "Test 5.2: Restricted branch array length is 1");
    assert(user.memberships[0].allowedBranchIds?.includes(branchSohar) === true, "Test 5.3: Exact restricted branch ID preserved");
  }

  // Test 6: Profile with unrestricted branch scope
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_unrestricted_branch", email: "unrestricted@deshal.om", full_name: "نطاق مفتوح" },
      membershipRows: [
        { id: "m1", company_id: companyA, role_id: "GENERAL_MANAGER", allowed_branch_ids: [], is_active: true }
      ]
    });

    assert(Array.isArray(user.memberships[0].allowedBranchIds), "Test 6.1: allowedBranchIds is an array");
    assert(user.memberships[0].allowedBranchIds?.length === 0, "Test 6.2: Unrestricted scope represented by empty array");
  }

  // Test 7: Platform admin without company membership
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_plat_admin_only", email: "platadmin@deshal.om", full_name: "مدير منصة فقط" },
      platformAdminRow: { user_id: "usr_plat_admin_only", role: "PLATFORM_ADMIN", created_at: "2026-01-01T00:00:00Z" },
      membershipRows: []
    });

    assert(user.isPlatformAdmin === true, "Test 7.1: isPlatformAdmin is true");
    assert(user.platformAccess?.isPlatformAdmin === true, "Test 7.2: platformAccess.isPlatformAdmin is true");
    assert(user.memberships.length === 0, "Test 7.3: ZERO company memberships generated artificially");
    assert(isPlatformUser(user), "Test 7.4: Identified as platform user");
    assert(!isCompanyStaff(user), "Test 7.5: NOT identified as company staff without membership");
  }

  // Test 8: Platform admin with company membership
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_plat_admin_and_staff", email: "both@deshal.om", full_name: "مدير منصة وموظف" },
      platformAdminRow: { user_id: "usr_plat_admin_and_staff", role: "PLATFORM_ADMIN" },
      membershipRows: [{ id: "m1", company_id: companyA, role_id: "ADMIN", is_active: true }]
    });

    assert(user.isPlatformAdmin === true, "Test 8.1: isPlatformAdmin is true");
    assert(user.memberships.length === 1, "Test 8.2: Active company membership mapped");
    assert(user.classification === "PLATFORM_AND_STAFF", "Test 8.3: Classified as PLATFORM_AND_STAFF");
  }

  // Test 9: Unassigned profile
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_unassigned_prof", email: "unassigned@deshal.om", full_name: "ملف غير معين" },
      platformAdminRow: null,
      membershipRows: [],
      employeeRow: null
    });

    assert(user.classification === "UNASSIGNED_PROFILE", "Test 9.1: Classified as UNASSIGNED_PROFILE");
    assert(isUnassignedProfile(user), "Test 9.2: isUnassignedProfile predicate returns true");
  }

  // Test 10: Employee association mapping details
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_emp_detail", email: "detail@deshal.om", full_name: "تفاصيل الموظف" },
      employeeRow: {
        id: "emp_detail_77",
        employee_code: "EMP-77",
        company_id: companyA,
        primary_branch_id: branchMuscat,
        department: "تقنية المعلومات",
        role: "DEVELOPER",
        status: "PROBATION"
      }
    });

    assert(user.employeeSummary?.departmentId === "تقنية المعلومات", "Test 10.1: Department ID/name correctly mapped");
    assert(user.employeeSummary?.jobTitle === "DEVELOPER", "Test 10.2: Job title / role mapped");
    assert(user.employeeSummary?.employmentStatus === "PROBATION", "Test 10.3: Employment status mapped to PROBATION");
  }

  // Test 11: Inactive membership handling
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_inactive_mem", email: "inactive_mem@deshal.om", full_name: "عضوية معطلة" },
      membershipRows: [
        { id: "m_inactive", company_id: companyA, role_id: "SALES", is_active: false }
      ]
    });

    assert(user.memberships.length === 1, "Test 11.1: Inactive membership retained in membership history");
    assert(user.memberships[0].isActive === false, "Test 11.2: isActive preserved as false");
    assert(user.classification === "UNASSIGNED_PROFILE", "Test 11.3: User with only inactive membership classified as UNASSIGNED_PROFILE");
  }

  // Test 12: Preservation of membershipId/companyId/roleId
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_preserve_keys", email: "keys@deshal.om", full_name: "حفظ المفاتيح" },
      membershipRows: [
        { id: "mem_explicit_uuid_101", company_id: companyA, role_id: "CUSTOM_ROLE_A" }
      ]
    });

    assert(user.memberships[0].membershipId === "mem_explicit_uuid_101", "Test 12.1: membershipId exact string preserved");
    assert(user.memberships[0].companyId === companyA, "Test 12.2: companyId exact string preserved");
    assert(user.memberships[0].roleId === "CUSTOM_ROLE_A", "Test 12.3: roleId exact string preserved");
  }

  // Test 13: Preservation of allowedBranchIds
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_preserve_branches", email: "branches@deshal.om", full_name: "حفظ الفروع" },
      membershipRows: [
        { id: "m1", company_id: companyA, role_id: "STAFF", allowed_branch_ids: [branchSohar, branchMuscat] }
      ]
    });

    assert(user.memberships[0].allowedBranchIds?.length === 2, "Test 13.1: Exactly 2 branch IDs preserved");
    assert(user.memberships[0].allowedBranchIds?.[0] === branchSohar, "Test 13.2: First branch ID is branchSohar");
    assert(user.memberships[0].allowedBranchIds?.[1] === branchMuscat, "Test 13.3: Second branch ID is branchMuscat");
  }

  // Test 14: No duplicate UnifiedUser identity (Single profile source)
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_single_identity", email: "single@deshal.om", full_name: "هوية واحدة" },
      membershipRows: [
        { id: "m1", company_id: companyA, role_id: "ADMIN" },
        { id: "m2", company_id: companyB, role_id: "ADMIN" }
      ],
      employeeRow: {
        id: "emp_single",
        company_id: companyA,
        employee_code: "E-1"
      }
    });

    assert(user.id === "usr_single_identity", "Test 14.1: Profile ID remains single identity source across multiple memberships and employee records");
  }

  // Test 15: Nullable/missing employee association
  {
    const user = mapRowToUnifiedUser({
      profile: { id: "usr_missing_emp", email: "missing@deshal.om", full_name: "بدون موظف" },
      employeeRow: null
    });

    assert(user.employeeSummary === null, "Test 15.1: Null employee association yields null employeeSummary without runtime exception");
  }

  // Test 16: Repository Port Adapter method checks (Fallback LocalStorage Mode)
  {
    const allUsers = await defaultUnifiedUserAdapter.fetchUnifiedUsers();
    assert(Array.isArray(allUsers), "Test 16.1: fetchUnifiedUsers returns array");

    const listUsers = await defaultUnifiedUserAdapter.listUnifiedUsers();
    assert(Array.isArray(listUsers) && listUsers.length === allUsers.length, "Test 16.2: listUnifiedUsers alias returns same list");

    if (allUsers.length > 0) {
      const targetUser = allUsers[0];
      const fetchedUser = await defaultUnifiedUserAdapter.getUnifiedUser(targetUser.id);
      assert(fetchedUser !== null && fetchedUser.id === targetUser.id, "Test 16.3: getUnifiedUser resolves user by ID");

      const memberships = await defaultUnifiedUserAdapter.getCompanyMemberships(targetUser.id);
      assert(Array.isArray(memberships), "Test 16.4: getCompanyMemberships returns array");
    }

    const unassigned = await defaultUnifiedUserAdapter.getUnassignedProfiles();
    assert(Array.isArray(unassigned), "Test 16.5: getUnassignedProfiles returns array");
  }

  console.log("\n============================================================");
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} UNIFIED USER ADAPTER TESTS PASSED PERFECTLY!`);
    console.log("============================================================\n");
    process.exit(0);
  } else {
    console.error(`💥 ${failed} TEST(S) FAILED OUT OF ${passed + failed}`);
    console.log("============================================================\n");
    process.exit(1);
  }
}

runUnifiedUserAdapterTests().catch((err) => {
  console.error("Unhandled test execution error in adapter tests:", err);
  process.exit(1);
});
