# Edge Medusa unified inventory ship checklist

## What changed in this pass

### Unified catalog foundation
- Master inventory remains `inventory_items`
- Manual inventory saves use centralized catalog upsert
- Printify import now merges into the same master catalog
- Stripe import now merges into the same master catalog
- Checkout resolves canonical product data from `inventory_items`

### Inventory UX
- One master inventory page for manual + Stripe + Printify
- Source badges: Manual / Stripe / Printify / Hybrid
- Sync badges: Idle / Pending / Synced / Needs attention
- Rapid-input bulk add
- Unified product modal

### Onboarding + dashboard
- Onboarding now captures `primary_goal`
- Generation flow gets goal-aware routing context
- Dashboard has launch-readiness and inventory-health checks

### Medusa reconcile hardening
- Medusa sync now sends stable per-item sync hashes
- Medusa backend route now checks for existing products by `metadata.edge_inventory_id`
- Existing products are not blindly duplicated on every sync
- Sync response now returns mapping metadata for inventory ↔ Medusa refs
- Edge side persists `medusa_product_id`, `medusa_variant_ids`, `sync_status`, and stale sync errors back into `inventory_items`

## Conflict resolution rules now enforced

### Manual vs Stripe
- Stripe owns price when `pricing_mode = stripe`
- Manual edits keep descriptive fields if they are already filled
- Manual disabled state is preserved across provider imports
- Stripe refs are still merged into `source_refs`

### Manual vs Printify
- Printify owns fulfillment when `fulfillment_mode = printify`
- Manual edits keep descriptive fields if already filled
- Existing manual stock is preserved unless manually changed
- Printify refs are still merged into `source_refs`

### Hybrid items
- If multiple sources match the same row, `source_type` becomes `hybrid`
- `source_refs` are merged rather than overwritten

## Required before deploy
1. Run Supabase migration:
   - `supabase_migrations/20260518_unified_inventory.sql`
2. Ensure app dependencies are installed so Next/Stripe/React types resolve
3. Verify Medusa backend dependencies are installed if syncing is enabled
4. Confirm environment variables:
   - `MEDUSA_BACKEND_URL`
   - `EDGE_MEDUSA_SHARED_SECRET`
   - `NEXT_PUBLIC_MEDUSA_BACKEND_URL` if used client-side
   - Stripe keys
   - Supabase keys

## Smoke test checklist

### Inventory
- [ ] Add a manual product
- [ ] Edit a manual product
- [ ] Bulk add via rapid input
- [ ] Import Stripe products
- [ ] Import Printify products
- [ ] Confirm source badges are correct
- [ ] Confirm sync badges are correct
- [ ] Confirm imported products remain in one combined inventory list

### Checkout
- [ ] Add imported item to cart from storefront
- [ ] Confirm checkout uses DB-backed pricing, not client payload pricing
- [ ] Confirm disabled item cannot be checked out
- [ ] Confirm low/no stock items are blocked correctly

### Medusa sync
- [ ] First sync creates Medusa products
- [ ] Second sync does not create obvious duplicates
- [ ] `source_refs.medusa_product_id` is written back to inventory rows
- [ ] Stale products surface sync errors instead of silently drifting

### Dashboard
- [ ] Launch readiness counts appear
- [ ] Inventory health numbers reflect missing prices/images/sync issues
- [ ] Stripe connected state appears correctly
- [ ] Printify connected state appears correctly

### Onboarding
- [ ] Primary goal selection is required
- [ ] Primary goal saves into site `template_data.onboarding_profile`
- [ ] Site generation receives the primary goal context

## Known remaining gap
- Medusa path now avoids repeated blind creates and marks stale products, but it still does not perform a true in-place Medusa update workflow for changed products. That is the next backend hardening target.
