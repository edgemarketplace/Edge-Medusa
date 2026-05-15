import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function generateSubdomain(businessName: string): string {
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  const hash = crypto.randomUUID().replace(/-/g, '').slice(0, 4);
  return `${slug}-${hash}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;

    // Get the site
    const { data: site, error: fetchError } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .single();

    if (fetchError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Generate subdomain
    const subdomain = generateSubdomain(site.business_name);

    // Update site
    const { data, error } = await supabaseAdmin
      .from('sites')
      .update({
        subdomain,
        status: 'live',
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to launch site' }, { status: 500 });
    }

    return NextResponse.json({
      subdomain,
      url: `https://${subdomain}.edgemarketplacehub.com`,
      siteId,
      site: data,
    });
  } catch (error) {
    console.error('Launch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
