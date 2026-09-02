-- ============================================================================
-- Deshal ERP
-- Migration 0019: Fixed Assets & Asset Depreciation
----------------------------------------------------
-- Purpose:
--   Fixed asset register, asset categories, depreciation schedules,
--   accounting integration, transfers, disposals and financial integrity.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ASSET CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    asset_account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    accumulated_depreciation_account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    depreciation_expense_account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    gain_on_disposal_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    loss_on_disposal_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    default_useful_life_months INTEGER,
    default_depreciation_method TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
    default_salvage_percentage NUMERIC(7,4) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_asset_categories_company_code UNIQUE (company_id, code),
    CONSTRAINT chk_asset_category_useful_life CHECK (
        default_useful_life_months IS NULL OR default_useful_life_months > 0
    ),
    CONSTRAINT chk_asset_category_depreciation_method CHECK (
        default_depreciation_method IN ('STRAIGHT_LINE', 'DECLINING_BALANCE')
    ),
    CONSTRAINT chk_asset_category_salvage_percentage CHECK (
        default_salvage_percentage >= 0 AND default_salvage_percentage <= 100
    )
);

-- ============================================================================
-- 2. FIXED ASSETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fixed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.asset_categories(id) ON DELETE RESTRICT,
    cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
    asset_code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    serial_number TEXT,
    barcode TEXT,
    acquisition_date DATE NOT NULL,
    capitalization_date DATE NOT NULL,
    depreciation_start_date DATE,
    original_cost NUMERIC(15,3) NOT NULL,
    salvage_value NUMERIC(15,3) NOT NULL DEFAULT 0,
    accumulated_depreciation NUMERIC(15,3) NOT NULL DEFAULT 0,
    net_book_value NUMERIC(15,3) GENERATED ALWAYS AS (
        original_cost - accumulated_depreciation
    ) STORED,
    useful_life_months INTEGER NOT NULL,
    depreciation_method TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
    declining_balance_rate NUMERIC(9,6),
    currency TEXT NOT NULL DEFAULT 'OMR',
    status TEXT NOT NULL DEFAULT 'DRAFT',
    asset_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    accumulated_depreciation_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    depreciation_expense_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    gain_on_disposal_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    loss_on_disposal_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    acquisition_journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    disposal_journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    disposed_at TIMESTAMPTZ,
    disposed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    disposal_notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_fixed_assets_company_code UNIQUE (company_id, asset_code),
    CONSTRAINT chk_fixed_assets_cost CHECK (original_cost > 0),
    CONSTRAINT chk_fixed_assets_salvage CHECK (
        salvage_value >= 0 AND salvage_value <= original_cost
    ),
    CONSTRAINT chk_fixed_assets_accumulated_depreciation CHECK (
        accumulated_depreciation >= 0 AND accumulated_depreciation <= original_cost
    ),
    CONSTRAINT chk_fixed_assets_useful_life CHECK (useful_life_months > 0),
    CONSTRAINT chk_fixed_assets_depreciation_method CHECK (
        depreciation_method IN ('STRAIGHT_LINE', 'DECLINING_BALANCE')
    ),
    CONSTRAINT chk_fixed_assets_status CHECK (
        status IN ('DRAFT', 'ACTIVE', 'FULLY_DEPRECIATED', 'DISPOSED', 'SUSPENDED')
    )
);

-- ============================================================================
-- 3. ASSET DEPRECIATION SCHEDULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.asset_depreciation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    fiscal_period_id UUID REFERENCES public.fiscal_periods(id) ON DELETE SET NULL,
    opening_book_value NUMERIC(15,3) NOT NULL,
    depreciation_amount NUMERIC(15,3) NOT NULL,
    closing_book_value NUMERIC(15,3) NOT NULL,
    accumulated_depreciation_before NUMERIC(15,3) NOT NULL,
    accumulated_depreciation_after NUMERIC(15,3) NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED',
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    posted_at TIMESTAMPTZ,
    posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_asset_depreciation_schedule_date UNIQUE (asset_id, schedule_date),
    CONSTRAINT chk_asset_depreciation_amount CHECK (depreciation_amount >= 0),
    CONSTRAINT chk_asset_depreciation_values CHECK (opening_book_value >= closing_book_value),
    CONSTRAINT chk_asset_depreciation_status CHECK (
        status IN ('SCHEDULED', 'POSTED', 'SKIPPED', 'CANCELLED')
    )
);

