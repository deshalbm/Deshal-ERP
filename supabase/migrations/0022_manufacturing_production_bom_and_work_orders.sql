-- ============================================================================
-- Deshal ERP
-- Migration 0022: Manufacturing, Production, BOM & Work Orders
--
-- File:
--   0022_manufacturing_production_bom_and_work_orders.sql
--
-- Dependencies:
--   0015_inventory_transactions_and_stock_movements.sql
--   0020_budgeting_financial_planning_and_budget_control.sql
--   0021_projects_job_costing_and_profitability.sql
--
-- Purpose:
--   * Bill of Materials (BOM) & BOM Components
--   * Work Centers & Production Routings
--   * Work Orders (Planning & Execution)
--   * Material Consumption & Operation Tracking
--   * Production Output & Stock Entry Integration
--   * Project Costing Integration
--   * RLS & Financial Integrity Controls
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. WORK CENTERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    hourly_cost NUMERIC(15,3) NOT NULL DEFAULT 0,
    capacity_per_hour NUMERIC(15,3) NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_work_centers_hourly_cost CHECK (hourly_cost >= 0),
    CONSTRAINT chk_work_centers_capacity CHECK (capacity_per_hour > 0),
    CONSTRAINT ux_work_centers_company_code UNIQUE (company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_work_centers_company ON public.work_centers(company_id);
CREATE INDEX IF NOT EXISTS idx_work_centers_branch ON public.work_centers(branch_id);

-- ============================================================================
-- 2. BILL OF MATERIALS (BOM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.boms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    output_quantity NUMERIC(18,3) NOT NULL DEFAULT 1,
    scrap_percentage NUMERIC(7,4) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    CONSTRAINT chk_boms_output_quantity CHECK (output_quantity > 0),
    CONSTRAINT chk_boms_scrap_percentage CHECK (scrap_percentage >= 0 AND scrap_percentage <= 100),
    CONSTRAINT chk_boms_status CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
    CONSTRAINT chk_boms_effective_dates CHECK (
        effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from
    ),
    CONSTRAINT ux_boms_company_code_version UNIQUE (company_id, code, version)
);

CREATE INDEX IF NOT EXISTS idx_boms_company ON public.boms(company_id);
CREATE INDEX IF NOT EXISTS idx_boms_product ON public.boms(product_id);
CREATE INDEX IF NOT EXISTS idx_boms_active_product ON public.boms(company_id, product_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS ux_boms_one_default
    ON public.boms(company_id, product_id)
    WHERE is_default = TRUE AND status = 'ACTIVE';

-- ============================================================================
-- 3. BOM COMPONENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bom_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_id UUID NOT NULL REFERENCES public.boms(id) ON DELETE CASCADE,
    component_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(18,3) NOT NULL,
    scrap_percentage NUMERIC(7,4) NOT NULL DEFAULT 0,
    sequence INTEGER NOT NULL DEFAULT 10,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_bom_components_quantity CHECK (quantity > 0),
    CONSTRAINT chk_bom_components_scrap CHECK (scrap_percentage >= 0 AND scrap_percentage <= 100),
    CONSTRAINT ux_bom_component_product UNIQUE (bom_id, component_product_id)
);

CREATE INDEX IF NOT EXISTS idx_bom_components_bom ON public.bom_components(bom_id);
CREATE INDEX IF NOT EXISTS idx_bom_components_product ON public.bom_components(component_product_id);

-- ============================================================================
-- 4. PRODUCTION ROUTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.production_routings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    bom_id UUID NOT NULL REFERENCES public.boms(id) ON DELETE CASCADE,
    work_center_id UUID NOT NULL REFERENCES public.work_centers(id) ON DELETE RESTRICT,
    sequence INTEGER NOT NULL DEFAULT 10,
    operation_name TEXT NOT NULL,
    description TEXT,
    setup_minutes INTEGER NOT NULL DEFAULT 0,
    run_minutes_per_unit NUMERIC(15,3) NOT NULL DEFAULT 0,
    expected_cost_per_unit NUMERIC(15,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_production_routing_setup CHECK (setup_minutes >= 0),
    CONSTRAINT chk_production_routing_run CHECK (run_minutes_per_unit >= 0),
    CONSTRAINT chk_production_routing_cost CHECK (expected_cost_per_unit >= 0),
    CONSTRAINT ux_production_routing_sequence UNIQUE (bom_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_production_routings_company ON public.production_routings(company_id);
CREATE INDEX IF NOT EXISTS idx_production_routings_bom ON public.production_routings(bom_id);
CREATE INDEX IF NOT EXISTS idx_production_routings_work_center ON public.production_routings(work_center_id);

-- ============================================================================
-- 5. WORK ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    bom_id UUID NOT NULL REFERENCES public.boms(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    source_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    destination_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    work_order_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    planned_quantity NUMERIC(18,3) NOT NULL,
    completed_quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
    rejected_quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_at TIMESTAMPTZ,
    actual_completed_at TIMESTAMPTZ,
    material_cost NUMERIC(18,3) NOT NULL DEFAULT 0,
    labor_cost NUMERIC(18,3) NOT NULL DEFAULT 0,
    overhead_cost NUMERIC(18,3) NOT NULL DEFAULT 0,
    total_production_cost NUMERIC(18,3) GENERATED ALWAYS AS (
        material_cost + labor_cost + overhead_cost
    ) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    CONSTRAINT ux_work_orders_company_number UNIQUE (company_id, work_order_number),
    CONSTRAINT chk_work_orders_status CHECK (
        status IN ('DRAFT', 'RELEASED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED')
    ),
    CONSTRAINT chk_work_orders_planned_quantity CHECK (planned_quantity > 0),
    CONSTRAINT chk_work_orders_completed_quantity CHECK (
        completed_quantity >= 0 AND completed_quantity <= planned_quantity
    ),
    CONSTRAINT chk_work_orders_rejected_quantity CHECK (rejected_quantity >= 0),
    CONSTRAINT chk_work_orders_dates CHECK (
        planned_end_date IS NULL OR planned_start_date IS NULL OR planned_end_date >= planned_start_date
    ),
    CONSTRAINT chk_work_orders_costs CHECK (
        material_cost >= 0 AND labor_cost >= 0 AND overhead_cost >= 0
    )
);

CREATE INDEX IF NOT EXISTS idx_work_orders_company ON public.work_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_project ON public.work_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_bom ON public.work_orders(bom_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_product ON public.work_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(company_id, status);

-- ============================================================================
-- 6. WORK ORDER MATERIALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_order_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    component_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    required_quantity NUMERIC(18,3) NOT NULL,
    issued_quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
    returned_quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(18,3) NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,3) GENERATED ALWAYS AS (
        issued_quantity * unit_cost
    ) STORED,
    inventory_transaction_id UUID REFERENCES public.inventory_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_work_order_material_required CHECK (required_quantity > 0),
    CONSTRAINT chk_work_order_material_issued CHECK (
        issued_quantity >= 0 AND issued_quantity <= required_quantity
    ),
    CONSTRAINT chk_work_order_material_returned CHECK (
        returned_quantity >= 0 AND returned_quantity <= issued_quantity
    ),
    CONSTRAINT chk_work_order_material_cost CHECK (unit_cost >= 0),
    CONSTRAINT ux_work_order_material_product UNIQUE (work_order_id, component_product_id)
);

CREATE INDEX IF NOT EXISTS idx_work_order_materials_order ON public.work_order_materials(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_materials_product ON public.work_order_materials(component_product_id);

-- ============================================================================
-- 7. WORK ORDER OPERATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_order_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    routing_id UUID REFERENCES public.production_routings(id) ON DELETE SET NULL,
    work_center_id UUID NOT NULL REFERENCES public.work_centers(id) ON DELETE RESTRICT,
    sequence INTEGER NOT NULL,
    operation_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    planned_minutes NUMERIC(18,3) NOT NULL DEFAULT 0,
    actual_minutes NUMERIC(18,3) NOT NULL DEFAULT 0,
    hourly_cost NUMERIC(18,3) NOT NULL DEFAULT 0,
    operation_cost NUMERIC(18,3) GENERATED ALWAYS AS (
        (actual_minutes / 60.0) * hourly_cost
    ) STORED,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_work_order_operation_status CHECK (
        status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')
    ),
    CONSTRAINT chk_work_order_operation_minutes CHECK (
        planned_minutes >= 0 AND actual_minutes >= 0
    ),
    CONSTRAINT chk_work_order_operation_cost CHECK (hourly_cost >= 0),
    CONSTRAINT ux_work_order_operation_sequence UNIQUE (work_order_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_work_order_operations_order ON public.work_order_operations(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_operations_center ON public.work_order_operations(work_center_id);

-- ============================================================================
-- 8. PRODUCTION OUTPUTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.production_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    quantity NUMERIC(18,3) NOT NULL,
    unit_cost NUMERIC(18,3) NOT NULL DEFAULT 0,
    inventory_transaction_id UUID REFERENCES public.inventory_transactions(id) ON DELETE SET NULL,
    produced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_production_outputs_quantity CHECK (quantity > 0),
    CONSTRAINT chk_production_outputs_cost CHECK (unit_cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_production_outputs_order ON public.production_outputs(work_order_id);
CREATE INDEX IF NOT EXISTS idx_production_outputs_product ON public.production_outputs(product_id);

-- ============================================================================
-- 9. UPDATED_AT HELPER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_manufacturing_updated_at()
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

-- ============================================================================
-- 10. COMPANY CONSISTENCY FOR BOM
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_bom_company_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product_company UUID;
BEGIN
    SELECT company_id INTO v_product_company FROM public.products WHERE id = NEW.product_id;
    IF v_product_company IS NULL OR v_product_company <> NEW.company_id THEN
        RAISE EXCEPTION 'Product company must match BOM company';
    END IF;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 11. COMPANY CONSISTENCY FOR BOM COMPONENTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_bom_component_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_bom_company UUID;
    v_component_company UUID;
BEGIN
    SELECT company_id INTO v_bom_company FROM public.boms WHERE id = NEW.bom_id;
    SELECT company_id INTO v_component_company FROM public.products WHERE id = NEW.component_product_id;

    IF v_bom_company IS NULL OR v_component_company IS NULL OR v_bom_company <> v_component_company THEN
        RAISE EXCEPTION 'BOM component product must belong to the same company';
    END IF;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 12. WORK ORDER COMPANY CONSISTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_work_order_company_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_bom_company UUID;
    v_product_company UUID;
    v_source_company UUID;
    v_destination_company UUID;
    v_project_company UUID;
BEGIN
    SELECT company_id INTO v_bom_company FROM public.boms WHERE id = NEW.bom_id;
    SELECT company_id INTO v_product_company FROM public.products WHERE id = NEW.product_id;
    SELECT company_id INTO v_source_company FROM public.warehouses WHERE id = NEW.source_warehouse_id;
    SELECT company_id INTO v_destination_company FROM public.warehouses WHERE id = NEW.destination_warehouse_id;

    IF v_bom_company <> NEW.company_id
       OR v_product_company <> NEW.company_id
       OR v_source_company <> NEW.company_id
       OR v_destination_company <> NEW.company_id THEN
        RAISE EXCEPTION 'All work order entities must belong to the same company';
    END IF;

    IF NEW.project_id IS NOT NULL THEN
        SELECT company_id INTO v_project_company FROM public.projects WHERE id = NEW.project_id;
        IF v_project_company <> NEW.company_id THEN
            RAISE EXCEPTION 'Project must belong to the same company';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 13. AUTO-LOAD BOM MATERIALS WHEN WORK ORDER IS CREATED
-- ============================================================================

CREATE OR REPLACE FUNCTION public.populate_work_order_materials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.work_order_materials (
        work_order_id, component_product_id, required_quantity, issued_quantity, returned_quantity, unit_cost
    )
    SELECT
        NEW.id,
        bc.component_product_id,
        ROUND((bc.quantity * NEW.planned_quantity / b.output_quantity) * (1 + (bc.scrap_percentage / 100)), 3),
        0, 0, 0
    FROM public.bom_components bc
    INNER JOIN public.boms b ON b.id = bc.bom_id
    WHERE bc.bom_id = NEW.bom_id;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 14. AUTO-LOAD ROUTING OPERATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.populate_work_order_operations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.work_order_operations (
        work_order_id, routing_id, work_center_id, sequence, operation_name, status, planned_minutes, actual_minutes, hourly_cost
    )
    SELECT
        NEW.id, pr.id, pr.work_center_id, pr.sequence, pr.operation_name, 'PENDING',
        (pr.setup_minutes + (pr.run_minutes_per_unit * NEW.planned_quantity)),
        0, wc.hourly_cost
    FROM public.production_routings pr
    INNER JOIN public.work_centers wc ON wc.id = pr.work_center_id
    WHERE pr.bom_id = NEW.bom_id;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 15. PREVENT INVALID WORK ORDER STATUS TRANSITIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_work_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_material_count INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
        IF OLD.status IN ('COMPLETED', 'CANCELLED') THEN
            RAISE EXCEPTION 'Completed or cancelled work orders cannot change status';
        END IF;

        IF OLD.status = 'DRAFT' AND NEW.status NOT IN ('RELEASED', 'CANCELLED') THEN
            RAISE EXCEPTION 'Invalid work order status transition from DRAFT';
        END IF;

        IF OLD.status = 'RELEASED' AND NEW.status NOT IN ('IN_PROGRESS', 'ON_HOLD', 'CANCELLED') THEN
            RAISE EXCEPTION 'Invalid work order status transition from RELEASED';
        END IF;

        IF OLD.status = 'IN_PROGRESS' AND NEW.status NOT IN ('ON_HOLD', 'COMPLETED', 'CANCELLED') THEN
            RAISE EXCEPTION 'Invalid work order status transition from IN_PROGRESS';
        END IF;

        IF OLD.status = 'ON_HOLD' AND NEW.status NOT IN ('IN_PROGRESS', 'CANCELLED') THEN
            RAISE EXCEPTION 'Invalid work order status transition from ON_HOLD';
        END IF;

        IF NEW.status = 'RELEASED' THEN
            SELECT COUNT(*) INTO v_material_count FROM public.work_order_materials WHERE work_order_id = NEW.id;
            IF v_material_count = 0 THEN
                RAISE EXCEPTION 'Cannot release work order without BOM materials';
            END IF;
        END IF;

        IF NEW.status = 'IN_PROGRESS' AND OLD.status = 'RELEASED' AND NEW.actual_start_at IS NULL THEN
            NEW.actual_start_at := now();
        END IF;

        IF NEW.status = 'COMPLETED' THEN
            IF NEW.completed_quantity <= 0 THEN
                RAISE EXCEPTION 'Cannot complete a work order with zero production quantity';
            END IF;
            NEW.actual_completed_at := now();
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 16. PREVENT MODIFICATION OF COMPLETED WORK ORDERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_work_order_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status IN ('COMPLETED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Completed or cancelled work orders cannot be modified';
    END IF;

    IF TG_OP = 'DELETE' AND OLD.status NOT IN ('DRAFT', 'CANCELLED') THEN
        RAISE EXCEPTION 'Only draft or cancelled work orders can be deleted';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- 17. PREVENT MODIFICATION OF MATERIALS AFTER PRODUCTION COMPLETION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_locked_work_order_material_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
    v_work_order_id UUID;
BEGIN
    v_work_order_id := COALESCE(NEW.work_order_id, OLD.work_order_id);

    SELECT status INTO v_status FROM public.work_orders WHERE id = v_work_order_id;

    IF v_status IN ('COMPLETED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Materials cannot be modified for completed or cancelled work orders';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- 18. PREVENT INVALID MATERIAL ISSUE QUANTITIES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_work_order_material_quantities()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.issued_quantity > NEW.required_quantity THEN
        RAISE EXCEPTION 'Issued quantity cannot exceed required quantity';
    END IF;

    IF NEW.returned_quantity > NEW.issued_quantity THEN
        RAISE EXCEPTION 'Returned quantity cannot exceed issued quantity';
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 19. SYNC WORK ORDER MATERIAL COST
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_work_order_material_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_work_order_id UUID;
BEGIN
    v_work_order_id := COALESCE(NEW.work_order_id, OLD.work_order_id);

    UPDATE public.work_orders wo
    SET material_cost = COALESCE(
            (SELECT SUM(issued_quantity * unit_cost) FROM public.work_order_materials wom WHERE wom.work_order_id = v_work_order_id),
            0
        )
    WHERE wo.id = v_work_order_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- 20. SYNC WORK ORDER OPERATION COST
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_work_order_operation_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_work_order_id UUID;
BEGIN
    v_work_order_id := COALESCE(NEW.work_order_id, OLD.work_order_id);

    UPDATE public.work_orders wo
    SET labor_cost = COALESCE(
            (SELECT SUM(operation_cost) FROM public.work_order_operations woo WHERE woo.work_order_id = v_work_order_id),
            0
        )
    WHERE wo.id = v_work_order_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- 21. CREATE PRODUCTION OUTPUT INVENTORY TRANSACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.post_production_output_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_company_id UUID;
    v_work_order_status TEXT;
BEGIN
    SELECT company_id, status INTO v_company_id, v_work_order_status
    FROM public.work_orders WHERE id = NEW.work_order_id;

    IF v_work_order_status NOT IN ('IN_PROGRESS', 'COMPLETED') THEN
        RAISE EXCEPTION 'Production output requires an active work order';
    END IF;

    INSERT INTO public.inventory_transactions (
        company_id, warehouse_id, product_id, transaction_number, transaction_type, quantity, unit_cost, status, transaction_date
    )
    VALUES (
        v_company_id, NEW.warehouse_id, NEW.product_id, 'PROD-OUT-' || gen_random_uuid()::text, 'PRODUCTION_IN', NEW.quantity, NEW.unit_cost, 'POSTED', now()
    )
    RETURNING id INTO NEW.inventory_transaction_id;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 22. VALIDATE PRODUCTION OUTPUT COMPANY CONSISTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_production_output_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_product UUID;
    v_order_company UUID;
    v_product_company UUID;
    v_warehouse_company UUID;
BEGIN
    SELECT product_id, company_id INTO v_order_product, v_order_company
    FROM public.work_orders WHERE id = NEW.work_order_id;

    SELECT company_id INTO v_product_company FROM public.products WHERE id = NEW.product_id;
    SELECT company_id INTO v_warehouse_company FROM public.warehouses WHERE id = NEW.warehouse_id;

    IF NEW.product_id <> v_order_product THEN
        RAISE EXCEPTION 'Production output product must match work order product';
    END IF;

    IF v_product_company <> v_order_company OR v_warehouse_company <> v_order_company THEN
        RAISE EXCEPTION 'Production output entities must belong to the work order company';
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 23. SYNC COMPLETED QUANTITY FROM PRODUCTION OUTPUTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_work_order_completed_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_work_order_id UUID;
BEGIN
    v_work_order_id := COALESCE(NEW.work_order_id, OLD.work_order_id);

    UPDATE public.work_orders wo
    SET completed_quantity = COALESCE(
            (SELECT SUM(quantity) FROM public.production_outputs po WHERE po.work_order_id = v_work_order_id),
            0
        )
    WHERE wo.id = v_work_order_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- 24. PROJECT COST INTEGRATION (ALIGNED WITH MIGRATION 0021)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_production_cost_to_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_project_id UUID;
    v_company_id UUID;
BEGIN
    SELECT project_id, company_id INTO v_project_id, v_company_id
    FROM public.work_orders WHERE id = NEW.work_order_id;

    IF v_project_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.project_cost_transactions (
        company_id, project_id, amount, status, transaction_type, source_type, transaction_date, description_ar
    )
    VALUES (
        v_company_id, v_project_id, NEW.quantity * NEW.unit_cost, 'POSTED', 'MATERIAL', 'OTHER', NEW.produced_at::DATE,
        'تكلفة إنتاج تصنيعي من أمر العمل ' || NEW.work_order_id::TEXT
    );

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 25. VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW public.v_work_order_costing
WITH (security_invoker = true)
AS
SELECT
    wo.id AS work_order_id,
    wo.company_id,
    wo.work_order_number,
    wo.status,
    wo.product_id,
    wo.planned_quantity,
    wo.completed_quantity,
    wo.material_cost,
    wo.labor_cost,
    wo.overhead_cost,
    wo.total_production_cost,
    CASE
        WHEN wo.completed_quantity > 0 THEN ROUND(wo.total_production_cost / wo.completed_quantity, 3)
        ELSE 0
    END AS actual_unit_cost,
    CASE
        WHEN wo.completed_quantity >= wo.planned_quantity THEN 'ON_TARGET'
        WHEN wo.status = 'COMPLETED' AND wo.completed_quantity < wo.planned_quantity THEN 'UNDER_PRODUCTION'
        WHEN wo.status IN ('IN_PROGRESS', 'RELEASED') THEN 'IN_PROGRESS'
        ELSE 'PENDING'
    END AS production_health
FROM public.work_orders wo;

CREATE OR REPLACE VIEW public.v_bom_material_requirements
WITH (security_invoker = true)
AS
SELECT
    b.id AS bom_id,
    b.company_id,
    b.product_id AS finished_product_id,
    b.output_quantity,
    bc.component_product_id,
    bc.quantity,
    bc.scrap_percentage,
    ROUND(bc.quantity * (1 + (bc.scrap_percentage / 100)), 3) AS effective_component_quantity
FROM public.boms b
INNER JOIN public.bom_components bc ON bc.bom_id = b.id;

-- ============================================================================
-- 26. RLS
-- ============================================================================

ALTER TABLE public.work_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_routings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS work_centers_policy ON public.work_centers;
CREATE POLICY work_centers_policy ON public.work_centers FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS boms_policy ON public.boms;
CREATE POLICY boms_policy ON public.boms FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS bom_components_policy ON public.bom_components;
CREATE POLICY bom_components_policy ON public.bom_components FOR ALL TO authenticated
    USING (bom_id IN (SELECT id FROM public.boms WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (bom_id IN (SELECT id FROM public.boms WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS production_routings_policy ON public.production_routings;
CREATE POLICY production_routings_policy ON public.production_routings FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS work_orders_policy ON public.work_orders;
CREATE POLICY work_orders_policy ON public.work_orders FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS work_order_materials_policy ON public.work_order_materials;
CREATE POLICY work_order_materials_policy ON public.work_order_materials FOR ALL TO authenticated
    USING (work_order_id IN (SELECT id FROM public.work_orders WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (work_order_id IN (SELECT id FROM public.work_orders WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS work_order_operations_policy ON public.work_order_operations;
CREATE POLICY work_order_operations_policy ON public.work_order_operations FOR ALL TO authenticated
    USING (work_order_id IN (SELECT id FROM public.work_orders WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (work_order_id IN (SELECT id FROM public.work_orders WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS production_outputs_policy ON public.production_outputs;
CREATE POLICY production_outputs_policy ON public.production_outputs FOR ALL TO authenticated
    USING (work_order_id IN (SELECT id FROM public.work_orders WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (work_order_id IN (SELECT id FROM public.work_orders WHERE company_id IN (SELECT public.auth_user_company_ids())));

-- ============================================================================
-- 27. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_work_centers_updated_at ON public.work_centers;
CREATE TRIGGER trg_work_centers_updated_at BEFORE UPDATE ON public.work_centers
FOR EACH ROW EXECUTE FUNCTION public.set_manufacturing_updated_at();

DROP TRIGGER IF EXISTS trg_boms_updated_at ON public.boms;
CREATE TRIGGER trg_boms_updated_at BEFORE UPDATE ON public.boms
FOR EACH ROW EXECUTE FUNCTION public.set_manufacturing_updated_at();

DROP TRIGGER IF EXISTS trg_bom_components_updated_at ON public.bom_components;
CREATE TRIGGER trg_bom_components_updated_at BEFORE UPDATE ON public.bom_components
FOR EACH ROW EXECUTE FUNCTION public.set_manufacturing_updated_at();

DROP TRIGGER IF EXISTS trg_production_routings_updated_at ON public.production_routings;
CREATE TRIGGER trg_production_routings_updated_at BEFORE UPDATE ON public.production_routings
FOR EACH ROW EXECUTE FUNCTION public.set_manufacturing_updated_at();

DROP TRIGGER IF EXISTS trg_work_orders_updated_at ON public.work_orders;
CREATE TRIGGER trg_work_orders_updated_at BEFORE UPDATE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.set_manufacturing_updated_at();

DROP TRIGGER IF EXISTS trg_work_order_materials_updated_at ON public.work_order_materials;
CREATE TRIGGER trg_work_order_materials_updated_at BEFORE UPDATE ON public.work_order_materials
FOR EACH ROW EXECUTE FUNCTION public.set_manufacturing_updated_at();

DROP TRIGGER IF EXISTS trg_work_order_operations_updated_at ON public.work_order_operations;
CREATE TRIGGER trg_work_order_operations_updated_at BEFORE UPDATE ON public.work_order_operations
FOR EACH ROW EXECUTE FUNCTION public.set_manufacturing_updated_at();

DROP TRIGGER IF EXISTS trg_validate_bom_company ON public.boms;
CREATE TRIGGER trg_validate_bom_company BEFORE INSERT OR UPDATE ON public.boms
FOR EACH ROW EXECUTE FUNCTION public.validate_bom_company_consistency();

DROP TRIGGER IF EXISTS trg_validate_bom_component_company ON public.bom_components;
CREATE TRIGGER trg_validate_bom_component_company BEFORE INSERT OR UPDATE ON public.bom_components
FOR EACH ROW EXECUTE FUNCTION public.validate_bom_component_company();

DROP TRIGGER IF EXISTS trg_validate_work_order_company ON public.work_orders;
CREATE TRIGGER trg_validate_work_order_company BEFORE INSERT OR UPDATE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.validate_work_order_company_consistency();

DROP TRIGGER IF EXISTS trg_populate_work_order_materials ON public.work_orders;
CREATE TRIGGER trg_populate_work_order_materials AFTER INSERT ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.populate_work_order_materials();

DROP TRIGGER IF EXISTS trg_populate_work_order_operations ON public.work_orders;
CREATE TRIGGER trg_populate_work_order_operations AFTER INSERT ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.populate_work_order_operations();

DROP TRIGGER IF EXISTS trg_validate_work_order_status ON public.work_orders;
CREATE TRIGGER trg_validate_work_order_status BEFORE UPDATE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.validate_work_order_status_transition();

DROP TRIGGER IF EXISTS trg_prevent_locked_work_order ON public.work_orders;
CREATE TRIGGER trg_prevent_locked_work_order BEFORE UPDATE OR DELETE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_work_order_modification();

DROP TRIGGER IF EXISTS trg_prevent_locked_work_order_material ON public.work_order_materials;
CREATE TRIGGER trg_prevent_locked_work_order_material BEFORE INSERT OR UPDATE OR DELETE ON public.work_order_materials
FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_work_order_material_modification();

DROP TRIGGER IF EXISTS trg_validate_work_order_material ON public.work_order_materials;
CREATE TRIGGER trg_validate_work_order_material BEFORE INSERT OR UPDATE ON public.work_order_materials
FOR EACH ROW EXECUTE FUNCTION public.validate_work_order_material_quantities();

DROP TRIGGER IF EXISTS trg_sync_work_order_material_cost ON public.work_order_materials;
CREATE TRIGGER trg_sync_work_order_material_cost AFTER INSERT OR UPDATE OR DELETE ON public.work_order_materials
FOR EACH ROW EXECUTE FUNCTION public.sync_work_order_material_cost();

DROP TRIGGER IF EXISTS trg_sync_work_order_operation_cost ON public.work_order_operations;
CREATE TRIGGER trg_sync_work_order_operation_cost AFTER INSERT OR UPDATE OR DELETE ON public.work_order_operations
FOR EACH ROW EXECUTE FUNCTION public.sync_work_order_operation_cost();

DROP TRIGGER IF EXISTS trg_validate_production_output ON public.production_outputs;
CREATE TRIGGER trg_validate_production_output BEFORE INSERT ON public.production_outputs
FOR EACH ROW EXECUTE FUNCTION public.validate_production_output_consistency();

DROP TRIGGER IF EXISTS trg_post_production_output_inventory ON public.production_outputs;
CREATE TRIGGER trg_post_production_output_inventory BEFORE INSERT ON public.production_outputs
FOR EACH ROW EXECUTE FUNCTION public.post_production_output_inventory();

DROP TRIGGER IF EXISTS trg_sync_work_order_completed_quantity ON public.production_outputs;
CREATE TRIGGER trg_sync_work_order_completed_quantity AFTER INSERT OR UPDATE OR DELETE ON public.production_outputs
FOR EACH ROW EXECUTE FUNCTION public.sync_work_order_completed_quantity();

DROP TRIGGER IF EXISTS trg_sync_production_cost_to_project ON public.production_outputs;
CREATE TRIGGER trg_sync_production_cost_to_project AFTER INSERT ON public.production_outputs
FOR EACH ROW EXECUTE FUNCTION public.sync_production_cost_to_project();

-- ============================================================================
-- 28. FUNCTION SECURITY
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.set_manufacturing_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_bom_company_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_bom_component_company() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_work_order_company_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.populate_work_order_materials() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.populate_work_order_operations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_work_order_status_transition() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_work_order_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_work_order_material_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_work_order_material_quantities() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_work_order_material_cost() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_work_order_operation_cost() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_production_output_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.post_production_output_inventory() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_work_order_completed_quantity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_production_cost_to_project() FROM PUBLIC, anon, authenticated;

COMMIT;
