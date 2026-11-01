-- Phase 4 Migration: Site Visit Reminder Tracking Flags
-- Idempotent addition of reminder notification dispatch tracking columns

ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS reminder_sent_24h BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_2h BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for cron job performance when searching upcoming visits requiring reminder
CREATE INDEX IF NOT EXISTS idx_visits_upcoming_reminders 
ON public.visits(scheduled_at_utc, status, reminder_sent_24h, reminder_sent_2h);
