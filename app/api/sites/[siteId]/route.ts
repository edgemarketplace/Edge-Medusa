import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { SiteData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  const { data, error } = await supabaseAdmin
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === 'PGRST116' ? 404 : 500 }
    );
  }

  return NextResponse.json(data as SiteData);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const body = await request.json();

  const allowedFields: Partial<SiteData> = {};
  if (body.template_data !== undefined) allowedFields.template_data = body.template_data;
  if (body.status !== undefined) allowedFields.status = body.status;
  if (body.subdomain !== undefined) allowedFields.subdomain = body.subdomain;
  if (body.stripe_account_id !== undefined) allowedFields.stripe_account_id = body.stripe_account_id;
  if (body.business_name !== undefined) allowedFields.business_name = body.business_name;
  if (body.tagline !== undefined) (allowedFields as any).tagline = body.tagline;
  if (body.contact_email !== undefined) allowedFields.contact_email = body.contact_email;

  const { data, error } = await supabaseAdmin
    .from('sites')
    .update(allowedFields)
    .eq('id', siteId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === 'PGRST116' ? 404 : 500 }
    );
  }

  return NextResponse.json(data as SiteData);
}
