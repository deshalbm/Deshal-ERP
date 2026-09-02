-- Deshal ERP — Migration 0007: Security Functions, RLS Policies & Triggers
-- Purpose: Row Level Security, Multi-Tenant Scoping, Audit Immutability, Posted Entry Protection

BEGIN;

-- ============================================================================
-- 1. Helper Security Functions
-- ============================================================================

-- Helper 1: Returns list of company IDs authorized for the logged in auth user
CREATE OR REPLACE FUNCTION public.auth_user_company_ids()
RETURNS SETOF UUID AS $$
  SELECT company_id 
  FROM public.user_company_memberships 
  WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper 2: Verifies if current auth user holds a string permission code
CREATE OR REPLACE FUNCTION public.auth_user_has_permission(p_permission TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid() 
      AND p.code = p_permission
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper 3: Returns employee ID linked to current auth user
CREATE OR REPLACE FUNCTION public.auth_user_employee_id()
RETURNS UUID AS $$
  SELECT employee_id 
  FROM public.profiles 
  WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 2. Enable Row Level Security (RLS) on All Tables
-- ============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_movement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.request_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Core RLS Policies (Tenant Isolation & Authorization)
-- ============================================================================

-- Companies RLS Policy
CREATE POLICY companies_select_policy ON public.companies
    FOR SELECT USING (id IN (SELECT auth_user_company_ids()));

-- Profiles RLS Policy
CREATE POLICY profiles_select_policy ON public.profiles
    FOR SELECT USING (company_id IN (SELECT auth_user_company_ids()));

CREATE POLICY profiles_update_policy ON public.profiles
    FOR UPDATE USING (id = auth.uid() OR company_id IN (SELECT auth_user_company_ids()));

-- Customers RLS Policy
CREATE POLICY customers_all_policy ON public.customers
    FOR ALL USING (company_id IN (SELECT auth_user_company_ids()));

-- Employees RLS Policy
CREATE POLICY employees_all_policy ON public.employees
    FOR ALL USING (company_id IN (SELECT auth_user_company_ids()));

-- Chart of Accounts RLS Policy
CREATE POLICY coa_all_policy ON public.chart_of_accounts
    FOR ALL USING (company_id IN (SELECT auth_user_company_ids()));

-- Journal Entries RLS Policy (DRAFT ONLY FOR UPDATE)
CREATE POLICY journal_entries_select_policy ON public.journal_entries
    FOR SELECT USING (company_id IN (SELECT auth_user_company_ids()));

CREATE POLICY journal_entries_insert_policy ON public.journal_entries
    FOR INSERT WITH CHECK (company_id IN (SELECT auth_user_company_ids()));

CREATE POLICY journal_entries_update_policy ON public.journal_entries
    FOR UPDATE USING (
        company_id IN (SELECT auth_user_company_ids())
        AND status = 'DRAFT'
    );

-- Audit Logs RLS Policy (Append-Only: SELECT and INSERT permitted, UPDATE and DELETE DENIED)
CREATE POLICY audit_logs_select_policy ON public.audit_logs
    FOR SELECT USING (company_id IN (SELECT auth_user_company_ids()));

CREATE POLICY audit_logs_insert_policy ON public.audit_logs
    FOR INSERT WITH CHECK (company_id IN (SELECT auth_user_company_ids()));

-- ============================================================================
-- 4. Financial Integrity Triggers & Protections
-- ============================================================================

-- Function: Prevent updating or deleting posted accounting entries
CREATE OR REPLACE FUNCTION public.prevent_posted_journal_entry_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'POSTED' OR OLD.status = 'LOCKED' THEN
        RAISE EXCEPTION 'Financial Integrity Violation: Cannot modify or delete a POSTED or LOCKED journal entry (Entry ID: %). Use a Reversal or Adjusting entry instead.', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Enforce posted entry modification block
DROP TRIGGER IF EXISTS trg_prevent_posted_journal_entry_update ON public.journal_entries;
CREATE TRIGGER trg_prevent_posted_journal_entry_update
    BEFORE UPDATE OR DELETE ON public.journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_posted_journal_entry_modification();

COMMIT;
