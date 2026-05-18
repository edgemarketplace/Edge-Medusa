import { supabaseAdmin } from '@/lib/supabase'
import { Events } from '@/lib/events'
import type { InventoryCatalogInput, InventoryCatalogRow } from './types'
import { mergeCatalogDraft } from './source-mappers'

function normalizePrice(value: string | number | undefined) {
  if (typeof value === 'number') return value
  const cleaned = String(value || '').replace(/[^0-9.]/g, '')
  return cleaned || ''
}

function normalizeItem(siteId: string, item: InventoryCatalogInput): InventoryCatalogInput {
  return {
    ...item,
    site_id: siteId,
    name: item.name?.trim() || '',
    description: item.description || '',
    price: normalizePrice(item.price),
    image_url: item.image_url || null,
    category: item.category || '',
    sku: item.sku || null,
    stock: item.stock ?? null,
    variants: item.variants || null,
    enabled: item.enabled !== false,
    metadata: item.metadata || {},
    source_type: item.source_type || 'manual',
    source_refs: item.source_refs || {},
    sync_status: item.sync_status || 'idle',
    sync_error: item.sync_error ?? null,
    fulfillment_mode: item.fulfillment_mode || 'manual',
    pricing_mode: item.pricing_mode || 'manual',
    status: item.status || 'active',
    external_updated_at: item.external_updated_at || null,
    last_synced_at: item.last_synced_at || null,
  }
}

async function fetchExistingInventory(siteId: string) {
  const { data, error } = await supabaseAdmin
    .from('inventory_items')
    .select('*')
    .eq('site_id', siteId)

  if (error) throw error
  return (data || []) as InventoryCatalogRow[]
}

function findMatch(existing: InventoryCatalogRow[], item: InventoryCatalogInput) {
  const refs = item.source_refs || {}
  return existing.find((row) => {
    const existingRefs = (row.source_refs || {}) as Record<string, string>
    if (item.id && row.id === item.id) return true
    if (refs.printify_product_id && existingRefs.printify_product_id === refs.printify_product_id) return true
    if (refs.stripe_product_id && existingRefs.stripe_product_id === refs.stripe_product_id) return true
    if (item.sku && row.sku && row.sku === item.sku) return true
    return item.name?.trim() && row.name?.trim() === item.name.trim()
  })
}

export async function syncInventoryToSections(siteId: string, items: InventoryCatalogInput[]) {
  const activeItems = items.filter((i) => i.enabled !== false && i.name?.trim())
  if (activeItems.length === 0) return

  const { data: site, error } = await supabaseAdmin
    .from('sites')
    .select('template_data')
    .eq('id', siteId)
    .single()

  if (error || !site?.template_data?.pages) return

  const pages = site.template_data.pages as Array<{ slug: string; title: string; sections: any[] }>
  let updated = false

  const standardFormat = activeItems.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    price: item.price ? (String(item.price).startsWith('$') ? item.price : `$${item.price}`) : '',
    image_url: item.image_url || '',
    stock: item.stock ?? null,
    category: item.category || '',
    sku: item.sku || '',
    variants: item.variants || null,
  }))

  const packageFormat = activeItems.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    price: item.price ? (String(item.price).startsWith('$') ? item.price : `$${item.price}`) : '',
    image_url: item.image_url || '',
    stock: item.stock ?? null,
    features: item.variants?.map((variant) => `${variant.name}: ${variant.value}`) || [],
  }))

  const updatedPages = pages.map((page) => ({
    ...page,
    sections: page.sections.map((section) => {
      if (section.type === 'featured-collection') {
        updated = true
        return { ...section, data: { ...section.data, items: standardFormat.slice(0, 6) } }
      }
      if (section.type === 'product-grid') {
        updated = true
        return { ...section, data: { ...section.data, items: standardFormat } }
      }
      if (section.type === 'best-sellers') {
        updated = true
        return { ...section, data: { ...section.data, items: standardFormat.slice(0, 4) } }
      }
      if (section.type === 'collection-carousel') {
        updated = true
        return { ...section, data: { ...section.data, items: standardFormat } }
      }
      if (section.type === 'packages') {
        updated = true
        return { ...section, data: { ...section.data, items: packageFormat } }
      }
      return section
    }),
  }))

  if (!updated) return

  await supabaseAdmin
    .from('sites')
    .update({ template_data: { ...site.template_data, pages: updatedPages } })
    .eq('id', siteId)
}

export async function upsertInventoryCatalog(
  siteId: string,
  items: InventoryCatalogInput[],
  options: { replaceMissing?: boolean } = {},
) {
  const existing = await fetchExistingInventory(siteId)
  const payload = items
    .map((item) => normalizeItem(siteId, item))
    .filter((item) => item.name)
    .map((item) => {
      const match = findMatch(existing, item)
      const merged = mergeCatalogDraft(match, item)
      return match ? { ...merged, id: match.id, site_id: siteId } : { ...merged, site_id: siteId }
    })

  const keepIds = payload.map((item) => item.id).filter(Boolean)
  if (options.replaceMissing && keepIds.length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from('inventory_items')
      .delete()
      .eq('site_id', siteId)
      .not('id', 'in', `(${keepIds.map((id) => `"${id}"`).join(',')})`)

    if (deleteError) {
      console.error('Inventory prune error:', deleteError)
    }
  }

  if (payload.length === 0) {
    if (options.replaceMissing) {
      await supabaseAdmin.from('inventory_items').delete().eq('site_id', siteId)
    }
    return [] as InventoryCatalogRow[]
  }

  const { data, error } = await supabaseAdmin
    .from('inventory_items')
    .upsert(payload, { onConflict: 'id' })
    .select('*')

  if (error) throw error

  const rows = (data || []) as InventoryCatalogRow[]

  for (const row of rows) {
    const existed = existing.some((item) => item.id === row.id)
    if (existed) {
      await Events.productUpdated(siteId, row.id, { name: row.name, source_type: row.source_type })
    } else {
      await Events.productCreated(siteId, row.id, row.name)
    }
  }

  await syncInventoryToSections(siteId, rows)
  return rows
}
