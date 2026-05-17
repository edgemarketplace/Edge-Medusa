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
    const { siteId, items, customerEmail } = body;

    if (!siteId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'siteId and items array required' }, { status: 400 });
    }

    // Get the site — select all columns to avoid column-existence errors
    let site: any = null;
    try {
      const result = await supabaseAdmin
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .single();
      site = result.data;
      if (result.error) {
        console.error('Checkout: site query error:', result.error.message);
        return NextResponse.json({ error: 'Site query failed' }, { status: 500 });
      }
    } catch (dbErr: any) {
      console.error('Checkout: DB connection error:', dbErr.message);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    if (!site) {
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

    // --- LIVE SHIPPING via Shippo ---
    let shippingCents = 0;
    let shippoRateId: string | null = null;
    const shippoConfigured = !!process.env.SHIPPO_API_KEY;

    if (shippoConfigured) {
      try {
        const { getCheapestRate, getParcelForItemCount } = await import('@/lib/shippo');
        const fromAddress = {
          name: site.business_name || 'Store',
          street1: site.business_address || '123 Main St',
          city: site.business_city || 'New York',
          state: site.business_state || 'NY',
          zip: site.business_zip || '10001',
          country: 'US',
        };
        // Use a generic "to" address for rate estimation (customer enters real one in Stripe)
        const toAddress = {
          name: 'Customer',
          street1: '456 Sample Ave',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90001',
          country: 'US',
        };
        const parcel = getParcelForItemCount(items.length);
        const rate = await getCheapestRate(fromAddress, toAddress, [parcel]);
        if (rate) {
          shippingCents = Math.round(parseFloat(rate.amount) * 100);
          shippoRateId = rate.object_id;
        } else {
          // Fallback to flat rate if Shippo returns no rates
          shippingCents = site.shipping_rate ? Math.round(site.shipping_rate * 100) : 0;
        }
      } catch (shippoErr: any) {
        console.error('Shippo rate fetch failed:', shippoErr.message);
        // Fallback to flat rate
        shippingCents = site.shipping_rate ? Math.round(site.shipping_rate * 100) : 0;
      }
    } else {
      // Flat rate fallback
      if (site.shipping_rate != null && site.shipping_rate > 0) {
        shippingCents = Math.round(site.shipping_rate * 100);
      }
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
        shippo_rate_id: shippoRateId || '',
        item_count: String(items.length),
      },
      customer_email: customerEmail || undefined,
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU'] },
    };

    // Add shipping line item
    if (shippingCents > 0) {
      sessionConfig.line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
            description: shippoConfigured ? 'Estimated live rate' : 'Flat rate shipping',
          },
          unit_amount: shippingCents,
        },
        quantity: 1,
      });
    }

    let session;
    const stripe = getStripe();
    if (hasStripeConnected) {
      session = await stripe.checkout.sessions.create(
        {
          ...sessionConfig,
          payment_intent_data: {
            application_fee_amount: Math.round(totalAmount * 0.05),
          },
        },
        { stripeAccount: site.stripe_account_id }
      );
    } else {
      session = await stripe.checkout.sessions.create(sessionConfig);
    }

    return NextResponse.json({
      url: session.url,
      testMode: isTestMode,
      shippingCents,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
