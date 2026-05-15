import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Stripe Connect OAuth start
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const siteId = searchParams.get('siteId');

  if (!siteId) {
    return NextResponse.json({ error: 'siteId required' }, { status: 400 });
  }

  const clientId = process.env.STRIPE_CLIENT_ID;
  if (!clientId || clientId.includes('placeholder')) {
    return NextResponse.json({ error: 'Stripe Connect not configured' }, { status: 503 });
  }

  const state = Buffer.from(JSON.stringify({ siteId })).toString('base64');

  // Build redirect URI from the request origin (works for both local and production)
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${origin}/stripe/callback`;
  const oauthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(oauthUrl);
}

// Stripe Connect OAuth callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 });
    }

    // Decode state to get siteId
    let siteId: string | null = null;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        siteId = decoded.siteId;
      } catch {
        // ignore
      }
    }

    // Exchange code for Stripe account ID
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    const stripeAccountId = response.stripe_user_id;

    if (siteId) {
      // Save to site
      await supabaseAdmin
        .from('sites')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', siteId);
    }

    return NextResponse.json({ success: true, stripeAccountId });
  } catch (error) {
    console.error('Stripe OAuth error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OAuth failed' },
      { status: 500 }
    );
  }
}
