/**
 * Add demo column to sites table
 * Run this in Supabase SQL Editor
 */

-- Add demo column to sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS demo BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN sites.demo IS 'True for demo/example sites showcased on homepage';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'sites' AND column_name = 'demo';
