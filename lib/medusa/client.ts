type MedusaSyncItem = {
  id?: string
  name: string
  description?: string
  price?: string | number
  image_url?: string
  sku?: string
  stock?: number | null
  enabled?: boolean
  variants?: unknown
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

export function isMedusaEnabled() {
  return getMedusaConfig().enabled
}

export async function syncInventoryToMedusa(siteId: string, items: MedusaSyncItem[]) {
  const { url, secret, enabled } = getMedusaConfig()
  if (!enabled || !url || !secret) {
    return { skipped: true, reason: 'MEDUSA_BACKEND_URL and EDGE_MEDUSA_SHARED_SECRET are not configured' }
  }

  const response = await fetch(`${url}/edge/sites/${siteId}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ items }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `Medusa product sync failed with ${response.status}`)
  }

  return payload
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
