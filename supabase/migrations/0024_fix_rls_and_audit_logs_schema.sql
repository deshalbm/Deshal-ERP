-- Deshal ERP — Migration 0024: Fix RLS Policies for Anon & Application Sessions + Audit Logs Compatibility
-- Purpose:
--   1. Allow anonymous/application sessions to read and write core entities without HTTP 403 Forbidden errors when auth.uid() is null.
--   2. Ensure auth_user_company_ids() resolves active company IDs for non-JWT client operations.

BEGIN;

CREATE OR REPLACE FUNCTION public.auth_user_company_ids()
RETURNS SETOF UUID AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1. Customers RLS Policy
DROP POLICY IF EXISTS customers_policy ON public.customers;
CREATE POLICY customers_policy ON public.customers
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- 2. Audit Logs RLS Policies
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
    FOR SELECT TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()));

CREATE POLICY audit_logs_insert ON public.audit_logs
    FOR INSERT TO authenticated, anon
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- 3. POS Orders & Line Items Policies
DROP POLICY IF EXISTS pos_orders_policy ON public.pos_orders;
CREATE POLICY pos_orders_policy ON public.pos_orders
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS pos_order_items_policy ON public.pos_order_items;
CREATE POLICY pos_order_items_policy ON public.pos_order_items
    FOR ALL TO authenticated, anon
    USING (pos_order_id IN (SELECT id FROM public.pos_orders WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (pos_order_id IN (SELECT id FROM public.pos_orders WHERE company_id IN (SELECT public.auth_user_company_ids())));

-- 4. Cashier Shifts Policy
DROP POLICY IF EXISTS cashier_shifts_policy ON public.cashier_shifts;
CREATE POLICY cashier_shifts_policy ON public.cashier_shifts
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- 5. Spaces & Bookings Policies
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

-- 6. Invoices & Purchasing Policies
DROP POLICY IF EXISTS invoices_policy ON public.invoices;
CREATE POLICY invoices_policy ON public.invoices
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS purchase_orders_policy ON public.purchase_orders;
CREATE POLICY purchase_orders_policy ON public.purchase_orders
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS purchase_order_lines_policy ON public.purchase_order_lines;
CREATE POLICY purchase_order_lines_policy ON public.purchase_order_lines
    FOR ALL TO authenticated, anon
    USING (purchase_order_id IN (SELECT id FROM public.purchase_orders WHERE company_id IN (SELECT public.auth_user_company_ids())));

-- 7. Employees, Requests & Accounting Policies
DROP POLICY IF EXISTS employees_policy ON public.employees;
CREATE POLICY employees_policy ON public.employees
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS requests_policy ON public.requests;
CREATE POLICY requests_policy ON public.requests
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS request_types_policy ON public.request_types;
CREATE POLICY request_types_policy ON public.request_types
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS coa_policy ON public.chart_of_accounts;
CREATE POLICY coa_policy ON public.chart_of_accounts
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS fiscal_periods_policy ON public.fiscal_periods;
CREATE POLICY fiscal_periods_policy ON public.fiscal_periods
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS cost_centers_policy ON public.cost_centers;
CREATE POLICY cost_centers_policy ON public.cost_centers
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS companies_policy ON public.companies;
CREATE POLICY companies_policy ON public.companies
    FOR ALL TO authenticated, anon
    USING (id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS branches_policy ON public.branches;
CREATE POLICY branches_policy ON public.branches
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

COMMIT;
