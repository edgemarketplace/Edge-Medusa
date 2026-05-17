import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { sendOrderNotificationEmail, sendCustomerOrderConfirmationEmail } from '@/lib/email';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

// Stripe webhook handler — reliable order creation when success page misses
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      event = JSON.parse(payload);
      console.warn('STRIPE_WEBHOOK_SECRET not set — webhook not verified');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const siteId = session.metadata?.site_id;
      if (!siteId) {
        console.error('No site_id in session metadata');
        return NextResponse.json({ ok: true });
      }

      // Check if order already exists
      const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ ok: true, orderId: existing.id, duplicate: true });
      }

      // Fetch line items
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const subtotal = lineItems.data
        .filter(li => li.description !== 'Shipping')
        .reduce((sum, li) => sum + (li.amount_subtotal || 0), 0);
      const shipping = lineItems.data
        .filter(li => li.description === 'Shipping')
        .reduce((sum, li) => sum + (li.amount_subtotal || 0), 0);

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
        .single();

      if (orderError) {
        console.error('Webhook order creation error:', orderError);
        return NextResponse.json({ error: 'Order creation failed' }, { status: 500 });
      }

      // Create order items
      const orderItems = lineItems.data
        .filter(li => li.description !== 'Shipping')
        .map(li => ({
          order_id: order.id,
          name: li.description || 'Item',
          price_cents: li.price?.unit_amount || 0,
          quantity: li.quantity || 1,
        }));

      if (orderItems.length > 0) {
        await supabaseAdmin.from('order_items').insert(orderItems);
      }

      // Decrement stock
      for (const item of lineItems.data.filter(li => li.description !== 'Shipping')) {
        const { data: invItems } = await supabaseAdmin
          .from('inventory_items')
          .select('id, stock')
          .eq('site_id', siteId)
          .ilike('name', item.description || '');

        if (invItems && invItems.length > 0) {
          const inv = invItems[0];
          if (inv.stock != null && inv.stock > 0) {
            await supabaseAdmin
              .from('inventory_items')
              .update({ stock: Math.max(0, inv.stock - (item.quantity || 1)) })
              .eq('id', inv.id);
          }
        }
      }

      // Get site info for email
      const { data: site } = await supabaseAdmin
        .from('sites')
        .select('business_name, contact_email')
        .eq('id', siteId)
        .single();

      // Send emails (fire and forget)
      if (site) {
        const emailItems = lineItems.data
          .filter(li => li.description !== 'Shipping')
          .map(li => ({
            name: li.description || 'Item',
            quantity: li.quantity || 1,
            price: `$${((li.amount_subtotal || 0) / 100).toFixed(2)}`,
          }));
        const total = `$${((session.amount_total || 0) / 100).toFixed(2)}`;

        if (site.contact_email) {
          sendOrderNotificationEmail({
            to: site.contact_email,
            businessName: site.business_name,
            orderId: order.id,
            items: emailItems,
            total,
            customerEmail: session.customer_details?.email || session.customer_email || '',
          }).catch(err => console.error('Merchant email error:', err));
        }

        const customerEmail = session.customer_details?.email || session.customer_email;
        if (customerEmail) {
          sendCustomerOrderConfirmationEmail({
            to: customerEmail,
            businessName: site.business_name,
            orderId: order.id,
            items: emailItems,
            total,
          }).catch(err => console.error('Customer email error:', err));
        }
      }

      return NextResponse.json({ ok: true, orderId: order.id });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, handler: 'stripe-webhook' });
}
