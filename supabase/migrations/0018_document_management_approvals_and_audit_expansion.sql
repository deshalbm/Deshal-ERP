-- ============================================================================
-- Deshal ERP
-- Migration 0018: Document Management, Approval Workflows & Audit Expansion
----------------------------------------------------------------------------
-- Purpose:
--   1. Enterprise document categorization, versioning and entity linking.
--   2. Centralized approval workflow engine.
--   3. Approval requests and approval actions.
--   4. Expanded append-only audit trail.
--   5. RLS policies, indexes and trigger-function hardening.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DOCUMENT MANAGEMENT EXPANSION
-- ============================================================================

-- 1.1 Extend existing documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS current_version_id UUID,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Safe status validation.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_documents_status' AND conrelid = 'public.documents'::regclass
    ) THEN
        ALTER TABLE public.documents
        ADD CONSTRAINT chk_documents_status
        CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED', 'EXPIRED', 'LOCKED', 'DELETED'));
    END IF;
END;
$$;

-- 1.2 Document categories
CREATE TABLE IF NOT EXISTS public.document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_document_categories_code UNIQUE (company_id, code)
);

-- 1.3 Document versions
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,
    storage_bucket TEXT,
    storage_path TEXT,
    checksum TEXT,
    notes TEXT,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_document_versions_number CHECK (version_number > 0),
    CONSTRAINT chk_document_versions_file_size CHECK (file_size IS NULL OR file_size >= 0),
    CONSTRAINT uk_document_versions_number UNIQUE (document_id, version_number)
);

-- 1.4 Document links
CREATE TABLE IF NOT EXISTS public.document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    relation_type TEXT NOT NULL DEFAULT 'ATTACHMENT',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_document_links_entity_type CHECK (entity_type = upper(entity_type)),
    CONSTRAINT chk_document_links_relation_type CHECK (
        relation_type IN (
            'ATTACHMENT', 'PRIMARY', 'SUPPORTING', 'CONTRACT',
            'IDENTIFICATION', 'FINANCIAL', 'APPROVAL', 'OTHER'
        )
    ),
    CONSTRAINT uk_document_links_entity UNIQUE (
        document_id, entity_type, entity_id, relation_type
    )
);

-- 1.5 Document access logs
CREATE TABLE IF NOT EXISTS public.document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_id UUID REFERENCES public.document_versions(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'APPLICATION',
    ip_address INET,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_document_access_logs_action CHECK (
        action IN (
            'VIEW', 'DOWNLOAD', 'UPLOAD', 'UPDATE',
            'ARCHIVE', 'RESTORE', 'DELETE', 'VERSION_CREATE'
        )
    )
);

-- 1.6 Document access rules
CREATE TABLE IF NOT EXISTS public.document_access_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    subject_type TEXT NOT NULL,
    subject_id UUID,
    permission TEXT NOT NULL DEFAULT 'READ',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_document_access_rules_subject CHECK (subject_type IN ('USER', 'ROLE', 'COMPANY')),
    CONSTRAINT chk_document_access_rules_permission CHECK (permission IN ('READ', 'WRITE', 'DELETE', 'ADMIN'))
);

-- ============================================================================
-- 2. DOCUMENT MANAGEMENT FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.prevent_locked_document_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status IN ('LOCKED', 'ARCHIVED', 'DELETED') THEN
        IF TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status) AND (
            NEW.title IS NOT DISTINCT FROM OLD.title AND
            NEW.file_name IS NOT DISTINCT FROM OLD.file_name AND
            NEW.storage_path IS NOT DISTINCT FROM OLD.storage_path AND
            NEW.current_version_id IS NOT DISTINCT FROM OLD.current_version_id
        ) THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'Document Integrity Violation: Document % cannot be modified while status is %', OLD.id, OLD.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.validate_document_company_consistency()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_document_company UUID;
