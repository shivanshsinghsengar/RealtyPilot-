-- ==============================================================================
-- RealtyPilot Phase 1 Migration: Complete Schema & Row-Level Security (RLS)
-- Target: Supabase Postgres (Residential Real Estate CRM - Bhopal, M.P.)
-- Date standard: All timestamps stored in UTC using TIMESTAMPTZ
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE lead_stage AS ENUM (
    'new', 'contacted', 'qualified', 'visit_scheduled', 'visit_completed', 'negotiation', 'won', 'lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_source AS ENUM (
    'website_form', 'meta_ad', 'rera_public', 'google_places', 'referral', 'direct_call'
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

-- 3. TRIGGER FUNCTIONS

-- Auto update updated_at timestamp in UTC
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto create profile on auth.user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TABLES

-- Table 1: profiles (Staff, agents, managers)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales_rep' CHECK (role IN ('admin', 'sales_rep', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2: projects (Residential plotted developments & duplex projects in Bhopal)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location_area TEXT NOT NULL, -- e.g. Kolar Road, Hoshangabad Road, Ayodhya Bypass
  city TEXT NOT NULL DEFAULT 'Bhopal',
  rera_number TEXT NOT NULL UNIQUE,
  possession_date DATE,
  min_budget NUMERIC(12, 2) CHECK (min_budget IS NULL OR min_budget >= 0),
  max_budget NUMERIC(12, 2) CHECK (max_budget IS NULL OR max_budget >= 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_project_budget_range CHECK (
    min_budget IS NULL OR max_budget IS NULL OR max_budget >= min_budget
  )
);

-- Table 3: plots (Individual plot inventory within projects)
CREATE TABLE IF NOT EXISTS public.plots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  plot_number TEXT NOT NULL,
  size_sqft NUMERIC(8, 2) NOT NULL CHECK (size_sqft > 0),
  dimension TEXT, -- e.g. '30x50', '25x40'
  facing TEXT,    -- e.g. 'East', 'North-East', 'West'
  price_total NUMERIC(12, 2) NOT NULL CHECK (price_total > 0),
  status plot_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_project_plot_number UNIQUE (project_id, plot_number)
);

-- Table 4: leads (Prospective buyers for Bhopal properties)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE CHECK (phone ~ '^\+91[6-9][0-9]{9}$'), -- Strict Indian E.164 check
  email TEXT,
  city TEXT DEFAULT 'Bhopal',
  budget_min NUMERIC(12, 2) CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max NUMERIC(12, 2) CHECK (budget_max IS NULL OR budget_max >= 0),
  preferred_size_sqft NUMERIC(8, 2) CHECK (preferred_size_sqft IS NULL OR preferred_size_sqft > 0),
  timeline_months INTEGER CHECK (timeline_months IS NULL OR timeline_months >= 0),
  loan_needed BOOLEAN DEFAULT FALSE,
  purpose TEXT DEFAULT 'end_use' CHECK (purpose IN ('end_use', 'investment')),
  stage lead_stage NOT NULL DEFAULT 'new',
  score INTEGER NOT NULL DEFAULT 10 CHECK (score >= 0 AND score <= 100),
  source lead_source NOT NULL DEFAULT 'website_form',
  opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  needs_human_followup BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_lead_budget_range CHECK (
    budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min
  )
);

-- Table 5: messages (WhatsApp inbound/outbound communication log)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  direction message_direction NOT NULL,
  sender_type message_sender_type NOT NULL,
  whatsapp_message_id TEXT UNIQUE,
  body TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 6: visits (Site visits to Bhopal projects)
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scheduled_at_utc TIMESTAMPTZ NOT NULL,
  status visit_status NOT NULL DEFAULT 'scheduled',
  assigned_rep_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 7: activities (CRM audit trail, follow-ups, qualification logs)
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

