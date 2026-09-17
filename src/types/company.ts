/**
 * Company & Tenant Core Types — Deshal ERP
 */

export type {
  Tenant,
  TenantId,
  CompanyId,
  BranchId,
  MembershipId,
  UserId,
  TenantStatus,
  UserCompanyMembership,
  PlatformAdmin,
  SubscriptionPlanType,
  TenantSubscription,
  TenantModuleEntitlement,
  TenantFeatureEntitlement
} from '../domain/tenant/tenantEntities';

export interface Company {
  id: string;
  nameAr: string;
  nameEn?: string;
  crNumber?: string;
  taxNumber?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