-- ============================================================================
-- 4. ASSET TRANSFERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.asset_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE RESTRICT,
    transfer_number TEXT NOT NULL,
    from_branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    to_branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    from_cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
    to_cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
    transfer_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_asset_transfers_company_number UNIQUE (company_id, transfer_number),
    CONSTRAINT chk_asset_transfer_status CHECK (
        status IN ('DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED')
    ),
    CONSTRAINT chk_asset_transfer_branch_change CHECK (
        from_branch_id IS DISTINCT FROM to_branch_id
        OR from_cost_center_id IS DISTINCT FROM to_cost_center_id
    )
);

-- ============================================================================
-- 5. ASSET DISPOSALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.asset_disposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE RESTRICT,
    disposal_number TEXT NOT NULL,
    disposal_date DATE NOT NULL,
    disposal_type TEXT NOT NULL DEFAULT 'SALE',
    proceeds_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    disposal_expenses NUMERIC(15,3) NOT NULL DEFAULT 0,
    book_value_at_disposal NUMERIC(15,3) NOT NULL DEFAULT 0,
    gain_loss_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    posted_at TIMESTAMPTZ,
    posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_asset_disposals_company_number UNIQUE (company_id, disposal_number),
    CONSTRAINT ux_asset_disposals_asset UNIQUE (asset_id),
    CONSTRAINT chk_asset_disposal_type CHECK (
        disposal_type IN ('SALE', 'SCRAP', 'WRITE_OFF', 'DONATION')
    ),
    CONSTRAINT chk_asset_disposal_status CHECK (
        status IN ('DRAFT', 'POSTED', 'CANCELLED')
    ),
    CONSTRAINT chk_asset_disposal_amounts CHECK (
        proceeds_amount >= 0 AND disposal_expenses >= 0 AND book_value_at_disposal >= 0
    )
);

