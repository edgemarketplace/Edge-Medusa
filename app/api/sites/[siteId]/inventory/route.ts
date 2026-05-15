import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;

    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Get inventory error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const body = await request.json();
    const items = body.items || [];

    // Delete existing items
    await supabaseAdmin.from('inventory_items').delete().eq('site_id', siteId);

    // Insert new items
    if (items.length > 0) {
      const itemsToInsert = items
        .filter((item: any) => item.name?.trim())
        .map((item: any) => ({
          site_id: siteId,
          name: item.name.trim(),
          price: item.price || '',
          description: item.description || '',
          category: item.category || '',
          image_url: item.image_url || null,
        }));

      const { error } = await supabaseAdmin
        .from('inventory_items')
        .insert(itemsToInsert);

      if (error) {
        return NextResponse.json({ error: 'Failed to save inventory' }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, count: items.length });
  } catch (error) {
    console.error('Put inventory error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
