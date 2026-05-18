# Commit message + staged release plan

Suggested commit message:

feat(inventory): unify provider imports and harden Medusa reconciliation

Long-form commit body:
- add Stripe import into master inventory pipeline
- collapse Printify into the same canonical catalog flow
- harden checkout to price from inventory_items instead of client payloads
- add source/sync badges and unified inventory hub UX
- persist onboarding primary-goal routing context
- add dashboard launch-readiness checks
- add Medusa reconcile metadata write-back and update path for changed products
- add import conflict-resolution rules for manual/Stripe/Printify overlap

## Recommended staged release sequence

### Stage 1: data + backend foundation
Ship together:
- supabase_migrations/20260518_unified_inventory.sql
- lib/inventory/types.ts
- lib/inventory/source-mappers.ts
- lib/inventory/catalog.ts
- app/api/sites/[siteId]/inventory/route.ts
- app/api/sites/[siteId]/printify/sync/route.ts
- app/api/sites/[siteId]/stripe/sync/route.ts
- app/api/checkout/route.ts

Release goal:
- one canonical inventory source of truth
- imports merge into master inventory
- checkout trusts DB pricing only

### Stage 2: Medusa reconcile hardening
Ship together:
- lib/medusa/client.ts
- backend/medusa/src/lib/edge-mappers.ts
- backend/medusa/src/api/edge/sites/[site_id]/products/route.ts

Release goal:
- avoid repeated blind creates
- write Medusa refs back to inventory rows
- update changed products instead of only flagging drift

### Stage 3: merchant UX surfaces
Ship together:
- app/build/[siteId]/inventory/page.tsx
- app/build/[siteId]/dashboard/page.tsx
- app/api/sites/[siteId]/dashboard/route.ts

Release goal:
- one master inventory hub
- conflict/sync visibility
- launch-readiness visibility

### Stage 4: onboarding routing
Ship together:
- app/onboarding/page.tsx
- app/api/sites/route.ts
- app/api/sites/[siteId]/generate/route.ts

Release goal:
- primary-goal-aware routing and generation

## Pre-merge verification
- run migration in staging
- verify Stripe import on a connected test account
- verify Printify import on a connected test shop
- verify repeated Medusa sync does not create duplicate products
- verify changed inventory updates existing Medusa products
- verify checkout line items use canonical DB values
- verify dashboard readiness counts match real catalog state
- verify onboarding persists primary_goal into template_data.onboarding_profile

## Rollback guidance
- if Stage 3 UI has issues but backend is healthy, revert only UI files and keep canonical inventory backend live
- if Medusa sync update path fails, keep Stage 1 live and temporarily disable downstream Medusa sync while preserving inventory_items as source of truth
- do not roll back checkout canonical pricing once deployed unless you want to reintroduce trust/security drift
