-- Deshal ERP — Migration 0037: Add First Login Setup & Company Onboarding Persistence
-- Purpose: Add is_setup_completed & setup_completed_at to companies table,
--          and is_first_login to profiles table.

BEGIN;

-- Add setup completion status columns to companies table if not exist
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS is_setup_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;

-- Add first login flag to profiles table if not exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- RPC function to atomically complete setup for a company and user profile
CREATE OR REPLACE FUNCTION public.mark_setup_completed(p_company_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.companies
  SET is_setup_completed = true,
      setup_completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_company_id;

  IF p_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET is_first_login = false,
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.mark_setup_completed(UUID, UUID) TO PUBLIC, anon, authenticated, service_role;

COMMIT;
