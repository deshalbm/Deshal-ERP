-- Deshal ERP — Migration 0003: Accounting Kernel & Financial Operations
-- Purpose: Double-Entry Ledger, Chart of Accounts, Fiscal Periods, Bank Recon, Invoices & Payments

BEGIN;

-- 1. Chart of Accounts Table
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    type TEXT NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    category TEXT NOT NULL,
    parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    is_posting BOOLEAN NOT NULL DEFAULT true,
    currency TEXT NOT NULL DEFAULT 'OMR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_chart_of_accounts_code UNIQUE (company_id, code)
);

-- 2. Cost Centers Table
CREATE TABLE IF NOT EXISTS public.cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_cost_centers_code UNIQUE (company_id, code)
);

-- 3. Fiscal Periods Table
CREATE TABLE IF NOT EXISTS public.fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    fiscal_year INT NOT NULL,
    period_number INT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED, LOCKED
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_fiscal_periods_number UNIQUE (company_id, fiscal_year, period_number)
);

-- 4. Journal Entries Header Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    fiscal_period_id UUID REFERENCES public.fiscal_periods(id) ON DELETE RESTRICT,
    entry_number TEXT NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL DEFAULT 'GENERAL', -- GENERAL, ADJUSTING, REVERSAL, OPENING, AUTOMATED
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, REVIEWED, POSTED, REVERSED, LOCKED, CANCELLED
    total_debit NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_credit NUMERIC(15,3) NOT NULL DEFAULT 0,
    is_balanced BOOLEAN NOT NULL DEFAULT true,
    description_ar TEXT NOT NULL,
    description_en TEXT,
    reference_number TEXT,
    posted_at TIMESTAMPTZ,
    posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reversed_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_journal_entries_number UNIQUE (company_id, entry_number),
    CONSTRAINT chk_journal_entry_balance CHECK (total_debit = total_credit)
);

-- 5. Journal Entry Lines Table
CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE RESTRICT,
    description_ar TEXT,
    description_en TEXT,
    debit NUMERIC(15,3) NOT NULL DEFAULT 0,
    credit NUMERIC(15,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Bank Accounts Table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    iban TEXT,
    currency TEXT NOT NULL DEFAULT 'OMR',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Invoices & Receipts Operations Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INVOICE', -- INVOICE, RECEIPT, QUOTATION
    date DATE NOT NULL,
    due_date DATE,
    subtotal NUMERIC(15,3) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,3) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'OMR',
    status TEXT NOT NULL DEFAULT 'UNPAID', -- PAID, PARTIAL, UNPAID, CANCELLED
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_invoices_number UNIQUE (company_id, invoice_number)
);

-- Indexes for optimal accounting query performance
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_company_id ON public.chart_of_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_id ON public.journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry_id ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_id ON public.journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);

COMMIT;
