import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireCapability } from '@/lib/auth-server'
import { Events } from '@/lib/events'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireCapability(request, siteId, 'site:publish')

    // Update site to published
    const { data, error } = await supabaseAdmin
      .from('sites')
      .update({
        published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId)
      .select('business_name, organization_id')
      .single()

    if (error) {
      console.error('Approve error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Emit domain event
    await Events.published(siteId, data.business_name, data.organization_id)

    // Redirect back to publications page
    return NextResponse.redirect(new URL('/backend/publications', request.url))
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('Approve route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
