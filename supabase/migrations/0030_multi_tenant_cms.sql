-- ============================================================================
-- Deshal ERP — Migration 0030: Multi-Tenant Website & CMS Platform
-- ============================================================================
-- Purpose:
--   1. tenant_websites   — Site registry (official + tenant sites)
--   2. tenant_pages      — CMS pages per site
--   3. cms_blog_posts    — Blog posts per site
--   4. cms_hero_banners  — Hero/banner sections per site
--   5. cms_content_revisions — Content version history
--   6. cms_media         — Media metadata linked to Supabase Storage
--   7. cms_audit_logs    — CMS-specific audit trail
--   8. cms_contact_submissions — Public contact form buffer before CRM routing
--
-- Security model:
--   • RLS is the PRIMARY isolation layer — not hostname filtering alone.
--   • Public read policies only expose published content.
--   • No destructive changes to any existing table.
--   • All new tables use company_id FK → companies for tenant isolation.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TENANT WEBSITES (Site Registry)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Site type: 'official' for the main company site, 'tenant' for client sub-sites
    site_type TEXT NOT NULL DEFAULT 'tenant'
        CONSTRAINT chk_tenant_websites_site_type CHECK (site_type IN ('official', 'tenant')),

    name TEXT NOT NULL,
    slug TEXT NOT NULL,

    -- Domain resolution: either a custom domain or a subdomain of the base domain
    domain TEXT,         -- e.g. 'alshamil.om' or 'clientname.com'
    subdomain TEXT,      -- e.g. 'abc' (resolves to abc.alshamil.om)

    -- Template applied to this site
    template TEXT NOT NULL DEFAULT 'corporate'
        CONSTRAINT chk_tenant_websites_template CHECK (
            template IN ('corporate', 'professional_services', 'trading', 'training', 'construction')
        ),

    status TEXT NOT NULL DEFAULT 'active'
        CONSTRAINT chk_tenant_websites_status CHECK (status IN ('active', 'inactive', 'suspended')),

    -- Branding
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#002e69',
    secondary_color TEXT DEFAULT '#006d33',

    -- Localization
    primary_language TEXT NOT NULL DEFAULT 'ar',
    secondary_language TEXT DEFAULT 'en',

    -- Flexible site settings (JSON)
    settings JSONB NOT NULL DEFAULT '{}',

    -- SEO defaults for the site
    seo_title TEXT,
    seo_description TEXT,
    og_image TEXT,
    robots_policy TEXT NOT NULL DEFAULT 'index, follow',

    -- Timestamps
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT uk_tenant_websites_domain UNIQUE (domain),
    CONSTRAINT uk_tenant_websites_subdomain UNIQUE (subdomain),
    CONSTRAINT uk_tenant_websites_company_slug UNIQUE (company_id, slug),
    -- A company can only have ONE official site
    CONSTRAINT chk_tenant_websites_domain_or_subdomain CHECK (
        domain IS NOT NULL OR subdomain IS NOT NULL
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_tenant_websites_one_official_per_company
    ON public.tenant_websites (company_id)
    WHERE site_type = 'official';

CREATE INDEX IF NOT EXISTS idx_tenant_websites_company_id ON public.tenant_websites (company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_websites_domain ON public.tenant_websites (domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_websites_subdomain ON public.tenant_websites (subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_websites_status ON public.tenant_websites (status);

-- ============================================================================
-- 2. TENANT PAGES (CMS Pages per Site)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_website_id UUID NOT NULL REFERENCES public.tenant_websites(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- URL slug (e.g. 'about', 'services') — unique per site
    slug TEXT NOT NULL,

    -- Page metadata
    title TEXT NOT NULL,
    page_type TEXT NOT NULL DEFAULT 'custom'
        CONSTRAINT chk_tenant_pages_page_type CHECK (
            page_type IN ('home', 'about', 'services', 'business_center', 'studio',
                          'training', 'knowledge_hub', 'contact', 'blog_index', 'custom')
        ),

    -- Structured sections (array of section objects — no raw HTML allowed)
    -- Each element: { type, visible, order, data: { title, text, image, cta, link, ... } }
    sections JSONB NOT NULL DEFAULT '[]',

    -- Content fallback (plain text/markdown, sanitized)
    content TEXT,

    -- Publishing workflow
    status TEXT NOT NULL DEFAULT 'draft'
        CONSTRAINT chk_tenant_pages_status CHECK (
            status IN ('draft', 'under_review', 'published', 'unpublished', 'archived')
        ),
    published_at TIMESTAMPTZ,
    submitted_for_review_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,

    -- SEO fields
    seo_title TEXT,
    seo_description TEXT,
    canonical_url TEXT,
    og_image TEXT,
    og_title TEXT,
    og_description TEXT,
    robots TEXT DEFAULT 'index, follow',

    -- Structured data (JSON-LD generated from page data — never raw user script)
    structured_data JSONB,

    -- Ownership
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Unique slug per site (excluding soft-deleted)
    CONSTRAINT uk_tenant_pages_site_slug UNIQUE (tenant_website_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_tenant_pages_website_id ON public.tenant_pages (tenant_website_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_company_id ON public.tenant_pages (company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_slug ON public.tenant_pages (tenant_website_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_pages_status ON public.tenant_pages (tenant_website_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_pages_published ON public.tenant_pages (tenant_website_id, published_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;

-- ============================================================================
-- 3. CMS BLOG POSTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_website_id UUID NOT NULL REFERENCES public.tenant_websites(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Post identity
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,

    -- Rich content stored as sanitized text/markdown (no raw HTML injection)
    content TEXT,

    -- Cover image (URL to Supabase Storage or external CDN)
    cover_image TEXT,
    cover_image_alt TEXT,

    -- Categorization
    category TEXT,
    tags TEXT[] DEFAULT '{}',

    -- Author
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT,  -- Cached display name

    -- Publishing workflow
    status TEXT NOT NULL DEFAULT 'draft'
        CONSTRAINT chk_cms_blog_posts_status CHECK (
            status IN ('draft', 'under_review', 'published', 'unpublished', 'archived')
        ),
    published_at TIMESTAMPTZ,
    submitted_for_review_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,

    -- SEO fields
    seo_title TEXT,
    seo_description TEXT,
    canonical_url TEXT,
    og_image TEXT,
    og_title TEXT,
    og_description TEXT,
    robots TEXT DEFAULT 'index, follow',

    -- Structured data (JSON-LD — BlogPosting/Article schema, generated not user-inputted)
    structured_data JSONB,

    -- Reading stats
    reading_time_minutes INT DEFAULT 1,
    word_count INT DEFAULT 0,

    -- Ownership
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_cms_blog_posts_site_slug UNIQUE (tenant_website_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_website_id ON public.cms_blog_posts (tenant_website_id);
CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_company_id ON public.cms_blog_posts (company_id);
CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_slug ON public.cms_blog_posts (tenant_website_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_status ON public.cms_blog_posts (tenant_website_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_published ON public.cms_blog_posts (tenant_website_id, published_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cms_blog_posts_tags ON public.cms_blog_posts USING gin (tags);

-- ============================================================================
-- 4. CMS HERO BANNERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_hero_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_website_id UUID NOT NULL REFERENCES public.tenant_websites(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    subtitle TEXT,
    body_text TEXT,

    -- Media
    image_url TEXT,
    image_alt TEXT,
    video_url TEXT,

    -- Call to action
    cta_text TEXT,
    cta_link TEXT,
    cta_secondary_text TEXT,
    cta_secondary_link TEXT,

    -- Display control
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Scheduling
    active_from TIMESTAMPTZ,
    active_until TIMESTAMPTZ,

    -- Ownership
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_hero_banners_website_id ON public.cms_hero_banners (tenant_website_id);
CREATE INDEX IF NOT EXISTS idx_cms_hero_banners_active ON public.cms_hero_banners (tenant_website_id, display_order)
    WHERE is_active = true;

-- ============================================================================
-- 5. CMS CONTENT REVISIONS (Version History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_content_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_website_id UUID NOT NULL REFERENCES public.tenant_websites(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- What entity this revision belongs to
    entity_type TEXT NOT NULL
        CONSTRAINT chk_cms_content_revisions_entity_type CHECK (
            entity_type IN ('tenant_page', 'cms_blog_post', 'cms_hero_banner')
        ),
    entity_id UUID NOT NULL,

    -- Sequential version number per entity
    version INT NOT NULL,

    -- Full snapshot of the content at this point in time
    content_snapshot JSONB NOT NULL,

    -- Context
    change_reason TEXT,
    action TEXT NOT NULL DEFAULT 'save'
        CONSTRAINT chk_cms_content_revisions_action CHECK (
            action IN ('save', 'submit_for_review', 'approve', 'publish', 'unpublish', 'restore')
        ),

    -- Ownership
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_by_name TEXT,

    -- Timestamps (revisions are immutable — no updated_at)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_cms_content_revisions_entity_version UNIQUE (entity_id, version)
);

CREATE INDEX IF NOT EXISTS idx_cms_content_revisions_entity ON public.cms_content_revisions (entity_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_cms_content_revisions_website ON public.cms_content_revisions (tenant_website_id);
CREATE INDEX IF NOT EXISTS idx_cms_content_revisions_company ON public.cms_content_revisions (company_id);

-- ============================================================================
-- 6. CMS MEDIA (Media Metadata + Supabase Storage Reference)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_website_id UUID NOT NULL REFERENCES public.tenant_websites(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Storage reference
    bucket_name TEXT NOT NULL DEFAULT 'cms_media',
    storage_path TEXT NOT NULL,         -- e.g. 'company_id/site_id/filename.webp'
    public_url TEXT NOT NULL,

    -- File metadata
    filename TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,

    -- Image dimensions (when applicable)
    width_px INT,
    height_px INT,

    -- Accessibility
    alt_text TEXT,
    caption TEXT,

    -- Media type classification
    media_type TEXT NOT NULL DEFAULT 'image'
        CONSTRAINT chk_cms_media_media_type CHECK (
            media_type IN ('image', 'document', 'video_metadata')
        ),

    -- Ownership
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_by_name TEXT,

    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uk_cms_media_storage_path UNIQUE (bucket_name, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_cms_media_website_id ON public.cms_media (tenant_website_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cms_media_company_id ON public.cms_media (company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cms_media_media_type ON public.cms_media (tenant_website_id, media_type) WHERE deleted_at IS NULL;

-- ============================================================================
-- 7. CMS AUDIT LOGS (Immutable — CMS-specific action audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_website_id UUID REFERENCES public.tenant_websites(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Actor
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT,
    user_role TEXT,

    -- Action
    action TEXT NOT NULL
        CONSTRAINT chk_cms_audit_logs_action CHECK (
            action IN (
                'site_created', 'site_updated', 'site_deleted',
                'page_created', 'page_updated', 'page_submitted_for_review',
                'page_approved', 'page_published', 'page_unpublished',
                'page_archived', 'page_restored', 'page_deleted',
                'post_created', 'post_updated', 'post_submitted_for_review',
                'post_approved', 'post_published', 'post_unpublished',
                'post_archived', 'post_restored', 'post_deleted',
                'media_uploaded', 'media_deleted',
                'revision_restored',
                'seo_updated',
                'domain_changed',
                'contact_received'
            )
        ),

    -- Entity
    entity_type TEXT,
    entity_id UUID,
    entity_title TEXT,

    -- Change data
    old_value JSONB,
    new_value JSONB,
    metadata JSONB DEFAULT '{}',

    -- Immutable timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_audit_logs_website_id ON public.cms_audit_logs (tenant_website_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_audit_logs_company_id ON public.cms_audit_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_audit_logs_entity ON public.cms_audit_logs (entity_type, entity_id);

-- ============================================================================
-- 8. CMS CONTACT SUBMISSIONS (Public Form Buffer → CRM Lead)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_website_id UUID REFERENCES public.tenant_websites(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,

    -- Resolved from hostname — not from request body
    resolved_domain TEXT,

    -- Contact data (sanitized server-side before insert)
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    company_name TEXT,
    service_interest TEXT,
    message TEXT,
    preferred_date TEXT,
    preferred_time TEXT,

    -- UTM tracking
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer TEXT,

    -- CRM routing status
    crm_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    crm_status TEXT NOT NULL DEFAULT 'pending'
        CONSTRAINT chk_cms_contact_submissions_crm_status CHECK (
            crm_status IN ('pending', 'routed', 'duplicate', 'spam', 'error')
        ),
    crm_routed_at TIMESTAMPTZ,
    crm_error_message TEXT,

    -- Anti-spam metadata
    client_ip_hash TEXT,  -- Hashed, not raw IP
    user_agent_hash TEXT,

    -- Immutable timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_contact_submissions_website ON public.cms_contact_submissions (tenant_website_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_contact_submissions_company ON public.cms_contact_submissions (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_contact_submissions_crm_status ON public.cms_contact_submissions (crm_status)
    WHERE crm_status = 'pending';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL CMS TABLES
-- ============================================================================

ALTER TABLE public.tenant_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_contact_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- RLS is the PRIMARY security layer. Even if a request bypasses hostname
-- resolution, the database enforces tenant isolation.
-- ============================================================================

-- ─── tenant_websites ────────────────────────────────────────────────────────

-- Authenticated users: read their company's sites
CREATE POLICY tw_select_authenticated ON public.tenant_websites
    FOR SELECT
    USING (company_id IN (SELECT public.auth_user_company_ids()));

-- Authenticated users: insert for their company
CREATE POLICY tw_insert_authenticated ON public.tenant_websites
    FOR INSERT
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- Authenticated users: update their company's sites
CREATE POLICY tw_update_authenticated ON public.tenant_websites
    FOR UPDATE
    USING (company_id IN (SELECT public.auth_user_company_ids()));

-- Public (unauthenticated) read of ACTIVE sites — for hostname resolver used by server
-- Server uses service role key which bypasses RLS, so this policy covers anon client reads
CREATE POLICY tw_select_public ON public.tenant_websites
    FOR SELECT TO anon
    USING (status = 'active');

-- ─── tenant_pages ────────────────────────────────────────────────────────────

CREATE POLICY tp_all_authenticated ON public.tenant_pages
    FOR ALL
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- Public: only published, non-deleted pages are readable
CREATE POLICY tp_select_public ON public.tenant_pages
    FOR SELECT TO anon
    USING (status = 'published' AND deleted_at IS NULL);

-- ─── cms_blog_posts ──────────────────────────────────────────────────────────

CREATE POLICY cbp_all_authenticated ON public.cms_blog_posts
    FOR ALL
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- Public: only published, non-deleted posts
CREATE POLICY cbp_select_public ON public.cms_blog_posts
    FOR SELECT TO anon
    USING (status = 'published' AND deleted_at IS NULL);

-- ─── cms_hero_banners ────────────────────────────────────────────────────────

CREATE POLICY chb_all_authenticated ON public.cms_hero_banners
    FOR ALL
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- Public: active banners
CREATE POLICY chb_select_public ON public.cms_hero_banners
    FOR SELECT TO anon
    USING (is_active = true);

-- ─── cms_content_revisions ───────────────────────────────────────────────────

-- Authenticated: read revisions for their company
CREATE POLICY ccr_select_authenticated ON public.cms_content_revisions
    FOR SELECT
    USING (company_id IN (SELECT public.auth_user_company_ids()));

-- Authenticated: insert revisions for their company
CREATE POLICY ccr_insert_authenticated ON public.cms_content_revisions
    FOR INSERT
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- NO UPDATE, NO DELETE — revisions are immutable

-- ─── cms_media ───────────────────────────────────────────────────────────────

CREATE POLICY cm_all_authenticated ON public.cms_media
    FOR ALL
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- Public: active (non-deleted) media is readable for embedding in public pages
CREATE POLICY cm_select_public ON public.cms_media
    FOR SELECT TO anon
    USING (deleted_at IS NULL);

-- ─── cms_audit_logs ──────────────────────────────────────────────────────────

-- Authenticated: read their company's audit logs
CREATE POLICY cal_select_authenticated ON public.cms_audit_logs
    FOR SELECT
    USING (company_id IN (SELECT public.auth_user_company_ids()));

-- Authenticated: insert audit logs for their company
CREATE POLICY cal_insert_authenticated ON public.cms_audit_logs
    FOR INSERT
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

-- NO UPDATE, NO DELETE — audit logs are immutable

-- ─── cms_contact_submissions ─────────────────────────────────────────────────

-- Authenticated: read their company's submissions
CREATE POLICY ccs_select_authenticated ON public.cms_contact_submissions
    FOR SELECT
    USING (company_id IN (SELECT public.auth_user_company_ids()));

-- NO direct INSERT from authenticated browser clients — inserted server-side via service role only
-- NO UPDATE from clients
-- NO DELETE from clients

-- ─── SUPABASE STORAGE (cms_media bucket) ─────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('cms_media', 'cms_media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for cms_media bucket
CREATE POLICY cms_media_storage_public_select ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'cms_media');

-- Authenticated upload restricted to user's tenant company_id folder
CREATE POLICY cms_media_storage_authenticated_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'cms_media'
        AND (storage.foldername(name))[1]::uuid IN (SELECT public.auth_user_company_ids())
    );

-- Authenticated delete restricted to user's tenant company_id folder
CREATE POLICY cms_media_storage_authenticated_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'cms_media'
        AND (storage.foldername(name))[1]::uuid IN (SELECT public.auth_user_company_ids())
    );

-- ============================================================================
-- SEED: Official Site for Al-Shamil Company
-- Only inserts if the official site doesn't already exist
-- ============================================================================

INSERT INTO public.tenant_websites (
    company_id,
    site_type,
    name,
    slug,
    domain,
    template,
    status,
    primary_language,
    secondary_language,
    seo_title,
    seo_description,
    robots_policy,
    settings
)
SELECT
    '00000000-0000-0000-0000-000000000001',
    'official',
    'الدليل الشامل لاستشارات إدارة المشاريع',
    'alshamil-official',
    'alshamil.om',
    'corporate',
    'active',
    'ar',
    'en',
    'الدليل الشامل لاستشارات إدارة المشاريع — صحار، سلطنة عُمان',
    'شركة استشارية متخصصة ومصرحة في سلطنة عُمان. خدمات التأسيس، دراسات الجدوى، مركز الأعمال، الاستوديو، والتدريب في صحار.',
    'index, follow',
    '{
        "address": "ولاية صحار، محافظة شمال الباطنة، الشارع التجاري",
        "phone": "+96826840000",
        "email": "info@alshamil.om",
        "whatsapp": "+96890000000",
        "social": {
            "instagram": "",
            "twitter": "",
            "linkedin": ""
        }
    }'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.tenant_websites
    WHERE company_id = '00000000-0000-0000-0000-000000000001'
    AND site_type = 'official'
);

COMMIT;
