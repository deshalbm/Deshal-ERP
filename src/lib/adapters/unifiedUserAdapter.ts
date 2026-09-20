/**
 * Supabase Infrastructure Adapter for Unified User & Directory Management — Deshal ERP
 * 
 * Clean Architecture Infrastructure Layer: Executes database queries and joins
 * profiles, platform_admins, user_company_memberships, companies, branches, and employees.
 * 
 * Maps raw database rows into domain entity UnifiedUser structures while maintaining
 * strict identity single-source rules (profiles.id) and membership boundaries.
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { UnifiedUserPort } from '../../application/ports/unifiedUserPort';
import {
  UnifiedUser,
  UnifiedCompanyMembership,
  UnifiedEmployeeSummary,
  CompanyMembershipScope,
  classifyUnifiedUser,
  classifyUserType,
  isAuthorizedForBranch,
  isUnassignedProfile,
  PlatformRoleType
} from '../../domain/user/unifiedUserDomain';
import { loadEmployees } from '../../utils/storage/employeesStorage';

/**
 * Pure mapping helper: Transforms raw raw profile, platform admin, membership, and employee database rows into a UnifiedUser domain entity.
 */
export function mapRowToUnifiedUser(params: {
  profile: {
    id: string;
    email?: string | null;
    full_name?: string | null;
    fullName?: string | null;
    full_name_en?: string | null;
    fullNameEn?: string | null;
    civil_id?: string | null;
    civilId?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    avatarUrl?: string | null;
    status?: string | null;
    company_id?: string | null;
    branch_id?: string | null;
    role?: string | null;
    created_at?: string | null;
    createdAt?: string | null;
    updated_at?: string | null;
    updatedAt?: string | null;
  };
  platformAdminRow?: {
    user_id: string;
    role?: string | null;
    created_at?: string | null;
    created_by?: string | null;
  } | null;
  membershipRows?: Array<{
    id?: string;
    membershipId?: string;
    user_id?: string;
    company_id?: string;
    companyId?: string;
    company_name_ar?: string;
    companyNameAr?: string;
    company_name_en?: string;
    companyNameEn?: string;
    companies?: { name_ar?: string; name_en?: string } | null;
    role_id?: string;
    roleId?: string;
    role_code?: string;
    roleCode?: string;
    allowed_branch_ids?: string[];
    allowedBranchIds?: string[];
    allowed_branch_names?: string[];
    allowedBranchNames?: string[];
    is_active?: boolean;
    isActive?: boolean;
    created_at?: string;
    createdAt?: string;
  }>;
  employeeRow?: {
    id: string;
    employee_code?: string | null;
    employeeCode?: string | null;
    company_id?: string | null;
    companyId?: string | null;
    primary_branch_id?: string | null;
    branchId?: string | null;
    department_id?: string | null;
    department?: string | null;
    job_title?: string | null;
    role?: string | null;
    status?: string | null;
  } | null;
}): UnifiedUser {
  const { profile, platformAdminRow, membershipRows = [], employeeRow } = params;

  const isPlatformAdminFromTable = Boolean(platformAdminRow);
  const isPlatformAdminFromProfileRole = profile.role === 'ADMIN';
  const isPlatformAdmin = isPlatformAdminFromTable || isPlatformAdminFromProfileRole;

  let platformRole: PlatformRoleType = null;
  if (platformAdminRow && platformAdminRow.role) {
    const r = platformAdminRow.role.toUpperCase();
    if (r === 'PLATFORM_ADMIN' || r === 'ADMIN') platformRole = 'PLATFORM_ADMIN';
    else if (r === 'PLATFORM_COLLABORATOR' || r === 'COLLABORATOR') platformRole = 'PLATFORM_COLLABORATOR';
    else if (r === 'PLATFORM_AUDITOR' || r === 'AUDITOR') platformRole = 'PLATFORM_AUDITOR';
  } else if (profile.role) {
    const r = profile.role.toUpperCase();
    if (r === 'ADMIN') platformRole = 'PLATFORM_ADMIN';
    else if (r === 'COLLABORATOR') platformRole = 'PLATFORM_COLLABORATOR';
    else if (r === 'AUDITOR') platformRole = 'PLATFORM_AUDITOR';
  }

  const platformAccess = {
    isPlatformAdmin,
    grantedAt: platformAdminRow?.created_at || undefined,
    grantedBy: platformAdminRow?.created_by || null
  };

  const memberships: UnifiedCompanyMembership[] = membershipRows.map((m) => {
    const cId = m.company_id || m.companyId || '';
    const nameAr = m.company_name_ar || m.companyNameAr || m.companies?.name_ar || 'شركة ديشال';
    const nameEn = m.company_name_en || m.companyNameEn || m.companies?.name_en;
    const rId = m.role_id || m.roleId || 'ADMIN';
    const rCode = m.role_code || m.roleCode || rId;
    const branchIds = m.allowed_branch_ids || m.allowedBranchIds || [];
    const branchNames = m.allowed_branch_names || m.allowedBranchNames || [];
    const active = m.is_active !== false && m.isActive !== false;
    const created = m.created_at || m.createdAt || new Date().toISOString();

    return {
      membershipId: m.id || m.membershipId,
      companyId: cId,
      companyNameAr: nameAr,
      companyNameEn: nameEn,
      roleId: rId,
      roleCode: rCode,
      allowedBranchIds: branchIds,
      allowedBranchNames: branchNames,
      isActive: active,
      createdAt: created
    };
  });

  let employeeSummary: UnifiedEmployeeSummary | null = null;
  if (employeeRow) {
    const statusRaw = (employeeRow.status || 'ACTIVE').toUpperCase();
    let empStatus: "ACTIVE" | "INACTIVE" | "TERMINATED" | "ON_LEAVE" | "PROBATION" = "ACTIVE";
    if (statusRaw === 'INACTIVE') empStatus = "INACTIVE";
    else if (statusRaw === 'TERMINATED') empStatus = "TERMINATED";
    else if (statusRaw === 'ON_LEAVE') empStatus = "ON_LEAVE";
    else if (statusRaw === 'PROBATION') empStatus = "PROBATION";

    employeeSummary = {
      employeeId: employeeRow.id,
      employeeCode: employeeRow.employee_code || employeeRow.employeeCode || employeeRow.id,
      companyId: employeeRow.company_id || employeeRow.companyId || '',
      primaryBranchId: employeeRow.primary_branch_id || employeeRow.branchId || null,
      departmentId: employeeRow.department_id || employeeRow.department || null,
      jobTitle: employeeRow.job_title || employeeRow.role || null,
      employmentStatus: empStatus
    };
  }

  const classification = classifyUnifiedUser({
    isPlatformAdmin,
    memberships
  });

  const userType = classifyUserType({
    isPlatformAdmin,
    platformRole,
    memberships,
    hasEmployeeRecord: Boolean(employeeRow)
  });

  const email = profile.email || (employeeRow as any)?.email || 'user@deshalbm.com';
  const fullName = profile.full_name || profile.fullName || (employeeRow as any)?.full_name || (employeeRow as any)?.fullName || 'مستخدم النظام';
  const fullNameEn = profile.full_name_en || profile.fullNameEn || (employeeRow as any)?.full_name_en || (employeeRow as any)?.fullNameEn;
  const civilId = profile.civil_id || profile.civilId || (employeeRow as any)?.civil_id || (employeeRow as any)?.civilId;
  const phone = profile.phone || (employeeRow as any)?.phone;
  const avatarUrl = profile.avatar_url || profile.avatarUrl || (employeeRow as any)?.avatar_url || (employeeRow as any)?.avatarUrl;

  return {
    id: profile.id,
    email,
    fullName,
    fullNameEn,
    civilId,
    phone,
    avatarUrl,
    status: profile.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    isActive: profile.status !== 'INACTIVE',
    companyId: profile.company_id || null,
    branchId: profile.branch_id || null,
    isPlatformAdmin,
    platformRole,
    platformAccess,
    memberships,
    employeeSummary,
    primaryEmployeeId: employeeRow?.id || null,
    primaryRole: employeeRow?.role || profile.role || null,
    primaryDepartment: employeeRow?.department || employeeRow?.department_id || null,
    hasEmployeeRecord: Boolean(employeeRow),
    classification,
    userType,
    createdAt: profile.created_at || profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updated_at || profile.updatedAt || new Date().toISOString()
  };
}

