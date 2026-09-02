-- ============================================================================
-- Deshal ERP
-- Migration 0012: CRM Leads & Pipelines Domain
-----------------------------------------------------------
-- Purpose:
--   1. Add first-class Pipelines table and map existing pipeline stages.
--   2. Add first-class Leads table with conversion tracking to Customers/Opportunities.
--   3. Enforce Row Level Security (RLS) and indexing for CRM domain.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CRM PIPELINES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_pipelines_company_code UNIQUE (company_id, code)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_pipelines_one_default_per_company
ON public.pipelines (company_id)
WHERE is_default = true;

-- ============================================================================
-- 2. LEADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE RESTRICT,
    lead_number TEXT NOT NULL,
    name TEXT NOT NULL,
    company_name TEXT,
    job_title TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    city TEXT DEFAULT 'صحار',
    country TEXT DEFAULT 'Oman',
    source TEXT,
    source_details TEXT,
    status TEXT NOT NULL DEFAULT 'NEW',
    score INT NOT NULL DEFAULT 0,
    estimated_value NUMERIC(15,3) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'OMR',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    converted_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    converted_opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    lost_reason TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_leads_company_number UNIQUE (company_id, lead_number),
    CONSTRAINT chk_leads_status CHECK (
        status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST')
    ),
    CONSTRAINT chk_leads_score CHECK (score >= 0 AND score <= 100),
    CONSTRAINT chk_leads_estimated_value CHECK (estimated_value >= 0)
);

ALTER TABLE public.leads
DROP CONSTRAINT IF EXISTS chk_leads_conversion_integrity;

ALTER TABLE public.leads
ADD CONSTRAINT chk_leads_conversion_integrity
CHECK (
    (
        status = 'CONVERTED'
        AND converted_at IS NOT NULL
        AND (converted_customer_id IS NOT NULL OR converted_opportunity_id IS NOT NULL)
    )
    OR status <> 'CONVERTED'
);

-- ============================================================================
-- 3. LEAD INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads (company_id);
CREATE INDEX IF NOT EXISTS idx_leads_branch_id ON public.leads (branch_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads (assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email) WHERE email IS NOT NULL;

-- ============================================================================
-- 4. PIPELINE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pipelines_company_id ON public.pipelines (company_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_active ON public.pipelines (company_id, is_active) WHERE is_active = true;

-- ============================================================================
-- 5. LINK PIPELINE STAGES TO PIPELINES
-- ============================================================================

ALTER TABLE public.pipeline_stages
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON public.pipeline_stages (pipeline_id);

INSERT INTO public.pipelines (
    company_id, code, name_ar, name_en, description, is_active, is_default
)
SELECT DISTINCT
    ps.company_id,
    'DEFAULT',
    'خط المبيعات الافتراضي',
    'Default Sales Pipeline',
    'Automatically created from existing pipeline stages',
    true,
    true
FROM public.pipeline_stages ps
WHERE NOT EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.company_id = ps.company_id AND p.code = 'DEFAULT'
);

UPDATE public.pipeline_stages ps
SET pipeline_id = p.id
FROM public.pipelines p
WHERE ps.company_id = p.company_id
  AND ps.pipeline_code = p.code
  AND ps.pipeline_id IS NULL;

-- ============================================================================
-- 6. RLS POLICIES FOR LEADS & PIPELINES
-- ============================================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_policy ON public.leads;
CREATE POLICY leads_policy ON public.leads
FOR ALL TO authenticated
USING (company_id IN (SELECT public.auth_user_company_ids()))
WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pipelines_policy ON public.pipelines;
CREATE POLICY pipelines_policy ON public.pipelines
FOR ALL TO authenticated
USING (company_id IN (SELECT public.auth_user_company_ids()))
WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS pipeline_stages_policy ON public.pipeline_stages;
CREATE POLICY pipeline_stages_policy ON public.pipeline_stages
FOR ALL TO authenticated
USING (company_id IN (SELECT public.auth_user_company_ids()))
WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- ============================================================================
-- 7. TRIGGERS: AUTOMATIC LEAD CONVERSION TIMESTAMP & UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_lead_conversion_timestamp()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.status = 'CONVERTED'
       AND OLD.status IS DISTINCT FROM 'CONVERTED'
       AND NEW.converted_at IS NULL
    THEN
        NEW.converted_at := now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.set_lead_conversion_timestamp() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_set_lead_conversion_timestamp ON public.leads;
CREATE TRIGGER trg_set_lead_conversion_timestamp
BEFORE INSERT OR UPDATE OF status ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_lead_conversion_timestamp();

CREATE OR REPLACE FUNCTION public.set_lead_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.set_lead_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_set_lead_updated_at ON public.leads;
CREATE TRIGGER trg_set_lead_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_lead_updated_at();

CREATE OR REPLACE FUNCTION public.set_pipeline_updated_at()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.set_pipeline_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_set_pipeline_updated_at ON public.pipelines;
CREATE TRIGGER trg_set_pipeline_updated_at
BEFORE UPDATE ON public.pipelines
FOR EACH ROW EXECUTE FUNCTION public.set_pipeline_updated_at();

-- ============================================================================
-- 8. OPPORTUNITY & CRM HARDENING INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline_stage_id ON public.opportunities (pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON public.opportunities (assigned_to);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities (company_id, status);
CREATE INDEX IF NOT EXISTS idx_opportunities_expected_closing_date ON public.opportunities (company_id, expected_closing_date) WHERE expected_closing_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_company_phone ON public.customers (company_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_company_email ON public.customers (company_id, email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_company_id ON public.activities (company_id);
CREATE INDEX IF NOT EXISTS idx_activities_opportunity_id ON public.activities (opportunity_id) WHERE opportunity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON public.activities (company_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_open_tasks ON public.activities (company_id, due_date) WHERE is_completed = false;

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON public.pipeline_stages (company_id, display_order);

COMMIT;
