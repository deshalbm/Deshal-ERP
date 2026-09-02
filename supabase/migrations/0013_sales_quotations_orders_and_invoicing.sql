-- ============================================================================
-- Deshal ERP
-- Migration 0013: Sales Quotations, Sales Orders & Invoicing Integration
----------------------------------------------------------------------------
-- Purpose:
--   1. Add Sales Quotations and Quotation Line Items.
--   2. Add Sales Orders and Sales Order Line Items.
--   3. Link Invoices to Sales Orders and Quotations.
--   4. Implement automatic line total calculation and document header totals sync.
--   5. Implement status transition validations and document locking.
--   6. Enforce Row Level Security (RLS) and function execution security.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SALES QUOTATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sales_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    quotation_number TEXT NOT NULL,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    currency TEXT NOT NULL DEFAULT 'OMR',
    subtotal NUMERIC(15,3) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    notes TEXT,
    terms_and_conditions TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    converted_to_order_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_sales_quotations_number UNIQUE (company_id, quotation_number),
    CONSTRAINT chk_sales_quotation_status CHECK (
        status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'CONVERTED')
    ),
    CONSTRAINT chk_sales_quotation_dates CHECK (
        valid_until IS NULL OR valid_until >= quotation_date
    ),
    CONSTRAINT chk_sales_quotation_amounts CHECK (
        subtotal >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0
    )
);

-- ============================================================================
-- 2. SALES QUOTATION LINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sales_quotation_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES public.sales_quotations(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(15,3) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,3) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    line_total NUMERIC(15,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_sales_quotation_line_number UNIQUE (quotation_id, line_number),
    CONSTRAINT chk_sales_quotation_line_quantity CHECK (quantity > 0),
    CONSTRAINT chk_sales_quotation_line_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_sales_quotation_line_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_sales_quotation_line_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100),
    CONSTRAINT chk_sales_quotation_line_tax CHECK (tax_amount >= 0),
    CONSTRAINT chk_sales_quotation_line_total CHECK (line_total >= 0)
);

-- ============================================================================
-- 3. SALES ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    quotation_id UUID REFERENCES public.sales_quotations(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    currency TEXT NOT NULL DEFAULT 'OMR',
    subtotal NUMERIC(15,3) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    notes TEXT,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    fulfilled_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_sales_orders_number UNIQUE (company_id, order_number),
    CONSTRAINT ux_sales_orders_quotation UNIQUE (quotation_id),
    CONSTRAINT chk_sales_order_status CHECK (
        status IN ('DRAFT', 'CONFIRMED', 'PROCESSING', 'FULFILLED', 'INVOICED', 'CANCELLED')
    ),
    CONSTRAINT chk_sales_order_amounts CHECK (
        subtotal >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0
    )
);

-- ============================================================================
-- 4. SALES ORDER LINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sales_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    quotation_line_id UUID REFERENCES public.sales_quotation_lines(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(15,3) NOT NULL DEFAULT 1,
    fulfilled_quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
    invoiced_quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15,3) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    line_total NUMERIC(15,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_sales_order_line_number UNIQUE (sales_order_id, line_number),
    CONSTRAINT chk_sales_order_line_quantity CHECK (quantity > 0),
    CONSTRAINT chk_sales_order_line_fulfilled_quantity CHECK (fulfilled_quantity >= 0 AND fulfilled_quantity <= quantity),
    CONSTRAINT chk_sales_order_line_invoiced_quantity CHECK (invoiced_quantity >= 0 AND invoiced_quantity <= quantity),
    CONSTRAINT chk_sales_order_line_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_sales_order_line_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_sales_order_line_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100),
    CONSTRAINT chk_sales_order_line_tax_amount CHECK (tax_amount >= 0),
    CONSTRAINT chk_sales_order_line_total CHECK (line_total >= 0)
);

-- ============================================================================
-- 5. SALES ORDER REFERENCE ON INVOICES
-- ============================================================================

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS sales_order_id UUID REFERENCES public.sales_orders(id) ON DELETE SET NULL;

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES public.sales_quotations(id) ON DELETE SET NULL;

