import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'
import { getPrintifyProducts } from '@/lib/printify'
import { upsertInventoryCatalog } from '@/lib/inventory/catalog'
import { mapPrintifyProductToCatalog } from '@/lib/inventory/source-mappers'
import { reconcileMedusaInventorySync, syncInventoryToMedusa } from '@/lib/medusa/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    // 1. Fetch site config
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const apiKey = (site as any).printify_api_key
    const shopId = (site as any).printify_shop_id

    if (!apiKey || !shopId) {
      return NextResponse.json({ error: 'Printify not configured' }, { status: 400 })
    }

    // 2. Fetch products from Printify
    const printifyProducts = await getPrintifyProducts(apiKey, shopId)

    // 3. Normalize into the master catalog and upsert into inventory_items
    const catalogDrafts = printifyProducts.map((product) =>
      mapPrintifyProductToCatalog(product, shopId),
    )

    const rows = await upsertInventoryCatalog(siteId, catalogDrafts)

    try {
      const medusaResult = await syncInventoryToMedusa(siteId, rows)
      await reconcileMedusaInventorySync(siteId, rows, medusaResult)
    } catch (error: any) {
      console.error('Medusa inventory sync failed after Printify import:', error?.message || error)
    }

    return NextResponse.json({
      success: true,
      synced: rows.length,
      products: rows,
    })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Printify sync error:', error)
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 })
  }
}
