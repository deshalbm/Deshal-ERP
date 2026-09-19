/**
 * Enterprise Multi-Tenant Provisioning & Activation Engine — Deshal ERP
 * 
 * Clean Architecture Application Layer: Core business rules for tenant lifecycle management,
 * new tenant provisioning, existing company activation, health check gating, and idempotency protection.
 * ZERO Supabase imports, ZERO Browser Storage globals.
 */

import {
  Tenant,
  TenantStatus,
  TenantProvisioningJob,
  isValidTenantTransition,
  canActivateTenant,
  isValidTenantCompanyBinding,
  isValidProvisioningJob
} from "../../domain/tenant/tenantEntities";
import {
  ProvisionNewTenantRequest,
  ActivateExistingCompanyRequest,
  ProvisioningResponse,
  TenantHealthCheckResult
} from "../ports/tenantPorts";
import {
  evaluateTenantHealth,
  TenantHealthCheckData
} from "./tenantHealthCheckService";

export interface ProvisioningAdapter {
  isPlatformAdmin(userId: string): Promise<boolean>;
  executeProvisionTransaction(request: ProvisionNewTenantRequest): Promise<{
    success: boolean;
    idempotent: boolean;
    tenantId: string;
    companyId: string;
    mainBranchId?: string;
    tenantCode?: string;
    error?: string;
  }>;
  activateExistingCompanyRecord(request: ActivateExistingCompanyRequest): Promise<{
    success: boolean;
    tenantId: string;
    companyId: string;
    alreadyActive?: boolean;
    error?: string;
  }>;
  getTenantHealthData(tenantId: string, companyId: string): Promise<TenantHealthCheckData>;
  updateTenantStatus(tenantId: string, status: TenantStatus): Promise<boolean>;
  getProvisioningJob(idempotencyKey: string): Promise<TenantProvisioningJob | null>;
  getProvisioningJobById(jobId: string): Promise<TenantProvisioningJob | null>;
  saveProvisioningJob(job: TenantProvisioningJob): Promise<void>;
}

/**
 * Application Use-case: Provision a completely new multi-tenant SaaS organization.
 */
