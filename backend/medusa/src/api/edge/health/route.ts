import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    ok: true,
    service: 'edge-medusa-backend',
    version: '0.1.0',
  })
}
