import { NextRequest, NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/auth-server'
import { loadMarketplaceData } from '@/lib/marketplace'
import { supabaseAdmin } from '@/lib/supabase'
import { Events } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await loadMarketplaceData({ storeLimit: 100, productLimit: 0, channelLimit: 100 })
    return NextResponse.json({
      channels: data.channels,
      source: data.source,
      warning: data.warning || null,
    })
  } catch (error: any) {
    console.error('Channels GET error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to load channels' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const siteId = String(body.siteId || '')

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
    }

    const { site } = await requireSiteAdmin(request, siteId)
    const slug = String(body.slug || site.subdomain || site.id).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')

    const { data, error } = await supabaseAdmin
      .from('marketplace_channels')
      .upsert({
        organization_id: site.organization_id || null,
        site_id: siteId,
        name: body.name || site.business_name || 'Tenant channel',
        slug,
        type: body.type || 'storefront',
        status: body.status || 'draft',
        visibility: body.visibility || 'public',
        description: body.description || '',
        metadata: body.metadata || {},
      }, { onConflict: 'slug' })
      .select()
      .single()

    if (error) throw error

    // Emit domain event
    await Events.channelVisibilityUpdated(siteId, data.slug, data.visibility === 'public')

    return NextResponse.json({ channel: data })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Channels POST error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to save channel' },
      { status: 500 },
    )
  }
}