export const defaultUnifiedUserAdapter: UnifiedUserPort = {
  async fetchUnifiedUsers(activeCompanyId?: string | null): Promise<UnifiedUser[]> {
    if (!isSupabaseConfigured) {
      // LocalStorage / Fallback resolution
      let employees: any[] = [];
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          employees = loadEmployees();
        }
      } catch (err) {
        employees = [];
      }
      return employees.map((emp) => {

        const isPlatformAdmin = emp.role === 'ADMIN';
        const platformRole: PlatformRoleType = emp.role === 'ADMIN' ? 'PLATFORM_ADMIN' : (emp.role === 'COLLABORATOR' ? 'PLATFORM_COLLABORATOR' : (emp.role === 'AUDITOR' ? 'PLATFORM_AUDITOR' : null));
        const membership: CompanyMembershipScope = {
          companyId: activeCompanyId || '00000000-0000-0000-0000-000000000001',
          companyNameAr: 'مؤسسة ديشال ERP',
          roleId: emp.role,
          allowedBranchIds: emp.branchId ? [emp.branchId] : [],
          allowedBranchNames: emp.branchName ? [emp.branchName] : [],
          isActive: emp.status === 'ACTIVE',
          createdAt: emp.createdAt || new Date().toISOString()
        };

        return mapRowToUnifiedUser({
          profile: {
            id: emp.id,
            email: emp.email || `${emp.employeeCode.toLowerCase()}@deshalbm.com`,
            full_name: emp.fullName,
            full_name_en: emp.fullNameEn,
            civil_id: emp.civilId,
            phone: emp.phone,
            avatar_url: emp.avatarUrl,
            role: emp.role,
            status: emp.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
            created_at: emp.createdAt || new Date().toISOString()
          },
          platformAdminRow: isPlatformAdmin ? { user_id: emp.id, role: 'PLATFORM_ADMIN' } : null,
          membershipRows: [membership],
          employeeRow: {
            id: emp.id,
            employee_code: emp.employeeCode,
            company_id: activeCompanyId || '00000000-0000-0000-0000-000000000001',
            primary_branch_id: emp.branchId,
            department: emp.department,
            role: emp.role,
            status: emp.status
          }
        });
      });
    }

    try {
      // 1. Fetch Profiles
      const { data: profilesData, error: profilesErr } = await (supabase.from('profiles') as any)
        .select('*');

      if (profilesErr || !profilesData) {
        console.warn('[UnifiedUserAdapter] Profiles fetch error:', profilesErr);
        return [];
      }

      // 2. Fetch Platform Admins
      const { data: adminsData } = await (supabase.from('platform_admins') as any).select('user_id, role, created_at, created_by');
      const adminMap = new Map<string, any>();
      (adminsData || []).forEach((a: any) => {
        if (a && a.user_id) adminMap.set(a.user_id, a);
      });

      // 3. Fetch User Company Memberships with Companies
      const { data: membershipsData } = await (supabase.from('user_company_memberships') as any)
        .select('id, user_id, company_id, is_active, created_at, companies(id, name_ar, name_en)');

      const membershipsByUserId: Record<string, any[]> = {};
      if (membershipsData) {
        membershipsData.forEach((m: any) => {
          if (!membershipsByUserId[m.user_id]) {
            membershipsByUserId[m.user_id] = [];
          }
          membershipsByUserId[m.user_id].push(m);
        });
      }

      // 4. Fetch Employees
      const { data: employeesData } = await (supabase.from('employees') as any).select('*');
      const employeesByEmail: Record<string, any> = {};
      const employeesById: Record<string, any> = {};
      if (employeesData) {
        employeesData.forEach((e: any) => {
          if (e.email) employeesByEmail[e.email.toLowerCase()] = e;
          if (e.id) employeesById[e.id] = e;
        });
      }

      // 5. Aggregate into UnifiedUsers
      return profilesData.map((p: any) => {
        const platformAdminRow = adminMap.get(p.id) || null;
        const userMemberships = membershipsByUserId[p.id] || [];
        const empRecord = (p.email && employeesByEmail[p.email.toLowerCase()]) || employeesById[p.id] || null;

        return mapRowToUnifiedUser({
          profile: p,
          platformAdminRow,
          membershipRows: userMemberships,
          employeeRow: empRecord
        });
      });
    } catch (err) {
      console.warn('[UnifiedUserAdapter] Failed to query unified users:', err);
      return [];
    }
  },

  async listUnifiedUsers(activeCompanyId?: string | null): Promise<UnifiedUser[]> {
    return this.fetchUnifiedUsers(activeCompanyId);
  },

  async getUnifiedUser(userId: string): Promise<UnifiedUser | null> {
    if (!userId || !userId.trim()) return null;
    const users = await this.fetchUnifiedUsers();
    return users.find((u) => u.id === userId.trim()) || null;
  },

  async getUnifiedUsersByCompany(companyId: string): Promise<UnifiedUser[]> {
    if (!companyId || !companyId.trim()) return [];
    const users = await this.fetchUnifiedUsers();
    return users.filter((u) =>
      u.memberships.some((m) => m && m.companyId === companyId.trim() && m.isActive !== false)
    );
  },

  async getUnifiedUsersByBranch(companyId: string, branchId: string): Promise<UnifiedUser[]> {
    if (!companyId || !companyId.trim() || !branchId || !branchId.trim()) return [];
    const users = await this.fetchUnifiedUsers();
    return users.filter((u) => isAuthorizedForBranch(u, companyId.trim(), branchId.trim()));
  },

  async getUnassignedProfiles(): Promise<UnifiedUser[]> {
    const users = await this.fetchUnifiedUsers();
    return users.filter((u) => isUnassignedProfile(u));
  },

  async getCompanyMemberships(userId: string): Promise<UnifiedCompanyMembership[]> {
    const user = await this.getUnifiedUser(userId);
    return user ? user.memberships : [];
  },

  async getEmployeeAssociation(userId: string): Promise<UnifiedEmployeeSummary | null> {
    const user = await this.getUnifiedUser(userId);
    return user ? user.employeeSummary || null : null;
  },

  async assignCompanyMembership(params: {
    userId: string;
    companyId: string;
    roleId: string;
    allowedBranchIds?: string[];
  }): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const { error } = await (supabase.from('user_company_memberships') as any).upsert({
        user_id: params.userId,
        company_id: params.companyId,
        is_active: true,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id,company_id' });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to assign membership' };
    }
  },

  async removeCompanyMembership(userId: string, companyId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const { error } = await (supabase.from('user_company_memberships') as any)
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to remove membership' };
    }
  }
};
