import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type SiteRow = {
  id: string
  business_name: string | null
  subdomain: string | null
  status: string | null
  business_type: string | null
  tagline: string | null
  offerings: string | null
  created_at: string | null
}

type ProductRow = {
  id: string
  site_id: string
  name: string | null
  price: string | null
  description: string | null
  image_url: string | null
  category: string | null
  enabled: boolean | null
  stock: number | null
  created_at: string | null
}

type MarketplaceData = {
  sites: SiteRow[]
  products: ProductRow[]
  error?: string
}

async function loadMarketplace(): Promise<MarketplaceData> {
  try {
    const [sitesResult, productsResult] = await Promise.all([
      supabaseAdmin
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(24),
      supabaseAdmin
        .from('inventory_items')
        .select('*')
        .neq('enabled', false)
        .order('created_at', { ascending: false })
        .limit(48),
    ])

    return {
      sites: (sitesResult.data || []) as SiteRow[],
      products: (productsResult.data || []) as ProductRow[],
      error: sitesResult.error?.message || productsResult.error?.message,
    }
  } catch (error: any) {
    return {
      sites: [],
      products: [],
      error: error?.message || 'Marketplace data unavailable',
    }
  }
}

function siteUrl(site: SiteRow) {
  return `/store/${site.subdomain || site.id}`
}

function formatType(type: string | null) {
  return (type || 'commerce').replace(/-/g, ' ')
}

export default async function MarketplacePage() {
  const data = await loadMarketplace()
  const siteById = new Map(data.sites.map(site => [site.id, site]))
  const liveSites = data.sites.filter(site => site.status === 'live')
  const draftSites = data.sites.filter(site => site.status !== 'live')
  const productsWithStores = data.products
    .map(product => ({ product, site: siteById.get(product.site_id) }))
    .filter((entry): entry is { product: ProductRow; site: SiteRow } => Boolean(entry.site))

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-zinc-950">
      <section className="bg-[#111113] text-white">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-black font-serif italic font-bold">M</span>
              <span>
                <span className="block text-sm font-bold leading-tight">Edge Medusa</span>
                <span className="block text-xs text-white/45">marketplace of marketplaces</span>
              </span>
            </Link>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <Link href="/backend" className="rounded-full border border-white/10 px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white">Super admin backend</Link>
              <Link href="/onboarding" className="rounded-full bg-white px-3 py-2 text-black hover:bg-emerald-50">Create tenant store</Link>
            </div>
          </nav>

          <div className="grid gap-8 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">Shared Medusa commerce layer</p>
              <h1 className="mt-5 max-w-4xl text-5xl font-serif italic tracking-tight sm:text-7xl">One marketplace, many tenant Medusa storefronts.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/58">
                Each merchant keeps its own tenant boundary, catalog, cart, checkout, and orders. The network can still surface shared products and stores through a single customer-facing marketplace hub.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/35">Architecture in plain English</p>
              <div className="mt-5 grid gap-3 text-sm text-white/68">
                <div className="rounded-2xl bg-white/[0.05] p-4"><strong className="text-white">Super admin</strong> manages your global business functions at /backend.</div>
                <div className="rounded-2xl bg-white/[0.05] p-4"><strong className="text-white">Tenants</strong> run isolated stores on Supabase rows/RLS with Medusa-style commerce objects.</div>
                <div className="rounded-2xl bg-white/[0.05] p-4"><strong className="text-white">Shared products</strong> can be promoted across tenant sales channels into this network catalog.</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/10 py-5 text-sm sm:grid-cols-4">
            <Metric label="Tenant stores" value={data.sites.length.toString()} />
            <Metric label="Live channels" value={liveSites.length.toString()} />
            <Metric label="Draft channels" value={draftSites.length.toString()} />
            <Metric label="Shared products" value={data.products.length.toString()} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {data.error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Marketplace data warning: {data.error}. The page still renders while Supabase/Medusa schema is being connected.
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-black/35">Sales channels</p>
                <h2 className="mt-2 text-3xl font-serif italic">Tenant storefronts</h2>
              </div>
              <Link href="/onboarding" className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">Add tenant</Link>
            </div>
            <div className="mt-6 space-y-3">
              {data.sites.length ? data.sites.map(site => (
                <Link key={site.id} href={siteUrl(site)} className="block rounded-3xl border border-black/5 bg-[#f8f7f4] p-4 transition hover:border-black/20 hover:bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{site.business_name || 'Untitled tenant'}</p>
                      <p className="mt-1 text-sm text-black/45">{site.tagline || site.offerings || 'Tenant storefront'}</p>
                    </div>
                    <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-bold capitalize text-black/55">{site.status || 'draft'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-black/35">
                    <span>{formatType(site.business_type)}</span>
                    <span>•</span>
                    <span>{site.subdomain || site.id.slice(0, 8)}</span>
                  </div>
                </Link>
              )) : (
                <div className="rounded-3xl border border-dashed border-black/10 p-8 text-center text-sm text-black/45">No tenant stores yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-black/35">Network catalog</p>
              <h2 className="mt-2 text-3xl font-serif italic">Shared products</h2>
              <p className="mt-2 text-sm text-black/48">First pass: inventory_items are displayed as Medusa-style product cards grouped by tenant. Next pass is a real shared_products join table and cross-tenant channel rules.</p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {productsWithStores.length ? productsWithStores.slice(0, 12).map(({ product, site }) => (
                <Link key={product.id} href={siteUrl(site)} className="group overflow-hidden rounded-3xl border border-black/5 bg-[#f8f7f4] transition hover:border-black/20 hover:bg-white">
                  <div className="flex h-44 items-center justify-center bg-black/[0.03] text-4xl">
                    {product.image_url ? <img src={product.image_url} alt={product.name || 'Product'} className="h-full w-full object-cover transition group-hover:scale-105" /> : '📦'}
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">{site.business_name || 'Tenant'}</p>
                    <h3 className="mt-2 font-bold">{product.name || 'Untitled product'}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-black/45">{product.description || product.category || 'Shared marketplace item'}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-bold">{product.price || '$0'}</span>
                      <span className="rounded-full bg-black px-3 py-1 text-[11px] font-black text-white">View store</span>
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="rounded-3xl border border-dashed border-black/10 p-8 text-center text-sm text-black/45 sm:col-span-2">No shared products yet. Add inventory in a tenant builder.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
