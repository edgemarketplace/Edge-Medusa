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
      .select('stripe_account_id, business_name, contact_email, shipping_rate')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Fetch inventory to validate stock and build line items
    const itemIds = items.map((it: any) => it.id).filter(Boolean);
    const { data: inventoryData } = await supabaseAdmin
      .from('inventory_items')
      .select('id, name, price, stock')
      .in('id', itemIds)
      .eq('site_id', siteId);

    const inventoryMap = new Map((inventoryData || []).map((i: any) => [i.id, i]));

    // Build line items with stock validation
    const lineItems = items.map((item: any) => {
      const inv = inventoryMap.get(item.id);
      if (inv && inv.stock != null && item.quantity > inv.stock) {
        throw new Error(`"${item.name}" only has ${inv.stock} in stock`);
      }
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
    const subtotal = lineItems.reduce((sum, li) => sum + (li.price_data!.unit_amount * li.quantity), 0);

    // Flat shipping from site settings
    let shippingCents = 0;
    if (site.shipping_rate != null && site.shipping_rate > 0) {
      shippingCents = Math.round(site.shipping_rate * 100);
    }
    const totalAmount = subtotal + shippingCents;

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
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU'] },
    };

    // Add shipping line item if applicable
    if (shippingCents > 0) {
      sessionConfig.line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping' },
          unit_amount: shippingCents,
        },
        quantity: 1,
      });
    }

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
