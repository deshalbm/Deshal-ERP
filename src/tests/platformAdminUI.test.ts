/**
 * Enterprise Platform Admin UI & Governance Test Suite — Deshal ERP
 * 
 * Clean Architecture Verification Pipeline:
 * Validates Platform Admin authorization boundaries, provisioning wizard flows, health check gating,
 * lifecycle state enforcement (READY -> ACTIVE, ACTIVE -> SUSPENDED, ACTIVE -> ARCHIVED),
 * job retries, and physical company membership isolation.
 */

import {
  evaluateTenantHealth,
  TenantHealthCheckData
} from '../application/services/tenantHealthCheckService';
import {
  provisionNewTenantUseCase,
  activateExistingCompanyAsTenantUseCase,
  activateProvisionedTenantUseCase,
  suspendTenantUseCase,
  archiveTenantUseCase,
  retryFailedProvisioningUseCase,
  ProvisioningAdapter
} from '../application/services/tenantProvisioningEngine';
import {
  Tenant,
  TenantStatus,
  TenantProvisioningJob,
  isValidTenantTransition,
  canActivateTenant
} from '../domain/tenant/tenantEntities';

console.log("\n============================================================");
console.log("🛡️ RUNNING PHASE 41 PLATFORM ADMIN UI & GOVERNANCE TESTS");
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

// Mock Adapter Implementation for Testing
class MockPlatformProvisioningAdapter implements ProvisioningAdapter {
  public isPlatformAdminUser: boolean = true;
  public mockTenants: Record<string, Tenant> = {};
  public mockJobs: Record<string, TenantProvisioningJob> = {};
  public healthDataMock: TenantHealthCheckData = {
    tenant: null,
    companyExists: true,
    mainBranchExists: true,
    hasActiveMembership: true,
    subscription: {
      id: 'sub_mock',
      companyId: 'cmp_mock',
      planType: 'PRO',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString()
    },
    moduleCount: 10,
    featureCount: 0,
    hasAdminRole: true
  };

  async isPlatformAdmin(userId: string): Promise<boolean> {
    return this.isPlatformAdminUser && Boolean(userId);
  }

