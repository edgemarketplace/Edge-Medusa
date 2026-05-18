import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireSiteAdmin } from '@/lib/auth-server'
import { getStripe } from '@/lib/stripe'
import { upsertInventoryCatalog } from '@/lib/inventory/catalog'
import { mapStripeProductToCatalog } from '@/lib/inventory/source-mappers'
import { reconcileMedusaInventorySync, syncInventoryToMedusa } from '@/lib/medusa/client'

async function loadStripeCatalog(stripeAccountId: string) {
  const stripe = getStripe()

  const [productsResponse, pricesResponse] = await Promise.all([
    stripe.products.list({ active: true, limit: 100 }, { stripeAccount: stripeAccountId }),
    stripe.prices.list({ active: true, limit: 100 }, { stripeAccount: stripeAccountId }),
  ])

  const preferredPrices = new Map<string, any>()

  for (const price of pricesResponse.data as any[]) {
    if (typeof price.product !== 'string') continue
    const current = preferredPrices.get(price.product)
    const currentScore = current ? (current.type === 'one_time' ? 2 : 1) : 0
    const nextScore = price.type === 'one_time' ? 2 : 1
    if (!current || nextScore > currentScore) {
      preferredPrices.set(price.product, price)
    }
  }

  return productsResponse.data.map((product: any) =>
    mapStripeProductToCatalog(product, preferredPrices.get(product.id)),
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  try {
    const { siteId } = await params
    await requireSiteAdmin(request, siteId)

    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .select('id, stripe_account_id')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (!(site as any).stripe_account_id) {
      return NextResponse.json({ error: 'Stripe is not connected for this site' }, { status: 400 })
    }

    const catalogDrafts = await loadStripeCatalog((site as any).stripe_account_id)
    const rows = await upsertInventoryCatalog(siteId, catalogDrafts)

    try {
      const medusaResult = await syncInventoryToMedusa(siteId, rows)
      await reconcileMedusaInventorySync(siteId, rows, medusaResult)
    } catch (error: any) {
      console.error('Medusa inventory sync failed after Stripe import:', error?.message || error)
    }

    return NextResponse.json({
      success: true,
      synced: rows.length,
      products: rows,
    })
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Stripe sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Stripe import failed' },
      { status: 500 },
    )
  }
}
