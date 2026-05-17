import type { MedusaRequest } from '@medusajs/framework/http'

export function assertEdgeSecret(req: MedusaRequest) {
  const expected = process.env.EDGE_MEDUSA_SHARED_SECRET
  if (!expected) {
    const err = new Error('EDGE_MEDUSA_SHARED_SECRET is not configured') as Error & { status?: number }
    err.status = 500
    throw err
  }

  const actual = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.headers['x-edge-medusa-secret']
  if (actual !== expected) {
    const err = new Error('Unauthorized') as Error & { status?: number }
    err.status = 401
    throw err
  }
}
