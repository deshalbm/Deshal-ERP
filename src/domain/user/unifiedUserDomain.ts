/**
 * Unified User Domain Entities, Types & Pure Security Policies — Deshal ERP
 * 
 * Clean Architecture Domain Layer: Core domain entities and pure security policies
 * for unified user management across profiles, platform privileges, company memberships,
 * branch authorization scopes, and employee HR associations.
 * 
 * ZERO Supabase imports, ZERO React imports, ZERO Browser Storage globals, ZERO external network calls.
 */

export type UnifiedUserClassification =
  | "PLATFORM_USER"
  | "COMPANY_STAFF"
  | "UNASSIGNED_PROFILE"
  | "PLATFORM_AND_STAFF";

// Backward-compatibility classification types
export type UserType = "PLATFORM" | "COMPANY_EMPLOYEE" | "UNASSIGNED" | "BOTH";
export type PlatformRoleType = "PLATFORM_ADMIN" | "PLATFORM_COLLABORATOR" | "PLATFORM_AUDITOR" | null;

export interface UnifiedPlatformAccess {
  isPlatformAdmin: boolean;
  grantedAt?: string;
  grantedBy?: string | null;
}

export interface UnifiedCompanyMembership {
  membershipId?: string;
  companyId: string;
  companyName?: string;
  companyNameAr?: string;
  companyNameEn?: string;
  roleId?: string;
  roleCode?: string;
  roleNameAr?: string;
  roleNameEn?: string;
  allowedBranchIds?: string[]; // Restricted branch scope list. Undefined or empty array means unrestricted company branch access.
  allowedBranchNames?: string[];
  isActive?: boolean;
  createdAt?: string;
}

// Backward-compatibility type alias
export type CompanyMembershipScope = UnifiedCompanyMembership;

export interface UnifiedEmployeeSummary {
  employeeId: string;
  employeeCode: string;
  companyId: string;
  primaryBranchId?: string | null;
  departmentId?: string | null;
  jobTitle?: string | null;
  employmentStatus: "ACTIVE" | "INACTIVE" | "TERMINATED" | "ON_LEAVE" | "PROBATION";
}

export interface BranchAuthorizationScope {
  companyId: string;
  isRestricted: boolean;
  allowedBranchIds: string[];
}

export interface UnifiedUser {
  id: string; // References profiles.id / auth.users.id
  email: string;
  fullName: string;
  fullNameEn?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  civilId?: string | null;
  status?: "ACTIVE" | "INACTIVE" | string;
  isActive?: boolean;
  companyId?: string | null; // Profile default / legacy company binding
  companyName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  isPlatformAdmin?: boolean; // Backward-compatibility property
  platformRole?: PlatformRoleType; // Backward-compatibility property
  primaryRole?: string | null;
  primaryEmployeeId?: string | null;
  primaryDepartment?: string | null;
  hasEmployeeRecord?: boolean;
  platformAccess?: UnifiedPlatformAccess;
  memberships: UnifiedCompanyMembership[];
  employeeSummary?: UnifiedEmployeeSummary | null;
  classification?: UnifiedUserClassification;
  userType?: UserType; // Backward-compatibility property
  createdAt: string;
  updatedAt?: string;
}

/**
 * Pure Domain Policy: Classifies a UnifiedUser based on platform admin status and active company memberships.
 */
export function classifyUnifiedUser(params: {
  isPlatformAdmin: boolean;
  memberships: Array<{ companyId: string; isActive?: boolean }>;
}): UnifiedUserClassification {
  const hasActiveMembership = params.memberships.some(
    (m) => m && m.isActive !== false && Boolean(m.companyId && m.companyId.trim())
  );

  if (params.isPlatformAdmin && hasActiveMembership) {
    return "PLATFORM_AND_STAFF";
  }

  if (params.isPlatformAdmin && !hasActiveMembership) {
    return "PLATFORM_USER";
  }

  if (!params.isPlatformAdmin && hasActiveMembership) {
    return "COMPANY_STAFF";
  }

  return "UNASSIGNED_PROFILE";
}

