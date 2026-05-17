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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
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

## Verification

```bash
npm run build
npm run lint
curl http://localhost:9000/edge/health
```

Note: this fork currently preserves the existing Supabase-backed builder data model while syncing commerce catalog writes into Medusa when the Medusa env vars are configured. Checkout/order reads can be moved fully to Medusa after regions, sales channels, stock locations, shipping options, publishable API keys, and Stripe provider setup are complete.
