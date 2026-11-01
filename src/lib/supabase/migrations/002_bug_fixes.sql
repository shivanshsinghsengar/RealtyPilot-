-- ==============================================================================
-- RealtyPilot Migration 002: Bug Fixes
-- Run this on an EXISTING database (uses ALTER ... IF NOT EXISTS)
-- Safe to run multiple times (idempotent).
-- ==============================================================================

-- -----------------------------------------------------------------------
-- Fix 1: profiles auto-create trigger on Supabase Auth signup
-- SECURITY DEFINER + explicit search_path prevents privilege escalation.
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales_rep')
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotent: skip if profile already exists
  RETURN NEW;
END;
$$;

-- Drop trigger first (so re-running this migration is safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------
-- Fix 2: Add walk_in to lead_source enum
-- ALTER TYPE ADD VALUE is non-transactional in Postgres, so it cannot
-- run inside a transaction block. Use a DO block with a guard check.
-- -----------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'walk_in'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'lead_source')
  ) THEN
    ALTER TYPE public.lead_source ADD VALUE 'walk_in';
  END IF;
END $$;

-- -----------------------------------------------------------------------
-- Fix 3: Add reminder columns to visits table
-- -----------------------------------------------------------------------

ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS reminder_sent_24h BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_sent_2h  BOOLEAN NOT NULL DEFAULT FALSE;

-- -----------------------------------------------------------------------
-- Fix 4: Add status column to messages table
-- -----------------------------------------------------------------------

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'delivered', 'read', 'failed'));

-- -----------------------------------------------------------------------
-- Summary of changes applied:
--   1. handle_new_user() trigger → auto-creates profiles row on signup
--   2. lead_source enum → added 'walk_in' value
--   3. visits → reminder_sent_24h BOOLEAN DEFAULT FALSE
--              reminder_sent_2h  BOOLEAN DEFAULT FALSE
--   4. messages → status TEXT DEFAULT 'sent' CHECK (sent|delivered|read|failed)
-- ==============================================================================
