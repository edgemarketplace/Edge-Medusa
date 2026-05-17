# Edge-Medusa

MedusaJS backend overhaul fork of `edgemarketplace/edgemarketplacehublaunch`.

This repo keeps the existing Edge Marketplace Hub Next.js builder/storefront surface and adds a dedicated Medusa v2 commerce backend under `backend/medusa`.

## Architecture

- `app/` — Next.js 16 App Router builder, onboarding, storefront, and API routes.
- `lib/medusa/client.ts` — Next-to-Medusa adapter used by the builder APIs.
- `app/api/medusa/[...path]/route.ts` — proxy to the Medusa backend for controlled frontend/API access.
- `backend/medusa/` — Medusa v2 backend for catalog, inventory, orders, payments, fulfillment, files, and Admin.
- `docs/MEDUSA_BACKEND_OVERHAUL.md` — migration plan, environment variables, and verification commands.

## Local development

```bash
npm install
npm run dev
```

Medusa backend:

```bash
npm --prefix backend/medusa install
cp backend/medusa/.env.example backend/medusa/.env
# edit DATABASE_URL, REDIS_URL, secrets, Stripe keys
npm run medusa:migrate
npm run medusa:dev
```

Run both surfaces:

```bash
npm run dev:all
```

## Required env vars

Next.js:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nzxedlagqtzadyrmgkhq.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_mAG0Ncil8LY4Ls-LcBUCUw_k_br_aI6
# NEXT_PUBLIC_SUPABASE_ANON_KEY is supported as a legacy alias
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
EDGE_MEDUSA_SHARED_SECRET=
EDGE_COMMERCE_BACKEND=medusa
```

Medusa:

```bash
DATABASE_URL=
REDIS_URL=
MEDUSA_BACKEND_URL=http://localhost:9000
EDGE_MEDUSA_SHARED_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
JWT_SECRET=
COOKIE_SECRET=
```

## Supabase schema setup

Before using onboarding, magic links, or the builder dashboard, run the Supabase schema migrations in the project connected to `NEXT_PUBLIC_SUPABASE_URL`.

For the auth session error:

```txt
Could not find the table 'public.auth_sessions' in the schema cache
```

run this file in Supabase Dashboard → SQL Editor:

```txt
supabase/migrations/20260518_create_auth_sessions.sql
```

That creates `public.auth_sessions`, the token table used by magic link login and the skip-auth onboarding session.

## Verification

```bash
npm run build
npm run lint
curl http://localhost:9000/edge/health
```

Note: this fork currently preserves the existing Supabase-backed builder data model while syncing commerce catalog writes into Medusa when the Medusa env vars are configured. Checkout/order reads can be moved fully to Medusa after regions, sales channels, stock locations, shipping options, publishable API keys, and Stripe provider setup are complete.
