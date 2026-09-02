-- ============================================================================
-- Deshal ERP
-- Migration 0016: Purchasing, Procurement & Supplier Settlement
----------------------------------------------------------------------------
-- Purpose:
--   1. Purchase Order Line items and PO totals calculation.
--   2. Goods Receipts and Goods Receipt Line items with automatic inventory posting.
--   3. Supplier Invoices and Supplier Invoice Line items.
--   4. Supplier Payment Allocations linking OUTBOUND payments to Supplier Invoices.
--   5. Status transition triggers, locking mechanics, and company consistency checks.
--   6. RLS policies and security execution hardening.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PURCHASE ORDER LINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    description TEXT,
    quantity NUMERIC(15,3) NOT NULL,
    received_quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
    invoiced_quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15,3) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    line_total NUMERIC(15,3) GENERATED ALWAYS AS (
        (quantity * unit_price) - discount_amount + tax_amount
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_purchase_order_line_quantity CHECK (quantity > 0),
    CONSTRAINT chk_purchase_order_line_received_quantity CHECK (received_quantity >= 0 AND received_quantity <= quantity),
    CONSTRAINT chk_purchase_order_line_invoiced_quantity CHECK (invoiced_quantity >= 0 AND invoiced_quantity <= received_quantity),
    CONSTRAINT chk_purchase_order_line_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_purchase_order_line_discount CHECK (discount_amount >= 0 AND discount_amount <= quantity * unit_price),
    CONSTRAINT chk_purchase_order_line_tax CHECK (tax_amount >= 0)
);

-- ============================================================================
-- 2. PURCHASE ORDER TOTALS & METADATA
-- ============================================================================

ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,3) NOT NULL DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,3) NOT NULL DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15,3) NOT NULL DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15,3) NOT NULL DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- ============================================================================
-- 3. GOODS RECEIPTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    receipt_number TEXT NOT NULL,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    received_at TIMESTAMPTZ,
    received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_goods_receipts_number UNIQUE (company_id, receipt_number),
    CONSTRAINT chk_goods_receipt_status CHECK (status IN ('DRAFT', 'RECEIVED', 'CANCELLED'))
);

-- ============================================================================
-- 4. GOODS RECEIPT LINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.goods_receipt_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id UUID NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
    purchase_order_line_id UUID NOT NULL REFERENCES public.purchase_order_lines(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(15,3) NOT NULL,
    accepted_quantity NUMERIC(15,3) NOT NULL,
    rejected_quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(15,3) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_goods_receipt_line_quantity CHECK (quantity > 0),
    CONSTRAINT chk_goods_receipt_line_accepted_quantity CHECK (accepted_quantity >= 0),
    CONSTRAINT chk_goods_receipt_line_rejected_quantity CHECK (rejected_quantity >= 0),
    CONSTRAINT chk_goods_receipt_line_quantity_balance CHECK (accepted_quantity + rejected_quantity = quantity),
    CONSTRAINT chk_goods_receipt_line_unit_cost CHECK (unit_cost >= 0)
);

-- ============================================================================
-- 5. SUPPLIER INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supplier_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    supplier_invoice_number TEXT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(15,3) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    outstanding_amount NUMERIC(15,3) GENERATED ALWAYS AS (
        GREATEST(total_amount - paid_amount, 0)
    ) STORED,
    currency TEXT NOT NULL DEFAULT 'OMR',
    status TEXT NOT NULL DEFAULT 'DRAFT',
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    posted_at TIMESTAMPTZ,
    posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_supplier_invoices_number UNIQUE (company_id, invoice_number),
    CONSTRAINT chk_supplier_invoice_amounts CHECK (
        subtotal >= 0 AND discount_amount >= 0 AND tax_amount >= 0
        AND total_amount >= 0 AND paid_amount >= 0 AND paid_amount <= total_amount
    ),
    CONSTRAINT chk_supplier_invoice_status CHECK (
        status IN ('DRAFT', 'POSTED', 'PARTIAL', 'PAID', 'CANCELLED')
    )
);

