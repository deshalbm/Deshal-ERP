-- ============================================================================
-- Deshal ERP
-- Migration 0015: Inventory Transactions & Stock Movements
----------------------------------------------------------------------------
-- Purpose:
-- Enterprise inventory movement architecture including:
-- - Immutable posted inventory transactions
-- - Automatic stock balance synchronization
-- - Warehouse-to-warehouse transfers
-- - Stock reservations
-- - Company consistency validation
-- - Negative stock protection
-- - RLS policies
-- - Hardened trigger functions
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. STOCK BALANCE HARDENING
-- ============================================================================

ALTER TABLE public.stock_balances
ADD COLUMN IF NOT EXISTS reserved_quantity NUMERIC(15,3) NOT NULL DEFAULT 0;

ALTER TABLE public.stock_balances
ADD COLUMN IF NOT EXISTS available_quantity NUMERIC(15,3)
GENERATED ALWAYS AS (quantity - reserved_quantity) STORED;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_stock_balances_reserved_quantity'
    ) THEN
        ALTER TABLE public.stock_balances
        ADD CONSTRAINT chk_stock_balances_reserved_quantity
        CHECK (reserved_quantity >= 0);
    END IF;
END;
$$;

-- ============================================================================
-- 2. INVENTORY TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    transaction_number TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    quantity NUMERIC(15,3) NOT NULL,
    unit_cost NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_cost NUMERIC(15,3) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    reference_type TEXT,
    reference_id UUID,
    source_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    destination_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    notes TEXT,
    posted_at TIMESTAMPTZ,
    posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_inventory_transaction_type CHECK (
        transaction_type IN (
            'OPENING', 'PURCHASE_RECEIPT', 'PURCHASE_RETURN',
            'SALE_ISSUE', 'SALE_RETURN', 'TRANSFER_OUT',
            'TRANSFER_IN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT',
            'PRODUCTION_IN', 'PRODUCTION_OUT'
        )
    ),
    CONSTRAINT chk_inventory_transaction_status CHECK (
        status IN ('DRAFT', 'POSTED', 'CANCELLED')
    ),
    CONSTRAINT chk_inventory_transaction_quantity CHECK (quantity > 0),
    CONSTRAINT chk_inventory_transaction_cost CHECK (unit_cost >= 0),
    CONSTRAINT ux_inventory_transaction_number UNIQUE (company_id, transaction_number)
);

-- ============================================================================
-- 3. STOCK TRANSFERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    transfer_number TEXT NOT NULL,
    source_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    destination_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    transfer_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_stock_transfer_number UNIQUE (company_id, transfer_number),
    CONSTRAINT chk_stock_transfer_status CHECK (
        status IN ('DRAFT', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED')
    ),
    CONSTRAINT chk_stock_transfer_warehouses CHECK (source_warehouse_id <> destination_warehouse_id)
);

-- ============================================================================
-- 4. STOCK TRANSFER LINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_transfer_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(15,3) NOT NULL,
    unit_cost NUMERIC(15,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_stock_transfer_line_quantity CHECK (quantity > 0),
    CONSTRAINT chk_stock_transfer_line_cost CHECK (unit_cost >= 0),
    CONSTRAINT ux_stock_transfer_product UNIQUE (stock_transfer_id, product_id)
);

-- ============================================================================
-- 5. STOCK RESERVATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    sales_order_id UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    sales_order_line_id UUID REFERENCES public.sales_order_lines(id) ON DELETE CASCADE,
    reserved_quantity NUMERIC(15,3) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    released_at TIMESTAMPTZ,
    fulfilled_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_stock_reservation_quantity CHECK (reserved_quantity > 0),
    CONSTRAINT chk_stock_reservation_status CHECK (
        status IN ('ACTIVE', 'RELEASED', 'FULFILLED', 'CANCELLED')
    )
);

