-- Edge Medusa marketplace network schema
-- Adds a real tenant/channel/shared-catalog backend model without replacing the
-- existing sites + inventory_items MVP tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Canonical owner/operator entity. A merchant, marketplace operator, agency,
-- enterprise account, or the platform admin can all be represented here.
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  type TEXT NOT NULL DEFAULT 'merchant' CHECK (type IN ('merchant', 'marketplace', 'enterprise', 'agency', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  owner_email TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- Roles are data so the hierarchy can evolve without hard-coding every role in app code.
CREATE TABLE IF NOT EXISTS public.tenant_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  permissions JSONB NOT NULL DEFAULT '[]'::JSONB
);

INSERT INTO public.tenant_roles (key, name, description, permissions)
VALUES
  ('owner', 'Owner', 'Full tenant administration', '["tenant:manage", "catalog:manage", "orders:manage", "channels:manage"]'::JSONB),
  ('admin', 'Admin', 'Manage catalog, orders, and channels', '["catalog:manage", "orders:manage", "channels:manage"]'::JSONB),
  ('catalog_manager', 'Catalog manager', 'Manage products and shared catalog visibility', '["catalog:manage", "channels:manage"]'::JSONB),
  ('viewer', 'Viewer', 'Read-only tenant access', '["tenant:read", "catalog:read", "orders:read"]'::JSONB)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_key TEXT NOT NULL REFERENCES public.tenant_roles(key),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (organization_id, email)
);

-- Existing storefronts become Medusa-style sales channels owned by organizations.
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel_type TEXT NOT NULL DEFAULT 'storefront',
  ADD COLUMN IF NOT EXISTS marketplace_visibility TEXT NOT NULL DEFAULT 'public' CHECK (marketplace_visibility IN ('private', 'public', 'featured')),
  ADD COLUMN IF NOT EXISTS shared_catalog_enabled BOOLEAN NOT NULL DEFAULT true;

-- Backfill one organization per existing site. This is safe/idempotent and does not
-- require dropping data.
INSERT INTO public.organizations (name, slug, type, owner_email, metadata)
SELECT
  COALESCE(NULLIF(s.business_name, ''), 'Tenant ' || LEFT(s.id::TEXT, 8)) AS name,
  COALESCE(NULLIF(s.subdomain, ''), 'tenant-' || LEFT(s.id::TEXT, 8)) AS slug,
  'merchant' AS type,
  s.contact_email AS owner_email,
  jsonb_build_object('source', 'sites_backfill', 'site_id', s.id)
FROM public.sites s
WHERE s.organization_id IS NULL
ON CONFLICT (slug) DO NOTHING;

UPDATE public.sites s
SET organization_id = o.id
FROM public.organizations o
WHERE s.organization_id IS NULL
  AND o.slug = COALESCE(NULLIF(s.subdomain, ''), 'tenant-' || LEFT(s.id::TEXT, 8));

INSERT INTO public.tenant_memberships (organization_id, email, role_key, metadata)
SELECT DISTINCT
  s.organization_id,
  LOWER(TRIM(s.contact_email)),
  'owner',
  jsonb_build_object('source', 'sites_backfill', 'site_id', s.id)
FROM public.sites s
WHERE s.organization_id IS NOT NULL
  AND s.contact_email IS NOT NULL
  AND TRIM(s.contact_email) <> ''
ON CONFLICT (organization_id, email) DO NOTHING;

-- Marketplace channels are the network/distribution layer. A storefront can appear
-- in multiple marketplace channels over time without duplicating commerce data.
CREATE TABLE IF NOT EXISTS public.marketplace_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'storefront' CHECK (type IN ('storefront', 'marketplace', 'collection', 'affiliate', 'wholesale')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'paused', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('private', 'public', 'featured')),
  description TEXT DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

INSERT INTO public.marketplace_channels (organization_id, site_id, name, slug, type, status, visibility, description, metadata)
SELECT
  s.organization_id,
  s.id,
  COALESCE(NULLIF(s.business_name, ''), 'Tenant ' || LEFT(s.id::TEXT, 8)),
  COALESCE(NULLIF(s.subdomain, ''), 'channel-' || LEFT(s.id::TEXT, 8)),
  'storefront',
  CASE WHEN s.status = 'live' THEN 'live' ELSE 'draft' END,
  CASE WHEN s.marketplace_visibility = 'featured' THEN 'featured' WHEN s.marketplace_visibility = 'private' THEN 'private' ELSE 'public' END,
  COALESCE(NULLIF(s.tagline, ''), NULLIF(s.offerings, ''), 'Tenant storefront sales channel'),
  jsonb_build_object('source', 'sites_backfill')
