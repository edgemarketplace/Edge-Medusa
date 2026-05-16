-- Fix the business_type check constraint to include all valid template families
ALTER TABLE sites DROP CONSTRAINT IF EXISTS sites_business_type_check;

ALTER TABLE sites ADD CONSTRAINT sites_business_type_check 
  CHECK (business_type IN ('retail-core', 'service-pro', 'food-catering', 'artisan-market', 'event-floral', 'coach-educator'));
