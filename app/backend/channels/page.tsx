import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type ChannelRow = {
  slug: string
  name: string
  type: string
  status: string
  visibility: string
  site_id: string
  organization_id: string | null
  business_name?: string | null
}

type ChannelStats = {
  total: number
  active: number
  public: number
  marketplaces: number
}

async function loadChannels(): Promise<{ channels: ChannelRow[], stats: ChannelStats }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('marketplace_channels')
      .select(`
        *,
        sites:site_id(business_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Channels load error:', error)
      return { channels: [], stats: { total: 0, active: 0, public: 0, marketplaces: 0 } }
    }

    const channels = (data || []).map((row: any) => ({
      slug: row.slug,
      name: row.name,
      type: row.type || 'storefront',
      status: row.status || 'draft',
      visibility: row.visibility || 'public',
      site_id: row.site_id,
      organization_id: row.organization_id,
      business_name: row.sites?.business_name || null,
    }))

    const stats: ChannelStats = {
      total: channels.length,
      active: channels.filter(c => c.status === 'active').length,
      public: channels.filter(c => c.visibility === 'public').length,
      marketplaces: channels.filter(c => c.type === 'marketplace').length,
    }

    return { channels, stats }
  } catch (err) {
    console.error('Channels error:', err)
    return { channels: [], stats: { total: 0, active: 0, public: 0, marketplaces: 0 } }
  }
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

function typeLabel(type: string) {
  const map: Record<string, string> = {
    storefront: 'Storefront',
    marketplace: 'Marketplace',
    affiliate: 'Affiliate',
    b2b: 'B2B',
  }
  return map[type] || type
}

function statusFlow(status: string) {
  const steps = ['draft', 'pending', 'published', 'suspended']
  const currentIndex = steps.indexOf(status)
  return (
    <div className="flex items-center gap-1 text-xs">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <span className={`capitalize ${i === currentIndex ? 'font-bold text-black' : i < currentIndex ? 'text-emerald-600' : 'text-zinc-300'}`}>
            {step}
          </span>
          {i < steps.length - 1 && <span className="text-zinc-300">→</span>}
        </div>
      ))}
    </div>
  )
}

export default async function ChannelsPage() {
  const { channels, stats } = await loadChannels()

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
                ['Overview', '/backend'],
                ['Products', '/backend#products'],
                ['Orders', '/backend#orders'],
                ['Activity', '/backend/activity'],
                ['Channel governance', '/backend/channels'],
                ['Client marketplace', '/marketplace'],
                ['Backend service', '/backend#service'],
              ].map(([label, href], index) => (
                <a key={label} href={href} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${href === '/backend/channels' ? 'bg-white text-black' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>
                  <span>{label}</span>
                  {index === 4 && <span className="text-xs">⌘5</span>}
                </a>
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35 mb-2">Channel control</p>
            <p className="text-sm font-bold">Governance plane</p>
            <p className="text-xs text-white/45 mt-2">Manage distribution channels, visibility policies, and moderation state for the marketplace network.</p>
          </div>
        </aside>

        <section className="p-5 sm:p-8 lg:p-10 space-y-8">
          <header>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-black/55 mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Governance
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif italic tracking-tight">Channel Governance</h1>
            <p className="mt-3 max-w-2xl text-black/55">Control distribution channels, visibility policies, and moderation state. Channels are the strategic control plane for your marketplace network.</p>
          </header>

          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total Channels', stats.total, 'Distribution networks'],
              ['Active Channels', stats.active, 'Live and publishing'],
              ['Public Channels', stats.public, 'Discoverable by shoppers'],
              ['Marketplaces', stats.marketplaces, 'Vertical marketplaces'],
            ].map(([label, value, sub]) => (
              <div key={label as string} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/35">{label as string}</p>
                <p className="mt-3 text-3xl font-bold">{value as number}</p>
                <p className="mt-2 text-sm text-black/45">{sub as string}</p>
              </div>
            ))}
          </div>

          {channels.length === 0 ? (
            <div className="rounded-3xl border border-black/5 bg-white p-10 text-center">
              <p className="text-black/40">No channels yet. Channels are created when merchants publish stores or join marketplaces.</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase tracking-widest text-black/35">
                    <tr>
                      <th className="px-6 py-3">Channel</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Publication Flow</th>
                      <th className="px-6 py-3">Visibility</th>
                      <th className="px-6 py-3">Merchant</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {channels.map(channel => (
                      <tr key={channel.slug} className="hover:bg-zinc-50/70">
                        <td className="px-6 py-4">
                          <p className="font-bold">{channel.name}</p>
                          <p className="text-xs text-black/40">{channel.slug}</p>
                        </td>
                        <td className="px-6 py-4">{pill(typeLabel(channel.type), 'blue')}</td>
                        <td className="px-6 py-4">{statusFlow(channel.status)}</td>
                        <td className="px-6 py-4">{pill(channel.visibility, channel.visibility === 'public' ? 'green' : 'gray')}</td>
                        <td className="px-6 py-4 text-black/55">{channel.business_name || '—'}</td>
                        <td className="px-6 py-4">
                          <Link href={`/build/${channel.site_id}`} className="font-bold underline underline-offset-4 text-sm">Manage</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-[#111113] p-6 sm:p-8 text-white">
            <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">Strategic control plane</p>
                <h2 className="mt-3 text-3xl font-serif italic">Channels are your moat.</h2>
                <p className="mt-3 text-white/55">Each channel represents a distribution network, affiliate rail, B2B relationship, or vertical marketplace. Governing them with types, policies, and moderation is what transforms a storefront builder into a commerce network.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['storefront', 'marketplace', 'affiliate', 'B2B', 'syndication', 'federation'].map(item => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">{item}</span>
                  ))}
                </div>
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black p-4 text-xs leading-relaxed text-emerald-200"><code>{`// Channel governance model:
{
  type: 'marketplace',
  visibility: 'public',
  status: 'active',
  moderation: 'auto',
  syndication: true,
  ranking: 'relevance'
}

// Publication pipeline:
Draft → Pending Review → Published → Suspended

// Future capabilities:
// - moderation states
// - ranking rules
// - syndication policies
// - partner agreements
// - B2B supply rails`}</code></pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
