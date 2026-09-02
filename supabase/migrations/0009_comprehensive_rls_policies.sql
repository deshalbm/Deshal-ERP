-- Deshal ERP — Migration 0009: Comprehensive Row Level Security (RLS) Policy Matrix
-- Purpose: Provide explicit, best-practice RLS policies for ALL 38 tables to eliminate "Unrestricted" / "No Policies" warnings in Supabase Studio.

BEGIN;

-- ============================================================================
-- 1. Helper Security Functions (Optimized with SECURITY DEFINER & STABLE)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auth_user_company_ids()
RETURNS SETOF UUID AS $$
  SELECT company_id 
  FROM public.user_company_memberships 
  WHERE user_id = (SELECT auth.uid()) AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_employee_id()
RETURNS UUID AS $$
  SELECT employee_id 
  FROM public.profiles 
  WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 2. Organization & Identity Domain RLS Policies
-- ============================================================================

-- companies
DROP POLICY IF EXISTS companies_policy ON public.companies;
CREATE POLICY companies_policy ON public.companies
    FOR ALL TO authenticated
    USING (id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (id IN (SELECT public.auth_user_company_ids()));

-- branches
DROP POLICY IF EXISTS branches_policy ON public.branches;
CREATE POLICY branches_policy ON public.branches
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- departments
DROP POLICY IF EXISTS departments_policy ON public.departments;
CREATE POLICY departments_policy ON public.departments
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- profiles
DROP POLICY IF EXISTS profiles_policy ON public.profiles;
CREATE POLICY profiles_policy ON public.profiles
    FOR ALL TO authenticated
    USING (id = (SELECT auth.uid()) OR company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (id = (SELECT auth.uid()) OR company_id IN (SELECT public.auth_user_company_ids()));

-- user_company_memberships
DROP POLICY IF EXISTS memberships_policy ON public.user_company_memberships;
CREATE POLICY memberships_policy ON public.user_company_memberships
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()) OR company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- roles
DROP POLICY IF EXISTS roles_policy ON public.roles;
CREATE POLICY roles_policy ON public.roles
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- permissions (Public Catalog Read)
DROP POLICY IF EXISTS permissions_read_policy ON public.permissions;
CREATE POLICY permissions_read_policy ON public.permissions
    FOR SELECT TO authenticated
    USING (true);

-- role_permissions
DROP POLICY IF EXISTS role_permissions_policy ON public.role_permissions;
CREATE POLICY role_permissions_policy ON public.role_permissions
    FOR ALL TO authenticated
    USING (role_id IN (SELECT id FROM public.roles WHERE company_id IN (SELECT public.auth_user_company_ids())));

-- user_roles
DROP POLICY IF EXISTS user_roles_policy ON public.user_roles;
CREATE POLICY user_roles_policy ON public.user_roles
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()) OR role_id IN (SELECT id FROM public.roles WHERE company_id IN (SELECT public.auth_user_company_ids())));

-- ============================================================================
-- 3. Customer Core & CRM RLS Policies
-- ============================================================================

-- customers
DROP POLICY IF EXISTS customers_policy ON public.customers;
CREATE POLICY customers_policy ON public.customers
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- contacts
DROP POLICY IF EXISTS contacts_policy ON public.contacts;
CREATE POLICY contacts_policy ON public.contacts
    FOR ALL TO authenticated
    USING (customer_id IN (SELECT id FROM public.customers WHERE company_id IN (SELECT public.auth_user_company_ids())));

-- pipeline_stages
DROP POLICY IF EXISTS pipeline_stages_policy ON public.pipeline_stages;
CREATE POLICY pipeline_stages_policy ON public.pipeline_stages
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- opportunities
DROP POLICY IF EXISTS opportunities_policy ON public.opportunities;
CREATE POLICY opportunities_policy ON public.opportunities
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- activities
DROP POLICY IF EXISTS activities_policy ON public.activities;
CREATE POLICY activities_policy ON public.activities
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- ============================================================================
-- 4. Accounting Kernel RLS Policies
-- ============================================================================

-- chart_of_accounts
DROP POLICY IF EXISTS coa_policy ON public.chart_of_accounts;
CREATE POLICY coa_policy ON public.chart_of_accounts
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- cost_centers
DROP POLICY IF EXISTS cost_centers_policy ON public.cost_centers;
CREATE POLICY cost_centers_policy ON public.cost_centers
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- fiscal_periods
DROP POLICY IF EXISTS fiscal_periods_policy ON public.fiscal_periods;
CREATE POLICY fiscal_periods_policy ON public.fiscal_periods
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- journal_entries (Strict Draft Edit Isolation)
DROP POLICY IF EXISTS journal_entries_select ON public.journal_entries;
CREATE POLICY journal_entries_select ON public.journal_entries
    FOR SELECT TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS journal_entries_insert ON public.journal_entries;