-- ============================================================================
-- 6. SUPPLIER INVOICE LINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supplier_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_invoice_id UUID NOT NULL REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
    purchase_order_line_id UUID REFERENCES public.purchase_order_lines(id) ON DELETE SET NULL,
    goods_receipt_line_id UUID REFERENCES public.goods_receipt_lines(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    description TEXT,
    quantity NUMERIC(15,3) NOT NULL,
    unit_price NUMERIC(15,3) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    line_total NUMERIC(15,3) GENERATED ALWAYS AS (
        (quantity * unit_price) - discount_amount + tax_amount
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_supplier_invoice_line_quantity CHECK (quantity > 0),
    CONSTRAINT chk_supplier_invoice_line_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_supplier_invoice_line_discount CHECK (discount_amount >= 0 AND discount_amount <= quantity * unit_price),
    CONSTRAINT chk_supplier_invoice_line_tax CHECK (tax_amount >= 0)
);

-- ============================================================================
-- 7. SUPPLIER PAYMENT ALLOCATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supplier_payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    supplier_invoice_id UUID NOT NULL REFERENCES public.supplier_invoices(id) ON DELETE RESTRICT,
    allocated_amount NUMERIC(15,3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_supplier_payment_allocation UNIQUE (payment_id, supplier_invoice_id),
    CONSTRAINT chk_supplier_payment_allocation_amount CHECK (allocated_amount > 0)
);

-- ============================================================================
-- 8. UPDATED_AT HELPER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_purchasing_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchase_order_lines_updated_at ON public.purchase_order_lines;
CREATE TRIGGER trg_purchase_order_lines_updated_at
    BEFORE UPDATE ON public.purchase_order_lines
    FOR EACH ROW EXECUTE FUNCTION public.set_purchasing_updated_at();

DROP TRIGGER IF EXISTS trg_goods_receipts_updated_at ON public.goods_receipts;
CREATE TRIGGER trg_goods_receipts_updated_at
    BEFORE UPDATE ON public.goods_receipts
    FOR EACH ROW EXECUTE FUNCTION public.set_purchasing_updated_at();

DROP TRIGGER IF EXISTS trg_supplier_invoices_updated_at ON public.supplier_invoices;
CREATE TRIGGER trg_supplier_invoices_updated_at
    BEFORE UPDATE ON public.supplier_invoices
    FOR EACH ROW EXECUTE FUNCTION public.set_purchasing_updated_at();

DROP TRIGGER IF EXISTS trg_supplier_invoice_lines_updated_at ON public.supplier_invoice_lines;
CREATE TRIGGER trg_supplier_invoice_lines_updated_at
    BEFORE UPDATE ON public.supplier_invoice_lines
    FOR EACH ROW EXECUTE FUNCTION public.set_purchasing_updated_at();

-- ============================================================================
-- 9. PURCHASE ORDER TOTAL SYNCHRONIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_purchase_order_totals(p_purchase_order_id UUID)
RETURNS VOID
SET search_path = public, pg_temp
AS $$
DECLARE
    v_subtotal NUMERIC(15,3);
    v_discount NUMERIC(15,3);
    v_tax NUMERIC(15,3);
BEGIN
    SELECT
        COALESCE(SUM(quantity * unit_price), 0),
        COALESCE(SUM(discount_amount), 0),
        COALESCE(SUM(tax_amount), 0)
    INTO v_subtotal, v_discount, v_tax
    FROM public.purchase_order_lines
    WHERE purchase_order_id = p_purchase_order_id;

    UPDATE public.purchase_orders
    SET
        subtotal = v_subtotal,
        discount_amount = v_discount,
        tax_amount = v_tax,
        total_amount = v_subtotal - v_discount + v_tax
    WHERE id = p_purchase_order_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_sync_purchase_order_totals()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.sync_purchase_order_totals(OLD.purchase_order_id);
    ELSE
        PERFORM public.sync_purchase_order_totals(NEW.purchase_order_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_purchase_order_totals ON public.purchase_order_lines;
CREATE TRIGGER trg_sync_purchase_order_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.purchase_order_lines
    FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_purchase_order_totals();

-- ============================================================================
-- 10. SUPPLIER INVOICE TOTAL SYNCHRONIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_supplier_invoice_totals(p_supplier_invoice_id UUID)
RETURNS VOID
SET search_path = public, pg_temp
AS $$
DECLARE
    v_subtotal NUMERIC(15,3);
    v_discount NUMERIC(15,3);
    v_tax NUMERIC(15,3);
BEGIN
    SELECT
        COALESCE(SUM(quantity * unit_price), 0),
        COALESCE(SUM(discount_amount), 0),
        COALESCE(SUM(tax_amount), 0)
    INTO v_subtotal, v_discount, v_tax
    FROM public.supplier_invoice_lines
    WHERE supplier_invoice_id = p_supplier_invoice_id;

    UPDATE public.supplier_invoices
    SET
        subtotal = v_subtotal,
        discount_amount = v_discount,
        tax_amount = v_tax,
        total_amount = v_subtotal - v_discount + v_tax
    WHERE id = p_supplier_invoice_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_sync_supplier_invoice_totals()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.sync_supplier_invoice_totals(OLD.supplier_invoice_id);
    ELSE
        PERFORM public.sync_supplier_invoice_totals(NEW.supplier_invoice_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_supplier_invoice_totals ON public.supplier_invoice_lines;
CREATE TRIGGER trg_sync_supplier_invoice_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.supplier_invoice_lines
    FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_supplier_invoice_totals();

-- ============================================================================
-- 11. VALIDATE GOODS RECEIPT COMPANY CONSISTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_goods_receipt_consistency()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_po_company_id UUID;
    v_po_supplier_id UUID;
    v_warehouse_company_id UUID;
BEGIN
    SELECT company_id, supplier_id
    INTO v_po_company_id, v_po_supplier_id
    FROM public.purchase_orders
    WHERE id = NEW.purchase_order_id;

    IF v_po_company_id IS NULL THEN
        RAISE EXCEPTION 'Invalid purchase order: %', NEW.purchase_order_id;
    END IF;

    IF NEW.company_id <> v_po_company_id THEN
        RAISE EXCEPTION 'Company consistency violation: goods receipt and purchase order belong to different companies';
    END IF;

    IF NEW.supplier_id <> v_po_supplier_id THEN
        RAISE EXCEPTION 'Supplier consistency violation: goods receipt supplier must match purchase order supplier';
    END IF;

    SELECT company_id INTO v_warehouse_company_id
    FROM public.warehouses WHERE id = NEW.warehouse_id;

    IF v_warehouse_company_id IS DISTINCT FROM NEW.company_id THEN
        RAISE EXCEPTION 'Warehouse consistency violation: warehouse must belong to goods receipt company';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_goods_receipt_consistency ON public.goods_receipts;
CREATE TRIGGER trg_validate_goods_receipt_consistency
    BEFORE INSERT OR UPDATE ON public.goods_receipts
    FOR EACH ROW EXECUTE FUNCTION public.validate_goods_receipt_consistency();

-- ============================================================================
-- 12. VALIDATE GOODS RECEIPT LINES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_goods_receipt_line()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_receipt_po_id UUID;
    v_po_line_po_id UUID;
    v_po_line_product_id UUID;
    v_ordered_quantity NUMERIC(15,3);
    v_existing_received NUMERIC(15,3);
BEGIN
    SELECT purchase_order_id INTO v_receipt_po_id
    FROM public.goods_receipts WHERE id = NEW.goods_receipt_id;

    SELECT purchase_order_id, product_id, quantity
    INTO v_po_line_po_id, v_po_line_product_id, v_ordered_quantity
    FROM public.purchase_order_lines WHERE id = NEW.purchase_order_line_id;

    IF v_receipt_po_id IS NULL OR v_po_line_po_id IS NULL THEN
        RAISE EXCEPTION 'Invalid goods receipt or purchase order line';
    END IF;

    IF v_receipt_po_id <> v_po_line_po_id THEN
        RAISE EXCEPTION 'Goods receipt line must reference a purchase order line belonging to the same purchase order';
    END IF;

    IF NEW.product_id <> v_po_line_product_id THEN
        RAISE EXCEPTION 'Product consistency violation: goods receipt line product must match purchase order line product';
    END IF;

    SELECT COALESCE(SUM(accepted_quantity), 0)
    INTO v_existing_received
    FROM public.goods_receipt_lines
    WHERE purchase_order_line_id = NEW.purchase_order_line_id
      AND id <> COALESCE(NEW.id, gen_random_uuid());

    IF v_existing_received + NEW.accepted_quantity > v_ordered_quantity THEN
        RAISE EXCEPTION 'Received quantity exceeds ordered quantity for purchase order line %', NEW.purchase_order_line_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_goods_receipt_line ON public.goods_receipt_lines;
CREATE TRIGGER trg_validate_goods_receipt_line
    BEFORE INSERT OR UPDATE ON public.goods_receipt_lines
    FOR EACH ROW EXECUTE FUNCTION public.validate_goods_receipt_line();

-- ============================================================================
-- 13. SYNCHRONIZE PURCHASE ORDER RECEIVED QUANTITIES & STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_purchase_order_line_received_quantity(p_purchase_order_line_id UUID)
RETURNS VOID
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.purchase_order_lines pol
    SET received_quantity = COALESCE((
        SELECT SUM(grl.accepted_quantity)
        FROM public.goods_receipt_lines grl
        JOIN public.goods_receipts gr ON gr.id = grl.goods_receipt_id
        WHERE grl.purchase_order_line_id = pol.id AND gr.status = 'RECEIVED'
    ), 0)
    WHERE pol.id = p_purchase_order_line_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_sync_purchase_order_received_quantity()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.sync_purchase_order_line_received_quantity(OLD.purchase_order_line_id);
    ELSE
        PERFORM public.sync_purchase_order_line_received_quantity(NEW.purchase_order_line_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_purchase_order_received_quantity ON public.goods_receipt_lines;
CREATE TRIGGER trg_sync_purchase_order_received_quantity
    AFTER INSERT OR UPDATE OR DELETE ON public.goods_receipt_lines
    FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_purchase_order_received_quantity();

CREATE OR REPLACE FUNCTION public.refresh_purchase_order_receipt_status()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total NUMERIC(15,3);
    v_received NUMERIC(15,3);
    v_line RECORD;
BEGIN
    IF NEW.status = 'RECEIVED' AND OLD.status IS DISTINCT FROM 'RECEIVED' THEN
        FOR v_line IN
            SELECT purchase_order_line_id
            FROM public.goods_receipt_lines
            WHERE goods_receipt_id = NEW.id
        LOOP
            PERFORM public.sync_purchase_order_line_received_quantity(v_line.purchase_order_line_id);
        END LOOP;

        SELECT COALESCE(SUM(quantity), 0), COALESCE(SUM(received_quantity), 0)
        INTO v_total, v_received
        FROM public.purchase_order_lines
        WHERE purchase_order_id = NEW.purchase_order_id;

        UPDATE public.purchase_orders
        SET
            status = CASE
                WHEN v_received >= v_total THEN 'RECEIVED'
                WHEN v_received > 0 THEN 'PARTIALLY_RECEIVED'
                ELSE status
            END,
            received_at = CASE
                WHEN v_received >= v_total THEN now()
                ELSE received_at
            END
        WHERE id = NEW.purchase_order_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_purchase_order_receipt_status ON public.goods_receipts;
CREATE TRIGGER trg_refresh_purchase_order_receipt_status
    AFTER UPDATE OF status ON public.goods_receipts
    FOR EACH ROW EXECUTE FUNCTION public.refresh_purchase_order_receipt_status();

-- ============================================================================
-- 14. POST GOODS RECEIPT TO INVENTORY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.post_goods_receipt_inventory()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_line RECORD;
    v_existing_transaction BOOLEAN;
BEGIN
    IF NEW.status = 'RECEIVED' AND OLD.status IS DISTINCT FROM 'RECEIVED' THEN
        FOR v_line IN
            SELECT grl.*, gr.company_id, gr.warehouse_id, gr.receipt_number
            FROM public.goods_receipt_lines grl
            JOIN public.goods_receipts gr ON gr.id = grl.goods_receipt_id
            WHERE grl.goods_receipt_id = NEW.id AND grl.accepted_quantity > 0
        LOOP
            SELECT EXISTS (
                SELECT 1 FROM public.inventory_transactions it
                WHERE it.reference_type = 'GOODS_RECEIPT'
                  AND it.reference_id = NEW.id
                  AND it.product_id = v_line.product_id
                  AND it.transaction_type = 'PURCHASE_RECEIPT'
                  AND it.status = 'POSTED'
            ) INTO v_existing_transaction;

            IF NOT v_existing_transaction THEN
                INSERT INTO public.inventory_transactions (
                    company_id, warehouse_id, product_id, transaction_number,
                    transaction_type, status, quantity, unit_cost,
                    reference_type, reference_id, transaction_date, notes, posted_at
                )
                VALUES (
                    v_line.company_id, v_line.warehouse_id, v_line.product_id,
                    'GR-TXN-' || NEW.receipt_number || '-' || v_line.product_id::text,
                    'PURCHASE_RECEIPT', 'POSTED', v_line.accepted_quantity, v_line.unit_cost,
                    'GOODS_RECEIPT', NEW.id, NEW.receipt_date,
                    'Auto-generated from goods receipt ' || v_line.receipt_number, now()
                );
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_goods_receipt_inventory ON public.goods_receipts;
CREATE TRIGGER trg_post_goods_receipt_inventory
    AFTER UPDATE OF status ON public.goods_receipts
    FOR EACH ROW EXECUTE FUNCTION public.post_goods_receipt_inventory();

-- ============================================================================
-- 15. VALIDATE SUPPLIER INVOICE CONSISTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_supplier_invoice_consistency()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_supplier_company_id UUID;
    v_po_company_id UUID;
    v_po_supplier_id UUID;
BEGIN
    SELECT company_id INTO v_supplier_company_id
    FROM public.suppliers WHERE id = NEW.supplier_id;

    IF v_supplier_company_id IS DISTINCT FROM NEW.company_id THEN
        RAISE EXCEPTION 'Supplier must belong to the same company as the supplier invoice';
    END IF;

    IF NEW.purchase_order_id IS NOT NULL THEN
        SELECT company_id, supplier_id
        INTO v_po_company_id, v_po_supplier_id
        FROM public.purchase_orders WHERE id = NEW.purchase_order_id;

        IF v_po_company_id IS DISTINCT FROM NEW.company_id THEN
            RAISE EXCEPTION 'Purchase order must belong to the same company as the supplier invoice';
        END IF;

        IF v_po_supplier_id IS DISTINCT FROM NEW.supplier_id THEN
            RAISE EXCEPTION 'Purchase order supplier must match supplier invoice supplier';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_supplier_invoice_consistency ON public.supplier_invoices;
CREATE TRIGGER trg_validate_supplier_invoice_consistency
    BEFORE INSERT OR UPDATE ON public.supplier_invoices
    FOR EACH ROW EXECUTE FUNCTION public.validate_supplier_invoice_consistency();

-- ============================================================================
-- 16. VALIDATE SUPPLIER PAYMENT ALLOCATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_supplier_payment_allocation()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment_direction TEXT;
    v_payment_status TEXT;
    v_payment_company_id UUID;
    v_payment_amount NUMERIC(15,3);
    v_total_allocated NUMERIC(15,3);
    v_invoice_company_id UUID;
    v_invoice_total NUMERIC(15,3);
    v_invoice_paid NUMERIC(15,3);
BEGIN
    SELECT direction, status, company_id, amount
    INTO v_payment_direction, v_payment_status, v_payment_company_id, v_payment_amount
    FROM public.payments WHERE id = NEW.payment_id;

    IF v_payment_direction <> 'OUTBOUND' THEN
        RAISE EXCEPTION 'Supplier payment allocations require an OUTBOUND payment';
    END IF;

    IF v_payment_status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot allocate a cancelled payment';
    END IF;

    SELECT company_id, total_amount, paid_amount
    INTO v_invoice_company_id, v_invoice_total, v_invoice_paid
    FROM public.supplier_invoices WHERE id = NEW.supplier_invoice_id;

    IF v_payment_company_id <> v_invoice_company_id THEN
        RAISE EXCEPTION 'Payment and supplier invoice must belong to the same company';
    END IF;

    SELECT COALESCE(SUM(allocated_amount), 0)
    INTO v_total_allocated
    FROM public.supplier_payment_allocations
    WHERE payment_id = NEW.payment_id
      AND id <> COALESCE(NEW.id, gen_random_uuid());

    IF v_total_allocated + NEW.allocated_amount > v_payment_amount THEN
        RAISE EXCEPTION 'Payment allocation exceeds payment amount';
    END IF;

    IF NEW.allocated_amount > v_invoice_total - v_invoice_paid THEN
        RAISE EXCEPTION 'Payment allocation exceeds outstanding supplier invoice balance';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_supplier_payment_allocation ON public.supplier_payment_allocations;
CREATE TRIGGER trg_validate_supplier_payment_allocation
    BEFORE INSERT OR UPDATE ON public.supplier_payment_allocations
    FOR EACH ROW EXECUTE FUNCTION public.validate_supplier_payment_allocation();

-- ============================================================================
-- 17. SYNCHRONIZE SUPPLIER INVOICE PAYMENT STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_supplier_invoice_payment_status(p_supplier_invoice_id UUID)
RETURNS VOID
SET search_path = public, pg_temp
AS $$
DECLARE
    v_paid NUMERIC(15,3);
    v_total NUMERIC(15,3);
BEGIN
    SELECT total_amount INTO v_total
    FROM public.supplier_invoices WHERE id = p_supplier_invoice_id;

    SELECT COALESCE(SUM(spa.allocated_amount), 0)
    INTO v_paid
    FROM public.supplier_payment_allocations spa
    JOIN public.payments p ON p.id = spa.payment_id
    WHERE spa.supplier_invoice_id = p_supplier_invoice_id AND p.status = 'POSTED';

    UPDATE public.supplier_invoices
    SET
        paid_amount = v_paid,
        status = CASE
            WHEN status = 'CANCELLED' THEN 'CANCELLED'
            WHEN v_paid <= 0 THEN
                CASE WHEN status = 'POSTED' THEN 'POSTED' ELSE status END
            WHEN v_paid < v_total THEN 'PARTIAL'
            WHEN v_paid >= v_total THEN 'PAID'
            ELSE status
        END
    WHERE id = p_supplier_invoice_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_sync_supplier_invoice_payment_status()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.sync_supplier_invoice_payment_status(OLD.supplier_invoice_id);
    ELSE
        PERFORM public.sync_supplier_invoice_payment_status(NEW.supplier_invoice_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_supplier_invoice_payment_status ON public.supplier_payment_allocations;
CREATE TRIGGER trg_sync_supplier_invoice_payment_status
    AFTER INSERT OR UPDATE OR DELETE ON public.supplier_payment_allocations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_supplier_invoice_payment_status();

-- ============================================================================
-- 18. PAYMENT POSTING STATUS SYNCHRONIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_supplier_invoice_status_on_payment_post()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_allocation RECORD;
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        FOR v_allocation IN
            SELECT supplier_invoice_id
            FROM public.supplier_payment_allocations WHERE payment_id = NEW.id
        LOOP
            PERFORM public.sync_supplier_invoice_payment_status(v_allocation.supplier_invoice_id);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_supplier_invoice_status_on_payment_post ON public.payments;
CREATE TRIGGER trg_sync_supplier_invoice_status_on_payment_post
    AFTER UPDATE OF status ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.sync_supplier_invoice_status_on_payment_post();

-- ============================================================================
-- 19. PREVENT LOCKED GOODS RECEIPT MODIFICATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_goods_receipt_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'RECEIVED' THEN
            RAISE EXCEPTION 'Cannot delete a received goods receipt';
        END IF;
        RETURN OLD;
    END IF;

    IF OLD.status = 'RECEIVED' AND (
        NEW.purchase_order_id IS DISTINCT FROM OLD.purchase_order_id OR
        NEW.supplier_id IS DISTINCT FROM OLD.supplier_id OR
        NEW.warehouse_id IS DISTINCT FROM OLD.warehouse_id OR
        NEW.receipt_date IS DISTINCT FROM OLD.receipt_date
    ) THEN
        RAISE EXCEPTION 'Cannot modify a locked received goods receipt';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_goods_receipt_modification ON public.goods_receipts;
CREATE TRIGGER trg_prevent_locked_goods_receipt_modification
    BEFORE UPDATE OR DELETE ON public.goods_receipts
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_goods_receipt_modification();

CREATE OR REPLACE FUNCTION public.prevent_locked_goods_receipt_line_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status
    FROM public.goods_receipts
    WHERE id = COALESCE(NEW.goods_receipt_id, OLD.goods_receipt_id);

    IF v_status = 'RECEIVED' THEN
        RAISE EXCEPTION 'Cannot modify goods receipt lines after receipt has been posted';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_goods_receipt_line_modification ON public.goods_receipt_lines;
CREATE TRIGGER trg_prevent_locked_goods_receipt_line_modification
    BEFORE INSERT OR UPDATE OR DELETE ON public.goods_receipt_lines
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_goods_receipt_line_modification();

-- ============================================================================
-- 20. PREVENT POSTED SUPPLIER INVOICE MODIFICATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_posted_supplier_invoice_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.status IN ('POSTED', 'PARTIAL', 'PAID') THEN
            RAISE EXCEPTION 'Cannot delete a posted or settled supplier invoice';
        END IF;
        RETURN OLD;
    END IF;

    IF OLD.status IN ('POSTED', 'PARTIAL', 'PAID') THEN
        IF NEW.supplier_id IS DISTINCT FROM OLD.supplier_id OR
           NEW.purchase_order_id IS DISTINCT FROM OLD.purchase_order_id OR
           NEW.invoice_date IS DISTINCT FROM OLD.invoice_date OR
           NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
            RAISE EXCEPTION 'Cannot modify financial fields of a posted or settled supplier invoice';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_posted_supplier_invoice_modification ON public.supplier_invoices;
CREATE TRIGGER trg_prevent_posted_supplier_invoice_modification
    BEFORE UPDATE OR DELETE ON public.supplier_invoices
    FOR EACH ROW EXECUTE FUNCTION public.prevent_posted_supplier_invoice_modification();

CREATE OR REPLACE FUNCTION public.prevent_locked_supplier_invoice_line_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status
    FROM public.supplier_invoices
    WHERE id = COALESCE(NEW.supplier_invoice_id, OLD.supplier_invoice_id);

    IF v_status IN ('POSTED', 'PARTIAL', 'PAID') THEN
        RAISE EXCEPTION 'Cannot modify supplier invoice lines after invoice posting';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_locked_supplier_invoice_line_modification ON public.supplier_invoice_lines;
CREATE TRIGGER trg_prevent_locked_supplier_invoice_line_modification
    BEFORE INSERT OR UPDATE OR DELETE ON public.supplier_invoice_lines
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_supplier_invoice_line_modification();

-- ============================================================================
-- 21. RLS
-- ============================================================================

ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payment_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purchase_order_lines_policy ON public.purchase_order_lines;
CREATE POLICY purchase_order_lines_policy ON public.purchase_order_lines
    FOR ALL TO authenticated
    USING (purchase_order_id IN (SELECT id FROM public.purchase_orders WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (purchase_order_id IN (SELECT id FROM public.purchase_orders WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS goods_receipts_policy ON public.goods_receipts;
CREATE POLICY goods_receipts_policy ON public.goods_receipts
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS goods_receipt_lines_policy ON public.goods_receipt_lines;
CREATE POLICY goods_receipt_lines_policy ON public.goods_receipt_lines
    FOR ALL TO authenticated
    USING (goods_receipt_id IN (SELECT id FROM public.goods_receipts WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (goods_receipt_id IN (SELECT id FROM public.goods_receipts WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS supplier_invoices_policy ON public.supplier_invoices;
CREATE POLICY supplier_invoices_policy ON public.supplier_invoices
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS supplier_invoice_lines_policy ON public.supplier_invoice_lines;
CREATE POLICY supplier_invoice_lines_policy ON public.supplier_invoice_lines
    FOR ALL TO authenticated
    USING (supplier_invoice_id IN (SELECT id FROM public.supplier_invoices WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (supplier_invoice_id IN (SELECT id FROM public.supplier_invoices WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS supplier_payment_allocations_policy ON public.supplier_payment_allocations;
CREATE POLICY supplier_payment_allocations_policy ON public.supplier_payment_allocations
    FOR ALL TO authenticated
    USING (supplier_invoice_id IN (SELECT id FROM public.supplier_invoices WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (supplier_invoice_id IN (SELECT id FROM public.supplier_invoices WHERE company_id IN (SELECT public.auth_user_company_ids())));

-- ============================================================================
-- 22. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_purchase_order_id ON public.purchase_order_lines(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_lines_product_id ON public.purchase_order_lines(product_id);

CREATE INDEX IF NOT EXISTS idx_goods_receipts_company_id ON public.goods_receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_purchase_order_id ON public.goods_receipts(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_supplier_id ON public.goods_receipts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_warehouse_id ON public.goods_receipts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_status ON public.goods_receipts(company_id, status);

CREATE INDEX IF NOT EXISTS idx_goods_receipt_lines_receipt_id ON public.goods_receipt_lines(goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipt_lines_purchase_order_line_id ON public.goods_receipt_lines(purchase_order_line_id);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_company_id ON public.supplier_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier_id ON public.supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_purchase_order_id ON public.supplier_invoices(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON public.supplier_invoices(company_id, status);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_due_date ON public.supplier_invoices(company_id, due_date);

CREATE INDEX IF NOT EXISTS idx_supplier_invoice_lines_invoice_id ON public.supplier_invoice_lines(supplier_invoice_id);

CREATE INDEX IF NOT EXISTS idx_supplier_payment_allocations_payment_id ON public.supplier_payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_allocations_invoice_id ON public.supplier_payment_allocations(supplier_invoice_id);

-- ============================================================================
-- 23. FUNCTION EXECUTION HARDENING
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.set_purchasing_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_sync_purchase_order_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_sync_supplier_invoice_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_goods_receipt_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_goods_receipt_line() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_sync_purchase_order_received_quantity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_purchase_order_receipt_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.post_goods_receipt_inventory() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_supplier_invoice_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_supplier_payment_allocation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_sync_supplier_invoice_payment_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_supplier_invoice_status_on_payment_post() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_goods_receipt_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_goods_receipt_line_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_posted_supplier_invoice_modification() FROM PUBLIC, anon, authenticated;
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

        IF NEW.direction = 'INBOUND' THEN
            IF NEW.customer_id IS NULL THEN
                RAISE EXCEPTION 'INBOUND payment requires a customer.';
            END IF;

            SELECT COALESCE(SUM(allocated_amount), 0)
            INTO v_allocated_amount
            FROM public.payment_allocations
            WHERE payment_id = NEW.id;
        ELSIF NEW.direction = 'OUTBOUND' THEN
            IF NEW.supplier_id IS NULL THEN
                RAISE EXCEPTION 'OUTBOUND payment requires a supplier.';
            END IF;

            SELECT COALESCE(SUM(allocated_amount), 0)
            INTO v_allocated_amount
            FROM public.supplier_payment_allocations
            WHERE payment_id = NEW.id;
        END IF;

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

COMMIT;
