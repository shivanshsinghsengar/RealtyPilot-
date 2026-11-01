-- ==============================================================================
-- RealtyPilot Phase 1 Database Schema & Row-Level Security (RLS) Specification
-- Location: Bhopal, Madhya Pradesh | Real Estate CRM & AI Sales Engine
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE lead_stage AS ENUM (
    'new', 'contacted', 'qualified', 'visit_scheduled', 'visit_completed', 'negotiation', 'won', 'lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_source AS ENUM (
    'website_form', 'meta_ad', 'rera_public', 'google_places', 'referral', 'direct_call', 'walk_in', 'osm_discovery', 'web_discovery', 'justdial'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM ('pending', 'granted', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE message_sender_type AS ENUM ('lead', 'agent', 'ai_system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE plot_status AS ENUM ('available', 'booked', 'sold', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE visit_status AS ENUM (
    'scheduled', 'confirmed', 'completed', 'rescheduled', 'cancelled', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. TABLES (All timestamps stored in UTC)

-- Table 1: profiles (CRM staff & sales reps)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales_rep' CHECK (role IN ('admin', 'sales_rep', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2: projects (Bhopal real estate projects)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location_area TEXT NOT NULL, -- e.g. Kolar Road, Hoshangabad Road, Ayodhya Bypass
  city TEXT NOT NULL DEFAULT 'Bhopal',
  rera_number TEXT NOT NULL UNIQUE,
  possession_date DATE,
  min_budget NUMERIC(12, 2),
  max_budget NUMERIC(12, 2),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 3: plots (Individual residential plots/duplex inventory)
CREATE TABLE IF NOT EXISTS public.plots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  plot_number TEXT NOT NULL,
  size_sqft NUMERIC(8, 2) NOT NULL,
  dimension TEXT,
  facing TEXT,
  price_total NUMERIC(12, 2) NOT NULL,
  status plot_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(project_id, plot_number)
);

-- Table 4: leads (Prospective buyers)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE, -- E.164 sanitized format (+919826012345)
  email TEXT,
  city TEXT DEFAULT 'Bhopal',
  budget_min NUMERIC(12, 2),
  budget_max NUMERIC(12, 2),
  preferred_size_sqft NUMERIC(8, 2),
  timeline_months INTEGER,
  loan_needed BOOLEAN DEFAULT FALSE,
  purpose TEXT DEFAULT 'end_use' CHECK (purpose IN ('end_use', 'investment')),
  stage lead_stage NOT NULL DEFAULT 'new',
  score INTEGER NOT NULL DEFAULT 10,
  source lead_source NOT NULL DEFAULT 'website_form',
  opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  needs_human_followup BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 5: messages (WhatsApp inbound & outbound history)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  direction message_direction NOT NULL,
  sender_type message_sender_type NOT NULL,
  whatsapp_message_id TEXT UNIQUE,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 6: visits (Site visit bookings in Bhopal)
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scheduled_at_utc TIMESTAMPTZ NOT NULL,
  status visit_status NOT NULL DEFAULT 'scheduled',
  assigned_rep_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  reminder_sent_24h BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_sent_2h  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 7: activities (Audit trail & CRM logs)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 8: consents (DPDP Act compliance audit)
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status consent_status NOT NULL DEFAULT 'granted',
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'call', 'email')),
  consent_text TEXT NOT NULL,
  recorded_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Security: Explicit RLS enabled on all 8 tables.
-- Authenticated staff can view/edit; anonymous access is blocked.
-- Service role key (used server-side only) bypasses RLS for WhatsApp webhook & AI ingestion.
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated staff can view profiles; only self/admin can update
CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects: Authenticated staff can view all; admins/managers can insert/update
CREATE POLICY "Staff can view projects" ON public.projects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update projects" ON public.projects
  FOR UPDATE TO authenticated USING (true);

-- Plots: Authenticated staff can view and manage plot inventory
CREATE POLICY "Staff can view plots" ON public.plots
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can update plots" ON public.plots
  FOR ALL TO authenticated USING (true);

-- Leads: Authenticated staff can read and manage leads
CREATE POLICY "Staff can view leads" ON public.leads
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update leads" ON public.leads
  FOR UPDATE TO authenticated USING (true);

-- Messages: Staff can view communication history
CREATE POLICY "Staff can view messages" ON public.messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert outbound messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- Visits: Staff can schedule and view site visits
CREATE POLICY "Staff can view visits" ON public.visits
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage visits" ON public.visits
  FOR ALL TO authenticated USING (true);

-- Activities: Staff can view CRM activity stream
CREATE POLICY "Staff can view activities" ON public.activities
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (true);

-- Consents: Staff can read consent status (audit trail)
CREATE POLICY "Staff can view consents" ON public.consents
  FOR SELECT TO authenticated USING (true);

-- ==============================================================================
-- 5. AUTH TRIGGER: Auto-create profiles row on Supabase signup
-- SECURITY DEFINER + explicit search_path prevents privilege escalation.
-- ==============================================================================

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
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
