-- Inventory Schema Migration
-- Run this in Supabase SQL Editor
-- Fixes missing columns that the code uses but the base schema doesn't include

-- 1. Add enabled column (products can be draft/disabled)
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- 2. Add variants JSONB (size, color, etc.)
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT NULL;

-- 3. Add stock column (null = unlimited/backorder)
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT NULL;

-- 4. Add SKU for inventory management
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT NULL;

-- 5. Add tax_rate per-item override
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT NULL;

-- 6. Add shipping_class (standard, express, digital, heavy)
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS shipping_class TEXT DEFAULT 'standard';

-- 7. Add weight for Shippo label generation
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS weight NUMERIC(8,2) DEFAULT NULL;

-- 8. Add metadata for Printify/external integrations
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- 9. Ensure all existing rows have enabled = true
UPDATE public.inventory_items SET enabled = true WHERE enabled IS NULL;

-- 10. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_enabled
  ON public.inventory_items(site_id, enabled);

CREATE INDEX IF NOT EXISTS idx_inventory_category
  ON public.inventory_items(site_id, category);

-- 11. Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'inventory_items'
ORDER BY ordinal_position;
