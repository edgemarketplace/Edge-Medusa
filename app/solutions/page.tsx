import Link from 'next/link'

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-[#f6f5f2] text-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-serif italic tracking-tight">Solutions</h1>
          <p className="mt-4 text-lg text-black/55">Commerce solutions for every vertical. Build, launch, and scale your niche marketplace.</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/" className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white hover:bg-zinc-800">
              Launch Your Store
            </Link>
            <Link href="/marketplace" className="rounded-full border border-black/10 px-6 py-3 text-sm font-bold text-black hover:bg-zinc-100">
              Browse Marketplace
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Vertical Marketplaces', 'Niche-specific funnels with built-in psychology and trust mechanisms.'],
            ['Multi-Channel Commerce', 'Sell across storefronts, marketplaces, and affiliate networks.'],
            ['Headless Architecture', 'Medusa-powered commerce engine with full API control.'],
            ['Network Operations', 'Operator dashboard for managing merchants, channels, and publications.'],
            ['AI-Powered Funnels', 'Gemini-generated sections tailored to your vertical.'],
            ['Instant Launch', '15-minute store setup with pre-built templates.'],
          ].map(([title, desc]) => (
            <div key={title as string} className="rounded-3xl border border-black/5 bg-white p-6">
              <h3 className="font-bold">{title as string}</h3>
              <p className="mt-2 text-sm text-black/55">{desc as string}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
