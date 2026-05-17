import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, siteId } = body;

    if (!sessionId || !siteId) {
      return NextResponse.json({ error: 'sessionId and siteId required' }, { status: 400 });
    }

    const stripe = getStripe();

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.payment_intent) {
      return NextResponse.json({ error: 'No payment intent found' }, { status: 400 });
    }

    // Get the payment intent with client secret
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );

    // Get line items to reconstruct order items
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);

    // Check if order already exists
    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    let orderId = existing?.id;

    if (!orderId) {
      // Create order
      const subtotal = lineItems.data
        .filter(li => li.description !== 'Shipping')
        .reduce((sum, li) => sum + (li.amount_subtotal || 0), 0);
      const shipping = lineItems.data
        .filter(li => li.description === 'Shipping')
        .reduce((sum, li) => sum + (li.amount_subtotal || 0), 0);

      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          site_id: siteId,
          status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
          stripe_session_id: sessionId,
          stripe_payment_intent_id: paymentIntent.id,
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
        console.error('Order creation error:', orderError);
      } else {
        orderId = order.id;
        // Create order items
        const orderItems = lineItems.data
          .filter(li => li.description !== 'Shipping')
          .map(li => ({
            order_id: orderId,
            name: li.description || 'Item',
            price_cents: li.price?.unit_amount || 0,
            quantity: li.quantity || 1,
          }));

        if (orderItems.length > 0) {
          await supabaseAdmin.from('order_items').insert(orderItems);
        }
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      orderId,
      status: paymentIntent.status,
    });
  } catch (error: any) {
    console.error('Checkout confirm error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm checkout' },
      { status: 500 }
    );
  }
}
