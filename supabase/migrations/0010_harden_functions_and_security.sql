-- Deshal ERP — Migration 0010: Function Hardening & Security Linter Fixes
-- Purpose: Set explicit search_path and revoke public anon execution on helper functions.

BEGIN;

CREATE OR REPLACE FUNCTION public.auth_user_company_ids()
RETURNS SETOF UUID 
SET search_path = public, pg_temp
AS $$
  SELECT company_id 
  FROM public.user_company_memberships 
  WHERE user_id = (SELECT auth.uid()) AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_has_permission(p_permission TEXT)
RETURNS BOOLEAN 
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = (SELECT auth.uid()) 
      AND p.code = p_permission
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_employee_id()
RETURNS UUID 
SET search_path = public, pg_temp
AS $$
  SELECT employee_id 
  FROM public.profiles 
  WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.prevent_posted_journal_entry_modification()
RETURNS TRIGGER 
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status = 'POSTED' OR OLD.status = 'LOCKED' THEN
        RAISE EXCEPTION 'Financial Integrity Violation: Cannot modify or delete a POSTED or LOCKED journal entry (Entry ID: %). Use a Reversal or Adjusting entry instead.', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Revoke anon execution rights on internal helper functions
REVOKE EXECUTE ON FUNCTION public.auth_user_company_ids() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auth_user_has_permission(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auth_user_employee_id() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.auth_user_company_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_has_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_employee_id() TO authenticated;

COMMIT;
