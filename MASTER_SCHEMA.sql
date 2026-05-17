-- Edge Marketplace Hub - Master Schema (Clean Slate)
-- WARNING: This will delete existing data in sites, inventory_items, and pages.
-- Run this in your Supabase SQL Editor to reset and initialize correctly.

-- 1. Drop existing tables to avoid partial schema conflicts
DROP TABLE IF EXISTS public.auth_sessions CASCADE;
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.sites CASCADE;

-- 2. Sites table: the single source of truth for each store
CREATE TABLE public.sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  offerings TEXT DEFAULT '',
  contact_email TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  template_data JSONB DEFAULT '{"sections":[]}'::JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'live')),
  subdomain TEXT UNIQUE,
  stripe_account_id TEXT,
  site_token TEXT DEFAULT gen_random_uuid()::TEXT
);

-- 3. Inventory items: products/services for each store
CREATE TABLE public.inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price TEXT DEFAULT '',
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  image_url TEXT
);

-- 4. Pages table: custom pages for storefronts
CREATE TABLE public.pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    sections JSONB DEFAULT '[]'::JSONB,
    UNIQUE(site_id, slug)
);

-- 5. Auth sessions: magic links and skip-auth builder sessions
CREATE TABLE public.auth_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

-- 6. Enable RLS
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

-- 7. Policies (Dev setup: Allow all)
CREATE POLICY "Allow all on sites" ON public.sites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on inventory_items" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pages" ON public.pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on auth_sessions" ON public.auth_sessions FOR ALL USING (true) WITH CHECK (true);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_sites_subdomain ON public.sites(subdomain);
CREATE INDEX IF NOT EXISTS idx_inventory_site_id ON public.inventory_items(site_id);
CREATE INDEX IF NOT EXISTS idx_pages_site_id ON public.pages(site_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON public.auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_email ON public.auth_sessions(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON public.auth_sessions(expires_at);
