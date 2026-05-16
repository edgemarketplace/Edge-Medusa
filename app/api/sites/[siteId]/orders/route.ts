import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  try {
    // 1. Get the site and its stripe_account_id
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('stripe_account_id')
      .eq('id', siteId)
      .single();

    if (siteError || !site?.stripe_account_id) {
      return NextResponse.json({ orders: [] });
    }

    // 2. Fetch recent PaymentIntents from Stripe for this connected account
    const payments = await stripe.paymentIntents.list(
      { limit: 20 },
      { stripeAccount: site.stripe_account_id }
    );

    // 3. Map to a clean UI format
    const orders = payments.data.map(p => ({
      id: p.id,
      amount: p.amount / 100,
      currency: p.currency.toUpperCase(),
      status: p.status,
      email: p.receipt_email || 'No email',
      date: new Date(p.created * 1000).toISOString(),
    }));

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
