'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const VERTICALS = [
  { icon: '🛍️', label: 'Retail & Products', microcopy: 'Catalogs, merchandising, fast checkout' },
  { icon: '⚡', label: 'Services', microcopy: 'Quotes, bookings, before/after proof' },
  { icon: '🍽️', label: 'Restaurants & Catering', microcopy: 'Menus, ordering, reservations' },
  { icon: '🎨', label: 'Artisan Brands', microcopy: 'Storytelling, provenance, craftsmanship' },
  { icon: '🌸', label: 'Events & Floral', microcopy: 'Galleries, inquiries, availability' },
  { icon: '🎓', label: 'Coaches & Educators', microcopy: 'Funnels, enrollment, authority' },
]

const STEPS = [
  { n: '01', title: 'Tell us about your business', desc: 'Products, services, goals, and buying behavior.' },
  { n: '02', title: 'Edge recommends the right storefront system', desc: 'Layouts, conversion flows, and brand direction are generated automatically.' },
  { n: '03', title: 'Customize and launch', desc: 'Edit anything visually. Connect Stripe. Publish instantly.' },
]

export default function LandingPage() {
  const [activeVertical, setActiveVertical] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setActiveVertical(v => (v + 1) % VERTICALS.length)
    }, 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-[#F9F8F6]/90 backdrop-blur border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
            <span className="font-serif italic font-bold text-white text-lg">E</span>
          </div>
          <span className="font-bold tracking-tight">Edge</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/solutions" className="text-sm font-bold text-black/60 hover:text-black transition-colors">Solutions</Link>
          <Link href="/pricing" className="text-sm font-bold text-black/60 hover:text-black transition-colors">Pricing</Link>
          <div className="h-5 w-px bg-black/10" />
          <Link
            href="/login"
            className="text-sm font-bold text-black/70 hover:text-black transition-colors border border-black/10 px-4 py-2 rounded-full hover:border-black/30"
          >
            Login
          </Link>
          <Link
            href="/onboarding"
            className="bg-[#1A1A1A] text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-black/80 transition-colors"
          >
            Launch Your Store →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative px-6 pt-20 pb-16 md:pt-32 md:pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-black/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight leading-[1.05] mb-6">
            Launch a storefront built for<br />
            <span className="text-black/30">how your business sells</span>
          </h1>

          <p className="text-xl md:text-2xl text-black/55 max-w-2xl mx-auto mb-10 leading-relaxed">
            Edge generates high-converting storefronts for products, services, bookings, food ordering, events, and client enrollment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/onboarding"
              className="bg-[#1A1A1A] text-white px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-lg shadow-black/20"
            >
              Launch Your Store →
            </Link>
            <Link
              href="/solutions"
              className="border border-black/10 bg-white px-8 py-4 rounded-full text-lg font-bold hover:border-black/30 transition-colors"
            >
              See Examples
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-black/40">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Stripe-ready</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Built on Medusa</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Mobile-optimized</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Edge-deployed globally</span>
          </div>
        </div>
      </section>

      {/* ── BUILT FOR HOW BUSINESSES ACTUALLY SELL ── */}
      <section className="px-6 py-12 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif italic">Built for how businesses actually sell</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {VERTICALS.map(v => (
              <div key={v.label} className="bg-[#F9F8F6] rounded-2xl p-6 border border-black/5 hover:border-black/10 transition-colors">
                <div className="text-2xl mb-3">{v.icon}</div>
                <h3 className="font-bold mb-2">{v.label}</h3>
                <p className="text-sm text-black/50 leading-relaxed">{v.microcopy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-6 py-12 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-black/35 mb-3">How Edge works</p>
            <h2 className="text-3xl md:text-4xl font-serif italic">Three steps. Instantly ready.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(step => (
              <div key={step.n} className="relative">
                <div className="text-6xl font-serif italic text-black/8 mb-4 select-none">{step.n}</div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-black/55 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="px-6 py-20 md:py-32 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight mb-6">
            Ready to launch?
          </h2>
          <p className="text-black/55 text-xl mb-10">
            Your storefront. Your products. Your way. Free to start.
          </p>
          <Link
            href="/onboarding"
            className="inline-block bg-[#1A1A1A] text-white px-10 py-5 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-xl shadow-black/15"
          >
            Launch Your Store →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-black/5 px-6 py-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#1A1A1A] rounded flex items-center justify-center">
              <span className="font-serif italic font-bold text-white text-sm">E</span>
            </div>
            <span className="font-bold text-sm">Edge</span>
          </div>
          <p className="text-black/40 text-sm">© {new Date().getFullYear()} Edge. Launch your storefront today.</p>
          <div className="flex gap-6 text-sm text-black/40">
            <Link href="/login" className="hover:text-black transition-colors">Login</Link>
            <Link href="/onboarding" className="hover:text-black transition-colors">Get Started</Link>
            <Link href="/pricing" className="hover:text-black transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
