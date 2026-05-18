-- Unified inventory metadata for Edge Medusa
-- Run in Supabase SQL editor

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS source_refs JSONB NOT NULL DEFAULT '{}'::JSONB;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'idle';

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS sync_error TEXT NULL;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS fulfillment_mode TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS pricing_mode TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS external_updated_at TIMESTAMPTZ NULL;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ NULL;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS slug TEXT NULL;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_inventory_source_type
  ON public.inventory_items(site_id, source_type);

CREATE INDEX IF NOT EXISTS idx_inventory_status
  ON public.inventory_items(site_id, status, enabled);

CREATE INDEX IF NOT EXISTS idx_inventory_source_refs_gin
  ON public.inventory_items USING GIN(source_refs);
