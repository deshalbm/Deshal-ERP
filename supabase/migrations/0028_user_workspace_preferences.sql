-- Migration 0028: User Workspace Preferences Schema
-- Purpose: Persist user workspace quick access launchers, action buttons, and report sections in PostgreSQL

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_workspace_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_email TEXT,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_user_workspace_preferences_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_workspace_prefs_user_id ON public.user_workspace_preferences(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_workspace_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated and anon access to user workspace preferences"
ON public.user_workspace_preferences
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

COMMIT;
