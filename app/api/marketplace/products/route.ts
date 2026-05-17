import { NextResponse } from 'next/server'
import { loadMarketplaceData } from '@/lib/marketplace'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await loadMarketplaceData({ storeLimit: 100, productLimit: 100, channelLimit: 100 })
    const siteById = new Map(data.stores.map(site => [site.id, site]))

    return NextResponse.json({
      products: data.products.map(product => ({
        ...product,
        store: siteById.get(product.site_id) || null,
      })),
      source: data.source,
      warning: data.warning || null,
    })
  } catch (error: any) {
    console.error('Marketplace products API error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to load marketplace products' },
      { status: 500 },
    )
  }
}