-- ============================================================================
-- 6. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_asset_categories_company ON public.asset_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_company ON public.fixed_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON public.fixed_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_branch ON public.fixed_assets(branch_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON public.fixed_assets(status);
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_asset ON public.asset_depreciation_schedules(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_company ON public.asset_depreciation_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_status_date ON public.asset_depreciation_schedules(status, schedule_date);
CREATE INDEX IF NOT EXISTS idx_asset_transfers_company ON public.asset_transfers(company_id);
CREATE INDEX IF NOT EXISTS idx_asset_transfers_asset ON public.asset_transfers(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_company ON public.asset_disposals(company_id);
CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset ON public.asset_disposals(asset_id);

-- ============================================================================
-- 7. UPDATED_AT FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_fixed_asset_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_asset_category_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_asset_depreciation_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. ASSET COMPANY CONSISTENCY VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_fixed_asset_company_consistency()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_category_company UUID;
BEGIN
    SELECT company_id INTO v_category_company
    FROM public.asset_categories WHERE id = NEW.category_id;

    IF v_category_company IS NULL OR v_category_company <> NEW.company_id THEN
        RAISE EXCEPTION 'Asset category must belong to the same company as the fixed asset';
    END IF;

    IF NEW.branch_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.branches
            WHERE id = NEW.branch_id AND company_id = NEW.company_id
        ) THEN
            RAISE EXCEPTION 'Branch must belong to the same company as the fixed asset';
        END IF;
    END IF;

    IF NEW.cost_center_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.cost_centers
            WHERE id = NEW.cost_center_id AND company_id = NEW.company_id
        ) THEN
            RAISE EXCEPTION 'Cost center must belong to the same company as the fixed asset';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. AUTO POPULATE ASSET ACCOUNTS FROM CATEGORY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.populate_fixed_asset_accounts()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_category public.asset_categories%ROWTYPE;
BEGIN
    SELECT * INTO v_category
    FROM public.asset_categories WHERE id = NEW.category_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid asset category';
    END IF;

    IF NEW.asset_account_id IS NULL THEN
        NEW.asset_account_id := v_category.asset_account_id;
    END IF;

    IF NEW.accumulated_depreciation_account_id IS NULL THEN
        NEW.accumulated_depreciation_account_id := v_category.accumulated_depreciation_account_id;
    END IF;

    IF NEW.depreciation_expense_account_id IS NULL THEN
        NEW.depreciation_expense_account_id := v_category.depreciation_expense_account_id;
    END IF;

    IF NEW.gain_on_disposal_account_id IS NULL THEN
        NEW.gain_on_disposal_account_id := v_category.gain_on_disposal_account_id;
    END IF;

    IF NEW.loss_on_disposal_account_id IS NULL THEN
        NEW.loss_on_disposal_account_id := v_category.loss_on_disposal_account_id;
    END IF;

    IF NEW.useful_life_months IS NULL THEN
        NEW.useful_life_months := v_category.default_useful_life_months;
    END IF;

    IF NEW.depreciation_method IS NULL THEN
        NEW.depreciation_method := v_category.default_depreciation_method;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. PREVENT MODIFICATION OF DISPOSED ASSETS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_disposed_asset_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status = 'DISPOSED' THEN
        RAISE EXCEPTION 'Cannot modify or delete a disposed fixed asset';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. PREVENT MODIFICATION OF POSTED DEPRECIATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_posted_depreciation_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status = 'POSTED' THEN
        RAISE EXCEPTION 'Cannot modify or delete a posted depreciation schedule';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. VALIDATE DEPRECIATION SCHEDULE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_asset_depreciation_schedule()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_asset_company UUID;
    v_asset_status TEXT;
    v_salvage_value NUMERIC(15,3);
BEGIN
    SELECT company_id, status, salvage_value
    INTO v_asset_company, v_asset_status, v_salvage_value
    FROM public.fixed_assets WHERE id = NEW.asset_id;

    IF v_asset_company IS NULL OR v_asset_company <> NEW.company_id THEN
        RAISE EXCEPTION 'Depreciation schedule company must match asset company';
    END IF;

    IF v_asset_status = 'DISPOSED' THEN
        RAISE EXCEPTION 'Cannot create depreciation schedules for disposed assets';
    END IF;

    IF NEW.closing_book_value < v_salvage_value THEN
        RAISE EXCEPTION 'Depreciation schedule cannot reduce book value below salvage value';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. GENERATE DEPRECIATION SCHEDULE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_asset_depreciation_schedule(
    p_asset_id UUID
)
RETURNS INTEGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_asset public.fixed_assets%ROWTYPE;
    v_depreciable_amount NUMERIC(15,3);
    v_monthly_amount NUMERIC(15,3);
    v_opening_value NUMERIC(15,3);
    v_closing_value NUMERIC(15,3);
    v_accumulated_before NUMERIC(15,3);
    v_accumulated_after NUMERIC(15,3);
    v_schedule_date DATE;
    v_depreciation_amount NUMERIC(15,3);
    v_counter INTEGER := 0;
    v_month INTEGER;
BEGIN
    SELECT * INTO v_asset
    FROM public.fixed_assets WHERE id = p_asset_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fixed asset not found';
    END IF;

    IF v_asset.status NOT IN ('ACTIVE', 'DRAFT') THEN
        RAISE EXCEPTION 'Depreciation schedule can only be generated for ACTIVE or DRAFT assets';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.asset_depreciation_schedules
        WHERE asset_id = p_asset_id
    ) THEN
        RAISE EXCEPTION 'Depreciation schedule already exists for this asset';
    END IF;

    IF v_asset.depreciation_start_date IS NULL THEN
        RAISE EXCEPTION 'Depreciation start date is required';
    END IF;

    v_depreciable_amount := v_asset.original_cost - v_asset.salvage_value;

    IF v_depreciable_amount <= 0 THEN
        RAISE EXCEPTION 'Depreciable amount must be greater than zero';
    END IF;

    v_opening_value := v_asset.original_cost;
    v_accumulated_before := 0;

    IF v_asset.depreciation_method = 'STRAIGHT_LINE' THEN
        v_monthly_amount := ROUND(v_depreciable_amount / v_asset.useful_life_months, 3);
    END IF;

    FOR v_month IN 1..v_asset.useful_life_months LOOP
        v_schedule_date := (
            date_trunc('month', v_asset.depreciation_start_date)
            + make_interval(months => v_month)
            - interval '1 day'
        )::date;

        IF v_asset.depreciation_method = 'STRAIGHT_LINE' THEN
            IF v_month = v_asset.useful_life_months THEN
                v_depreciation_amount := v_opening_value - v_asset.salvage_value;
            ELSE
                v_depreciation_amount := LEAST(v_monthly_amount, v_opening_value - v_asset.salvage_value);
            END IF;
        ELSE
            IF v_asset.declining_balance_rate IS NULL OR v_asset.declining_balance_rate <= 0 THEN
                RAISE EXCEPTION 'Declining balance rate must be specified and greater than zero';
            END IF;

            v_depreciation_amount := ROUND(v_opening_value * v_asset.declining_balance_rate / 12, 3);
            v_depreciation_amount := LEAST(v_depreciation_amount, v_opening_value - v_asset.salvage_value);
        END IF;

        v_closing_value := v_opening_value - v_depreciation_amount;
        v_accumulated_after := v_accumulated_before + v_depreciation_amount;

        INSERT INTO public.asset_depreciation_schedules (
            company_id, asset_id, schedule_date, opening_book_value,
            depreciation_amount, closing_book_value, accumulated_depreciation_before,
            accumulated_depreciation_after, status
        )
        VALUES (
            v_asset.company_id, v_asset.id, v_schedule_date, v_opening_value,
            v_depreciation_amount, v_closing_value, v_accumulated_before,
            v_accumulated_after, 'SCHEDULED'
        );

        v_opening_value := v_closing_value;
        v_accumulated_before := v_accumulated_after;
        v_counter := v_counter + 1;

        IF v_closing_value <= v_asset.salvage_value THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN v_counter;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 14. POST DEPRECIATION TO ACCOUNTING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.post_asset_depreciation(
    p_schedule_id UUID
)
RETURNS UUID
SET search_path = public, pg_temp
AS $$
DECLARE
    v_schedule public.asset_depreciation_schedules%ROWTYPE;
    v_asset public.fixed_assets%ROWTYPE;
    v_journal_entry_id UUID;
    v_entry_number TEXT;
