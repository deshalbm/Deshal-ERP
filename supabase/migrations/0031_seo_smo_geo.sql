-- ============================================================================
-- Deshal ERP — Migration 0031: Enterprise SEO, GEO, AEO, SMO & Entities Architecture
-- ============================================================================
-- Purpose:
--   1. Extend tenant_websites with Twitter Card, Multilingual & Local SEO fields
--   2. Extend tenant_pages with GEO/AEO/SMO/E-E-A-T & Focus Keyword fields
--   3. Extend cms_blog_posts with GEO/AEO/SMO/E-E-A-T fields
--   4. Create public.seo_redirects — 301/302 URL Redirect Manager per site
--   5. Create public.cms_entities — Semantic Entity Model (Schema.org Entities)
--
-- Security model:
--   • RLS enabled on all new tables with company_id isolation.
--   • Public read policies expose only active redirects and published entity schema.
-- ============================================================================

BEGIN;

-- ─── 1. EXTEND TENANT WEBSITES ───────────────────────────────────────────────

ALTER TABLE public.tenant_websites
    ADD COLUMN IF NOT EXISTS twitter_card TEXT DEFAULT 'summary_large_image',
    ADD COLUMN IF NOT EXISTS twitter_site TEXT,
    ADD COLUMN IF NOT EXISTS default_language TEXT DEFAULT 'ar',
    ADD COLUMN IF NOT EXISTS supported_languages TEXT[] DEFAULT '{ar,en}',
    ADD COLUMN IF NOT EXISTS local_business_type TEXT DEFAULT 'ProfessionalService',
    ADD COLUMN IF NOT EXISTS local_geo_latitude NUMERIC,
    ADD COLUMN IF NOT EXISTS local_geo_longitude NUMERIC,
    ADD COLUMN IF NOT EXISTS local_opening_hours JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS local_service_area TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS local_gbp_url TEXT;

-- ─── 2. EXTEND TENANT PAGES ──────────────────────────────────────────────────

ALTER TABLE public.tenant_pages
    ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
    ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS search_intent TEXT DEFAULT 'informational',
    ADD COLUMN IF NOT EXISTS twitter_title TEXT,
    ADD COLUMN IF NOT EXISTS twitter_description TEXT,
    ADD COLUMN IF NOT EXISTS twitter_image TEXT,
    ADD COLUMN IF NOT EXISTS twitter_card TEXT DEFAULT 'summary_large_image',
    ADD COLUMN IF NOT EXISTS geo_primary_question TEXT,
    ADD COLUMN IF NOT EXISTS geo_direct_answer TEXT,
    ADD COLUMN IF NOT EXISTS geo_key_facts TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS geo_faqs JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS geo_topic_entity TEXT,
    ADD COLUMN IF NOT EXISTS eeat_author_name TEXT,
    ADD COLUMN IF NOT EXISTS eeat_author_credentials TEXT,
    ADD COLUMN IF NOT EXISTS eeat_reviewer_name TEXT,
    ADD COLUMN IF NOT EXISTS eeat_sources JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS eeat_last_reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS seo_score INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS seo_health_issues JSONB DEFAULT '[]';

-- ─── 3. EXTEND CMS BLOG POSTS ────────────────────────────────────────────────

ALTER TABLE public.cms_blog_posts
    ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
    ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS search_intent TEXT DEFAULT 'informational',
    ADD COLUMN IF NOT EXISTS twitter_title TEXT,
    ADD COLUMN IF NOT EXISTS twitter_description TEXT,
    ADD COLUMN IF NOT EXISTS twitter_image TEXT,
    ADD COLUMN IF NOT EXISTS twitter_card TEXT DEFAULT 'summary_large_image',
    ADD COLUMN IF NOT EXISTS geo_primary_question TEXT,
    ADD COLUMN IF NOT EXISTS geo_direct_answer TEXT,
    ADD COLUMN IF NOT EXISTS geo_key_facts TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS geo_faqs JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS geo_topic_entity TEXT,
    ADD COLUMN IF NOT EXISTS eeat_reviewer_name TEXT,
    ADD COLUMN IF NOT EXISTS eeat_credentials TEXT,
    ADD COLUMN IF NOT EXISTS eeat_references JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS eeat_last_reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS seo_score INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS seo_health_issues JSONB DEFAULT '[]';

-- ─── 4. NEW TABLE: SEO REDIRECTS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.seo_redirects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_website_id UUID NOT NULL REFERENCES public.tenant_websites(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    source_path TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    status_code INT NOT NULL DEFAULT 301
        CONSTRAINT chk_seo_redirects_status_code CHECK (status_code IN (301, 302, 307, 308)),

    is_active BOOLEAN NOT NULL DEFAULT true,
    hits_count BIGINT NOT NULL DEFAULT 0,
    last_hit_at TIMESTAMPTZ,

    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_seo_redirects_site_source UNIQUE (tenant_website_id, source_path)
);

CREATE INDEX IF NOT EXISTS idx_seo_redirects_site_id ON public.seo_redirects (tenant_website_id);
CREATE INDEX IF NOT EXISTS idx_seo_redirects_company_id ON public.seo_redirects (company_id);
CREATE INDEX IF NOT EXISTS idx_seo_redirects_lookup ON public.seo_redirects (tenant_website_id, source_path) WHERE is_active = true;

-- ─── 5. NEW TABLE: CMS ENTITIES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cms_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_website_id UUID NOT NULL REFERENCES public.tenant_websites(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    entity_type TEXT NOT NULL
        CONSTRAINT chk_cms_entities_type CHECK (
            entity_type IN ('Organization', 'Brand', 'Person', 'Location', 'Service', 'Product', 'Course', 'Event')
        ),

    slug TEXT NOT NULL,
    official_name TEXT NOT NULL,
    alternate_name TEXT,
    description TEXT,
    logo_url TEXT,
    image_url TEXT,
    url TEXT,

    same_as TEXT[] DEFAULT '{}',
    identifiers JSONB DEFAULT '{}',
    schema_data JSONB DEFAULT '{}',

    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_cms_entities_site_slug UNIQUE (tenant_website_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_cms_entities_site_id ON public.cms_entities (tenant_website_id);
CREATE INDEX IF NOT EXISTS idx_cms_entities_company_id ON public.cms_entities (company_id);
CREATE INDEX IF NOT EXISTS idx_cms_entities_type ON public.cms_entities (tenant_website_id, entity_type);

-- ─── RLS SECURITY & POLICIES ─────────────────────────────────────────────────

ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_entities ENABLE ROW LEVEL SECURITY;

-- ─── seo_redirects RLS ───
CREATE POLICY sr_all_authenticated ON public.seo_redirects
    FOR ALL
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

CREATE POLICY sr_select_public ON public.seo_redirects
    FOR SELECT TO anon
    USING (is_active = true);

-- ─── cms_entities RLS ───
CREATE POLICY ce_all_authenticated ON public.cms_entities
    FOR ALL
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

CREATE POLICY ce_select_public ON public.cms_entities
    FOR SELECT TO anon
    USING (true);

COMMIT;
