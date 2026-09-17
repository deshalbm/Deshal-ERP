/**
 * Abstract Application Ports & DTO Contracts for Enterprise Multi-Tenancy — Deshal ERP
 * 
 * Clean Architecture Application Layer: Interface contracts only.
 */

import {
  Tenant,
  TenantId,
  CompanyId,
  BranchId,
  MembershipId,
  UserId,
  UserCompanyMembership,
  PlatformAdmin,
  TenantSubscription,
  TenantModuleEntitlement,
  TenantFeatureEntitlement,
  TenantProvisioningJob
} from "../../domain/tenant/tenantEntities";

export interface TenantRepository {
  findById(tenantId: TenantId): Promise<Tenant | null>;
  findByCompanyId(companyId: CompanyId): Promise<Tenant | null>;
  listTenants(): Promise<Tenant[]>;
  saveTenant(tenant: Tenant): Promise<void>;
}

export interface TenantMembershipRepository {
  findMembershipsByUserId(userId: UserId): Promise<UserCompanyMembership[]>;
  findMembershipsByCompanyId(companyId: CompanyId): Promise<UserCompanyMembership[]>;
  saveMembership(membership: UserCompanyMembership): Promise<void>;
  removeMembership(membershipId: MembershipId): Promise<void>;
}

export interface TenantSubscriptionRepository {
  findByCompanyId(companyId: CompanyId): Promise<TenantSubscription | null>;
  saveSubscription(subscription: TenantSubscription): Promise<void>;
}

export interface TenantModuleRepository {
  findModulesByTenantId(tenantId: TenantId): Promise<TenantModuleEntitlement[]>;
  saveModule(entitlement: TenantModuleEntitlement): Promise<void>;
}

export interface TenantFeatureRepository {
  findFeaturesByTenantId(tenantId: TenantId): Promise<TenantFeatureEntitlement[]>;
  saveFeature(entitlement: TenantFeatureEntitlement): Promise<void>;
}

export interface PlatformAdminRepository {
  isPlatformAdmin(userId: UserId): Promise<boolean>;
  listPlatformAdmins(): Promise<PlatformAdmin[]>;
  grantPlatformAdmin(userId: UserId, grantedBy: UserId): Promise<void>;
  revokePlatformAdmin(userId: UserId): Promise<void>;
}

export interface TenantProvisioningJobRepository {
  findByIdempotencyKey(key: string): Promise<TenantProvisioningJob | null>;
  saveJob(job: TenantProvisioningJob): Promise<void>;
  listFailedJobs(): Promise<TenantProvisioningJob[]>;
}

export interface TenantHealthCheckItem {
  name: string;
  passed: boolean;
  error?: string;
}

export interface TenantHealthCheckResult {
  ready: boolean;
  tenantId: TenantId;
  companyId: CompanyId;
  checks: TenantHealthCheckItem[];
  timestamp: string;
}

export interface TenantHealthCheckService {
  verifyTenantHealth(tenantId: TenantId, companyId: CompanyId): Promise<TenantHealthCheckResult>;
}

export interface ProvisionNewTenantRequest {
  idempotencyKey: string;
  name: string;
  crNumber: string;
  taxId: string;
  currency: string;
  mainBranchName: string;
  adminEmail: string;
  adminName: string;
  adminPin: string;
  subscriptionPlan?: string;
  enabledModules?: string[];
}

export interface ActivateExistingCompanyRequest {
  idempotencyKey: string;
  companyId: CompanyId;
  subscriptionPlan?: string;
  adminUserId: UserId;
}

export interface ProvisioningResponse {
  success: boolean;
  tenant?: Tenant;
  jobId?: string;
  error?: string;
  failedStep?: string;
}

export interface TenantProvisioningService {
  provisionNewTenant(request: ProvisionNewTenantRequest): Promise<ProvisioningResponse>;
  activateExistingCompanyAsTenant(request: ActivateExistingCompanyRequest): Promise<ProvisioningResponse>;
  retryFailedProvisioning(jobId: string): Promise<ProvisioningResponse>;
}

export interface TenantContextState {
  currentTenantId: TenantId | null;
  currentCompanyId: CompanyId | null;
  currentBranchId: BranchId | null;
  currentMembershipId: MembershipId | null;
  isPlatformAdmin: boolean;
  defaultCompanyId: CompanyId | null; // Profile legacy/preferred default UI company
}

export interface TenantAuthorizationCapabilities {
  canAccessTenant(tenantId: TenantId): Promise<boolean>;
  canAccessCompany(companyId: CompanyId): Promise<boolean>;
  canAccessBranch(companyId: CompanyId, branchId: BranchId): Promise<boolean>;
  hasMembership(userId: UserId, companyId: CompanyId): Promise<boolean>;
  hasPermission(userId: UserId, companyId: CompanyId, permissionCode: string): Promise<boolean>;
  hasModule(tenantId: TenantId, moduleCode: string): Promise<boolean>;
  hasFeature(tenantId: TenantId, moduleCode: string, featureCode: string): Promise<boolean>;
  isPlatformAdmin(userId: UserId): Promise<boolean>;
}
