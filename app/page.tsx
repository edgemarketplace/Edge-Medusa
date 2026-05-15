import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans">
      {/* Nav */}
      <nav className="flex justify-between items-center py-6 px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center font-serif italic font-bold text-white text-xl">
            E
          </div>
          <span className="font-bold tracking-tight text-xl">Edge Marketplace Hub</span>
        </div>
        <Link
          href="/onboarding"
          className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform"
        >
          Start building
        </Link>
      </nav>

      {/* Hero */}
      <header className="px-8 pt-20 pb-24 max-w-5xl mx-auto text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-black/35 mb-6">
          Launch your store in 15 minutes
        </p>
        <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight leading-[0.95] mb-8">
          From concept to
          <br />
          accepting payments.
        </h1>
        <p className="text-xl text-black/60 leading-relaxed max-w-2xl mx-auto mb-12">
          Describe your business. Our AI builds your store. Add your products, connect Stripe, and go live.
          No coding. No templates to stare at. Just your store, ready to sell.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-full text-lg font-bold hover:scale-105 transition-transform"
        >
          Start free
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </header>

      {/* Steps */}
      <section className="px-8 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              num: '01',
              title: 'Describe your business',
              desc: 'Tell us your business name, what you sell, and pick a style. Takes 30 seconds.',
            },
            {
              num: '02',
              title: 'AI builds your store',
              desc: 'Our AI generates a complete storefront with products, copy, and layout. Instantly.',
            },
            {
              num: '03',
              title: 'Connect & launch',
              desc: 'Add your products, connect Stripe, and go live. Start accepting payments today.',
            },
          ].map((step) => (
            <div
              key={step.num}
              className="bg-white border border-black/5 rounded-3xl p-8"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-black/35 mb-4">
                {step.num}
              </p>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-black/60 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 py-8 px-8 text-center text-sm text-black/40">
        <p>© 2026 Edge Marketplace Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}
