import Link from 'next/link'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f6f5f2] text-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-serif italic tracking-tight">Pricing</h1>
          <p className="mt-4 text-lg text-black/55">Simple, transparent pricing. Start free, scale as you grow.</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {[
            ['Free', '5% transaction fee', 'Perfect for testing', ['Unlimited products', 'Basic templates', 'Email support']],
            ['Pro', '$99/mo', '5% transaction fee', ['Everything in Free', 'Custom domains', 'Priority support', 'Advanced analytics']],
            ['Enterprise', 'Custom', 'For marketplaces', ['Everything in Pro', 'Multi-store management', 'API access', 'Dedicated support']],
          ].map(([name, price, desc, features]) => (
            <div key={name as string} className="rounded-3xl border border-black/5 bg-white p-8">
              <h3 className="text-xl font-bold">{name as string}</h3>
              <p className="mt-2 text-3xl font-bold">{price as string}</p>
              <p className="mt-1 text-sm text-black/55">{desc as string}</p>
              <ul className="mt-6 space-y-2">
                {(features as string[]).map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-black/70">
                    <span className="text-emerald-600">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/" className="mt-6 block rounded-full bg-zinc-950 px-6 py-3 text-center text-sm font-bold text-white hover:bg-zinc-800">
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
