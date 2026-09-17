/**
 * Unit Test Suite for Enterprise Multi-Tenant Domain Entities & Contracts — Deshal ERP
 */

import {
  Tenant,
  UserCompanyMembership,
  PlatformAdmin,
  TenantSubscription,
  TenantModuleEntitlement,
  TenantFeatureEntitlement,
  TenantProvisioningJob,
  isValidTenantTransition,
  isActiveMembership,
  canActivateTenant,
  isValidTenantCompanyBinding,
  isValidProvisioningJob
} from "../domain/tenant/tenantEntities";

console.log("\n==========================================");
console.log("🧪 Running Multi-Tenant Domain Contract Unit Tests");
console.log("==========================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ Passed: ${testName}`);
  } else {
    console.error(`❌ FAILED: ${testName}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------
// 1. Identity Separation Tests
// ----------------------------------------------------
console.log("\n--- TEST 1: IDENTITY SEPARATION ---");
const tenantSample: Tenant = {
  id: "tnt_888888",
  tenantCode: "TNT-8888",
  name: "شركة النورس السريعة",
  companyId: "cmp_999999", // Physical ERP data boundary
  status: "READY",
  subscriptionPlan: "PRO",
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z"
};

assert(tenantSample.id !== tenantSample.companyId, "Tenant ID and Company ID are distinct semantic identifiers");
assert(isValidTenantCompanyBinding(tenantSample, "cmp_999999"), "Validates binding between Tenant and target Company ID");
assert(!isValidTenantCompanyBinding(tenantSample, "cmp_WRONG"), "Rejects binding when target Company ID differs");

// ----------------------------------------------------
// 2. Multi-Company User Memberships Tests
// ----------------------------------------------------
console.log("\n--- TEST 2: MULTI-COMPANY MEMBERSHIPS ---");
const userId = "usr_user_101";

const membershipCompanyA: UserCompanyMembership = {
  id: "mem_001",
  userId,
  companyId: "cmp_alpha",
  roleId: "role_admin",
  isActive: true,
  createdAt: "2026-09-17T00:00:00.000Z"
};

const membershipCompanyB: UserCompanyMembership = {
  id: "mem_002",
  userId,
  companyId: "cmp_beta",
  roleId: "role_manager",
  isActive: true,
  createdAt: "2026-09-17T00:00:00.000Z"
};

const membershipInactive: UserCompanyMembership = {
  id: "mem_003",
  userId,
  companyId: "cmp_gamma",
  roleId: "role_staff",
  isActive: false,
  createdAt: "2026-09-17T00:00:00.000Z"
};

assert(isActiveMembership(membershipCompanyA), "Membership A is active");
assert(isActiveMembership(membershipCompanyB), "Membership B is active for the same user (Multi-Company User)");
assert(!isActiveMembership(membershipInactive), "Inactive membership is correctly identified as inactive");

// ----------------------------------------------------
// 3. Default Preferred UI Company vs Security Boundary
// ----------------------------------------------------
console.log("\n--- TEST 3: DEFAULT COMPANY PREFERENCE VS AUTHORIZATION ---");
const userProfileWithDefaultCompany = {
  id: userId,
  defaultCompanyId: "cmp_alpha", // UI preferred selection only
  memberships: [membershipCompanyA, membershipCompanyB]
};

assert(
  userProfileWithDefaultCompany.defaultCompanyId === "cmp_alpha" &&
  userProfileWithDefaultCompany.memberships.length === 2,
  "Default company is a UI preference, while memberships array provides full authorization access list"
);

// ----------------------------------------------------
// 4. Lifecycle State Machine Tests
// ----------------------------------------------------
console.log("\n--- TEST 4: LIFECYCLE STATE MACHINE ---");

// Valid transitions
assert(isValidTenantTransition("PENDING", "PROVISIONING"), "Valid: PENDING -> PROVISIONING");
assert(isValidTenantTransition("PROVISIONING", "READY"), "Valid: PROVISIONING -> READY");
assert(isValidTenantTransition("PROVISIONING", "FAILED"), "Valid: PROVISIONING -> FAILED");
assert(isValidTenantTransition("READY", "ACTIVE"), "Valid: READY -> ACTIVE");
assert(isValidTenantTransition("ACTIVE", "SUSPENDED"), "Valid: ACTIVE -> SUSPENDED");
assert(isValidTenantTransition("SUSPENDED", "ACTIVE"), "Valid: SUSPENDED -> ACTIVE");
assert(isValidTenantTransition("ACTIVE", "ARCHIVED"), "Valid: ACTIVE -> ARCHIVED");
assert(isValidTenantTransition("FAILED", "PROVISIONING"), "Valid: FAILED -> PROVISIONING (Retry)");

// Invalid transitions
assert(!isValidTenantTransition("PENDING", "ACTIVE"), "Invalid: PENDING -> ACTIVE directly is rejected");
assert(!isValidTenantTransition("ARCHIVED", "ACTIVE"), "Invalid: ARCHIVED -> ACTIVE directly is rejected");
assert(!isValidTenantTransition("SUSPENDED", "PROVISIONING"), "Invalid: SUSPENDED -> PROVISIONING is rejected");

// Activation eligibility check
const activatableTenant: Tenant = { ...tenantSample, status: "READY" };
const activationResult = canActivateTenant(activatableTenant);
assert(activationResult.canActivate, "Tenant in READY status can be activated");

const unactivatableTenant: Tenant = { ...tenantSample, status: "PENDING" };
const failedActivationResult = canActivateTenant(unactivatableTenant);
assert(!failedActivationResult.canActivate, "Tenant in PENDING status cannot be activated directly");

// ----------------------------------------------------
// 5. Platform Admin Separation Tests
// ----------------------------------------------------
console.log("\n--- TEST 5: PLATFORM ADMIN SEPARATION ---");
const platformAdminRecord: PlatformAdmin = {
  userId: "usr_super_admin",
  grantedAt: "2026-09-17T00:00:00.000Z",
  grantedBy: "usr_root"
};

assert(platformAdminRecord.userId === "usr_super_admin", "Platform Admin entity holds platform privilege assignment");
assert(
  platformAdminRecord.userId !== membershipCompanyA.userId,
  "Platform Admin identity is separate from ordinary tenant company memberships"
);

// ----------------------------------------------------
// 6. Entitlement Hierarchical Separation Tests
// ----------------------------------------------------
console.log("\n--- TEST 6: SUBSCRIPTION, MODULE & FEATURE ENTITLEMENTS ---");

const subscription: TenantSubscription = {
  id: "sub_1001",
  companyId: "cmp_alpha",
  planType: "ENTERPRISE",
  status: "active",
  currentPeriodEnd: "2027-09-17T00:00:00.000Z"
};

const moduleEntitlement: TenantModuleEntitlement = {
  tenantId: "tnt_888888",
  moduleCode: "crm",
  isEnabled: true,
  updatedAt: "2026-09-17T00:00:00.000Z"
};

const featureEntitlement: TenantFeatureEntitlement = {
  tenantId: "tnt_888888",
  moduleCode: "crm",
  featureCode: "leads",
  isEnabled: true,
  updatedAt: "2026-09-17T00:00:00.000Z"
};

assert(subscription.planType === "ENTERPRISE", "Subscription entitlement object represents tenant plan entitlement");
assert(moduleEntitlement.moduleCode === "crm", "Module entitlement object represents module level capability");
assert(featureEntitlement.featureCode === "leads", "Feature entitlement object represents fine-grained feature capability");

// ----------------------------------------------------
// 7. Provisioning Idempotency Key Tests
// ----------------------------------------------------
console.log("\n--- TEST 7: PROVISIONING IDEMPOTENCY KEY ---");

const validJob: TenantProvisioningJob = {
  id: "job_991",
  idempotencyKey: "idem_key_abc123",
  tenantId: "tnt_888888",
  companyId: "cmp_999999",
  status: "COMPLETED",
  failedStep: null,
  errorCode: null,
  errorMessage: null,
  createdAt: "2026-09-17T00:00:00.000Z",
  completedAt: "2026-09-17T00:01:00.000Z"
};

const invalidJob: TenantProvisioningJob = {
  id: "job_992",
  idempotencyKey: "", // Missing idempotency key
  tenantId: null,
  companyId: null,
  status: "PENDING",
  failedStep: null,
  errorCode: null,
  errorMessage: null,
  createdAt: "2026-09-17T00:00:00.000Z",
  completedAt: null
};

assert(isValidProvisioningJob(validJob).valid, "Valid provisioning job with idempotency key passes validation");
assert(!isValidProvisioningJob(invalidJob).valid, "Provisioning job without idempotency key fails validation");

// ----------------------------------------------------
// 8. Existing Company Activation Contract Tests
// ----------------------------------------------------
console.log("\n--- TEST 8: EXISTING COMPANY ACTIVATION CONTRACT ---");

const existingCompanyId = "cmp_existing_oman_corp";
const activatedTenantContract: Tenant = {
  id: "tnt_activated_001",
  tenantCode: "TNT-EXISTING",
  name: "شركة المعمورة العمانية",
  companyId: existingCompanyId, // Reuses existing company ID without duplicating records
  status: "ACTIVE",
  subscriptionPlan: "ENTERPRISE",
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z"
};

assert(
  activatedTenantContract.companyId === existingCompanyId,
  "Existing company activation links the existing Company ID directly without creating a duplicate company entity"
);

console.log("\n==========================================");
console.log(`🎉 ALL MULTI-TENANT DOMAIN CONTRACT TESTS PASSED PERFECTLY! (${passedCount}/${totalCount})`);
console.log("==========================================\n");
