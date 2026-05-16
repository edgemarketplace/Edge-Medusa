-- Migration v5: Printify Integration Support
-- Add Printify configuration columns to sites table
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS printify_api_key TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS printify_shop_id TEXT;

-- Add metadata column to inventory_items to store external IDs (Printify, etc.)
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;
