import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPrintifyProducts, mapPrintifyToInventory } from '@/lib/printify';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  // 1. Fetch site config
  const { data: site, error: siteError } = await supabaseAdmin
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .single();

  if (siteError || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  const apiKey = (site as any).printify_api_key;
  const shopId = (site as any).printify_shop_id;

  if (!apiKey || !shopId) {
    return NextResponse.json({ error: 'Printify not configured' }, { status: 400 });
  }

  try {
    // 2. Fetch products from Printify
    const printifyProducts = await getPrintifyProducts(apiKey, shopId);
    
    // 3. Map to inventory format
    const newItems = printifyProducts.map(mapPrintifyToInventory);

    // 4. Update inventory in DB
    // First, get current inventory
    const { data: currentInventory, error: invError } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('site_id', siteId);

    if (invError) throw invError;

    // We'll append new items that don't exist by Printify ID, 
    // but for simplicity in this MVP, we'll just clear and re-sync 
    // OR we can just return the new list and let the client save it.
    // Let's actually save it here to make it a true "Sync".
    
    // Option: Upsert by Printify ID
    // For now, let's just insert all new items.
    const itemsToInsert = newItems.map(item => ({
      ...item,
      site_id: siteId
    }));

    // Delete existing Printify items for this site to avoid duplicates
    await supabaseAdmin
      .from('inventory')
      .delete()
      .eq('site_id', siteId)
      .filter('metadata->>source', 'eq', 'printify');

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('inventory')
      .insert(itemsToInsert)
      .select();

    if (insertError) throw insertError;

    // Also fetch non-printify items to return the full inventory
    const { data: fullInventory } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .eq('site_id', siteId);

    return NextResponse.json({ 
      success: true, 
      count: inserted.length,
      inventory: fullInventory 
    });
  } catch (err: any) {
    console.error('[Printify Sync] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
