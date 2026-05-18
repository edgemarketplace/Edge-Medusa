import crypto from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase'

type MedusaSyncItem = {
  id?: string
  name: string
  description?: string
  price?: string | number
  image_url?: string | null
  sku?: string | null
  stock?: number | null
  enabled?: boolean
  variants?: unknown
  metadata?: Record<string, any> | null
  source_refs?: Record<string, any> | null
  sync_status?: string | null
  sync_error?: string | null
}

type MedusaSyncResult = {
  ok?: boolean
  skipped?: boolean
  reason?: string
  mappings?: Array<{
    inventory_id: string
    medusa_product_id: string | null
    medusa_variant_ids: string[]
    status: 'created' | 'updated' | 'existing' | 'stale'
    sync_hash?: string
    reason?: string
  }>
}

function getMedusaConfig() {
  const url = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const secret = process.env.EDGE_MEDUSA_SHARED_SECRET
  return {
    url: url?.replace(/\/$/, ''),
    secret,
    enabled: process.env.EDGE_COMMERCE_BACKEND === 'medusa' || Boolean(url && secret),
  }
}

function buildSyncHash(item: MedusaSyncItem) {
  const stable = {
    name: item.name || '',
    description: item.description || '',
    price: item.price ?? '',
    image_url: item.image_url || '',
    sku: item.sku || '',
    stock: item.stock ?? null,
    enabled: item.enabled !== false,
    variants: item.variants || null,
  }

  return crypto.createHash('sha1').update(JSON.stringify(stable)).digest('hex')
}

export function isMedusaEnabled() {
  return getMedusaConfig().enabled
}

export async function syncInventoryToMedusa(siteId: string, items: MedusaSyncItem[]) {
  const { url, secret, enabled } = getMedusaConfig()
  if (!enabled || !url || !secret) {
    return { skipped: true, reason: 'MEDUSA_BACKEND_URL and EDGE_MEDUSA_SHARED_SECRET are not configured' }
  }

  const syncItems = items.map((item) => ({
    ...item,
    sync_hash: buildSyncHash(item),
  }))

  const response = await fetch(`${url}/edge/sites/${siteId}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ items: syncItems }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `Medusa product sync failed with ${response.status}`)
  }

  return payload as MedusaSyncResult
}

type MedusaInventorySyncUpdate = {
  id: string
  site_id: string
  source_refs: Record<string, any>
  sync_status: string
  sync_error: string | null
  last_synced_at: string
}

export async function reconcileMedusaInventorySync(siteId: string, items: MedusaSyncItem[], result: MedusaSyncResult) {
  if (!result?.mappings?.length) return result

  const rowById = new Map(items.filter((item) => item.id).map((item) => [item.id as string, item]))
  const updates: MedusaInventorySyncUpdate[] = result.mappings
    .map((mapping): MedusaInventorySyncUpdate | null => {
      const current = rowById.get(mapping.inventory_id)
      if (!current) return null

      return {
        id: mapping.inventory_id,
        site_id: siteId,
        source_refs: {
          ...(current.source_refs || {}),
          medusa_product_id: mapping.medusa_product_id,
          medusa_variant_ids: mapping.medusa_variant_ids || [],
        },
        sync_status: mapping.status === 'stale' ? 'error' : 'synced',
        sync_error: mapping.status === 'stale'
          ? mapping.reason || 'Medusa product is stale and needs an update workflow.'
          : null,
        last_synced_at: new Date().toISOString(),
      }
    })
    .filter((update): update is MedusaInventorySyncUpdate => Boolean(update))

  if (!updates.length) return result

  const { error } = await supabaseAdmin
    .from('inventory_items')
    .upsert(updates, { onConflict: 'id' })

  if (error) {
    console.error('Failed to persist Medusa sync refs:', error)
  }

  return result
}

export async function fetchMedusaOrders(siteId: string) {
  const { url, secret, enabled } = getMedusaConfig()
  if (!enabled || !url || !secret) {
    return { skipped: true, orders: [] }
  }

  const response = await fetch(`${url}/edge/sites/${siteId}/orders`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `Medusa order fetch failed with ${response.status}`)
  }
  return payload
}
