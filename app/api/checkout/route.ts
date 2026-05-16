import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { sendOrderNotificationEmail, sendCustomerOrderConfirmationEmail } from '@/lib/email';

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
    const { siteId, items, customerEmail } = body;

    if (!siteId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'siteId and items array required' }, { status: 400 });
    }

    // Get the site
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('stripe_account_id, business_name, contact_email')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Build line items
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const totalAmount = lineItems.reduce((sum, li) => sum + (li.price_data!.unit_amount * li.quantity), 0);

    // Determine checkout mode
    const hasStripeConnected = !!site.stripe_account_id;
    const isTestMode = !hasStripeConnected;

    // Create checkout session
    const sessionConfig: any = {
      line_items: lineItems,
      mode: 'payment',
      success_url: `${appUrl}/checkout/success?site_id=${siteId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/canceled?site_id=${siteId}`,
      metadata: {
        site_id: siteId,
        business_name: site.business_name,
        customer_email: customerEmail || '',
        is_test_mode: isTestMode ? 'true' : 'false',
      },
      customer_email: customerEmail || undefined,
    };

    let session;
    const stripe = getStripe();
    if (hasStripeConnected) {
      // Real merchant Stripe account — use Connect
      session = await stripe.checkout.sessions.create(
        {
          ...sessionConfig,
          payment_intent_data: {
            application_fee_amount: Math.round(totalAmount * 0.05), // 5% platform fee
          },
        },
        { stripeAccount: site.stripe_account_id }
      );
    } else {
      // Test mode — use platform account directly
      session = await stripe.checkout.sessions.create(sessionConfig);
    }

    return NextResponse.json({
      url: session.url,
      testMode: isTestMode,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}

// Webhook handler for completed checkouts
export async function GET(request: NextRequest) {
  // Health check
  return NextResponse.json({ ok: true });
}
