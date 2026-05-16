-- Add missing columns to sites table for demo generation
ALTER TABLE sites ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Add published column to pages table if it doesn't exist
ALTER TABLE pages ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

-- Add comments
COMMENT ON COLUMN sites.published IS 'Whether the site has been published to a subdomain';
COMMENT ON COLUMN sites.published_at IS 'Timestamp when the site was first published';
COMMENT ON COLUMN sites.tagline IS 'Business tagline or motto';
COMMENT ON COLUMN pages.published IS 'Whether this page is published and visible';
