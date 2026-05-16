import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { siteId: string } }
) {
  const { siteId } = params;
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: conversations, error } = await supabase
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
