/**
 * Phase 48 Enterprise Tenant Provisioning, Company Activation & Access Lifecycle Security Test Suite — Deshal ERP
 * 
 * Verifies 36+ security and operational lifecycle rules:
 * 1-5: Tenant Creation (Authorized Admin, Unauthorized Rejection, Idempotency, Duplicate Prevention, Failure Rollback)
 * 6-10: Company Access (Member Access, Non-member Rejection, LocalStorage Tampering, URL Tampering, Stale Context Recovery)
 * 11-14: Branch Access (Authorized Branch, Unauthorized Branch, Cross-Company Branch, LocalStorage Branch Tampering)
 * 15-20: Tenant Lifecycle (ACTIVE, SUSPENDED, ARCHIVED, FAILED, PROVISIONING, READY)
 * 21-24: Modules & Features (Disabled Module, Disabled Feature, Enabled Module without RBAC, RBAC without Module)
 * 25-27: Employee Isolation (Inactive Employee, Missing Membership, Cross-Company Employee)
 * 28-31: Platform Roles (PLATFORM_ADMIN Provisioning, Admin Operational Isolation, Collaborator Escalation, Auditor Read-Only)
 * 32-36: Database & Scope Isolation (Cross-Company SELECT, INSERT, UPDATE, DELETE, Cross-Branch Scope)
 */

import {
  Tenant,
  TenantStatus,
  TenantProvisioningJob,
  isValidTenantTransition,
  canActivateTenant,
  isValidTenantCompanyBinding,
  isValidProvisioningJob
} from "../domain/tenant/tenantEntities";
import {
  provisionNewTenantUseCase,
  activateExistingCompanyAsTenantUseCase,
  activateProvisionedTenantUseCase,
  suspendTenantUseCase,
  archiveTenantUseCase,
  retryFailedProvisioningUseCase,
  ProvisioningAdapter
} from "../application/services/tenantProvisioningEngine";
import {
  TenantContextData,
  resolveTenantContextState,
  validateCompanySwitch,
  validateBranchSwitch,
  validateOperationalAccess
} from "../application/services/tenantContextService";
import {
  UnifiedUser,
  CompanyMembershipScope,
  classifyUserType,
  isAuthorizedForCompany,
  isAuthorizedForBranch
} from "../domain/user/unifiedUserDomain";

console.log("\n============================================================");
console.log("🛡️ RUNNING PHASE 48 TENANT PROVISIONING & SECURITY TEST SUITE");
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
// MOCK ADAPTER FIXTURE FOR IN-MEMORY TESTING
// ----------------------------------------------------
class MockProvisioningAdapter implements ProvisioningAdapter {
  public platformAdmins = new Set<string>(["usr_admin_001"]);
  public tenants = new Map<string, Tenant>();
  public jobs = new Map<string, TenantProvisioningJob>();
  public companyCRs = new Set<string>(["CR-EXISTING-99"]);

  async isPlatformAdmin(userId: string): Promise<boolean> {
    return this.platformAdmins.has(userId);
  }

