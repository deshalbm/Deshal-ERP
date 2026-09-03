-- ============================================================================
-- Deshal ERP
-- Migration 0021: Projects, Job Costing & Profitability
-- ============================================================================
-- Purpose:
--   Project management, job costing, commitments, actual costs, revenue,
--   profitability, project tasks and financial integration.
--
-- Designed for compatibility with the existing Deshal ERP architecture:
--   companies, branches, departments, employees, customers, cost_centers,
--   chart_of_accounts, journal_entries, journal_entry_lines, invoices, purchase_orders
--
-- Security:
--   Multi-company RLS based on public.auth_user_company_ids()
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PROJECTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    project_manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
    project_code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    start_date DATE,
    planned_end_date DATE,
    actual_end_date DATE,
    estimated_cost NUMERIC(15,3) NOT NULL DEFAULT 0,
    estimated_revenue NUMERIC(15,3) NOT NULL DEFAULT 0,
    committed_cost NUMERIC(15,3) NOT NULL DEFAULT 0,
    actual_cost NUMERIC(15,3) NOT NULL DEFAULT 0,
    actual_revenue NUMERIC(15,3) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_projects_company_code UNIQUE (company_id, project_code),
    CONSTRAINT chk_projects_status CHECK (
        status IN ('DRAFT', 'PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED')
    ),
    CONSTRAINT chk_projects_priority CHECK (
        priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    CONSTRAINT chk_projects_estimated_cost CHECK (estimated_cost >= 0),
    CONSTRAINT chk_projects_estimated_revenue CHECK (estimated_revenue >= 0),
    CONSTRAINT chk_projects_committed_cost CHECK (committed_cost >= 0),
    CONSTRAINT chk_projects_actual_cost CHECK (actual_cost >= 0),
    CONSTRAINT chk_projects_actual_revenue CHECK (actual_revenue >= 0),
    CONSTRAINT chk_projects_dates CHECK (
        planned_end_date IS NULL OR start_date IS NULL OR planned_end_date >= start_date
    )
);