CREATE POLICY journal_entries_insert ON public.journal_entries
    FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS journal_entries_update ON public.journal_entries;
CREATE POLICY journal_entries_update ON public.journal_entries
    FOR UPDATE TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()) AND status = 'DRAFT')
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()) AND status = 'DRAFT');

DROP POLICY IF EXISTS journal_entries_delete ON public.journal_entries;
CREATE POLICY journal_entries_delete ON public.journal_entries
    FOR DELETE TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()) AND status = 'DRAFT');

-- journal_entry_lines
DROP POLICY IF EXISTS journal_lines_select ON public.journal_entry_lines;
CREATE POLICY journal_lines_select ON public.journal_entry_lines
    FOR SELECT TO authenticated
    USING (journal_entry_id IN (SELECT id FROM public.journal_entries WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS journal_lines_write ON public.journal_entry_lines;
CREATE POLICY journal_lines_write ON public.journal_entry_lines
    FOR ALL TO authenticated
    USING (journal_entry_id IN (SELECT id FROM public.journal_entries WHERE company_id IN (SELECT public.auth_user_company_ids()) AND status = 'DRAFT'));

-- bank_accounts
DROP POLICY IF EXISTS bank_accounts_policy ON public.bank_accounts;
CREATE POLICY bank_accounts_policy ON public.bank_accounts
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- invoices
DROP POLICY IF EXISTS invoices_policy ON public.invoices;
CREATE POLICY invoices_policy ON public.invoices
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- ============================================================================
-- 5. HR & Workforce RLS Policies
-- ============================================================================

-- employees
DROP POLICY IF EXISTS employees_policy ON public.employees;
CREATE POLICY employees_policy ON public.employees
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- kiosk_devices
DROP POLICY IF EXISTS kiosk_devices_policy ON public.kiosk_devices;
CREATE POLICY kiosk_devices_policy ON public.kiosk_devices
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- attendance_movement_logs
DROP POLICY IF EXISTS attendance_logs_policy ON public.attendance_movement_logs;
CREATE POLICY attendance_logs_policy ON public.attendance_movement_logs
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- payroll_slips
DROP POLICY IF EXISTS payroll_slips_policy ON public.payroll_slips;
CREATE POLICY payroll_slips_policy ON public.payroll_slips
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()) OR employee_id = public.auth_user_employee_id())
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- leave_requests
DROP POLICY IF EXISTS leave_requests_policy ON public.leave_requests;
CREATE POLICY leave_requests_policy ON public.leave_requests
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()) OR employee_id = public.auth_user_employee_id())
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()) OR employee_id = public.auth_user_employee_id());

-- ============================================================================
-- 6. Operational Suites (Spaces, Leasing, Products, Inventory, Purchasing) RLS Policies
-- ============================================================================

-- spaces
DROP POLICY IF EXISTS spaces_policy ON public.spaces;
CREATE POLICY spaces_policy ON public.spaces
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- space_bookings
DROP POLICY IF EXISTS space_bookings_policy ON public.space_bookings;
CREATE POLICY space_bookings_policy ON public.space_bookings
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- lease_contracts
DROP POLICY IF EXISTS lease_contracts_policy ON public.lease_contracts;
CREATE POLICY lease_contracts_policy ON public.lease_contracts
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- products
DROP POLICY IF EXISTS products_policy ON public.products;
CREATE POLICY products_policy ON public.products
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- warehouses
DROP POLICY IF EXISTS warehouses_policy ON public.warehouses;
CREATE POLICY warehouses_policy ON public.warehouses
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- stock_balances
DROP POLICY IF EXISTS stock_balances_policy ON public.stock_balances;
CREATE POLICY stock_balances_policy ON public.stock_balances
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- suppliers
DROP POLICY IF EXISTS suppliers_policy ON public.suppliers;
CREATE POLICY suppliers_policy ON public.suppliers
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- purchase_orders
DROP POLICY IF EXISTS purchase_orders_policy ON public.purchase_orders;
CREATE POLICY purchase_orders_policy ON public.purchase_orders
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- ============================================================================
-- 7. Dynamic Requests Engine, Documents & System Audit RLS Policies
-- ============================================================================

-- request_types
DROP POLICY IF EXISTS request_types_policy ON public.request_types;
CREATE POLICY request_types_policy ON public.request_types
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- requests
DROP POLICY IF EXISTS requests_policy ON public.requests;
CREATE POLICY requests_policy ON public.requests
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- documents
DROP POLICY IF EXISTS documents_policy ON public.documents;
CREATE POLICY documents_policy ON public.documents
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- audit_logs (Append-Only Enforcement)
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
    FOR SELECT TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- system_settings
DROP POLICY IF EXISTS system_settings_policy ON public.system_settings;
CREATE POLICY system_settings_policy ON public.system_settings
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

COMMIT;
