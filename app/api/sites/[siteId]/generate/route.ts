import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateStorefront } from '@/lib/ai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  const { data: site, error: fetchError } = await supabaseAdmin
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .single();

  if (fetchError) {
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

  const { business_name, business_type, offerings } = site;

  const sections = await generateStorefront(
    business_name,
    business_type,
    offerings
  );

  const templateData = { sections };

  const { error: updateError } = await supabaseAdmin
    .from('sites')
    .update({
      template_data: templateData,
      status: 'ready',
    })
    .eq('id', siteId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ sections });
}
