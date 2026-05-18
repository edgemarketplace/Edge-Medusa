# Edge Medusa Phase 1-5 Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Rebuild Edge Medusa’s onboarding-to-commerce flow around 5 master template engines and a single master inventory system that supports manual items plus one-click Stripe and Printify imports, while keeping storefront rendering, checkout, and backend sync seamless.

**Architecture:** Keep shared template engines and section manifests as the presentation layer, then move all sellable objects into one canonical catalog layer: `inventory_items` + normalized source metadata + variant records + sync status. Every surface — builder inventory UI, AI generation, storefront sections, Stripe checkout, Medusa sync, and Printify import — should read from and write to that single source of truth.

**Tech Stack:** Next.js 16 App Router, Supabase, Stripe Connect/Checkout, Medusa backend, Printify API, existing section library/manifests, domain events.

---

## Current codebase findings (must inform implementation)

1. `app/api/sites/[siteId]/inventory/route.ts`
   - Uses `inventory_items` as the main table.
   - Deletes all items and re-inserts on every save.
   - Syncs sections and Medusa after save.
   - Emits `productCreated` events even for updates because the route is insert-only.

2. `app/api/sites/[siteId]/printify/sync/route.ts`
   - Writes to `inventory` instead of `inventory_items`.
   - Uses a different storage model than the main inventory API.
   - Does not flow through the main inventory save pipeline.
   - This is the clearest proof the inventory system is currently split.

3. `lib/printify.ts`
   - Maps Printify products into a loose shape with `metadata.source = 'printify'`.
   - Good starting point, but not normalized enough for variants, status, sync reconciliation, or dedupe.

4. `app/build/[siteId]/inventory/page.tsx`
   - Good manual inventory UI foundation.
   - No unified import hub.
   - Saves by replacing the entire dataset.
   - No source-aware controls, no bulk import review, no canonical sync status.

5. `app/api/checkout/route.ts`
   - Trusts item name/price from request payload.
   - Does not resolve canonical prices/stock from `inventory_items` before creating a Stripe session.
   - This must change before calling the commerce experience seamless.

6. `lib/medusa/client.ts` + `backend/medusa/src/api/edge/sites/[site_id]/products/route.ts`
   - Current sync is “push items to Medusa” but not a robust upsert/reconcile loop.
   - Good for a bridge, not yet a canonical product orchestration layer.

---

## North-star architecture

Build one master commerce catalog.

### Canonical source of truth

Use `inventory_items` as the single master inventory table.

Every item should support:
- manual creation
- Stripe-linked product metadata
- Printify-linked product metadata
- Medusa-linked product metadata
- unified variant data
- unified media
- unified pricing
- unified stock / availability model
- unified fulfillment/source flags

### Inventory source model

Each inventory item should expose:
- `source_type`: `manual | stripe | printify | hybrid`
- `source_refs`: JSONB with provider IDs
  - `stripe_product_id`
  - `stripe_price_id`
  - `printify_product_id`
  - `printify_shop_id`
  - `medusa_product_id`
  - `medusa_variant_ids`
- `sync_status`: `idle | pending | synced | error`
- `sync_error`: nullable text
- `fulfillment_mode`: `manual | printify`
- `pricing_mode`: `manual | stripe`

### Core product principle

The merchant should see one product row.
They should never need to think in terms of separate “manual inventory”, “Stripe inventory”, and “Printify inventory”.
Those are connectors behind one catalog record.

---

# Phase 1 — Foundation: master inventory architecture + 5 engines

## Deliverables

1. Define the 5 master template engines in code/docs
   - Editorial Commerce
   - Proof + Booking
   - Menu + Reservation
   - Gallery Luxury
   - Authority Funnel

2. Add routing metadata to onboarding/business models
   - category → engine
   - primary goal → CTA architecture
   - proof type → module selection

3. Design and migrate the unified inventory schema

## Files

**Create:**
- `docs/plans/2026-05-18-edge-medusa-phase-1-5-unified-inventory-plan.md`
- `lib/inventory/types.ts`
- `lib/inventory/source-mappers.ts`
- `lib/inventory/catalog.ts`
- `supabase_migrations/20260518_unified_inventory.sql`

