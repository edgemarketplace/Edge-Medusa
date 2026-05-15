-- Additional schema for multi-page support
-- Run this in Supabase SQL Editor alongside the existing schema

-- Pages table: additional pages for each store
create table if not exists public.pages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  site_id uuid references public.sites(id) on delete cascade not null,
  slug text not null,
  title text not null,
  sections jsonb default '[]'::jsonb,
  unique(site_id, slug)
);

-- Enable RLS
alter table public.pages enable row level security;

-- Policies: allow all operations (we use service role key server-side)
create policy "Allow all on pages" on public.pages for all using (true) with check (true);

-- Index for slug lookups
create index if not exists idx_pages_site_id on public.pages(site_id);
create index if not exists idx_pages_site_slug on public.pages(site_id, slug);

-- Storage bucket for site images (if not exists)
-- Note: This needs to be created via the Supabase Dashboard or API, not SQL
-- Go to Storage → Create bucket → name: "site-images" → Public: true
