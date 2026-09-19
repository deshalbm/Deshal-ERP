/**
 * Unified User Management Application Service — Deshal ERP
 * 
 * Clean Architecture Application Layer: Orchestrates Unified User management use cases,
 * user directory queries, company membership assignments, branch authorization scopes,
 * unassigned profile activations, and safe operational membership removals.
 * 
 * ZERO Supabase imports, ZERO Browser Storage globals, ZERO React dependencies.
 */

import { UnifiedUserPort } from '../ports/unifiedUserPort';
import { defaultUnifiedUserAdapter } from '../../lib/adapters/unifiedUserAdapter';
import {
  UnifiedUser,
  UnifiedCompanyMembership,
  UnifiedEmployeeSummary,
  UserType,
  validateMembershipAssignment,
  validateMembershipRemoval,
  canAssignToCompany,
  canAssignToBranch,
  canActivateUnassignedProfile,
  hasBranchAccess,
  isUnassignedProfile,
  validateBranchScopeAssignment
} from '../../domain/user/unifiedUserDomain';

export interface UnifiedUserFilterParams {
  searchTerm?: string;
  userTypeFilter?: 'ALL' | 'PLATFORM' | 'COMPANY_EMPLOYEE' | 'UNASSIGNED' | 'BOTH';
  companyFilter?: string;
  branchFilter?: string;
  statusFilter?: string;
  roleFilter?: string;
}

/**
 * Application Use Case: Fetch all unified user identities across the platform.
 */
export async function fetchUnifiedUsers(
  activeCompanyId?: string | null,
  port: UnifiedUserPort = defaultUnifiedUserAdapter
): Promise<UnifiedUser[]> {
  if (!port) return [];
  return await port.fetchUnifiedUsers(activeCompanyId);
}

/**
 * Application Use Case Alias: Load unified user directory.
 */
export async function loadUnifiedUsers(
  activeCompanyId?: string | null,
  port: UnifiedUserPort = defaultUnifiedUserAdapter
): Promise<UnifiedUser[]> {
  return await fetchUnifiedUsers(activeCompanyId, port);
}

/**
 * Application Use Case: Resolve a single unified user identity by user ID (profiles.id).
 */
export async function getUnifiedUser(
  userId: string,
  port: UnifiedUserPort = defaultUnifiedUserAdapter
): Promise<UnifiedUser | null> {
  if (!userId || !userId.trim() || !port) return null;
  if (port.getUnifiedUser) {
    return await port.getUnifiedUser(userId.trim());
  }
  const users = await port.fetchUnifiedUsers();
  return users.find((u) => u.id === userId.trim()) || null;
}

/**
 * Application Use Case: List all unified users holding active memberships in a company.
 */
export async function getUnifiedUsersByCompany(
  companyId: string,
  port: UnifiedUserPort = defaultUnifiedUserAdapter
): Promise<UnifiedUser[]> {
  if (!companyId || !companyId.trim() || !port) return [];
  if (port.getUnifiedUsersByCompany) {
    return await port.getUnifiedUsersByCompany(companyId.trim());
  }
  const users = await port.fetchUnifiedUsers();
  return users.filter((u) =>
    u.memberships.some((m) => m && m.companyId === companyId.trim() && m.isActive !== false)
  );
}

/**
 * Application Use Case: List all users authorized for a specific branch under a company.
 */
export async function getUnifiedUsersByBranch(
  companyId: string,
  branchId: string,
  port: UnifiedUserPort = defaultUnifiedUserAdapter
): Promise<UnifiedUser[]> {
  if (!companyId || !companyId.trim() || !branchId || !branchId.trim() || !port) return [];
  if (port.getUnifiedUsersByBranch) {
    return await port.getUnifiedUsersByBranch(companyId.trim(), branchId.trim());
  }
  const users = await port.fetchUnifiedUsers();
  return users.filter((u) => hasBranchAccess(u, companyId.trim(), branchId.trim()));
}

/**
 * Application Use Case: List all unassigned user profiles (no active company memberships, no platform admin status).
 */
export async function getUnassignedProfiles(
  port: UnifiedUserPort = defaultUnifiedUserAdapter
): Promise<UnifiedUser[]> {
  if (!port) return [];
  if (port.getUnassignedProfiles) {
    return await port.getUnassignedProfiles();
  }
  const users = await port.fetchUnifiedUsers();
  return users.filter((u) => isUnassignedProfile(u));
}

