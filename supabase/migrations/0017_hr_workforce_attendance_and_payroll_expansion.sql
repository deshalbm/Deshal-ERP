-- ============================================================================
-- Deshal ERP
-- Migration 0017: HR, Workforce, Attendance & Payroll Expansion
----------------------------------------------------------------------------
-- Purpose:
--   - Employee contracts and salary structures
--   - Salary components and per-employee component assignments
--   - Consolidated daily attendance records with kiosk & manual source tracking
--   - Leave types and yearly employee leave balance tracking
--   - Payroll slip expansion and detailed earning/deduction line items
--   - Automatic payroll slip totals calculation & status validation
--   - RLS policies and function execution hardening
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EMPLOYEE CONTRACTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employee_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    contract_number TEXT NOT NULL,
    contract_type TEXT NOT NULL DEFAULT 'UNLIMITED' CHECK (
        contract_type IN ('LIMITED', 'UNLIMITED', 'PART_TIME', 'TEMPORARY', 'CONSULTING')
    ),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED')
    ),
    start_date DATE NOT NULL,
    end_date DATE,
    probation_end_date DATE,
    basic_salary NUMERIC(15,3) NOT NULL DEFAULT 0 CHECK (basic_salary >= 0),
    housing_allowance NUMERIC(15,3) NOT NULL DEFAULT 0 CHECK (housing_allowance >= 0),
    transport_allowance NUMERIC(15,3) NOT NULL DEFAULT 0 CHECK (transport_allowance >= 0),
    other_allowances NUMERIC(15,3) NOT NULL DEFAULT 0 CHECK (other_allowances >= 0),
    gross_salary NUMERIC(15,3) GENERATED ALWAYS AS (
        basic_salary + housing_allowance + transport_allowance + other_allowances
    ) STORED,
    currency TEXT NOT NULL DEFAULT 'OMR',
    working_hours_per_day NUMERIC(5,2) NOT NULL DEFAULT 8 CHECK (
        working_hours_per_day > 0 AND working_hours_per_day <= 24
    ),
    working_days_per_week NUMERIC(4,2) NOT NULL DEFAULT 5 CHECK (
        working_days_per_week > 0 AND working_days_per_week <= 7
    ),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_employee_contract_number UNIQUE (company_id, contract_number),
    CONSTRAINT chk_employee_contract_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_contracts_company ON public.employee_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_employee ON public.employee_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_status ON public.employee_contracts(company_id, status);