BEGIN
    SELECT * INTO v_schedule
    FROM public.asset_depreciation_schedules WHERE id = p_schedule_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Depreciation schedule not found';
    END IF;

    IF v_schedule.status <> 'SCHEDULED' THEN
        RAISE EXCEPTION 'Only scheduled depreciation can be posted';
    END IF;

    SELECT * INTO v_asset
    FROM public.fixed_assets WHERE id = v_schedule.asset_id
    FOR UPDATE;

    IF v_asset.status = 'DISPOSED' THEN
        RAISE EXCEPTION 'Cannot post depreciation for disposed asset';
    END IF;

    IF v_schedule.depreciation_amount <= 0 THEN
        RAISE EXCEPTION 'Depreciation amount must be greater than zero';
    END IF;

    v_entry_number := 'DEP-'
        || TO_CHAR(v_schedule.schedule_date, 'YYYYMMDD')
        || '-' || LEFT(REPLACE(v_schedule.id::TEXT, '-', ''), 8);

    INSERT INTO public.journal_entries (
        company_id, branch_id, entry_number, date, type, status,
        total_debit, total_credit, is_balanced, description_ar, description_en,
        reference_number, posted_at, posted_by, created_by
    )
    VALUES (
        v_asset.company_id, v_asset.branch_id, v_entry_number, v_schedule.schedule_date,
        'AUTOMATED', 'DRAFT', 0, 0, true,
        'قيد إهلاك أصل ثابت', 'Fixed asset depreciation', v_asset.asset_code,
        NULL, NULL, NULL
    )
    RETURNING id INTO v_journal_entry_id;

    INSERT INTO public.journal_entry_lines (
        journal_entry_id, account_id, cost_center_id, description_ar, description_en, debit, credit
    )
    VALUES
    (
        v_journal_entry_id, v_asset.depreciation_expense_account_id, v_asset.cost_center_id,
        'مصروف إهلاك أصل ثابت', 'Fixed asset depreciation expense', v_schedule.depreciation_amount, 0
    ),
    (
        v_journal_entry_id, v_asset.accumulated_depreciation_account_id, v_asset.cost_center_id,
        'مجمع إهلاك أصل ثابت', 'Accumulated depreciation', 0, v_schedule.depreciation_amount
    );

    UPDATE public.journal_entries
    SET total_debit = v_schedule.depreciation_amount,
        total_credit = v_schedule.depreciation_amount,
        is_balanced = true,
        status = 'POSTED',
        posted_at = now(),
        posted_by = auth.uid()
    WHERE id = v_journal_entry_id;

    UPDATE public.asset_depreciation_schedules
    SET status = 'POSTED',
        journal_entry_id = v_journal_entry_id,
        posted_at = now(),
        posted_by = auth.uid()
    WHERE id = v_schedule.id;

    UPDATE public.fixed_assets
    SET accumulated_depreciation = v_schedule.accumulated_depreciation_after,
        status = CASE
            WHEN v_schedule.closing_book_value <= salvage_value THEN 'FULLY_DEPRECIATED'
            ELSE status
        END,
        updated_at = now()
    WHERE id = v_asset.id;

    RETURN v_journal_entry_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. ASSET TRANSFER COMPANY VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_asset_transfer()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_asset_company UUID;
