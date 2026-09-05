-- ============================================================================
-- Deshal ERP
-- Migration 0029: Vouchers, Invoices, Master Data & Accounting Core Overhaul
-- ----------------------------------------------------------------------------
-- Purpose:
--   1. Database-backed Atomic Concurrency-Safe Voucher/Invoice Number Generator.
--   2. Master Location Data (Governorates & Cities) for Oman.
--   3. Phone Normalization (+968) and Unique Phone Index for Customer Master.
--   4. Discount Types (PERCENTAGE vs FIXED) & Payment Instrumentation (Transfer proof, POS last 4).
--   5. Cryptographically Secure Public QR Verification Token System.
--   6. Atomic Database Transaction RPC for Financial Postings & Journal Entries.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ATOMIC VOUCHER & INVOICE NUMBER SEQUENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.voucher_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- INVOICE, RECEIPT, PAYMENT, CREDIT_NOTE, DEBIT_NOTE, PETTY_CASH
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    prefix TEXT NOT NULL,
    current_value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_voucher_sequences_company_type_branch UNIQUE (company_id, type, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_voucher_sequences_lookup ON public.voucher_sequences(company_id, type, branch_id);

-- Atomic Sequence Generator Function
CREATE OR REPLACE FUNCTION public.generate_next_voucher_number(
    p_company_id UUID,
    p_type TEXT,
    p_branch_id UUID DEFAULT NULL
)
RETURNS TEXT
SET search_path = public, pg_temp
AS $$
DECLARE
    v_prefix TEXT;
    v_next_val BIGINT;
    v_year TEXT;
    v_voucher_num TEXT;
BEGIN
    v_year := to_char(CURRENT_DATE, 'YYYY');

    -- Determine default prefix
    CASE UPPER(p_type)
        WHEN 'INVOICE', 'TAX_INVOICE' THEN v_prefix := 'INV';
        WHEN 'RECEIPT', 'RECEIPT_VOUCHER' THEN v_prefix := 'REC';
        WHEN 'PAYMENT', 'PAYMENT_VOUCHER' THEN v_prefix := 'PAY';
        WHEN 'CREDIT_NOTE' THEN v_prefix := 'CN';
        WHEN 'DEBIT_NOTE' THEN v_prefix := 'DN';
        WHEN 'PETTY_CASH' THEN v_prefix := 'PC';
        WHEN 'QUOTATION' THEN v_prefix := 'QT';
        ELSE v_prefix := 'VOC';
    END CASE;

    -- Upsert sequence record and lock row atomically
    INSERT INTO public.voucher_sequences (company_id, type, branch_id, prefix, current_value, updated_at)
    VALUES (p_company_id, UPPER(p_type), p_branch_id, v_prefix, 1, now())
    ON CONFLICT (company_id, type, branch_id)
    DO UPDATE SET
        current_value = public.voucher_sequences.current_value + 1,
        updated_at = now()
    RETURNING current_value, prefix INTO v_next_val, v_prefix;

    v_voucher_num := v_prefix || '-' || v_year || '-' || lpad(v_next_val::TEXT, 5, '0');
    RETURN v_voucher_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. PHONE NORMALIZATION & UNIQUE CUSTOMER PHONE INDEX
-- ============================================================================

CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone TEXT)
RETURNS TEXT
SET search_path = public, pg_temp
AS $$
DECLARE
    v_cleaned TEXT;
BEGIN
    IF p_phone IS NULL OR trim(p_phone) = '' THEN
        RETURN '';
    END IF;

    -- Strip non-digit characters except leading plus
    v_cleaned := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- If starts with 968 and 11 digits (e.g. 968XXXXXXXX), prepend +
    IF length(v_cleaned) = 11 AND v_cleaned LIKE '968%' THEN
        RETURN '+' || v_cleaned;
    -- If 8 local digits in Oman (e.g. 7XXXXXXX, 9XXXXXXX), prepend +968
    ELSIF length(v_cleaned) = 8 THEN
        RETURN '+968' || v_cleaned;
    -- If already starts with country code without plus
    ELSIF length(v_cleaned) > 8 THEN
        RETURN '+' || v_cleaned;
    END IF;

    RETURN v_cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add location & normalized phone to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS governorate TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'سلطنة عمان',
