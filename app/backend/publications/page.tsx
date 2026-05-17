import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type PublicationRow = {
  id: string
  site_id: string
  business_name: string | null
  status: string
  channel_slug: string | null
  channel_name: string | null
  submitted_at: string
  reviewed_at: string | null
  reviewer_email: string | null
  rejection_reason: string | null
}

async function loadPublications(): Promise<PublicationRow[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sites')
      .select(`
        id,
        business_name,
        published,
        updated_at,
        marketplace_channels(channel_slug, channel_name)
      `)
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Publications load error:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      site_id: row.id,
      business_name: row.business_name,
      status: row.published ? 'published' : 'draft',
      channel_slug: row.marketplace_channels?.[0]?.channel_slug || null,
      channel_name: row.marketplace_channels?.[0]?.channel_name || null,
      submitted_at: row.updated_at,
      reviewed_at: null,
      reviewer_email: null,
      rejection_reason: null,
    }))
  } catch (err) {
    console.error('Publications error:', err)
    return []
  }
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; tone: 'green' | 'amber' | 'gray' | 'red' }> = {
    draft: { label: 'Draft', tone: 'gray' },
    pending: { label: 'Pending Review', tone: 'amber' },
    published: { label: 'Published', tone: 'green' },
    suspended: { label: 'Suspended', tone: 'red' },
  }
  const s = map[status] || map.draft
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    gray: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${colors[s.tone]}`}>{s.label}</span>
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default async function PublicationsPage() {
  const publications = await loadPublications()
  const pending = publications.filter(p => p.status === 'draft')
  const live = publications.filter(p => p.status === 'published')

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="bg-[#111113] text-white p-6 flex flex-col justify-between">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-10">
              <div className="h-9 w-9 rounded-xl bg-white text-black grid place-items-center font-serif italic font-bold">M</div>
              <div>
                <p className="font-bold leading-tight">Edge Marketplace</p>
                <p className="text-xs text-white/45">commerce backend</p>
              </div>
            </Link>

            <nav className="space-y-1 text-sm">
              {[
                ['Overview', '/backend'],
                ['Activity', '/backend/activity'],
                ['Publications', '/backend/publications'],
                ['Channel governance', '/backend/channels'],
                ['Memberships', '/backend/memberships'],
                ['Client marketplace', '/marketplace'],
                ['Backend service', '/backend#service'],
              ].map(([label, href], index) => (
                <a key={label} href={href} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${href === '/backend/publications' ? 'bg-white text-black' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>
                  <span>{label}</span>
                  {index === 2 && <span className="text-xs">⌘7</span>}
                </a>
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35 mb-2">Governance cockpit</p>
            <p className="text-sm font-bold">Publication control</p>
            <p className="text-xs text-white/45 mt-2">Approve, reject, and manage publication lifecycle across the marketplace network.</p>
          </div>
        </aside>

        <section className="p-5 sm:p-8 lg:p-10 space-y-8">
          <header>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-black/55 mb-4">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> Pending reviews
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif italic tracking-tight">Publications</h1>
            <p className="mt-3 max-w-2xl text-black/55">The governance cockpit. Approve, reject, and manage publication lifecycle across the marketplace network.</p>
          </header>

          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Pending Review', pending.length, 'Awaiting approval'],
              ['Live Publications', live.length, 'Published stores'],
              ['Channels', publications.filter(p => p.channel_name).length, 'Distribution networks'],
              ['Total Sites', publications.length, 'All storefronts'],
            ].map(([label, value, sub]) => (
              <div key={label as string} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/35">{label as string}</p>
                <p className="mt-3 text-3xl font-bold">{value as number}</p>
                <p className="mt-2 text-sm text-black/45">{sub as string}</p>
              </div>
            ))}
          </div>

          {/* Pending Approvals */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Pending Approvals
              </h2>
              <div className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-left text-xs uppercase tracking-widest text-black/35">
                      <tr>
                        <th className="px-6 py-3">Store</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Channel</th>
                        <th className="px-6 py-3">Submitted</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {pending.map(p => (
                        <tr key={p.id} className="hover:bg-zinc-50/70">
                          <td className="px-6 py-4">
                            <p className="font-bold">{p.business_name || 'Unnamed Store'}</p>
                            <p className="text-xs text-black/40">{p.site_id.slice(0, 8)}</p>
                          </td>
                          <td className="px-6 py-4">{statusBadge(p.status)}</td>
                          <td className="px-6 py-4 text-black/55 text-sm">
                            {p.channel_name || <span className="text-black/30">—</span>}
                          </td>
                          <td className="px-6 py-4 text-xs text-black/40">{timeAgo(p.submitted_at)}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Link
                                href={`/build/${p.site_id}`}
                                className="text-xs font-bold underline underline-offset-4 text-emerald-600 hover:text-emerald-800"
                              >
                                Approve
                              </Link>
                              <button className="text-xs font-bold underline underline-offset-4 text-red-600 hover:text-red-800">
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* All Publications */}
          <div>
            <h2 className="text-lg font-bold mb-4">All Publications</h2>
            {publications.length === 0 ? (
              <div className="rounded-3xl border border-black/5 bg-white p-10 text-center">
                <p className="text-black/40">No publications yet. Sites will appear here when merchants create stores.</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-left text-xs uppercase tracking-widest text-black/35">
                      <tr>
                        <th className="px-6 py-3">Store</th>
                        <th className="px-6 py-3">Publication Flow</th>
                        <th className="px-6 py-3">Channel</th>
                        <th className="px-6 py-3">Last Updated</th>
                        <th className="px-6 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {publications.map(p => (
                        <tr key={p.id} className="hover:bg-zinc-50/70">
                          <td className="px-6 py-4">
                            <p className="font-bold">{p.business_name || 'Unnamed Store'}</p>
                            <p className="text-xs text-black/40">{p.site_id.slice(0, 8)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs">
                              <span className={`${p.status === 'published' ? 'text-emerald-600 font-bold' : 'text-zinc-300'}`}>Draft</span>
                              <span className="text-zinc-300">→</span>
                              <span className={`${p.status === 'published' ? 'text-emerald-600 font-bold' : 'text-zinc-300'}`}>Pending</span>
                              <span className="text-zinc-300">→</span>
                              <span className={`${p.status === 'published' ? 'text-emerald-600 font-bold' : 'text-zinc-300'}`}>Published</span>
                              <span className="text-zinc-300">→</span>
                              <span className="text-zinc-300">Suspended</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-black/55 text-sm">
                            {p.channel_name || <span className="text-black/30">—</span>}
                          </td>
                          <td className="px-6 py-4 text-xs text-black/40">{timeAgo(p.submitted_at)}</td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/build/${p.site_id}`}
                              className="text-xs font-bold underline underline-offset-4 text-black/55 hover:text-black"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-[#111113] p-6 sm:p-8 text-white">
            <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">Publication lifecycle</p>
                <h2 className="mt-3 text-3xl font-serif italic">Governance cockpit.</h2>
                <p className="mt-3 text-white/55">Every publication flows through Draft → Pending → Published → Suspended. This is where you approve merchants, reject non-compliant stores, and manage marketplace quality.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['approval queues', 'moderation', 'rejection reasons', 'escalation paths', 'quality control'].map(item => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">{item}</span>
                  ))}
                </div>
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black p-4 text-xs leading-relaxed text-emerald-200"><code>{`// Publication lifecycle:
{
  status: 'pending',
  submitted_at: '2026-05-17T...',
  reviewer_email: null,
  rejection_reason: null,
}

// Reviewer actions:
✓ Approve → status: 'published'
✗ Reject → status: 'draft' + reason
⚠ Suspend → status: 'suspended'

// Future:
// - auto-approval rules
// - quality scoring
// - moderation AI
// - appeal process`}</code></pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
