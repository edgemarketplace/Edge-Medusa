-- Add published column to sites table for demo sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN sites.published IS 'Whether the site has been published to a subdomain';
