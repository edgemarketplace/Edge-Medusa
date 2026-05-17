import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { assertEdgeSecret } from '../../../../../lib/edge-auth'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    assertEdgeSecret(req)
    const siteId = req.params.site_id
    const query = req.scope.resolve('query')

    const { data: orders } = await query.graph({
      entity: 'order',
      fields: [
        'id',
        'display_id',
        'status',
        'email',
        'currency_code',
        'total',
        'created_at',
        'items.*',
        'metadata',
      ],
      filters: {
        metadata: { edge_site_id: siteId },
      },
    })

    res.json({ ok: true, siteId, orders })
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to list orders' })
  }
}