-- ============================================================================
-- 6. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_company_date ON public.inventory_transactions(company_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_warehouse ON public.inventory_transactions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_status ON public.inventory_transactions(status);

CREATE INDEX IF NOT EXISTS idx_stock_transfers_company_status ON public.stock_transfers(company_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_lines_product ON public.stock_transfer_lines(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_company_product ON public.stock_reservations(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_warehouse_product ON public.stock_reservations(warehouse_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_status ON public.stock_reservations(status);

-- ============================================================================
-- 7. UPDATED_AT HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_inventory_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_transactions_updated_at ON public.inventory_transactions;
CREATE TRIGGER trg_inventory_transactions_updated_at
    BEFORE UPDATE ON public.inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION public.set_inventory_updated_at();

DROP TRIGGER IF EXISTS trg_stock_transfers_updated_at ON public.stock_transfers;
CREATE TRIGGER trg_stock_transfers_updated_at
    BEFORE UPDATE ON public.stock_transfers
    FOR EACH ROW EXECUTE FUNCTION public.set_inventory_updated_at();

DROP TRIGGER IF EXISTS trg_stock_reservations_updated_at ON public.stock_reservations;
CREATE TRIGGER trg_stock_reservations_updated_at
    BEFORE UPDATE ON public.stock_reservations
    FOR EACH ROW EXECUTE FUNCTION public.set_inventory_updated_at();

-- ============================================================================
-- 8. COMPANY CONSISTENCY VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_inventory_company_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product_company_id UUID;
    v_warehouse_company_id UUID;
BEGIN
    SELECT company_id INTO v_product_company_id
    FROM public.products WHERE id = NEW.product_id;

    IF v_product_company_id IS NULL THEN
        RAISE EXCEPTION 'Inventory Integrity Violation: Product % does not exist.', NEW.product_id;
    END IF;

    IF v_product_company_id <> NEW.company_id THEN
        RAISE EXCEPTION 'Inventory Integrity Violation: Product does not belong to the transaction company.';
    END IF;

    SELECT company_id INTO v_warehouse_company_id
    FROM public.warehouses WHERE id = NEW.warehouse_id;

    IF v_warehouse_company_id IS NULL THEN
        RAISE EXCEPTION 'Inventory Integrity Violation: Warehouse % does not exist.', NEW.warehouse_id;
    END IF;

    IF v_warehouse_company_id <> NEW.company_id THEN
        RAISE EXCEPTION 'Inventory Integrity Violation: Warehouse does not belong to the transaction company.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_inventory_company_consistency ON public.inventory_transactions;
CREATE TRIGGER trg_validate_inventory_company_consistency
    BEFORE INSERT OR UPDATE ON public.inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION public.validate_inventory_company_consistency();

-- ============================================================================
-- 9. STOCK BALANCE SYNCHRONIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_inventory_transaction_to_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_quantity_delta NUMERIC(15,3);
    v_current_quantity NUMERIC(15,3);
BEGIN
    IF NEW.status <> 'POSTED' THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.status = 'POSTED' THEN
        RETURN NEW;
    END IF;

    CASE NEW.transaction_type
        WHEN 'OPENING', 'PURCHASE_RECEIPT', 'SALE_RETURN',
             'TRANSFER_IN', 'ADJUSTMENT_IN', 'PRODUCTION_IN'
        THEN
            v_quantity_delta := NEW.quantity;

        WHEN 'PURCHASE_RETURN', 'SALE_ISSUE', 'TRANSFER_OUT',
             'ADJUSTMENT_OUT', 'PRODUCTION_OUT'
        THEN
            v_quantity_delta := -NEW.quantity;

        ELSE
            RAISE EXCEPTION 'Unsupported inventory transaction type: %', NEW.transaction_type;
    END CASE;

    SELECT quantity INTO v_current_quantity
    FROM public.stock_balances
    WHERE product_id = NEW.product_id
      AND warehouse_id = NEW.warehouse_id
    FOR UPDATE;

    IF v_current_quantity IS NULL THEN
        IF v_quantity_delta < 0 THEN
            RAISE EXCEPTION 'Insufficient stock: Cannot reduce inventory below zero for product % in warehouse %.',
                NEW.product_id, NEW.warehouse_id;
        END IF;

        INSERT INTO public.stock_balances (
            id, company_id, product_id, warehouse_id, quantity, reserved_quantity
        )
        VALUES (
            gen_random_uuid(), NEW.company_id, NEW.product_id, NEW.warehouse_id, v_quantity_delta, 0
        );
    ELSE
        IF (v_current_quantity + v_quantity_delta) < 0 THEN
            RAISE EXCEPTION 'Insufficient stock: Product % would have negative stock in warehouse %.',
                NEW.product_id, NEW.warehouse_id;
        END IF;

        UPDATE public.stock_balances
        SET quantity = quantity + v_quantity_delta
        WHERE product_id = NEW.product_id
          AND warehouse_id = NEW.warehouse_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_inventory_transaction_to_stock ON public.inventory_transactions;
CREATE TRIGGER trg_apply_inventory_transaction_to_stock
    AFTER INSERT OR UPDATE OF status ON public.inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_transaction_to_stock();

-- ============================================================================
-- 10. PREVENT MODIFICATION OF POSTED INVENTORY TRANSACTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_posted_inventory_transaction_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status = 'POSTED' THEN
        RAISE EXCEPTION 'Inventory Integrity Violation: Posted inventory transactions cannot be modified or deleted. Create a reversal or adjustment transaction instead.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_posted_inventory_transaction_modification ON public.inventory_transactions;
CREATE TRIGGER trg_prevent_posted_inventory_transaction_modification
    BEFORE UPDATE OR DELETE ON public.inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION public.prevent_posted_inventory_transaction_modification();

-- ============================================================================
-- 11. STOCK RESERVATION VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_stock_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_available_quantity NUMERIC(15,3);
    v_product_company_id UUID;
    v_warehouse_company_id UUID;
BEGIN
    SELECT company_id INTO v_product_company_id
    FROM public.products WHERE id = NEW.product_id;

    IF v_product_company_id IS DISTINCT FROM NEW.company_id THEN
        RAISE EXCEPTION 'Reservation Integrity Violation: Product does not belong to reservation company.';
    END IF;

    SELECT company_id INTO v_warehouse_company_id
    FROM public.warehouses WHERE id = NEW.warehouse_id;

    IF v_warehouse_company_id IS DISTINCT FROM NEW.company_id THEN
        RAISE EXCEPTION 'Reservation Integrity Violation: Warehouse does not belong to reservation company.';
    END IF;

    IF NEW.status = 'ACTIVE' THEN
        SELECT available_quantity INTO v_available_quantity
        FROM public.stock_balances
        WHERE product_id = NEW.product_id
          AND warehouse_id = NEW.warehouse_id
        FOR UPDATE;

        IF COALESCE(v_available_quantity, 0) < NEW.reserved_quantity THEN
            RAISE EXCEPTION 'Insufficient available stock to reserve %. Available quantity: %.',
                NEW.reserved_quantity, COALESCE(v_available_quantity, 0);
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_stock_reservation ON public.stock_reservations;
CREATE TRIGGER trg_validate_stock_reservation
    BEFORE INSERT OR UPDATE ON public.stock_reservations
    FOR EACH ROW EXECUTE FUNCTION public.validate_stock_reservation();

-- ============================================================================
-- 12. SYNCHRONIZE RESERVED QUANTITY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_stock_reserved_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product_id UUID;
    v_warehouse_id UUID;
    v_company_id UUID;
    v_reserved NUMERIC(15,3);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_product_id := OLD.product_id;
        v_warehouse_id := OLD.warehouse_id;
        v_company_id := OLD.company_id;
    ELSE
        v_product_id := NEW.product_id;
        v_warehouse_id := NEW.warehouse_id;
        v_company_id := NEW.company_id;
    END IF;

    SELECT COALESCE(SUM(reserved_quantity), 0)
    INTO v_reserved
    FROM public.stock_reservations
    WHERE product_id = v_product_id
      AND warehouse_id = v_warehouse_id
      AND status = 'ACTIVE';

    INSERT INTO public.stock_balances (
        id, company_id, product_id, warehouse_id, quantity, reserved_quantity
    )
    VALUES (
        gen_random_uuid(), v_company_id, v_product_id, v_warehouse_id, 0, v_reserved
    )
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET reserved_quantity = EXCLUDED.reserved_quantity;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_stock_reserved_quantity ON public.stock_reservations;
CREATE TRIGGER trg_sync_stock_reserved_quantity
    AFTER INSERT OR UPDATE OR DELETE ON public.stock_reservations
    FOR EACH ROW EXECUTE FUNCTION public.sync_stock_reserved_quantity();

-- ============================================================================
-- 13. STOCK TRANSFER VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_stock_transfer_company_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_source_company UUID;
    v_destination_company UUID;
BEGIN
    SELECT company_id INTO v_source_company
    FROM public.warehouses WHERE id = NEW.source_warehouse_id;

    SELECT company_id INTO v_destination_company
    FROM public.warehouses WHERE id = NEW.destination_warehouse_id;

    IF v_source_company IS NULL OR v_destination_company IS NULL THEN
        RAISE EXCEPTION 'Stock Transfer Integrity Violation: Warehouse not found.';
    END IF;

    IF v_source_company <> NEW.company_id OR v_destination_company <> NEW.company_id THEN
        RAISE EXCEPTION 'Stock Transfer Integrity Violation: Both warehouses must belong to the transfer company.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_stock_transfer_company_consistency ON public.stock_transfers;
CREATE TRIGGER trg_validate_stock_transfer_company_consistency
    BEFORE INSERT OR UPDATE ON public.stock_transfers
    FOR EACH ROW EXECUTE FUNCTION public.validate_stock_transfer_company_consistency();

-- ============================================================================
-- 14. PREVENT LOCKED TRANSFER LINE MODIFICATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_stock_transfer_line_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_transfer_status TEXT;
    v_transfer_id UUID;
BEGIN
    v_transfer_id := CASE
        WHEN TG_OP = 'DELETE' THEN OLD.stock_transfer_id
        ELSE NEW.stock_transfer_id
    END;

    SELECT status INTO v_transfer_status
    FROM public.stock_transfers WHERE id = v_transfer_id;

    IF v_transfer_status IN ('IN_TRANSIT', 'RECEIVED') THEN
        RAISE EXCEPTION 'Stock Transfer Integrity Violation: Transfer lines cannot be modified after shipment.';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_locked_stock_transfer_line_modification ON public.stock_transfer_lines;
CREATE TRIGGER trg_prevent_locked_stock_transfer_line_modification
    BEFORE INSERT OR UPDATE OR DELETE ON public.stock_transfer_lines
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_stock_transfer_line_modification();

-- ============================================================================
-- 15. TRANSFER STATUS WORKFLOW
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_stock_transfer_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_line_count INTEGER;
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_line_count
    FROM public.stock_transfer_lines
    WHERE stock_transfer_id = NEW.id;

    IF NEW.status = 'IN_TRANSIT' THEN
        IF OLD.status <> 'DRAFT' THEN
            RAISE EXCEPTION 'Invalid stock transfer transition: % -> %.', OLD.status, NEW.status;
        END IF;

        IF v_line_count = 0 THEN
            RAISE EXCEPTION 'Cannot ship a stock transfer without lines.';
        END IF;

        NEW.shipped_at = now();

    ELSIF NEW.status = 'RECEIVED' THEN
        IF OLD.status <> 'IN_TRANSIT' THEN
            RAISE EXCEPTION 'Invalid stock transfer transition: % -> %.', OLD.status, NEW.status;
        END IF;

        NEW.received_at = now();

    ELSIF NEW.status = 'CANCELLED' THEN
        IF OLD.status NOT IN ('DRAFT', 'IN_TRANSIT') THEN
            RAISE EXCEPTION 'Invalid stock transfer cancellation.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_stock_transfer_status_transition ON public.stock_transfers;
CREATE TRIGGER trg_validate_stock_transfer_status_transition
    BEFORE UPDATE OF status ON public.stock_transfers
    FOR EACH ROW EXECUTE FUNCTION public.validate_stock_transfer_status_transition();

-- ============================================================================
-- 16. AUTOMATIC INVENTORY TRANSACTIONS FOR STOCK TRANSFERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_stock_transfer_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_line RECORD;
    v_transaction_number TEXT;
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'IN_TRANSIT' AND OLD.status = 'DRAFT' THEN
        FOR v_line IN
            SELECT * FROM public.stock_transfer_lines
            WHERE stock_transfer_id = NEW.id
        LOOP
            v_transaction_number := NEW.transfer_number || '-OUT-' || v_line.id::TEXT;

            INSERT INTO public.inventory_transactions (
                company_id, warehouse_id, product_id, transaction_number,
                transaction_type, status, quantity, unit_cost,
                transaction_date, reference_type, reference_id,
                source_warehouse_id, destination_warehouse_id, notes, posted_at
            )
            VALUES (
                NEW.company_id, NEW.source_warehouse_id, v_line.product_id, v_transaction_number,
                'TRANSFER_OUT', 'POSTED', v_line.quantity, v_line.unit_cost,
                now(), 'STOCK_TRANSFER', NEW.id, NEW.source_warehouse_id, NEW.destination_warehouse_id,
                'Automatic transfer shipment', now()
            );
        END LOOP;
    END IF;

    IF NEW.status = 'RECEIVED' AND OLD.status = 'IN_TRANSIT' THEN
        FOR v_line IN
            SELECT * FROM public.stock_transfer_lines
            WHERE stock_transfer_id = NEW.id
        LOOP
            v_transaction_number := NEW.transfer_number || '-IN-' || v_line.id::TEXT;

            INSERT INTO public.inventory_transactions (
                company_id, warehouse_id, product_id, transaction_number,
                transaction_type, status, quantity, unit_cost,
                transaction_date, reference_type, reference_id,
                source_warehouse_id, destination_warehouse_id, notes, posted_at
            )
            VALUES (
                NEW.company_id, NEW.destination_warehouse_id, v_line.product_id, v_transaction_number,
                'TRANSFER_IN', 'POSTED', v_line.quantity, v_line.unit_cost,
                now(), 'STOCK_TRANSFER', NEW.id, NEW.source_warehouse_id, NEW.destination_warehouse_id,
                'Automatic transfer receipt', now()
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_process_stock_transfer_inventory ON public.stock_transfers;
CREATE TRIGGER trg_process_stock_transfer_inventory
    AFTER UPDATE OF status ON public.stock_transfers
    FOR EACH ROW EXECUTE FUNCTION public.process_stock_transfer_inventory();

-- ============================================================================
-- 17. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_transactions_policy ON public.inventory_transactions;
CREATE POLICY inventory_transactions_policy ON public.inventory_transactions
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS stock_transfers_policy ON public.stock_transfers;
CREATE POLICY stock_transfers_policy ON public.stock_transfers
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS stock_transfer_lines_policy ON public.stock_transfer_lines;
CREATE POLICY stock_transfer_lines_policy ON public.stock_transfer_lines
    FOR ALL TO authenticated
    USING (stock_transfer_id IN (SELECT id FROM public.stock_transfers WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (stock_transfer_id IN (SELECT id FROM public.stock_transfers WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS stock_reservations_policy ON public.stock_reservations;
CREATE POLICY stock_reservations_policy ON public.stock_reservations
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- ============================================================================
-- 18. FUNCTION EXECUTION HARDENING
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.set_inventory_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_inventory_company_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_inventory_transaction_to_stock() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_posted_inventory_transaction_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_stock_reservation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_stock_reserved_quantity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_stock_transfer_company_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_stock_transfer_line_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_stock_transfer_status_transition() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_stock_transfer_inventory() FROM PUBLIC, anon, authenticated;

COMMIT;