export async function provisionNewTenantUseCase(
  request: ProvisionNewTenantRequest,
  initiatorUserId: string,
  adapter: ProvisioningAdapter
): Promise<ProvisioningResponse> {
  // 1. Platform Admin Authorization Guard
  const isAdmin = await adapter.isPlatformAdmin(initiatorUserId);
  if (!isAdmin) {
    return {
      success: false,
      error: "Security Violation: Only Platform Administrators can execute tenant provisioning."
    };
  }

  // 2. Input Validation
  if (!request.idempotencyKey || !request.idempotencyKey.trim()) {
    return { success: false, error: "Idempotency key is required for tenant provisioning." };
  }
  if (!request.name || !request.name.trim()) {
    return { success: false, error: "Company name is required." };
  }
  if (!request.crNumber || !request.crNumber.trim()) {
    return { success: false, error: "CR registration number is required." };
  }

  // 3. Idempotency Protection Check
  const existingJob = await adapter.getProvisioningJob(request.idempotencyKey);
  if (existingJob) {
    if (existingJob.status === "COMPLETED" && existingJob.tenantId) {
      return {
        success: true,
        tenant: {
          id: existingJob.tenantId,
          tenantCode: "TNT-IDEMP",
          name: request.name,
          companyId: existingJob.companyId || "",
          status: "READY",
          subscriptionPlan: request.subscriptionPlan || "FREE",
          createdAt: existingJob.createdAt,
          updatedAt: existingJob.completedAt || new Date().toISOString()
        },
        jobId: existingJob.id
      };
    }
  }

  // 4. Execute Transactional RPC via Adapter
  const txResult = await adapter.executeProvisionTransaction(request);
  if (!txResult.success) {
    return {
      success: false,
      error: txResult.error || "Transactional tenant provisioning failed.",
      failedStep: "PROVISION_TRANSACTION"
    };
  }

  // 5. Execute Health Check
  const healthData = await adapter.getTenantHealthData(txResult.tenantId, txResult.companyId);
  const healthCheck = evaluateTenantHealth(txResult.tenantId, txResult.companyId, healthData);

  if (!healthCheck.ready) {
    // Health check failed -> tenant remains in READY/FAILED state, cannot auto-activate
    const failedChecks = healthCheck.checks.filter(c => !c.passed).map(c => c.name).join(", ");
    return {
      success: false,
      tenant: {
        id: txResult.tenantId,
        tenantCode: txResult.tenantCode || "TNT-NEW",
        name: request.name,
        companyId: txResult.companyId,
        status: "READY",
        subscriptionPlan: request.subscriptionPlan || "FREE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      error: `Health check validation failed: [${failedChecks}]`,
      failedStep: "HEALTH_CHECK"
    };
  }

  // 6. Return Provisioned Tenant in READY state (Pending explicit activation to ACTIVE)
  return {
    success: true,
    tenant: {
      id: txResult.tenantId,
      tenantCode: txResult.tenantCode || "TNT-NEW",
      name: request.name,
      companyId: txResult.companyId,
      status: "READY",
      subscriptionPlan: request.subscriptionPlan || "FREE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
}

/**
 * Application Use-case: Activate an existing company as a platform tenant.
 */
export async function activateExistingCompanyAsTenantUseCase(
  request: ActivateExistingCompanyRequest,
  initiatorUserId: string,
  adapter: ProvisioningAdapter
): Promise<ProvisioningResponse> {
  // 1. Authorization Guard
  const isAdmin = await adapter.isPlatformAdmin(initiatorUserId);
  if (!isAdmin) {
    return {
      success: false,
      error: "Security Violation: Only Platform Administrators can activate existing companies as tenants."
    };
  }

  if (!request.companyId) {
    return { success: false, error: "Target company ID is required." };
  }

  // 2. Execute Existing Company Activation via Adapter
  const activationResult = await adapter.activateExistingCompanyRecord(request);
  if (!activationResult.success) {
    return {
      success: false,
      error: activationResult.error || "Failed to activate existing company as tenant."
    };
  }

  // 3. Health Check
  const healthData = await adapter.getTenantHealthData(activationResult.tenantId, request.companyId);
  const healthCheck = evaluateTenantHealth(activationResult.tenantId, request.companyId, healthData);

  if (!healthCheck.ready) {
    const failedChecks = healthCheck.checks.filter(c => !c.passed).map(c => c.name).join(", ");
    return {
      success: false,
      error: `Health check failed for existing company activation: [${failedChecks}]`,
      failedStep: "HEALTH_CHECK"
    };
  }

  // 4. Update status to ACTIVE upon passing health check
  await adapter.updateTenantStatus(activationResult.tenantId, "ACTIVE");

  return {
    success: true,
    tenant: {
      id: activationResult.tenantId,
      tenantCode: healthData.tenant?.tenantCode || "TNT-EXISTING",
      name: healthData.tenant?.name || "Existing Company Tenant",
      companyId: request.companyId,
      status: "ACTIVE",
      subscriptionPlan: request.subscriptionPlan || "ENTERPRISE",
      createdAt: healthData.tenant?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
}

/**
 * Application Use-case: Explicitly activate a provisioned tenant (READY -> ACTIVE).
 */
export async function activateProvisionedTenantUseCase(
  tenantId: string,
  companyId: string,
  initiatorUserId: string,
  adapter: ProvisioningAdapter
): Promise<ProvisioningResponse> {
  const isAdmin = await adapter.isPlatformAdmin(initiatorUserId);
  if (!isAdmin) {
    return {
      success: false,
      error: "Security Violation: Only Platform Administrators can activate tenants."
    };
  }

  // 1. Run Health Check
  const healthData = await adapter.getTenantHealthData(tenantId, companyId);
  const healthCheck = evaluateTenantHealth(tenantId, companyId, healthData);

  if (!healthCheck.ready) {
    const failedChecks = healthCheck.checks.filter(c => !c.passed).map(c => c.name).join(", ");
    return {
      success: false,
      error: `Cannot activate tenant: Health check failed on [${failedChecks}]`
    };
  }

  // 2. Validate Tenant Entity Transition
  if (!healthData.tenant) {
    return { success: false, error: "Tenant record not found." };
  }

  const activationEligible = canActivateTenant(healthData.tenant);
  if (!activationEligible.canActivate) {
    return { success: false, error: activationEligible.reason || "Tenant is not eligible for activation." };
  }

  // 3. Update Tenant Lifecycle Status to ACTIVE
  const updated = await adapter.updateTenantStatus(tenantId, "ACTIVE");
  if (!updated) {
    return { success: false, error: "Failed to update tenant status to ACTIVE in database." };
  }

  return {
    success: true,
    tenant: {
      ...healthData.tenant,
      status: "ACTIVE",
      updatedAt: new Date().toISOString()
    }
  };
}

/**
 * Application Use-case: Suspend an active tenant (ACTIVE -> SUSPENDED).
 */
export async function suspendTenantUseCase(
  tenantId: string,
  companyId: string,
  initiatorUserId: string,
  adapter: ProvisioningAdapter
): Promise<ProvisioningResponse> {
  const isAdmin = await adapter.isPlatformAdmin(initiatorUserId);
  if (!isAdmin) {
    return {
      success: false,
      error: "Security Violation: Only Platform Administrators can suspend tenants."
    };
  }

  const healthData = await adapter.getTenantHealthData(tenantId, companyId);
  if (!healthData.tenant) {
    return { success: false, error: "Tenant record not found." };
  }

  if (!isValidTenantTransition(healthData.tenant.status, "SUSPENDED")) {
    return {
      success: false,
      error: `Invalid transition from status '${healthData.tenant.status}' to 'SUSPENDED'.`
    };
  }

  const updated = await adapter.updateTenantStatus(tenantId, "SUSPENDED");
  if (!updated) {
    return { success: false, error: "Failed to update tenant status to SUSPENDED." };
  }

  return {
    success: true,
    tenant: {
      ...healthData.tenant,
      status: "SUSPENDED",
      updatedAt: new Date().toISOString()
    }
  };
}

/**
 * Application Use-case: Archive a tenant (ACTIVE/SUSPENDED -> ARCHIVED).
 */
export async function archiveTenantUseCase(
  tenantId: string,
  companyId: string,
  initiatorUserId: string,
  adapter: ProvisioningAdapter
): Promise<ProvisioningResponse> {
  const isAdmin = await adapter.isPlatformAdmin(initiatorUserId);
  if (!isAdmin) {
    return {
      success: false,
      error: "Security Violation: Only Platform Administrators can archive tenants."
    };
  }

  const healthData = await adapter.getTenantHealthData(tenantId, companyId);
  if (!healthData.tenant) {
    return { success: false, error: "Tenant record not found." };
  }

  if (!isValidTenantTransition(healthData.tenant.status, "ARCHIVED")) {
    return {
      success: false,
      error: `Invalid transition from status '${healthData.tenant.status}' to 'ARCHIVED'.`
    };
  }

  const updated = await adapter.updateTenantStatus(tenantId, "ARCHIVED");
  if (!updated) {
    return { success: false, error: "Failed to update tenant status to ARCHIVED." };
  }

  return {
    success: true,
    tenant: {
      ...healthData.tenant,
      status: "ARCHIVED",
      updatedAt: new Date().toISOString()
    }
  };
}

/**
 * Application Use-case: Retry a failed tenant provisioning job.
 */
export async function retryFailedProvisioningUseCase(
  jobId: string,
  initiatorUserId: string,
  adapter: ProvisioningAdapter
): Promise<ProvisioningResponse> {
  const isAdmin = await adapter.isPlatformAdmin(initiatorUserId);
  if (!isAdmin) {
    return {
      success: false,
      error: "Security Violation: Only Platform Administrators can retry provisioning jobs."
    };
  }

  const job = await adapter.getProvisioningJobById(jobId);
  if (!job) {
    return { success: false, error: "Provisioning job not found." };
  }

  if (job.status === "COMPLETED") {
    return {
      success: true,
      jobId: job.id,
      tenant: {
        id: job.tenantId || "",
        tenantCode: "TNT-RETRY",
        name: "Retried Tenant",
        companyId: job.companyId || "",
        status: "READY",
        subscriptionPlan: "FREE",
        createdAt: job.createdAt,
        updatedAt: job.completedAt || new Date().toISOString()
      }
    };
  }

  // Re-run provision request using original idempotency key
  const payload = job as any;
  return provisionNewTenantUseCase(
    {
      idempotencyKey: job.idempotencyKey,
      name: payload.name || "Retried Tenant",
      crNumber: payload.crNumber || `CR-${Date.now()}`,
      taxId: payload.taxId || `TAX-${Date.now()}`,
      currency: "OMR",
      mainBranchName: "Main Branch",
      adminEmail: "admin@tenant.om",
      adminName: "Tenant Admin",
      adminPin: "1234"
    },
    initiatorUserId,
    adapter
  );
}