BEGIN
    SELECT company_id INTO v_asset_company
    FROM public.fixed_assets WHERE id = NEW.asset_id;

    IF v_asset_company IS NULL OR v_asset_company <> NEW.company_id THEN
        RAISE EXCEPTION 'Asset transfer company must match asset company';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 16. APPLY COMPLETED ASSET TRANSFER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_asset_transfer()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status <> 'COMPLETED' AND NEW.status = 'COMPLETED' THEN
        UPDATE public.fixed_assets
        SET branch_id = NEW.to_branch_id,
            cost_center_id = NEW.to_cost_center_id,
            updated_at = now()
        WHERE id = NEW.asset_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 17. VALIDATE ASSET DISPOSAL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_asset_disposal()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_asset_company UUID;
    v_asset_status TEXT;
BEGIN
    SELECT company_id, status
    INTO v_asset_company, v_asset_status
    FROM public.fixed_assets WHERE id = NEW.asset_id;

    IF v_asset_company IS NULL OR v_asset_company <> NEW.company_id THEN
        RAISE EXCEPTION 'Asset disposal company must match asset company';
    END IF;

    IF v_asset_status = 'DISPOSED' AND OLD.status <> 'POSTED' THEN
        RAISE EXCEPTION 'Asset has already been disposed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 18. CALCULATE DISPOSAL VALUES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_asset_disposal_values()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_book_value NUMERIC(15,3);
