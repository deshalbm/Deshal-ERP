-- Deshal ERP — Migration 0034: Enterprise Multi-Tenancy Core Architecture
-- Purpose: Additive platform tenant registry, multi-tenant scope flags, platform admin privileges,
-- RLS security hardening, and atomic transactional provisioning RPC.

BEGIN;

-- ============================================================================
-- 1. Create Platform Multi-Tenant Tables (Additive Only)
-- ============================================================================

-- 1.1 Master Platform Tenant Registry Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE RESTRICT,
    tenant_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROVISIONING', 'READY', 'ACTIVE', 'SUSPENDED', 'FAILED', 'ARCHIVED')),
    subscription_plan TEXT NOT NULL DEFAULT 'FREE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 Platform Admins Registry Table (Authorization only, zero passwords/credentials)
CREATE TABLE IF NOT EXISTS public.platform_admins (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    granted_by UUID REFERENCES public.profiles(id)
);

-- 1.3 Tenant Module Entitlements Table
CREATE TABLE IF NOT EXISTS public.tenant_modules (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_code TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, module_code)
);

-- 1.4 Tenant Fine-Grained Feature Entitlements Table
CREATE TABLE IF NOT EXISTS public.tenant_features (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_code TEXT NOT NULL,
    feature_code TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, module_code, feature_code)
);

-- 1.5 Tenant Provisioning Jobs Queue Table (Idempotent execution tracker)
CREATE TABLE IF NOT EXISTS public.tenant_provisioning_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL UNIQUE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    failed_step TEXT,
    error_code TEXT,
    error_message TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- 2. Performance Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenants_company_id ON public.tenants(company_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant_id ON public.tenant_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id ON public.tenant_features(tenant_id, module_code);
CREATE INDEX IF NOT EXISTS idx_tenant_provisioning_jobs_idempotency ON public.tenant_provisioning_jobs(idempotency_key);

-- ============================================================================
-- 3. Hardened Security Helper Functions (SECURITY DEFINER with explicit search_path)
-- ============================================================================

-- Helper 1: Evaluates if auth user holds Platform Admin status
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
  );
$$;

-- Helper 2: Authorized Company IDs derived strictly from active user memberships
CREATE OR REPLACE FUNCTION public.auth_user_company_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id 
  FROM public.user_company_memberships 
  WHERE user_id = auth.uid() AND is_active = true;
$$;

-- Helper 3: Returns authorized tenant IDs linked to authenticated user's active companies
CREATE OR REPLACE FUNCTION public.auth_user_tenant_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id
  FROM public.tenants t
  JOIN public.user_company_memberships ucm ON t.company_id = ucm.company_id
  WHERE ucm.user_id = auth.uid() 
    AND ucm.is_active = true
    AND t.status = 'ACTIVE';
$$;

-- ============================================================================
-- 4. Enable Row Level Security (RLS) on Platform Tables
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_provisioning_jobs ENABLE ROW LEVEL SECURITY;

-- 4.1 Tenants RLS Policies
DROP POLICY IF EXISTS tenants_select_policy ON public.tenants;
CREATE POLICY tenants_select_policy ON public.tenants
    FOR SELECT USING (
        public.is_platform_admin() OR company_id IN (SELECT public.auth_user_company_ids())
    );

DROP POLICY IF EXISTS tenants_admin_all_policy ON public.tenants;
CREATE POLICY tenants_admin_all_policy ON public.tenants
    FOR ALL USING (public.is_platform_admin());

-- 4.2 Platform Admins RLS Policies
DROP POLICY IF EXISTS platform_admins_all_policy ON public.platform_admins;
CREATE POLICY platform_admins_all_policy ON public.platform_admins
    FOR ALL USING (public.is_platform_admin());

-- 4.3 Tenant Modules RLS Policies
DROP POLICY IF EXISTS tenant_modules_select_policy ON public.tenant_modules;
CREATE POLICY tenant_modules_select_policy ON public.tenant_modules
    FOR SELECT USING (
        public.is_platform_admin() OR tenant_id IN (SELECT public.auth_user_tenant_ids())
    );

DROP POLICY IF EXISTS tenant_modules_admin_all_policy ON public.tenant_modules;
CREATE POLICY tenant_modules_admin_all_policy ON public.tenant_modules
    FOR ALL USING (public.is_platform_admin());

-- 4.4 Tenant Features RLS Policies
DROP POLICY IF EXISTS tenant_features_select_policy ON public.tenant_features;
CREATE POLICY tenant_features_select_policy ON public.tenant_features
    FOR SELECT USING (
        public.is_platform_admin() OR tenant_id IN (SELECT public.auth_user_tenant_ids())
    );

DROP POLICY IF EXISTS tenant_features_admin_all_policy ON public.tenant_features;
CREATE POLICY tenant_features_admin_all_policy ON public.tenant_features
    FOR ALL USING (public.is_platform_admin());

-- 4.5 Tenant Provisioning Jobs RLS Policies
DROP POLICY IF EXISTS tenant_provisioning_jobs_admin_all_policy ON public.tenant_provisioning_jobs;
CREATE POLICY tenant_provisioning_jobs_admin_all_policy ON public.tenant_provisioning_jobs
    FOR ALL USING (public.is_platform_admin());