  async executeProvisionTransaction(request: any): Promise<{
    success: boolean;
    idempotent: boolean;
    tenantId: string;
    companyId: string;
    tenantCode?: string;
    error?: string;
  }> {
    const tenantId = `tnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const companyId = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tenantCode = `TNT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const tenant: Tenant = {
      id: tenantId,
      tenantCode,
      name: request.name,
      companyId,
      status: 'READY',
      subscriptionPlan: request.subscriptionPlan || 'FREE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockTenants[tenantId] = tenant;
    this.healthDataMock = {
      ...this.healthDataMock,
      tenant,
      companyExists: true,
      subscription: {
        id: `sub_${companyId}`,
        companyId,
        planType: 'PRO',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString()
      }
    };

    return {
      success: true,
      idempotent: false,
      tenantId,
      companyId,
      tenantCode
    };
  }

  async activateExistingCompanyRecord(request: any): Promise<{
    success: boolean;
    tenantId: string;
    companyId: string;
    alreadyActive?: boolean;
    error?: string;
  }> {
    const tenantId = `tnt_ext_${request.companyId}`;
    const tenant: Tenant = {
      id: tenantId,
      tenantCode: 'TNT-EXT',
      name: 'Existing Tenant Company',
      companyId: request.companyId,
      status: 'READY',
      subscriptionPlan: request.subscriptionPlan || 'ENTERPRISE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockTenants[tenantId] = tenant;
    this.healthDataMock = {
      ...this.healthDataMock,
      tenant,
      companyExists: true,
      subscription: {
        id: `sub_${request.companyId}`,
        companyId: request.companyId,
        planType: 'ENTERPRISE',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString()
      }
    };

    return {
      success: true,
      tenantId,
      companyId: request.companyId
    };
  }

  async getTenantHealthData(tenantId: string, companyId: string): Promise<TenantHealthCheckData> {
    if (this.healthDataMock.tenant && this.healthDataMock.tenant.id === tenantId) {
      return this.healthDataMock;
    }

    const t = this.mockTenants[tenantId] || null;
    return {
      ...this.healthDataMock,
      tenant: t,
      companyExists: Boolean(t)
    };
  }

  async updateTenantStatus(tenantId: string, status: TenantStatus): Promise<boolean> {
    const tenant = this.mockTenants[tenantId];
    if (!tenant) return false;
    tenant.status = status;
    tenant.updatedAt = new Date().toISOString();
    return true;
  }

  async getProvisioningJob(idempotencyKey: string): Promise<TenantProvisioningJob | null> {
    return this.mockJobs[idempotencyKey] || null;
  }

  async getProvisioningJobById(jobId: string): Promise<TenantProvisioningJob | null> {
    return Object.values(this.mockJobs).find(j => j.id === jobId) || null;
  }

  async saveProvisioningJob(job: TenantProvisioningJob): Promise<void> {
    this.mockJobs[job.idempotencyKey] = job;
  }
}

async function runAllTests() {
  const adapter = new MockPlatformProvisioningAdapter();

  // Test 1: Non-admin block
  adapter.isPlatformAdminUser = false;
  const res1 = await provisionNewTenantUseCase(
    {
      idempotencyKey: 'idem_test_01',
      name: 'Unauthorized Corp',
      crNumber: 'CR-999',
      taxId: '',
      currency: 'OMR',
      mainBranchName: 'الفرع الرئيسي',
      adminEmail: 'user@test.om',
      adminName: 'Regular User',
      adminPin: '1234'
    },
    'user-regular-123',
    adapter
  );
  assert(!res1.success && res1.error!.includes('Security Violation'), 'Non-Platform Admin provisioning is strictly blocked', res1.error);

  // Test 2: Admin permit
  adapter.isPlatformAdminUser = true;
  const res2 = await provisionNewTenantUseCase(
    {
      idempotencyKey: 'idem_test_02',
      name: 'Authorized Platform SaaS Corp',
      crNumber: 'CR-100',
      taxId: '',
      currency: 'OMR',
      mainBranchName: 'الفرع الرئيسي',
      adminEmail: 'admin@platform.om',
      adminName: 'Platform Admin',
      adminPin: '1234'
    },
    'admin-user-001',
    adapter
  );
  assert(res2.success && res2.tenant?.status === 'READY', 'Authorized Platform Admin can initiate provisioning', `Tenant Code: ${res2.tenant?.tenantCode}`);

  // Test 3: Health check evaluation (10 checks)
  const healthData: TenantHealthCheckData = {
    tenant: {
      id: 'tnt_health_1',
      tenantCode: 'TNT-H1',
      name: 'Healthy Tenant',
      companyId: 'cmp_health_1',
      status: 'READY',
      subscriptionPlan: 'PRO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    companyExists: true,
    mainBranchExists: true,
    hasActiveMembership: true,
    subscription: {
      id: 'sub_h1',
      companyId: 'cmp_health_1',
      planType: 'PRO',
      status: 'active',
      currentPeriodEnd: new Date().toISOString()
    },
    moduleCount: 8,
    featureCount: 0,
    hasAdminRole: true
  };
  const evalResult = evaluateTenantHealth('tnt_health_1', 'cmp_health_1', healthData);
  assert(evalResult.ready && evalResult.checks.length === 10, 'Health check evaluates all 10 relationship integrity checks', `Passed checks: ${evalResult.checks.filter(c => c.passed).length}/10`);

  // Test 4: Health check failure blocks activation
  adapter.healthDataMock.hasActiveMembership = false;
  const res3 = await provisionNewTenantUseCase(
    {
      idempotencyKey: 'idem_test_03',
      name: 'Unhealthy Tenant',
      crNumber: 'CR-200',
      taxId: '',
      currency: 'OMR',
      mainBranchName: 'الفرع الرئيسي',
      adminEmail: 'admin@unhealthy.om',
      adminName: 'Admin',
      adminPin: '1234'
    },
    'admin-user-001',
    adapter
  );
  assert(!res3.success && res3.failedStep === 'HEALTH_CHECK', 'Health check failure prevents auto-activation', res3.error);

  // Test 5: Explicit activation (READY -> ACTIVE)
  adapter.healthDataMock.hasActiveMembership = true;
  const res4 = await provisionNewTenantUseCase(
    {
      idempotencyKey: 'idem_test_04',
      name: 'Ready Tenant',
      crNumber: 'CR-300',
      taxId: '',
      currency: 'OMR',
      mainBranchName: 'الفرع الرئيسي',
      adminEmail: 'admin@ready.om',
      adminName: 'Admin',
      adminPin: '1234'
    },
    'admin-user-001',
    adapter
  );
  assert(res4.success, 'Provisioning completed successfully in READY state');

  const activateRes = await activateProvisionedTenantUseCase(
    res4.tenant!.id,
    res4.tenant!.companyId,
    'admin-user-001',
    adapter
  );
  assert(activateRes.success && activateRes.tenant?.status === 'ACTIVE', 'Explicit activation transitions tenant status from READY to ACTIVE', `Tenant ID: ${activateRes.tenant?.id}`);

  // Test 6: Lifecycle transitions (ACTIVE -> SUSPENDED -> ARCHIVED)
  const tenantLc: Tenant = {
    id: 'tnt_lc_1',
    tenantCode: 'TNT-LC1',
    name: 'Lifecycle Tenant',
    companyId: 'cmp_lc1',
    status: 'ACTIVE',
    subscriptionPlan: 'PRO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  adapter.mockTenants[tenantLc.id] = tenantLc;
  adapter.healthDataMock.tenant = tenantLc;

  const suspendRes = await suspendTenantUseCase(tenantLc.id, tenantLc.companyId, 'admin-user-001', adapter);
  assert(suspendRes.success && suspendRes.tenant?.status === 'SUSPENDED', 'Suspend action transitions tenant to SUSPENDED', `Status: ${suspendRes.tenant?.status}`);

  const archiveRes = await archiveTenantUseCase(tenantLc.id, tenantLc.companyId, 'admin-user-001', adapter);
  assert(archiveRes.success && archiveRes.tenant?.status === 'ARCHIVED', 'Archive action transitions tenant to ARCHIVED', `Status: ${archiveRes.tenant?.status}`);

  // Test 7: Invalid lifecycle transition policy
  const invalidTransition = isValidTenantTransition('ARCHIVED', 'ACTIVE');
  assert(!invalidTransition, 'Pure domain policy rejects illegal status transition (ARCHIVED -> ACTIVE)');

  // Test 8: Job retry
  const failedJob: TenantProvisioningJob = {
    id: 'job_failed_99',
    idempotencyKey: 'idem_failed_99',
    tenantId: null,
    companyId: null,
    status: 'FAILED',
    failedStep: 'PROVISION_TRANSACTION',
    errorCode: 'ERR_TIMEOUT',
    errorMessage: 'Database connection timed out during provisioning RPC',
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  adapter.mockJobs[failedJob.idempotencyKey] = failedJob;
  const retryRes = await retryFailedProvisioningUseCase('job_failed_99', 'admin-user-001', adapter);
  assert(retryRes.success, 'Platform Admin can re-trigger failed provisioning jobs idempotently');

  console.log("\n============================================================");
  console.log(`📊 PHASE 41 TEST RESULTS: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log("============================================================\n");
}

runAllTests().catch(err => {
  console.error("FATAL TEST EXECUTION ERROR:", err);
  process.exitCode = 1;
});