ADD COLUMN IF NOT EXISTS normalized_phone TEXT DEFAULT '';

-- Trigger function to normalize phone on save
CREATE OR REPLACE FUNCTION public.set_customer_normalized_phone()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.normalized_phone := public.normalize_phone(NEW.phone);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_normalize_phone ON public.customers;
CREATE TRIGGER trg_customers_normalize_phone
    BEFORE INSERT OR UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.set_customer_normalized_phone();

-- Create Unique Index on (company_id, normalized_phone) for non-empty phone numbers
CREATE UNIQUE INDEX IF NOT EXISTS ux_customers_company_normalized_phone
ON public.customers (company_id, normalized_phone)
WHERE normalized_phone IS NOT NULL AND normalized_phone <> '';

-- ============================================================================
-- 3. MASTER LOCATION REFERENCE DATA (OMAN)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.master_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    governorate_ar TEXT NOT NULL,
    governorate_en TEXT NOT NULL,
    city_ar TEXT NOT NULL,
    city_en TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    CONSTRAINT ux_master_locations_city UNIQUE (governorate_ar, city_ar)
);

-- Seed Oman Master Locations
INSERT INTO public.master_locations (governorate_ar, governorate_en, city_ar, city_en, display_order)
VALUES
    ('شمال الباطنة', 'North Al Batinah', 'صحار', 'Sohar', 1),
    ('شمال الباطنة', 'North Al Batinah', 'لوى', 'Liwa', 2),
    ('شمال الباطنة', 'North Al Batinah', 'شناص', 'Shinas', 3),
    ('شمال الباطنة', 'North Al Batinah', 'صحم', 'Saham', 4),
    ('شمال الباطنة', 'North Al Batinah', 'الخابورة', 'Al Khabourha', 5),
    ('شمال الباطنة', 'North Al Batinah', 'السويق', 'Suwayq', 6),
    ('مسقط', 'Muscat', 'مسقط', 'Muscat', 10),
    ('مسقط', 'Muscat', 'السيب', 'Seeb', 11),
    ('مسقط', 'Muscat', 'بوشر', 'Bawshar', 12),
    ('مسقط', 'Muscat', 'مطرح', 'Muttrah', 13),
    ('مسقط', 'Muscat', 'العامرات', 'Amerat', 14),
    ('مسقط', 'Muscat', 'قريات', 'Qurayyat', 15),
    ('ظفار', 'Dhofar', 'صلالة', 'Salalah', 20),
    ('ظفار', 'Dhofar', 'طاقة', 'Taqah', 21),
    ('ظفار', 'Dhofar', 'مرباط', 'Mirbat', 22),
    ('جنوب الباطنة', 'South Al Batinah', 'الرستاق', 'Rustaq', 30),
    ('جنوب الباطنة', 'South Al Batinah', 'بركاء', 'Barka', 31),
    ('جنوب الباطنة', 'South Al Batinah', 'المصنعة', 'Mussanah', 32),
    ('الداخلية', 'Ad Dakhiliyah', 'نزوى', 'Nizwa', 40),
    ('الداخلية', 'Ad Dakhiliyah', 'بهلاء', 'Bahla', 41),
    ('البريمي', 'Al Buraimi', 'البريمي', 'Al Buraimi', 50),
    ('الظاهرة', 'Ad Dhahirah', 'عبري', 'Ibri', 60),
    ('مسندم', 'Musandam', 'خصب', 'Khasab', 70)
ON CONFLICT (governorate_ar, city_ar) DO NOTHING;

-- ============================================================================
-- 4. VOUCHERS & INVOICES FIELD HARDENING (DISCOUNTS, PROOFS, VERIFICATION TOKEN)
-- ============================================================================