BEGIN
    SELECT net_book_value INTO v_book_value
    FROM public.fixed_assets WHERE id = NEW.asset_id;

    IF v_book_value IS NULL THEN
        RAISE EXCEPTION 'Fixed asset not found';
    END IF;

    NEW.book_value_at_disposal := v_book_value;
    NEW.gain_loss_amount := NEW.proceeds_amount - NEW.disposal_expenses - NEW.book_value_at_disposal;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 19. POST ASSET DISPOSAL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.post_asset_disposal()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_asset public.fixed_assets%ROWTYPE;
    v_journal_entry_id UUID;
    v_entry_number TEXT;
    v_gain_loss NUMERIC(15,3);
    v_bank_account_id UUID;
BEGIN
    IF OLD.status = 'DRAFT' AND NEW.status = 'POSTED' AND NEW.journal_entry_id IS NULL THEN
        SELECT * INTO v_asset
        FROM public.fixed_assets WHERE id = NEW.asset_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Fixed asset not found';
        END IF;

        v_gain_loss := NEW.gain_loss_amount;
        v_entry_number := 'DISP-'
            || TO_CHAR(NEW.disposal_date, 'YYYYMMDD')
            || '-' || LEFT(REPLACE(NEW.id::TEXT, '-', ''), 8);

        INSERT INTO public.journal_entries (
            company_id, branch_id, entry_number, date, type, status,
            total_debit, total_credit, is_balanced, description_ar, description_en,
            reference_number
        )
        VALUES (
            NEW.company_id, v_asset.branch_id, v_entry_number, NEW.disposal_date,
            'AUTOMATED', 'DRAFT', 0, 0, true,
            'قيد التخلص من أصل ثابت', 'Fixed asset disposal', NEW.disposal_number
        )
        RETURNING id INTO v_journal_entry_id;

        IF NEW.proceeds_amount > 0 THEN
            SELECT account_id INTO v_bank_account_id
            FROM public.bank_accounts
            WHERE company_id = NEW.company_id AND is_active = true
            ORDER BY created_at LIMIT 1;

            IF v_bank_account_id IS NULL THEN
                RAISE EXCEPTION 'Asset disposal failed: active bank account required for company % proceeds', NEW.company_id;
            END IF;

            INSERT INTO public.journal_entry_lines (
                journal_entry_id, account_id, cost_center_id, description_ar, description_en, debit, credit
            )
            VALUES (
                v_journal_entry_id, v_bank_account_id, v_asset.cost_center_id,
                'حصيلة بيع أصل ثابت', 'Fixed asset disposal proceeds', NEW.proceeds_amount, 0
            );
        END IF;

        IF v_asset.accumulated_depreciation > 0 THEN
            INSERT INTO public.journal_entry_lines (
                journal_entry_id, account_id, cost_center_id, description_ar, description_en, debit, credit
            )
            VALUES (
                v_journal_entry_id, v_asset.accumulated_depreciation_account_id, v_asset.cost_center_id,
                'إلغاء مجمع الإهلاك', 'Remove accumulated depreciation', v_asset.accumulated_depreciation, 0
            );
        END IF;

        INSERT INTO public.journal_entry_lines (
            journal_entry_id, account_id, cost_center_id, description_ar, description_en, debit, credit
        )
        VALUES (
            v_journal_entry_id, v_asset.asset_account_id, v_asset.cost_center_id,
            'إلغاء تكلفة الأصل', 'Remove asset cost', 0, v_asset.original_cost
        );

        IF v_gain_loss > 0 THEN
            INSERT INTO public.journal_entry_lines (
                journal_entry_id, account_id, cost_center_id, description_ar, description_en, debit, credit
            )
            VALUES (
                v_journal_entry_id, v_asset.gain_on_disposal_account_id, v_asset.cost_center_id,
                'ربح التخلص من أصل', 'Gain on asset disposal', 0, v_gain_loss
            );
        ELSIF v_gain_loss < 0 THEN
            INSERT INTO public.journal_entry_lines (
                journal_entry_id, account_id, cost_center_id, description_ar, description_en, debit, credit
            )
            VALUES (
                v_journal_entry_id, v_asset.loss_on_disposal_account_id, v_asset.cost_center_id,
                'خسارة التخلص من أصل', 'Loss on asset disposal', ABS(v_gain_loss), 0
            );
        END IF;

        UPDATE public.journal_entries
        SET
            total_debit = (SELECT total_debit FROM public.get_journal_entry_totals(v_journal_entry_id)),
            total_credit = (SELECT total_credit FROM public.get_journal_entry_totals(v_journal_entry_id)),
            is_balanced = true,
            status = 'POSTED',
            posted_at = now(),
            posted_by = auth.uid()
        WHERE id = v_journal_entry_id;

        UPDATE public.fixed_assets
        SET status = 'DISPOSED',
            disposed_at = now(),
            disposed_by = auth.uid(),
            disposal_journal_entry_id = v_journal_entry_id,
            disposal_notes = NEW.notes,
            updated_at = now()
        WHERE id = NEW.asset_id;

        UPDATE public.asset_disposals
        SET journal_entry_id = v_journal_entry_id,
            posted_at = now(),
            posted_by = auth.uid()
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 20. PREVENT MODIFICATION OF POSTED DISPOSALS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_posted_asset_disposal_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status = 'POSTED' AND OLD.journal_entry_id IS NOT NULL AND TG_OP <> 'DELETE' THEN
        IF NEW.journal_entry_id IS NOT DISTINCT FROM OLD.journal_entry_id THEN
            RAISE EXCEPTION 'Cannot modify or delete a posted asset disposal';
        END IF;
    ELSIF OLD.status = 'POSTED' AND TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Cannot modify or delete a posted asset disposal';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 21. UPDATED AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_asset_categories_updated_at ON public.asset_categories;
