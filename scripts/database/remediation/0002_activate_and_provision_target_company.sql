-- Deshal ERP — Production Data Remediation Script 0002
-- Target Company: 00000000-0000-0000-0000-000000000001
-- Target Authorized Admin User: 61738273-e738-4f53-8718-85811a174281
-- Purpose: DATA ONLY operator-review SQL script to provision tenant registry, 12 modules,
-- system roles, 91-permission catalog, profile memberships, and admin authorization for target company.
-- ZERO DDL, ZERO DELETE, ZERO TRUNCATE, ZERO DROP, ZERO business record modification.

BEGIN;

DO $$
DECLARE
    v_company_id CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
    v_target_user_id CONSTANT UUID := '61738273-e738-4f53-8718-85811a174281';
    v_company_exists BOOLEAN;
    v_user_exists BOOLEAN;
    v_tenant_id UUID;
    v_admin_role_id UUID;
    v_employee_role_id UUID;
BEGIN
    -- 1. Guard Verification: Confirm target company exists
    SELECT EXISTS (
        SELECT 1 FROM public.companies WHERE id = v_company_id
    ) INTO v_company_exists;

    IF NOT v_company_exists THEN
        RAISE EXCEPTION 'Target company ID % does not exist in public.companies.', v_company_id;
    END IF;

    -- Confirm authorized admin user exists in profiles
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = v_target_user_id AND company_id = v_company_id
    ) INTO v_user_exists;

    IF NOT v_user_exists THEN
        RAISE NOTICE 'Target authorized admin user % is not registered under company % in public.profiles.', v_target_user_id, v_company_id;
    END IF;

    -- 2. Create or Activate Tenant Registry Record (Idempotent)
    SELECT id INTO v_tenant_id
    FROM public.tenants
    WHERE company_id = v_company_id;

    IF v_tenant_id IS NULL THEN
        INSERT INTO public.tenants (company_id, tenant_code, name, status, subscription_plan)
        VALUES (
            v_company_id,
            'TNT-00000001',
            'شركة دشهال (الرئيسية)',
            'ACTIVE',
            'ENTERPRISE'
        )
        RETURNING id INTO v_tenant_id;
    ELSE
        UPDATE public.tenants
        SET status = 'ACTIVE', updated_at = now()
        WHERE id = v_tenant_id AND status != 'ACTIVE';
    END IF;

    -- 3. Initialize Exactly the 12 Canonical Approved Modules (Idempotent)
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
        (v_tenant_id, 'kiosk', true)
    ON CONFLICT (tenant_id, module_code) DO NOTHING;

    -- 4. Seed Permissions, System Default Roles & Role-Permission Matrix (Idempotent)
    PERFORM public.seed_system_permissions_and_roles(v_company_id);

    -- Fetch Target Company ADMIN and EMPLOYEE Role IDs
    SELECT id INTO v_admin_role_id FROM public.roles WHERE company_id = v_company_id AND code = 'ADMIN';
    SELECT id INTO v_employee_role_id FROM public.roles WHERE company_id = v_company_id AND code = 'EMPLOYEE';

    IF v_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Failed to seed or resolve ADMIN role for company %.', v_company_id;
    END IF;

    -- 5. Create Memberships strictly for Profiles belonging to Target Company (Idempotent)
    INSERT INTO public.user_company_memberships (user_id, company_id, is_active)
    SELECT p.id, p.company_id, true
    FROM public.profiles p
    WHERE p.company_id = v_company_id
    ON CONFLICT (user_id, company_id) DO UPDATE SET is_active = true;

    -- 6. Assign ADMIN Role ONLY to the explicitly authorized target user 61738273-e738-4f53-8718-85811a174281
    IF v_user_exists THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (v_target_user_id, v_admin_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    -- 7. Assign EMPLOYEE Role to non-admin profiles belonging to target company (Non-destructive)
    IF v_employee_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        SELECT p.id, v_employee_role_id
        FROM public.profiles p
        WHERE p.company_id = v_company_id AND p.id != v_target_user_id
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

END $$;

COMMIT;
