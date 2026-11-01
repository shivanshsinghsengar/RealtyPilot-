-- ==============================================================================
-- RealtyPilot Phase 1 Seed Data
-- Location: Bhopal, Madhya Pradesh | Real Estate CRM & AI Sales Engine
-- 2 Projects, 10 Plot Inventory Units, 10 Realistic Leads with Consents & Visits
-- ==============================================================================

-- 1. SEED PROJECTS (Bhopal RERA Registered Projects)
INSERT INTO public.projects (id, name, location_area, city, rera_number, possession_date, min_budget, max_budget, description)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'Narmada Greens',
    'Kolar Road',
    'Bhopal',
    'P-BPL-22-3841',
    '2026-12-31',
    2800000,
    5500000,
    'Premium gated plotted development on Kolar Road with 40ft wide roads, underground electricity, club house, and 24x7 security.'
  ),
  (
    'a2000000-0000-0000-0000-000000000002',
    'Bhojpal Enclave',
    'Hoshangabad Road',
    'Bhopal',
    'P-BPL-23-4190',
    '2027-06-30',
    4200000,
    8500000,
    'Luxury plotted campus & modern 3BHK/4BHK duplex community near Misrod, Hoshangabad Road with landscaped garden and RERA approved infrastructure.'
  )
ON CONFLICT (rera_number) DO NOTHING;

-- 2. SEED PLOTS (Residential plots and duplex plots)
INSERT INTO public.plots (id, project_id, plot_number, size_sqft, dimension, facing, price_total, status)
VALUES
  -- Narmada Greens (Kolar Road) Plots
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'NG-101', 1000, '25x40', 'East', 2800000, 'available'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'NG-102', 1200, '30x40', 'North', 3360000, 'available'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'NG-103', 1500, '30x50', 'East', 4200000, 'booked'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'NG-104', 1800, '36x50', 'West', 5040000, 'available'),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'NG-105', 2000, '40x50', 'North-East (Corner)', 5800000, 'sold'),

  -- Bhojpal Enclave (Hoshangabad Road) Plots
  ('b2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'BE-A01', 1250, '25x50', 'East', 4375000, 'available'),
  ('b2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'BE-A02', 1500, '30x50', 'North', 5250000, 'available'),
  ('b2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'BE-B05', 1800, '36x50', 'East', 6300000, 'available'),
  ('b2000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 'BE-B06', 2100, '42x50', 'North-East', 7350000, 'booked'),
  ('b2000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 'BE-C10', 2400, '40x60', 'West', 8400000, 'available')
ON CONFLICT (project_id, plot_number) DO NOTHING;

-- 3. SEED LEADS (10 Fake Realistic Bhopal Leads)
INSERT INTO public.leads (
  id, full_name, phone, email, city, budget_min, budget_max, preferred_size_sqft,
  timeline_months, loan_needed, purpose, stage, score, source, opted_out, needs_human_followup
)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'Rohit Sharma',
    '+919826011111',
    'rohit.sharma@example.com',
    'Bhopal',
    2500000,
    3500000,
    1000,
    1,
    true,
    'end_use',
    'qualified',
    75,
    'website_form',
    false,
    false
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'Priya Verma',
    '+919826022222',
    'priya.verma@example.com',
    'Bhopal',
    3500000,
    5000000,
    1500,
    3,
    false,
    'end_use',
    'visit_scheduled',
    85,
    'meta_ad',
    false,
    false
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'Amit Tiwari',
    '+919826033333',
    'amit.tiwari@example.com',
    'Bhopal',
    4000000,
    6000000,
    1800,
    6,
    true,
    'investment',
    'contacted',
    50,
    'google_places',
    false,
    false
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'Neha Saxena',
    '+919826044444',
    'neha.saxena@example.com',
    'Bhopal',
    6000000,
    8500000,
    2400,
    2,
    false,
    'end_use',
    'visit_completed',
    90,
    'referral',
    false,
    false
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'Vikram Singh Patel',
    '+919826055555',
    'vikram.patel@example.com',
    'Bhopal',
    2800000,
    4000000,
    1200,
    1,
    true,
    'end_use',
    'negotiation',
    95,
    'website_form',
    false,
    false
  ),
  (
    'c1000000-0000-0000-0000-000000000006',
    'Sunita Chouhan',
    '+919826066666',
    'sunita.c@example.com',
    'Bhopal',
    3000000,
    4500000,
    1200,
    12,
    false,
    'investment',
    'new',
    30,
    'rera_public',
    false,
    false
  ),
  (
    'c1000000-0000-0000-0000-000000000007',
    'Rajesh Mishra',
    '+919826077777',
    'rajesh.mishra@example.com',
    'Bhopal',
    7000000,
    9000000,
    2000,
    1,
    false,
    'end_use',
    'won',
    100,
    'direct_call',
    false,
    false
  ),
  (
    'c1000000-0000-0000-0000-000000000008',
    'Deepak Malviya',
    '+919826088888',
    'deepak.m@example.com',
    'Bhopal',
    2000000,
    2500000,
    800,
    null,
    true,
    'end_use',
    'lost',
    15,
    'meta_ad',
    false,
    false
  ),
  (
    'c1000000-0000-0000-0000-000000000009',
    'Kavita Jain (Opted Out)',
    '+919826099999',
    'kavita.jain@example.com',
    'Bhopal',
    3500000,
    5000000,
    1500,
    null,
    false,
    'end_use',
    'contacted',
    10,
    'website_form',
    true, -- Opted out per DPDP Act
    false
  ),
  (
    'c1000000-0000-0000-0000-000000000010',
    'Suresh Yadav (Special Request)',
    '+919826012345',
    'suresh.yadav@example.com',
    'Bhopal',
    5000000,
    7500000,
    2000,
    2,
    true,
    'end_use',
    'qualified',
    70,
    'website_form',
    false,
    true -- Needs human follow-up flag triggered
  )
ON CONFLICT (phone) DO NOTHING;

-- 4. SEED CONSENTS (DPDP Act Compliance Records)
INSERT INTO public.consents (id, lead_id, status, channel, consent_text, recorded_ip)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'granted', 'whatsapp', 'Opted-in via website enquiry form checkbox for WhatsApp updates.', '103.24.120.15'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'granted', 'whatsapp', 'Consent granted on Meta Lead Ad form.', '103.24.120.18'),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'granted', 'whatsapp', 'Verified opt-in via Google listing inquiry.', '103.24.120.22'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'granted', 'whatsapp', 'Direct referral consent recorded in office.', '103.24.120.25'),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 'granted', 'whatsapp', 'Opted-in via website form.', '103.24.120.30'),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 'pending', 'whatsapp', 'Lead discovered from public RERA filing; awaiting initial opt-in reply.', '103.24.120.32'),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000007', 'granted', 'call', 'Telephonic consent verified during office visit.', '103.24.120.40'),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000008', 'granted', 'whatsapp', 'Meta Ad click-through consent.', '103.24.120.45'),
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000009', 'revoked', 'whatsapp', 'Lead replied STOP on WhatsApp. Opt-out processed immediately.', '103.24.120.50'),
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000010', 'granted', 'whatsapp', 'Website form consent granted.', '103.24.120.55')
ON CONFLICT (id) DO NOTHING;

