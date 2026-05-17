export type EdgeInventoryItem = {
  id?: string
  name: string
  description?: string
  price?: string | number
  image_url?: string
  sku?: string
  stock?: number | null
  enabled?: boolean
  variants?: Array<{ name?: string; value?: string }> | null
}

export function parseMoneyToCents(value: string | number | undefined): number {
  if (typeof value === 'number') return Math.round(value * 100)
  const parsed = Number(String(value || '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function toMedusaProductInput(siteId: string, item: EdgeInventoryItem) {
  const sku = item.sku || item.id || slugify(item.name)
  const amount = parseMoneyToCents(item.price)

  return {
    title: item.name,
    handle: `${siteId}-${slugify(item.name)}`,
    subtitle: item.sku || undefined,
    description: item.description || '',
    status: item.enabled === false ? 'draft' : 'published',
    images: item.image_url ? [{ url: item.image_url }] : [],
    metadata: {
      edge_site_id: siteId,
      edge_inventory_id: item.id || sku,
      source: 'edge-marketplace-hub',
    },
    options: [{ title: 'Default', values: ['Default'] }],
    variants: [
      {
        title: 'Default',
        sku,
        manage_inventory: item.stock != null,
        allow_backorder: false,
        options: { Default: 'Default' },
        prices: amount > 0 ? [{ amount, currency_code: 'usd' }] : [],
        metadata: {
          edge_stock: item.stock ?? null,
          edge_variants: item.variants || null,
        },
      },
    ],
  }
}
