/**
 * Tenant Context & Authorization Provider — Deshal ERP
 * 
 * Clean Architecture Presentation/Context Layer:
 * - Manages tenant identity, active company boundary, active memberships, entitlements, and RBAC permissions.
 * - Enforces secure tenant/company switching without browser authorization bypass.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  TenantStatus,
  UserCompanyMembership,
  TenantSubscription
} from '../domain/tenant/tenantEntities';
import { EmployeePermission } from '../types/hr';
import {
  resolveTenantContextState,
  resolveActiveCompanyId,
  validateCompanySwitch,
  validateBranchSwitch,
  AuthorizedCompany,
  AuthorizedBranch,
  TenantContextData
} from '../application/services/tenantContextService';
import { fetchTenantContextFromSupabase } from '../lib/adapters/tenantContextAdapter';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

export interface TenantContextState {
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

export interface TenantContextActions {
  switchCompany: (targetCompanyId: string) => Promise<{ success: boolean; error?: string }>;
  switchBranch: (targetBranchId: string) => Promise<{ success: boolean; error?: string }>;
  switchTenant: (targetTenantId: string) => Promise<{ success: boolean; error?: string }>;
  refreshTenantContext: () => Promise<void>;
  hasModuleAccess: (moduleCode: string) => boolean;
  hasFeatureAccess: (moduleCode: string, featureCode: string) => boolean;
  hasPermission: (permissionCode: EmployeePermission) => boolean;
}

export interface TenantContextValue {
  state: TenantContextState;
  actions: TenantContextActions;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const auth = useAuth();
  const authUser = auth.state.supabaseAuthUser;
  const authSession = auth.state.authSession;

  const userId = authUser?.id || authSession?.user?.id || null;
  const preferredCompanyId = authUser?.companyId || null;
  const userRole = authUser?.role || authSession?.user?.role || 'ADMIN';

  // Load saved active branch ID from localStorage (rv_studio_active_branch_id)
  const savedBranchId = typeof localStorage !== 'undefined' ? localStorage.getItem('rv_studio_active_branch_id') : null;

  const [contextData, setContextData] = useState<TenantContextData>({
    tenantId: null,
    companyId: preferredCompanyId,
    activeCompanyId: preferredCompanyId,
    activeCompany: null,
    authorizedCompanies: [],
    authorizedBranches: [],
    activeBranchId: savedBranchId,
    activeBranch: null,
    activeEmployee: null,
    authenticatedUser: null,
    userType: 'UNASSIGNED',
    memberships: [],
    activeMembership: null,
    companyMembership: null,
    isPlatformAdmin: false,
    isPlatformCollaborator: false,
    employeeRole: null,
    employeePermissions: [],
    tenantStatus: 'ACTIVE',
    subscription: null,
    enabledModules: {},
    moduleEntitlements: {},
    enabledFeatures: {},
    featureEntitlements: {},
    permissions: [],
    loading: true,
    error: null
  });

  // Load / Refresh Context
  const loadContextForCompany = useCallback(
    async (targetCompanyId?: string | null, targetBranchId?: string | null) => {
      setContextData(prev => ({ ...prev, loading: true }));

      const effectiveCompanyId = targetCompanyId || preferredCompanyId;
      const effectiveBranchId = targetBranchId !== undefined ? targetBranchId : (typeof localStorage !== 'undefined' ? localStorage.getItem('rv_studio_active_branch_id') : null);

      // 1. Fetch data via infrastructure adapter
      const fetched = await fetchTenantContextFromSupabase(userId, effectiveCompanyId);

      // 2. Resolve application state via pure application service
      const resolved = resolveTenantContextState({
        userId,
        preferredCompanyId: effectiveCompanyId,
        preferredBranchId: effectiveBranchId,
        userRole,
        isPlatformAdmin: fetched.isPlatformAdmin,
        isPlatformCollaborator: fetched.isPlatformCollaborator,
        fetchedCompanies: fetched.companies,
        fetchedBranches: fetched.branches,
        fetchedEmployee: fetched.employee,
        fetchedMemberships: fetched.memberships,
        fetchedTenant: fetched.tenant,
        fetchedSubscription: fetched.subscription,
        fetchedModules: fetched.enabledModules,
        fetchedFeatures: fetched.enabledFeatures
      });

      setContextData(resolved);
    },
    [userId, preferredCompanyId, userRole]
  );

  const refreshTenantContext = useCallback(async () => {
    await loadContextForCompany();
  }, [loadContextForCompany]);

  useEffect(() => {
    refreshTenantContext();
  }, [refreshTenantContext]);

  // Secure Company Switching
  const handleSwitchCompany = useCallback(
    async (targetCompanyId: string): Promise<{ success: boolean; error?: string }> => {
      if (!targetCompanyId) {
        return { success: false, error: 'Target company ID is required.' };
      }

      // Security Validation
      const switchCheck = validateCompanySwitch({
        userId,
        targetCompanyId,
        memberships: contextData.memberships,
        isPlatformAdmin: contextData.isPlatformAdmin
      });

      if (!switchCheck.allowed) {
        return { success: false, error: switchCheck.error };
      }

      // Invalidate active branch ID on company switch to prevent stale branch context
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('rv_studio_active_branch_id');
        }
      } catch {}

      await loadContextForCompany(targetCompanyId, null);
      return { success: true };
    },
    [userId, contextData.memberships, contextData.isPlatformAdmin, loadContextForCompany]
  );

  // Secure Branch Switching
  const handleSwitchBranch = useCallback(
    async (targetBranchId: string): Promise<{ success: boolean; error?: string }> => {
      if (!targetBranchId) {
        return { success: false, error: 'Target branch ID is required.' };
      }

      const switchCheck = validateBranchSwitch({
        activeCompanyId: contextData.activeCompanyId,
        targetBranchId,
        authorizedBranches: contextData.authorizedBranches
      });

      if (!switchCheck.allowed) {
        return { success: false, error: switchCheck.error };
      }

      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('rv_studio_active_branch_id', targetBranchId);
        }
      } catch {}

      const activeBranch = contextData.authorizedBranches.find(b => b.id === targetBranchId) || null;
      setContextData(prev => ({
        ...prev,
        activeBranchId: targetBranchId,
        activeBranch
      }));

      return { success: true };
    },
    [contextData.activeCompanyId, contextData.authorizedBranches]
  );

  // Secure Tenant Switching (Resolves tenant -> target company_id)
  const handleSwitchTenant = useCallback(
    async (targetTenantId: string): Promise<{ success: boolean; error?: string }> => {
      if (!targetTenantId) {
        return { success: false, error: 'Target tenant ID is required.' };
      }

      if (!isSupabaseConfigured) {
        return { success: false, error: 'Supabase is unconfigured.' };
      }

      try {
        const { data: tenantRow } = await supabase
          .from('tenants')
          .select('company_id, status')
          .eq('id', targetTenantId)
          .maybeSingle();

        if (!tenantRow) {
          return { success: false, error: 'Tenant not found.' };
        }

        const targetCompanyId = (tenantRow as any).company_id;
        return await handleSwitchCompany(targetCompanyId);
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to switch tenant.' };
      }
    },
    [handleSwitchCompany]
  );

  // Capability & Permission Checks
  const hasModuleAccess = useCallback(
    (moduleCode: string): boolean => {
      if (!moduleCode) return true;
      if (Object.keys(contextData.enabledModules).length === 0) return true;
      return contextData.enabledModules[moduleCode] !== false;
    },
    [contextData.enabledModules]
  );

  const hasFeatureAccess = useCallback(
    (moduleCode: string, featureCode: string): boolean => {
      if (!moduleCode || !featureCode) return true;
      const key = `${moduleCode}.${featureCode}`;
      if (contextData.enabledFeatures[key] !== undefined) {
        return contextData.enabledFeatures[key] === true;
      }
      return hasModuleAccess(moduleCode);
    },
    [contextData.enabledFeatures, hasModuleAccess]
  );

  const hasPermission = useCallback(
    (permissionCode: EmployeePermission): boolean => {
      if (!permissionCode) return true;
      return contextData.permissions.includes(permissionCode);
    },
    [contextData.permissions]
  );

  const value: TenantContextValue = useMemo(
    () => ({
      state: {
        tenantId: contextData.tenantId,
        companyId: contextData.companyId,
        activeCompanyId: contextData.activeCompanyId,
        activeCompany: contextData.activeCompany,
        authorizedCompanies: contextData.authorizedCompanies,
        authorizedBranches: contextData.authorizedBranches,
        activeBranchId: contextData.activeBranchId,
        activeBranch: contextData.activeBranch,
        activeEmployee: contextData.activeEmployee,
        authenticatedUser: contextData.authenticatedUser,
        userType: contextData.userType,
        memberships: contextData.memberships,
        activeMembership: contextData.activeMembership,
        companyMembership: contextData.companyMembership,
        isPlatformAdmin: contextData.isPlatformAdmin,
        isPlatformCollaborator: contextData.isPlatformCollaborator,
        employeeRole: contextData.employeeRole,
        employeePermissions: contextData.employeePermissions,
        tenantStatus: contextData.tenantStatus,
        subscription: contextData.subscription,
        enabledModules: contextData.enabledModules,
        moduleEntitlements: contextData.moduleEntitlements,
        enabledFeatures: contextData.enabledFeatures,
        featureEntitlements: contextData.featureEntitlements,
        permissions: contextData.permissions,
        loading: contextData.loading,
        error: contextData.error
      },
      actions: {
        switchCompany: handleSwitchCompany,
        switchBranch: handleSwitchBranch,
        switchTenant: handleSwitchTenant,
        refreshTenantContext,
        hasModuleAccess,
        hasFeatureAccess,
        hasPermission
      }
    }),
    [
      contextData,
      handleSwitchCompany,
      handleSwitchBranch,
      handleSwitchTenant,
      refreshTenantContext,
      hasModuleAccess,
      hasFeatureAccess,
      hasPermission
    ]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = (): TenantContextValue => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