BEGIN
    SELECT company_id INTO v_document_company
    FROM public.documents WHERE id = NEW.document_id;

    IF v_document_company IS NULL THEN
        RAISE EXCEPTION 'Document company validation failed: document % does not exist', NEW.document_id;
    END IF;

    IF v_document_company <> NEW.company_id THEN
        RAISE EXCEPTION 'Document company validation failed: company mismatch for document %', NEW.document_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_current_document_version()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        IF NEW.is_current THEN
            UPDATE public.document_versions
            SET is_current = false
            WHERE document_id = NEW.document_id AND is_current = true AND id <> COALESCE(NEW.id, gen_random_uuid());
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.is_current THEN
            UPDATE public.document_versions
            SET is_current = true
            WHERE id = (
                SELECT id FROM public.document_versions
                WHERE document_id = OLD.document_id
                ORDER BY version_number DESC LIMIT 1
            );
        END IF;
        RETURN OLD;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_document_header_version()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.is_current THEN
        UPDATE public.documents
        SET current_version_id = NEW.id, updated_at = now()
        WHERE id = NEW.document_id;
    ELSIF TG_OP = 'DELETE' AND OLD.is_current THEN
        UPDATE public.documents
        SET current_version_id = (
            SELECT id FROM public.document_versions
            WHERE document_id = OLD.document_id AND is_current = true
            LIMIT 1
        ), updated_at = now()
        WHERE id = OLD.document_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. APPROVAL WORKFLOW ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    entity_type TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_approval_workflows_code UNIQUE (company_id, code),
    CONSTRAINT chk_approval_workflows_entity_type CHECK (entity_type = upper(entity_type))
);

CREATE TABLE IF NOT EXISTS public.approval_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    approver_type TEXT NOT NULL,
    approver_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approver_role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    minimum_approvals INTEGER NOT NULL DEFAULT 1,
    allow_reject BOOLEAN NOT NULL DEFAULT true,
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_approval_workflow_steps_order UNIQUE (workflow_id, step_order),
    CONSTRAINT chk_approval_workflow_steps_order CHECK (step_order > 0),
    CONSTRAINT chk_approval_workflow_steps_minimum CHECK (minimum_approvals > 0),
    CONSTRAINT chk_approval_workflow_steps_approver_type CHECK (approver_type IN ('USER', 'ROLE')),
    CONSTRAINT chk_approval_workflow_steps_approver CHECK (
        (approver_type = 'USER' AND approver_user_id IS NOT NULL AND approver_role_id IS NULL) OR
        (approver_type = 'ROLE' AND approver_role_id IS NOT NULL AND approver_user_id IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE RESTRICT,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    current_step_order INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'PENDING',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_approval_requests_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT chk_approval_requests_entity_type CHECK (entity_type = upper(entity_type))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_approval_requests_active_entity
ON public.approval_requests (company_id, entity_type, entity_id)
WHERE status = 'PENDING';

CREATE TABLE IF NOT EXISTS public.approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
    workflow_step_id UUID NOT NULL REFERENCES public.approval_workflow_steps(id) ON DELETE RESTRICT,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    comments TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_approval_actions_action CHECK (action IN ('APPROVED', 'REJECTED', 'SKIPPED', 'CANCELLED'))
);

-- ============================================================================
-- 4. APPROVAL FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_approval_request_consistency()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_company_id UUID;
    v_entity_type TEXT;
BEGIN
    SELECT company_id, entity_type
    INTO v_company_id, v_entity_type
    FROM public.approval_workflows WHERE id = NEW.workflow_id;

    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Approval workflow % does not exist', NEW.workflow_id;
    END IF;

    IF v_company_id <> NEW.company_id THEN
        RAISE EXCEPTION 'Approval request company does not match workflow company';
    END IF;

    IF v_entity_type <> NEW.entity_type THEN
        RAISE EXCEPTION 'Approval request entity type % does not match workflow entity type %', NEW.entity_type, v_entity_type;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.validate_approval_action()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_request_company UUID;
    v_request_status TEXT;
    v_current_step INTEGER;

    v_step_order INTEGER;
    v_approver_type TEXT;
    v_approver_user UUID;
    v_approver_role UUID;

    v_actor_authorized BOOLEAN := false;
BEGIN
    SELECT company_id, status, current_step_order
    INTO v_request_company, v_request_status, v_current_step
    FROM public.approval_requests WHERE id = NEW.approval_request_id;

    IF v_request_company IS NULL THEN
        RAISE EXCEPTION 'Approval request % does not exist', NEW.approval_request_id;
    END IF;

    IF v_request_status <> 'PENDING' THEN
        RAISE EXCEPTION 'Approval request % is no longer pending', NEW.approval_request_id;
    END IF;

    SELECT step_order, approver_type, approver_user_id, approver_role_id
    INTO v_step_order, v_approver_type, v_approver_user, v_approver_role
    FROM public.approval_workflow_steps WHERE id = NEW.workflow_step_id;

    IF v_step_order <> v_current_step THEN
        RAISE EXCEPTION 'Approval action must be performed on current workflow step %', v_current_step;
    END IF;

    IF NEW.actor_id IS NULL THEN
        RAISE EXCEPTION 'Approval action requires an actor';
    END IF;

    IF v_approver_type = 'USER' THEN
        v_actor_authorized := (NEW.actor_id = v_approver_user);
    ELSIF v_approver_type = 'ROLE' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = NEW.actor_id AND ur.role_id = v_approver_role
        ) INTO v_actor_authorized;
    END IF;

    IF NOT v_actor_authorized THEN
        RAISE EXCEPTION 'User % is not authorized to perform approval action on step %', NEW.actor_id, v_step_order;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.process_approval_action()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_next_step INTEGER;
