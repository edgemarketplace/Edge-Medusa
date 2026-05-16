import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const body = await request.json();
    const { 
      platform_fee_pct, 
      stripe_fee_pct, 
      tax_rate, 
      shipping_rate,
      shipping_handling 
    } = body;

    // Validate percentages
    const updates: any = { status: 'live' };
    
    if (platform_fee_pct !== undefined) {
      if (platform_fee_pct < 0 || platform_fee_pct > 100) {
        return NextResponse.json({ error: 'Platform fee must be between 0 and 100' }, { status: 400 });
      }
      updates.platform_fee_pct = platform_fee_pct;
    }
    
    if (stripe_fee_pct !== undefined) {
      if (stripe_fee_pct < 0 || stripe_fee_pct > 100) {
        return NextResponse.json({ error: 'Stripe fee must be between 0 and 100' }, { status: 400 });
      }
      updates.stripe_fee_pct = stripe_fee_pct;
    }
    
    if (tax_rate !== undefined) {
      if (tax_rate < 0 || tax_rate > 100) {
        return NextResponse.json({ error: 'Tax rate must be between 0 and 100' }, { status: 400 });
      }
      updates.tax_rate = tax_rate;
    }
    
    if (shipping_rate !== undefined) {
      if (shipping_rate < 0) {
        return NextResponse.json({ error: 'Shipping rate cannot be negative' }, { status: 400 });
      }
      updates.shipping_rate = shipping_rate;
    }
    
    if (shipping_handling !== undefined) {
      updates.shipping_handling = shipping_handling;
    }

    const { data: site, error } = await supabaseAdmin
      .from('sites')
      .update(updates)
      .eq('id', siteId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to launch site' }, { status: 500 });
    }

    // Send launch confirmation with Stripe Connect prompt
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://edgemarketplacehub.com';
    await sendWelcomeEmail({
      to: site.contact_email,
      businessName: site.business_name,
      buildUrl: `${appUrl}/store/${site.subdomain || site.id}`,
      isLive: true,
      stripeConnectUrl: `${appUrl}/api/stripe/connect?site_id=${site.id}`,
    }).catch(err => console.error('Launch email failed:', err));

    return NextResponse.json({ ok: true, site });
  } catch (error) {
    console.error('Launch site error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
