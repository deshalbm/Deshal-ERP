-- Deshal ERP — Migration 0032: Grant Execute Permissions on Core Auth & Security Functions
-- Purpose: Grant execute permissions on security functions to anon, authenticated, and service_role.

BEGIN;

-- 1. Schema-wide permissions for API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- 2. Explicit grants on core functions
GRANT EXECUTE ON FUNCTION public.auth_user_company_ids() TO PUBLIC, anon, authenticated, service_role;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auth_user_has_permission') THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.auth_user_has_permission(TEXT) TO PUBLIC, anon, authenticated, service_role;';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auth_user_employee_id') THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.auth_user_employee_id() TO PUBLIC, anon, authenticated, service_role;';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_next_voucher_number') THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.generate_next_voucher_number(UUID, TEXT, UUID) TO PUBLIC, anon, authenticated, service_role;';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'normalize_phone') THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.normalize_phone(TEXT) TO PUBLIC, anon, authenticated, service_role;';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_public_invoice_verification') THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_public_invoice_verification(TEXT) TO PUBLIC, anon, authenticated, service_role;';
    END IF;
END $$;

COMMIT;

