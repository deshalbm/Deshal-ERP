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

export interface AuthorizedCompany {
  id: string;
  nameAr: string;
  nameEn?: string;
  crNumber?: string;
}

export interface AuthorizedBranch {
  id: string;
  code?: string;
  name: string;
  nameEn?: string;
  isMain?: boolean;
  status?: string;
  companyId?: string;
}

export interface TenantContextData {
  tenantId: string | null;
  companyId: string | null;
  activeCompanyId: string | null;
  activeCompany: AuthorizedCompany | null;
  authorizedCompanies: AuthorizedCompany[];
  authorizedBranches: AuthorizedBranch[];
  activeBranchId: string | null;
  activeBranch: AuthorizedBranch | null;
  activeEmployee: { id: string; fullName: string; role: string; email: string } | null;
  authenticatedUser: { id: string; email: string; fullName: string } | null;
  userType: 'PLATFORM' | 'COMPANY_EMPLOYEE' | 'BOTH' | 'UNASSIGNED';
  memberships: UserCompanyMembership[];
  activeMembership: UserCompanyMembership | null;
  companyMembership: UserCompanyMembership | null;
  isPlatformAdmin: boolean;
  isPlatformCollaborator: boolean;
  employeeRole: string | null;
  employeePermissions: EmployeePermission[];
  tenantStatus: TenantStatus | null;
  subscription: TenantSubscription | null;
  enabledModules: Record<string, boolean>;
  moduleEntitlements: Record<string, boolean>;
  enabledFeatures: Record<string, boolean>;
  featureEntitlements: Record<string, boolean>;
  permissions: EmployeePermission[];
  loading: boolean;
  error: string | null;
}

export type AuthorizedOperationalContext = TenantContextData;

/**
 * Application Helper: Resolves and returns the single coherent read model for authorized operational context.
 */
export function resolveAuthorizedOperationalContext(
  context: TenantContextData
): AuthorizedOperationalContext {
  return context;
}

export interface CompanySwitchResult {
  allowed: boolean;
  targetCompanyId?: string;
  error?: string;
}

export interface BranchSwitchResult {
  allowed: boolean;
  targetBranchId?: string;
  error?: string;
}