/**
 * Application Use Case: Retrieve company memberships assigned to a user identity.
 */
export async function getCompanyMemberships(
  userId: string,
  port: UnifiedUserPort = defaultUnifiedUserAdapter
): Promise<UnifiedCompanyMembership[]> {
  if (!userId || !userId.trim() || !port) return [];
  if (port.getCompanyMemberships) {
    return await port.getCompanyMemberships(userId.trim());
  }
  const user = await getUnifiedUser(userId, port);
  return user ? user.memberships : [];
}

/**
 * Application Use Case: Retrieve employee association summary for a user identity.
 */
export async function getEmployeeAssociation(
  userId: string,
  port: UnifiedUserPort = defaultUnifiedUserAdapter
): Promise<UnifiedEmployeeSummary | null> {
  if (!userId || !userId.trim() || !port) return null;
  if (port.getEmployeeAssociation) {
    return await port.getEmployeeAssociation(userId.trim());
  }
  const user = await getUnifiedUser(userId, port);
  return user ? user.employeeSummary || null : null;
}

/**
 * Application Use Case: Assign company membership and branch scopes to a user identity.
 */
export async function assignUserCompanyMembership(
  params: {
    userId: string;
    companyId: string;
    roleId: string;
    allowedBranchIds?: string[];
    companyBranches?: Array<{ id: string; companyId: string }>;
  },
  port: UnifiedUserPort = defaultUnifiedUserAdapter
): Promise<{ success: boolean; error?: string }> {
  // 1. Domain payload validation
  const validation = validateMembershipAssignment(params);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(" | ") };
  }

  if (!port) {
    return { success: false, error: "UnifiedUserPort adapter is missing." };
  }

  // 2. Load target user profile
  const user = await getUnifiedUser(params.userId, port);

  // 3. Domain policy check: Duplicate active membership rejection
  if (user) {
    const duplicateCheck = canAssignToCompany(user, params.companyId);
    if (!duplicateCheck.canAssign) {
      return { success: false, error: duplicateCheck.reason || "Duplicate active company membership rejected." };
    }
  }

  // 4. Domain policy check: Branch scope validation
  if (params.allowedBranchIds && params.allowedBranchIds.length > 0) {
    const branchValidation = validateBranchScopeAssignment({
      companyId: params.companyId,
      allowedBranchIds: params.allowedBranchIds,
      companyBranches: params.companyBranches || []
    });
    if (!branchValidation.valid) {
      return { success: false, error: branchValidation.errors.join(" | ") };
    }
  }

  // 5. Execute via repository port
  return await port.assignCompanyMembership({
    userId: params.userId,
    companyId: params.companyId,
    roleId: params.roleId,
    allowedBranchIds: params.allowedBranchIds
  });
}

/**
 * Application Use Case: Activate an unassigned profile and assign it to a company.
 */
export async function activateUnassignedProfile(
  params: {
    userId: string;
    companyId: string;
    roleId: string;
    allowedBranchIds?: string[];
    companyBranches?: Array<{ id: string; companyId: string }>;
  },
  port: UnifiedUserPort = defaultUnifiedUserAdapter
): Promise<{ success: boolean; error?: string }> {
  const validation = validateMembershipAssignment(params);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(" | ") };
  }

  if (!port) {
    return { success: false, error: "UnifiedUserPort adapter is missing." };
  }

  // Load user profile
  const user = await getUnifiedUser(params.userId, port);
  if (!user) {
    return { success: false, error: "User profile identity not found." };
  }

  // Domain policy check: Unassigned profile activation validation
  const activationCheck = canActivateUnassignedProfile(user, params.companyId);
  if (!activationCheck.canActivate) {
    return { success: false, error: activationCheck.reason || "Unassigned profile activation rejected." };
  }

  // Assign membership via application service helper
  return await assignUserCompanyMembership(params, port);
}

/**
 * Application Use Case: Remove or deactivate operational company membership for a user identity.
 * Safety: Revokes company operational access without deleting profiles, employees, or business records.
 */
