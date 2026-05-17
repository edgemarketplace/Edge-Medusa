import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type MemberRow = {
  email: string
  role: string
  organization_id: string | null
  organization_name?: string | null
  capabilities: string[]
  granted_by?: string | null
  granted_at?: string | null
}

async function loadMemberships(): Promise<MemberRow[]> {
  try {
    // For now, load from sites (owners) + future membership table
    const { data, error } = await supabaseAdmin
      .from('sites')
      .select('contact_email, organization_id, business_name')
      .not('contact_email', 'is', null)
      .limit(50)

    if (error) {
      console.error('Memberships load error:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      email: row.contact_email,
      role: 'owner',
      organization_id: row.organization_id,
      organization_name: row.business_name,
      capabilities: [
        'site:publish',
        'site:edit',
        'site:delete',
        'inventory:manage',
        'orders:view',
        'pages:edit',
        'channels:manage',
      ],
      granted_by: null,
      granted_at: null,
    }))
  } catch (err) {
    console.error('Memberships error:', err)
    return []
  }
}

const ALL_CAPABILITIES = [
  { id: 'site:publish', label: 'Publish sites', icon: '🚀' },
  { id: 'site:edit', label: 'Edit storefront', icon: '✏️' },
  { id: 'site:delete', label: 'Delete sites', icon: '🗑️' },
  { id: 'inventory:manage', label: 'Manage inventory', icon: '🛍️' },
  { id: 'orders:view', label: 'View orders', icon: '📦' },
  { id: 'pages:edit', label: 'Edit pages', icon: '📄' },
  { id: 'channels:manage', label: 'Manage channels', icon: '📡' },
  { id: 'members:invite', label: 'Invite members', icon: '➕' },
  { id: 'org:suspend', label: 'Suspend merchants', icon: '⚠️' },
]

function CapabilityBadges({ capabilities }: { capabilities: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_CAPABILITIES.map(cap => {
        const has = capabilities.includes(cap.id)
        return (
          <span
            key={cap.id}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${
              has
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-zinc-50 text-zinc-300 border-zinc-200 line-through'
            }`}
          >
            <span>{cap.icon}</span>
            <span>{cap.label}</span>
            {has && <span className="text-emerald-500">✓</span>}
            {!has && <span className="text-zinc-300">✗</span>}
          </span>
        )
      })}
    </div>
  )
}

function ScopeBadges({ organization_id, organization_name }: { organization_id: string | null, organization_name?: string | null | undefined }) {
  if (!organization_id) return <span className="text-xs text-black/30">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs font-bold">
        <span>🏢</span>
        <span>{organization_name ?? organization_id.slice(0, 8)}</span>
      </span>
    </div>
  )
}

export default async function MembershipsPage() {
  const members = await loadMemberships()

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
                ['Memberships', '/backend/memberships'],
                ['Client marketplace', '/marketplace'],
                ['Backend service', '/backend#service'],
              ].map(([label, href], index) => (
                <a key={label} href={href} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${href === '/backend/memberships' ? 'bg-white text-black' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>
                  <span>{label}</span>
                  {index === 5 && <span className="text-xs">⌘6</span>}
                </a>
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35 mb-2">Permission plane</p>
            <p className="text-sm font-bold">Capability-based access</p>
            <p className="text-xs text-white/45 mt-2">Members see only what they can do, scoped to their channels and organizations.</p>
          </div>
        </aside>

        <section className="p-5 sm:p-8 lg:p-10 space-y-8">
          <header>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-black/55 mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Governance
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif italic tracking-tight">Memberships</h1>
            <p className="mt-3 max-w-2xl text-black/55">Capability-based access control. Members see exactly what they can do, scoped to their organizations and channels. Not just "admin" — explicit permissions.</p>
          </header>

          {/* Capability Legend */}
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/35 mb-4">Capability Legend</p>
            <div className="flex flex-wrap gap-2">
              {ALL_CAPABILITIES.map(cap => (
                <span key={cap.id} className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 text-zinc-600 border border-zinc-200 px-3 py-1.5 text-xs font-bold">
                  <span>{cap.icon}</span>
                  <span>{cap.label}</span>
                </span>
              ))}
            </div>
          </div>

          {members.length === 0 ? (
            <div className="rounded-3xl border border-black/5 bg-white p-10 text-center">
              <p className="text-black/40">No memberships yet. Members will appear when merchants join organizations.</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase tracking-widest text-black/35">
                    <tr>
                      <th className="px-6 py-3">Member</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Capabilities</th>
                      <th className="px-6 py-3">Scope</th>
                      <th className="px-6 py-3">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {members.map((member, i) => (
                      <tr key={i} className="hover:bg-zinc-50/70">
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm">{member.email}</p>
                          <p className="text-xs text-black/40">{member.role}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                            member.role === 'owner' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            member.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <CapabilityBadges capabilities={member.capabilities} />
                        </td>
                <td className="px-6 py-4">
                  <ScopeBadges organization_id={member.organization_id} organization_name={member.organization_name ?? null} />
                </td>
                        <td className="px-6 py-4">
                          {member.granted_by ? (
                            <div className="text-xs text-black/40">
                              <p>By: {member.granted_by}</p>
                              <p>{member.granted_at ? new Date(member.granted_at).toLocaleDateString() : '—'}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-black/30">—</span>
                          )}
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
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">Permission architecture</p>
                <h2 className="mt-3 text-3xl font-serif italic">Capabilities, not roles.</h2>
                <p className="mt-3 text-white/55">Role-based access is too coarse. Capability-based access lets merchants see exactly what they can do, scoped to their organizations and channels. This is how you build trust in a multi-tenant network.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['site:publish', 'inventory:manage', 'channels:manage', 'members:invite'].map(item => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">{item}</span>
                  ))}
                </div>
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black p-4 text-xs leading-relaxed text-emerald-200"><code>{`// Capability model:
{
  role: 'owner',
  capabilities: [
    'site:publish',
    'inventory:manage',
    'channels:manage',
    ...
  ],
  scope: {
    organizations: ['org_123'],
    channels: ['outdoor-gear'],
    marketplaces: ['b2b-supply']
  }
}

// Future:
// - invitation workflow
// - audit trail UI
// - scoped dashboards
// - temporary grants`}</code></pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
