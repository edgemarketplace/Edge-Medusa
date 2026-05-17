import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveSiteId } from '@/lib/marketplace'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  try {
    const { tenantId } = await params
    const siteId = await resolveSiteId(tenantId)

    if (!siteId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .neq('enabled', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ tenantId, siteId, products: data || [] })
  } catch (error: any) {
    console.error('Tenant products API error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to load tenant products' },
      { status: 500 },
    )
  }
}