**Modify:**
- `lib/types.ts`
- `lib/templates.ts`
- `lib/section-library.ts`
- `app/onboarding/page.tsx`
- `app/api/sites/route.ts`
- `app/api/sites/[siteId]/inventory/route.ts`

## Schema changes

Add or verify these columns on `inventory_items`:
- `source_type text not null default 'manual'`
- `source_refs jsonb not null default '{}'::jsonb`
- `sync_status text not null default 'idle'`
- `sync_error text null`
- `fulfillment_mode text not null default 'manual'`
- `pricing_mode text not null default 'manual'`
- `external_updated_at timestamptz null`
- `last_synced_at timestamptz null`
- `slug text null`
- `status text not null default 'active'`

Optional but recommended:
- separate `inventory_variants` table
- separate `inventory_media` table
- unique indexes on provider refs inside `source_refs`

## Phase 1 critical fixes

1. Stop delete-and-reinsert writes in `app/api/sites/[siteId]/inventory/route.ts`
   - Replace with stable upsert semantics.
   - Preserve item IDs so sections, carts, events, and external sync do not drift.

2. Standardize all imports on `inventory_items`
   - Delete the split use of `inventory` in Printify sync.
   - Make Printify flow through the same service layer as manual save.

3. Move inventory logic out of route handlers
   - Route should call `lib/inventory/catalog.ts`.
   - Avoid duplicated mapping logic between manual import, Printify import, Stripe import, and Medusa sync.

## Verification

- `inventory_items` can store manual + external items together.
- Existing builder inventory UI still loads data.
- Saving one item preserves its ID.
- Printify and future Stripe imports can upsert into the same table.

---

# Phase 2 — Onboarding rewrite: conversion routing + engine selection

## Deliverables

1. Add “primary goal” routing question.
2. Add supporting signals:
   - price point
   - catalog size
   - proof available
   - brand vibe
3. Store recommendation metadata on site record.
4. Return top 3 engine/variant recommendations after onboarding.

## Files

**Create:**
- `lib/onboarding/recommendations.ts`
- `lib/onboarding/questions.ts`

**Modify:**
- `app/onboarding/page.tsx`
- `app/api/sites/route.ts`
- `lib/templates.ts`
- `lib/ai.ts`
- `lib/types.ts`

## Data additions on site

Store fields like:
- `primary_goal`
- `price_point`
- `catalog_size`
- `proof_assets`
- `brand_vibe`
- `recommended_engines`
- `selected_variant`

## Inventory tie-in

If `primary_goal = sell products`, onboarding should immediately prepare:
- retail-oriented section mix
- inventory-first post-generation checklist
- Stripe/Printify import CTA on dashboard

If `primary_goal = order food`, inventory should bias toward menu item structures.
If `primary_goal = book services`, inventory should bias toward service/package structures.

## Verification

- Onboarding outputs engine recommendation data.
- Generated site type changes based on primary goal, not just category.
- Product-led businesses land on inventory-first next steps.

---

# Phase 3 — Unified inventory hub with one-click imports

## Deliverables

Build one master inventory screen that supports:
- manual product entry
- CSV/bulk manual entry later (optional, not required for first pass)
- one-click Printify import
- one-click Stripe product import
- unified review/merge flow
- per-item source badges
- sync status badges

## Files

**Create:**
- `app/api/sites/[siteId]/inventory/import/stripe/route.ts`
- `app/api/sites/[siteId]/inventory/import/printify/route.ts`
- `lib/inventory/stripe.ts`
- `lib/inventory/printify.ts`
- `lib/inventory/merge.ts`
- `components/inventory/InventoryImportPanel.tsx`
- `components/inventory/InventorySourceBadge.tsx`
- `components/inventory/InventorySyncStatus.tsx`

**Modify:**
- `app/build/[siteId]/inventory/page.tsx`
- `app/api/sites/[siteId]/printify/sync/route.ts`
- `lib/printify.ts`
- `lib/stripe.ts`
- `app/build/[siteId]/dashboard/page.tsx`