/**
 * Backward-compatibility function for UserType classification.
 */
export function classifyUserType(user: {
  isPlatformAdmin?: boolean;
  platformRole?: string | null;
  memberships?: Array<{ companyId: string; isActive?: boolean; companyNameAr?: string; [key: string]: any }>;
  hasEmployeeRecord?: boolean;
}): UserType {
  const isPlatform = Boolean(
    user &&
      (user.isPlatformAdmin ||
        user.platformRole === "PLATFORM_ADMIN" ||
        user.platformRole === "PLATFORM_COLLABORATOR" ||
        user.platformRole === "PLATFORM_AUDITOR")
  );
  const hasActive = Boolean(
    user &&
      user.memberships &&
      user.memberships.some((m) => m && m.isActive !== false && Boolean(m.companyId))
  );

  if (isPlatform && hasActive) return "BOTH";
  if (isPlatform && !hasActive) return "PLATFORM";
  if (!isPlatform && hasActive) return "COMPANY_EMPLOYEE";
  return "UNASSIGNED";
}


/**
 * Helper predicate: Checks if user holds platform-level administrative status.
 */
export function isPlatformUser(
  userOrClassification: UnifiedUser | UnifiedUserClassification | UserType
): boolean {
  if (typeof userOrClassification === "string") {
    return (
      userOrClassification === "PLATFORM_USER" ||
      userOrClassification === "PLATFORM_AND_STAFF" ||
      userOrClassification === "PLATFORM" ||
      userOrClassification === "BOTH"
    );
  }
  return Boolean(
    (userOrClassification && userOrClassification.isPlatformAdmin) ||
      (userOrClassification &&
        userOrClassification.platformAccess &&
        userOrClassification.platformAccess.isPlatformAdmin)
  );
}

/**
 * Helper predicate: Checks if user holds active operational company staff membership.
 */
export function isCompanyStaff(
  userOrClassification: UnifiedUser | UnifiedUserClassification | UserType
): boolean {
  if (typeof userOrClassification === "string") {
    return (
      userOrClassification === "COMPANY_STAFF" ||
      userOrClassification === "PLATFORM_AND_STAFF" ||
      userOrClassification === "COMPANY_EMPLOYEE" ||
      userOrClassification === "BOTH"
    );
  }
  return (
    userOrClassification.classification === "COMPANY_STAFF" ||
    userOrClassification.classification === "PLATFORM_AND_STAFF" ||
    userOrClassification.userType === "COMPANY_EMPLOYEE" ||
    userOrClassification.userType === "BOTH"
  );
}

/**
 * Helper predicate: Checks if user profile is unassigned (no active company memberships, not a platform admin).
 */
export function isUnassignedProfile(
  userOrClassification: UnifiedUser | UnifiedUserClassification | UserType
): boolean {
  if (typeof userOrClassification === "string") {
    return (
      userOrClassification === "UNASSIGNED_PROFILE" ||
      userOrClassification === "UNASSIGNED"
    );
  }
  return (
    userOrClassification.classification === "UNASSIGNED_PROFILE" ||
    userOrClassification.userType === "UNASSIGNED"
  );
}

/**
 * Security Domain Policy: Evaluates whether a user has authorized operational access to a specific company.
 * Strict Rule: user_company_memberships is the ONLY authoritative company-access boundary.
 * Platform Admin status alone does NOT grant operational ERP data access without an active membership.
 * Legacy profiles.company_id alone does NOT grant access without an active membership.
 */
export function hasCompanyAccess(user: UnifiedUser, companyId: string): boolean {
  if (!user || !companyId || !companyId.trim()) {
    return false;
  }

  return Boolean(
    user.memberships &&
      user.memberships.some(
        (m) =>
          m &&
          m.companyId &&
          m.companyId.trim() === companyId.trim() &&
          m.isActive !== false
      )
  );
}

/**
 * Backward-compatibility function for company access evaluation.
 */
export function isAuthorizedForCompany(user: UnifiedUser, companyId: string): boolean {
  return hasCompanyAccess(user, companyId);
}

