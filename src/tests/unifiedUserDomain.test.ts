/**
 * Unified User Domain Pure Policy Unit Tests — Deshal ERP
 * Phase 45 — Step 2: Unified User Domain Entities & Security Policies Certification
 * 
 * Verifies pure domain classification rules, multi-company access boundaries,
 * branch authorization scoping, duplicate membership rejection, and profile activation policies.
 */

import {
  UnifiedUser,
  classifyUnifiedUser,
  isPlatformUser,
  isCompanyStaff,
  isUnassignedProfile,
  hasCompanyAccess,
  hasBranchAccess,
  canAssignToCompany,
  canAssignToBranch,
  canActivateUnassignedProfile
} from "../domain/user/unifiedUserDomain";

async function runUnifiedUserDomainTests() {
  console.log("============================================================");
  console.log("🚀 RUNNING PHASE 45 STEP 2 — UNIFIED USER DOMAIN TESTS");
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

  const companyA = "00000000-0000-0000-0000-000000000001";
  const companyB = "00000000-0000-0000-0000-000000000002";
  const branchA1 = "brn_a1_uuid";
  const branchA2 = "brn_a2_uuid";
  const branchB1 = "brn_b1_uuid";

  // Test 1: Platform User Classification (Platform admin, zero company memberships)
  {
    const classification = classifyUnifiedUser({
      isPlatformAdmin: true,
      memberships: []
    });
    assert(classification === "PLATFORM_USER", "Test 1.1: Classifies user with platform admin and zero memberships as PLATFORM_USER");
    assert(isPlatformUser(classification), "Test 1.2: isPlatformUser predicate returns true for PLATFORM_USER");
    assert(!isCompanyStaff(classification), "Test 1.3: isCompanyStaff predicate returns false for PLATFORM_USER");
    assert(!isUnassignedProfile(classification), "Test 1.4: isUnassignedProfile predicate returns false for PLATFORM_USER");
  }

  // Test 2: Company Staff Classification (Non-platform admin, active company membership)
  {
    const classification = classifyUnifiedUser({
      isPlatformAdmin: false,
      memberships: [{ companyId: companyA, isActive: true }]
    });
    assert(classification === "COMPANY_STAFF", "Test 2.1: Classifies user with active membership and no platform admin as COMPANY_STAFF");
    assert(!isPlatformUser(classification), "Test 2.2: isPlatformUser predicate returns false for COMPANY_STAFF");
    assert(isCompanyStaff(classification), "Test 2.3: isCompanyStaff predicate returns true for COMPANY_STAFF");
  }

  // Test 3: Unassigned Profile Classification (No platform admin, no active memberships)
  {
    const classification = classifyUnifiedUser({
      isPlatformAdmin: false,
      memberships: []
    });
    assert(classification === "UNASSIGNED_PROFILE", "Test 3.1: Classifies profile with zero memberships as UNASSIGNED_PROFILE");
    assert(isUnassignedProfile(classification), "Test 3.2: isUnassignedProfile predicate returns true for UNASSIGNED_PROFILE");
  }

  // Test 4: Platform + Staff Classification (Both platform admin AND active company membership)
  {
    const classification = classifyUnifiedUser({
      isPlatformAdmin: true,
      memberships: [{ companyId: companyA, isActive: true }]
    });
    assert(classification === "PLATFORM_AND_STAFF", "Test 4.1: Classifies user with platform admin + active membership as PLATFORM_AND_STAFF");
    assert(isPlatformUser(classification), "Test 4.2: isPlatformUser predicate returns true for PLATFORM_AND_STAFF");
    assert(isCompanyStaff(classification), "Test 4.3: isCompanyStaff predicate returns true for PLATFORM_AND_STAFF");
  }

  // Test 5: Multi-Company Memberships (Active vs Inactive)
  {
    const user: UnifiedUser = {
      id: "usr_multi_101",
      email: "multi@deshal.om",
      fullName: "Multi Company User",
      isActive: true,
      platformAccess: { isPlatformAdmin: false },
      memberships: [
        { membershipId: "m1", companyId: companyA, isActive: true, createdAt: new Date().toISOString() },
        { membershipId: "m2", companyId: companyB, isActive: false, createdAt: new Date().toISOString() }
      ],
      employeeSummary: null,
      classification: "COMPANY_STAFF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    assert(hasCompanyAccess(user, companyA), "Test 5.1: Grants company access for active membership in companyA");
    assert(!hasCompanyAccess(user, companyB), "Test 5.2: Denies company access for inactive membership in companyB");
    assert(!hasCompanyAccess(user, "00000000-0000-0000-0000-000000000099"), "Test 5.3: Denies company access for company with no membership");
  }

  // Test 6: Platform Admin without company membership CANNOT access company data
  {
    const platformUser: UnifiedUser = {
      id: "usr_platform_only",
      email: "admin@platform.om",
      fullName: "Platform Admin Only",
      isActive: true,
      platformAccess: { isPlatformAdmin: true },
      memberships: [],
      employeeSummary: null,
      classification: "PLATFORM_USER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    assert(!hasCompanyAccess(platformUser, companyA), "Test 6.1: Platform admin status alone DOES NOT grant operational company access without membership");
  }

  // Test 7: Branch Authorization & Cross-Company Branch Rejection
  {
    const user: UnifiedUser = {
      id: "usr_branch_test",
      email: "staff@companyA.om",
      fullName: "Company A Staff",
      isActive: true,
      platformAccess: { isPlatformAdmin: false },
      memberships: [
        { membershipId: "m1", companyId: companyA, allowedBranchIds: [branchA1], isActive: true, createdAt: new Date().toISOString() }
      ],
      employeeSummary: null,
      classification: "COMPANY_STAFF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Restricted scope: branchA1 allowed, branchA2 denied
    assert(hasBranchAccess(user, companyA, branchA1, companyA), "Test 7.1: Authorizes branch included in allowedBranchIds list");
    assert(!hasBranchAccess(user, companyA, branchA2, companyA), "Test 7.2: Denies branch NOT included in allowedBranchIds list");
    assert(!hasBranchAccess(user, companyA, branchB1, companyB), "Test 7.3: Rejects branch belonging to a different company (companyB)");
  }

  // Test 8: Unrestricted Branch Membership (allowedBranchIds empty or undefined)
  {
    const user: UnifiedUser = {
      id: "usr_unrestricted",
      email: "manager@companyA.om",
      fullName: "Unrestricted Manager",
      isActive: true,
      platformAccess: { isPlatformAdmin: false },
      memberships: [
        { membershipId: "m1", companyId: companyA, allowedBranchIds: [], isActive: true, createdAt: new Date().toISOString() }
      ],
      employeeSummary: null,
      classification: "COMPANY_STAFF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    assert(hasBranchAccess(user, companyA, branchA1, companyA), "Test 8.1: Authorizes any branch when allowedBranchIds is empty");
    assert(hasBranchAccess(user, companyA, branchA2, companyA), "Test 8.2: Authorizes second branch when allowedBranchIds is empty");
    assert(!hasBranchAccess(user, companyA, branchB1, companyB), "Test 8.3: Still rejects branch belonging to another company (companyB)");
  }

  // Test 9: Assignment Policy — Duplicate Active Membership Rejection
  {
    const user: UnifiedUser = {
      id: "usr_assign_test",
      email: "staff@companyA.om",
      fullName: "Staff A",
      isActive: true,
      platformAccess: { isPlatformAdmin: false },
      memberships: [
        { membershipId: "m1", companyId: companyA, isActive: true, createdAt: new Date().toISOString() }
      ],
      employeeSummary: null,
      classification: "COMPANY_STAFF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const duplicateCheck = canAssignToCompany(user, companyA);
    assert(!duplicateCheck.canAssign, "Test 9.1: Rejects assigning duplicate active membership for companyA");
    assert(Boolean(duplicateCheck.reason && duplicateCheck.reason.includes("already holds an active membership")), "Test 9.2: Returns explicit duplicate membership error message");

    const validCheck = canAssignToCompany(user, companyB);
    assert(validCheck.canAssign, "Test 9.3: Allows assigning new membership for companyB");
  }

  // Test 10: Assignment Policy — Branch Assignment Validation
  {
    const user: UnifiedUser = {
      id: "usr_branch_assign",
      email: "staff@companyA.om",
      fullName: "Staff A",
      isActive: true,
      platformAccess: { isPlatformAdmin: false },
      memberships: [
        { membershipId: "m1", companyId: companyA, isActive: true, createdAt: new Date().toISOString() }
      ],
      employeeSummary: null,
      classification: "COMPANY_STAFF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const validBranchAssign = canAssignToBranch(user, companyA, branchA1, companyA);
    assert(validBranchAssign.canAssign, "Test 10.1: Allows branch assignment when user has active company membership and company match");

    const invalidCompanyMatch = canAssignToBranch(user, companyA, branchB1, companyB);
    assert(!invalidCompanyMatch.canAssign, "Test 10.2: Rejects branch assignment when branch companyId does not match target companyId");

    const noMembershipAssign = canAssignToBranch(user, companyB, branchB1, companyB);
    assert(!noMembershipAssign.canAssign, "Test 10.3: Rejects branch assignment when user has no active membership in target company");
  }

  // Test 11: Unassigned Profile Activation Validation
  {
    const unassignedUser: UnifiedUser = {
      id: "usr_unassigned_99",
      email: "new@profile.om",
      fullName: "New Profile",
      isActive: true,
      platformAccess: { isPlatformAdmin: false },
      memberships: [],
      employeeSummary: null,
      classification: "UNASSIGNED_PROFILE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const activateCheck = canActivateUnassignedProfile(unassignedUser, companyA);
    assert(activateCheck.canActivate, "Test 11.1: Permits activating unassigned profile for companyA");

    const assignedUser: UnifiedUser = {
      ...unassignedUser,
      memberships: [{ membershipId: "m1", companyId: companyA, isActive: true, createdAt: new Date().toISOString() }],
      classification: "COMPANY_STAFF"
    };

    const reActivateCheck = canActivateUnassignedProfile(assignedUser, companyB);
    assert(!reActivateCheck.canActivate, "Test 11.2: Rejects unassigned profile activation if user already holds an active membership");
  }

  console.log("\n============================================================");
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} UNIFIED USER DOMAIN TESTS PASSED PERFECTLY!`);
    console.log("============================================================\n");
    process.exit(0);
  } else {
    console.error(`💥 ${failed} TEST(S) FAILED OUT OF ${passed + failed}`);
    console.log("============================================================\n");
    process.exit(1);
  }
}

runUnifiedUserDomainTests().catch((err) => {
  console.error("Unhandled test suite execution error:", err);
  process.exit(1);
});
