import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_name, business_type, offerings, contact_email, tagline, style_preset, theme_id } = body;

    if (!business_name || !business_type || !contact_email) {
      return NextResponse.json(
        { error: 'business_name, business_type, and contact_email are required' },
        { status: 400 }
      );
    }

    const STYLE_MAP: Record<string, any> = {
      milano: { primaryColor: '#1A1A1A', fontFamily: 'Georgia, "Times New Roman", Times, serif', backgroundColor: '#F9F8F6', accentColor: '#1A1A1A', borderRadius: '0px' },
      midnight: { primaryColor: '#6366F1', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#0F0F14', accentColor: '#6366F1', borderRadius: '8px' },
      sunlit: { primaryColor: '#F59E0B', fontFamily: 'Georgia, "Times New Roman", Times, serif', backgroundColor: '#FFFBF0', accentColor: '#F59E0B', borderRadius: '12px' },
      sage: { primaryColor: '#6B7C6A', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#F4F7F4', accentColor: '#6B7C6A', borderRadius: '24px' },
    };

    const style = STYLE_MAP[style_preset] || STYLE_MAP.milano;

    const site_token = crypto.randomUUID();
    const insertData: any = {
      business_name,
      business_type,
      offerings: offerings || '',
      contact_email,
      site_token,
      status: 'draft',
      template_data: { 
        sections: [],
        ...style
      },
    };

    if (tagline) {
      insertData.tagline = tagline;
    }
    if (theme_id) {
      insertData.theme_id = theme_id;
    }

    let { data, error } = await supabaseAdmin
      .from('sites')
      .insert(insertData)
      .select()
      .single();

    // If tagline column doesn't exist, retry without it
    if (error && error.code === 'PGRST204' && error.message?.includes('tagline')) {
      console.warn('tagline column not found, retrying without it');
      delete insertData.tagline;
      const retry = await supabaseAdmin
        .from('sites')
        .insert(insertData)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
    }

    // Send welcome email (non-blocking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    sendWelcomeEmail({
      to: contact_email,
      businessName: business_name,
      buildUrl: `${appUrl}/build/${data.id}`,
    }).catch(err => console.error('Welcome email failed:', err));

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create site error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('List sites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