/**
 * Security Domain Policy: Evaluates whether a user has authorized access to a specific branch within a company.
 * Strict Rules:
 * 1. User must have an active company membership for the target company.
 * 2. If target branch's companyId is provided, it MUST match the companyId.
 * 3. If membership specifies a restricted allowedBranchIds array (non-empty), target branch MUST be in the list.
 * 4. If membership allowedBranchIds is empty or undefined, access to any branch belonging to that company is granted.
 */
export function hasBranchAccess(
  user: UnifiedUser,
  companyId: string,
  branchId: string,
  branchCompanyId?: string
): boolean {
  if (!user || !companyId || !companyId.trim() || !branchId || !branchId.trim()) {
    return false;
  }

  // Cross-company branch rejection: branch MUST belong to target company
  if (branchCompanyId && branchCompanyId.trim() !== companyId.trim()) {
    return false;
  }

  // User MUST have active membership in companyId
  const activeMembership = user.memberships && user.memberships.find(
    (m) => m && m.companyId && m.companyId.trim() === companyId.trim() && m.isActive !== false
  );

  if (!activeMembership) {
    return false;
  }

  // Check branch scope constraint
  const allowed = activeMembership.allowedBranchIds;
  if (allowed && Array.isArray(allowed) && allowed.length > 0) {
    return allowed.includes(branchId.trim());
  }

  return true;
}

/**
 * Backward-compatibility function for branch access evaluation.
 */
export function isAuthorizedForBranch(
  userOrScopeOrParams:
    | UnifiedUser
    | { allowedBranchIds?: string[]; memberships?: UnifiedCompanyMembership[] }
    | {
        user: UnifiedUser;
        companyId: string;
        targetBranchId: string;
        companyBranches?: Array<{ id: string; companyId: string }>;
      },
  companyId?: string,
  branchId?: string,
  branchCompanyId?: string
): boolean {
  if (!userOrScopeOrParams) return false;

  // Case A: Object params { user, companyId, targetBranchId, companyBranches }
  if ('user' in userOrScopeOrParams && 'companyId' in userOrScopeOrParams && 'targetBranchId' in userOrScopeOrParams) {
    const { user, companyId: cId, targetBranchId, companyBranches } = userOrScopeOrParams;
    let bCompanyId = branchCompanyId;
    if (companyBranches && Array.isArray(companyBranches)) {
      const match = companyBranches.find((b) => b && b.id === targetBranchId);
      if (match) {
        bCompanyId = match.companyId;
      }
    }
    return hasBranchAccess(user, cId, targetBranchId, bCompanyId);
  }

  // Case B: Standard UnifiedUser call with companyId and branchId
  if ('memberships' in userOrScopeOrParams && userOrScopeOrParams.memberships && companyId && branchId) {
    return hasBranchAccess(userOrScopeOrParams as UnifiedUser, companyId, branchId, branchCompanyId);
  }

  // Case C: Legacy single scope check { allowedBranchIds }
  if ('allowedBranchIds' in userOrScopeOrParams) {
    const allowed = (userOrScopeOrParams as any).allowedBranchIds;
    const target = branchId || companyId || '';
    if (allowed && Array.isArray(allowed) && allowed.length > 0) {
      return allowed.includes(target.trim());
    }
    return true;
  }

  return false;
}

/**
 * Backward-compatibility function for validating branch scope assignment.
 */
export function validateBranchScopeAssignment(params: {
  companyId: string;
  allowedBranchIds?: string[];
  companyBranches?: Array<{ id: string; companyId: string }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!params || !params.companyId || !params.companyId.trim()) {
    errors.push("Company ID is required.");
  }
  if (params && params.allowedBranchIds && Array.isArray(params.allowedBranchIds) && params.allowedBranchIds.length > 0) {
    const companyBranches = params.companyBranches || [];
    if (companyBranches.length > 0) {
      for (const bId of params.allowedBranchIds) {
        const matched = companyBranches.find((b) => b && b.id === bId);
        if (!matched || matched.companyId !== params.companyId) {
          errors.push(`Cross-company branch assignment rejected: branch '${bId}' does not belong to company '${params.companyId}'.`);
        }
      }
    }
  }
  return { valid: errors.length === 0, errors };
}


