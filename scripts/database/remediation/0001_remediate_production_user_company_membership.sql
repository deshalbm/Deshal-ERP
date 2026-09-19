-- ============================================================================
-- DESHAL ERP — PRODUCTION DATA-ONLY REMEDIATION SCRIPT 0001 (PHASE 36F AUDITED)
-- Purpose: Provision active company membership for production user 61738273-e738-4f53-8718-85811a174281
-- Target Company: 00000000-0000-0000-0000-000000000001
-- Security Governance: DATA ONLY — NO DDL (Zero schema changes, zero policy changes)
--
-- OPERATOR NOTICE:
--   - NOT AUTOMATICALLY EXECUTED BY CI/CD OR DEPLOYMENT PIPELINES.
--   - REQUIRES EXPLICIT MANUAL REVIEW & EXECUTION BY A PRODUCTION DATABASE OPERATOR.
--   - STRICT FAIL-SAFE: ABORTS IF TARGET ADMIN ROLE IS MISSING (ZERO ARBITRARY FALLBACKS).
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_user_id UUID := '61738273-e738-4f53-8718-85811a174281';
    v_company_id UUID := '00000000-0000-0000-0000-000000000001';
    v_role_id UUID;
    v_user_exists BOOLEAN;
    v_company_exists BOOLEAN;
    v_membership_exists BOOLEAN;
BEGIN
    -- 1. Precondition Verification: Check User Existence in profiles
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = v_user_id
    ) INTO v_user_exists;

    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'Operator Error: Target user profile % does not exist in public.profiles.', v_user_id;
    END IF;

    -- 2. Precondition Verification: Check Company Existence in companies
    SELECT EXISTS (
        SELECT 1 FROM public.companies WHERE id = v_company_id
    ) INTO v_company_exists;

    IF NOT v_company_exists THEN
        RAISE EXCEPTION 'Operator Error: Target company % does not exist in public.companies.', v_company_id;
    END IF;

    -- 3. Precondition Verification: Check Existing Active Membership
    SELECT EXISTS (
        SELECT 1 FROM public.user_company_memberships 
        WHERE user_id = v_user_id AND company_id = v_company_id AND is_active = true
    ) INTO v_membership_exists;

    IF v_membership_exists THEN
        RAISE NOTICE 'Operator Info: Active membership already exists for user % in company %. No action needed.', v_user_id, v_company_id;
        RETURN;
    END IF;

    -- 4. Resolve System Admin Role for Company (Strict Check — No arbitrary fallback)
    SELECT id INTO v_role_id
    FROM public.roles
    WHERE company_id = v_company_id AND code = 'ADMIN'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Operator Error: System ADMIN role (code = ADMIN) does not exist for company %. Remediation aborted.', v_company_id;
    END IF;

    -- 5. Idempotent Data Insertion
    INSERT INTO public.user_company_memberships (
        id,
        user_id,
        company_id,
        role_id,
        is_active,
        created_at
    )
    VALUES (
        gen_random_uuid(),
        v_user_id,
        v_company_id,
        v_role_id,
        true,
        now()
    )
    ON CONFLICT (user_id, company_id) DO UPDATE
    SET role_id = v_role_id,
        is_active = true,
        updated_at = now();

    RAISE NOTICE 'Operator Success: Remediated active ADMIN membership for user % in company % (role_id %).', v_user_id, v_company_id, v_role_id;
END;
$$;

COMMIT;