CREATE TRIGGER trg_asset_categories_updated_at
    BEFORE UPDATE ON public.asset_categories
    FOR EACH ROW EXECUTE FUNCTION public.set_asset_category_updated_at();

DROP TRIGGER IF EXISTS trg_fixed_assets_updated_at ON public.fixed_assets;
CREATE TRIGGER trg_fixed_assets_updated_at
    BEFORE UPDATE ON public.fixed_assets
    FOR EACH ROW EXECUTE FUNCTION public.set_fixed_asset_updated_at();

DROP TRIGGER IF EXISTS trg_asset_depreciation_updated_at ON public.asset_depreciation_schedules;
CREATE TRIGGER trg_asset_depreciation_updated_at
    BEFORE UPDATE ON public.asset_depreciation_schedules
    FOR EACH ROW EXECUTE FUNCTION public.set_asset_depreciation_updated_at();

-- ============================================================================
-- 22. FIXED ASSET TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_populate_fixed_asset_accounts ON public.fixed_assets;
CREATE TRIGGER trg_populate_fixed_asset_accounts
    BEFORE INSERT OR UPDATE OF category_id ON public.fixed_assets
    FOR EACH ROW EXECUTE FUNCTION public.populate_fixed_asset_accounts();

DROP TRIGGER IF EXISTS trg_validate_fixed_asset_company ON public.fixed_assets;
CREATE TRIGGER trg_validate_fixed_asset_company
    BEFORE INSERT OR UPDATE ON public.fixed_assets
    FOR EACH ROW EXECUTE FUNCTION public.validate_fixed_asset_company_consistency();

DROP TRIGGER IF EXISTS trg_prevent_disposed_asset_modification ON public.fixed_assets;
CREATE TRIGGER trg_prevent_disposed_asset_modification
    BEFORE UPDATE OR DELETE ON public.fixed_assets
    FOR EACH ROW EXECUTE FUNCTION public.prevent_disposed_asset_modification();

-- ============================================================================
-- 23. DEPRECIATION TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validate_asset_depreciation_schedule ON public.asset_depreciation_schedules;
CREATE TRIGGER trg_validate_asset_depreciation_schedule
    BEFORE INSERT OR UPDATE ON public.asset_depreciation_schedules
    FOR EACH ROW EXECUTE FUNCTION public.validate_asset_depreciation_schedule();