-- ============================================================================
-- 6. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sales_quotations_company ON public.sales_quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_customer ON public.sales_quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_lead ON public.sales_quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_opportunity ON public.sales_quotations(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_status ON public.sales_quotations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_quotations_date ON public.sales_quotations(company_id, quotation_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_quotation_lines_quotation ON public.sales_quotation_lines(quotation_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotation_lines_product ON public.sales_quotation_lines(product_id);

CREATE INDEX IF NOT EXISTS idx_sales_orders_company ON public.sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON public.sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_quotation ON public.sales_orders(quotation_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON public.sales_orders(company_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_order ON public.sales_order_lines(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_lines_product ON public.sales_order_lines(product_id);

CREATE INDEX IF NOT EXISTS idx_invoices_sales_order ON public.invoices(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quotation ON public.invoices(quotation_id);

-- ============================================================================
-- 7. GENERIC DOCUMENT TOTAL SYNCHRONIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_sales_quotation_totals()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_quotation_id UUID;
BEGIN
    v_quotation_id := COALESCE(NEW.quotation_id, OLD.quotation_id);

    UPDATE public.sales_quotations q
    SET
        subtotal = COALESCE((
            SELECT SUM(quantity * unit_price)
            FROM public.sales_quotation_lines l
            WHERE l.quotation_id = v_quotation_id
        ), 0),
        discount_amount = COALESCE((
            SELECT SUM(discount_amount)
            FROM public.sales_quotation_lines l
            WHERE l.quotation_id = v_quotation_id
        ), 0),
        tax_amount = COALESCE((
            SELECT SUM(tax_amount)
            FROM public.sales_quotation_lines l
            WHERE l.quotation_id = v_quotation_id
        ), 0),
        total_amount = COALESCE((
            SELECT SUM(line_total)
            FROM public.sales_quotation_lines l
            WHERE l.quotation_id = v_quotation_id
        ), 0),
        updated_at = now()
    WHERE q.id = v_quotation_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_sales_order_totals()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
BEGIN
    v_order_id := COALESCE(NEW.sales_order_id, OLD.sales_order_id);

    UPDATE public.sales_orders o
    SET
        subtotal = COALESCE((
            SELECT SUM(quantity * unit_price)
            FROM public.sales_order_lines l
            WHERE l.sales_order_id = v_order_id
        ), 0),
        discount_amount = COALESCE((
            SELECT SUM(discount_amount)
            FROM public.sales_order_lines l
            WHERE l.sales_order_id = v_order_id
        ), 0),
        tax_amount = COALESCE((
            SELECT SUM(tax_amount)
            FROM public.sales_order_lines l
            WHERE l.sales_order_id = v_order_id
        ), 0),
        total_amount = COALESCE((
            SELECT SUM(line_total)
            FROM public.sales_order_lines l
            WHERE l.sales_order_id = v_order_id
        ), 0),
        updated_at = now()
    WHERE o.id = v_order_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. AUTOMATIC LINE TOTAL CALCULATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_sales_quotation_line_totals()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_net NUMERIC(15,3);
BEGIN
    v_net := (NEW.quantity * NEW.unit_price) - NEW.discount_amount;
    IF v_net < 0 THEN
        RAISE EXCEPTION 'Quotation line discount cannot exceed line value';
    END IF;

    NEW.tax_amount := ROUND(v_net * (NEW.tax_rate / 100), 3);
    NEW.line_total := ROUND(v_net + NEW.tax_amount, 3);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.calculate_sales_order_line_totals()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_net NUMERIC(15,3);
BEGIN
    v_net := (NEW.quantity * NEW.unit_price) - NEW.discount_amount;
    IF v_net < 0 THEN
        RAISE EXCEPTION 'Sales order line discount cannot exceed line value';
    END IF;

    NEW.tax_amount := ROUND(v_net * (NEW.tax_rate / 100), 3);
    NEW.line_total := ROUND(v_net + NEW.tax_amount, 3);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. DOCUMENT UPDATED_AT FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_sales_quotation_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_sales_order_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. QUOTATION STATUS TRANSITION VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_sales_quotation_status_transition()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_line_count INTEGER;
BEGIN
    IF NEW.status = 'ACCEPTED' AND OLD.status <> 'ACCEPTED' THEN
        SELECT COUNT(*) INTO v_line_count
        FROM public.sales_quotation_lines
        WHERE quotation_id = NEW.id;

        IF v_line_count = 0 THEN
            RAISE EXCEPTION 'Cannot accept quotation without lines';
        END IF;

        IF NEW.total_amount <= 0 THEN
            RAISE EXCEPTION 'Cannot accept quotation with zero total';
        END IF;

        NEW.accepted_at := now();
    END IF;

    IF NEW.status = 'REJECTED' AND OLD.status <> 'REJECTED' THEN
        NEW.rejected_at := now();
    END IF;

    IF OLD.status = 'ACCEPTED' AND NEW.status NOT IN ('ACCEPTED', 'CONVERTED') THEN
        RAISE EXCEPTION 'Cannot change quotation status after ACCEPTED except to CONVERTED';
    END IF;

    IF OLD.status IN ('CONVERTED', 'CANCELLED') AND NEW.status <> OLD.status THEN
        RAISE EXCEPTION 'Cannot change quotation status after %', OLD.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. SALES ORDER STATUS VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_sales_order_status_transition()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_line_count INTEGER;
BEGIN
    IF NEW.status = 'CONFIRMED' AND OLD.status <> 'CONFIRMED' THEN
        SELECT COUNT(*) INTO v_line_count
        FROM public.sales_order_lines
        WHERE sales_order_id = NEW.id;

        IF v_line_count = 0 THEN
            RAISE EXCEPTION 'Cannot confirm sales order without lines';
        END IF;

        IF NEW.total_amount <= 0 THEN
            RAISE EXCEPTION 'Cannot confirm sales order with zero total';
        END IF;

        NEW.confirmed_at := now();
    END IF;

    IF NEW.status = 'FULFILLED' AND OLD.status <> 'FULFILLED' THEN
        NEW.fulfilled_at := now();
    END IF;

    IF NEW.status = 'CANCELLED' AND OLD.status <> 'CANCELLED' THEN
        NEW.cancelled_at := now();
    END IF;

    IF OLD.status IN ('FULFILLED', 'INVOICED', 'CANCELLED') AND NEW.status <> OLD.status THEN
        RAISE EXCEPTION 'Cannot change sales order status after %', OLD.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. PREVENT MODIFICATION OF LOCKED QUOTATION LINES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_sales_quotation_line_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_quotation_status TEXT;
    v_quotation_id UUID;
BEGIN
    v_quotation_id := COALESCE(NEW.quotation_id, OLD.quotation_id);

    SELECT status INTO v_quotation_status
    FROM public.sales_quotations
    WHERE id = v_quotation_id;

    IF v_quotation_status IN ('ACCEPTED', 'CONVERTED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Cannot modify lines of quotation with status %', v_quotation_status;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. PREVENT MODIFICATION OF LOCKED SALES ORDER LINES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_sales_order_line_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_status TEXT;
    v_order_id UUID;
BEGIN
    v_order_id := COALESCE(NEW.sales_order_id, OLD.sales_order_id);

    SELECT status INTO v_order_status
    FROM public.sales_orders
    WHERE id = v_order_id;

    IF v_order_status IN ('CONFIRMED', 'PROCESSING', 'FULFILLED', 'INVOICED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Cannot modify lines of sales order with status %', v_order_status;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 14. VALIDATE COMPANY CONSISTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_sales_document_company_consistency()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_company_id UUID;
BEGIN
    IF NEW.customer_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id
        FROM public.customers
        WHERE id = NEW.customer_id;

        IF v_company_id IS DISTINCT FROM NEW.company_id THEN
            RAISE EXCEPTION 'Customer must belong to the same company as the sales document';
        END IF;
    END IF;

    IF NEW.lead_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id
        FROM public.leads
        WHERE id = NEW.lead_id;

        IF v_company_id IS DISTINCT FROM NEW.company_id THEN
            RAISE EXCEPTION 'Lead must belong to the same company';
        END IF;
    END IF;

    IF NEW.opportunity_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id
        FROM public.opportunities
        WHERE id = NEW.opportunity_id;

        IF v_company_id IS DISTINCT FROM NEW.company_id THEN
            RAISE EXCEPTION 'Opportunity must belong to the same company';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. QUOTATION → SALES ORDER CONVERSION VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_sales_order_quotation_source()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_company_id UUID;
    v_customer_id UUID;
    v_status TEXT;
BEGIN
    IF NEW.quotation_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT company_id, customer_id, status
    INTO v_company_id, v_customer_id, v_status
    FROM public.sales_quotations
    WHERE id = NEW.quotation_id;

    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Referenced quotation does not exist';
    END IF;

    IF v_company_id <> NEW.company_id THEN
        RAISE EXCEPTION 'Quotation must belong to the same company';
    END IF;

    IF v_customer_id <> NEW.customer_id THEN
        RAISE EXCEPTION 'Quotation customer must match sales order customer';
    END IF;

    IF v_status <> 'ACCEPTED' AND v_status <> 'CONVERTED' THEN
        RAISE EXCEPTION 'Only ACCEPTED quotations can create sales orders';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 16. MARK QUOTATION AS CONVERTED
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_quotation_as_converted()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.quotation_id IS NOT NULL THEN
        UPDATE public.sales_quotations
        SET
            status = 'CONVERTED',
            converted_to_order_at = now(),
            updated_at = now()
        WHERE id = NEW.quotation_id
          AND status = 'ACCEPTED';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 17. UPDATE SALES ORDER INVOICE STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_sales_order_invoice_status()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
BEGIN
    v_order_id := COALESCE(NEW.sales_order_id, OLD.sales_order_id);

    IF v_order_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.invoices
        WHERE sales_order_id = v_order_id
          AND status <> 'CANCELLED'
    ) THEN
        UPDATE public.sales_orders
        SET
            status = CASE
                WHEN status IN ('CONFIRMED', 'PROCESSING') THEN 'INVOICED'
                ELSE status
            END,
            updated_at = now()
        WHERE id = v_order_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 18. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.sales_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_quotation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_quotations_policy ON public.sales_quotations;
CREATE POLICY sales_quotations_policy ON public.sales_quotations
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS sales_quotation_lines_policy ON public.sales_quotation_lines;
CREATE POLICY sales_quotation_lines_policy ON public.sales_quotation_lines
    FOR ALL TO authenticated
    USING (quotation_id IN (SELECT id FROM public.sales_quotations WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (quotation_id IN (SELECT id FROM public.sales_quotations WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS sales_orders_policy ON public.sales_orders;
CREATE POLICY sales_orders_policy ON public.sales_orders
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS sales_order_lines_policy ON public.sales_order_lines;
CREATE POLICY sales_order_lines_policy ON public.sales_order_lines
    FOR ALL TO authenticated
    USING (sales_order_id IN (SELECT id FROM public.sales_orders WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (sales_order_id IN (SELECT id FROM public.sales_orders WHERE company_id IN (SELECT public.auth_user_company_ids())));

-- ============================================================================
-- 19. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_calculate_sales_quotation_line_totals ON public.sales_quotation_lines;
CREATE TRIGGER trg_calculate_sales_quotation_line_totals
    BEFORE INSERT OR UPDATE ON public.sales_quotation_lines
    FOR EACH ROW EXECUTE FUNCTION public.calculate_sales_quotation_line_totals();

DROP TRIGGER IF EXISTS trg_sync_sales_quotation_totals ON public.sales_quotation_lines;
CREATE TRIGGER trg_sync_sales_quotation_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.sales_quotation_lines
    FOR EACH ROW EXECUTE FUNCTION public.sync_sales_quotation_totals();

DROP TRIGGER IF EXISTS trg_calculate_sales_order_line_totals ON public.sales_order_lines;
CREATE TRIGGER trg_calculate_sales_order_line_totals
    BEFORE INSERT OR UPDATE ON public.sales_order_lines
    FOR EACH ROW EXECUTE FUNCTION public.calculate_sales_order_line_totals();

DROP TRIGGER IF EXISTS trg_sync_sales_order_totals ON public.sales_order_lines;
CREATE TRIGGER trg_sync_sales_order_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.sales_order_lines
    FOR EACH ROW EXECUTE FUNCTION public.sync_sales_order_totals();

DROP TRIGGER IF EXISTS trg_sales_quotation_updated_at ON public.sales_quotations;
CREATE TRIGGER trg_sales_quotation_updated_at
    BEFORE UPDATE ON public.sales_quotations
    FOR EACH ROW EXECUTE FUNCTION public.set_sales_quotation_updated_at();

DROP TRIGGER IF EXISTS trg_sales_order_updated_at ON public.sales_orders;
CREATE TRIGGER trg_sales_order_updated_at
    BEFORE UPDATE ON public.sales_orders
    FOR EACH ROW EXECUTE FUNCTION public.set_sales_order_updated_at();

DROP TRIGGER IF EXISTS trg_validate_sales_quotation_status ON public.sales_quotations;
CREATE TRIGGER trg_validate_sales_quotation_status
    BEFORE UPDATE ON public.sales_quotations
    FOR EACH ROW EXECUTE FUNCTION public.validate_sales_quotation_status_transition();

DROP TRIGGER IF EXISTS trg_validate_sales_order_status ON public.sales_orders;
CREATE TRIGGER trg_validate_sales_order_status
    BEFORE UPDATE ON public.sales_orders
    FOR EACH ROW EXECUTE FUNCTION public.validate_sales_order_status_transition();

DROP TRIGGER IF EXISTS trg_prevent_locked_sales_quotation_lines ON public.sales_quotation_lines;
CREATE TRIGGER trg_prevent_locked_sales_quotation_lines
    BEFORE INSERT OR UPDATE OR DELETE ON public.sales_quotation_lines
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_sales_quotation_line_modification();

DROP TRIGGER IF EXISTS trg_prevent_locked_sales_order_lines ON public.sales_order_lines;
CREATE TRIGGER trg_prevent_locked_sales_order_lines
    BEFORE INSERT OR UPDATE OR DELETE ON public.sales_order_lines
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_sales_order_line_modification();

DROP TRIGGER IF EXISTS trg_validate_sales_quotation_company ON public.sales_quotations;
CREATE TRIGGER trg_validate_sales_quotation_company
    BEFORE INSERT OR UPDATE ON public.sales_quotations
    FOR EACH ROW EXECUTE FUNCTION public.validate_sales_document_company_consistency();

DROP TRIGGER IF EXISTS trg_validate_sales_order_company ON public.sales_orders;
CREATE TRIGGER trg_validate_sales_order_company
    BEFORE INSERT OR UPDATE ON public.sales_orders
    FOR EACH ROW EXECUTE FUNCTION public.validate_sales_document_company_consistency();

DROP TRIGGER IF EXISTS trg_validate_sales_order_quotation ON public.sales_orders;
CREATE TRIGGER trg_validate_sales_order_quotation
    BEFORE INSERT OR UPDATE ON public.sales_orders
    FOR EACH ROW EXECUTE FUNCTION public.validate_sales_order_quotation_source();

DROP TRIGGER IF EXISTS trg_mark_quotation_converted ON public.sales_orders;
CREATE TRIGGER trg_mark_quotation_converted
    AFTER INSERT ON public.sales_orders
    FOR EACH ROW EXECUTE FUNCTION public.mark_quotation_as_converted();

DROP TRIGGER IF EXISTS trg_sync_sales_order_invoice_status ON public.invoices;
CREATE TRIGGER trg_sync_sales_order_invoice_status
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.sync_sales_order_invoice_status();

-- ============================================================================
-- 20. FUNCTION EXECUTION HARDENING
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.sync_sales_quotation_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_sales_order_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_sales_quotation_line_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_sales_order_line_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_sales_quotation_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_sales_order_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_sales_quotation_status_transition() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_sales_order_status_transition() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_sales_quotation_line_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_sales_order_line_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_sales_document_company_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_sales_order_quotation_source() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_quotation_as_converted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_sales_order_invoice_status() FROM PUBLIC, anon, authenticated;

COMMIT;
