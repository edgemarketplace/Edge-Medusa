<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Current version**: Next.js 16.2.6 (Turbopack). Note: `middleware` convention deprecated — use `proxy` instead.
<!-- END:nextjs-agent-rules -->

# Edge Marketplace Hub — Project AGENTS.md

## Project Overview
AI-native vertical-specific funnel builder. 15-minute launch. Next.js 15 App Router + Supabase + Stripe Connect.

**Vision**: Vertical operating systems (not generic templates). Each vertical has unique psychology, CTA logic, trust mechanisms.

## Tech Stack & Versions
- **Next.js**: 16.2.6 (Turbopack)
- **React**: via Next.js
- **Supabase**: frqgfxqvmfxjgfuaxdtv (lazy-init Proxy client, never at module level)
- **Stripe**: Connect (test mode works without merchant Connect)
- **Gemini**: gemini-2.5-flash (env: GOOGLE_API_KEY)
- **Resend**: email (lazy-init, never at module level)
- **Vercel**: deployment, CSP via vercel.json

## Key Files
- `lib/section-library.ts` — 31 section types, manifests, validation
- `lib/ai.ts` — AI generation (Gemini)
- `lib/email.ts` — Resend welcome emails
- `components/SectionEditor.tsx` — page editor with ColorField
- `components/SectionPreview.tsx` — live preview
- `lib/templates.ts` — vertical page templates
- `lib/types.ts` — TypeScript interfaces

## Code Style
- **Quotes**: single quotes
- **Semicolons**: none
- **Patterns**: functional components, hooks
- **TypeScript**: strict mode
- **Formatting**: 2-space indent, trailing commas in multiline

## Setup Commands
```bash
npm install          # install deps (NOT pnpm)
npm run dev          # dev server on localhost:3000
npm run build        # production build
npm test             # run tests (if available)
```

## Environment Variables
```
GOOGLE_API_KEY=         # Gemini
NEXT_PUBLIC_SUPABASE_URL=https://frqgfxqvmfxjgfuaxdtv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=      # test mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=         # optional, emails skip if missing
NEXT_PUBLIC_APP_URL=https://edgemarketplacehub.com
```

## Architecture Notes
- **31 section types** across categories: header, hero, social-proof, offering, trust, conversion, footer
- **6 theme presets** (NOIR removed, Custom added) — CSS vars in `globals.css`
- **Vertical-specific funnels**: retail-core, service-pro, food-catering, artisan-market, event-floral
- **Multi-page support**: pages API + template_data.pages structure
- **Publish validation**: `validatePublish()` checks required sections, duplicates, conversion/offering sections
- **Magic link auth**: Supabase Auth, redirect to /onboarding?type=X
- **Email gate**: /email-gate with 2 boxes (Create account + Skip), pre-populated email, 7-day save notice

## UI/UX Conventions
- **Milano style**: editorial, serif headings, muted palette
- **Countdown flash**: 6s countdown on onboarding (5-1 display)
- **Click-to-change image** in preview
- **ColorField component**: sidebar color picker with clear button
- **Theme switcher**: 6 presets, CSS vars

## Known Pitfalls & Lessons Learned

### 1. ColorField TypeScript Error (May 2026)
- **Problem**: `ColorField` defined outside `SectionEditor` component but used `draft.id` and missing `onChange` prop type
- **Fix**: Added `onChange` to props type, removed `draft.id` dependency from `fieldId`
- **Lesson**: Keep helper functions inside component scope or pass all needed data via props

### 2. Launch Endpoint Return Format (May 2026)
- **Problem**: Frontend expected `{ siteId, subdomain, url }` but API returned `{ ok, site }`
- **Fix**: Updated `/api/sites/[siteId]/launch/route.ts` to return correct shape + set `published: true`
- **Lesson**: Always check what the calling code expects; validate API contracts

### 3. Publish Validation Errors Not Shown (May 2026)
- **Problem**: `handleLaunch()` set validation state but UI never displayed errors
- **Fix**: Added red error box above Publish button showing `publishValidation.errors` and `warnings`
- **Lesson**: User feedback is critical — silent failures frustrate (Donald's #1 pet peeve)

### 4. Supabase Client Lazy Init
- **Rule**: Never initialize Supabase client at module level
- **Pattern**: Use Proxy pattern with getter function, init on first use
- **Reason**: Avoid SSR issues and circular dependencies

### 5. Next.js 16 Differences
- `middleware.ts` → `proxy.ts` (middleware deprecated)
- Check `node_modules/next/dist/docs/` for breaking changes
- Turbopack is default bundler

## User Preferences (Donald Pemberton)
- **Work style**: direct, expects immediate implementation, hates dead ends
- **Aesthetic**: Milano editorial (serif, muted), aggressive scope cutting
- **Biggest risk**: over-engineering — needs constant scope control
- **Expectations**: 
  - 95% ready pages (placeholder text UNACCEPTABLE)
  - AI features working (deal-breaker)
  - Immediate visible UI changes after deployment
  - Low tolerance for fix cycles without visible progress
  - "Going backwards" = very discouraged
- **Business model**: service commerce > retail, vertical OS not templates
- **Launch promise**: 15-minute launch

## Deployment
- **Vercel**: auto-deploy from `main` branch
- **Build**: `npm run build` (TypeScript check + Next.js build)
- **Domains**: www.edgemarketplacehub.com, wildcard DNS needs nameserver move
- **GitHub**: edgemarketplace/edgemarketplacehublaunch

## Database
- **Supabase tables**: manual setup (no automatic migrations in CI)
- **Key tables**: sites, pages, inventory, orders, clients, conversations
- **Published flag**: `sites.published` BOOLEAN, `sites.published_at` TIMESTAMPTZ
- **Demo sites**: `sites.demo = true`, auto-generated with `published: true`

## Testing Checklist Before Deploy
1. `npm run build` passes (no TypeScript errors)
2. Publish validation works (add sections, see errors)
3. Launch endpoint returns correct format
4. Validation errors display to user
5. ColorField renders without console errors
6. All 31 section types render correctly in preview