BEGIN
    IF NEW.action = 'REJECTED' THEN
        UPDATE public.approval_requests
        SET status = 'REJECTED', rejected_at = now(), updated_at = now()
        WHERE id = NEW.approval_request_id;
        RETURN NEW;

    ELSIF NEW.action = 'CANCELLED' THEN
        UPDATE public.approval_requests
        SET status = 'CANCELLED', cancelled_at = now(), updated_at = now()
        WHERE id = NEW.approval_request_id;
        RETURN NEW;

    ELSIF NEW.action IN ('APPROVED', 'SKIPPED') THEN
        SELECT MIN(step_order) INTO v_next_step
        FROM public.approval_workflow_steps
        WHERE workflow_id = (SELECT workflow_id FROM public.approval_requests WHERE id = NEW.approval_request_id)
          AND step_order > (SELECT current_step_order FROM public.approval_requests WHERE id = NEW.approval_request_id);

        IF v_next_step IS NULL THEN
            UPDATE public.approval_requests
            SET status = 'APPROVED', completed_at = now(), updated_at = now()
            WHERE id = NEW.approval_request_id;
        ELSE
            UPDATE public.approval_requests
            SET current_step_order = v_next_step, updated_at = now()
            WHERE id = NEW.approval_request_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. AUDIT LOG EXPANSION
