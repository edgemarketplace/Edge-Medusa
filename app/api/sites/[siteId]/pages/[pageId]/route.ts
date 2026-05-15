import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { PageData } from '@/lib/types';

// GET a single page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; pageId: string }> }
) {
  try {
    const { siteId, pageId } = await params;
    const { data, error } = await supabaseAdmin
      .from('pages')
      .select('*')
      .eq('site_id', siteId)
      .eq('id', pageId)
      .single();

    if (error) {
      console.error('Supabase page GET error:', JSON.stringify(error));
      return NextResponse.json({ error: `Page not found: ${error.message}` }, { status: 404 });
    }

    return NextResponse.json(data as PageData);
  } catch (error) {
    console.error('Get page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// UPDATE a page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; pageId: string }> }
) {
  try {
    const { siteId, pageId } = await params;
    const body = await request.json();

    const allowedFields: Partial<PageData> = {};
    if (body.title !== undefined) allowedFields.title = body.title;
    if (body.slug !== undefined) allowedFields.slug = body.slug;
    if (body.sections !== undefined) allowedFields.sections = body.sections;

    const { data, error } = await supabaseAdmin
      .from('pages')
      .update(allowedFields)
      .eq('site_id', siteId)
      .eq('id', pageId)
      .select()
      .single();

    if (error) {
      console.error('Supabase page PUT error:', JSON.stringify(error));
      return NextResponse.json({ error: `Failed to update page: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data as PageData);
  } catch (error) {
    console.error('Update page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; pageId: string }> }
) {
  try {
    const { siteId, pageId } = await params;
    const { error } = await supabaseAdmin
      .from('pages')
      .delete()
      .eq('site_id', siteId)
      .eq('id', pageId);

    if (error) {
      console.error('Supabase page DELETE error:', JSON.stringify(error));
      return NextResponse.json({ error: `Failed to delete page: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
