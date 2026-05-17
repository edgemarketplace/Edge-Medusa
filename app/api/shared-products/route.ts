import { NextRequest, NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/auth-server'
import { loadMarketplaceData } from '@/lib/marketplace'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await loadMarketplaceData({ storeLimit: 100, productLimit: 100, channelLimit: 100 })
    return NextResponse.json({
      products: data.products,
      source: data.source,
      warning: data.warning || null,
    })
  } catch (error: any) {
    console.error('Shared products GET error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to load shared products' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const siteId = String(body.siteId || '')
    const productId = String(body.productId || '')
    const visibility = body.visibility === 'featured' ? 'featured' : 'network'
    const status = body.optIn === false ? 'paused' : 'published'

    if (!siteId || !productId) {
      return NextResponse.json({ error: 'siteId and productId are required' }, { status: 400 })
    }

    const { site } = await requireSiteAdmin(request, siteId)

    const { data: product, error: productError } = await supabaseAdmin
      .from('inventory_items')
      .select('id, site_id')
      .eq('id', productId)
      .eq('site_id', siteId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found for this tenant' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('shared_products')
      .upsert({
        organization_id: site.organization_id || null,
        site_id: siteId,
        inventory_item_id: productId,
        status,
        visibility,
        title_override: body.titleOverride || null,
        description_override: body.descriptionOverride || null,
        merchandising: body.merchandising || {},
      }, { onConflict: 'site_id,inventory_item_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ sharedProduct: data })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Shared products POST error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update shared product' },
      { status: 500 },
    )
  }
}
