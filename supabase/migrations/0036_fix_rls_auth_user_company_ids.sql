-- Deshal ERP — Migration 0036: Fix auth_user_company_ids & RLS Policies for Anon/Default Tenant Seeding
-- Purpose:
--   1. Ensure auth_user_company_ids() always returns default tenant company ID ('00000000-0000-0000-0000-000000000001')
--      to prevent RLS bootstrap deadlock when companies table is initially empty.
--   2. Grant explicit permissions so client REST API queries for companies, branches, employees, customers,
--      vouchers, spaces, products, and kiosk devices can fetch and seed operational data.

BEGIN;

CREATE OR REPLACE FUNCTION public.auth_user_company_ids()
RETURNS SETOF UUID AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    -- Return default company ID + active company IDs for client operational mode
    RETURN QUERY 
      SELECT '00000000-0000-0000-0000-000000000001'::UUID
      UNION
      SELECT id FROM public.companies WHERE is_active = true;
  ELSE
    RETURN QUERY 
      SELECT company_id 
      FROM public.user_company_memberships 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT '00000000-0000-0000-0000-000000000001'::UUID
      UNION
      SELECT id FROM public.companies WHERE is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Explicitly Grant EXECUTE to PUBLIC, anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.auth_user_company_ids() TO PUBLIC, anon, authenticated, service_role;

-- Allow company creation and operational queries for authenticated and anon sessions
DROP POLICY IF EXISTS companies_policy ON public.companies;
CREATE POLICY companies_policy ON public.companies
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS branches_policy ON public.branches;
CREATE POLICY branches_policy ON public.branches
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS profiles_policy ON public.profiles;
CREATE POLICY profiles_policy ON public.profiles
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS user_company_memberships_policy ON public.user_company_memberships;
CREATE POLICY user_company_memberships_policy ON public.user_company_memberships
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

COMMIT;
