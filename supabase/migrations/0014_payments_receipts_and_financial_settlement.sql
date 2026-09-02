-- ============================================================================
-- Deshal ERP
-- Migration 0014: Payments, Receipts & Financial Settlement
----------------------------------------------------------------------------
-- Purpose:
--   Financial payments, receipts, invoice allocations, settlement automation,
--   partial payments, overpayment protection, and accounting integration.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    payment_number TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'INBOUND',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15,3) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'OMR',
    exchange_rate NUMERIC(18,8) NOT NULL DEFAULT 1,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    external_reference TEXT,
    reference_number TEXT,
    notes TEXT,
    posted_at TIMESTAMPTZ,
    posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_payments_number UNIQUE (company_id, payment_number),
    CONSTRAINT chk_payments_direction CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_payments_exchange_rate CHECK (exchange_rate > 0),
    CONSTRAINT chk_payments_status CHECK (status IN ('DRAFT', 'POSTED', 'CANCELLED')),
    CONSTRAINT chk_payments_method CHECK (
        payment_method IN ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'ONLINE', 'WALLET', 'OTHER')
    ),
    CONSTRAINT chk_payments_counterparty CHECK (
        NOT (customer_id IS NOT NULL AND supplier_id IS NOT NULL)
    ),
    CONSTRAINT chk_payments_posting_timestamp CHECK (
        status <> 'POSTED' OR posted_at IS NOT NULL
    ),
    CONSTRAINT chk_payments_cancellation_timestamp CHECK (
        status <> 'CANCELLED' OR cancelled_at IS NOT NULL
    )
);

COMMENT ON TABLE public.payments IS 'Financial payment transactions. Supports inbound receipts and outbound payments.';
COMMENT ON COLUMN public.payments.direction IS 'INBOUND = customer receipt / incoming cash. OUTBOUND = supplier/vendor payment.';
COMMENT ON COLUMN public.payments.amount IS 'Original transaction amount in the specified currency.';
COMMENT ON COLUMN public.payments.status IS 'DRAFT, POSTED, or CANCELLED. POSTED payments are financially immutable.';

-- ============================================================================
-- 2. PAYMENT ALLOCATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
    allocated_amount NUMERIC(15,3) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_payment_allocations_payment_invoice UNIQUE (payment_id, invoice_id),
    CONSTRAINT chk_payment_allocations_amount CHECK (allocated_amount > 0)
);

COMMENT ON TABLE public.payment_allocations IS 'Allocates a payment amount across one or more invoices.';

-- ============================================================================
-- 3. RECEIPTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    receipt_number TEXT NOT NULL,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15,3) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'OMR',
    status TEXT NOT NULL DEFAULT 'ISSUED',
    notes TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_receipts_number UNIQUE (company_id, receipt_number),
    CONSTRAINT ux_receipts_payment UNIQUE (payment_id),
    CONSTRAINT chk_receipts_amount CHECK (amount > 0),
    CONSTRAINT chk_receipts_status CHECK (status IN ('ISSUED', 'CANCELLED')),
    CONSTRAINT chk_receipts_cancelled_timestamp CHECK (status <> 'CANCELLED' OR cancelled_at IS NOT NULL)
);

