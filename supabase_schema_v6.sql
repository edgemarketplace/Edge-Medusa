-- Migration v6: Marketing & Comms Suite Infrastructure

-- 1. Google My Business Columns
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS gmb_location_id TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS gmb_account_id TEXT;

-- 2. Social Planner
CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'instagram', 'twitter', 'facebook', etc.
    content TEXT NOT NULL,
    media_url TEXT,
    scheduled_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'posted', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Unified Mailbox
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    subject TEXT,
    last_message TEXT,
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'archived'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL, -- 'customer' or 'admin'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies (adjust based on auth later)
CREATE POLICY "Public social_posts access" ON public.social_posts FOR ALL USING (true);
CREATE POLICY "Public conversations access" ON public.conversations FOR ALL USING (true);
CREATE POLICY "Public messages access" ON public.messages FOR ALL USING (true);
