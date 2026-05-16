-- Migration to update sites table for Edge Marketplace Command Center
-- Run this in your Supabase SQL Editor

ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Create inventory_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price TEXT,
    description TEXT,
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pages table if it doesn't exist
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    sections JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, slug)
);

-- Enable RLS (simplified for now, ideally scope to owner)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for now" ON inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON pages FOR ALL USING (true) WITH CHECK (true);