COMMENT ON TABLE public.receipts IS 'Auditable receipt documents generated from inbound customer payments.';

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payments_company_id ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_branch_id ON public.payments(branch_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_supplier_id ON public.payments(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_bank_account_id ON public.payments(bank_account_id) WHERE bank_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(company_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(company_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_company_id ON public.payment_allocations(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id ON public.payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice_id ON public.payment_allocations(invoice_id);

CREATE INDEX IF NOT EXISTS idx_receipts_company_id ON public.receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_receipts_customer_id ON public.receipts(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(company_id, status);

-- ============================================================================
-- 5. UPDATED_AT FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_payment_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_receipt_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.set_payment_updated_at();

DROP TRIGGER IF EXISTS trg_receipts_updated_at ON public.receipts;
CREATE TRIGGER trg_receipts_updated_at
    BEFORE UPDATE ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION public.set_receipt_updated_at();

-- ============================================================================
-- 6. PAYMENT COMPANY CONSISTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_payment_company_consistency()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_company_id UUID;
BEGIN
    IF NEW.customer_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id
        FROM public.customers WHERE id = NEW.customer_id;

        IF v_company_id IS NULL OR v_company_id <> NEW.company_id THEN
            RAISE EXCEPTION 'Payment customer must belong to the same company.';
        END IF;
    END IF;

    IF NEW.supplier_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id
        FROM public.suppliers WHERE id = NEW.supplier_id;

        IF v_company_id IS NULL OR v_company_id <> NEW.company_id THEN
            RAISE EXCEPTION 'Payment supplier must belong to the same company.';
        END IF;
    END IF;

    IF NEW.bank_account_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id
        FROM public.bank_accounts WHERE id = NEW.bank_account_id;

        IF v_company_id IS NULL OR v_company_id <> NEW.company_id THEN
            RAISE EXCEPTION 'Payment bank account must belong to the same company.';
        END IF;
    END IF;

    IF NEW.journal_entry_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id
        FROM public.journal_entries WHERE id = NEW.journal_entry_id;

        IF v_company_id IS NULL OR v_company_id <> NEW.company_id THEN
            RAISE EXCEPTION 'Payment journal entry must belong to the same company.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_payment_company_consistency ON public.payments;
CREATE TRIGGER trg_validate_payment_company_consistency
    BEFORE INSERT OR UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.validate_payment_company_consistency();

-- ============================================================================
-- 7. PAYMENT ALLOCATION VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_payment_allocation()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment_company_id UUID;
    v_payment_amount NUMERIC(15,3);
    v_payment_status TEXT;
    v_invoice_company_id UUID;
    v_invoice_total NUMERIC(15,3);
    v_invoice_status TEXT;
    v_existing_payment_allocations NUMERIC(15,3);
    v_existing_invoice_allocations NUMERIC(15,3);
BEGIN
    SELECT company_id, amount, status
    INTO v_payment_company_id, v_payment_amount, v_payment_status
    FROM public.payments WHERE id = NEW.payment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced payment does not exist.';
    END IF;

    SELECT company_id, total_amount, status
    INTO v_invoice_company_id, v_invoice_total, v_invoice_status
    FROM public.invoices WHERE id = NEW.invoice_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced invoice does not exist.';
    END IF;

    IF NEW.company_id <> v_payment_company_id OR NEW.company_id <> v_invoice_company_id THEN
        RAISE EXCEPTION 'Payment allocation, payment, and invoice must belong to the same company.';
    END IF;

    IF v_payment_status <> 'DRAFT' THEN
        RAISE EXCEPTION 'Payment allocations can only be created or modified while the payment is DRAFT.';
    END IF;

    IF v_invoice_status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot allocate a payment to a cancelled invoice.';
    END IF;

    SELECT COALESCE(SUM(allocated_amount), 0)
    INTO v_existing_payment_allocations
    FROM public.payment_allocations
    WHERE payment_id = NEW.payment_id
      AND (TG_OP = 'INSERT' OR id <> NEW.id);

    IF v_existing_payment_allocations + NEW.allocated_amount > v_payment_amount THEN
        RAISE EXCEPTION 'Payment allocation exceeds the available payment amount.';
    END IF;

    SELECT COALESCE(SUM(pa.allocated_amount), 0)
    INTO v_existing_invoice_allocations
    FROM public.payment_allocations pa
    JOIN public.payments p ON p.id = pa.payment_id
    WHERE pa.invoice_id = NEW.invoice_id
      AND p.status IN ('DRAFT', 'POSTED')
      AND (TG_OP = 'INSERT' OR pa.id <> NEW.id);

    IF v_existing_invoice_allocations + NEW.allocated_amount > v_invoice_total THEN
        RAISE EXCEPTION 'Payment allocation exceeds the invoice total amount.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_payment_allocation ON public.payment_allocations;
CREATE TRIGGER trg_validate_payment_allocation
    BEFORE INSERT OR UPDATE ON public.payment_allocations
    FOR EACH ROW EXECUTE FUNCTION public.validate_payment_allocation();

-- ============================================================================
-- 8. PREVENT MODIFICATION OF POSTED PAYMENT ALLOCATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_payment_allocation_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment_id UUID;
    v_payment_status TEXT;
BEGIN
    v_payment_id := COALESCE(NEW.payment_id, OLD.payment_id);

    SELECT status INTO v_payment_status
    FROM public.payments WHERE id = v_payment_id;

    IF v_payment_status IN ('POSTED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Financial Integrity Violation: Cannot modify payment allocations for a % payment.', v_payment_status;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_payment_allocation_modification ON public.payment_allocations;
CREATE TRIGGER trg_prevent_locked_payment_allocation_modification
    BEFORE UPDATE OR DELETE ON public.payment_allocations
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_payment_allocation_modification();

-- ============================================================================
-- 9. VALIDATE PAYMENT BEFORE POSTING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_payment_before_posting()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_allocated_amount NUMERIC(15,3);
BEGIN
    IF NEW.status = 'POSTED' AND OLD.status <> 'POSTED' THEN
        IF NEW.amount <= 0 THEN
            RAISE EXCEPTION 'Cannot post a payment with zero or negative amount.';
        END IF;

        IF NEW.direction = 'INBOUND' AND NEW.customer_id IS NULL THEN
            RAISE EXCEPTION 'INBOUND payment requires a customer.';
        END IF;

        IF NEW.direction = 'OUTBOUND' AND NEW.supplier_id IS NULL THEN
            RAISE EXCEPTION 'OUTBOUND payment requires a supplier.';
        END IF;

        SELECT COALESCE(SUM(allocated_amount), 0)
        INTO v_allocated_amount
        FROM public.payment_allocations
        WHERE payment_id = NEW.id;

        IF v_allocated_amount <= 0 THEN
            RAISE EXCEPTION 'Cannot post a payment without at least one allocation.';
        END IF;

        IF v_allocated_amount > NEW.amount THEN
            RAISE EXCEPTION 'Payment allocations exceed the payment amount.';
        END IF;

        NEW.posted_at := COALESCE(NEW.posted_at, now());
        NEW.posted_by := COALESCE(NEW.posted_by, (SELECT auth.uid()));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_payment_before_posting ON public.payments;
CREATE TRIGGER trg_validate_payment_before_posting
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.validate_payment_before_posting();

-- ============================================================================
-- 10. PREVENT MODIFICATION OF POSTED PAYMENTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_posted_payment_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status = 'POSTED' THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'Financial Integrity Violation: A POSTED payment cannot be deleted.';
        END IF;

        IF NEW.status = 'CANCELLED' THEN
            RETURN NEW;
        END IF;

        IF NEW.amount IS DISTINCT FROM OLD.amount
           OR NEW.direction IS DISTINCT FROM OLD.direction
           OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
           OR NEW.supplier_id IS DISTINCT FROM OLD.supplier_id
           OR NEW.bank_account_id IS DISTINCT FROM OLD.bank_account_id
           OR NEW.payment_number IS DISTINCT FROM OLD.payment_number
           OR NEW.payment_date IS DISTINCT FROM OLD.payment_date
           OR NEW.company_id IS DISTINCT FROM OLD.company_id
        THEN
            RAISE EXCEPTION 'Financial Integrity Violation: Core financial fields of a POSTED payment cannot be modified. Cancel or reverse it instead.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_posted_payment_update ON public.payments;
CREATE TRIGGER trg_prevent_posted_payment_update
    BEFORE UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.prevent_posted_payment_modification();

-- ============================================================================
-- 11. INVOICE SETTLEMENT SYNCHRONIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_invoice_payment_status(p_invoice_id UUID)
RETURNS VOID
SET search_path = public, pg_temp
AS $$
DECLARE
    v_invoice_total NUMERIC(15,3);
    v_paid_amount NUMERIC(15,3);
    v_new_status TEXT;
BEGIN
    SELECT total_amount INTO v_invoice_total
    FROM public.invoices WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT COALESCE(SUM(pa.allocated_amount), 0)
    INTO v_paid_amount
    FROM public.payment_allocations pa
    JOIN public.payments p ON p.id = pa.payment_id
    WHERE pa.invoice_id = p_invoice_id
      AND p.status = 'POSTED';

    IF v_paid_amount <= 0 THEN
        v_new_status := 'UNPAID';
    ELSIF v_paid_amount < v_invoice_total THEN
        v_new_status := 'PARTIAL';
    ELSE
        v_new_status := 'PAID';
    END IF;

    UPDATE public.invoices
    SET status = v_new_status, updated_at = now()
    WHERE id = p_invoice_id AND status <> 'CANCELLED';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. AUTOMATIC INVOICE STATUS UPDATE AFTER PAYMENT POSTING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_invoices_after_payment_change()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_invoice_id UUID;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'POSTED' AND OLD.status <> 'POSTED' THEN
            FOR v_invoice_id IN
                SELECT invoice_id FROM public.payment_allocations WHERE payment_id = NEW.id
            LOOP
                PERFORM public.sync_invoice_payment_status(v_invoice_id);
            END LOOP;
        END IF;

        IF NEW.status = 'CANCELLED' AND OLD.status = 'POSTED' THEN
            FOR v_invoice_id IN
                SELECT invoice_id FROM public.payment_allocations WHERE payment_id = NEW.id
            LOOP
                PERFORM public.sync_invoice_payment_status(v_invoice_id);
            END LOOP;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_invoices_after_payment_change ON public.payments;
CREATE TRIGGER trg_sync_invoices_after_payment_change
    AFTER UPDATE OF status ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.sync_invoices_after_payment_change();

-- ============================================================================
-- 13. PREVENT INVALID PAYMENT STATUS TRANSITIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_payment_status_transition()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    IF OLD.status = 'DRAFT' THEN
        IF NEW.status NOT IN ('POSTED', 'CANCELLED') THEN
            RAISE EXCEPTION 'Invalid payment status transition from DRAFT to %. Allowed: POSTED or CANCELLED.', NEW.status;
        END IF;
    ELSIF OLD.status = 'POSTED' THEN
        IF NEW.status <> 'CANCELLED' THEN
            RAISE EXCEPTION 'Invalid payment status transition from POSTED to %. Only CANCELLED is allowed.', NEW.status;
        END IF;
    ELSIF OLD.status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cancelled payments cannot be reactivated.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_payment_status_transition ON public.payments;
CREATE TRIGGER trg_validate_payment_status_transition
    BEFORE UPDATE OF status ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.validate_payment_status_transition();

-- ============================================================================
-- 14. AUTOMATIC RECEIPT VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_receipt_consistency()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_company_id UUID;
    v_customer_id UUID;
    v_direction TEXT;
    v_payment_amount NUMERIC(15,3);
    v_payment_status TEXT;
BEGIN
    SELECT company_id, customer_id, direction, amount, status
    INTO v_company_id, v_customer_id, v_direction, v_payment_amount, v_payment_status
    FROM public.payments WHERE id = NEW.payment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Receipt payment does not exist.';
    END IF;

    IF v_direction <> 'INBOUND' THEN
        RAISE EXCEPTION 'Receipts can only be created for INBOUND payments.';
    END IF;

    IF NEW.company_id <> v_company_id THEN
        RAISE EXCEPTION 'Receipt and payment must belong to the same company.';
    END IF;

    IF v_customer_id IS NULL OR NEW.customer_id <> v_customer_id THEN
        RAISE EXCEPTION 'Receipt customer must match the payment customer.';
    END IF;

    IF NEW.amount > v_payment_amount THEN
        RAISE EXCEPTION 'Receipt amount cannot exceed payment amount.';
    END IF;

    IF v_payment_status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot create a receipt for a cancelled payment.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_receipt_consistency ON public.receipts;
CREATE TRIGGER trg_validate_receipt_consistency
    BEFORE INSERT OR UPDATE ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION public.validate_receipt_consistency();

-- ============================================================================
-- 15. PREVENT MODIFICATION OF ISSUED RECEIPTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_issued_receipt_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status = 'ISSUED' THEN
        IF TG_OP = 'UPDATE' AND NEW.status = 'CANCELLED' THEN
            RETURN NEW;
        END IF;
        RAISE EXCEPTION 'Issued receipts cannot be modified or deleted. Cancel the receipt instead.';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_issued_receipt_modification ON public.receipts;
CREATE TRIGGER trg_prevent_issued_receipt_modification
    BEFORE UPDATE OR DELETE ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION public.prevent_issued_receipt_modification();

-- ============================================================================
-- 16. RECEIPT CANCELLATION AUTOMATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_receipt_cancellation_metadata()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.status = 'CANCELLED' AND OLD.status <> 'CANCELLED' THEN
        NEW.cancelled_at := COALESCE(NEW.cancelled_at, now());
        NEW.cancelled_by := COALESCE(NEW.cancelled_by, (SELECT auth.uid()));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_receipt_cancellation_metadata ON public.receipts;
CREATE TRIGGER trg_set_receipt_cancellation_metadata
    BEFORE UPDATE OF status ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION public.set_receipt_cancellation_metadata();

-- ============================================================================
-- 17. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_policy ON public.payments;
CREATE POLICY payments_policy ON public.payments
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS payment_allocations_policy ON public.payment_allocations;
CREATE POLICY payment_allocations_policy ON public.payment_allocations
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS receipts_policy ON public.receipts;
CREATE POLICY receipts_policy ON public.receipts
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- ============================================================================
-- 19. FUNCTION EXECUTION HARDENING
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.set_payment_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_receipt_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_payment_company_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_payment_allocation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_payment_allocation_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_payment_before_posting() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_posted_payment_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_invoices_after_payment_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_payment_status_transition() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_receipt_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_issued_receipt_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_receipt_cancellation_metadata() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 20. SYNC EXISTING INVOICES
-- ============================================================================

DO $$
DECLARE
    v_invoice_id UUID;
BEGIN
    FOR v_invoice_id IN
        SELECT DISTINCT invoice_id FROM public.payment_allocations
    LOOP
        PERFORM public.sync_invoice_payment_status(v_invoice_id);
    END LOOP;
END;
$$;

COMMIT;
