import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireCapability } from '@/lib/auth-server'
import { reconcileMedusaInventorySync, syncInventoryToMedusa } from '@/lib/medusa/client'
import { upsertInventoryCatalog } from '@/lib/inventory/catalog'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireCapability(request, siteId, 'inventory:manage')

    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items must be an array' }, { status: 400 })
    }

    const rows = await upsertInventoryCatalog(siteId, items, { replaceMissing: true })

    // Sync catalog to Medusa when the backend is configured. This is intentionally
    // non-blocking so the builder stays usable if Medusa is offline during setup.
    try {
      const medusaResult = await syncInventoryToMedusa(siteId, rows)
      await reconcileMedusaInventorySync(siteId, rows, medusaResult)
    } catch (error: any) {
      console.error('Medusa inventory sync failed:', error?.message || error)
    }

    const { data: refreshedRows } = await supabaseAdmin
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: true })

    return NextResponse.json(refreshedRows || rows)
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Inventory error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireCapability(request, siteId, 'inventory:manage')

    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Inventory GET error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Inventory GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}
