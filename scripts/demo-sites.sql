/**
 * SQL Script to create 6 demo sites for Edge Marketplace Hub
 * Run this in Supabase SQL Editor
 */

-- Create demo sites (without content first)
INSERT INTO sites (business_name, business_type, subdomain, email, tagline, demo, published, created_at, updated_at)
VALUES
  ('Noir Atelier', 'retail-core', 'noiratelier', 'hello@noiratelier.demo', 'Curated luxury for the modern wardrobe', true, false, NOW(), NOW()),
  ('Cedar & Forge', 'food-catering', 'cedarandforge', 'events@cedarandforge.demo', 'Farm-to-table catering with rustic elegance', true, false, NOW(), NOW()),
  ('Bloom & Lore', 'event-floral', 'bloomandlore', 'studio@bloomandlore.demo', 'Editorial florals for life\'s most beautiful moments', true, false, NOW(), NOW()),
  ('Earth & Ember', 'artisan-market', 'earthandember', 'maker@earthandember.demo', 'Hand-thrown ceramics for intentional living', true, false, NOW(), NOW()),
  ('Vantage Coaching', 'coach-educator', 'vantagecoaching', 'coach@vantagecoaching.demo', 'Executive coaching for leaders ready to level up', true, false, NOW(), NOW()),
  ('Apex Consulting', 'service-pro', 'apexconsulting', 'team@apexconsulting.demo', 'Business transformation for high-growth companies', true, false, NOW(), NOW())
ON CONFLICT (subdomain) DO NOTHING;

-- Get the IDs of the created sites
-- (Run SELECT * FROM sites WHERE demo = true; to see them)

-- Note: After running this, you need to:
-- 1. Generate content for each site using the AI
-- 2. Create pages for each site
-- 3. Publish the sites

-- Quick check:
SELECT id, business_name, subdomain, business_type, published FROM sites WHERE demo = true;
