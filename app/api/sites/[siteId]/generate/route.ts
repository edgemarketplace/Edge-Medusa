import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSiteContent } from '@/lib/ai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  try {
  const { data: site, error: fetchError } = await supabaseAdmin
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .single();

  if (fetchError) {
    console.error('Supabase fetch error:', fetchError);
    return NextResponse.json(
      { error: fetchError.message },
      { status: fetchError.code === 'PGRST116' ? 404 : 500 }
    );
  }

  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }

  const { business_name, business_type, contact_email } = site;

  const { pages } = await generateSiteContent(
    business_name,
    business_type,
    '', // offerings no longer collected
    contact_email,
    '', // tagline no longer collected
  );

  const templateData = { pages };

  const { error: updateError } = await supabaseAdmin
    .from('sites')
    .update({
      template_data: templateData,
      status: 'ready',
    })
    .eq('id', siteId);

  if (updateError) {
    console.error('Supabase update error:', updateError);
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ pages });
} catch (error) {
  console.error('Generate route fatal error:', error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined },
    { status: 500 }
  );
}
}
