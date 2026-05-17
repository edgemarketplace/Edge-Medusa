import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'

// Helper: Sync inventory items to site sections (all commerce types)
async function syncInventoryToSections(siteId: string, items: any[]) {
  try {
    // Only sync enabled items that have names
    const activeItems = items.filter((i: any) => i.enabled !== false && i.name?.trim())
    if (activeItems.length === 0) return

    // Fetch site with template_data
    const { data: site, error } = await supabaseAdmin
      .from('sites')
      .select('template_data')
      .eq('id', siteId)
      .single()

    if (error || !site?.template_data?.pages) return

    const pages = site.template_data.pages as Array<{ slug: string; title: string; sections: any[] }>
    let updated = false

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
    }))

    // Additional format for packages (features from variants)
    const packageFormat = activeItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price ? (String(item.price).startsWith('$') ? item.price : `$${item.price}`) : '',
      image_url: item.image_url || '',
      stock: item.stock ?? null,
      features: item.variants?.map((v: any) => `${v.name}: ${v.value}`) || [],
    }))

    // Update sections in all pages
    const updatedPages = pages.map(page => ({
      ...page,
      sections: page.sections.map(section => {
        if (section.type === 'featured-collection') {
          updated = true
          return { ...section, data: { ...section.data, items: standardFormat.slice(0, 6) } }
        }
        if (section.type === 'product-grid') {
          updated = true
          return { ...section, data: { ...section.data, items: standardFormat } }
        }
        if (section.type === 'best-sellers') {
          updated = true
          return { ...section, data: { ...section.data, items: standardFormat.slice(0, 4) } }
        }
        if (section.type === 'collection-carousel') {
          updated = true
          return { ...section, data: { ...section.data, items: standardFormat } }
        }
        if (section.type === 'packages') {
          updated = true
          return { ...section, data: { ...section.data, items: packageFormat } }
        }
        return section
      }),
    }))

    if (updated) {
      await supabaseAdmin
        .from('sites')
        .update({ template_data: { ...site.template_data, pages: updatedPages } })
        .eq('id', siteId)
    }
  } catch (err) {
    console.error('Error syncing inventory to sections:', err)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items must be an array' }, { status: 400 })
    }

    // Delete existing inventory for this site and re-insert
    await supabaseAdmin.from('inventory_items').delete().eq('site_id', siteId)

    const itemsToInsert = items.map((item: any) => ({
      site_id: siteId,
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      image_url: item.image_url || null,
      enabled: item.enabled !== false,
      stock: item.stock ?? null,
      category: item.category || '',
      sku: item.sku || '',
      variants: item.variants || null,
    }))

    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .insert(itemsToInsert)
      .select()

    if (error) {
      console.error('Inventory PUT error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Sync to sections
    await syncInventoryToSections(siteId, items)

    return NextResponse.json(data || [])
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Inventory error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Inventory GET error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Inventory GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}
