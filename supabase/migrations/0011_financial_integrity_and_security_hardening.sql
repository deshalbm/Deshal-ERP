-- ============================================================================
-- Deshal ERP
-- Migration 0011: Security & Financial Integrity Hardening
-----------------------------------------------------------
-- Purpose:
--   1. Remove known duplicate legacy RLS policies left by migration 0007.
--   2. Harden journal entry line validation.
--   3. Enforce double-entry integrity when posting journal entries.
--   4. Synchronize journal entry header totals with journal entry lines.
--   5. Prevent modification of accounting lines belonging to POSTED/LOCKED entries.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. REMOVE KNOWN DUPLICATE LEGACY RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS companies_select_policy ON public.companies;
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
DROP POLICY IF EXISTS customers_all_policy ON public.customers;
DROP POLICY IF EXISTS employees_all_policy ON public.employees;
DROP POLICY IF EXISTS coa_all_policy ON public.chart_of_accounts;
DROP POLICY IF EXISTS journal_entries_select_policy ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_insert_policy ON public.journal_entries;
DROP POLICY IF EXISTS journal_entries_update_policy ON public.journal_entries;
DROP POLICY IF EXISTS audit_logs_select_policy ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_policy ON public.audit_logs;

-- ============================================================================
-- 2. HARDEN JOURNAL ENTRY LINE AMOUNT VALIDATION
-- ============================================================================

ALTER TABLE public.journal_entry_lines
DROP CONSTRAINT IF EXISTS chk_journal_entry_line_amounts;

ALTER TABLE public.journal_entry_lines
ADD CONSTRAINT chk_journal_entry_line_amounts
CHECK (
  (debit > 0 AND credit = 0)
  OR
  (credit > 0 AND debit = 0)
);

-- ============================================================================
-- 3. INDEX FOR JOURNAL ENTRY LINE AGGREGATION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry_id
ON public.journal_entry_lines (journal_entry_id);

-- ============================================================================
-- 4. FUNCTION: CALCULATE JOURNAL ENTRY TOTALS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_journal_entry_totals(
    p_journal_entry_id UUID
)
RETURNS TABLE (
    line_count BIGINT,
    total_debit NUMERIC(15,3),
    total_credit NUMERIC(15,3)
)
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS line_count,
        COALESCE(SUM(jel.debit), 0)::NUMERIC(15,3) AS total_debit,
        COALESCE(SUM(jel.credit), 0)::NUMERIC(15,3) AS total_credit
    FROM public.journal_entry_lines jel
    WHERE jel.journal_entry_id = p_journal_entry_id;
END;
$$ LANGUAGE plpgsql STABLE;

REVOKE EXECUTE ON FUNCTION public.get_journal_entry_totals(UUID)
    FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 5. FUNCTION: VALIDATE JOURNAL ENTRY BEFORE POSTING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_journal_entry_before_posting()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_line_count BIGINT;
    v_total_debit NUMERIC(15,3);
    v_total_credit NUMERIC(15,3);
BEGIN
    IF NEW.status = 'POSTED'
       AND OLD.status IS DISTINCT FROM 'POSTED'
    THEN
        SELECT
            line_count,
            total_debit,
            total_credit
        INTO
            v_line_count,
            v_total_debit,
            v_total_credit
        FROM public.get_journal_entry_totals(NEW.id);

        IF v_line_count < 2 THEN
            RAISE EXCEPTION
                'Financial Integrity Violation: Journal entry % cannot be POSTED with fewer than two accounting lines.',
                NEW.id;
        END IF;

        IF v_total_debit <> v_total_credit THEN
            RAISE EXCEPTION
                'Financial Integrity Violation: Journal entry % is not balanced. Debit=% Credit=%.',
                NEW.id,
                v_total_debit,
                v_total_credit;
        END IF;

        IF v_total_debit <= 0 OR v_total_credit <= 0 THEN
            RAISE EXCEPTION
                'Financial Integrity Violation: Journal entry % cannot be POSTED with zero totals.',
                NEW.id;
        END IF;

        IF NEW.total_debit <> v_total_debit
           OR NEW.total_credit <> v_total_credit
        THEN
            RAISE EXCEPTION
                'Financial Integrity Violation: Journal entry % header totals do not match journal entry lines. Header Debit=% Credit=%; Lines Debit=% Credit=%.',
                NEW.id,
                NEW.total_debit,
                NEW.total_credit,
                v_total_debit,
                v_total_credit;
        END IF;

        NEW.is_balanced := TRUE;

        IF NEW.posted_at IS NULL THEN
            NEW.posted_at := now();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGER: VALIDATE ENTRY BEFORE POSTING
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validate_journal_entry_before_posting
    ON public.journal_entries;

