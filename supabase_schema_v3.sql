-- Session tokens for magic link login
create table if not exists public.auth_sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz
);

-- Enable RLS
alter table public.auth_sessions enable row level security;

-- Policies: allow all operations (we use service role key server-side)
create policy "Allow all on auth_sessions" on public.auth_sessions for all using (true) with check (true);

-- Index for token lookups
create index if not exists idx_auth_sessions_token on public.auth_sessions(token);
create index if not exists idx_auth_sessions_email on public.auth_sessions(email);

-- Add index on sites.contact_email for account lookups
create index if not exists idx_sites_contact_email on public.sites(contact_email);
