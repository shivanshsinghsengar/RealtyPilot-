-- Add new lead sources for automated discovery
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'osm_discovery';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'web_discovery';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'justdial';