## Required UX

### Master inventory page sections

1. Header
   - total items
   - active items
   - sync errors
   - products ready to publish

2. Quick actions
   - Add item manually
   - Import from Stripe
   - Import from Printify
   - Refresh connected sources

3. Import review drawer
   - show incoming items
   - detect duplicates by name/SKU/provider ID
   - choose merge or create new
   - preview which fields will overwrite

4. Item cards/table
   - source badge: Manual / Stripe / Printify / Hybrid
   - fulfillment mode
   - stock status
   - sync status
   - edit once in same UI

## Import rules

### Printify import

- Fetch products from configured Printify shop.
- Normalize into master catalog shape.
- Upsert by `printify_product_id`.
- Keep Printify variants and image URLs.
- Set:
  - `source_type = 'printify'` or `hybrid`
  - `fulfillment_mode = 'printify'`
  - `source_refs.printify_product_id`

### Stripe import

- Fetch Stripe products + default/active prices.
- Normalize into master catalog shape.
- Upsert by `stripe_product_id`.
- Set:
  - `source_type = 'stripe'` or `hybrid`
  - `pricing_mode = 'stripe'`
  - `source_refs.stripe_product_id`
  - `source_refs.stripe_price_id`

### Manual items

- Create directly in same table.
- Can later be linked to Stripe and/or Printify.
- Manual item can become hybrid rather than duplicated.

## Critical implementation rule

Imports must call the same catalog service used by manual saves:
- normalize
- dedupe
- merge
- upsert
- emit events
- sync sections
- sync Medusa

One pipeline. No source-specific side paths.

## Verification

- Printify import writes to `inventory_items`, not `inventory`.
- Stripe import writes to `inventory_items`.
- Duplicate imports merge instead of multiplying junk rows.
- Imported items appear immediately in storefront sections.
- Merchant can edit imported items manually without breaking provider links.

---

# Phase 4 — Seamless selling/buying backend logic

## Deliverables

1. Checkout must use canonical inventory records server-side.
2. Cart/checkout line items must be reconstructed from item IDs, not trusted client prices.
3. Stock validation must happen before session creation.
4. Sync to Medusa should be upgraded toward deterministic upsert behavior.
5. Event and order metadata should preserve item/source provenance.

## Files

**Create:**
- `lib/checkout/resolve-line-items.ts`
- `lib/checkout/stock.ts`
- `lib/orders/normalizers.ts`
- `lib/inventory/medusa-sync.ts`

