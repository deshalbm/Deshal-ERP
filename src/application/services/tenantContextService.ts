/**
 * Tenant Context Resolution & Authorization Application Service — Deshal ERP
 * 
 * Clean Architecture Application Layer: Pure application service rules.
 * ZERO Supabase imports, ZERO Browser Storage globals, ZERO direct DOM references.
 */

import {
  Tenant,
  UserCompanyMembership,
  TenantSubscription,
  TenantStatus
} from '../../domain/tenant/tenantEntities';
import { EmployeePermission } from '../../types/hr';
import { evaluateEmployeePermissions } from '../../domain/hr/employeePermissions';

export interface TenantContextData {
  tenantId: string | null;
  companyId: string | null;
  activeCompanyId: string | null;
  memberships: UserCompanyMembership[];
  activeMembership: UserCompanyMembership | null;
  isPlatformAdmin: boolean;
  tenantStatus: TenantStatus | null;
  subscription: TenantSubscription | null;
  enabledModules: Record<string, boolean>;
  enabledFeatures: Record<string, boolean>;
  permissions: EmployeePermission[];
  loading: boolean;
  error: string | null;
}

export interface CompanySwitchResult {
  allowed: boolean;
  targetCompanyId?: string;
  error?: string;
}

const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Resolves active company ID based on memberships and preferred company selection.
 */
export function resolveActiveCompanyId(params: {
  preferredCompanyId?: string | null;
  memberships: UserCompanyMembership[];
  isPlatformAdmin: boolean;
}): { activeCompanyId: string | null; activeMembership: UserCompanyMembership | null } {
  const { preferredCompanyId, memberships } = params;

  if (preferredCompanyId && memberships.some(m => m.companyId === preferredCompanyId && m.isActive)) {
    const activeMembership = memberships.find(m => m.companyId === preferredCompanyId) || null;
    return { activeCompanyId: preferredCompanyId, activeMembership };
  }

  const activeMemberships = memberships.filter(m => m.isActive);
  if (activeMemberships.length > 0) {
    return { activeCompanyId: activeMemberships[0].companyId, activeMembership: activeMemberships[0] };
  }

  return { activeCompanyId: null, activeMembership: null };
}

/**
 * Pure application resolution logic for tenant context state.
 */
export function resolveTenantContextState(params: {
  userId: string | null;
  preferredCompanyId?: string | null;
  userRole?: string | null;
  customPermissions?: EmployeePermission[];
  isPlatformAdmin?: boolean;
  fetchedMemberships?: UserCompanyMembership[];
  fetchedTenant?: Tenant | null;
  fetchedSubscription?: TenantSubscription | null;
  fetchedModules?: Record<string, boolean>;
  fetchedFeatures?: Record<string, boolean>;
}): TenantContextData {
  const {
    userId,
    preferredCompanyId,
    userRole,
    customPermissions,
    isPlatformAdmin = false,
    fetchedMemberships = [],
    fetchedTenant = null,
    fetchedSubscription = null,
    fetchedModules = {},
    fetchedFeatures = {}
  } = params;

  const defaultCompany = preferredCompanyId || DEFAULT_COMPANY_ID;

  // Unauthenticated or fallback mode
  if (!userId) {
    const defaultMembership: UserCompanyMembership = {
      id: `mem_fallback_${defaultCompany}`,
      userId: 'usr_anonymous',
      companyId: defaultCompany,
      roleId: userRole || 'ADMIN',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const permissions = evaluateEmployeePermissions(
      { role: (userRole as any) || 'ADMIN', permissions: customPermissions },
      customPermissions
    );

    return {
      tenantId: `tnt_${defaultCompany}`,
      companyId: defaultCompany,
      activeCompanyId: defaultCompany,
      memberships: [defaultMembership],
      activeMembership: defaultMembership,
      isPlatformAdmin: false,
      tenantStatus: 'ACTIVE',
      subscription: {
        id: `sub_${defaultCompany}`,
        companyId: defaultCompany,
        planType: 'ENTERPRISE',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString()
      },
      enabledModules: {
        crm: true,
        pos: true,
        inventory: true,
        purchases: true,
        accounting: true,
        hr: true,
        attendance: true,
        spaces: true,
        services: true,
        requests: true,
        documents: true,
        kiosk: true
      },
      enabledFeatures: {},
      permissions,
      loading: false,
      error: null
    };
  }

  // Resolve active company ID and membership
  const { activeCompanyId, activeMembership } = resolveActiveCompanyId({
    preferredCompanyId,
    memberships: fetchedMemberships,
    isPlatformAdmin
  });

  if (!activeCompanyId) {
    return {
      tenantId: null,
      companyId: null,
      activeCompanyId: null,
      memberships: [],
      activeMembership: null,
      isPlatformAdmin,
      tenantStatus: null,
      subscription: null,
      enabledModules: {},
      enabledFeatures: {},
      permissions: [],
      loading: false,
      error: 'No active company membership found for user.'
    };
  }

  const tenantStatus: TenantStatus = fetchedTenant ? fetchedTenant.status : 'ACTIVE';

  if (['PENDING', 'PROVISIONING', 'READY', 'SUSPENDED', 'FAILED', 'ARCHIVED'].includes(tenantStatus)) {
    return {
      tenantId: fetchedTenant?.id || null,
      companyId: activeCompanyId,
      activeCompanyId,
      memberships: fetchedMemberships,
      activeMembership,
      isPlatformAdmin,
      tenantStatus,
      subscription: null,
      enabledModules: {},
      enabledFeatures: {},
      permissions: [],
      loading: false,
      error: `Tenant operational context is restricted due to status: ${tenantStatus}`
    };
  }

  const effectiveRole = activeMembership?.roleId || userRole || 'ADMIN';
  const permissions = evaluateEmployeePermissions(
    { role: (effectiveRole as any) || 'ADMIN', permissions: customPermissions },
    customPermissions
  );

  return {
    tenantId: fetchedTenant?.id || `tnt_${activeCompanyId}`,
    companyId: activeCompanyId,
    activeCompanyId,
    memberships: fetchedMemberships,
    activeMembership,
    isPlatformAdmin,
    tenantStatus,
    subscription: fetchedSubscription || {
      id: `sub_${activeCompanyId}`,
      companyId: activeCompanyId,
      planType: (fetchedTenant?.subscriptionPlan as any) || 'ENTERPRISE',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString()
    },
    enabledModules: Object.keys(fetchedModules).length > 0 ? fetchedModules : {
      crm: true,
      pos: true,
      inventory: true,
      purchases: true,
      accounting: true,
      hr: true,
      attendance: true,
      spaces: true,
      services: true,
      requests: true,
      documents: true,
      kiosk: true
    },
    enabledFeatures: fetchedFeatures,
    permissions,
    loading: false,
    error: null
  };
}

/**
 * Validates whether a user can switch to a target company.
 */
export function validateCompanySwitch(params: {
  userId: string | null;
  targetCompanyId: string;
  memberships: UserCompanyMembership[];
  isPlatformAdmin: boolean;
}): CompanySwitchResult {
  const { targetCompanyId, memberships } = params;

  if (!targetCompanyId) {
    return { allowed: false, error: 'Target company ID is required.' };
  }

  const hasActiveMembership = memberships.some(
    m => m.companyId === targetCompanyId && m.isActive
  );

  if (!hasActiveMembership) {
    return {
      allowed: false,
      error: 'Security Rejection: User does not hold active membership in target company.'
    };
  }

  return { allowed: true, targetCompanyId };
}
