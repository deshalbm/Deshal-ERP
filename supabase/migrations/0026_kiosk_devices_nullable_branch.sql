-- ============================================================================
-- Migration 0026: Allow Nullable branch_id in public.kiosk_devices
-- ============================================================================

BEGIN;

ALTER TABLE public.kiosk_devices ALTER COLUMN branch_id DROP NOT NULL;

COMMIT;
