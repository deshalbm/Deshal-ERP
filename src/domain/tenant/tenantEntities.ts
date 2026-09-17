/**
 * Enterprise Multi-Tenant Domain Entities & Pure Validation Policies — Deshal ERP
 * 
 * Clean Architecture Domain Layer: Pure TypeScript models and policies.
 * ZERO React, ZERO Supabase, ZERO LocalStorage, ZERO Browser/DOM globals, ZERO external network calls.
 */

export type TenantId = string;
export type CompanyId = string;
export type BranchId = string;
export type MembershipId = string;
export type UserId = string;

export type TenantStatus =
  | "PENDING"
  | "PROVISIONING"
  | "READY"
  | "ACTIVE"
  | "SUSPENDED"
  | "FAILED"
  | "ARCHIVED";

export interface Tenant {
  id: TenantId;
  tenantCode: string;
  name: string;
  companyId: CompanyId;
  status: TenantStatus;
  subscriptionPlan: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCompanyMembership {
  id: MembershipId;
  userId: UserId;
  companyId: CompanyId;
  roleId: string;
  isActive: boolean;
  createdAt: string;
}

export interface PlatformAdmin {
  userId: UserId;
  grantedAt: string;
  grantedBy: UserId | null;
}

export type SubscriptionPlanType = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export interface TenantSubscription {
  id: string;
  companyId: CompanyId;
  planType: SubscriptionPlanType;
  status: "active" | "trialing" | "past_due" | "canceled";
  currentPeriodEnd: string;
}

export interface TenantModuleEntitlement {
  tenantId: TenantId;
  moduleCode: string;
  isEnabled: boolean;
  updatedAt: string;
}

export interface TenantFeatureEntitlement {
  tenantId: TenantId;
  moduleCode: string;
  featureCode: string;
  isEnabled: boolean;
  updatedAt: string;
}

export type ProvisioningJobStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface TenantProvisioningJob {
  id: string;
  idempotencyKey: string;
  tenantId: TenantId | null;
  companyId: CompanyId | null;
  status: ProvisioningJobStatus;
  failedStep: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Valid lifecycle state transitions map for Tenant entities.
 */
const VALID_LIFECYCLE_TRANSITIONS: Record<TenantStatus, TenantStatus[]> = {
  PENDING: ["PROVISIONING"],
  PROVISIONING: ["READY", "FAILED"],
  READY: ["ACTIVE", "FAILED"],
  ACTIVE: ["SUSPENDED", "ARCHIVED"],
  SUSPENDED: ["ACTIVE", "ARCHIVED"],
  FAILED: ["PROVISIONING"],
  ARCHIVED: []
};

/**
 * Pure domain policy: Validates whether a tenant status transition is legally permitted.
 */
export function isValidTenantTransition(
  currentStatus: TenantStatus,
  targetStatus: TenantStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = VALID_LIFECYCLE_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Pure domain policy: Checks whether a user-company membership is currently active.
 */
export function isActiveMembership(membership: UserCompanyMembership): boolean {
  return Boolean(membership && membership.isActive && membership.userId && membership.companyId);
}

/**
 * Pure domain policy: Checks whether a tenant entity can be activated.
 */
export function canActivateTenant(tenant: Tenant): { canActivate: boolean; reason?: string } {
  if (!tenant) {
    return { canActivate: false, reason: "Tenant object is required." };
  }

  if (!tenant.id || !tenant.id.trim()) {
    return { canActivate: false, reason: "Tenant ID is missing." };
  }

  if (!tenant.companyId || !tenant.companyId.trim()) {
    return { canActivate: false, reason: "Company ID binding is required for activation." };
  }

  if (!isValidTenantTransition(tenant.status, "ACTIVE")) {
    return {
      canActivate: false,
      reason: `Cannot transition tenant from status '${tenant.status}' to 'ACTIVE'.`
    };
  }

  return { canActivate: true };
}

/**
 * Pure domain policy: Validates binding between a Tenant entity and a target Company ID.
 */
export function isValidTenantCompanyBinding(tenant: Tenant, companyId: CompanyId): boolean {
  if (!tenant || !companyId) return false;
  return Boolean(tenant.companyId && tenant.companyId.trim() === companyId.trim());
}

/**
 * Pure domain policy: Validates provisioning job parameter integrity.
 */
export function isValidProvisioningJob(job: TenantProvisioningJob): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!job) {
    return { valid: false, errors: ["Provisioning job object is required."] };
  }

  if (!job.id || !job.id.trim()) {
    errors.push("Job ID is required.");
  }

  if (!job.idempotencyKey || !job.idempotencyKey.trim()) {
    errors.push("Idempotency key is required for provisioning jobs.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