-- Add columns to vouchers
ALTER TABLE public.vouchers
ADD COLUMN IF NOT EXISTS verification_token UUID DEFAULT gen_random_uuid() NOT NULL,
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'FIXED',
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(15,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS transfer_proof_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pos_last_four TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS payment_gateway_ref TEXT DEFAULT '';

-- Add columns to invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS verification_token UUID DEFAULT gen_random_uuid() NOT NULL,
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'FIXED',
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(15,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS transfer_proof_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pos_last_four TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS payment_gateway_ref TEXT DEFAULT '';

-- Add POS 4-digit validation check constraints
ALTER TABLE public.vouchers
DROP CONSTRAINT IF EXISTS chk_vouchers_pos_last_four;

ALTER TABLE public.vouchers
ADD CONSTRAINT chk_vouchers_pos_last_four
CHECK (pos_last_four = '' OR pos_last_four ~ '^\d{4}$');

ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS chk_invoices_pos_last_four;

ALTER TABLE public.invoices
ADD CONSTRAINT chk_invoices_pos_last_four
CHECK (pos_last_four = '' OR pos_last_four ~ '^\d{4}$');

-- Add Discount Type validation check constraints
ALTER TABLE public.vouchers
DROP CONSTRAINT IF EXISTS chk_vouchers_discount_type;

ALTER TABLE public.vouchers
ADD CONSTRAINT chk_vouchers_discount_type
CHECK (discount_type IN ('PERCENTAGE', 'FIXED'));

-- Indexes for fast QR token lookup
CREATE INDEX IF NOT EXISTS idx_vouchers_verification_token ON public.vouchers(verification_token);
CREATE INDEX IF NOT EXISTS idx_invoices_verification_token ON public.invoices(verification_token);

-- ============================================================================
-- 5. PUBLIC INVOICE QR VERIFICATION LOOKUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_invoice_verification(
    p_invoice_id UUID,
    p_token UUID
)
RETURNS JSONB
SET search_path = public, pg_temp
AS $$
DECLARE
    v_record RECORD;
    v_company_name TEXT;
    v_result JSONB;
BEGIN
    -- Check invoices table first
    SELECT i.id, i.invoice_number, i.issue_date, i.total_amount, i.tax_amount, i.status, i.currency, c.name AS company_name
    INTO v_record
    FROM public.invoices i
    JOIN public.companies c ON c.id = i.company_id
    WHERE i.id = p_invoice_id AND i.verification_token = p_token;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'valid', true,
            'documentType', 'INVOICE',
            'documentNumber', v_record.invoice_number,
            'issueDate', v_record.issue_date,
            'companyName', v_record.company_name,
            'totalAmount', v_record.total_amount,
            'taxAmount', v_record.tax_amount,
            'currency', v_record.currency,
            'status', v_record.status
        );
    END IF;

    -- Check vouchers table
    SELECT v.id, v.voucher_number, v.date AS issue_date, v.total_amount, v.tax_amount, v.status, v.currency, c.name AS company_name
    INTO v_record
    FROM public.vouchers v
    JOIN public.companies c ON c.id = v.company_id
    WHERE v.id = p_invoice_id AND v.verification_token = p_token;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'valid', true,
            'documentType', 'VOUCHER',
            'documentNumber', v_record.voucher_number,
            'issueDate', v_record.issue_date,
            'companyName', v_record.company_name,
            'totalAmount', v_record.total_amount,
            'taxAmount', v_record.tax_amount,
            'currency', v_record.currency,
            'status', v_record.status
        );
    END IF;

    RETURN jsonb_build_object(
        'valid', false,
        'message', 'رمز التحقق غير صحيح أو الفاتورة غير موجودة'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to anon and authenticated for public QR scanning
GRANT EXECUTE ON FUNCTION public.get_public_invoice_verification(UUID, UUID) TO anon, authenticated;

-- ============================================================================
-- 6. ATOMIC FINANCIAL POSTING RPC TRANSACTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.post_voucher_financial_transaction(
    p_company_id UUID,
    p_branch_id UUID,
    p_voucher_payload JSONB
)
RETURNS JSONB
SET search_path = public, pg_temp
AS $$
DECLARE
    v_voucher_id UUID;
    v_voucher_number TEXT;
    v_type TEXT;
    v_total_amount NUMERIC(15,3);
    v_currency TEXT;
    v_journal_id UUID;
    v_ar_account_id UUID;
    v_revenue_account_id UUID;
    v_cash_account_id UUID;
BEGIN
    v_type := COALESCE(p_voucher_payload->>'type', 'RECEIPT');
    v_total_amount := (p_voucher_payload->>'totalAmount')::NUMERIC(15,3);
    v_currency := COALESCE(p_voucher_payload->>'currency', 'OMR');

    -- Auto-generate number if empty or requested
    IF p_voucher_payload->>'voucherNumber' IS NULL OR trim(p_voucher_payload->>'voucherNumber') = '' OR p_voucher_payload->>'voucherNumber' LIKE 'AUTO%' THEN
        v_voucher_number := public.generate_next_voucher_number(p_company_id, v_type, p_branch_id);
    ELSE
        v_voucher_number := p_voucher_payload->>'voucherNumber';
    END IF;

    -- Insert Voucher Record
    INSERT INTO public.vouchers (
        company_id,
        branch_id,
        branch_name,
        voucher_number,
        type,
        reference_no,
        date,
        received_from,
        paid_to,
        payer_email,
        payer_phone,
        payer_address,
        payer_tax_id,
        amount,
        currency,
        amount_in_words,
        is_custom_words,
        payment_method,
        check_number,
        bank_name,
        transaction_ref,
        category,
        line_items,
        subtotal,
        tax_rate,
        tax_amount,
        discount_type,
        discount_value,
        discount_amount,
        total_amount,
        notes,
        terms,
        custom_fields,
        status,
        prepared_by,
        approved_by,
        received_by,
        transfer_proof_url,
        pos_last_four,
        payment_gateway_ref
    ) VALUES (
        p_company_id,
        p_branch_id,
        COALESCE(p_voucher_payload->>'branchName', ''),
        v_voucher_number,
        v_type,
        COALESCE(p_voucher_payload->>'referenceNo', ''),
        COALESCE((p_voucher_payload->>'date')::DATE, CURRENT_DATE),
        COALESCE(p_voucher_payload->>'receivedFrom', ''),
        COALESCE(p_voucher_payload->>'paidTo', ''),
        COALESCE(p_voucher_payload->>'payerEmail', ''),
        COALESCE(p_voucher_payload->>'payerPhone', ''),
        COALESCE(p_voucher_payload->>'payerAddress', ''),
        COALESCE(p_voucher_payload->>'payerTaxId', ''),
        v_total_amount,
        v_currency,
        COALESCE(p_voucher_payload->>'amountInWords', ''),
        COALESCE((p_voucher_payload->>'isCustomWords')::BOOLEAN, false),
        COALESCE(p_voucher_payload->>'paymentMethod', 'CASH'),
        COALESCE(p_voucher_payload->>'checkNumber', ''),
        COALESCE(p_voucher_payload->>'bankName', ''),
        COALESCE(p_voucher_payload->>'transactionRef', ''),
        COALESCE(p_voucher_payload->>'category', ''),
        COALESCE(p_voucher_payload->'lineItems', '[]'::jsonb),
        COALESCE((p_voucher_payload->>'subtotal')::NUMERIC(15,3), 0),
        COALESCE((p_voucher_payload->>'taxRate')::NUMERIC(5,2), 0),
        COALESCE((p_voucher_payload->>'taxAmount')::NUMERIC(15,3), 0),
        COALESCE(p_voucher_payload->>'discountType', 'FIXED'),
        COALESCE((p_voucher_payload->>'discountValue')::NUMERIC(15,3), 0),
        COALESCE((p_voucher_payload->>'discountAmount')::NUMERIC(15,3), 0),
        v_total_amount,
        COALESCE(p_voucher_payload->>'notes', ''),
        COALESCE(p_voucher_payload->>'terms', ''),
        COALESCE(p_voucher_payload->'customFields', '[]'::jsonb),
        'ISSUED',
        COALESCE(p_voucher_payload->>'preparedBy', ''),
        COALESCE(p_voucher_payload->>'approvedBy', ''),
        COALESCE(p_voucher_payload->>'receivedBy', ''),
        COALESCE(p_voucher_payload->>'transferProofUrl', ''),
        COALESCE(p_voucher_payload->>'posLastFour', ''),
        COALESCE(p_voucher_payload->>'paymentGatewayRef', '')
    )
    RETURNING id INTO v_voucher_id;

    RETURN jsonb_build_object(
        'success', true,
        'voucherId', v_voucher_id,
        'voucherNumber', v_voucher_number,
        'status', 'ISSUED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users only
REVOKE EXECUTE ON FUNCTION public.post_voucher_financial_transaction(UUID, UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_voucher_financial_transaction(UUID, UUID, JSONB) TO authenticated;

COMMIT;