**Modify:**
- `app/api/checkout/route.ts`
- `app/api/checkout/confirm/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `lib/medusa/client.ts`
- `backend/medusa/src/api/edge/sites/[site_id]/products/route.ts`
- `backend/medusa/src/lib/edge-mappers.ts`
- `app/store/[subdomain]/StorefrontRenderer.tsx`
- `app/store/[subdomain]/page.tsx`

## Critical checkout fix

Current `app/api/checkout/route.ts` trusts request item price/name.
This must be replaced with:

1. request sends `item_id` + quantity + chosen variant
2. server fetches canonical `inventory_items`
3. server resolves active price from:
   - Stripe-linked pricing if `pricing_mode = stripe`
   - manual price otherwise
4. server validates enabled status
5. server validates stock if tracked
6. server creates line items from canonical data only

## Fulfillment rules

- `fulfillment_mode = printify`
  - order metadata must retain Printify refs for downstream fulfillment
- `fulfillment_mode = manual`
  - normal merchant fulfillment path
- hybrid is allowed only if rules are explicit; default to one fulfillment source per item

## Medusa sync rules

Upgrade from blind create to controlled upsert/reconcile:
- if `source_refs.medusa_product_id` exists, update product
- else create new and persist returned ID
- preserve inventory item ↔ Medusa product mapping
- sync variant metadata in a stable way

## Verification

- Checkout cannot be manipulated by editing client-side price.
- Disabled items cannot be purchased.
- Out-of-stock items are blocked or reduced correctly.
- Stripe session metadata includes canonical item IDs.
- Imported Printify items remain fulfillable after checkout.

---

# Phase 5 — Merchant momentum, launch dashboard, and polish

## Deliverables

1. Dashboard checklist tuned to product-led merchants.
2. “Inventory readiness” surfaced as launch blocker/guide.
3. Clear connector setup flows for Stripe and Printify.
4. Top-level status cards for publish readiness.

## Files

**Create:**
- `components/dashboard/LaunchChecklist.tsx`
- `components/dashboard/ConnectorStatusCard.tsx`
- `components/dashboard/InventoryReadinessCard.tsx`

**Modify:**
- `app/build/[siteId]/dashboard/page.tsx`
- `app/build/[siteId]/page.tsx`
- `app/api/sites/[siteId]/dashboard/route.ts`
- `app/api/sites/[siteId]/settings/route.ts`

## Recommended checklist

1. Add or import products
2. Connect Stripe payments
3. Connect Printify fulfillment (if relevant)
4. Review storefront sections
5. Publish store

## Inventory readiness rules

Site is “commerce ready” only if:
- at least 1 enabled sellable item exists
- every enabled item has a price
- every enabled physical item has fulfillment mode
- no blocking sync errors exist
- checkout route can resolve all displayed items canonically

## Verification

- Merchant sees exactly what is blocking sales.
- Dashboard drives them into one master inventory hub.
- Product import is a first-class launch action, not a side quest.

---

# Immediate engineering priorities (do these first)

## Priority A — inventory unification blockers

1. Fix Printify sync to stop writing to `inventory`
2. Replace inventory delete/reinsert with stable upsert
3. Add source metadata fields to `inventory_items`
4. Centralize inventory save/import logic in `lib/inventory/catalog.ts`
5. Change checkout to resolve canonical inventory records server-side

## Priority B — UX leverage

1. Add import panel to inventory page
2. Add Stripe import route
3. Add source/sync badges
4. Add dashboard “Import products” CTA

## Priority C — template engine foundation

1. Add engine metadata to templates
2. Add onboarding routing question: primary goal
3. Wire recommendation output to generation pipeline

---

# Suggested implementation order inside the repo

1. `supabase_migrations/20260518_unified_inventory.sql`
2. `lib/inventory/types.ts`
3. `lib/inventory/catalog.ts`
4. refactor `app/api/sites/[siteId]/inventory/route.ts`
5. refactor `app/api/sites/[siteId]/printify/sync/route.ts`
6. create `app/api/sites/[siteId]/inventory/import/printify/route.ts`
7. create `app/api/sites/[siteId]/inventory/import/stripe/route.ts`
8. upgrade `app/build/[siteId]/inventory/page.tsx`
9. harden `app/api/checkout/route.ts`
10. add onboarding routing fields and engine recommendation logic

---

# What to cut / simplify

Cut now:
- separate `inventory` table/path usage in Printify sync
- full-table delete/reinsert saves
- trusting checkout prices from client payload
- connector-specific product silos in UI

Do not build yet:
- advanced warehouse management
- multi-location inventory
- complex returns/refunds system
- full CSV ETL suite
- supplier marketplace ingestion

The shortest path is one master catalog, two import connectors, canonical checkout, and inventory-first launch readiness.

---

# Acceptance criteria for the full Phase 1-5 push

1. Merchant can manually add items in one place.
2. Merchant can one-click import from Printify into the same catalog.
3. Merchant can one-click import from Stripe into the same catalog.
4. Imported/manual items appear in one unified inventory UI.
5. Generated/storefront commerce sections read from the same catalog.
6. Checkout uses canonical server-resolved prices and stock.
7. Medusa sync runs from the same catalog records.
8. Merchant dashboard clearly shows product/import/payment readiness.
9. Onboarding selects the right engine and product-led next steps.
10. No duplicate “inventory systems” remain in the codebase.

---

# Recommended first execution batch

If executing immediately, start with this batch:

1. Schema migration for unified inventory metadata
2. Catalog service extraction
3. Printify sync rewrite onto `inventory_items`
4. Stable upsert rewrite for inventory API
5. Checkout canonicalization

That batch gives the biggest reduction in chaos and unlocks the rest cleanly.
