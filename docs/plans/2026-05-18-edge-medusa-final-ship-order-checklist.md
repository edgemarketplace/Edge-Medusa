# Final ship-order checklist with exact commands

Use this sequence from the repo root: `/root/edge-medusa-eval`

## 0. Inspect current branch and diff

```bash
cd /root/edge-medusa-eval
git branch --show-current
git status --short
git diff --stat
```

## 1. Apply unified inventory migration

If you use the Supabase CLI locally:

```bash
cd /root/edge-medusa-eval
supabase db push --include-all
```

If you need to run the SQL manually in Supabase SQL editor, paste:

```bash
cat /root/edge-medusa-eval/supabase_migrations/20260518_unified_inventory.sql
```

Recommended verification SQL after migration:

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'inventory_items'
order by ordinal_position;
```

## 2. Install app dependencies if missing

Root app:

```bash
cd /root/edge-medusa-eval
npm install
```

Medusa backend:

```bash
cd /root/edge-medusa-eval/backend/medusa
npm install
```

## 3. Run local validation

Frontend/app checks:

```bash
cd /root/edge-medusa-eval
npm run build
```

If a lighter check exists in this repo, also run:

```bash
cd /root/edge-medusa-eval
npm run lint || true
npm run typecheck || true
```

Medusa backend check:

```bash
cd /root/edge-medusa-eval/backend/medusa
npm run build || npm run typecheck || true
```

## 4. Staging/manual smoke test order

### 4.1 Inventory canonical flow
1. Go to `/build/<siteId>/inventory`
2. Add a manual item
3. Edit it
4. Duplicate it
5. Disable and re-enable it
6. Confirm it still appears correctly after reload

### 4.2 Stripe import
1. Connect a test Stripe account
2. Click `Import Stripe`
3. Confirm imported products land in master inventory
4. Confirm badges show `Stripe pricing` where expected
5. Click `Resync Medusa`
6. Confirm imported rows get Medusa refs and synced status

### 4.3 Printify import
1. Connect Printify API key + shop ID
2. Click `Import Printify`
3. Confirm imported products land in master inventory
4. Confirm badges show `Printify fulfillment`
5. Confirm hybrid/manual rules are visible where applicable

### 4.4 Per-item Medusa resync
1. Change one product in inventory
2. Click that row's `Resync`
3. Confirm status returns to synced
4. Confirm no duplicate Medusa product was created

### 4.5 Checkout trust test
1. Add imported and manual items to cart
2. Complete test checkout
3. Confirm server-side inventory pricing was used
4. Confirm disabled items cannot be purchased

### 4.6 Launch readiness
1. Visit `/build/<siteId>/dashboard`
2. Confirm inventory/readiness metrics reflect real catalog state
3. Confirm sync issues surface if any item is in error

## 5. Recommended git ship sequence

Stage everything:

```bash
cd /root/edge-medusa-eval
git add app/api/checkout/route.ts \
  app/api/sites/[siteId]/dashboard/route.ts \
  app/api/sites/[siteId]/generate/route.ts \
  app/api/sites/[siteId]/inventory/route.ts \
  app/api/sites/[siteId]/inventory/resync/route.ts \
  app/api/sites/[siteId]/printify/sync/route.ts \
  app/api/sites/[siteId]/stripe/sync/route.ts \
  app/api/sites/route.ts \
  app/build/[siteId]/dashboard/page.tsx \
  app/build/[siteId]/inventory/page.tsx \
  app/onboarding/page.tsx \
  backend/medusa/src/api/edge/sites/[site_id]/products/route.ts \
  backend/medusa/src/lib/edge-mappers.ts \
  lib/medusa/client.ts \
  lib/inventory \
  docs/plans \
  supabase_migrations/20260518_unified_inventory.sql
```

Commit:

```bash
cd /root/edge-medusa-eval
git commit -m "feat(inventory): unify provider imports and harden Medusa sync"
```

Push:

```bash
cd /root/edge-medusa-eval
git push origin main
```

## 6. Rollback commands

If app code must roll back before migration rollback:

```bash
cd /root/edge-medusa-eval
git log --oneline -n 5
git revert <commit_sha>
git push origin main
```

If only the UI needs to roll back:

```bash
cd /root/edge-medusa-eval
git checkout HEAD~1 -- app/build/[siteId]/inventory/page.tsx app/build/[siteId]/dashboard/page.tsx
git commit -m "revert(ui): rollback inventory/dashboard surface"
git push origin main
```

If Medusa sync update path must be disabled fast:
1. revert `backend/medusa/src/api/edge/sites/[site_id]/products/route.ts`
2. keep canonical inventory backend live
3. continue using `inventory_items` as source of truth while Medusa sync is repaired

## 7. Success definition

Ship is close enough for eval when all are true:
- master inventory is the only product truth
- Stripe and Printify both import into that truth
- checkout prices come from canonical inventory rows
- Medusa sync no longer duplicates on repeated runs
- changed products update or reconcile cleanly
- readiness dashboard reflects actual inventory health
- onboarding stores primary goal for smarter generation
