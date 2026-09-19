/**
 * Supabase Data Adapter for Tenant Context & Authorization — Deshal ERP
 * 
 * Infrastructure Layer: Executes Supabase database queries for platform admins,
 * user memberships, tenants, modules, features, and subscriptions.
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  Tenant,
  UserCompanyMembership,
  TenantSubscription,
  TenantStatus
} from '../../domain/tenant/tenantEntities';
import {
  AuthorizedCompany,
  AuthorizedBranch
} from '../../application/services/tenantContextService';

export interface FetchedTenantData {
  isPlatformAdmin: boolean;
  isPlatformCollaborator: boolean;
  memberships: UserCompanyMembership[];
  companies: AuthorizedCompany[];
  branches: AuthorizedBranch[];
  employee: { id: string; fullName: string; role: string; email: string } | null;
  tenant: Tenant | null;
  subscription: TenantSubscription | null;
  enabledModules: Record<string, boolean>;
  enabledFeatures: Record<string, boolean>;
}

export async function fetchTenantContextFromSupabase(
  userId: string | null,
  activeCompanyId: string | null
): Promise<FetchedTenantData> {
  const defaultCompanyId = activeCompanyId || '00000000-0000-0000-0000-000000000001';

  const result: FetchedTenantData = {
    isPlatformAdmin: false,
    isPlatformCollaborator: false,
    memberships: [],
    companies: [
      {
        id: defaultCompanyId,
        nameAr: 'مؤسسة ديشال ERP',
        nameEn: 'Deshal Enterprise ERP'
      }
    ],
    branches: [
      {
        id: 'branch-sohar',
        code: 'BR-SOH-01',
        name: 'فرع صحار الرئيسي',
        nameEn: 'Sohar Main Branch',
        isMain: true,
        status: 'ACTIVE',
        companyId: defaultCompanyId
      }
    ],
    employee: null,
    tenant: null,
    subscription: null,
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
    enabledFeatures: {}
  };

  if (!userId || !isSupabaseConfigured) {
    if (userId) {
      result.memberships = [{
        id: `mem_local_${defaultCompanyId}`,
        userId,
        companyId: defaultCompanyId,
        roleId: 'ADMIN',
        isActive: true,
        createdAt: new Date().toISOString()
      }];
    }
    return result;
  }

  try {
    // 1. Query Platform Admins
    const { data: adminData } = await supabase
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    result.isPlatformAdmin = !!adminData;

    // 2. Query User Memberships & Authorized Companies
    const { data: membershipsData } = await supabase
      .from('user_company_memberships')
      .select('id, user_id, company_id, role_id, is_active, created_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (membershipsData && membershipsData.length > 0) {
      result.memberships = membershipsData.map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        companyId: m.company_id,
        roleId: m.role_id,
        isActive: m.is_active,
        createdAt: m.created_at
      }));

      // Check platform collaborator role from membership or profile
      result.isPlatformCollaborator = membershipsData.some((m: any) => m.role_id === 'COLLABORATOR' || m.role_id === 'AUDITOR');

      // Fetch Company Details for Authorized Memberships
      const companyIds = Array.from(new Set(membershipsData.map((m: any) => m.company_id)));
      if (companyIds.length > 0) {
        const { data: companiesData } = await supabase
          .from('companies')
          .select('id, name_ar, name_en, cr_number')
          .in('id', companyIds);

        if (companiesData && companiesData.length > 0) {
          result.companies = companiesData.map((c: any) => ({
            id: c.id,
            nameAr: c.name_ar || c.name || 'شركة ديشال',
            nameEn: c.name_en,
            crNumber: c.cr_number
          }));
        }
      }
    }

    if (!activeCompanyId) {
      return result;
    }

    // 3. Query Branches for Active Company
    const { data: branchesData } = await supabase
      .from('branches')
      .select('id, code, name_ar, name_en, is_main, is_active, company_id')
      .eq('company_id', activeCompanyId)
      .eq('is_active', true);

    if (branchesData && branchesData.length > 0) {
      result.branches = branchesData.map((b: any) => ({
        id: b.id,
        code: b.code,
        name: b.name_ar || b.name || 'الفرع الرئيسي',
        nameEn: b.name_en,
        isMain: b.is_main,
        status: b.is_active ? 'ACTIVE' : 'INACTIVE',
        companyId: b.company_id
      }));
    }

    // 4. Query Employee record for active company & user
    const { data: empData } = await supabase
      .from('employees')
      .select('id, full_name, role, email')
      .eq('company_id', activeCompanyId)
      .eq('email', userId)
      .maybeSingle();

    if (empData) {
      const e = empData as any;
      result.employee = {
        id: e.id,
        fullName: e.full_name,
        role: e.role,
        email: e.email
      };
    }

    // 5. Query Tenant
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('id, tenant_code, name, company_id, status, subscription_plan, created_at, updated_at')
      .eq('company_id', activeCompanyId)
      .maybeSingle();

    if (tenantData) {
      const t = tenantData as any;
      result.tenant = {
        id: t.id,
        tenantCode: t.tenant_code,
        name: t.name,
        companyId: t.company_id,
        status: t.status as TenantStatus,
        subscriptionPlan: t.subscription_plan,
        createdAt: t.created_at,
        updatedAt: t.updated_at
      };
    }

    // 6. Query Modules & Features
    if (result.tenant?.id) {
      const { data: modulesData } = await supabase
        .from('tenant_modules')
        .select('module_code, is_enabled')
        .eq('tenant_id', result.tenant.id);

      if (modulesData && modulesData.length > 0) {
        modulesData.forEach((m: any) => {
          result.enabledModules[m.module_code] = m.is_enabled;
        });
      }

      const { data: featuresData } = await supabase
        .from('tenant_features')
        .select('module_code, feature_code, is_enabled')
        .eq('tenant_id', result.tenant.id);

      if (featuresData && featuresData.length > 0) {
        featuresData.forEach((f: any) => {
          result.enabledFeatures[`${f.module_code}.${f.feature_code}`] = f.is_enabled;
        });
      }
    }

    // 7. Query Subscription
    const { data: subData } = await supabase
      .from('tenant_subscriptions')
      .select('id, company_id, plan_type, status, current_period_end')
      .eq('company_id', activeCompanyId)
      .maybeSingle();

    if (subData) {
      const s = subData as any;
      result.subscription = {
        id: s.id,
        companyId: s.company_id,
        planType: s.plan_type || 'ENTERPRISE',
        status: s.status || 'active',
        currentPeriodEnd: s.current_period_end || new Date().toISOString()
      };
    }

    return result;
  } catch (err) {
    console.warn('[TenantContextAdapter] Error fetching tenant context:', err);
    return result;
  }
}