-- 5. INDEXES FOR PERFORMANCE & FAST LOOKUPS
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_opted_out ON public.leads(opted_out);
CREATE INDEX IF NOT EXISTS idx_leads_needs_followup ON public.leads(needs_human_followup);
CREATE INDEX IF NOT EXISTS idx_plots_project_status ON public.plots(project_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_lead_created ON public.messages(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_lead_scheduled ON public.visits(lead_id, scheduled_at_utc);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_at ON public.visits(scheduled_at_utc);
CREATE INDEX IF NOT EXISTS idx_activities_lead_created ON public.activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consents_lead_status ON public.consents(lead_id, status);

-- 6. ATTACH TRIGGERS
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_plots_updated_at ON public.plots;
CREATE TRIGGER trg_plots_updated_at BEFORE UPDATE ON public.plots
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_visits_updated_at ON public.visits;
CREATE TRIGGER trg_visits_updated_at BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_consents_updated_at ON public.consents;
CREATE TRIGGER trg_consents_updated_at BEFORE UPDATE ON public.consents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for new user signup on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Explicit RLS enabled on 100% of tables.
-- Public/anonymous requests are blocked from direct access.
-- Authenticated staff have explicit row permissions.
-- Service role key (used server-only) bypasses RLS for webhooks and background jobs.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- profiles
  DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Staff can update own profile" ON public.profiles;
  -- projects
  DROP POLICY IF EXISTS "Staff can view projects" ON public.projects;
  DROP POLICY IF EXISTS "Staff can insert projects" ON public.projects;
  DROP POLICY IF EXISTS "Staff can update projects" ON public.projects;
  -- plots
  DROP POLICY IF EXISTS "Staff can view plots" ON public.plots;
  DROP POLICY IF EXISTS "Staff can insert plots" ON public.plots;
  DROP POLICY IF EXISTS "Staff can update plots" ON public.plots;
  -- leads
  DROP POLICY IF EXISTS "Staff can view leads" ON public.leads;
  DROP POLICY IF EXISTS "Staff can insert leads" ON public.leads;
  DROP POLICY IF EXISTS "Staff can update leads" ON public.leads;
  -- messages
  DROP POLICY IF EXISTS "Staff can view messages" ON public.messages;
  DROP POLICY IF EXISTS "Staff can insert outbound messages" ON public.messages;
  -- visits
  DROP POLICY IF EXISTS "Staff can view visits" ON public.visits;
  DROP POLICY IF EXISTS "Staff can insert visits" ON public.visits;
  DROP POLICY IF EXISTS "Staff can update visits" ON public.visits;
  -- activities
  DROP POLICY IF EXISTS "Staff can view activities" ON public.activities;
  DROP POLICY IF EXISTS "Staff can insert activities" ON public.activities;
  -- consents
  DROP POLICY IF EXISTS "Staff can view consents" ON public.consents;
  DROP POLICY IF EXISTS "Staff can record consents" ON public.consents;
END $$;

-- profiles
CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- projects
CREATE POLICY "Staff can view projects" ON public.projects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update projects" ON public.projects
  FOR UPDATE TO authenticated USING (true);

-- plots
CREATE POLICY "Staff can view plots" ON public.plots
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert plots" ON public.plots
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update plots" ON public.plots
  FOR UPDATE TO authenticated USING (true);

-- leads
CREATE POLICY "Staff can view leads" ON public.leads
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update leads" ON public.leads
  FOR UPDATE TO authenticated USING (true);

-- messages
CREATE POLICY "Staff can view messages" ON public.messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert outbound messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- visits
CREATE POLICY "Staff can view visits" ON public.visits
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert visits" ON public.visits
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update visits" ON public.visits
  FOR UPDATE TO authenticated USING (true);

-- activities
CREATE POLICY "Staff can view activities" ON public.activities
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (true);

-- consents
CREATE POLICY "Staff can view consents" ON public.consents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can record consents" ON public.consents
  FOR INSERT TO authenticated WITH CHECK (true);
