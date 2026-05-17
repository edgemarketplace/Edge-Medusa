import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type SiteRow = {
  id: string
  business_name: string | null
  subdomain: string | null
  status: string | null
  business_type: string | null
  stripe_account_id: string | null
  created_at: string | null
}

type ProductRow = {
  id: string
  site_id: string
  name: string | null
  price: string | null
  stock: number | null
  enabled: boolean | null
  sku: string | null
  category: string | null
  created_at: string | null
}

type OrderRow = {
  id: string
  site_id: string
  status: string | null
  customer_email: string | null
  total_cents: number | null
  currency: string | null
  created_at: string | null
}

type BackendData = {
  sites: SiteRow[]
  products: ProductRow[]
  orders: OrderRow[]
  error?: string
}

async function loadBackendData(): Promise<BackendData> {
  try {
    const [sitesResult, productsResult, ordersResult] = await Promise.all([
      supabaseAdmin
        .from('sites')
        .select('id,business_name,subdomain,status,business_type,stripe_account_id,created_at')
        .order('created_at', { ascending: false })
        .limit(12),
      supabaseAdmin
        .from('inventory_items')
        .select('id,site_id,name,price,stock,enabled,sku,category,created_at')
        .order('created_at', { ascending: false })
        .limit(12),
      supabaseAdmin
        .from('orders')
        .select('id,site_id,status,customer_email,total_cents,currency,created_at')
        .order('created_at', { ascending: false })
        .limit(12),
    ])

    return {
      sites: (sitesResult.data || []) as SiteRow[],
      products: (productsResult.data || []) as ProductRow[],
      orders: (ordersResult.data || []) as OrderRow[],
      error: sitesResult.error?.message || productsResult.error?.message || ordersResult.error?.message,
    }
  } catch (error: any) {
    return {
      sites: [],
      products: [],
      orders: [],
      error: error?.message || 'Backend data unavailable',
    }
  }
}

function money(cents: number | null, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format((cents || 0) / 100)
}