-- ============================================================================
-- 2. SALARY COMPONENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    component_type TEXT NOT NULL CHECK (
        component_type IN ('EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION')
    ),
    calculation_type TEXT NOT NULL DEFAULT 'FIXED' CHECK (
        calculation_type IN ('FIXED', 'PERCENTAGE')
    ),
    percentage_of TEXT CHECK (
        percentage_of IS NULL OR percentage_of IN ('BASIC_SALARY', 'GROSS_SALARY')
    ),
    default_amount NUMERIC(15,3) NOT NULL DEFAULT 0 CHECK (default_amount >= 0),
    default_percentage NUMERIC(7,4) CHECK (
        default_percentage IS NULL OR (default_percentage >= 0 AND default_percentage <= 100)
    ),
    is_taxable BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_salary_components_code UNIQUE (company_id, code),
    CONSTRAINT chk_salary_component_percentage CHECK (
        calculation_type <> 'PERCENTAGE' OR default_percentage IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_salary_components_company ON public.salary_components(company_id);

-- ============================================================================
-- 3. EMPLOYEE SALARY COMPONENT ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employee_salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    salary_component_id UUID NOT NULL REFERENCES public.salary_components(id) ON DELETE CASCADE,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    amount NUMERIC(15,3),
    percentage NUMERIC(7,4),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_employee_salary_component_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_employee_salary_components_employee ON public.employee_salary_components(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_salary_components_company ON public.employee_salary_components(company_id);

-- ============================================================================
-- 4. ATTENDANCE RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    check_in_at TIMESTAMPTZ,
    check_out_at TIMESTAMPTZ,
    scheduled_check_in_at TIMESTAMPTZ,
    scheduled_check_out_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'PRESENT' CHECK (
        status IN ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND', 'REMOTE_WORK')
    ),
    total_work_minutes INTEGER NOT NULL DEFAULT 0 CHECK (total_work_minutes >= 0),
    regular_work_minutes INTEGER NOT NULL DEFAULT 0 CHECK (regular_work_minutes >= 0),
    overtime_minutes INTEGER NOT NULL DEFAULT 0 CHECK (overtime_minutes >= 0),
    late_minutes INTEGER NOT NULL DEFAULT 0 CHECK (late_minutes >= 0),
    early_departure_minutes INTEGER NOT NULL DEFAULT 0 CHECK (early_departure_minutes >= 0),
    source TEXT NOT NULL DEFAULT 'SYSTEM' CHECK (
        source IN ('KIOSK', 'MANUAL', 'SYSTEM', 'IMPORT', 'MOBILE')
    ),
    is_locked BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_attendance_employee_date UNIQUE (employee_id, attendance_date),
    CONSTRAINT chk_attendance_checkout_after_checkin CHECK (
        check_out_at IS NULL OR check_in_at IS NULL OR check_out_at >= check_in_at
    )
);

CREATE INDEX IF NOT EXISTS idx_attendance_company_date ON public.attendance_records(company_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance_records(employee_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance_records(company_id, status);

-- ============================================================================
-- 5. LEAVE TYPES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    annual_entitlement NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (annual_entitlement >= 0),
    is_paid BOOLEAN NOT NULL DEFAULT true,
    requires_approval BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_leave_types_code UNIQUE (company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_leave_types_company ON public.leave_types(company_id);

-- ============================================================================
-- 6. EMPLOYEE LEAVE BALANCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employee_leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    opening_balance NUMERIC(8,2) NOT NULL DEFAULT 0,
    accrued_days NUMERIC(8,2) NOT NULL DEFAULT 0,
    used_days NUMERIC(8,2) NOT NULL DEFAULT 0,
    adjusted_days NUMERIC(8,2) NOT NULL DEFAULT 0,
    closing_balance NUMERIC(8,2) GENERATED ALWAYS AS (
        opening_balance + accrued_days + adjusted_days - used_days
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_employee_leave_balance UNIQUE (employee_id, leave_type_id, year)
);

CREATE INDEX IF NOT EXISTS idx_employee_leave_balances_employee ON public.employee_leave_balances(employee_id, year);

-- ============================================================================
-- 7. PAYROLL SLIP EXPANSION
-- ============================================================================

ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.employee_contracts(id) ON DELETE SET NULL;
ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(15,3) NOT NULL DEFAULT 0;
ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(15,3) NOT NULL DEFAULT 0;
ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS total_deductions NUMERIC(15,3) NOT NULL DEFAULT 0;
ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS net_salary NUMERIC(15,3) NOT NULL DEFAULT 0;
ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.payroll_slips ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- ============================================================================
-- 8. PAYROLL SLIP LINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payroll_slip_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_slip_id UUID NOT NULL REFERENCES public.payroll_slips(id) ON DELETE CASCADE,
    salary_component_id UUID REFERENCES public.salary_components(id) ON DELETE SET NULL,
    component_code TEXT NOT NULL,
    component_name_ar TEXT NOT NULL,
    component_name_en TEXT,
    component_type TEXT NOT NULL CHECK (
        component_type IN ('EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION')
    ),
    amount NUMERIC(15,3) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_slip_lines_slip ON public.payroll_slip_lines(payroll_slip_id);

-- ============================================================================
-- 9. HELPER FUNCTION: UPDATE TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_hr_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. VALIDATE COMPANY CONSISTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_employee_contract_company()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT company_id INTO v_company_id
    FROM public.employees WHERE id = NEW.employee_id;

    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Employee % does not exist.', NEW.employee_id;
    END IF;

    IF v_company_id <> NEW.company_id THEN
        RAISE EXCEPTION 'Employee company must match employee contract company.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. VALIDATE ATTENDANCE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_attendance_record()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_company_id UUID;
    v_minutes INTEGER;
BEGIN
    SELECT company_id INTO v_company_id
    FROM public.employees WHERE id = NEW.employee_id;

    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Employee % does not exist.', NEW.employee_id;
    END IF;

    IF v_company_id <> NEW.company_id THEN
        RAISE EXCEPTION 'Attendance company must match employee company.';
    END IF;

    IF NEW.check_in_at IS NOT NULL AND NEW.check_out_at IS NOT NULL THEN
        v_minutes := FLOOR(EXTRACT(EPOCH FROM (NEW.check_out_at - NEW.check_in_at)) / 60);
        NEW.total_work_minutes := GREATEST(v_minutes, 0);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. PREVENT LOCKED ATTENDANCE MODIFICATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_attendance_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.is_locked = true THEN
        RAISE EXCEPTION 'Attendance record is locked and cannot be modified.';
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. PAYROLL TOTAL SYNCHRONIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_payroll_slip_totals(p_payroll_slip_id UUID)
RETURNS VOID
SET search_path = public, pg_temp
AS $$
DECLARE
    v_earnings NUMERIC(15,3);
    v_deductions NUMERIC(15,3);
BEGIN
    SELECT
        COALESCE(SUM(CASE WHEN component_type = 'EARNING' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN component_type = 'DEDUCTION' THEN amount ELSE 0 END), 0)
    INTO v_earnings, v_deductions
    FROM public.payroll_slip_lines
    WHERE payroll_slip_id = p_payroll_slip_id;

    UPDATE public.payroll_slips
    SET
        total_earnings = v_earnings,
        total_allowances = v_earnings,
        total_deductions = v_deductions,
        net_salary = v_earnings - v_deductions
    WHERE id = p_payroll_slip_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_sync_payroll_slip_totals()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_payroll_slip_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_payroll_slip_id := OLD.payroll_slip_id;
    ELSE
        v_payroll_slip_id := NEW.payroll_slip_id;
    END IF;

    PERFORM public.sync_payroll_slip_totals(v_payroll_slip_id);

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 14. PREVENT MODIFICATION OF POSTED PAYROLL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_posted_payroll_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.status IN ('POSTED', 'PAID', 'LOCKED') THEN
        RAISE EXCEPTION 'Payroll slip is % and cannot be modified.', OLD.status;
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. PREVENT MODIFICATION OF POSTED PAYROLL LINES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_payroll_line_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status
    FROM public.payroll_slips
    WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.payroll_slip_id ELSE NEW.payroll_slip_id END;

    IF v_status IN ('POSTED', 'PAID', 'LOCKED') THEN
        RAISE EXCEPTION 'Cannot modify payroll lines of a % payroll slip.', v_status;
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 16. VALIDATE PAYROLL BEFORE POSTING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_payroll_before_posting()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_line_count INTEGER;
BEGIN
    IF NEW.status = 'POSTED' AND OLD.status IS DISTINCT FROM 'POSTED' THEN
        SELECT COUNT(*) INTO v_line_count
        FROM public.payroll_slip_lines
        WHERE payroll_slip_id = NEW.id;

        IF v_line_count = 0 THEN
            RAISE EXCEPTION 'Cannot post payroll slip without payroll lines.';
        END IF;

        IF NEW.net_salary < 0 THEN
            RAISE EXCEPTION 'Payroll net salary cannot be negative.';
        END IF;

        NEW.posted_at := COALESCE(NEW.posted_at, now());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 17. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_employee_contract_updated_at ON public.employee_contracts;
CREATE TRIGGER trg_employee_contract_updated_at
    BEFORE UPDATE ON public.employee_contracts
    FOR EACH ROW EXECUTE FUNCTION public.set_hr_updated_at();

DROP TRIGGER IF EXISTS trg_salary_component_updated_at ON public.salary_components;
CREATE TRIGGER trg_salary_component_updated_at
    BEFORE UPDATE ON public.salary_components
    FOR EACH ROW EXECUTE FUNCTION public.set_hr_updated_at();

DROP TRIGGER IF EXISTS trg_employee_salary_component_updated_at ON public.employee_salary_components;
CREATE TRIGGER trg_employee_salary_component_updated_at
    BEFORE UPDATE ON public.employee_salary_components
    FOR EACH ROW EXECUTE FUNCTION public.set_hr_updated_at();

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON public.attendance_records;
CREATE TRIGGER trg_attendance_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION public.set_hr_updated_at();

DROP TRIGGER IF EXISTS trg_leave_type_updated_at ON public.leave_types;
CREATE TRIGGER trg_leave_type_updated_at
    BEFORE UPDATE ON public.leave_types
    FOR EACH ROW EXECUTE FUNCTION public.set_hr_updated_at();

DROP TRIGGER IF EXISTS trg_leave_balance_updated_at ON public.employee_leave_balances;
CREATE TRIGGER trg_leave_balance_updated_at
    BEFORE UPDATE ON public.employee_leave_balances
    FOR EACH ROW EXECUTE FUNCTION public.set_hr_updated_at();

DROP TRIGGER IF EXISTS trg_validate_employee_contract_company ON public.employee_contracts;
CREATE TRIGGER trg_validate_employee_contract_company
    BEFORE INSERT OR UPDATE ON public.employee_contracts
    FOR EACH ROW EXECUTE FUNCTION public.validate_employee_contract_company();

DROP TRIGGER IF EXISTS trg_validate_attendance_record ON public.attendance_records;
CREATE TRIGGER trg_validate_attendance_record
    BEFORE INSERT OR UPDATE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION public.validate_attendance_record();

DROP TRIGGER IF EXISTS trg_prevent_locked_attendance_update ON public.attendance_records;
CREATE TRIGGER trg_prevent_locked_attendance_update
    BEFORE UPDATE OR DELETE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_attendance_modification();

DROP TRIGGER IF EXISTS trg_sync_payroll_slip_totals ON public.payroll_slip_lines;
CREATE TRIGGER trg_sync_payroll_slip_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.payroll_slip_lines
    FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_payroll_slip_totals();

DROP TRIGGER IF EXISTS trg_prevent_posted_payroll_modification ON public.payroll_slips;
CREATE TRIGGER trg_prevent_posted_payroll_modification
    BEFORE UPDATE OR DELETE ON public.payroll_slips
    FOR EACH ROW EXECUTE FUNCTION public.prevent_posted_payroll_modification();

DROP TRIGGER IF EXISTS trg_prevent_locked_payroll_line_modification ON public.payroll_slip_lines;
CREATE TRIGGER trg_prevent_locked_payroll_line_modification
    BEFORE INSERT OR UPDATE OR DELETE ON public.payroll_slip_lines
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_payroll_line_modification();

DROP TRIGGER IF EXISTS trg_validate_payroll_before_posting ON public.payroll_slips;
CREATE TRIGGER trg_validate_payroll_before_posting
    BEFORE UPDATE ON public.payroll_slips
    FOR EACH ROW EXECUTE FUNCTION public.validate_payroll_before_posting();

-- ============================================================================
-- 18. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.employee_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_slip_lines ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 19. RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS employee_contracts_policy ON public.employee_contracts;
CREATE POLICY employee_contracts_policy ON public.employee_contracts
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS salary_components_policy ON public.salary_components;
CREATE POLICY salary_components_policy ON public.salary_components
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS employee_salary_components_policy ON public.employee_salary_components;
CREATE POLICY employee_salary_components_policy ON public.employee_salary_components
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS attendance_records_policy ON public.attendance_records;
CREATE POLICY attendance_records_policy ON public.attendance_records
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()) OR employee_id = public.auth_user_employee_id())
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS leave_types_policy ON public.leave_types;
CREATE POLICY leave_types_policy ON public.leave_types
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS employee_leave_balances_policy ON public.employee_leave_balances;
CREATE POLICY employee_leave_balances_policy ON public.employee_leave_balances
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()) OR employee_id = public.auth_user_employee_id())
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS payroll_slip_lines_policy ON public.payroll_slip_lines;
CREATE POLICY payroll_slip_lines_policy ON public.payroll_slip_lines
    FOR ALL TO authenticated
    USING (payroll_slip_id IN (SELECT id FROM public.payroll_slips WHERE company_id IN (SELECT public.auth_user_company_ids()) OR employee_id = public.auth_user_employee_id()))
    WITH CHECK (payroll_slip_id IN (SELECT id FROM public.payroll_slips WHERE company_id IN (SELECT public.auth_user_company_ids())));

-- ============================================================================
-- 20. HARDEN FUNCTION EXECUTION
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.set_hr_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_employee_contract_company() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_attendance_record() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_attendance_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_payroll_slip_totals(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trigger_sync_payroll_slip_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_posted_payroll_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_payroll_line_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_payroll_before_posting() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.sync_payroll_slip_totals(UUID) TO authenticated;

-- ============================================================================
-- 21. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.employee_contracts IS 'Employee employment contracts and salary terms.';
COMMENT ON TABLE public.salary_components IS 'Company-level reusable payroll earnings and deduction components.';
COMMENT ON TABLE public.employee_salary_components IS 'Employee-specific salary component assignments.';
COMMENT ON TABLE public.attendance_records IS 'Official daily attendance records consolidated from kiosk and other sources.';
COMMENT ON TABLE public.leave_types IS 'Company leave type configuration and annual entitlement.';
COMMENT ON TABLE public.employee_leave_balances IS 'Employee leave balances by leave type and year.';
COMMENT ON TABLE public.payroll_slip_lines IS 'Detailed earning and deduction lines for payroll slips.';

COMMIT;
