import { NextResponse } from 'next/server'
import { loadMarketplaceData } from '@/lib/marketplace'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await loadMarketplaceData({ storeLimit: 100, productLimit: 0, channelLimit: 100 })
    return NextResponse.json({
      stores: data.stores,
      channels: data.channels,
      source: data.source,
      warning: data.warning || null,
    })
  } catch (error: any) {
    console.error('Marketplace stores API error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to load marketplace stores' },
      { status: 500 },
    )
  }
}