CREATE INDEX IF NOT EXISTS idx_projects_company ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON public.projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(company_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON public.projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_cost_center ON public.projects(cost_center_id);

-- ============================================================================
-- 2. PROJECT TASKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
    assigned_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    task_code TEXT,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'TODO',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    estimated_hours NUMERIC(12,2) NOT NULL DEFAULT 0,
    actual_hours NUMERIC(12,2) NOT NULL DEFAULT 0,
    estimated_cost NUMERIC(15,3) NOT NULL DEFAULT 0,
    actual_cost NUMERIC(15,3) NOT NULL DEFAULT 0,
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_project_tasks_status CHECK (
        status IN ('TODO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED')
    ),
    CONSTRAINT chk_project_tasks_priority CHECK (
        priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    CONSTRAINT chk_project_tasks_progress CHECK (
        progress_percentage >= 0 AND progress_percentage <= 100
    ),
    CONSTRAINT chk_project_tasks_hours CHECK (
        estimated_hours >= 0 AND actual_hours >= 0
    ),
    CONSTRAINT chk_project_tasks_costs CHECK (
        estimated_cost >= 0 AND actual_cost >= 0
    ),
    CONSTRAINT chk_project_tasks_dates CHECK (
        due_date IS NULL OR start_date IS NULL OR due_date >= start_date
    )
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_employee ON public.project_tasks(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.project_tasks(project_id, status);

-- ============================================================================
-- 3. PROJECT COST TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_cost_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
    project_task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
    cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    journal_entry_line_id UUID REFERENCES public.journal_entry_lines(id) ON DELETE SET NULL,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type TEXT NOT NULL DEFAULT 'DIRECT_COST',
    source_type TEXT NOT NULL DEFAULT 'MANUAL',
    reference_number TEXT,
    description_ar TEXT,
    description_en TEXT,
    amount NUMERIC(15,3) NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    posted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_project_cost_amount CHECK (amount > 0),
    CONSTRAINT chk_project_cost_transaction_type CHECK (
        transaction_type IN ('DIRECT_COST', 'LABOR', 'MATERIAL', 'EQUIPMENT', 'SUBCONTRACT', 'OVERHEAD', 'OTHER')
    ),
    CONSTRAINT chk_project_cost_source_type CHECK (
        source_type IN ('MANUAL', 'JOURNAL_ENTRY', 'PURCHASE_ORDER', 'SUPPLIER_INVOICE', 'PAYROLL', 'OTHER')
    ),
    CONSTRAINT chk_project_cost_status CHECK (
        status IN ('DRAFT', 'POSTED', 'VOIDED')
    )
);

CREATE INDEX IF NOT EXISTS idx_project_cost_transactions_company ON public.project_cost_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_project_cost_transactions_project ON public.project_cost_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_cost_transactions_date ON public.project_cost_transactions(project_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_project_cost_transactions_status ON public.project_cost_transactions(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_cost_transactions_journal ON public.project_cost_transactions(journal_entry_id);

-- ============================================================================
-- 4. PROJECT COMMITMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    reference_number TEXT,
    commitment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description_ar TEXT,
    description_en TEXT,
    amount NUMERIC(15,3) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_project_commitment_amount CHECK (amount > 0),
    CONSTRAINT chk_project_commitment_status CHECK (
        status IN ('DRAFT', 'ACTIVE', 'FULFILLED', 'CANCELLED')
    )
);

CREATE INDEX IF NOT EXISTS idx_project_commitments_project ON public.project_commitments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_commitments_status ON public.project_commitments(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_commitments_purchase_order ON public.project_commitments(purchase_order_id);

-- ============================================================================
-- 5. PROJECT REVENUE TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_revenue_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source_type TEXT NOT NULL DEFAULT 'MANUAL',
    reference_number TEXT,
    description_ar TEXT,
    description_en TEXT,
    amount NUMERIC(15,3) NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    posted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_project_revenue_amount CHECK (amount > 0),
    CONSTRAINT chk_project_revenue_source_type CHECK (
        source_type IN ('MANUAL', 'INVOICE', 'JOURNAL_ENTRY', 'SALES_ORDER', 'OTHER')
    ),
    CONSTRAINT chk_project_revenue_status CHECK (
        status IN ('DRAFT', 'POSTED', 'VOIDED')
    )
);

CREATE INDEX IF NOT EXISTS idx_project_revenue_company ON public.project_revenue_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_project_revenue_project ON public.project_revenue_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_revenue_status ON public.project_revenue_transactions(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_revenue_invoice ON public.project_revenue_transactions(invoice_id);

-- ============================================================================
-- 6. PROJECT STATUS / COMPANY CONSISTENCY VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_project_company_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_company_id UUID;
BEGIN
    IF NEW.branch_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id FROM public.branches WHERE id = NEW.branch_id;
        IF v_company_id IS NULL OR v_company_id <> NEW.company_id THEN
            RAISE EXCEPTION 'Project branch must belong to the same company';
        END IF;
    END IF;

    IF NEW.department_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id FROM public.departments WHERE id = NEW.department_id;
        IF v_company_id IS NULL OR v_company_id <> NEW.company_id THEN
            RAISE EXCEPTION 'Project department must belong to the same company';
        END IF;
    END IF;

    IF NEW.customer_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id FROM public.customers WHERE id = NEW.customer_id;
        IF v_company_id IS NULL OR v_company_id <> NEW.company_id THEN
            RAISE EXCEPTION 'Project customer must belong to the same company';
        END IF;
    END IF;

    IF NEW.project_manager_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id FROM public.employees WHERE id = NEW.project_manager_id;
        IF v_company_id IS NULL OR v_company_id <> NEW.company_id THEN
            RAISE EXCEPTION 'Project manager must belong to the same company';
        END IF;
    END IF;

    IF NEW.cost_center_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id FROM public.cost_centers WHERE id = NEW.cost_center_id;
        IF v_company_id IS NULL OR v_company_id <> NEW.company_id THEN
            RAISE EXCEPTION 'Project cost center must belong to the same company';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_project_company_consistency ON public.projects;
CREATE TRIGGER trg_validate_project_company_consistency
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.validate_project_company_consistency();

-- ============================================================================
-- 7. PREVENT MODIFICATION OF CLOSED PROJECTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_project_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status IN ('CLOSED', 'CANCELLED') AND NEW.status = OLD.status THEN
        RAISE EXCEPTION 'Project % is locked and cannot be modified', OLD.project_code;
    END IF;

    IF TG_OP = 'DELETE' AND OLD.status IN ('ACTIVE', 'COMPLETED', 'CLOSED') THEN
        RAISE EXCEPTION 'Active, completed or closed projects cannot be deleted';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_locked_project_modification ON public.projects;
CREATE TRIGGER trg_prevent_locked_project_modification
BEFORE UPDATE OR DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_project_modification();

-- ============================================================================
-- 8. VALIDATE PROJECT TASK CONSISTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_project_task_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_project_company UUID;
    v_employee_company UUID;
    v_parent_project UUID;
BEGIN
    SELECT company_id INTO v_project_company FROM public.projects WHERE id = NEW.project_id;
    IF v_project_company IS NULL THEN
        RAISE EXCEPTION 'Project does not exist';
    END IF;

    IF NEW.assigned_employee_id IS NOT NULL THEN
        SELECT company_id INTO v_employee_company FROM public.employees WHERE id = NEW.assigned_employee_id;
        IF v_employee_company IS NULL OR v_employee_company <> v_project_company THEN
            RAISE EXCEPTION 'Assigned employee must belong to the same company as the project';
        END IF;
    END IF;

    IF NEW.parent_task_id IS NOT NULL THEN
        SELECT project_id INTO v_parent_project FROM public.project_tasks WHERE id = NEW.parent_task_id;
        IF v_parent_project IS NULL OR v_parent_project <> NEW.project_id THEN
            RAISE EXCEPTION 'Parent task must belong to the same project';
        END IF;

        IF NEW.parent_task_id = NEW.id THEN
            RAISE EXCEPTION 'Task cannot be its own parent';
        END IF;
    END IF;

    IF NEW.status = 'COMPLETED' THEN
        NEW.progress_percentage := 100;
        IF NEW.completed_at IS NULL THEN
            NEW.completed_at := now();
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_project_task_consistency ON public.project_tasks;
CREATE TRIGGER trg_validate_project_task_consistency
BEFORE INSERT OR UPDATE ON public.project_tasks
FOR EACH ROW EXECUTE FUNCTION public.validate_project_task_consistency();

-- ============================================================================
-- 9. VALIDATE PROJECT COST COMPANY CONSISTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_project_cost_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_project_company UUID;
    v_task_project UUID;
    v_cost_center_company UUID;
    v_journal_company UUID;
    v_purchase_company UUID;
BEGIN
    SELECT company_id INTO v_project_company FROM public.projects WHERE id = NEW.project_id;
    IF v_project_company IS NULL OR v_project_company <> NEW.company_id THEN
        RAISE EXCEPTION 'Project must belong to the same company as the cost transaction';
    END IF;

    IF NEW.project_task_id IS NOT NULL THEN
        SELECT project_id INTO v_task_project FROM public.project_tasks WHERE id = NEW.project_task_id;
        IF v_task_project IS NULL OR v_task_project <> NEW.project_id THEN
            RAISE EXCEPTION 'Project task must belong to the same project';
        END IF;
    END IF;

    IF NEW.cost_center_id IS NOT NULL THEN
        SELECT company_id INTO v_cost_center_company FROM public.cost_centers WHERE id = NEW.cost_center_id;
        IF v_cost_center_company IS NULL OR v_cost_center_company <> NEW.company_id THEN
            RAISE EXCEPTION 'Cost center must belong to the same company';
        END IF;
    END IF;

    IF NEW.journal_entry_id IS NOT NULL THEN
        SELECT company_id INTO v_journal_company FROM public.journal_entries WHERE id = NEW.journal_entry_id;
        IF v_journal_company IS NULL OR v_journal_company <> NEW.company_id THEN
            RAISE EXCEPTION 'Journal entry must belong to the same company';
        END IF;
    END IF;

    IF NEW.purchase_order_id IS NOT NULL THEN
        SELECT company_id INTO v_purchase_company FROM public.purchase_orders WHERE id = NEW.purchase_order_id;
        IF v_purchase_company IS NULL OR v_purchase_company <> NEW.company_id THEN
            RAISE EXCEPTION 'Purchase order must belong to the same company';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_project_cost_transaction ON public.project_cost_transactions;
CREATE TRIGGER trg_validate_project_cost_transaction
BEFORE INSERT OR UPDATE ON public.project_cost_transactions
FOR EACH ROW EXECUTE FUNCTION public.validate_project_cost_transaction();

-- ============================================================================
-- 10. VALIDATE PROJECT REVENUE COMPANY CONSISTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_project_revenue_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_project_company UUID;
    v_invoice_company UUID;
    v_journal_company UUID;
BEGIN
    SELECT company_id INTO v_project_company FROM public.projects WHERE id = NEW.project_id;
    IF v_project_company IS NULL OR v_project_company <> NEW.company_id THEN
        RAISE EXCEPTION 'Project must belong to the same company as the revenue transaction';
    END IF;

    IF NEW.invoice_id IS NOT NULL THEN
        SELECT company_id INTO v_invoice_company FROM public.invoices WHERE id = NEW.invoice_id;
        IF v_invoice_company IS NULL OR v_invoice_company <> NEW.company_id THEN
            RAISE EXCEPTION 'Invoice must belong to the same company';
        END IF;
    END IF;

    IF NEW.journal_entry_id IS NOT NULL THEN
        SELECT company_id INTO v_journal_company FROM public.journal_entries WHERE id = NEW.journal_entry_id;
        IF v_journal_company IS NULL OR v_journal_company <> NEW.company_id THEN
            RAISE EXCEPTION 'Journal entry must belong to the same company';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_project_revenue_transaction ON public.project_revenue_transactions;
CREATE TRIGGER trg_validate_project_revenue_transaction
BEFORE INSERT OR UPDATE ON public.project_revenue_transactions
FOR EACH ROW EXECUTE FUNCTION public.validate_project_revenue_transaction();

-- ============================================================================
-- 11. VALIDATE PROJECT COMMITMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_project_commitment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_project_company UUID;
    v_purchase_company UUID;
BEGIN
    SELECT company_id INTO v_project_company FROM public.projects WHERE id = NEW.project_id;
    IF v_project_company IS NULL OR v_project_company <> NEW.company_id THEN
        RAISE EXCEPTION 'Project must belong to the same company';
    END IF;

    IF NEW.purchase_order_id IS NOT NULL THEN
        SELECT company_id INTO v_purchase_company FROM public.purchase_orders WHERE id = NEW.purchase_order_id;
        IF v_purchase_company IS NULL OR v_purchase_company <> NEW.company_id THEN
            RAISE EXCEPTION 'Purchase order must belong to the same company';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_project_commitment ON public.project_commitments;
CREATE TRIGGER trg_validate_project_commitment
BEFORE INSERT OR UPDATE ON public.project_commitments
FOR EACH ROW EXECUTE FUNCTION public.validate_project_commitment();

-- ============================================================================
-- 12. PROJECT TOTALS SYNCHRONIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_project_financial_totals(
    p_project_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_committed NUMERIC(15,3);
    v_actual_cost NUMERIC(15,3);
    v_actual_revenue NUMERIC(15,3);
BEGIN
    SELECT COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN amount ELSE 0 END), 0)
    INTO v_committed
    FROM public.project_commitments
    WHERE project_id = p_project_id;

    SELECT COALESCE(SUM(CASE WHEN status = 'POSTED' THEN amount ELSE 0 END), 0)
    INTO v_actual_cost
    FROM public.project_cost_transactions
    WHERE project_id = p_project_id;

    SELECT COALESCE(SUM(CASE WHEN status = 'POSTED' THEN amount ELSE 0 END), 0)
    INTO v_actual_revenue
    FROM public.project_revenue_transactions
    WHERE project_id = p_project_id;

    UPDATE public.projects
    SET committed_cost = v_committed,
        actual_cost = v_actual_cost,
        actual_revenue = v_actual_revenue,
        updated_at = now()
    WHERE id = p_project_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_sync_project_commitment_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.sync_project_financial_totals(OLD.project_id);
        RETURN OLD;
    END IF;

    PERFORM public.sync_project_financial_totals(NEW.project_id);

    IF TG_OP = 'UPDATE' AND OLD.project_id <> NEW.project_id THEN
        PERFORM public.sync_project_financial_totals(OLD.project_id);
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_sync_project_cost_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.sync_project_financial_totals(OLD.project_id);
        RETURN OLD;
    END IF;

    PERFORM public.sync_project_financial_totals(NEW.project_id);

    IF TG_OP = 'UPDATE' AND OLD.project_id <> NEW.project_id THEN
        PERFORM public.sync_project_financial_totals(OLD.project_id);
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_sync_project_revenue_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.sync_project_financial_totals(OLD.project_id);
        RETURN OLD;
    END IF;

    PERFORM public.sync_project_financial_totals(NEW.project_id);

    IF TG_OP = 'UPDATE' AND OLD.project_id <> NEW.project_id THEN
        PERFORM public.sync_project_financial_totals(OLD.project_id);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_project_commitment_totals ON public.project_commitments;
CREATE TRIGGER trg_sync_project_commitment_totals
AFTER INSERT OR UPDATE OR DELETE ON public.project_commitments
FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_project_commitment_totals();

DROP TRIGGER IF EXISTS trg_sync_project_cost_totals ON public.project_cost_transactions;
CREATE TRIGGER trg_sync_project_cost_totals
AFTER INSERT OR UPDATE OR DELETE ON public.project_cost_transactions
FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_project_cost_totals();

DROP TRIGGER IF EXISTS trg_sync_project_revenue_totals ON public.project_revenue_transactions;
CREATE TRIGGER trg_sync_project_revenue_totals
AFTER INSERT OR UPDATE OR DELETE ON public.project_revenue_transactions
FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_project_revenue_totals();

-- ============================================================================
-- 13. PREVENT MODIFICATION OF POSTED COST TRANSACTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_posted_project_cost_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status = 'POSTED' AND NEW.status <> 'VOIDED' THEN
        RAISE EXCEPTION 'Posted project cost transactions cannot be modified';
    END IF;

    IF TG_OP = 'DELETE' AND OLD.status = 'POSTED' THEN
        RAISE EXCEPTION 'Posted project cost transactions cannot be deleted';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_posted_project_cost_modification ON public.project_cost_transactions;
CREATE TRIGGER trg_prevent_posted_project_cost_modification
BEFORE UPDATE OR DELETE ON public.project_cost_transactions
FOR EACH ROW EXECUTE FUNCTION public.prevent_posted_project_cost_modification();

-- ============================================================================
-- 14. PREVENT MODIFICATION OF POSTED REVENUE TRANSACTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_posted_project_revenue_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status = 'POSTED' AND NEW.status <> 'VOIDED' THEN
        RAISE EXCEPTION 'Posted project revenue transactions cannot be modified';
    END IF;

    IF TG_OP = 'DELETE' AND OLD.status = 'POSTED' THEN
        RAISE EXCEPTION 'Posted project revenue transactions cannot be deleted';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_posted_project_revenue_modification ON public.project_revenue_transactions;
CREATE TRIGGER trg_prevent_posted_project_revenue_modification
BEFORE UPDATE OR DELETE ON public.project_revenue_transactions
FOR EACH ROW EXECUTE FUNCTION public.prevent_posted_project_revenue_modification();

-- ============================================================================
-- 15. AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_project_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_project_updated_at();

DROP TRIGGER IF EXISTS trg_project_tasks_updated_at ON public.project_tasks;
CREATE TRIGGER trg_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_project_updated_at();

DROP TRIGGER IF EXISTS trg_project_cost_transactions_updated_at ON public.project_cost_transactions;
CREATE TRIGGER trg_project_cost_transactions_updated_at BEFORE UPDATE ON public.project_cost_transactions
FOR EACH ROW EXECUTE FUNCTION public.set_project_updated_at();

DROP TRIGGER IF EXISTS trg_project_commitments_updated_at ON public.project_commitments;
CREATE TRIGGER trg_project_commitments_updated_at BEFORE UPDATE ON public.project_commitments
FOR EACH ROW EXECUTE FUNCTION public.set_project_updated_at();

DROP TRIGGER IF EXISTS trg_project_revenue_transactions_updated_at ON public.project_revenue_transactions;
CREATE TRIGGER trg_project_revenue_transactions_updated_at BEFORE UPDATE ON public.project_revenue_transactions
FOR EACH ROW EXECUTE FUNCTION public.set_project_updated_at();

-- ============================================================================
-- 16. PROJECT PROFITABILITY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.v_project_profitability
WITH (security_invoker = true)
AS
SELECT
    p.id AS project_id,
    p.company_id,
    p.project_code,
    p.name_ar,
    p.name_en,
    p.status,
    p.customer_id,
    p.project_manager_id,
    p.cost_center_id,
    p.start_date,
    p.planned_end_date,
    p.actual_end_date,
    p.estimated_cost,
    p.estimated_revenue,
    p.committed_cost,
    p.actual_cost,
    p.actual_revenue,
    (p.actual_revenue - p.actual_cost) AS gross_profit,
    CASE
        WHEN p.actual_revenue > 0 THEN ROUND(((p.actual_revenue - p.actual_cost) / p.actual_revenue) * 100, 2)
        ELSE 0
    END AS profit_margin_percentage,
    (p.estimated_revenue - p.estimated_cost) AS estimated_profit,
    CASE
        WHEN p.estimated_revenue > 0 THEN ROUND(((p.estimated_revenue - p.estimated_cost) / p.estimated_revenue) * 100, 2)
        ELSE 0
    END AS estimated_profit_margin_percentage,
    (p.estimated_cost - p.actual_cost) AS cost_variance,
    (p.estimated_revenue - p.actual_revenue) AS revenue_variance,
    CASE
        WHEN p.actual_cost > p.estimated_cost THEN 'OVER_BUDGET'
        WHEN p.actual_cost >= p.estimated_cost * 0.80 THEN 'WARNING'
        ELSE 'NORMAL'
    END AS cost_health
FROM public.projects p;

-- ============================================================================
-- 17. PROJECT TASK PROGRESS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.v_project_task_progress
WITH (security_invoker = true)
AS
SELECT
    p.id AS project_id,
    p.company_id,
    p.project_code,
    p.name_ar AS project_name_ar,
    p.name_en AS project_name_en,
    COUNT(t.id) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED') AS completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'IN_PROGRESS') AS in_progress_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'ON_HOLD') AS on_hold_tasks,
    COALESCE(ROUND(AVG(t.progress_percentage), 2), 0) AS average_progress_percentage,
    COALESCE(SUM(t.estimated_cost), 0) AS task_estimated_cost,
    COALESCE(SUM(t.actual_cost), 0) AS task_actual_cost
FROM public.projects p
LEFT JOIN public.project_tasks t ON t.project_id = p.id
GROUP BY p.id, p.company_id, p.project_code, p.name_ar, p.name_en;

-- ============================================================================
-- 18. RLS
-- ============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_cost_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_revenue_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_policy ON public.projects;
CREATE POLICY projects_policy ON public.projects FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS project_tasks_policy ON public.project_tasks;
CREATE POLICY project_tasks_policy ON public.project_tasks FOR ALL TO authenticated
    USING (project_id IN (SELECT id FROM public.projects WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS project_cost_transactions_policy ON public.project_cost_transactions;
CREATE POLICY project_cost_transactions_policy ON public.project_cost_transactions FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS project_commitments_policy ON public.project_commitments;
CREATE POLICY project_commitments_policy ON public.project_commitments FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS project_revenue_transactions_policy ON public.project_revenue_transactions;
CREATE POLICY project_revenue_transactions_policy ON public.project_revenue_transactions FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- ============================================================================
-- 19. FUNCTION SECURITY
-- ============================================================================

REVOKE ALL ON FUNCTION public.validate_project_company_consistency() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_locked_project_modification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_project_task_consistency() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_project_cost_transaction() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_project_revenue_transaction() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_project_commitment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_project_financial_totals(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_sync_project_commitment_totals() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_sync_project_cost_totals() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_sync_project_revenue_totals() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_posted_project_cost_modification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_posted_project_revenue_modification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_project_updated_at() FROM PUBLIC, anon, authenticated;

COMMIT;
