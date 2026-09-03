-- ============================================================================
-- Deshal ERP
-- Migration 0020: Budgeting, Financial Planning & Budget Control
--
-- Purpose:
--   1. Annual / fiscal budgeting
--   2. Budget versions and approval lifecycle
--   3. Budget lines by account, cost center and fiscal period
--   4. Budget commitments from procurement
--   5. Actual consumption from posted journal entries
--   6. Budget vs Actual calculations
--   7. Overspend control
--   8. RLS and financial integrity hardening
--
-- Lifecycle:
--   DRAFT -> SUBMITTED -> APPROVED -> ACTIVE -> CLOSED
--
-- Compatible with migrations 0001 - 0019
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. BUDGETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    fiscal_year INTEGER NOT NULL,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'OMR',
    status TEXT NOT NULL DEFAULT 'DRAFT',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_budget_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_committed_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_actual_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_budgets_company_code UNIQUE (company_id, code),
    CONSTRAINT chk_budgets_status CHECK (
        status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE', 'CLOSED', 'CANCELLED')
    ),
    CONSTRAINT chk_budgets_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_budgets_fiscal_year CHECK (fiscal_year >= 2000),
    CONSTRAINT chk_budgets_amounts CHECK (
        total_budget_amount >= 0 AND total_committed_amount >= 0 AND total_actual_amount >= 0
    )
);

-- ============================================================================
-- 2. BUDGET VERSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budget_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    is_current BOOLEAN NOT NULL DEFAULT false,
    total_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_budget_versions_number UNIQUE (budget_id, version_number),
    CONSTRAINT chk_budget_versions_number CHECK (version_number > 0),
    CONSTRAINT chk_budget_versions_status CHECK (
        status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'CLOSED', 'CANCELLED')
    ),
    CONSTRAINT chk_budget_versions_total CHECK (total_amount >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_budget_versions_one_current
ON public.budget_versions(budget_id)
WHERE is_current = true;

-- ============================================================================
-- 3. BUDGET LINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budget_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_version_id UUID NOT NULL REFERENCES public.budget_versions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
    cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE RESTRICT,
    fiscal_period_id UUID REFERENCES public.fiscal_periods(id) ON DELETE RESTRICT,
    description_ar TEXT,
    description_en TEXT,
    budget_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    committed_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    actual_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    available_amount NUMERIC(15,3) GENERATED ALWAYS AS (
        budget_amount - committed_amount - actual_amount
    ) STORED,
    alert_threshold_percentage NUMERIC(5,2) NOT NULL DEFAULT 80.00,
    block_overspend BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_budget_lines_amounts CHECK (
        budget_amount >= 0 AND committed_amount >= 0 AND actual_amount >= 0
    ),
    CONSTRAINT chk_budget_lines_alert_threshold CHECK (
        alert_threshold_percentage >= 0 AND alert_threshold_percentage <= 100
    )
);

