import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { createProductsWorkflow } from '@medusajs/medusa/core-flows'
import { assertEdgeSecret } from '../../../../../lib/edge-auth'
import { EdgeInventoryItem, toMedusaProductInput } from '../../../../../lib/edge-mappers'

type SyncBody = {
  items?: EdgeInventoryItem[]
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

    const products = items
      .filter((item) => item?.name?.trim())
      .map((item) => toMedusaProductInput(siteId, item))

    const { result } = await createProductsWorkflow(req.scope).run({
      input: { products },
    })

    res.json({
      ok: true,
      siteId,
      count: result.length,
      products: result.map((product) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
      })),
    })
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to sync products' })
  }
}
