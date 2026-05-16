import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { siteId: string } }
) {
  const { siteId } = params;
  const { name, email, subject, message } = await req.json();

  if (!email || !message) {
    return NextResponse.json({ error: 'Email and message are required' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 1. Find or create conversation
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('site_id', siteId)
      .eq('customer_email', email)
      .maybeSingle();

    if (convError && convError.code !== 'PGRST116') throw convError;

    if (!conversation) {
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          site_id: siteId,
          customer_email: email,
          customer_name: name || email.split('@')[0],
          subject: subject || 'New Inquiry',
          last_message: message,
          status: 'open'
        })
        .select()
        .single();
      
      if (createError) throw createError;
      conversation = newConv;
    } else {
      // Update existing conversation
      await supabase
        .from('conversations')
        .update({
          last_message: message,
          updated_at: new Date().toISOString(),
          status: 'open'
        })
        .eq('id', conversation.id);
    }

    // 2. Insert message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender: 'customer',
        content: message
      });

    if (msgError) throw msgError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Contact error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
