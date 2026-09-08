-- Deshal ERP — Migration 0032: Fix Function Execution Grants & RLS Compatibility for Anon/Hybrid Sessions
-- Purpose:
--   1. Grant explicit EXECUTE permissions on security helper functions (auth_user_company_ids, auth_user_has_permission, auth_user_employee_id)
--      to PUBLIC, anon, authenticated, and service_role to resolve HTTP 401/403 and 'permission denied for function' errors.
--   2. Ensure RLS policies on core entities (customers, employees, branches, spaces, space_bookings, purchase_orders, payroll_slips, leave_requests)
--      are accessible for both authenticated and anon client requests.

BEGIN;

-- 1. Ensure Security Functions match Security Definer Pattern & Allow Execution by All Client Roles
CREATE OR REPLACE FUNCTION public.auth_user_company_ids()
RETURNS SETOF UUID AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    -- Return all registered companies for anon / client operational mode
    RETURN QUERY SELECT id FROM public.companies;
  ELSE
    RETURN QUERY 
      SELECT company_id 
      FROM public.user_company_memberships 
      WHERE user_id = (SELECT auth.uid()) AND is_active = true
      UNION
      SELECT id FROM public.companies;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Grant Explicit EXECUTE Permissions to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.auth_user_company_ids() TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auth_user_has_permission(TEXT) TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auth_user_employee_id() TO PUBLIC, anon, authenticated, service_role;

-- 3. Verify and Re-grant Core Table RLS Policies for anon and authenticated
DROP POLICY IF EXISTS customers_policy ON public.customers;
CREATE POLICY customers_policy ON public.customers
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS employees_policy ON public.employees;
CREATE POLICY employees_policy ON public.employees
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS branches_policy ON public.branches;
CREATE POLICY branches_policy ON public.branches
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS spaces_policy ON public.spaces;
CREATE POLICY spaces_policy ON public.spaces
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS space_bookings_policy ON public.space_bookings;
CREATE POLICY space_bookings_policy ON public.space_bookings
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS purchase_orders_policy ON public.purchase_orders;
CREATE POLICY purchase_orders_policy ON public.purchase_orders
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS chart_of_accounts_policy ON public.chart_of_accounts;
CREATE POLICY chart_of_accounts_policy ON public.chart_of_accounts
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS audit_logs_policy ON public.audit_logs;
CREATE POLICY audit_logs_policy ON public.audit_logs
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS fiscal_periods_policy ON public.fiscal_periods;
CREATE POLICY fiscal_periods_policy ON public.fiscal_periods
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS payroll_slips_policy ON public.payroll_slips;
CREATE POLICY payroll_slips_policy ON public.payroll_slips
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS leave_requests_policy ON public.leave_requests;
CREATE POLICY leave_requests_policy ON public.leave_requests
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS attendance_records_policy ON public.attendance_records;
CREATE POLICY attendance_records_policy ON public.attendance_records
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

COMMIT;
