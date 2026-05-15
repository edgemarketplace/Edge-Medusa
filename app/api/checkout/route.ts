import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, items } = body;

    if (!siteId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'siteId and items array required' }, { status: 400 });
    }

    // Get the site to find the connected Stripe account
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('stripe_account_id, business_name')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (!site.stripe_account_id) {
      return NextResponse.json({ error: 'Stripe not connected for this site' }, { status: 400 });
    }

    // Build line items for Stripe Checkout
    const lineItems = items.map((item: any) => {
      const rawPrice = String(item.price).replace(/[^0-9.]/g, '');
      const unitAmount = Math.round(parseFloat(rawPrice) * 100);
      if (!unitAmount || unitAmount <= 0) {
        throw new Error(`Invalid price for item "${item.name}": ${item.price}`);
      }
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description || undefined,
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity || 1,
      };
    });

    // Create a Checkout Session on the connected account
    const session = await stripe.checkout.sessions.create(
      {
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/store/${siteId}?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/store/${siteId}?canceled=true`,
        payment_intent_data: {
          application_fee_amount: Math.round(lineItems.reduce((sum, li) => sum + (li.price_data!.unit_amount * li.quantity), 0) * 0.05), // 5% platform fee
        },
      },
      {
        stripeAccount: site.stripe_account_id,
      }
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}
