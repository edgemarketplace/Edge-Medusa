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

    // Retrieve the checkout session to get the payment intent
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.payment_intent) {
      return NextResponse.json({ error: 'No payment intent found' }, { status: 400 });
    }

    // Get the payment intent with client secret
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
    });
  } catch (error: any) {
    console.error('Checkout confirm error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm checkout' },
      { status: 500 }
    );
  }
}
