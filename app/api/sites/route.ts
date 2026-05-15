import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_name, business_type, offerings, contact_email, tagline } = body;

    if (!business_name || !business_type || !contact_email) {
      return NextResponse.json(
        { error: 'business_name, business_type, and contact_email are required' },
        { status: 400 }
      );
    }

    const site_token = crypto.randomUUID();
    const insertData: any = {
      business_name,
      business_type,
      offerings: offerings || '',
      contact_email,
      site_token,
      status: 'draft',
      template_data: { sections: [] },
    };

    // Only include tagline if provided (column may not exist yet)
    if (tagline) {
      insertData.tagline = tagline;
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