DROP TRIGGER IF EXISTS trg_prevent_posted_depreciation_modification ON public.asset_depreciation_schedules;
CREATE TRIGGER trg_prevent_posted_depreciation_modification
    BEFORE UPDATE OR DELETE ON public.asset_depreciation_schedules
    FOR EACH ROW EXECUTE FUNCTION public.prevent_posted_depreciation_modification();

-- ============================================================================
-- 24. ASSET TRANSFER TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validate_asset_transfer ON public.asset_transfers;
CREATE TRIGGER trg_validate_asset_transfer
    BEFORE INSERT OR UPDATE ON public.asset_transfers
    FOR EACH ROW EXECUTE FUNCTION public.validate_asset_transfer();

DROP TRIGGER IF EXISTS trg_apply_asset_transfer ON public.asset_transfers;
CREATE TRIGGER trg_apply_asset_transfer
    AFTER UPDATE OF status ON public.asset_transfers
    FOR EACH ROW EXECUTE FUNCTION public.apply_asset_transfer();

-- ============================================================================
-- 25. ASSET DISPOSAL TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_validate_asset_disposal ON public.asset_disposals;
CREATE TRIGGER trg_validate_asset_disposal
    BEFORE INSERT OR UPDATE ON public.asset_disposals
    FOR EACH ROW EXECUTE FUNCTION public.validate_asset_disposal();

DROP TRIGGER IF EXISTS trg_calculate_asset_disposal_values ON public.asset_disposals;
CREATE TRIGGER trg_calculate_asset_disposal_values
    BEFORE INSERT OR UPDATE ON public.asset_disposals
    FOR EACH ROW EXECUTE FUNCTION public.calculate_asset_disposal_values();

DROP TRIGGER IF EXISTS trg_prevent_posted_asset_disposal_modification ON public.asset_disposals;
CREATE TRIGGER trg_prevent_posted_asset_disposal_modification
    BEFORE UPDATE OR DELETE ON public.asset_disposals
    FOR EACH ROW EXECUTE FUNCTION public.prevent_posted_asset_disposal_modification();

DROP TRIGGER IF EXISTS trg_post_asset_disposal ON public.asset_disposals;
CREATE TRIGGER trg_post_asset_disposal
    AFTER UPDATE OF status ON public.asset_disposals
    FOR EACH ROW EXECUTE FUNCTION public.post_asset_disposal();

-- ============================================================================
-- 26. ENABLE RLS
-- ============================================================================

ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_depreciation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_disposals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 27. RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS asset_categories_policy ON public.asset_categories;
CREATE POLICY asset_categories_policy ON public.asset_categories
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS fixed_assets_policy ON public.fixed_assets;
CREATE POLICY fixed_assets_policy ON public.fixed_assets
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS asset_depreciation_schedules_policy ON public.asset_depreciation_schedules;
CREATE POLICY asset_depreciation_schedules_policy ON public.asset_depreciation_schedules
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS asset_transfers_policy ON public.asset_transfers;
CREATE POLICY asset_transfers_policy ON public.asset_transfers
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS asset_disposals_policy ON public.asset_disposals;
CREATE POLICY asset_disposals_policy ON public.asset_disposals
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- ============================================================================
-- 28. FUNCTION SECURITY
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.set_fixed_asset_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_asset_category_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_asset_depreciation_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_fixed_asset_company_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.populate_fixed_asset_accounts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_disposed_asset_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_posted_depreciation_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_asset_depreciation_schedule() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_asset_transfer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_asset_transfer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_asset_disposal() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_asset_disposal_values() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.post_asset_disposal() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_posted_asset_disposal_modification() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.generate_asset_depreciation_schedule(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.post_asset_depreciation(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.generate_asset_depreciation_schedule(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_asset_depreciation(UUID) TO authenticated;

COMMIT;
