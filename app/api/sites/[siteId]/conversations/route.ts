import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: Request,
  { params }: { params: { siteId: string } }
) {
  const { siteId } = params;

  try {
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('site_id', siteId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(conversations);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