-- ============================================================================
-- 5. Atomic Idempotent Tenant Provisioning RPC Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.provision_tenant_transaction(
    p_idempotency_key TEXT,
    p_name TEXT,
    p_cr_number TEXT,
    p_tax_id TEXT,
    p_currency TEXT,
    p_main_branch_name TEXT,
    p_admin_email TEXT,
    p_admin_name TEXT,
    p_subscription_plan TEXT DEFAULT 'FREE'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_job RECORD;
    v_company_id UUID;
    v_tenant_id UUID;
    v_branch_id UUID;
    v_role_id UUID;
    v_user_id UUID;
    v_tenant_code TEXT;
    v_job_id UUID;
BEGIN
    -- Security Guard: Must be executed by a Platform Admin or authenticated system caller
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Security Violation: Only Platform Administrators can execute tenant provisioning.';
    END IF;

    -- 1. Idempotency Check
    SELECT * INTO v_existing_job
    FROM public.tenant_provisioning_jobs
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
        IF v_existing_job.status = 'COMPLETED' THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'tenant_id', v_existing_job.tenant_id,
                'company_id', v_existing_job.company_id,
                'message', 'Provisioning already completed previously.'
            );
        ELSIF v_existing_job.status = 'IN_PROGRESS' THEN
            RAISE EXCEPTION 'Provisioning job is currently in progress for idempotency key %', p_idempotency_key;
        END IF;
    END IF;

    -- Register / Update Provisioning Job State
    INSERT INTO public.tenant_provisioning_jobs (idempotency_key, status, payload)
    VALUES (p_idempotency_key, 'IN_PROGRESS', jsonb_build_object('name', p_name, 'cr_number', p_cr_number))
    ON CONFLICT (idempotency_key) DO UPDATE
    SET status = 'IN_PROGRESS', failed_step = NULL, error_message = NULL
    RETURNING id INTO v_job_id;

    -- 2. Create Company Entity
    INSERT INTO public.companies (name_ar, name_en, cr_number, tax_number, is_active)
    VALUES (p_name, p_name, p_cr_number, p_tax_id, true)
    RETURNING id INTO v_company_id;

    -- 3. Generate Tenant Code & Create Master Tenant Entity
    v_tenant_code := 'TNT-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));
    
    INSERT INTO public.tenants (company_id, tenant_code, name, status, subscription_plan)
    VALUES (v_company_id, v_tenant_code, p_name, 'PROVISIONING', p_subscription_plan)
    RETURNING id INTO v_tenant_id;

    -- 4. Create Main Branch
    INSERT INTO public.branches (company_id, code, name_ar, name_en, city, is_active)
    VALUES (v_company_id, 'MAIN', p_main_branch_name, p_main_branch_name, 'صحار', true)
    RETURNING id INTO v_branch_id;

    -- 5. Create System Admin Role
    INSERT INTO public.roles (company_id, code, name_ar, name_en, is_system_default)
    VALUES (v_company_id, 'ADMIN', 'مدير النظام', 'System Administrator', true)
    RETURNING id INTO v_role_id;

    -- 6. Initialize Default Modules (All Enabled by Default)
    INSERT INTO public.tenant_modules (tenant_id, module_code, is_enabled)
    VALUES
        (v_tenant_id, 'crm', true),
        (v_tenant_id, 'pos', true),
        (v_tenant_id, 'inventory', true),
        (v_tenant_id, 'purchases', true),
        (v_tenant_id, 'accounting', true),
        (v_tenant_id, 'hr', true),
        (v_tenant_id, 'attendance', true),
        (v_tenant_id, 'spaces', true),
        (v_tenant_id, 'services', true),
        (v_tenant_id, 'requests', true),
        (v_tenant_id, 'documents', true),
        (v_tenant_id, 'kiosk', true);

    -- 7. Initialize Tenant Subscription Record
    INSERT INTO public.tenant_subscriptions (company_id, plan_type, status)
    VALUES (v_company_id, p_subscription_plan, 'active');

    -- 8. Mark Tenant READY and Job COMPLETED
    UPDATE public.tenants
    SET status = 'READY', updated_at = now()
    WHERE id = v_tenant_id;

    UPDATE public.tenant_provisioning_jobs
    SET status = 'COMPLETED',
        tenant_id = v_tenant_id,
        company_id = v_company_id,
        completed_at = now()
    WHERE id = v_job_id;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'tenant_id', v_tenant_id,
        'company_id', v_company_id,
        'tenant_code', v_tenant_code,
        'main_branch_id', v_branch_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Capture Error and Update Provisioning Job State
    IF v_job_id IS NOT NULL THEN
        UPDATE public.tenant_provisioning_jobs
        SET status = 'FAILED',
            failed_step = 'PROVISION_TRANSACTION',
            error_code = SQLSTATE,
            error_message = SQLERRM
        WHERE id = v_job_id;
    END IF;

    RAISE EXCEPTION 'Tenant Provisioning Failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- ============================================================================
-- 6. Selective Backfill for Verified Operational Production Companies
-- ============================================================================

INSERT INTO public.tenants (company_id, tenant_code, name, status, subscription_plan)
SELECT 
    c.id,
    'TNT-' || UPPER(SUBSTRING(REPLACE(c.id::text, '-', ''), 1, 8)),
    c.name_ar,
    'ACTIVE',
    'ENTERPRISE'
FROM public.companies c
WHERE c.is_active = true
  AND NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.company_id = c.id)
  AND (
      EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.company_id = c.id) OR
      EXISTS (SELECT 1 FROM public.vouchers v WHERE v.company_id = c.id) OR
      EXISTS (SELECT 1 FROM public.customers cust WHERE cust.company_id = c.id) OR
      EXISTS (SELECT 1 FROM public.user_company_memberships ucm WHERE ucm.company_id = c.id)
  );

COMMIT;
