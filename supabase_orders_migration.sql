-- Orders table migration
-- Run this in Supabase SQL Editor

-- 1. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' NOT NULL, -- pending, paid, shipped, completed, canceled
  stripe_session_id text,
  stripe_payment_intent_id text,
  customer_email text,
  customer_name text,
  shipping_address jsonb,
  subtotal_cents integer DEFAULT 0,
  shipping_cents integer DEFAULT 0,
  total_cents integer DEFAULT 0,
  currency text DEFAULT 'usd',
  metadata jsonb DEFAULT '{}'
);

-- 2. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  price_cents integer DEFAULT 0,
  quantity integer DEFAULT 1,
  description text,
  image_url text
);

-- 3. Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
DROP POLICY IF EXISTS "Allow all on orders" ON public.orders;
CREATE POLICY "Allow all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on order_items" ON public.order_items;
CREATE POLICY "Allow all on order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_site_id ON public.orders(site_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_session ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 6. Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
