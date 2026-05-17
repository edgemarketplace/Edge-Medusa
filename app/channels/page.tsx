import Link from 'next/link'

export default function ChannelsPage() {
  return (
    <main className="min-h-screen bg-[#f6f5f2] text-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-serif italic tracking-tight">Channels</h1>
          <p className="mt-4 text-lg text-black/55">Distribution channels for your products. Reach customers across multiple networks.</p>
          <div className="mt-8">
            <Link href="/backend/channels" className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white hover:bg-zinc-800">
              Manage Channels
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Storefront', 'Your branded online store'],
            ['Marketplace', 'List in our vertical marketplaces'],
            ['Affiliate', 'Partner distribution network'],
            ['B2B', 'Wholesale and bulk ordering'],
          ].map(([name, desc]) => (
            <div key={name as string} className="rounded-3xl border border-black/5 bg-white p-6 text-center">
              <h3 className="font-bold">{name as string}</h3>
              <p className="mt-2 text-sm text-black/55">{desc as string}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
