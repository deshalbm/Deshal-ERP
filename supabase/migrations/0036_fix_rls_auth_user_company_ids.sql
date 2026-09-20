-- Deshal ERP — Migration 0036: Fix auth_user_company_ids Security Definer Function for Anon/Hybrid Sessions
-- Purpose:
--   Ensure auth_user_company_ids() returns active company IDs when auth.uid() is null or unauthenticated,
--   allowing Supabase REST API queries for default tenant companies (e.g. 00000000-0000-0000-0000-000000000001)
--   to successfully return operational data (branches, employees, customers, products, vouchers, spaces).

BEGIN;

CREATE OR REPLACE FUNCTION public.auth_user_company_ids()
RETURNS SETOF UUID AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    -- Return active company IDs for client operational mode
    RETURN QUERY SELECT id FROM public.companies WHERE is_active = true;
  ELSE
    RETURN QUERY 
      SELECT company_id 
      FROM public.user_company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM public.companies WHERE is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Explicitly Grant EXECUTE to PUBLIC, anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.auth_user_company_ids() TO PUBLIC, anon, authenticated, service_role;

COMMIT;
