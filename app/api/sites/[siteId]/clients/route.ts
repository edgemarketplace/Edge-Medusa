import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('stripe_account_id')
      .eq('id', siteId)
      .single()

    if (siteError || !site?.stripe_account_id) {
      return NextResponse.json({ clients: [] })
    }

    const stripe = getStripe()

    // Fetch customers from the connected account
    const stripeCustomers = await stripe.customers.list(
      { limit: 50 },
      { stripeAccount: site.stripe_account_id }
    )

    const clients = stripeCustomers.data.map(c => ({
      id: c.id,
      name: c.name || 'Anonymous',
      email: c.email,
      created: new Date(c.created * 1000).toISOString(),
    }))

    return NextResponse.json({ clients })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Clients API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
