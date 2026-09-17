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
  TenantContextData
} from '../application/services/tenantContextService';
import { fetchTenantContextFromSupabase } from '../lib/adapters/tenantContextAdapter';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

export interface TenantContextState {
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

export interface TenantContextActions {
  switchCompany: (targetCompanyId: string) => Promise<{ success: boolean; error?: string }>;
  switchTenant: (targetTenantId: string) => Promise<{ success: boolean; error?: string }>;
  refreshTenantContext: () => Promise<void>;
  hasModuleAccess: (moduleCode: string) => boolean;
  hasFeatureAccess: (moduleCode: string, featureCode: string) => boolean;
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

  const [contextData, setContextData] = useState<TenantContextData>({
    tenantId: null,
    companyId: preferredCompanyId,
    activeCompanyId: preferredCompanyId,
    memberships: [],
    activeMembership: null,
    isPlatformAdmin: false,
    tenantStatus: 'ACTIVE',
    subscription: null,
    enabledModules: {},
    enabledFeatures: {},
    permissions: [],
    loading: true,
    error: null
  });

  // Load / Refresh Context
  const loadContextForCompany = useCallback(
    async (targetCompanyId?: string | null) => {
      setContextData(prev => ({ ...prev, loading: true }));

      const effectiveCompanyId = targetCompanyId || preferredCompanyId;

      // 1. Fetch data via infrastructure adapter
      const fetched = await fetchTenantContextFromSupabase(userId, effectiveCompanyId);

      // 2. Resolve application state via pure application service
      const resolved = resolveTenantContextState({
        userId,
        preferredCompanyId: effectiveCompanyId,
        userRole,
        isPlatformAdmin: fetched.isPlatformAdmin,
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

      await loadContextForCompany(targetCompanyId);
      return { success: true };
    },
    [userId, contextData.memberships, contextData.isPlatformAdmin, loadContextForCompany]
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

  // Capability Checks
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

  const value: TenantContextValue = useMemo(
    () => ({
      state: {
        tenantId: contextData.tenantId,
        companyId: contextData.companyId,
        activeCompanyId: contextData.activeCompanyId,
        memberships: contextData.memberships,
        activeMembership: contextData.activeMembership,
        isPlatformAdmin: contextData.isPlatformAdmin,
        tenantStatus: contextData.tenantStatus,
        subscription: contextData.subscription,
        enabledModules: contextData.enabledModules,
        enabledFeatures: contextData.enabledFeatures,
        permissions: contextData.permissions,
        loading: contextData.loading,
        error: contextData.error
      },
      actions: {
        switchCompany: handleSwitchCompany,
        switchTenant: handleSwitchTenant,
        refreshTenantContext,
        hasModuleAccess,
        hasFeatureAccess
      }
    }),
    [contextData, handleSwitchCompany, handleSwitchTenant, refreshTenantContext, hasModuleAccess, hasFeatureAccess]
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
