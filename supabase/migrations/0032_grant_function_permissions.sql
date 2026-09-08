-- Deshal ERP — Migration 0032: Grant Execute Permissions on Core Auth & Security Functions
-- Purpose: Grant execute permissions on security functions to anon, authenticated, and service_role.

BEGIN;

GRANT EXECUTE ON FUNCTION public.auth_user_company_ids() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auth_user_has_permission(TEXT) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auth_user_employee_id() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_next_voucher_number(UUID, TEXT) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.normalize_phone(TEXT) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_invoice_verification(TEXT) TO PUBLIC, anon, authenticated, service_role;

COMMIT;
