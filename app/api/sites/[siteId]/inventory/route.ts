import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper: Sync inventory items to site sections (all commerce types)
async function syncInventoryToSections(siteId: string, items: any[]) {
  try {
    // Only sync enabled items that have names
    const activeItems = items.filter((i: any) => i.enabled !== false && i.name?.trim());
    if (activeItems.length === 0) return;

    // Fetch site with template_data
    const { data: site, error } = await supabaseAdmin
      .from('sites')
      .select('template_data')
      .eq('id', siteId)
      .single();

    if (error || !site?.template_data?.pages) return;

    const pages = site.template_data.pages as Array<{ slug: string; title: string; sections: any[] }>;
    let updated = false;

    // Standard inventory item format used by all section types
    const standardFormat = activeItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price ? (String(item.price).startsWith('$') ? item.price : `$${item.price}`) : '',
      image_url: item.image_url || '',
      stock: item.stock ?? null,
      category: item.category || '',
      sku: item.sku || '',
      variants: item.variants || null,
    }));

    // Additional format for packages (features from variants)
    const packageFormat = activeItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price ? (String(item.price).startsWith('$') ? item.price : `$${item.price}`) : '',
      image_url: item.image_url || '',
      stock: item.stock ?? null,
      features: item.variants?.map((v: any) => `${v.name}: ${v.value}`) || [],
    }));

    // Update sections in all pages
    const updatedPages = pages.map(page => ({
      ...page,
      sections: page.sections.map(section => {
        // Commerce grid/list sections — use standard format with items array
        if (['product-grid', 'featured-collection', 'best-sellers', 'hero-products', 'collection-carousel'].includes(section.type)) {
          updated = true;
          return { ...section, data: { ...section.data, items: standardFormat } };
        }
        // Service list — use standard items (renderer reads data.items)
        if (section.type === 'service-list') {
          updated = true;
          return { ...section, data: { ...section.data, items: standardFormat } };
        }
        // Packages — use package format with features
        if (section.type === 'packages') {
          updated = true;
          return { ...section, data: { ...section.data, items: packageFormat } };
        }
        // Pricing tiers — structured tiers (use items for consistency)
        if (section.type === 'pricing-tiers') {
          updated = true;
          return { ...section, data: { ...section.data, items: standardFormat } };
        }
        return section;
      }),
    }));

    if (updated) {
      await supabaseAdmin
        .from('sites')
        .update({ template_data: { ...site.template_data, pages: updatedPages } })
        .eq('id', siteId);
      console.log(`[Inventory] Synced ${standardFormat.length} items to sections for site ${siteId}`);
    }
  } catch (err) {
    console.error('[Inventory] Sync to sections failed:', err);
  }
}

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
          variants: item.variants || null,
          stock: item.stock ?? null,
          sku: item.sku || null,
          tax_rate: item.tax_rate ?? null,
          shipping_class: item.shipping_class || 'standard',
          weight: item.weight ?? null,
          enabled: item.enabled !== false,
        }));

      const { error } = await supabaseAdmin
        .from('inventory_items')
        .insert(itemsToInsert);

      if (error) {
        return NextResponse.json({ error: 'Failed to save inventory' }, { status: 500 });
      }

      // Sync inventory to sections (service-list, packages, product-grid)
      await syncInventoryToSections(siteId, itemsToInsert);
    }

    return NextResponse.json({ ok: true, count: items.length });
  } catch (error) {
    console.error('Put inventory error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
