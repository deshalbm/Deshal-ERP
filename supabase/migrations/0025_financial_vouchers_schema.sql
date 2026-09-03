-- ============================================================================
-- Deshal ERP
-- Migration 0025: Financial Vouchers Schema
-- ----------------------------------------------------------------------------
-- Purpose: Dedicated schema and table for Receipt & Payment Vouchers
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    branch_name TEXT NOT NULL DEFAULT '',
    voucher_number TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'RECEIPT',
    reference_no TEXT DEFAULT '',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    received_from TEXT DEFAULT '',
    paid_to TEXT DEFAULT '',
    payer_email TEXT DEFAULT '',
    payer_phone TEXT DEFAULT '',
    payer_address TEXT DEFAULT '',
    payer_tax_id TEXT DEFAULT '',
    amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'OMR',
    amount_in_words TEXT DEFAULT '',
    is_custom_words BOOLEAN DEFAULT false,
    payment_method TEXT NOT NULL DEFAULT 'CASH',
    check_number TEXT DEFAULT '',
    bank_name TEXT DEFAULT '',
    transaction_ref TEXT DEFAULT '',
    category TEXT DEFAULT '',
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15,3) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    discount_rate NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(15,3) DEFAULT 0,
    total_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    terms TEXT DEFAULT '',
    custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'ISSUED',
    prepared_by TEXT DEFAULT '',
    approved_by TEXT DEFAULT '',
    received_by TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_vouchers_company_number UNIQUE (company_id, voucher_number)
);

CREATE INDEX IF NOT EXISTS idx_vouchers_company_id ON public.vouchers(company_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON public.vouchers(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON public.vouchers(company_id, type);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON public.vouchers(company_id, status);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vouchers_policy ON public.vouchers;
CREATE POLICY vouchers_policy ON public.vouchers
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

COMMIT;
