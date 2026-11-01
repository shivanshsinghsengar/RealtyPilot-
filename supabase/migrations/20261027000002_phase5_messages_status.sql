-- Phase 5 Migration: Message Status Tracking & Performance Indexes
-- Adds message delivery status tracking for Meta WhatsApp Cloud API delivery receipts

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent'
CHECK (status IN ('sent', 'delivered', 'read', 'failed'));

-- Composite index for fast conversation thread loading in staff inbox
CREATE INDEX IF NOT EXISTS idx_messages_lead_thread 
ON public.messages(lead_id, created_at ASC);

-- Index for delivery receipt lookups by Meta's wamid
CREATE INDEX IF NOT EXISTS idx_messages_wamid 
ON public.messages(whatsapp_message_id);
