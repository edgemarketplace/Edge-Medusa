import { supabaseAdmin } from './supabase'

export type MarketplaceStore = {
  id: string
  organization_id: string | null
  business_name: string | null
  subdomain: string | null
  status: string | null
  business_type: string | null
  tagline: string | null
  offerings: string | null
  channel_type?: string | null
  marketplace_visibility?: string | null
  shared_catalog_enabled?: boolean | null
  created_at: string | null
}

export type MarketplaceProduct = {
  id: string
  shared_product_id?: string | null
  site_id: string
  organization_id?: string | null
  inventory_item_id?: string | null
  name: string | null
  price: string | null
  description: string | null
  image_url: string | null
  category: string | null
  enabled: boolean | null
  stock: number | null
  status?: string | null
  visibility?: string | null
  created_at: string | null
}

export type MarketplaceChannel = {
  id: string
  organization_id: string | null
  site_id: string | null
  name: string
  slug: string
  type: string
  status: string
  visibility: string
  description: string | null
  created_at: string | null
}

export type MarketplaceLoadResult = {
  stores: MarketplaceStore[]
  products: MarketplaceProduct[]
  channels: MarketplaceChannel[]
  source: 'network_schema' | 'legacy_tables'
  warning?: string
}

function isMissingTableError(error: any, table: string) {
  const message = String(error?.message || error?.details || '')
  return error?.code === '42P01'
    || error?.code === 'PGRST205'
    || message.includes(`'${table}'`)
    || message.includes(`public.${table}`)
    || message.toLowerCase().includes(`table ${table}`)
}

export function siteUrl(site: Pick<MarketplaceStore, 'id' | 'subdomain'>) {
  return `/store/${site.subdomain || site.id}`
}

export function formatStoreType(type: string | null | undefined) {
  return (type || 'commerce').replace(/-/g, ' ')
}

export async function loadMarketplaceStores(limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('sites')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []) as MarketplaceStore[]
}

export async function loadMarketplaceChannels(limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('marketplace_channels')
    .select('*')
    .in('visibility', ['public', 'featured'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []) as MarketplaceChannel[]
}

async function loadLegacyProducts(limit = 100) {
  const { data, error } = await supabaseAdmin
    .from('inventory_items')
    .select('*')
    .neq('enabled', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []) as MarketplaceProduct[]
}

export async function loadSharedProducts(limit = 100) {
  const sharedResult = await supabaseAdmin
    .from('shared_products')
    .select('*')
    .eq('status', 'published')
    .in('visibility', ['network', 'featured'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (sharedResult.error) throw sharedResult.error

  const sharedRows = sharedResult.data || []
  if (!sharedRows.length) return []

  const productIds = sharedRows.map((row: any) => row.inventory_item_id).filter(Boolean)
  const { data: inventoryRows, error: inventoryError } = await supabaseAdmin
    .from('inventory_items')
    .select('*')
    .in('id', productIds)

  if (inventoryError) throw inventoryError

  const inventoryById = new Map((inventoryRows || []).map((item: any) => [item.id, item]))

  return sharedRows
    .map((shared: any) => {
      const product: any = inventoryById.get(shared.inventory_item_id)
      if (!product) return null

      return {
        id: product.id,
        shared_product_id: shared.id,
        site_id: product.site_id || shared.site_id,
        organization_id: shared.organization_id,
        inventory_item_id: shared.inventory_item_id,
        name: shared.title_override || product.name || null,
        price: product.price || null,
        description: shared.description_override || product.description || null,
        image_url: product.image_url || null,
        category: product.category || null,
        enabled: product.enabled ?? true,
        stock: product.stock ?? null,
        status: shared.status,
        visibility: shared.visibility,
        created_at: shared.created_at || product.created_at || null,
      } as MarketplaceProduct
    })
    .filter((product): product is MarketplaceProduct => Boolean(product))
}

export async function loadMarketplaceData(options: { storeLimit?: number; productLimit?: number; channelLimit?: number } = {}): Promise<MarketplaceLoadResult> {
  const storeLimit = options.storeLimit ?? 50
  const productLimit = options.productLimit ?? 100
  const channelLimit = options.channelLimit ?? 50

  const stores = await loadMarketplaceStores(storeLimit)

  try {
    const [channels, products] = await Promise.all([
      loadMarketplaceChannels(channelLimit),
      loadSharedProducts(productLimit),
    ])

    return {
      stores,
      channels,
      products,
      source: 'network_schema',
    }
  } catch (error: any) {
    if (!isMissingTableError(error, 'shared_products') && !isMissingTableError(error, 'marketplace_channels')) {
      throw error
    }

    const products = await loadLegacyProducts(productLimit)
    return {
      stores,
      products,
      channels: stores.map(site => ({
        id: site.id,
        organization_id: site.organization_id || null,
        site_id: site.id,
        name: site.business_name || 'Untitled tenant',
        slug: site.subdomain || site.id,
        type: site.channel_type || 'storefront',
        status: site.status === 'live' ? 'live' : 'draft',
        visibility: site.marketplace_visibility || 'public',
        description: site.tagline || site.offerings || null,
        created_at: site.created_at,
      })),
      source: 'legacy_tables',
      warning: 'Network schema is not applied yet; falling back to sites + inventory_items.',
    }
  }
}

export async function resolveSiteId(tenantId: string) {
  const { data: directSite } = await supabaseAdmin
    .from('sites')
    .select('id')
    .eq('id', tenantId)
    .maybeSingle()

  if (directSite?.id) return directSite.id as string

  const { data: subdomainSite } = await supabaseAdmin
    .from('sites')
    .select('id')
    .eq('subdomain', tenantId)
    .maybeSingle()

  if (subdomainSite?.id) return subdomainSite.id as string

  try {
    const { data: channel, error } = await supabaseAdmin
      .from('marketplace_channels')
      .select('site_id')
      .eq('slug', tenantId)
      .maybeSingle()

    if (error && isMissingTableError(error, 'marketplace_channels')) return null
    if (error) throw error

    return (channel?.site_id as string | undefined) || null
  } catch (error: any) {
    if (isMissingTableError(error, 'marketplace_channels')) return null
    throw error
  }
}