-- ============================================================================

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS entity_type TEXT,
    ADD COLUMN IF NOT EXISTS request_id UUID,
    ADD COLUMN IF NOT EXISTS correlation_id UUID,
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'APPLICATION',
    ADD COLUMN IF NOT EXISTS entity_table TEXT,
    ADD COLUMN IF NOT EXISTS entity_schema TEXT NOT NULL DEFAULT 'public',
    ADD COLUMN IF NOT EXISTS transaction_id BIGINT,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created ON public.audit_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON public.audit_logs (correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON public.audit_logs (request_id) WHERE request_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'Audit Integrity Violation: audit logs are append-only and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_prevent_locked_document_modification ON public.documents;
CREATE TRIGGER trg_prevent_locked_document_modification
    BEFORE UPDATE OR DELETE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_document_modification();

DROP TRIGGER IF EXISTS trg_sync_current_document_version ON public.document_versions;
DROP TRIGGER IF EXISTS trg_sync_current_document_version_before ON public.document_versions;
CREATE TRIGGER trg_sync_current_document_version_before
    BEFORE INSERT OR UPDATE ON public.document_versions
    FOR EACH ROW EXECUTE FUNCTION public.sync_current_document_version();

DROP TRIGGER IF EXISTS trg_sync_current_document_version_after ON public.document_versions;
CREATE TRIGGER trg_sync_current_document_version_after
    AFTER DELETE ON public.document_versions
    FOR EACH ROW EXECUTE FUNCTION public.sync_current_document_version();

DROP TRIGGER IF EXISTS trg_sync_document_header_version ON public.document_versions;
CREATE TRIGGER trg_sync_document_header_version
    AFTER INSERT OR UPDATE OR DELETE ON public.document_versions
    FOR EACH ROW EXECUTE FUNCTION public.sync_document_header_version();

DROP TRIGGER IF EXISTS trg_validate_document_link_company ON public.document_links;
CREATE TRIGGER trg_validate_document_link_company
    BEFORE INSERT OR UPDATE ON public.document_links
    FOR EACH ROW EXECUTE FUNCTION public.validate_document_company_consistency();

DROP TRIGGER IF EXISTS trg_validate_document_access_log_company ON public.document_access_logs;
CREATE TRIGGER trg_validate_document_access_log_company
    BEFORE INSERT OR UPDATE ON public.document_access_logs
    FOR EACH ROW EXECUTE FUNCTION public.validate_document_company_consistency();

DROP TRIGGER IF EXISTS trg_validate_document_access_rule_company ON public.document_access_rules;
CREATE TRIGGER trg_validate_document_access_rule_company
    BEFORE INSERT OR UPDATE ON public.document_access_rules
    FOR EACH ROW EXECUTE FUNCTION public.validate_document_company_consistency();

DROP TRIGGER IF EXISTS trg_approval_workflows_updated_at ON public.approval_workflows;
CREATE TRIGGER trg_approval_workflows_updated_at
    BEFORE UPDATE ON public.approval_workflows
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_validate_approval_request_consistency ON public.approval_requests;
CREATE TRIGGER trg_validate_approval_request_consistency
    BEFORE INSERT OR UPDATE ON public.approval_requests
    FOR EACH ROW EXECUTE FUNCTION public.validate_approval_request_consistency();

DROP TRIGGER IF EXISTS trg_approval_requests_updated_at ON public.approval_requests;
CREATE TRIGGER trg_approval_requests_updated_at
    BEFORE UPDATE ON public.approval_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_validate_approval_action ON public.approval_actions;
CREATE TRIGGER trg_validate_approval_action
    BEFORE INSERT ON public.approval_actions
    FOR EACH ROW EXECUTE FUNCTION public.validate_approval_action();

DROP TRIGGER IF EXISTS trg_process_approval_action ON public.approval_actions;
CREATE TRIGGER trg_process_approval_action
    AFTER INSERT ON public.approval_actions
    FOR EACH ROW EXECUTE FUNCTION public.process_approval_action();

DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_modification
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_company_status ON public.documents (company_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents (category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_current_version ON public.documents (current_version_id) WHERE current_version_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_document_versions_document ON public.document_versions (document_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_document_versions_current ON public.document_versions (document_id) WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_document_links_entity ON public.document_links (company_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_document ON public.document_access_logs (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_actor ON public.document_access_logs (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_access_rules_document ON public.document_access_rules (document_id);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_company_entity ON public.approval_workflows (company_id, entity_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_approval_workflow_steps_workflow ON public.approval_workflow_steps (workflow_id, step_order);
CREATE INDEX IF NOT EXISTS idx_approval_requests_company_status ON public.approval_requests (company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON public.approval_requests (company_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON public.approval_actions (approval_request_id, created_at);
CREATE INDEX IF NOT EXISTS idx_approval_actions_actor ON public.approval_actions (actor_id, created_at DESC);

-- ============================================================================
-- 8. FOREIGN KEYS ADDED AFTER TABLE CREATION
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_documents_category' AND conrelid = 'public.documents'::regclass
    ) THEN
        ALTER TABLE public.documents
            ADD CONSTRAINT fk_documents_category
            FOREIGN KEY (category_id)
            REFERENCES public.document_categories(id)
            ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_documents_current_version' AND conrelid = 'public.documents'::regclass
    ) THEN
        ALTER TABLE public.documents
            ADD CONSTRAINT fk_documents_current_version
            FOREIGN KEY (current_version_id)
            REFERENCES public.document_versions(id)
            ON DELETE SET NULL;
    END IF;
END;
$$;

-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_rules ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_categories_policy ON public.document_categories;
CREATE POLICY document_categories_policy ON public.document_categories
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS document_versions_policy ON public.document_versions;
CREATE POLICY document_versions_policy ON public.document_versions
    FOR ALL TO authenticated
    USING (document_id IN (SELECT d.id FROM public.documents d WHERE d.company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (document_id IN (SELECT d.id FROM public.documents d WHERE d.company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS document_links_policy ON public.document_links;
CREATE POLICY document_links_policy ON public.document_links
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS document_access_logs_select ON public.document_access_logs;
CREATE POLICY document_access_logs_select ON public.document_access_logs
    FOR SELECT TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS document_access_logs_insert ON public.document_access_logs;
CREATE POLICY document_access_logs_insert ON public.document_access_logs
    FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS document_access_rules_policy ON public.document_access_rules;
CREATE POLICY document_access_rules_policy ON public.document_access_rules
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS approval_workflows_policy ON public.approval_workflows;
CREATE POLICY approval_workflows_policy ON public.approval_workflows
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS approval_workflow_steps_policy ON public.approval_workflow_steps;
CREATE POLICY approval_workflow_steps_policy ON public.approval_workflow_steps
    FOR ALL TO authenticated
    USING (workflow_id IN (SELECT id FROM public.approval_workflows WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (workflow_id IN (SELECT id FROM public.approval_workflows WHERE company_id IN (SELECT public.auth_user_company_ids())));

DROP POLICY IF EXISTS approval_requests_policy ON public.approval_requests;
CREATE POLICY approval_requests_policy ON public.approval_requests
    FOR ALL TO authenticated
    USING (company_id IN (SELECT public.auth_user_company_ids()))
    WITH CHECK (company_id IN (SELECT public.auth_user_company_ids()));

DROP POLICY IF EXISTS approval_actions_policy ON public.approval_actions;
CREATE POLICY approval_actions_policy ON public.approval_actions
    FOR ALL TO authenticated
    USING (approval_request_id IN (SELECT id FROM public.approval_requests WHERE company_id IN (SELECT public.auth_user_company_ids())))
    WITH CHECK (approval_request_id IN (SELECT id FROM public.approval_requests WHERE company_id IN (SELECT public.auth_user_company_ids())));

-- ============================================================================
-- 10. SECURITY HARDENING
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.set_updated_at_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_locked_document_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_document_company_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_current_document_version() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_approval_request_consistency() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_approval_action() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_approval_action() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_audit_log_modification() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 11. FINAL DATA INTEGRITY CHECKS
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS ux_document_versions_one_current
ON public.document_versions (document_id)
WHERE is_current = true;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_documents_file_size' AND conrelid = 'public.documents'::regclass
    ) THEN
        ALTER TABLE public.documents
            ADD CONSTRAINT chk_documents_file_size
            CHECK (file_size IS NULL OR file_size >= 0);
    END IF;
END;
$$;

COMMIT;
