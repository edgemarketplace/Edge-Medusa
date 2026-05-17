# Edge-Medusa backend overhaul

This fork separates the commerce backend from the AI storefront builder. The Next.js app remains the launch/editor surface. A dedicated Medusa v2 backend under `backend/medusa` becomes the system of record for catalog, inventory, orders, payments, fulfillment, and future marketplace operations.

## What changed

- Added a Medusa v2 backend scaffold at `backend/medusa`.
- Added Stripe, manual fulfillment, local file module wiring in `medusa-config.ts`.
- Added secured Edge integration routes:
  - `GET /edge/health`
  - `POST /edge/sites/:site_id/products`
  - `GET /edge/sites/:site_id/orders`
- Added Next.js adapter `lib/medusa/client.ts`.
- Added Next.js proxy route `/api/medusa/:path*` for Store/Admin-side calls without exposing an internal host.
- Inventory saves now attempt a non-blocking Medusa product sync when Medusa env vars are configured.

## Environment variables

Next.js app:

```bash
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
EDGE_MEDUSA_SHARED_SECRET=replace-with-shared-secret
EDGE_COMMERCE_BACKEND=medusa
```

Medusa backend (`backend/medusa/.env`):

```bash
DATABASE_URL=postgres://medusa:medusa@localhost:5432/edge_medusa
REDIS_URL=redis://localhost:6379
MEDUSA_BACKEND_URL=http://localhost:9000
STORE_CORS=http://localhost:3000,https://*.edgemarketplacehub.com
ADMIN_CORS=http://localhost:7001,http://localhost:3000
AUTH_CORS=http://localhost:7001,http://localhost:3000
JWT_SECRET=replace-with-32-char-random
COOKIE_SECRET=replace-with-32-char-random
STRIPE_SECRET_KEY=replace-with-stripe-secret-key
STRIPE_WEBHOOK_SECRET=replace-with-stripe-webhook-secret
EDGE_MEDUSA_SHARED_SECRET=replace-with-shared-secret
```

## Local run

```bash
npm install
npm --prefix backend/medusa install
cp backend/medusa/.env.example backend/medusa/.env
# edit DATABASE_URL / secrets
npm run medusa:migrate
npm run medusa:dev
# separate terminal
npm run dev
```

## Migration posture

Phase 1 keeps Supabase as the builder/auth/source-of-truth for generated page content while syncing commerce objects into Medusa. This is intentional: it avoids breaking the current 15-minute launch flow while moving revenue-critical backend surfaces to Medusa.

Phase 2 should move checkout creation and order dashboard reads fully to Medusa Store/Admin APIs after regions, sales channels, shipping options, stock locations, publishable API keys, and Stripe payment providers are configured for production.

## Verification

```bash
curl http://localhost:9000/edge/health
curl -X POST http://localhost:9000/edge/sites/demo/products \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $EDGE_MEDUSA_SHARED_SECRET" \
  -d '{"items":[{"id":"sku_1","name":"Milano Starter Kit","price":"$199","stock":5}]}'
```