-- 5. SEED VISITS (Site Visits Scheduled in Bhopal)
INSERT INTO public.visits (id, lead_id, project_id, scheduled_at_utc, status, notes)
VALUES
  (
    'e1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    (timezone('utc'::text, now()) + interval '2 days'),
    'confirmed',
    'Wants to inspect Plot NG-102 (1200 sqft) and NG-104 on Kolar Road with family.'
  ),
  (
    'e1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000004',
    'a2000000-0000-0000-0000-000000000002',
    (timezone('utc'::text, now()) - interval '3 days'),
    'completed',
    'Inspected Bhojpal Enclave BE-C10 (2400 sqft). Very interested, reviewing bank loan options.'
  )
ON CONFLICT (id) DO NOTHING;

-- 6. SEED ACTIVITIES (CRM Activity History)
INSERT INTO public.activities (id, lead_id, activity_type, description, metadata)
VALUES
  (
    'f1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'lead_created',
    'Lead submitted enquiry form for Narmada Greens (Kolar Road).',
    '{"source": "website_form", "city": "Bhopal"}'::jsonb
  ),
  (
    'f1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'visit_booked',
    'Site visit booked for Narmada Greens via WhatsApp AI agent.',
    '{"project": "Narmada Greens", "channel": "whatsapp"}'::jsonb
  ),
  (
    'f1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000009',
    'opt_out_received',
    'Lead texted STOP. In accordance with DPDP compliance, all outbound automated messaging disabled.',
    '{"opted_out": true, "channel": "whatsapp"}'::jsonb
  ),
  (
    'f1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000010',
    'human_handoff_flagged',
    'Lead asked for custom commercial plot subdivision. AI flagged: "Main team se confirm karke batata hu".',
    '{"flag": "needs_human_followup"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- 7. SEED MESSAGES (WhatsApp Chat Thread Samples)
INSERT INTO public.messages (id, lead_id, direction, sender_type, whatsapp_message_id, body, status)
VALUES
  (
    'a0000001-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    'inbound',
    'lead',
    'wamid.HBgMOTgyNjAyMjIyMjIVAgASGBIw',
    'Namaste, mujhe Kolar road par 1200 ya 1500 sqft ka plot dekhna hai. Kya rate chal raha hai?',
    'delivered'
  ),
  (
    'a0000001-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'outbound',
    'ai_system',
    'wamid.HBgMOTgyNjAyMjIyMjIVAgASGBIx',
    'Namaste Priya ji! Narmada Greens (Kolar Road, RERA: P-BPL-22-3841) mein 1200 sqft ka plot ₹33.60 Lakh aur 1500 sqft ka plot ₹42 Lakh mein available hai. Kya aap is weekend site visit karna chahengi?',
    'read'
  ),
  (
    'a0000001-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000009',
    'inbound',
    'lead',
    'wamid.HBgMOTgyNjA5OTk5OVIVAgASGBIy',
    'STOP',
    'delivered'
  ),
  (
    'a0000001-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000009',
    'outbound',
    'ai_system',
    'wamid.HBgMOTgyNjA5OTk5OVIVAgASGBIz',
    'Aapko hamari taraf se aur koi messages nahi bheeje jayenge. Thank you.',
    'delivered'
  )
ON CONFLICT (id) DO NOTHING;
