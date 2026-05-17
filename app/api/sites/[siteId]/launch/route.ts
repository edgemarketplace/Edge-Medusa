import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    // Safely parse JSON body (may be empty)
    let body = {}
    try {
      const text = await request.text()
      if (text) body = JSON.parse(text)
    } catch {
      // Ignore JSON parse errors, use empty object
    }

    const {
      platform_fee_pct,
      stripe_fee_pct,
      tax_rate,
      shipping_rate,
      shipping_handling,
    } = body as any

    const updates: any = { status: 'live' }

    if (platform_fee_pct !== undefined) {
      if (platform_fee_pct < 0 || platform_fee_pct > 100) {
        return NextResponse.json({ error: 'Platform fee must be between 0 and 100' }, { status: 400 })
      }
      updates.platform_fee_pct = platform_fee_pct
    }

    if (stripe_fee_pct !== undefined) {
      if (stripe_fee_pct < 0 || stripe_fee_pct > 100) {
        return NextResponse.json({ error: 'Stripe fee must be between 0 and 100' }, { status: 400 })
      }
      updates.stripe_fee_pct = stripe_fee_pct
    }

    if (tax_rate !== undefined) {
      if (tax_rate < 0 || tax_rate > 100) {
        return NextResponse.json({ error: 'Tax rate must be between 0 and 100' }, { status: 400 })
      }
      updates.tax_rate = tax_rate
    }

    if (shipping_rate !== undefined) {
      if (typeof shipping_rate !== 'number' || shipping_rate < 0) {
        return NextResponse.json({ error: 'Shipping rate must be a non-negative number' }, { status: 400 })
      }
      updates.shipping_rate = shipping_rate
    }

    if (shipping_handling !== undefined) {
      if (typeof shipping_handling !== 'number' || shipping_handling < 0) {
        return NextResponse.json({ error: 'Shipping handling must be a non-negative number' }, { status: 400 })
      }
      updates.shipping_handling = shipping_handling
    }

    const { data, error } = await supabaseAdmin
      .from('sites')
      .update(updates)
      .eq('id', siteId)
      .select()
      .single()

    if (error) {
      console.error('Launch error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to launch site' },
        { status: 500 }
      )
    }

    // Send welcome email
    try {
      if (data?.contact_email && process.env.RESEND_API_KEY) {
        const { sendWelcomeEmail } = await import('@/lib/email')
        await sendWelcomeEmail({
          to: data.contact_email,
          businessName: data.business_name,
          buildUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.edgemarketplacehub.com'}/build/${data.id}`,
          isLive: true,
        })
      }
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr)
    }

    return NextResponse.json({
      siteId: data?.id || siteId,
      subdomain: data?.subdomain,
      url: data?.subdomain
        ? `https://${data.subdomain}.edgemarketplacehub.com`
        : `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.edgemarketplacehub.com'}/store/${data?.id || siteId}`,
      published: true,
    })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Launch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to launch site' },
      { status: 500 }
    )
  }
}