/**
 * Domain Assignment Policy: Validates whether a user can be assigned a new membership in a target company.
 * Prevents duplicate active memberships for the same company.
 */
export function canAssignToCompany(
  user: UnifiedUser,
  targetCompanyId: string
): { canAssign: boolean; reason?: string } {
  if (!user || !user.id || !user.id.trim()) {
    return { canAssign: false, reason: "Valid user profile identity is required." };
  }

  if (!targetCompanyId || !targetCompanyId.trim()) {
    return { canAssign: false, reason: "Target company ID is required." };
  }

  const existingActive = user.memberships && user.memberships.find(
    (m) => m && m.companyId && m.companyId.trim() === targetCompanyId.trim() && m.isActive !== false
  );

  if (existingActive) {
    return {
      canAssign: false,
      reason: `User already holds an active membership for company '${targetCompanyId}'.`
    };
  }

  return { canAssign: true };
}

/**
 * Domain Assignment Policy: Validates whether a user can be assigned to a specific branch under a company.
 * Requires an active company membership, company-branch ownership match, and allowed branch scope compatibility.
 */
export function canAssignToBranch(
  user: UnifiedUser,
  companyId: string,
  targetBranchId: string,
  targetBranchCompanyId: string
): { canAssign: boolean; reason?: string } {
  if (!user || !user.id || !user.id.trim()) {
    return { canAssign: false, reason: "Valid user profile identity is required." };
  }

  if (!companyId || !companyId.trim()) {
    return { canAssign: false, reason: "Company ID is required." };
  }

  if (!targetBranchId || !targetBranchId.trim()) {
    return { canAssign: false, reason: "Target branch ID is required." };
  }

  if (targetBranchCompanyId.trim() !== companyId.trim()) {
    return {
      canAssign: false,
      reason: "Target branch does not belong to the target company."
    };
  }

  if (!hasCompanyAccess(user, companyId)) {
    return {
      canAssign: false,
      reason: "User has no active membership for the target company."
    };
  }

  return { canAssign: true };
}

/**
 * Domain Assignment Policy: Validates whether an unassigned profile can be activated and assigned to a company.
 * Requires existing profile identity and verifies user has zero active company memberships.
 */
export function canActivateUnassignedProfile(
  user: UnifiedUser,
  targetCompanyId: string
): { canActivate: boolean; reason?: string } {
  if (!user || !user.id || !user.id.trim()) {
    return { canActivate: false, reason: "Valid profile identity is required for activation." };
  }

  if (!targetCompanyId || !targetCompanyId.trim()) {
    return { canActivate: false, reason: "Target company ID is required for activation." };
  }

  const activeMemberships = user.memberships ? user.memberships.filter((m) => m && m.isActive !== false) : [];
  if (activeMemberships.length > 0) {
    return {
      canActivate: false,
      reason: "User profile already holds active company memberships and is not unassigned."
    };
  }

  return { canActivate: true };
}

/**
 * Backward-compatibility function for validating membership assignment parameters.
 */
export function validateMembershipAssignment(params: {
  userId?: string;
  companyId?: string;
  roleId?: string;
  allowedBranchIds?: string[];
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!params || !params.userId || !params.userId.trim()) {
    errors.push("User ID is required.");
  }
  if (!params || !params.companyId || !params.companyId.trim()) {
    errors.push("Company ID is required.");
  }
  if (!params || !params.roleId || !params.roleId.trim()) {
    errors.push("Role ID is required.");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Backward-compatibility function for validating membership removal parameters.
 */
export function validateMembershipRemoval(params: {
  userId?: string;
  companyId?: string;
  memberships?: UnifiedCompanyMembership[];
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!params || !params.userId || !params.userId.trim()) {
    errors.push("User ID is required.");
  }
  if (!params || !params.companyId || !params.companyId.trim()) {
    errors.push("Company ID is required.");
  }
  return { valid: errors.length === 0, errors };
}

