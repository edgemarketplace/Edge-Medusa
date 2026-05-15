-- Edge Marketplace Hub - Supabase Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/frqgfxqvmfxjgfuaxdtv/sql/new

-- Sites table: the single source of truth for each store
create table if not exists public.sites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  business_name text not null,
  business_type text not null check (business_type in ('retail-core', 'service-pro', 'food-catering', 'artisan-market', 'event-floral')),
  offerings text default '',
  contact_email text not null,
  template_data jsonb default '{"sections":[]}'::jsonb,
  status text default 'draft' check (status in ('draft', 'ready', 'live')),
  subdomain text unique,
  stripe_account_id text,
  site_token text default gen_random_uuid()::text
);

-- Inventory items: products/services for each store
create table if not exists public.inventory_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  site_id uuid references public.sites(id) on delete cascade not null,
  name text not null,
  price text default '',
  description text default '',
  category text default '',
  image_url text
);

-- Enable RLS
alter table public.sites enable row level security;
alter table public.inventory_items enable row level security;

-- Policies: allow all operations for now (we use service role key server-side)
create policy "Allow all on sites" on public.sites for all using (true) with check (true);
create policy "Allow all on inventory_items" on public.inventory_items for all using (true) with check (true);

-- Index for subdomain lookups
create index if not exists idx_sites_subdomain on public.sites(subdomain);
create index if not exists idx_inventory_site_id on public.inventory_items(site_id);
