import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'
import { getPrintifyProducts, mapPrintifyToInventory } from '@/lib/printify'

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

    // 3. Map to inventory format
    const newItems = printifyProducts.map(mapPrintifyToInventory)

    // 4. Update inventory in DB
    // First, get current inventory
    const { data: currentInventory, error: invError } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('site_id', siteId)

    if (invError) throw invError

    // We'll append new items that don't exist by Printify ID,
    // but for simplicity in this MVP, we'll just clear and re-sync
    // OR we can just return the new list and let the client save it.
    // Let's actually save it here to make it a true "Sync".

    // Option: Upsert by Printify ID
    const existingByPrintify = new Map(
      (currentInventory || []).filter((i: any) => i.printify_id).map((i: any) => [i.printify_id, i])
    )

    const upserts = newItems.map((item: any) => {
      const existing = existingByPrintify.get(item.printify_id)
      if (existing) {
        return { ...existing, ...item, id: existing.id, site_id: siteId }
      }
      return { ...item, site_id: siteId }
    })

    if (upserts.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('inventory')
        .upsert(upserts)

      if (upsertError) throw upsertError
    }

    return NextResponse.json({
      success: true,
      synced: upserts.length,
      products: newItems,
    })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Printify sync error:', error)
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 })
  }
}
