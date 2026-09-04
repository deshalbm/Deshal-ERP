-- Migration 0027: Create email_logs table and RLS policies
-- Provides audit trail, tracking and retry management for all system emails.

CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    recipient TEXT NOT NULL,
    email_type TEXT NOT NULL,
    related_entity_type TEXT,
    related_entity_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'DELIVERED', 'BOUNCED')),
    provider_message_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for rapid queries, company filtering, and audit log monitoring
CREATE INDEX IF NOT EXISTS idx_email_logs_company_id ON public.email_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated & anon sessions can view/insert email logs for active companies
DROP POLICY IF EXISTS email_logs_select ON public.email_logs;
CREATE POLICY email_logs_select ON public.email_logs
    FOR SELECT TO authenticated, anon
    USING (company_id IS NULL OR company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS email_logs_insert ON public.email_logs;
CREATE POLICY email_logs_insert ON public.email_logs
    FOR INSERT TO authenticated, anon
    WITH CHECK (company_id IS NULL OR company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS email_logs_update ON public.email_logs;
CREATE POLICY email_logs_update ON public.email_logs
    FOR UPDATE TO authenticated, anon
    USING (company_id IS NULL OR company_id IN (SELECT public.auth_user_company_ids()));
