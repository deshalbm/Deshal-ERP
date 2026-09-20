-- Deshal ERP — Migration 0036: Fix auth_user_company_ids & RLS Policies for Anon/Default Tenant Seeding
-- Purpose:
--   1. Ensure auth_user_company_ids() always returns default tenant company ID ('00000000-0000-0000-0000-000000000001')
--      to prevent RLS bootstrap deadlock when companies table is initially empty.
--   2. Grant explicit permissions so client REST API queries for companies, branches, employees, customers,
--      vouchers, spaces, products, kiosk devices, pos_orders, cashier_shifts can fetch and seed operational data.

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

DROP POLICY IF EXISTS cashier_shifts_policy ON public.cashier_shifts;
CREATE POLICY cashier_shifts_policy ON public.cashier_shifts
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

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

DROP POLICY IF EXISTS kiosk_devices_policy ON public.kiosk_devices;
CREATE POLICY kiosk_devices_policy ON public.kiosk_devices
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

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

DROP POLICY IF EXISTS products_policy ON public.products;
CREATE POLICY products_policy ON public.products
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS vouchers_policy ON public.vouchers;
CREATE POLICY vouchers_policy ON public.vouchers
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS spaces_policy ON public.spaces;
CREATE POLICY spaces_policy ON public.spaces
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS suppliers_policy ON public.suppliers;
CREATE POLICY suppliers_policy ON public.suppliers
    FOR ALL TO authenticated, anon
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

COMMIT;
