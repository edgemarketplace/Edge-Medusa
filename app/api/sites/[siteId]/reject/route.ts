import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireCapability, AuthError } from '@/lib/auth-server'
import { Events } from '@/lib/events'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireCapability(request, siteId, 'site:publish')
    
    // Read reason from form data or JSON
    let reason = ''
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}))
      reason = body.reason || ''
    } else {
      const formData = await request.formData()
      reason = (formData.get('reason') as string) || ''
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    // Update site back to draft
    const { data, error } = await supabaseAdmin
      .from('sites')
      .update({
        published: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId)
      .select('business_name')
      .single()

    if (error) {
      console.error('Reject error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Emit domain event with rejection reason
    await Events.rejected(siteId, data.business_name, reason)

    // Redirect back to publications page
    return NextResponse.redirect(new URL('/backend/publications', request.url))
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('Reject route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
