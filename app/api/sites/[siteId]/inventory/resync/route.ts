import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireCapability } from '@/lib/auth-server'
import { reconcileMedusaInventorySync, syncInventoryToMedusa } from '@/lib/medusa/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireCapability(request, siteId, 'inventory:manage')

    const body = await request.json().catch(() => ({}))
    const itemIds = Array.isArray(body?.itemIds)
      ? body.itemIds.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
      : []

    let query = supabaseAdmin
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: true })

    if (itemIds.length > 0) {
      query = query.in('id', itemIds)
    }

    const { data: rows, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No inventory rows found to sync' }, { status: 404 })
    }

    const result = await syncInventoryToMedusa(siteId, rows)
    await reconcileMedusaInventorySync(siteId, rows, result)

    const { data: refreshedRows, error: refreshedError } = await supabaseAdmin
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: true })

    if (refreshedError) {
      return NextResponse.json({ error: refreshedError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      requested: rows.length,
      created: result.mappings?.filter((mapping) => mapping.status === 'created').length || 0,
      updated: result.mappings?.filter((mapping) => mapping.status === 'updated').length || 0,
      existing: result.mappings?.filter((mapping) => mapping.status === 'existing').length || 0,
      stale: result.mappings?.filter((mapping) => mapping.status === 'stale').length || 0,
      skipped: Boolean(result.skipped),
      reason: result.reason || null,
      items: refreshedRows || [],
    })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to resync inventory to Medusa' },
      { status: 500 }
    )
  }
}
