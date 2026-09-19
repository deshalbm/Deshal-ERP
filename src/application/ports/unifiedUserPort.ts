/**
 * Unified User Repository Abstract Port Contract — Deshal ERP
 * 
 * Clean Architecture Application Layer: Abstract port contract for unified user management.
 * ZERO Supabase imports, ZERO Browser Storage globals, ZERO React dependencies.
 */

import {
  UnifiedUser,
  UnifiedCompanyMembership,
  UnifiedEmployeeSummary
} from '../../domain/user/unifiedUserDomain';

export interface UnifiedUserPort {
  /**
   * Reads all unified user identities across the platform.
   */
  fetchUnifiedUsers(activeCompanyId?: string | null): Promise<UnifiedUser[]>;
  
  /**
   * Alias for fetchUnifiedUsers.
   */
  listUnifiedUsers?(activeCompanyId?: string | null): Promise<UnifiedUser[]>;

  /**
   * Resolves a single unified user identity by user ID (profiles.id).
   */
  getUnifiedUser?(userId: string): Promise<UnifiedUser | null>;

  /**
   * Lists all users holding active memberships for a specific company.
   */
  getUnifiedUsersByCompany?(companyId: string): Promise<UnifiedUser[]>;

  /**
   * Lists all users authorized for a specific branch under a company.
   */
  getUnifiedUsersByBranch?(companyId: string, branchId: string): Promise<UnifiedUser[]>;

  /**
   * Lists all unassigned user profiles (no active company memberships, no platform admin status).
   */
  getUnassignedProfiles?(): Promise<UnifiedUser[]>;

  /**
   * Retrieves all company memberships assigned to a user.
   */
  getCompanyMemberships?(userId: string): Promise<UnifiedCompanyMembership[]>;

  /**
   * Retrieves the employee association summary for a user if an employee record exists.
   */
  getEmployeeAssociation?(userId: string): Promise<UnifiedEmployeeSummary | null>;

  /**
   * Assigns or updates a company membership for a target user.
   */
  assignCompanyMembership(params: {
    userId: string;
    companyId: string;
    roleId: string;
    allowedBranchIds?: string[];
  }): Promise<{ success: boolean; error?: string }>;

  /**
   * Deactivates a company membership for a target user.
   */
  removeCompanyMembership(userId: string, companyId: string): Promise<{ success: boolean; error?: string }>;
}
