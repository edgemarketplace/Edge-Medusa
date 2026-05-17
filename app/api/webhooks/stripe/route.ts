import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripeInstance
}

// Stripe webhook handler — reliable order creation when success page misses
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('stripe-signature') || ''

    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event: Stripe.Event

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else {
      // Fail closed in production: never accept unsigned webhooks
      if (process.env.NODE_ENV === 'production') {
        console.error('STRIPE_WEBHOOK_SECRET not set in production — rejecting webhook')
        return NextResponse.json(
          { error: 'Webhook configuration error: STRIPE_WEBHOOK_SECRET missing' },
          { status: 500 }
        )
      }
      // Only allow unsigned in local dev
      event = JSON.parse(payload)
      console.warn('STRIPE_WEBHOOK_SECRET not set — webhook not verified (dev mode only)')
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const siteId = session.metadata?.site_id
      if (!siteId) {
        console.error('No site_id in session metadata')
        return NextResponse.json({ ok: true })
      }

      // Check if order already exists
      const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ ok: true, orderId: existing.id, duplicate: true })
      }

      // Fetch line items
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

      const subtotal = lineItems.data
        .filter(li => li.description !== 'Shipping')
        .reduce((sum, li) => sum + (li.amount_subtotal || 0), 0)
      const shipping = lineItems.data
        .filter(li => li.description === 'Shipping')
        .reduce((sum, li) => sum + (li.amount_subtotal || 0), 0)

      // Create order
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          site_id: siteId,
          status: 'paid',
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          customer_email: session.customer_details?.email || session.customer_email || '',
          customer_name: session.customer_details?.name || '',
          shipping_address: session.customer_details?.address || null,
          subtotal_cents: subtotal,
          shipping_cents: shipping,
          total_cents: session.amount_total || 0,
          currency: session.currency || 'usd',
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
      }

      // Create order items
      const orderItems = lineItems.data
        .filter(li => li.description !== 'Shipping')
        .map(li => ({
          order_id: order.id,
          name: li.description || 'Unknown item',
          quantity: li.quantity || 1,
          price_cents: li.amount_subtotal || 0,
          total_cents: li.amount_total || 0,
        }))

      if (orderItems.length > 0) {
        const { error: itemsError } = await supabaseAdmin
          .from('order_items')
          .insert(orderItems)

        if (itemsError) {
          console.error('Order items creation error:', itemsError)
        }
      }

      // Send confirmation emails
      try {
        // Fetch site to get contact email and business name
        const { data: site } = await supabaseAdmin
          .from('sites')
          .select('business_name, contact_email')
          .eq('id', siteId)
          .single()

        const businessName = site?.business_name || 'Your Store'
        const merchantEmail = site?.contact_email
        const orderTotal = ((order.total_cents || 0) / 100).toFixed(2)
        const currency = (order.currency || 'usd').toUpperCase()

        const orderItems = lineItems.data
          .filter(li => li.description !== 'Shipping')
          .map(li => ({
            name: li.description || 'Unknown item',
            quantity: li.quantity || 1,
            price: ((li.amount_total || 0) / 100).toFixed(2),
          }))

        const { sendOrderNotificationEmail, sendCustomerOrderConfirmationEmail } =
          await import('@/lib/email')

        if (merchantEmail) {
          await sendOrderNotificationEmail({
            to: merchantEmail,
            businessName,
            orderId: order.id,
            items: orderItems,
            total: `${currency} ${orderTotal}`,
            customerEmail: order.customer_email || '',
          })
        }

        if (order.customer_email) {
          await sendCustomerOrderConfirmationEmail({
            to: order.customer_email,
            businessName,
            orderId: order.id,
            items: orderItems,
            total: `${currency} ${orderTotal}`,
          })
        }
      } catch (emailErr) {
        console.error('Confirmation email failed:', emailErr)
      }

      return NextResponse.json({ ok: true, orderId: order.id })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 })
  }
}
