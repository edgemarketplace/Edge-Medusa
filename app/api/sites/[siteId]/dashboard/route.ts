import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const [{ data: inventory, error: inventoryError }, { data: site, error: siteError }] = await Promise.all([
      supabaseAdmin.from('inventory_items').select('*').eq('site_id', siteId),
      supabaseAdmin
        .from('sites')
        .select('id, stripe_account_id, printify_api_key, printify_shop_id, status, published')
        .eq('id', siteId)
        .single(),
    ])

    if (inventoryError) throw inventoryError
    if (siteError) throw siteError

    const items = inventory || []
    const activeItems = items.filter((item) => item.enabled !== false)
    const lowStockItems = items.filter((item) => typeof item.stock === 'number' && item.stock < 5).length
    const missingPrices = items.filter((item) => !item.price || Number(item.price) <= 0).length
    const missingImages = items.filter((item) => !item.image_url).length
    const syncErrors = items.filter((item) => item.sync_status === 'error').length
    const connectedStripe = Boolean((site as any)?.stripe_account_id)
    const connectedPrintify = Boolean((site as any)?.printify_api_key && (site as any)?.printify_shop_id)

    const checks = [
      {
        id: 'inventory-count',
        label: 'Inventory loaded',
        done: activeItems.length > 0,
        detail: activeItems.length > 0 ? `${activeItems.length} active items ready to sell.` : 'Add at least one active item.',
      },
      {
        id: 'pricing',
        label: 'Pricing complete',
        done: items.length > 0 && missingPrices === 0,
        detail: missingPrices === 0 ? 'Every item has a valid sell price.' : `${missingPrices} item(s) need a price.`,
      },
      {
        id: 'images',
        label: 'Image coverage',
        done: items.length > 0 && missingImages === 0,
        detail: missingImages === 0 ? 'Every item has an image.' : `${missingImages} item(s) are missing an image.`,
      },
      {
        id: 'payments',
        label: 'Stripe connected',
        done: connectedStripe,
        detail: connectedStripe ? 'Checkout can route payments.' : 'Connect Stripe before paid checkout goes live.',
      },
      {
        id: 'provider-sync',
        label: 'Sync health',
        done: syncErrors === 0,
        detail: syncErrors === 0 ? 'No catalog sync errors detected.' : `${syncErrors} item(s) need sync attention.`,
      },
      {
        id: 'publish-state',
        label: 'Launch state',
        done: Boolean((site as any)?.published) || (site as any)?.status === 'live',
        detail: Boolean((site as any)?.published) || (site as any)?.status === 'live' ? 'Store is live.' : 'Store is still in draft / ready mode.',
      },
    ]

    return NextResponse.json({
      totalOrders: 0,
      totalRevenue: 0,
      activeProducts: activeItems.length,
      lowStockItems,
      inventoryHealth: {
        totalItems: items.length,
        missingPrices,
        missingImages,
        syncErrors,
        stripeConnected: connectedStripe,
        printifyConnected: connectedPrintify,
      },
      launchReadiness: {
        completed: checks.filter((check) => check.done).length,
        total: checks.length,
        checks,
      },
    })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 },
    )
  }
}
