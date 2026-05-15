-- Migration: Add tagline column to sites table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/frqgfxqvmfxjgfuaxdtv/sql/new

-- Add tagline column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sites' AND column_name = 'tagline'
  ) THEN
    ALTER TABLE public.sites ADD COLUMN tagline text DEFAULT '';
  END IF;
END $$;

-- Create auth_sessions table for magic link login
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

-- Enable RLS on auth_sessions
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on auth_sessions" ON public.auth_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON public.auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_email ON public.auth_sessions(email);

-- Create pages table for multi-page support
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

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on pages" ON public.pages FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_pages_site_id ON public.pages(site_id);
CREATE INDEX IF NOT EXISTS idx_pages_site_slug ON public.pages(site_id, slug);

-- Add index on sites.contact_email for account lookups
CREATE INDEX IF NOT EXISTS idx_sites_contact_email ON public.sites(contact_email);

-- Create storage bucket for site images
-- NOTE: This must be created via Supabase Dashboard → Storage → New Bucket
-- Bucket name: site-images, Public: true