FROM public.sites s
WHERE s.organization_id IS NOT NULL
ON CONFLICT (slug) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  site_id = EXCLUDED.site_id,
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  visibility = EXCLUDED.visibility,
  description = EXCLUDED.description;

-- Shared products are references into the tenant-owned product table, not copies.
-- This avoids price/inventory/catalog drift.
CREATE TABLE IF NOT EXISTS public.shared_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'paused', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'network' CHECK (visibility IN ('private', 'network', 'featured')),
  title_override TEXT,
  description_override TEXT,
  merchandising JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (site_id, inventory_item_id)
);

INSERT INTO public.shared_products (organization_id, site_id, inventory_item_id, status, visibility, merchandising)
SELECT
  s.organization_id,
  i.site_id,
  i.id,
  'published',
  'network',
  jsonb_build_object('source', 'inventory_backfill')
FROM public.inventory_items i
JOIN public.sites s ON s.id = i.site_id
WHERE COALESCE(i.enabled, true) = true
  AND COALESCE(s.shared_catalog_enabled, true) = true
ON CONFLICT (site_id, inventory_item_id) DO NOTHING;

-- Per-channel rules let a product be live in one channel and hidden in another.
CREATE TABLE IF NOT EXISTS public.product_channel_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shared_product_id UUID NOT NULL REFERENCES public.shared_products(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.marketplace_channels(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'featured')),
  sort_order INTEGER NOT NULL DEFAULT 100,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  UNIQUE (shared_product_id, channel_id)
);

INSERT INTO public.product_channel_visibility (shared_product_id, channel_id, status, metadata)
SELECT
  sp.id,
  mc.id,
  CASE WHEN sp.visibility = 'featured' OR mc.visibility = 'featured' THEN 'featured' ELSE 'visible' END,
  jsonb_build_object('source', 'initial_network_backfill')
FROM public.shared_products sp
JOIN public.marketplace_channels mc ON mc.site_id = sp.site_id
ON CONFLICT (shared_product_id, channel_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_organizations_type_status ON public.organizations(type, status);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_email ON public.organizations(LOWER(owner_email));
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_email ON public.tenant_memberships(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_org ON public.tenant_memberships(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sites_organization_id ON public.sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_channels_site ON public.marketplace_channels(site_id, status, visibility);
CREATE INDEX IF NOT EXISTS idx_marketplace_channels_org ON public.marketplace_channels(organization_id);
CREATE INDEX IF NOT EXISTS idx_shared_products_site ON public.shared_products(site_id, status, visibility);
CREATE INDEX IF NOT EXISTS idx_shared_products_inventory ON public.shared_products(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_product_channel_visibility_channel ON public.product_channel_visibility(channel_id, status, sort_order);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_channel_visibility ENABLE ROW LEVEL SECURITY;

-- Public network reads. Writes should go through service-role API routes until full
-- Supabase Auth membership claims are wired into the frontend.
DROP POLICY IF EXISTS "Public read active organizations" ON public.organizations;
CREATE POLICY "Public read active organizations" ON public.organizations
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Public read roles" ON public.tenant_roles;
CREATE POLICY "Public read roles" ON public.tenant_roles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members read own memberships" ON public.tenant_memberships;
CREATE POLICY "Members read own memberships" ON public.tenant_memberships
  FOR SELECT USING (LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS "Public read visible channels" ON public.marketplace_channels;
CREATE POLICY "Public read visible channels" ON public.marketplace_channels
  FOR SELECT USING (status = 'live' AND visibility IN ('public', 'featured'));

DROP POLICY IF EXISTS "Public read visible shared products" ON public.shared_products;
CREATE POLICY "Public read visible shared products" ON public.shared_products
  FOR SELECT USING (status = 'published' AND visibility IN ('network', 'featured'));

DROP POLICY IF EXISTS "Public read visible product channel mappings" ON public.product_channel_visibility;
CREATE POLICY "Public read visible product channel mappings" ON public.product_channel_visibility
  FOR SELECT USING (status IN ('visible', 'featured'));

NOTIFY pgrst, 'reload schema';
