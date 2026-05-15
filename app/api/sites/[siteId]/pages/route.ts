import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { PageData } from '@/lib/types';

// GET all pages for a site
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const { data, error } = await supabaseAdmin
      .from('pages')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Get pages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// CREATE a new page
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const body = await request.json();
    const { slug, title, sections } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: 'slug and title required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('pages')
      .insert({
        site_id: siteId,
        slug,
        title,
        sections: sections || [],
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Page with this slug already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
    }

    return NextResponse.json(data as PageData, { status: 201 });
  } catch (error) {
    console.error('Create page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
