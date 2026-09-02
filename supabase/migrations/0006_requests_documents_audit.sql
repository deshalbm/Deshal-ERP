-- Deshal ERP — Migration 0006: Dynamic Requests Engine, Documents & Audit Trail
-- Purpose: Schema-on-Write Requests, File Metadata, System Notifications & Audit Logs

BEGIN;

-- 1. Dynamic Request Types (Form Schemas) Table
CREATE TABLE IF NOT EXISTS public.request_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL, -- LEAVE, PURCHASE, HR, OPERATIONS, CUSTOM
    icon TEXT,
    fields_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
    approval_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_request_types_code UNIQUE (company_id, code)
);

-- 2. Submitted Requests Table
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    request_type_id UUID NOT NULL REFERENCES public.request_types(id) ON DELETE RESTRICT,
    submitted_by_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    request_number TEXT NOT NULL,
    field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'SUBMITTED', -- DRAFT, SUBMITTED, IN_REVIEW, APPROVED, REJECTED, WITHDRAWN
    current_approval_level INT NOT NULL DEFAULT 1,
    generated_document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_requests_number UNIQUE (company_id, request_number)
);

-- 3. Document Attachments Metadata Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INT NOT NULL,
    storage_bucket TEXT NOT NULL, -- employee-documents, contracts, receipts, etc.
    storage_path TEXT NOT NULL,
    entity_type TEXT, -- EMPLOYEE, CUSTOMER, LEASE_CONTRACT, VOUCHER
    entity_id UUID,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Audit Logs Table (Tamper-Evident Security Log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, POST, REVERSE, LOGIN, EXPORT
    domain TEXT NOT NULL,
    entity_id UUID,
    details TEXT NOT NULL,
    ip_address TEXT,
    before_state JSONB,
    after_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_system_settings_key UNIQUE (company_id, setting_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_company_id ON public.requests(company_id);
CREATE INDEX IF NOT EXISTS idx_requests_submitter ON public.requests(submitted_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

COMMIT;