function pill(label: string, tone: 'green' | 'amber' | 'blue' | 'gray' = 'gray') {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${colors[tone]}`}>{label}</span>
}

export default async function BackendPage() {
  const data = await loadBackendData()
  const activeProducts = data.products.filter(product => product.enabled !== false)
  const lowStock = activeProducts.filter(product => typeof product.stock === 'number' && product.stock <= 5)
  const revenue = data.orders.reduce((sum, order) => sum + (order.total_cents || 0), 0)
  const medusaConfigured = Boolean(process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL)

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="bg-[#111113] text-white p-6 flex flex-col justify-between">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-10">
              <div className="h-9 w-9 rounded-xl bg-white text-black grid place-items-center font-serif italic font-bold">M</div>
              <div>
                <p className="font-bold leading-tight">Edge Medusa</p>
                <p className="text-xs text-white/45">commerce backend</p>
              </div>
            </Link>

            <nav className="space-y-1 text-sm">
              {[
                ['Overview', '#overview'],
                ['Products', '#products'],
                ['Orders', '#orders'],
                ['Sales channels', '#channels'],
                ['Client marketplace', '/marketplace'],
                ['Backend service', '#service'],
              ].map(([label, href], index) => (
                <a key={label} href={href} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${index === 0 ? 'bg-white text-black' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>
                  <span>{label}</span>
                  {index === 0 && <span className="text-xs">⌘1</span>}
                </a>
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35 mb-2">Medusa status</p>
            <p className="text-sm font-bold">{medusaConfigured ? 'Backend URL configured' : 'Configure MEDUSA_BACKEND_URL'}</p>
            <p className="text-xs text-white/45 mt-2">Native Medusa Admin is available from the backend at /app when the service is running.</p>
          </div>
        </aside>

        <section className="p-5 sm:p-8 lg:p-10 space-y-8">
          <header id="overview" className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-black/55 mb-4">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Medusa-style operator console
              </div>
              <h1 className="text-4xl sm:text-5xl font-serif italic tracking-tight">Backend that looks and works like commerce ops.</h1>
              <p className="mt-3 max-w-2xl text-black/55">Products, orders, sales channels, Stripe readiness, and the real Medusa service path are now surfaced as the primary experience — not just marketing copy.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold hover:border-black/30">Store dashboard</Link>
              <Link href="/onboarding" className="rounded-full bg-black px-5 py-3 text-sm font-bold text-white hover:bg-black/80">Create store</Link>
            </div>
          </header>

          {data.error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Backend data warning: {data.error}. The console still renders, but Supabase/Medusa env or schema may need setup.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Stores', data.sites.length, 'Sales channels / tenants'],
              ['Products', activeProducts.length, `${lowStock.length} low stock`],
              ['Orders', data.orders.length, 'Local order ledger'],
              ['Revenue', money(revenue), 'Stripe-backed total'],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/35">{label}</p>
                <p className="mt-3 text-3xl font-bold">{value}</p>
                <p className="mt-2 text-sm text-black/45">{sub}</p>
              </div>
            ))}
          </div>

          <div id="products" className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-black/5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/35">Catalog</p>
                <h2 className="text-2xl font-serif italic">Products</h2>
              </div>
              <span className="text-sm text-black/45">Synced from builder inventory → Medusa product model</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-widest text-black/35">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Stock</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {data.products.length ? data.products.map(product => (
                    <tr key={product.id} className="hover:bg-zinc-50/70">
                      <td className="px-6 py-4">
                        <p className="font-bold">{product.name || 'Untitled product'}</p>
                        <p className="text-xs text-black/40">{product.category || 'Uncategorized'} · {product.site_id.slice(0, 8)}</p>
                      </td>
                      <td className="px-6 py-4 text-black/55">{product.sku || '—'}</td>
                      <td className="px-6 py-4 font-bold">{product.price || '$0'}</td>
                      <td className="px-6 py-4">{product.stock ?? '—'}</td>
                      <td className="px-6 py-4">{pill(product.enabled === false ? 'Disabled' : 'Published', product.enabled === false ? 'gray' : 'green')}</td>
                      <td className="px-6 py-4"><Link className="font-bold underline underline-offset-4" href={`/build/${product.site_id}/inventory`}>Edit</Link></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-black/40">No products yet. Add inventory in a store builder to populate the backend catalog.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div id="orders" className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-black/5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/35">Fulfillment</p>
                <h2 className="text-2xl font-serif italic">Orders</h2>
              </div>
              <span className="text-sm text-black/45">Checkout success + Stripe webhook write to this ledger</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-widest text-black/35">
                  <tr>
                    <th className="px-6 py-3">Order</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {data.orders.length ? data.orders.map(order => (
                    <tr key={order.id} className="hover:bg-zinc-50/70">
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs font-bold">{order.id.slice(0, 12)}</p>
                        <p className="text-xs text-black/40">{order.site_id.slice(0, 8)}</p>
                      </td>
                      <td className="px-6 py-4 text-black/55">{order.customer_email || '—'}</td>
                      <td className="px-6 py-4 font-bold">{money(order.total_cents, (order.currency || 'USD').toUpperCase())}</td>
                      <td className="px-6 py-4">{pill(order.status || 'pending', order.status === 'paid' ? 'green' : 'amber')}</td>
                      <td className="px-6 py-4"><Link className="font-bold underline underline-offset-4" href={`/build/${order.site_id}/orders`}>Open</Link></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-black/40">No orders yet. Orders appear here after Stripe Checkout confirms payment.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div id="channels" className="grid gap-4 xl:grid-cols-3">
            {data.sites.length ? data.sites.slice(0, 6).map(site => (
              <div key={site.id} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/35">Sales channel</p>
                    <h3 className="mt-2 text-xl font-bold">{site.business_name || 'Untitled store'}</h3>
                    <p className="mt-1 text-sm text-black/45">{site.subdomain || site.id.slice(0, 8)}</p>
                  </div>
                  {pill(site.status || 'draft', site.status === 'live' ? 'green' : 'blue')}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <Link href={`/build/${site.id}`} className="rounded-xl border border-black/10 px-3 py-2 font-bold text-center hover:border-black/30">Operate</Link>
                  <Link href={`/store/${site.subdomain || site.id}`} className="rounded-xl bg-black px-3 py-2 font-bold text-white text-center hover:bg-black/80">View</Link>
                </div>
              </div>
            )) : (
              <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm xl:col-span-3 text-center text-black/45">No sales channels yet.</div>
            )}
          </div>

          <div id="service" className="rounded-3xl bg-[#111113] p-6 sm:p-8 text-white">
            <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">Actual Medusa backend</p>
                <h2 className="mt-3 text-3xl font-serif italic">The fork includes a real Medusa v2 service.</h2>
                <p className="mt-3 text-white/55">Run the backend locally or on a server to get the native Medusa Admin at /app, product workflows, Stripe module, manual fulfillment, file module, and Edge sync endpoints.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['backend/medusa', 'Medusa Admin /app', 'Stripe payments', 'Manual fulfillment', 'Edge sync API'].map(item => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">{item}</span>
                  ))}
                </div>
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black p-4 text-xs leading-relaxed text-emerald-200"><code>{`npm install --legacy-peer-deps
npm --prefix backend/medusa install
npm run medusa:migrate
npm run medusa:dev

# Native Medusa Admin
http://localhost:9000/app

# Edge backend console
http://localhost:3000/backend`}</code></pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
