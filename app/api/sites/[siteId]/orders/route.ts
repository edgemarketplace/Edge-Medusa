import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Orders API error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normalize to a clean UI format
    const normalized = (orders || []).map(o => ({
      id: o.id,
      status: o.status,
      customerEmail: o.customer_email,
      customerName: o.customer_name,
      total: (o.total_cents || 0) / 100,
      currency: (o.currency || 'usd').toUpperCase(),
      date: o.created_at,
      items: (o.order_items || []).map((it: any) => ({
        name: it.name,
        quantity: it.quantity,
        price: (it.price_cents || 0) / 100,
      })),
      stripeSessionId: o.stripe_session_id,
      shippingAddress: o.shipping_address,
    }))

    return NextResponse.json({ orders: normalized })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Orders API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Update order status (e.g., mark as shipped)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('site_id', siteId)

    if (error) {
      console.error('Order update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Orders API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
