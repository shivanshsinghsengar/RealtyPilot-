-- Delete all seed/mock data from production database

-- Delete in reverse order of dependencies

-- 1. Delete activities (references leads)
DELETE FROM activities WHERE lead_id IN (
  SELECT id FROM leads WHERE source IN ('website_form', 'meta_ad', 'referral', 'walk_in', 'direct_call')
);

-- 2. Delete consents (references leads)
DELETE FROM consents WHERE lead_id IN (
  SELECT id FROM leads WHERE source IN ('website_form', 'meta_ad', 'referral', 'walk_in', 'direct_call')
);

-- 3. Delete messages (references leads)
DELETE FROM messages WHERE lead_id IN (
  SELECT id FROM leads WHERE source IN ('website_form', 'meta_ad', 'referral', 'walk_in', 'direct_call')
);

-- 4. Delete visits (references leads and projects)
DELETE FROM visits WHERE lead_id IN (
  SELECT id FROM leads WHERE source IN ('website_form', 'meta_ad', 'referral', 'walk_in', 'direct_call')
);

-- 5. Delete all seed leads
DELETE FROM leads WHERE source IN ('website_form', 'meta_ad', 'referral', 'walk_in', 'direct_call');

-- 6. Delete seed projects
DELETE FROM projects WHERE name IN ('Narmada Greens', 'Bhojpal Enclave');

-- Verify deletion
SELECT 'Leads remaining: ' || COUNT(*) FROM leads;
SELECT 'Projects remaining: ' || COUNT(*) FROM projects;
SELECT 'Visits remaining: ' || COUNT(*) FROM visits;
SELECT 'Messages remaining: ' || COUNT(*) FROM messages;
SELECT 'Activities remaining: ' || COUNT(*) FROM activities;
