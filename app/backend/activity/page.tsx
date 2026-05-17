import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type ActivityEvent = {
  id: string
  aggregate_type: string
  aggregate_id: string
  event_type: string
  payload: any
  created_at: string
  business_name?: string | null
  organization_id?: string | null
}

type EventStats = {
  total: number
  publishes: number
  products: number
  channels: number
}

async function loadActivity(): Promise<{ events: ActivityEvent[], stats: EventStats }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('domain_events')
      .select(`
        *,
        sites:aggregate_id(business_name, organization_id)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Activity load error:', error)
      return { events: [], stats: { total: 0, publishes: 0, products: 0, channels: 0 } }
    }

    const events = (data || []).map((row: any) => ({
      id: row.id,
      aggregate_type: row.aggregate_type,
      aggregate_id: row.aggregate_id,
      event_type: row.event_type,
      payload: row.payload,
      created_at: row.created_at,
      business_name: row.sites?.business_name || null,
      organization_id: row.sites?.organization_id || null,
    }))

    const stats: EventStats = {
      total: events.length,
      publishes: events.filter(e => e.event_type === 'site.published').length,
      products: events.filter(e => e.event_type.includes('product')).length,
      channels: events.filter(e => e.event_type.includes('channel')).length,
    }

    return { events, stats }
  } catch (err) {
    console.error('Activity error:', err)
    return { events: [], stats: { total: 0, publishes: 0, products: 0, channels: 0 } }
  }
}

function eventIcon(eventType: string) {
  if (eventType === 'site.published') return '🚀'
  if (eventType === 'site.updated') return '✏️'
  if (eventType === 'product.created') return '🛍️'
  if (eventType === 'product.updated') return '📦'
  if (eventType.includes('channel')) return '📡'
  if (eventType.includes('page.')) return '📄'
  return '⚡'
}

function eventLabel(event: ActivityEvent) {
  const name = event.business_name || event.payload?.business_name || 'Unknown store'
  const shortId = event.aggregate_id.slice(0, 8)

  switch (event.event_type) {
    case 'site.published':
      return `${name} published to marketplace`
    case 'site.updated':
      return `${name} updated storefront`
    case 'product.created':
      return `Added "${event.payload?.name || 'Product'}" to ${name}`
    case 'product.updated':
      return `Updated "${event.payload?.name || 'Product'}" in ${name}`
    case 'channel_visibility.updated':
      const channel = event.payload?.channel || 'channel'
      const state = event.payload?.visible ? 'visible' : 'hidden'
      return `${name} made ${channel} ${state}`
    case 'page.updated':
      return `${name} updated a page (${event.payload?.section_count || 0} sections)`
    default:
      return `${name} triggered ${event.event_type}`
  }
}

function timeGroup(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hrs = diff / 3600000
  if (hrs < 24) return 'Today'
  if (hrs < 48) return 'Yesterday'
  if (hrs < 168) return 'This Week'
  return 'Older'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default async function ActivityPage() {
  const { events, stats } = await loadActivity()

  // Group events by time
  const groups: Record<string, ActivityEvent[]> = {}
  events.forEach(event => {
    const group = timeGroup(event.created_at)
    if (!groups[group]) groups[group] = []
    groups[group].push(event)
  })

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
                <a key={label} href={href} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${href === '/backend/activity' ? 'bg-white text-black' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>
                  <span>{label}</span>
                  {index === 3 && <span className="text-xs">⌘4</span>}
                </a>
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35 mb-2">Event stream</p>
            <p className="text-sm font-bold">Domain events live</p>
            <p className="text-xs text-white/45 mt-2">Every publish, product change, and channel update emits an event.</p>
          </div>
        </aside>

        <section className="p-5 sm:p-8 lg:p-10 space-y-8">
          <header>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-black/55 mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Living network
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif italic tracking-tight">Activity Feed</h1>
            <p className="mt-3 max-w-2xl text-black/55">The heartbeat of your commerce network. Every publish, product change, and governance action flows here in real time.</p>
          </header>

          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total Events', stats.total, 'All domain events'],
              ['Publishes', stats.publishes, 'Stores gone live'],
              ['Product Changes', stats.products, 'Catalog updates'],
              ['Channel Updates', stats.channels, 'Visibility & governance'],
            ].map(([label, value, sub]) => (
              <div key={label as string} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/35">{label as string}</p>
                <p className="mt-3 text-3xl font-bold">{value as number}</p>
                <p className="mt-2 text-sm text-black/45">{sub as string}</p>
              </div>
            ))}
          </div>

          {events.length === 0 ? (
            <div className="rounded-3xl border border-black/5 bg-white p-10 text-center">
              <p className="text-black/40">No events yet. Events are emitted when stores publish, products are created, or channels updated.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groups).map(([group, groupEvents]) => (
                <div key={group}>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-black/35 mb-3">{group}</h2>
                  <div className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
                    <div className="divide-y divide-black/5">
                      {groupEvents.map(event => (
                        <div key={event.id} className="flex items-start gap-4 p-6 hover:bg-zinc-50/70">
                          <div className="text-2xl">{eventIcon(event.event_type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">{eventLabel(event)}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-black/40">
                              <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded">{event.aggregate_type}</span>
                              <span className="font-mono">{event.event_type.split('.').pop()}</span>
                              <span>·</span>
                              <span>{event.aggregate_id.slice(0, 8)}</span>
                              <span>·</span>
                              <span>{timeAgo(event.created_at)}</span>
                            </div>
                            {event.organization_id && (
                              <div className="mt-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs font-bold">
                                  <span>🏢</span> Org: {event.organization_id.slice(0, 8)}
                                </span>
                              </div>
                            )}
                          </div>
                          <Link 
                            href={`/build/${event.aggregate_id}`}
                            className="text-xs font-bold underline underline-offset-4 text-black/55 hover:text-black"
                          >
                            View
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl bg-[#111113] p-6 sm:p-8 text-white">
            <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">Event architecture</p>
                <h2 className="mt-3 text-3xl font-serif italic">Your moat is the network graph.</h2>
                <p className="mt-3 text-white/55">Every event emitted here powers activity feeds, AI enrichment, recommendation engines, moderation workflows, and federation APIs. This is the nervous system of your commerce orchestration platform.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['domain events', 'activity feeds', 'AI hooks', 'recommendations', 'moderation', 'federation'].map(item => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">{item}</span>
                  ))}
                </div>
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black p-4 text-xs leading-relaxed text-emerald-200"><code>{`// Events emitted so far:
site.published
product.created
product.updated
channel_visibility.updated
page.updated

// Coming soon:
order.completed
tenant_membership.updated
shared_product.published
publication.approved`}</code></pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