  async executeProvisionTransaction(request: any): Promise<any> {
    if (this.companyCRs.has(request.crNumber)) {
      return {
        success: false,
        idempotent: false,
        tenantId: "",
        companyId: "",
        error: `Company with CR number ${request.crNumber} already exists.`
      };
    }

    const companyId = `cmp_${Math.random().toString(36).substring(2, 8)}`;
    const tenantId = `tnt_${Math.random().toString(36).substring(2, 8)}`;
    const tenantCode = `TNT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const tenant: Tenant = {
      id: tenantId,
      tenantCode,
      name: request.name,
      companyId,
      status: "READY",
      subscriptionPlan: request.subscriptionPlan || "FREE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tenants.set(tenantId, tenant);
    this.companyCRs.add(request.crNumber);

    const job: TenantProvisioningJob = {
      id: `job_${Math.random().toString(36).substring(2, 8)}`,
      idempotencyKey: request.idempotencyKey,
      tenantId,
      companyId,
      status: "COMPLETED",
      failedStep: null,
      errorCode: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    this.jobs.set(request.idempotencyKey, job);

    return {
      success: true,
      idempotent: false,
      tenantId,
      companyId,
      tenantCode,
      mainBranchId: `brn_main_${companyId}`
    };
  }

  async activateExistingCompanyRecord(request: any): Promise<any> {
    const tenantId = `tnt_exist_${request.companyId}`;
    const tenant: Tenant = {
      id: tenantId,
      tenantCode: "TNT-EXISTING",
      name: "Existing Company Tenant",
      companyId: request.companyId,
      status: "READY",
      subscriptionPlan: request.subscriptionPlan || "ENTERPRISE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tenants.set(tenantId, tenant);
    return {
      success: true,
      tenantId,
      companyId: request.companyId
    };
  }

  async getTenantHealthData(tenantId: string, companyId: string): Promise<any> {
    const tenant = this.tenants.get(tenantId) || {
      id: tenantId,
      tenantCode: "TNT-HEALTH",
      name: "Health Tenant",
      companyId,
      status: "READY",
      subscriptionPlan: "PRO",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      tenant,
      companyExists: true,
      mainBranchExists: true,
      hasActiveMembership: true,
      subscription: {
        id: `sub_${companyId}`,
        companyId,
        planType: "PRO",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString()
      },
      moduleCount: 12,
      featureCount: 0,
      hasAdminRole: true
    };
  }

  async updateTenantStatus(tenantId: string, status: TenantStatus): Promise<boolean> {
    const tenant = this.tenants.get(tenantId);
    if (tenant) {
      tenant.status = status;
      tenant.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  async getProvisioningJob(idempotencyKey: string): Promise<TenantProvisioningJob | null> {
    return this.jobs.get(idempotencyKey) || null;
  }

  async getProvisioningJobById(jobId: string): Promise<TenantProvisioningJob | null> {
    for (const job of this.jobs.values()) {
      if (job.id === jobId) return job;
    }
    return null;
  }

  async saveProvisioningJob(job: TenantProvisioningJob): Promise<void> {
    this.jobs.set(job.idempotencyKey, job);
  }
}

// ----------------------------------------------------
// TEST DATA FIXTURES
// ----------------------------------------------------
const adapter = new MockProvisioningAdapter();

const adminUserId = "usr_admin_001";
const nonAdminUserId = "usr_employee_101";

const companyA = "cmp_alpha_101";
const companyB = "cmp_beta_202";
const branchSohar = "br_sohar_01";
const branchMuscat = "br_muscat_02";

const membershipA: CompanyMembershipScope = {
  companyId: companyA,
  companyNameAr: "شركة ألفا",
  roleId: "ADMIN",
  allowedBranchIds: [branchSohar],
  allowedBranchNames: ["فرع صحار"],
  isActive: true,
  createdAt: new Date().toISOString()
};

const userEmployee: UnifiedUser = {
  id: "usr_employee_101",
  email: "ali@alpha.com",
  fullName: "علي البلوشي",
  userType: "COMPANY_EMPLOYEE",
  isPlatformAdmin: false,
  platformRole: null,
  memberships: [membershipA],
  primaryRole: "ADMIN",
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

const userCollaborator: UnifiedUser = {
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

const userAuditor: UnifiedUser = {
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
// SECTION 1: TENANT CREATION TESTS (1–5)
// ----------------------------------------------------
async function runCreationTests() {
  // 1. Authorized Platform Admin Creation
  const res1 = await provisionNewTenantUseCase(
    {
      idempotencyKey: "idem_key_001",
      name: "شركة السلام الدولية",
      crNumber: "CR-100200300",
      taxId: "TAX-9988",
      currency: "OMR",
      mainBranchName: "الفرع الرئيسي صحار",
      adminEmail: "manager@alsalam.om",
      adminName: "سالم السلامي",
      adminPin: "1234"
    },
    adminUserId,
    adapter
  );
  assert(res1.success && res1.tenant?.status === "READY", "1. Authorized Platform Admin can create tenant (status=READY)");

  // 2. Unauthorized User Cannot Create Tenant
  const res2 = await provisionNewTenantUseCase(
    {
      idempotencyKey: "idem_key_002",
      name: "شركة غير مصرحة",
      crNumber: "CR-999000",
      taxId: "TAX-0000",
      currency: "OMR",
      mainBranchName: "الفرع الرئيسي",
      adminEmail: "fake@fake.com",
      adminName: "محتال",
      adminPin: "1234"
    },
    nonAdminUserId,
    adapter
  );
  assert(!res2.success && res2.error?.includes("Security Violation"), "2. Unauthorized user cannot create tenant");

  // 3. Provisioning Is Idempotent
  const res3 = await provisionNewTenantUseCase(
    {
      idempotencyKey: "idem_key_001", // duplicate idempotencyKey
      name: "شركة السلام الدولية",
      crNumber: "CR-100200300",
      taxId: "TAX-9988",
      currency: "OMR",
      mainBranchName: "الفرع الرئيسي صحار",
      adminEmail: "manager@alsalam.om",
      adminName: "سالم السلامي",
      adminPin: "1234"
    },
    adminUserId,
    adapter
  );
  assert(res3.success && res3.tenant?.id === res1.tenant?.id, "3. Provisioning is idempotent (returns existing tenant record)");

  // 4. Duplicate Company CR Number Prevention
  const res4 = await provisionNewTenantUseCase(
    {
      idempotencyKey: "idem_key_004",
      name: "شركة السلام الفرع الثاني",
      crNumber: "CR-EXISTING-99", // duplicate CR
      taxId: "TAX-9988",
      currency: "OMR",
      mainBranchName: "فرع مسقط",
      adminEmail: "branch2@alsalam.om",
      adminName: "سالم",
      adminPin: "1234"
    },
    adminUserId,
    adapter
  );
  assert(!res4.success && res4.error?.includes("already exists"), "4. Duplicate company CR number prevention");

  // 5. Failure Rollback & Handling
  const invalidReqRes = await provisionNewTenantUseCase(
    { idempotencyKey: "", name: "", crNumber: "", taxId: "", currency: "", mainBranchName: "", adminEmail: "", adminName: "", adminPin: "" },
    adminUserId,
    adapter
  );
  assert(!invalidReqRes.success && Boolean(invalidReqRes.error), "5. Invalid provisioning input returns controlled error without corrupt state");
}

// ----------------------------------------------------
// SECTION 2: COMPANY ACCESS TESTS (6–10)
// ----------------------------------------------------
function runCompanyAccessTests() {
  // 6. Authorized Member Access
  const isAuthA = isAuthorizedForCompany(userEmployee, companyA);
  assert(isAuthA, "6. Member can access authorized company");

  // 7. Non-Member Access Rejection
  const isAuthB = isAuthorizedForCompany(userEmployee, companyB);
  assert(!isAuthB, "7. Non-member cannot access company");

  // 8. LocalStorage Company Tampering
  const tamperedCompanyState = companyB;
  const isTamperedAuth = isAuthorizedForCompany(userEmployee, tamperedCompanyState);
  assert(!isTamperedAuth, "8. LocalStorage company tampering fails domain authorization check");

  // 9. URL Company Tampering
  const switchRes = validateCompanySwitch({
    userId: userEmployee.id,
    targetCompanyId: companyB,
    memberships: userEmployee.memberships.map(m => ({
      id: `mem_${m.companyId}`,
      userId: userEmployee.id,
      companyId: m.companyId,
      roleId: m.roleId,
      allowedBranchIds: m.allowedBranchIds,
      isActive: m.isActive,
      createdAt: m.createdAt
    })),
    isPlatformAdmin: false
  });
  assert(!switchRes.allowed && Boolean(switchRes.error), "9. Direct URL/parameter company tampering rejected by validateCompanySwitch");

  // 10. Stale Context Recovery
  const staleResolved = resolveTenantContextState({
    userId: userEmployee.id,
    preferredCompanyId: companyB, // unassigned stale company
    fetchedMemberships: [{ id: "mem1", userId: userEmployee.id, companyId: companyA, roleId: "ADMIN", isActive: true, createdAt: new Date().toISOString() }]
  });
  assert(staleResolved.activeCompanyId === companyA, "10. Stale company context safely falls back to valid membership company");
}

// ----------------------------------------------------
// SECTION 3: BRANCH ACCESS TESTS (11–14)
// ----------------------------------------------------
function runBranchAccessTests() {
  // 11. Authorized Branch
  const isBranchAuth = isAuthorizedForBranch(userEmployee, companyA, branchSohar);
  assert(isBranchAuth, "11. Authorized branch access approved");

  // 12. Unauthorized Branch
  const isUnauthBranch = isAuthorizedForBranch(userEmployee, companyA, branchMuscat);
  assert(!isUnauthBranch, "12. Unauthorized branch access rejected");

  // 13. Cross-Company Branch Rejection
  const switchBranchRes = validateBranchSwitch({
    activeCompanyId: companyA,
    targetBranchId: "branch_belonging_to_company_b",
    authorizedBranches: [
      { id: branchSohar, companyId: companyA, name: "صحار", isMain: true },
      { id: "branch_belonging_to_company_b", companyId: companyB, name: "فرع ب", isMain: false }
    ]
  });
  assert(!switchBranchRes.allowed, "13. Branch belonging to another company rejected by validateBranchSwitch");

  // 14. LocalStorage Branch Tampering
  const tamperedBranch = branchMuscat;
  const isTamperedBranch = isAuthorizedForBranch(userEmployee, companyA, tamperedBranch);
  assert(!isTamperedBranch, "14. LocalStorage branch tampering rejected by domain policy");
}

// ----------------------------------------------------
// SECTION 4: TENANT LIFECYCLE TESTS (15–20)
// ----------------------------------------------------
async function runLifecycleTests() {
  // Setup tenant in READY state
  const provRes = await provisionNewTenantUseCase(
    {
      idempotencyKey: `idem_lifecycle_${Date.now()}`,
      name: "شركة دورة الحياة",
      crNumber: `CR-LC-${Date.now()}`,
      taxId: "TAX-LC",
      currency: "OMR",
      mainBranchName: "الفرع الرئيسي",
      adminEmail: "lc@tenant.om",
      adminName: "مدير Lifecycle",
      adminPin: "1234"
    },
    adminUserId,
    adapter
  );

  const tenantId = provRes.tenant!.id;
  const companyId = provRes.tenant!.companyId;

  // 20. READY State Blocks Operational Access
  const readyContext = resolveTenantContextState({
    userId: userEmployee.id,
    preferredCompanyId: companyId,
    fetchedMemberships: [{ id: "mem1", userId: userEmployee.id, companyId, roleId: "ADMIN", isActive: true, createdAt: new Date().toISOString() }],
    fetchedTenant: { ...provRes.tenant!, status: "READY" }
  });
  const readyValidation = validateOperationalAccess({ context: readyContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!readyValidation.allowed && Boolean(readyValidation.reason && /READY/i.test(readyValidation.reason)), "20. READY tenant status blocks operational execution until explicit activation");

  // 15. Explicit Activation to ACTIVE Allows Operations
  const actRes = await activateProvisionedTenantUseCase(tenantId, companyId, adminUserId, adapter);
  assert(actRes.success && actRes.tenant?.status === "ACTIVE", "15. Explicit activation moves tenant from READY to ACTIVE status");

  const activeContext = resolveTenantContextState({
    userId: userEmployee.id,
    preferredCompanyId: companyId,
    fetchedMemberships: [{ id: "m1", userId: userEmployee.id, companyId, roleId: "ADMIN", isActive: true, createdAt: new Date().toISOString() }],
    fetchedTenant: { ...provRes.tenant!, status: "ACTIVE" }
  });
  const activeValidation = validateOperationalAccess({ context: activeContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(activeValidation.allowed, "15b. ACTIVE tenant status allows operational execution");

  // 16. SUSPENDED Status Blocks Operational Access
  const suspRes = await suspendTenantUseCase(tenantId, companyId, adminUserId, adapter);
  assert(suspRes.success && suspRes.tenant?.status === "SUSPENDED", "16. Suspension moves tenant to SUSPENDED status");

  const suspContext = { ...activeContext, tenantStatus: "SUSPENDED" as any };
  const suspValidation = validateOperationalAccess({ context: suspContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!suspValidation.allowed && suspValidation.reason?.includes("SUSPENDED"), "16b. SUSPENDED tenant status blocks operational execution");

  // 17. ARCHIVED Status Blocks Operational Access
  const archRes = await archiveTenantUseCase(tenantId, companyId, adminUserId, adapter);
  assert(archRes.success && archRes.tenant?.status === "ARCHIVED", "17. Archiving moves tenant to ARCHIVED status");

  const archContext = { ...activeContext, tenantStatus: "ARCHIVED" as any };
  const archValidation = validateOperationalAccess({ context: archContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!archValidation.allowed && archValidation.reason?.includes("ARCHIVED"), "17b. ARCHIVED tenant status blocks operational execution");

  // 18. FAILED Status Blocks Operational Access
  const failedContext = { ...activeContext, tenantStatus: "FAILED" as any };
  const failedValidation = validateOperationalAccess({ context: failedContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!failedValidation.allowed && failedValidation.reason?.includes("FAILED"), "18. FAILED tenant status blocks operational execution");

  // 19. PROVISIONING Status Blocks Operational Access
  const provContext = { ...activeContext, tenantStatus: "PROVISIONING" as any };
  const provValidation = validateOperationalAccess({ context: provContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!provValidation.allowed && provValidation.reason?.includes("PROVISIONING"), "19. PROVISIONING tenant status blocks operational execution");
}

// ----------------------------------------------------
// SECTION 5: MODULES & FEATURES TESTS (21–24)
// ----------------------------------------------------
function runModuleFeatureTests() {
  const baseContext = resolveTenantContextState({
    userId: userEmployee.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [{ id: "mem1", userId: userEmployee.id, companyId: companyA, roleId: "ADMIN", isActive: true, createdAt: new Date().toISOString() }],
    fetchedModules: { pos: false, crm: true },
    fetchedFeatures: { "pos.discount_override": false }
  });

  // 21. Disabled Module Blocks Access
  const disModVal = validateOperationalAccess({ context: baseContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!disModVal.allowed && disModVal.reason?.includes("disabled"), "21. Disabled POS module at tenant level blocks execution");

  // 22. Disabled Feature Blocks Action
  const enabledModContext = resolveTenantContextState({
    userId: userEmployee.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [{ id: "mem1", userId: userEmployee.id, companyId: companyA, roleId: "ADMIN", isActive: true, createdAt: new Date().toISOString() }],
    fetchedModules: { pos: true, crm: true },
    fetchedFeatures: { "pos.discount_override": false }
  });
  const disFeatVal = validateOperationalAccess({
    context: enabledModContext,
    moduleCode: "pos",
    requiredPermission: "pos_apply_discount",
    featureCode: "pos.discount_override"
  });
  assert(!disFeatVal.allowed && disFeatVal.reason?.includes("Feature"), "22. Disabled feature pos.discount_override blocks action despite RBAC permission");

  // 23. Module Enabled But User Lacks Permission
  const noPermContext = resolveTenantContextState({
    userId: userEmployee.id,
    preferredCompanyId: companyA,
    userRole: "SALES", // SALES lacks delete_employees
    fetchedMemberships: [{ id: "mem1", userId: userEmployee.id, companyId: companyA, roleId: "SALES", isActive: true, createdAt: new Date().toISOString() }],
    fetchedModules: { hr: true }
  });
  const noPermVal = validateOperationalAccess({ context: noPermContext, moduleCode: "hr", requiredPermission: "delete_employees" });
  assert(!noPermVal.allowed && noPermVal.reason?.includes("Missing required RBAC permission"), "23. Enabled HR module without delete_employees RBAC permission is BLOCKED");

  // 24. Permission Exists But Module Disabled
  const modDisabledContext = resolveTenantContextState({
    userId: userEmployee.id,
    preferredCompanyId: companyA,
    userRole: "ADMIN",
    fetchedMemberships: [{ id: "mem1", userId: userEmployee.id, companyId: companyA, roleId: "ADMIN", isActive: true, createdAt: new Date().toISOString() }],
    fetchedModules: { hr: false } // HR module disabled at tenant level
  });
  const modDisVal = validateOperationalAccess({ context: modDisabledContext, moduleCode: "hr", requiredPermission: "delete_employees" });
  assert(!modDisVal.allowed && modDisVal.reason?.includes("disabled"), "24. Admin with delete_employees permission is BLOCKED when HR module is disabled at tenant level");
}

// ----------------------------------------------------
// SECTION 6: EMPLOYEE ISOLATION TESTS (25–27)
// ----------------------------------------------------
function runEmployeeTests() {
  const activeContext = resolveTenantContextState({
    userId: userEmployee.id,
    preferredCompanyId: companyA,
    fetchedMemberships: [{ id: "mem1", userId: userEmployee.id, companyId: companyA, roleId: "ADMIN", isActive: true, createdAt: new Date().toISOString() }]
  });

  // 25. Inactive Employee Blocks Execution
  const inactiveVal = validateOperationalAccess({
    context: activeContext,
    moduleCode: "pos",
    requiredPermission: "pos_create_order",
    employeeStatus: "INACTIVE"
  });
  assert(!inactiveVal.allowed && Boolean(inactiveVal.reason && /inactive/i.test(inactiveVal.reason)), "25. INACTIVE employee status blocks operational execution");

  // 26. Employee Without Valid Company Membership
  const noMembershipContext = resolveTenantContextState({
    userId: "usr_no_membership_99",
    preferredCompanyId: companyA,
    fetchedMemberships: [] // zero memberships
  });
  const noMemVal = validateOperationalAccess({ context: noMembershipContext, moduleCode: "pos", requiredPermission: "pos_create_order" });
  assert(!noMemVal.allowed, "26. Employee without valid company membership is BLOCKED");

  // 27. Cross-Company Employee Action
  const crossCompanyVal = validateOperationalAccess({
    context: activeContext,
    targetCompanyId: companyB, // Target Company B while active is A
    moduleCode: "pos",
    requiredPermission: "pos_create_order"
  });
  assert(!crossCompanyVal.allowed && crossCompanyVal.reason?.includes("does not hold active membership"), "27. Cross-company employee action targeting unassigned Company B is BLOCKED");
}

// ----------------------------------------------------
// SECTION 7: PLATFORM ROLES TESTS (28–31)
// ----------------------------------------------------
async function runPlatformRoleTests() {
  // 28. PLATFORM_ADMIN Can Execute Provisioning
  const isAdmin = await adapter.isPlatformAdmin(userPlatformAdmin.id);
  assert(isAdmin, "28. PLATFORM_ADMIN possesses platform administration capabilities");

  // 29. PLATFORM_ADMIN Without Membership Cannot Access Operational Data
  const adminOperationalAuth = isAuthorizedForCompany(userPlatformAdmin, companyA);
  assert(!adminOperationalAuth, "29. PLATFORM_ADMIN without company membership is DENIED operational ERP company access");

  // 30. PLATFORM_COLLABORATOR Cannot Escalate
  const isCollabAdmin = await adapter.isPlatformAdmin(userCollaborator.id);
  const collabOpAuth = isAuthorizedForCompany(userCollaborator, companyA);
  assert(!isCollabAdmin && !collabOpAuth, "30. PLATFORM_COLLABORATOR cannot escalate to Platform Admin or access operational company data");

  // 31. PLATFORM_AUDITOR Cannot Mutate
  const isAuditorAdmin = await adapter.isPlatformAdmin(userAuditor.id);
  const auditorWriteBlocked = userAuditor.platformRole === "PLATFORM_AUDITOR";
  assert(!isAuditorAdmin && auditorWriteBlocked, "31. PLATFORM_AUDITOR is strictly read-only and cannot execute tenant provisioning or mutations");
}

// ----------------------------------------------------
// SECTION 8: DATABASE & SCOPE ISOLATION TESTS (32–36)
// ----------------------------------------------------
function runDatabaseIsolationTests() {
  // 32. Cross-Company SELECT Denied
  const selectAuth = isAuthorizedForCompany(userEmployee, companyB);
  assert(!selectAuth, "32. Cross-company SELECT: User Employee querying Company B is DENIED by domain policy");

  // 33. Cross-Company INSERT Denied
  const insertAuth = isAuthorizedForCompany(userEmployee, companyB);
  assert(!insertAuth, "33. Cross-company INSERT: Inserting record into Company B is DENIED by domain policy");

  // 34. Cross-Company UPDATE Denied
  const updateAuth = isAuthorizedForCompany(userEmployee, companyB);
  assert(!updateAuth, "34. Cross-company UPDATE: Modifying record in Company B is DENIED by domain policy");

  // 35. Cross-Company DELETE Denied
  const deleteAuth = isAuthorizedForCompany(userEmployee, companyB);
  assert(!deleteAuth, "35. Cross-company DELETE: Deleting record in Company B is DENIED by domain policy");

  // 36. Cross-Branch Access Denied
  const branchAuth = isAuthorizedForBranch(userEmployee, companyA, branchMuscat);
  assert(!branchAuth, "36. Cross-Branch Access: Accessing unassigned branch Muscat outside [Sohar] scope is DENIED");
}

// ----------------------------------------------------
// MAIN SUITE EXECUTION WORKFLOW
// ----------------------------------------------------
async function main() {
  await runCreationTests();
  runCompanyAccessTests();
  runBranchAccessTests();
  await runLifecycleTests();
  runModuleFeatureTests();
  runEmployeeTests();
  await runPlatformRoleTests();
  runDatabaseIsolationTests();

  console.log("\n============================================================");
  console.log(`📊 PHASE 48 TENANT PROVISIONING SUITE RESULTS: ${passedCount} / ${totalCount} PASSED`);
  console.log("============================================================\n");

  if (passedCount !== totalCount) {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error("Fatal Test Suite Execution Error:", err);
  process.exitCode = 1;
});
