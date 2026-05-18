import crypto from 'node:crypto'
import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { createProductsWorkflow, updateProductsWorkflow } from '@medusajs/medusa/core-flows'
import { assertEdgeSecret } from '../../../../../lib/edge-auth'
import { EdgeInventoryItem, toMedusaProductInput, toMedusaProductUpdate } from '../../../../../lib/edge-mappers'

type SyncBody = {
  items?: EdgeInventoryItem[]
}

type ProductGraphRow = {
  id: string
  title?: string
  handle?: string
  metadata?: Record<string, any> | null
  variants?: Array<{ id: string }> | null
}

function buildSyncHash(item: EdgeInventoryItem) {
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

export async function POST(req: MedusaRequest<SyncBody>, res: MedusaResponse) {
  try {
    assertEdgeSecret(req)
    const siteId = req.params.site_id
    const items = Array.isArray(req.body?.items) ? req.body.items : []

    if (!siteId) {
      return res.status(400).json({ error: 'site_id is required' })
    }

    if (!items.length) {
      return res.status(400).json({ error: 'items array is required' })
    }

    const query = req.scope.resolve('query')
    const { data: existingProducts } = await query.graph({
      entity: 'product',
      fields: ['id', 'title', 'handle', 'metadata', 'variants.id'],
      filters: {
        metadata: { edge_site_id: siteId },
      },
    })

    const existingByInventoryId = new Map<string, ProductGraphRow>()
    for (const product of (existingProducts || []) as ProductGraphRow[]) {
      const inventoryId = typeof product.metadata?.edge_inventory_id === 'string'
        ? product.metadata.edge_inventory_id
        : null
      if (inventoryId) existingByInventoryId.set(inventoryId, product)
    }

    const normalizedItems = items.filter((item: EdgeInventoryItem) => item?.name?.trim())
    const toCreate: EdgeInventoryItem[] = []
    const toUpdate: Array<{ medusaProductId: string; item: EdgeInventoryItem; syncHash: string }> = []
    const mappings: Array<{
      inventory_id: string
      medusa_product_id: string | null
      medusa_variant_ids: string[]
      status: 'created' | 'updated' | 'existing' | 'stale'
      handle?: string
      sync_hash: string
      reason?: string
    }> = []

    for (const item of normalizedItems) {
      const inventoryId = item.id || item.sku || item.name
      const syncHash = buildSyncHash(item)
      const existing = existingByInventoryId.get(inventoryId)

      if (!existing) {
        toCreate.push({ ...item, sync_hash: syncHash })
        continue
      }

      const existingHash = typeof existing.metadata?.edge_sync_hash === 'string'
        ? existing.metadata.edge_sync_hash
        : null

      if (!existingHash || existingHash !== syncHash) {
        toUpdate.push({ medusaProductId: existing.id, item: { ...item, sync_hash: syncHash }, syncHash })
        continue
      }

      mappings.push({
        inventory_id: inventoryId,
        medusa_product_id: existing.id,
        medusa_variant_ids: Array.isArray(existing.variants) ? existing.variants.map((variant) => variant.id) : [],
        status: 'existing',
        handle: existing.handle,
        sync_hash: syncHash,
      })
    }

    let created: Array<{ id: string; handle: string; metadata?: Record<string, any>; variants?: Array<{ id: string }> }> = []
    if (toCreate.length > 0) {
      const products = toCreate.map((item) => toMedusaProductInput(siteId, item))
      const { result } = await createProductsWorkflow(req.scope).run({ input: { products } })
      created = result as typeof created
    }

    let updated: Array<{ id: string; handle: string; metadata?: Record<string, any>; variants?: Array<{ id: string }> }> = []
    if (toUpdate.length > 0) {
      const products = toUpdate.map(({ medusaProductId, item }) => toMedusaProductUpdate(siteId, medusaProductId, item))
      const { result } = await updateProductsWorkflow(req.scope).run({ input: { products } })
      updated = result as typeof updated
    }

    for (const product of created) {
      const inventoryId = typeof product.metadata?.edge_inventory_id === 'string' ? product.metadata.edge_inventory_id : null
      const syncHash = typeof product.metadata?.edge_sync_hash === 'string' ? product.metadata.edge_sync_hash : ''
      if (!inventoryId) continue
      mappings.push({
        inventory_id: inventoryId,
        medusa_product_id: product.id,
        medusa_variant_ids: Array.isArray(product.variants) ? product.variants.map((variant) => variant.id) : [],
        status: 'created',
        handle: product.handle,
        sync_hash: syncHash,
      })
    }

    for (const product of updated) {
      const inventoryId = typeof product.metadata?.edge_inventory_id === 'string' ? product.metadata.edge_inventory_id : null
      const syncHash = typeof product.metadata?.edge_sync_hash === 'string' ? product.metadata.edge_sync_hash : ''
      if (!inventoryId) continue
      mappings.push({
        inventory_id: inventoryId,
        medusa_product_id: product.id,
        medusa_variant_ids: Array.isArray(product.variants) ? product.variants.map((variant) => variant.id) : [],
        status: 'updated',
        handle: product.handle,
        sync_hash: syncHash,
      })
    }

    res.json({
      ok: true,
      siteId,
      count: mappings.length,
      created_count: mappings.filter((mapping) => mapping.status === 'created').length,
      updated_count: mappings.filter((mapping) => mapping.status === 'updated').length,
      existing_count: mappings.filter((mapping) => mapping.status === 'existing').length,
      stale_count: mappings.filter((mapping) => mapping.status === 'stale').length,
      mappings,
      products: mappings.map((mapping) => ({
        id: mapping.medusa_product_id,
        handle: mapping.handle,
        inventory_id: mapping.inventory_id,
        status: mapping.status,
      })),
    })
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to sync products' })
  }
}
