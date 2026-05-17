import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { role?: string }
}) {
  const role = searchParams.role || 'merchant'

  // If user is already authenticated, redirect appropriately
  // This is handled by middleware/proxy in production

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-zinc-950">
      <div className="min-h-screen flex flex-col">
        {/* Minimal nav */}
        <nav className="px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
              <span className="font-serif italic font-bold text-white text-lg">E</span>
            </div>
            <span className="font-bold tracking-tight">Edge Marketplace</span>
          </Link>
          <Link href="/" className="text-sm text-black/50 hover:text-black transition-colors">
            ← Back to home
          </Link>
        </nav>

        {/* Role Selection */}
        <section className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-bold text-black/55 mb-6">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Welcome back
              </div>
              <h1 className="text-4xl md:text-5xl font-serif italic tracking-tight mb-4">
                Choose your workspace
              </h1>
              <p className="text-black/55 text-lg">
                This platform has multiple operating roles. Select how you want to continue.
              </p>
            </div>

            <div className="space-y-4">
              {/* Merchant Option */}
              <Link
                href="/login?role=merchant"
                className={`block w-full rounded-3xl border p-6 transition-all hover:shadow-md ${
                  role === 'merchant'
                    ? 'border-[#1a1a1a] bg-white shadow-md'
                    : 'border-black/5 bg-white hover:border-black/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🏪</div>
                  <div className="flex-1 text-left">
                    <h2 className="font-bold text-lg mb-1">Continue as Merchant</h2>
                    <p className="text-sm text-black/55 mb-3">Manage your stores, inventory, and channels.</p>
                    <div className="flex flex-wrap gap-2">
                      {['Your Stores', 'Inventory', 'Orders', 'Channels'].map(item => (
                        <span key={item} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full">{item}</span>
                      ))}
                    </div>
                  </div>
                  {role === 'merchant' && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-xs">✓</div>
                  )}
                </div>
              </Link>

              {/* Operator Option */}
              <Link
                href="/login?role=operator"
                className={`block w-full rounded-3xl border p-6 transition-all hover:shadow-md ${
                  role === 'operator'
                    ? 'border-[#1a1a1a] bg-white shadow-md'
                    : 'border-black/5 bg-white hover:border-black/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">⚙️</div>
                  <div className="flex-1 text-left">
                    <h2 className="font-bold text-lg mb-1">Continue as Operator</h2>
                    <p className="text-sm text-black/55 mb-3">Run your marketplace network and govern channels.</p>
                    <div className="flex flex-wrap gap-2">
                      {['Activity Feed', 'Channel Governance', 'Memberships', 'Publications'].map(item => (
                        <span key={item} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full">{item}</span>
                      ))}
                    </div>
                  </div>
                  {role === 'operator' && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-xs">✓</div>
                  )}
                </div>
              </Link>

              {/* Customer/Shopping Option */}
              <Link
                href="/login?role=customer"
                className={`block w-full rounded-3xl border p-6 transition-all hover:shadow-md ${
                  role === 'customer'
                    ? 'border-[#1a1a1a] bg-white shadow-md'
                    : 'border-black/5 bg-white hover:border-black/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🛒</div>
                  <div className="flex-1 text-left">
                    <h2 className="font-bold text-lg mb-1">Continue Shopping</h2>
                    <p className="text-sm text-black/55 mb-3">Access your customer account and order history.</p>
                    <div className="flex flex-wrap gap-2">
                      {['My Orders', 'Saved Items', 'Profile', 'Preferences'].map(item => (
                        <span key={item} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full">{item}</span>
                      ))}
                    </div>
                  </div>
                  {role === 'customer' && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-xs">✓</div>
                  )}
                </div>
              </Link>
            </div>

            {/* Auth Action */}
            <div className="mt-8 space-y-4">
              <Link
                href={`/api/auth/magic-link?role=${role}`}
                className="block w-full bg-[#1a1a1a] text-white text-center py-4 rounded-full text-lg font-bold hover:bg-black/80 transition-colors"
              >
                Sign in as {role === 'merchant' ? 'Merchant' : role === 'operator' ? 'Operator' : 'Customer'} →
              </Link>

              <p className="text-center text-sm text-black/40">
                New merchant? <Link href="/onboarding" className="font-bold underline underline-offset-4">Launch your store</Link>
              </p>
            </div>

            {/* Psychologically communicate the platform's nature */}
            <div className="mt-10 pt-8 border-t border-black/5">
              <p className="text-xs text-black/35 text-center uppercase tracking-[0.2em] font-bold mb-4">Platform architecture</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Operators', desc: 'Network operations' },
                  { label: 'Merchants', desc: 'Business operations' },
                  { label: 'Customers', desc: 'Commerce experience' },
                ].map(({ label, desc }) => (
                  <div key={label} className="rounded-2xl bg-white border border-black/5 p-3">
                    <p className="text-xs font-bold text-black/70">{label}</p>
                    <p className="text-xs text-black/35 mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-6 border-t border-black/5">
          <p className="text-center text-xs text-black/30">
            Edge Marketplace — Commerce orchestration platform for federated marketplaces
          </p>
        </footer>
      </div>
    </main>
  )
}
