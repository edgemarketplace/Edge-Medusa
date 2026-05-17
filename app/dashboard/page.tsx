import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { isSuperAdmin } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  // Check if user is super admin - redirect to backend
  const email = searchParams.email || ''
  if (email && isSuperAdmin(email)) {
    redirect('/backend')
  }

  // In a real implementation, this would read the user's session
  // and redirect based on role (merchant -> /dashboard, operator -> /backend)
  // For now, show a workspace selector

  const { data: sites } = await supabaseAdmin
    .from('sites')
    .select('id, subdomain, business_name, organization_id')
    .limit(50)

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-zinc-950">
      <div className="min-h-screen flex flex-col">
        {/* Minimal nav */}
        <nav className="px-6 py-4 flex items-center justify-between border-b border-black/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
              <span className="font-serif italic font-bold text-white text-lg">E</span>
            </div>
            <span className="font-bold tracking-tight">Edge Marketplace</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/backend" className="text-sm font-bold text-black/60 hover:text-black">Operator Console</Link>
            <Link href="/login?role=merchant" className="text-sm text-black/50 hover:text-black">Switch Workspace</Link>
          </div>
        </nav>

        <section className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-black/55 mb-4">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Merchant workspace
              </div>
              <h1 className="text-4xl font-serif italic tracking-tight mb-4">Your Stores</h1>
              <p className="text-black/55 text-lg">Select a workspace to manage your business.</p>
            </div>

            {(!sites || sites.length === 0) ? (
              <div className="rounded-3xl border border-black/5 bg-white p-10 text-center">
                <p className="text-black/40 mb-6">No stores yet. Launch your first storefront.</p>
                <Link
                  href="/onboarding"
                  className="inline-block bg-[#1a1a1a] text-white px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform"
                >
                  Launch Store →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sites.map(site => (
                  <Link
                    key={site.id}
                    href={`/build/${site.id}`}
                    className="block rounded-3xl border border-black/5 bg-white p-6 hover:border-black/20 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-bold text-lg">{site.business_name || site.subdomain}</h2>
                        <p className="text-sm text-black/40 mt-1">{site.subdomain}.edge-medusa.com</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {site.organization_id && (
                          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">
                            Organization
                          </span>
                        )}
                        <span className="text-sm font-bold text-black/55 group-hover:text-black underline underline-offset-4">
                          Manage →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Workspace Switcher Hint */}
            <div className="mt-10 pt-8 border-t border-black/5">
              <p className="text-xs text-black/30 text-center uppercase tracking-[0.2em] font-bold mb-4">Workspace switcher</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Merchant', desc: 'Your stores', icon: '🏪' },
                  { label: 'Operator', desc: 'Network ops', icon: '⚙️' },
                  { label: 'Customer', desc: 'Shop', icon: '🛒' },
                ].map(({ label, desc, icon }) => (
                  <Link
                    key={label}
                    href={`/login?role=${label.toLowerCase()}`}
                    className="rounded-2xl bg-white border border-black/5 p-4 hover:border-black/20 transition-colors"
                  >
                    <div className="text-2xl mb-2">{icon}</div>
                    <p className="text-xs font-bold">{label}</p>
                    <p className="text-xs text-black/35 mt-1">{desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
