-- Create builder auth session table used by magic links and skip-auth onboarding.
-- Fixes Supabase/PostgREST error:
--   Could not find the table 'public.auth_sessions' in the schema cache

create table if not exists public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz
);

alter table public.auth_sessions enable row level security;

drop policy if exists "Allow all on auth_sessions" on public.auth_sessions;
create policy "Allow all on auth_sessions"
  on public.auth_sessions
  for all
  using (true)
  with check (true);

create index if not exists idx_auth_sessions_token on public.auth_sessions(token);
create index if not exists idx_auth_sessions_email on public.auth_sessions(email);
create index if not exists idx_auth_sessions_expires_at on public.auth_sessions(expires_at);

comment on table public.auth_sessions is 'Builder login/session tokens for magic links and skip-auth onboarding.';
