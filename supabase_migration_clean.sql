-- Clean migration: Add missing columns and tables
-- Run this in Supabase SQL Editor

-- 1. Add tagline column to sites table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sites' AND column_name = 'tagline'
  ) THEN
    ALTER TABLE public.sites ADD COLUMN tagline text DEFAULT '';
  END IF;
END $$;

-- 1b. Add theme_id column to sites table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sites' AND column_name = 'theme_id'
  ) THEN
    ALTER TABLE public.sites ADD COLUMN theme_id text DEFAULT 'milano';
  END IF;
END $$;

-- 1c. Add enhanced inventory columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'variants') THEN
    ALTER TABLE public.inventory_items ADD COLUMN variants jsonb DEFAULT null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'stock') THEN
    ALTER TABLE public.inventory_items ADD COLUMN stock integer DEFAULT null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'sku') THEN
    ALTER TABLE public.inventory_items ADD COLUMN sku text DEFAULT null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'tax_rate') THEN
    ALTER TABLE public.inventory_items ADD COLUMN tax_rate numeric DEFAULT null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'shipping_class') THEN
    ALTER TABLE public.inventory_items ADD COLUMN shipping_class text DEFAULT 'standard';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'weight') THEN
    ALTER TABLE public.inventory_items ADD COLUMN weight numeric DEFAULT null;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'enabled') THEN
    ALTER TABLE public.inventory_items ADD COLUMN enabled boolean DEFAULT true;
  END IF;
END $$;

-- 2. Create auth_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

-- 3. Enable RLS and create policy for auth_sessions (drop first if exists)
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on auth_sessions" ON public.auth_sessions;
CREATE POLICY "Allow all on auth_sessions" ON public.auth_sessions FOR ALL USING (true) WITH CHECK (true);

-- 4. Create indexes for auth_sessions
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON public.auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_email ON public.auth_sessions(email);

-- 5. Create pages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  sections jsonb DEFAULT '[]'::jsonb,
  UNIQUE(site_id, slug)
);

-- 6. Enable RLS and create policy for pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on pages" ON public.pages;
CREATE POLICY "Allow all on pages" ON public.pages FOR ALL USING (true) WITH CHECK (true);

-- 7. Create indexes for pages
CREATE INDEX IF NOT EXISTS idx_pages_site_id ON public.pages(site_id);
CREATE INDEX IF NOT EXISTS idx_pages_site_slug ON public.pages(site_id, slug);

-- 8. Create index on sites.contact_email
CREATE INDEX IF NOT EXISTS idx_sites_contact_email ON public.sites(contact_email);