const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_BRANCH_ID = 'branch-sohar';

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
  preferredBranchId?: string | null;
  userRole?: string | null;
  customPermissions?: EmployeePermission[];
  isPlatformAdmin?: boolean;
  isPlatformCollaborator?: boolean;
  fetchedCompanies?: AuthorizedCompany[];
  fetchedBranches?: AuthorizedBranch[];
  fetchedEmployee?: { id: string; fullName: string; role: string; email: string } | null;
  fetchedMemberships?: UserCompanyMembership[];
  fetchedTenant?: Tenant | null;
  fetchedSubscription?: TenantSubscription | null;
  fetchedModules?: Record<string, boolean>;
  fetchedFeatures?: Record<string, boolean>;
}): TenantContextData {
  const {
    userId,
    preferredCompanyId,
    preferredBranchId,
    userRole,
    customPermissions,
    isPlatformAdmin = false,
    isPlatformCollaborator = false,
    fetchedCompanies = [],
    fetchedBranches = [],
    fetchedEmployee = null,
    fetchedMemberships = [],
    fetchedTenant = null,
    fetchedSubscription = null,
    fetchedModules = {},
    fetchedFeatures = {}
  } = params;

  const defaultCompany = preferredCompanyId || DEFAULT_COMPANY_ID;

  // Default fallback branch
  const fallbackBranches: AuthorizedBranch[] = fetchedBranches.length > 0 ? fetchedBranches : [
    {
      id: DEFAULT_BRANCH_ID,
      code: 'BR-SOH-01',
      name: 'فرع صحار الرئيسي',
      nameEn: 'Sohar Main Branch',
      isMain: true,
      status: 'ACTIVE',
      companyId: defaultCompany
    }
  ];

  // Default fallback companies
  const fallbackCompanies: AuthorizedCompany[] = fetchedCompanies.length > 0 ? fetchedCompanies : [
    {
      id: defaultCompany,
      nameAr: 'مؤسسة ديشال ERP',
      nameEn: 'Deshal Enterprise ERP'
    }
  ];

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

    const activeCompany = fallbackCompanies.find(c => c.id === defaultCompany) || fallbackCompanies[0] || null;
    const fallbackActiveBranch = fallbackBranches.find(b => b.id === preferredBranchId) || fallbackBranches[0] || null;

    return {
      tenantId: `tnt_${defaultCompany}`,
      companyId: defaultCompany,
      activeCompanyId: defaultCompany,
      activeCompany,
      authorizedCompanies: fallbackCompanies,
      authorizedBranches: fallbackBranches,
      activeBranchId: fallbackActiveBranch ? fallbackActiveBranch.id : DEFAULT_BRANCH_ID,
      activeBranch: fallbackActiveBranch,
      activeEmployee: fetchedEmployee || {
        id: 'emp_admin',
        fullName: 'مدير النظام',
        role: userRole || 'ADMIN',
        email: 'admin@deshalbm.com'
      },
      authenticatedUser: null,
      userType: 'COMPANY_EMPLOYEE',
      memberships: [defaultMembership],
      activeMembership: defaultMembership,
      companyMembership: defaultMembership,
      isPlatformAdmin: false,
      isPlatformCollaborator: false,
      employeeRole: userRole || 'ADMIN',
      employeePermissions: permissions,
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
      moduleEntitlements: {
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
      featureEntitlements: {},
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
      activeCompany: null,
      authorizedCompanies: [],
      authorizedBranches: [],
      activeBranchId: null,
      activeBranch: null,
      activeEmployee: null,
      authenticatedUser: userId ? { id: userId, email: 'user@deshalbm.com', fullName: 'مستخدم النظام' } : null,
      userType: isPlatformAdmin ? 'PLATFORM' : 'UNASSIGNED',
      memberships: [],
      activeMembership: null,
      companyMembership: null,
      isPlatformAdmin,
      isPlatformCollaborator,
      employeeRole: null,
      employeePermissions: [],
      tenantStatus: null,
      subscription: null,
      enabledModules: {},
      moduleEntitlements: {},
      enabledFeatures: {},
      featureEntitlements: {},
      permissions: [],
      loading: false,
      error: 'No active company membership found for user.'
    };
  }

  const activeBranch = fallbackBranches.find(b => b.id === preferredBranchId) || fallbackBranches[0] || null;
  const activeCompany = fallbackCompanies.find(c => c.id === activeCompanyId) || fallbackCompanies[0] || null;
  const tenantStatus: TenantStatus = fetchedTenant ? fetchedTenant.status : 'ACTIVE';

  if (['PENDING', 'PROVISIONING', 'READY', 'SUSPENDED', 'FAILED', 'ARCHIVED'].includes(tenantStatus)) {
    return {
      tenantId: fetchedTenant?.id || null,
      companyId: activeCompanyId,
      activeCompanyId,
      activeCompany,
      authorizedCompanies: fallbackCompanies,
      authorizedBranches: fallbackBranches,
      activeBranchId: activeBranch ? activeBranch.id : null,
      activeBranch,
      activeEmployee: fetchedEmployee,
      authenticatedUser: userId ? { id: userId, email: fetchedEmployee?.email || 'user@deshalbm.com', fullName: fetchedEmployee?.fullName || 'مستخدم النظام' } : null,
      userType: isPlatformAdmin ? (fetchedMemberships.length > 0 ? 'BOTH' : 'PLATFORM') : 'COMPANY_EMPLOYEE',
      memberships: fetchedMemberships,
      activeMembership,
      companyMembership: activeMembership,
      isPlatformAdmin,
      isPlatformCollaborator,
      employeeRole: activeMembership?.roleId || null,
      employeePermissions: [],
      tenantStatus,
      subscription: null,
      enabledModules: {},
      moduleEntitlements: {},
      enabledFeatures: {},
      featureEntitlements: {},
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

  const modules = Object.keys(fetchedModules).length > 0 ? fetchedModules : {
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
  };

  return {
    tenantId: fetchedTenant?.id || `tnt_${activeCompanyId}`,
    companyId: activeCompanyId,
    activeCompanyId,
    activeCompany,
    authorizedCompanies: fallbackCompanies,
    authorizedBranches: fallbackBranches,
    activeBranchId: activeBranch ? activeBranch.id : null,
    activeBranch,
    activeEmployee: fetchedEmployee,
    authenticatedUser: userId ? { id: userId, email: fetchedEmployee?.email || 'user@deshalbm.com', fullName: fetchedEmployee?.fullName || 'مستخدم النظام' } : null,
    userType: isPlatformAdmin ? (fetchedMemberships.length > 0 ? 'BOTH' : 'PLATFORM') : 'COMPANY_EMPLOYEE',
    memberships: fetchedMemberships,
    activeMembership,
    companyMembership: activeMembership,
    isPlatformAdmin,
    isPlatformCollaborator,
    employeeRole: effectiveRole,
    employeePermissions: permissions,
    tenantStatus,
    subscription: fetchedSubscription || {
      id: `sub_${activeCompanyId}`,
      companyId: activeCompanyId,
      planType: (fetchedTenant?.subscriptionPlan as any) || 'ENTERPRISE',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString()
    },
    enabledModules: modules,
    moduleEntitlements: modules,
    enabledFeatures: fetchedFeatures,
    featureEntitlements: fetchedFeatures,
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

/**
 * Validates whether a user can switch to a target branch within the active company.
 */
export function validateBranchSwitch(params: {
  activeCompanyId: string | null;
  targetBranchId: string;
  authorizedBranches: AuthorizedBranch[];
}): BranchSwitchResult {
  const { activeCompanyId, targetBranchId, authorizedBranches } = params;

  if (!targetBranchId) {
    return { allowed: false, error: 'Target branch ID is required.' };
  }

  if (!activeCompanyId) {
    return { allowed: false, error: 'No active company context.' };
  }

  const branchMatch = authorizedBranches.find(b => b.id === targetBranchId);
  if (!branchMatch) {
    return {
      allowed: false,
      error: 'Security Rejection: Branch does not belong to active company or user is unauthorized.'
    };
  }

  if (branchMatch.companyId && branchMatch.companyId !== activeCompanyId) {
    return {
      allowed: false,
      error: 'Security Rejection: Target branch belongs to a different company context.'
    };
  }

  return { allowed: true, targetBranchId };
}

export interface OperationalAccessCheckParams {
  context: TenantContextData;
  moduleCode?: string;
  featureCode?: string;
  requiredPermission?: EmployeePermission;
  targetCompanyId?: string;
  targetBranchId?: string;
  employeeStatus?: string;
}

export interface OperationalAccessCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Pure application use case: Evaluates full 9-stage authorization chain:
 * Auth -> Classification -> Lifecycle -> Company -> Branch -> Module -> Feature -> Employee Status -> RBAC
 */
export function validateOperationalAccess(params: OperationalAccessCheckParams): OperationalAccessCheckResult {
  const {
    context,
    moduleCode,
    featureCode,
    requiredPermission,
    targetCompanyId,
    targetBranchId,
    employeeStatus
  } = params;

  // 1. Authenticated User / Session Check
  if (!context || (!context.authenticatedUser && !context.companyId)) {
    return { allowed: false, reason: "Security Rejection: Unauthenticated or missing session context." };
  }

  // 2. Tenant Lifecycle Status = ACTIVE
  if (context.tenantStatus && context.tenantStatus !== "ACTIVE") {
    return {
      allowed: false,
      reason: `Security Rejection: Operational context restricted due to tenant lifecycle status '${context.tenantStatus}'.`
    };
  }

  // 3. Authorized Company Membership
  const activeCompanyId = targetCompanyId || context.activeCompanyId;
  if (!activeCompanyId) {
    return { allowed: false, reason: "Security Rejection: No active company context selected." };
  }

  const isCompanyAuthorized = context.isPlatformAdmin || context.memberships.some(m => m.companyId === activeCompanyId && m.isActive);
  if (!isCompanyAuthorized) {
    return { allowed: false, reason: "Security Rejection: User does not hold active membership in target company." };
  }

  // 4. Authorized Branch Scope
  if (targetBranchId) {
    const isBranchAuthorized = context.isPlatformAdmin || context.authorizedBranches.some(b => b.id === targetBranchId);
    if (!isBranchAuthorized) {
      return { allowed: false, reason: "Security Rejection: Target branch does not belong to active company or user is unauthorized." };
    }
  }

  // 5. Tenant Module Entitlement
  if (moduleCode && context.enabledModules && context.enabledModules[moduleCode] === false) {
    return { allowed: false, reason: `Security Rejection: Module '${moduleCode}' is disabled for active tenant.` };
  }

  // 6. Tenant Feature Entitlement
  if (featureCode && context.enabledFeatures && context.enabledFeatures[featureCode] === false) {
    return { allowed: false, reason: `Security Rejection: Feature '${featureCode}' is disabled for active tenant.` };
  }

  // 7. Employee Active Status (for employee operations)
  if (employeeStatus && employeeStatus !== "ACTIVE") {
    return { allowed: false, reason: "Security Rejection: Inactive employee cannot perform operational actions." };
  }

  // 8. RBAC Permission
  if (requiredPermission && (!context.employeePermissions || !context.employeePermissions.includes(requiredPermission))) {
    return { allowed: false, reason: `Security Rejection: Missing required RBAC permission '${requiredPermission}'.` };
  }

  return { allowed: true };
}