export function removeUserCompanyMembership(
  userId: string,
  companyId: string,
  port: UnifiedUserPort = defaultUnifiedUserAdapter
): Promise<{ success: boolean; error?: string }> {
  const validation = validateMembershipRemoval({ userId, companyId });
  if (!validation.valid) {
    return Promise.resolve({ success: false, error: validation.errors.join(" | ") });
  }

  if (!port) {
    return Promise.resolve({ success: false, error: "UnifiedUserPort adapter is missing." });
  }

  return port.removeCompanyMembership(userId.trim(), companyId.trim());
}

/**
 * Application Use Case: Pure filter and search for unified user directory.
 */
export function filterUnifiedUsers(
  users: UnifiedUser[],
  params: UnifiedUserFilterParams
): UnifiedUser[] {
  const {
    searchTerm = '',
    userTypeFilter = 'ALL',
    companyFilter = 'ALL',
    branchFilter = 'ALL',
    statusFilter = 'ALL',
    roleFilter = 'ALL'
  } = params;

  const term = searchTerm.toLowerCase().trim();

  return users.filter((u) => {
    // 1. Search term (Name, Email, Civil ID, Phone, Role)
    const matchesSearch =
      !term ||
      u.fullName.toLowerCase().includes(term) ||
      (u.fullNameEn && u.fullNameEn.toLowerCase().includes(term)) ||
      u.email.toLowerCase().includes(term) ||
      (u.civilId && u.civilId.includes(term)) ||
      (u.phone && u.phone.includes(term)) ||
      (u.primaryRole && u.primaryRole.toLowerCase().includes(term));

    // 2. User Type filter
    let matchesUserType = true;
    if (userTypeFilter === 'PLATFORM') {
      matchesUserType = u.userType === 'PLATFORM' || u.userType === 'BOTH';
    } else if (userTypeFilter === 'COMPANY_EMPLOYEE') {
      matchesUserType = u.userType === 'COMPANY_EMPLOYEE' || u.userType === 'BOTH';
    } else if (userTypeFilter === 'UNASSIGNED') {
      matchesUserType = u.userType === 'UNASSIGNED';
    } else if (userTypeFilter === 'BOTH') {
      matchesUserType = u.userType === 'BOTH';
    }

    // 3. Company filter
    const matchesCompany =
      companyFilter === 'ALL' ||
      u.memberships.some((m) => m && m.companyId === companyFilter && m.isActive !== false);

    // 4. Branch filter
    const matchesBranch =
      branchFilter === 'ALL' ||
      u.memberships.some(
        (m) =>
          m &&
          m.isActive !== false &&
          (!m.allowedBranchIds ||
            m.allowedBranchIds.length === 0 ||
            m.allowedBranchIds.includes(branchFilter))
      );

    // 5. Status filter
    const matchesStatus =
      statusFilter === 'ALL' || u.status === statusFilter;

    // 6. Role filter
    const matchesRole =
      roleFilter === 'ALL' ||
      u.primaryRole === roleFilter ||
      u.memberships.some((m) => m && m.roleId === roleFilter);

    return (
      matchesSearch &&
      matchesUserType &&
      matchesCompany &&
      matchesBranch &&
      matchesStatus &&
      matchesRole
    );
  });
}

/**
 * Application Use Case: Resolves complete administrative access picture for a user identity.
 */
export function resolveUserAccessDetails(user: UnifiedUser) {
  return {
    identity: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      civilId: user.civilId,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt
    },
    platformClassification: {
      userType: user.userType,
      isPlatformAdmin: user.isPlatformAdmin,
      platformRole: user.platformRole
    },
    companies: user.memberships.map((m) => ({
      companyId: m.companyId,
      companyNameAr: m.companyNameAr,
      companyNameEn: m.companyNameEn,
      roleId: m.roleId,
      isActive: m.isActive,
      allowedBranchIds: m.allowedBranchIds
    })),
    branchScopes: user.memberships.map((m) => ({
      companyId: m.companyId,
      scopeType: !m.allowedBranchIds || m.allowedBranchIds.length === 0 ? ('ALL_BRANCHES' as const) : ('SELECTED_BRANCHES' as const),
      allowedBranchIds: m.allowedBranchIds || [],
      allowedBranchNames: m.allowedBranchNames || []
    })),
    employeeRecord: {
      primaryEmployeeId: user.primaryEmployeeId,
      primaryRole: user.primaryRole,
      primaryDepartment: user.primaryDepartment
    }
  };
}