CREATE TRIGGER trg_validate_journal_entry_before_posting
    BEFORE UPDATE OF status
    ON public.journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_journal_entry_before_posting();

-- ============================================================================
-- 7. FUNCTION: PREVENT ACCOUNTING LINE MODIFICATION AFTER POSTING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_journal_entry_line_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_journal_entry_id UUID;
    v_status TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_journal_entry_id := OLD.journal_entry_id;
    ELSE
        v_journal_entry_id := NEW.journal_entry_id;
    END IF;

    SELECT je.status
    INTO v_status
    FROM public.journal_entries je
    WHERE je.id = v_journal_entry_id;

    IF v_status IN ('POSTED', 'LOCKED') THEN
        RAISE EXCEPTION
            'Financial Integrity Violation: Cannot modify accounting lines for % journal entry %.',
            v_status,
            v_journal_entry_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. TRIGGER: PROTECT JOURNAL ENTRY LINES
-- ============================================================================

DROP TRIGGER IF EXISTS trg_prevent_locked_journal_entry_line_modification
    ON public.journal_entry_lines;

CREATE TRIGGER trg_prevent_locked_journal_entry_line_modification
    BEFORE INSERT OR UPDATE OR DELETE
    ON public.journal_entry_lines
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_locked_journal_entry_line_modification();

-- ============================================================================
-- 9. FUNCTION: SYNCHRONIZE HEADER TOTALS FROM JOURNAL LINES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_journal_entry_totals()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_journal_entry_id UUID;
    v_total_debit NUMERIC(15,3);
    v_total_credit NUMERIC(15,3);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_journal_entry_id := OLD.journal_entry_id;
    ELSE
        v_journal_entry_id := NEW.journal_entry_id;
    END IF;

    SELECT
        COALESCE(SUM(debit), 0)::NUMERIC(15,3),
        COALESCE(SUM(credit), 0)::NUMERIC(15,3)
    INTO
        v_total_debit,
        v_total_credit
    FROM public.journal_entry_lines
    WHERE journal_entry_id = v_journal_entry_id;

    UPDATE public.journal_entries
    SET
        total_debit = v_total_debit,
        total_credit = v_total_credit,
        is_balanced = (v_total_debit = v_total_credit),
        updated_at = now()
    WHERE id = v_journal_entry_id
      AND status NOT IN ('POSTED', 'LOCKED');

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. TRIGGER: SYNCHRONIZE TOTALS AFTER LINE CHANGES
-- ============================================================================

DROP TRIGGER IF EXISTS trg_sync_journal_entry_totals
    ON public.journal_entry_lines;

CREATE TRIGGER trg_sync_journal_entry_totals
    AFTER INSERT OR UPDATE OR DELETE
    ON public.journal_entry_lines
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_journal_entry_totals();

-- ============================================================================
-- 11. HARDEN POSTED / LOCKED JOURNAL ENTRY PROTECTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_posted_journal_entry_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status IN ('POSTED', 'LOCKED') THEN
        RAISE EXCEPTION
            'Financial Integrity Violation: Cannot modify or delete a % journal entry (Entry ID: %). Use a reversal or adjusting entry instead.',
            OLD.status,
            OLD.id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_posted_journal_entry_update
    ON public.journal_entries;

CREATE TRIGGER trg_prevent_posted_journal_entry_update
    BEFORE UPDATE OR DELETE
    ON public.journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_posted_journal_entry_modification();

-- ============================================================================
-- 12. REVOKE DIRECT EXECUTION OF INTERNAL TRIGGER FUNCTIONS
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.validate_journal_entry_before_posting()
    FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.prevent_locked_journal_entry_line_modification()
    FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.sync_journal_entry_totals()
    FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.prevent_posted_journal_entry_modification()
    FROM PUBLIC, anon, authenticated;

COMMIT;