-- ============================================================================
-- 4. BUDGET COMMITMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budget_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    budget_line_id UUID NOT NULL REFERENCES public.budget_lines(id) ON DELETE RESTRICT,
    source_type TEXT NOT NULL,
    source_id UUID,
    commitment_number TEXT NOT NULL,
    commitment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15,3) NOT NULL,
    released_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    description_ar TEXT,
    description_en TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    released_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_budget_commitments_number UNIQUE (company_id, commitment_number),
    CONSTRAINT chk_budget_commitments_source CHECK (
        source_type IN ('PURCHASE_ORDER', 'SUPPLIER_INVOICE', 'ASSET', 'PAYROLL', 'MANUAL', 'OTHER')
    ),
    CONSTRAINT chk_budget_commitments_status CHECK (
        status IN ('DRAFT', 'ACTIVE', 'PARTIALLY_RELEASED', 'RELEASED', 'CANCELLED')
    ),
    CONSTRAINT chk_budget_commitments_amount CHECK (
        amount > 0 AND released_amount >= 0 AND released_amount <= amount
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_budget_commitments_source
ON public.budget_commitments (company_id, source_type, source_id)
WHERE source_id IS NOT NULL AND status <> 'CANCELLED';

-- ============================================================================
-- 5. BUDGET ACTUAL TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budget_actual_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    budget_line_id UUID NOT NULL REFERENCES public.budget_lines(id) ON DELETE RESTRICT,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE RESTRICT,
    journal_entry_line_id UUID NOT NULL REFERENCES public.journal_entry_lines(id) ON DELETE RESTRICT,
    transaction_date DATE NOT NULL,
    amount NUMERIC(15,3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_budget_actual_transaction_line UNIQUE (budget_line_id, journal_entry_line_id),
    CONSTRAINT chk_budget_actual_transaction_amount CHECK (amount <> 0)
);

-- ============================================================================
-- 6. UPDATED_AT HELPER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_budgeting_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. BUDGET VERSION TOTAL SYNCHRONIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_budget_version_total()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_budget_version_id UUID;
BEGIN
    v_budget_version_id := COALESCE(NEW.budget_version_id, OLD.budget_version_id);

    UPDATE public.budget_versions
    SET total_amount = COALESCE(
            (SELECT SUM(budget_amount) FROM public.budget_lines WHERE budget_version_id = v_budget_version_id),
            0
        ),
        updated_at = now()
    WHERE id = v_budget_version_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. BUDGET HEADER TOTAL SYNCHRONIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_budget_header_total()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_budget_id UUID;
BEGIN
    v_budget_id := COALESCE(NEW.budget_id, OLD.budget_id);

    UPDATE public.budgets b
    SET total_budget_amount = COALESCE(
            (
                SELECT total_amount FROM public.budget_versions
                WHERE id = (
                    SELECT id FROM public.budget_versions
                    WHERE budget_id = v_budget_id AND is_current = true
                    ORDER BY version_number DESC LIMIT 1
                )
            ), 0
        ),
        total_committed_amount = COALESCE(
            (
                SELECT SUM(bl.committed_amount)
                FROM public.budget_lines bl
                JOIN public.budget_versions bv ON bv.id = bl.budget_version_id
                WHERE bv.budget_id = v_budget_id AND bv.is_current = true
            ), 0
        ),
        total_actual_amount = COALESCE(
            (
                SELECT SUM(bl.actual_amount)
                FROM public.budget_lines bl
                JOIN public.budget_versions bv ON bv.id = bl.budget_version_id
                WHERE bv.budget_id = v_budget_id AND bv.is_current = true
            ), 0
        ),
        updated_at = now()
    WHERE b.id = v_budget_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. PREVENT MODIFICATION OF LOCKED BUDGETS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_budget_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status IN ('CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Budget Integrity Violation: Closed or cancelled budgets cannot be modified.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. PREVENT MODIFICATION OF LOCKED BUDGET LINES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_budget_line_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT b.status INTO v_status
    FROM public.budget_versions bv
    JOIN public.budgets b ON b.id = bv.budget_id
    WHERE bv.id = COALESCE(NEW.budget_version_id, OLD.budget_version_id);

    IF v_status IN ('CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Budget Integrity Violation: Budget lines cannot be modified because the budget is closed or cancelled.';
    END IF;

    IF v_status IN ('ACTIVE', 'APPROVED') THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'Budget Integrity Violation: Cannot delete budget lines from an approved or active budget.';
        END IF;

        IF NEW.account_id IS DISTINCT FROM OLD.account_id
           OR NEW.branch_id IS DISTINCT FROM OLD.branch_id
           OR NEW.department_id IS DISTINCT FROM OLD.department_id
           OR NEW.cost_center_id IS DISTINCT FROM OLD.cost_center_id
           OR NEW.fiscal_period_id IS DISTINCT FROM OLD.fiscal_period_id
           OR NEW.budget_amount IS DISTINCT FROM OLD.budget_amount THEN
            RAISE EXCEPTION 'Budget Integrity Violation: Structural changes to approved or active budget lines are not allowed.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. VALIDATE BUDGET VERSION ACTIVATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_budget_version_activation()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_line_count INTEGER;
BEGIN
    IF NEW.status = 'ACTIVE' AND OLD.status IS DISTINCT FROM 'ACTIVE' THEN
        SELECT COUNT(*) INTO v_line_count
        FROM public.budget_lines
        WHERE budget_version_id = NEW.id AND budget_amount > 0;

        IF v_line_count = 0 THEN
            RAISE EXCEPTION 'Budget version cannot be activated without at least one positive budget line.';
        END IF;

        NEW.is_current := true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. ENSURE ONLY ONE CURRENT VERSION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_current_budget_version()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.is_current = true THEN
        UPDATE public.budget_versions
        SET is_current = false,
            status = CASE WHEN status = 'ACTIVE' THEN 'SUPERSEDED' ELSE status END,
            updated_at = now()
        WHERE budget_id = NEW.budget_id AND id <> COALESCE(NEW.id, gen_random_uuid()) AND is_current = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. BUDGET STATUS TRANSITIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_budget_status_transition()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    IF OLD.status = 'DRAFT' AND NEW.status NOT IN ('SUBMITTED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid budget status transition from DRAFT to %.', NEW.status;
    END IF;

    IF OLD.status = 'SUBMITTED' AND NEW.status NOT IN ('DRAFT', 'APPROVED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid budget status transition from SUBMITTED to %.', NEW.status;
    END IF;

    IF OLD.status = 'APPROVED' AND NEW.status NOT IN ('ACTIVE', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid budget status transition from APPROVED to %.', NEW.status;
    END IF;

    IF OLD.status = 'ACTIVE' AND NEW.status NOT IN ('CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid budget status transition from ACTIVE to %.', NEW.status;
    END IF;

    IF OLD.status IN ('CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Closed or cancelled budgets cannot change status.';
    END IF;

    IF NEW.status = 'SUBMITTED' THEN
        NEW.submitted_at := now();
        NEW.submitted_by := auth.uid();
    END IF;

    IF NEW.status = 'APPROVED' THEN
        NEW.approved_at := now();
        NEW.approved_by := auth.uid();
    END IF;

    IF NEW.status = 'ACTIVE' THEN
        NEW.activated_at := now();
    END IF;

    IF NEW.status = 'CLOSED' THEN
        NEW.closed_at := now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 14. VALIDATE BUDGET COMMITMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_budget_commitment()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_available NUMERIC(15,3);
    v_block BOOLEAN;
    v_budget_status TEXT;
BEGIN
    SELECT bl.available_amount, bl.block_overspend, b.status
    INTO v_available, v_block, v_budget_status
    FROM public.budget_lines bl
    JOIN public.budget_versions bv ON bv.id = bl.budget_version_id
    JOIN public.budgets b ON b.id = bv.budget_id
    WHERE bl.id = NEW.budget_line_id;

    IF v_budget_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Budget commitment cannot be created because the related budget is not ACTIVE.';
    END IF;

    IF v_block = true AND NEW.amount > v_available THEN
        RAISE EXCEPTION 'Budget Overspend Violation: Commitment amount % exceeds available budget %.', NEW.amount, v_available;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. SYNC BUDGET COMMITTED AMOUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_budget_commitment_amount()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_budget_line_id UUID;
BEGIN
    v_budget_line_id := COALESCE(NEW.budget_line_id, OLD.budget_line_id);

    UPDATE public.budget_lines
    SET committed_amount = COALESCE(
            (
                SELECT SUM(amount - released_amount)
                FROM public.budget_commitments
                WHERE budget_line_id = v_budget_line_id AND status IN ('ACTIVE', 'PARTIALLY_RELEASED')
            ), 0
        ),
        updated_at = now()
    WHERE id = v_budget_line_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 16. PREVENT MODIFICATION OF RELEASED/CANCELLED COMMITMENTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_budget_commitment_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status IN ('RELEASED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Budget Commitment Integrity Violation: Released or cancelled commitments cannot be modified.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 17. RECORD ACTUAL BUDGET CONSUMPTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_budget_actual_from_journal_entry()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_line RECORD;
    v_budget_line_id UUID;
    v_amount NUMERIC(15,3);
BEGIN
    IF NEW.status <> 'POSTED' OR OLD.status = 'POSTED' THEN
        RETURN NEW;
    END IF;

    FOR v_line IN
        SELECT
            jel.id AS journal_entry_line_id,
            jel.account_id,
            jel.cost_center_id,
            jel.debit,
            jel.credit,
            je.company_id,
            je.branch_id,
            je.fiscal_period_id,
            je.date,
            coa.type AS account_type
        FROM public.journal_entry_lines jel
        JOIN public.journal_entries je ON je.id = jel.journal_entry_id
        JOIN public.chart_of_accounts coa ON coa.id = jel.account_id
        WHERE jel.journal_entry_id = NEW.id AND coa.type = 'EXPENSE'
    LOOP
        v_amount := v_line.debit - v_line.credit;

        IF v_amount <= 0 THEN
            CONTINUE;
        END IF;

        SELECT bl.id INTO v_budget_line_id
        FROM public.budget_lines bl
        JOIN public.budget_versions bv ON bv.id = bl.budget_version_id
        JOIN public.budgets b ON b.id = bv.budget_id
        WHERE bv.is_current = true
          AND b.status = 'ACTIVE'
          AND b.company_id = v_line.company_id
          AND bl.account_id = v_line.account_id
          AND (bl.cost_center_id IS NULL OR bl.cost_center_id = v_line.cost_center_id)
          AND (bl.branch_id IS NULL OR bl.branch_id = v_line.branch_id)
          AND (bl.fiscal_period_id IS NULL OR bl.fiscal_period_id = v_line.fiscal_period_id)
        ORDER BY
            CASE WHEN bl.fiscal_period_id IS NOT NULL THEN 1 ELSE 2 END,
            CASE WHEN bl.cost_center_id IS NOT NULL THEN 1 ELSE 2 END
        LIMIT 1;

        IF v_budget_line_id IS NULL THEN
            CONTINUE;
        END IF;

        INSERT INTO public.budget_actual_transactions (
            company_id, budget_line_id, journal_entry_id, journal_entry_line_id, transaction_date, amount
        )
        VALUES (
            v_line.company_id, v_budget_line_id, NEW.id, v_line.journal_entry_line_id, v_line.date, v_amount
        )
        ON CONFLICT (budget_line_id, journal_entry_line_id) DO NOTHING;

    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 18. SYNC BUDGET ACTUAL TOTAL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_budget_actual_amount()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_budget_line_id UUID;
BEGIN
    v_budget_line_id := COALESCE(NEW.budget_line_id, OLD.budget_line_id);

    UPDATE public.budget_lines
    SET actual_amount = COALESCE(
            (SELECT SUM(amount) FROM public.budget_actual_transactions WHERE budget_line_id = v_budget_line_id),
            0
        ),
        updated_at = now()
    WHERE id = v_budget_line_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 19. BUDGET AVAILABILITY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.v_budget_vs_actual
WITH (security_invoker = true)
AS
SELECT
    b.id AS budget_id,
    b.company_id,
    b.branch_id AS budget_branch_id,
    b.code AS budget_code,
    b.name_ar AS budget_name_ar,
    b.name_en AS budget_name_en,
    b.fiscal_year,
    b.status AS budget_status,
    bv.id AS budget_version_id,
    bv.version_number,
    bv.is_current,
    bl.id AS budget_line_id,
    bl.account_id,
    coa.code AS account_code,
    coa.name_ar AS account_name_ar,
    coa.name_en AS account_name_en,
    bl.branch_id,
    bl.department_id,
    bl.cost_center_id,
    bl.fiscal_period_id,
    bl.budget_amount,
    bl.committed_amount,
    bl.actual_amount,
    bl.available_amount,
    CASE
        WHEN bl.budget_amount = 0 THEN 0
        ELSE ROUND(((bl.committed_amount + bl.actual_amount) / bl.budget_amount) * 100, 2)
    END AS utilization_percentage,
    CASE
        WHEN bl.available_amount < 0 THEN 'OVER_BUDGET'
        WHEN bl.budget_amount > 0 AND ((bl.committed_amount + bl.actual_amount) / bl.budget_amount) * 100 >= bl.alert_threshold_percentage THEN 'WARNING'
        ELSE 'NORMAL'
    END AS budget_health
FROM public.budgets b
JOIN public.budget_versions bv ON bv.budget_id = b.id
JOIN public.budget_lines bl ON bl.budget_version_id = bv.id
JOIN public.chart_of_accounts coa ON coa.id = bl.account_id
WHERE bv.is_current = true;

-- ============================================================================
-- 20. RLS
-- ============================================================================

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_actual_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS budgets_policy ON public.budgets;
CREATE POLICY budgets_policy ON public.budgets FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS budget_versions_policy ON public.budget_versions;
CREATE POLICY budget_versions_policy ON public.budget_versions FOR ALL TO authenticated
    USING (budget_id IN (SELECT id FROM public.budgets WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (budget_id IN (SELECT id FROM public.budgets WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS budget_lines_policy ON public.budget_lines;
CREATE POLICY budget_lines_policy ON public.budget_lines FOR ALL TO authenticated
    USING (budget_version_id IN (
        SELECT bv.id FROM public.budget_versions bv
        JOIN public.budgets b ON b.id = bv.budget_id
        WHERE b.company_id IN (SELECT public.auth_user_company_ids())
    ))
    WITH CHECK (budget_version_id IN (
        SELECT bv.id FROM public.budget_versions bv
        JOIN public.budgets b ON b.id = bv.budget_id
        WHERE b.company_id IN (SELECT public.auth_user_company_ids())
    ));

DROP POLICY IF EXISTS budget_commitments_policy ON public.budget_commitments;
CREATE POLICY budget_commitments_policy ON public.budget_commitments FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS budget_actual_transactions_policy ON public.budget_actual_transactions;
CREATE POLICY budget_actual_transactions_policy ON public.budget_actual_transactions FOR SELECT TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()));

-- ============================================================================
-- 21. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_budgets_company ON public.budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_budgets_company_year ON public.budgets(company_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);

CREATE INDEX IF NOT EXISTS idx_budget_versions_budget ON public.budget_versions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_versions_current ON public.budget_versions(budget_id, is_current);

CREATE INDEX IF NOT EXISTS idx_budget_lines_version ON public.budget_lines(budget_version_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_account ON public.budget_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_cost_center ON public.budget_lines(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_period ON public.budget_lines(fiscal_period_id);

CREATE INDEX IF NOT EXISTS idx_budget_commitments_company ON public.budget_commitments(company_id);
CREATE INDEX IF NOT EXISTS idx_budget_commitments_line ON public.budget_commitments(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_budget_commitments_status ON public.budget_commitments(status);

CREATE INDEX IF NOT EXISTS idx_budget_actual_transactions_company ON public.budget_actual_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_budget_actual_transactions_line ON public.budget_actual_transactions(budget_line_id);
CREATE INDEX IF NOT EXISTS idx_budget_actual_transactions_entry ON public.budget_actual_transactions(journal_entry_id);

-- ============================================================================
-- 22. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON public.budgets;
CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.set_budgeting_updated_at();

DROP TRIGGER IF EXISTS trg_budget_versions_updated_at ON public.budget_versions;
CREATE TRIGGER trg_budget_versions_updated_at BEFORE UPDATE ON public.budget_versions
    FOR EACH ROW EXECUTE FUNCTION public.set_budgeting_updated_at();

DROP TRIGGER IF EXISTS trg_budget_lines_updated_at ON public.budget_lines;
CREATE TRIGGER trg_budget_lines_updated_at BEFORE UPDATE ON public.budget_lines
    FOR EACH ROW EXECUTE FUNCTION public.set_budgeting_updated_at();

DROP TRIGGER IF EXISTS trg_budget_commitments_updated_at ON public.budget_commitments;
CREATE TRIGGER trg_budget_commitments_updated_at BEFORE UPDATE ON public.budget_commitments
    FOR EACH ROW EXECUTE FUNCTION public.set_budgeting_updated_at();

DROP TRIGGER IF EXISTS trg_validate_budget_status_transition ON public.budgets;
CREATE TRIGGER trg_validate_budget_status_transition BEFORE UPDATE OF status ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.validate_budget_status_transition();

DROP TRIGGER IF EXISTS trg_validate_budget_version_activation ON public.budget_versions;
CREATE TRIGGER trg_validate_budget_version_activation BEFORE UPDATE ON public.budget_versions
    FOR EACH ROW EXECUTE FUNCTION public.validate_budget_version_activation();

DROP TRIGGER IF EXISTS trg_sync_current_budget_version ON public.budget_versions;
CREATE TRIGGER trg_sync_current_budget_version BEFORE INSERT OR UPDATE OF is_current ON public.budget_versions
    FOR EACH ROW EXECUTE FUNCTION public.sync_current_budget_version();

DROP TRIGGER IF EXISTS trg_prevent_locked_budget_line_modification ON public.budget_lines;
CREATE TRIGGER trg_prevent_locked_budget_line_modification BEFORE UPDATE OR DELETE ON public.budget_lines
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_budget_line_modification();

DROP TRIGGER IF EXISTS trg_sync_budget_version_total ON public.budget_lines;
CREATE TRIGGER trg_sync_budget_version_total AFTER INSERT OR UPDATE OR DELETE ON public.budget_lines
    FOR EACH ROW EXECUTE FUNCTION public.sync_budget_version_total();

DROP TRIGGER IF EXISTS trg_sync_budget_header_total_from_version ON public.budget_versions;
CREATE TRIGGER trg_sync_budget_header_total_from_version AFTER INSERT OR UPDATE OR DELETE ON public.budget_versions
    FOR EACH ROW EXECUTE FUNCTION public.sync_budget_header_total();

DROP TRIGGER IF EXISTS trg_validate_budget_commitment ON public.budget_commitments;
CREATE TRIGGER trg_validate_budget_commitment BEFORE INSERT OR UPDATE ON public.budget_commitments
    FOR EACH ROW EXECUTE FUNCTION public.validate_budget_commitment();

DROP TRIGGER IF EXISTS trg_prevent_locked_budget_commitment_modification ON public.budget_commitments;
CREATE TRIGGER trg_prevent_locked_budget_commitment_modification BEFORE UPDATE OR DELETE ON public.budget_commitments
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_budget_commitment_modification();

DROP TRIGGER IF EXISTS trg_sync_budget_commitment_amount ON public.budget_commitments;
CREATE TRIGGER trg_sync_budget_commitment_amount AFTER INSERT OR UPDATE OR DELETE ON public.budget_commitments
    FOR EACH ROW EXECUTE FUNCTION public.sync_budget_commitment_amount();

DROP TRIGGER IF EXISTS trg_sync_budget_actual_amount ON public.budget_actual_transactions;
CREATE TRIGGER trg_sync_budget_actual_amount AFTER INSERT OR UPDATE OR DELETE ON public.budget_actual_transactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_budget_actual_amount();

DROP TRIGGER IF EXISTS trg_sync_budget_actual_from_journal_entry ON public.journal_entries;
CREATE TRIGGER trg_sync_budget_actual_from_journal_entry AFTER UPDATE OF status ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION public.sync_budget_actual_from_journal_entry();

CREATE OR REPLACE FUNCTION public.sync_budget_header_from_budget_line()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_budget_id UUID;
BEGIN
    SELECT bv.budget_id INTO v_budget_id
    FROM public.budget_versions bv
    WHERE bv.id = COALESCE(NEW.budget_version_id, OLD.budget_version_id);

    IF v_budget_id IS NOT NULL THEN
        UPDATE public.budgets b
        SET total_committed_amount = COALESCE(
                (
                    SELECT SUM(bl.committed_amount)
                    FROM public.budget_lines bl
                    JOIN public.budget_versions bv ON bv.id = bl.budget_version_id
                    WHERE bv.budget_id = v_budget_id AND bv.is_current = true
                ), 0
            ),
            total_actual_amount = COALESCE(
                (
                    SELECT SUM(bl.actual_amount)
                    FROM public.budget_lines bl
                    JOIN public.budget_versions bv ON bv.id = bl.budget_version_id
                    WHERE bv.budget_id = v_budget_id AND bv.is_current = true
                ), 0
            ),
            updated_at = now()
        WHERE b.id = v_budget_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_budget_header_from_budget_line ON public.budget_lines;
CREATE TRIGGER trg_sync_budget_header_from_budget_line
    AFTER UPDATE OF committed_amount, actual_amount ON public.budget_lines
    FOR EACH ROW EXECUTE FUNCTION public.sync_budget_header_from_budget_line();

-- ============================================================================
-- 23. FUNCTION SECURITY
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.set_budgeting_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_budget_version_total() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_budget_header_total() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_budget_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_budget_line_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_budget_version_activation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_current_budget_version() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_budget_status_transition() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_budget_commitment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_budget_commitment_amount() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_budget_commitment_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_budget_actual_from_journal_entry() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_budget_actual_amount() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_budget_header_from_budget_line() FROM PUBLIC, anon, authenticated;

COMMIT;
