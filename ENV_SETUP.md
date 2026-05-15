# Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

## Required Variables

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API (secret) |
| `OPENAI_API_KEY` | OpenAI API key | platform.openai.com/api-keys |
| `GEMINI_API_KEY` | Google Gemini API key | aistudio.google.com/app/apikey |
| `STRIPE_SECRET_KEY` | Stripe secret key | dashboard.stripe.com/apikeys |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | dashboard.stripe.com/apikeys |
| `STRIPE_CLIENT_ID` | Stripe Connect client ID | dashboard.stripe.com → Settings → Connect |
