'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const VERTICALS = [
  { label: 'Retail & Products', microcopy: 'Catalogs, merchandising, fast checkout' },
  { label: 'Services', microcopy: 'Quotes, bookings, before/after proof' },
  { label: 'Restaurants & Catering', microcopy: 'Menus, ordering, reservations' },
  { label: 'Artisan Brands', microcopy: 'Storytelling, provenance, craftsmanship' },
  { label: 'Events & Floral', microcopy: 'Galleries, inquiries, availability' },
  { label: 'Coaches & Educators', microcopy: 'Funnels, enrollment, authority' },
]

const DIRECTIONS = [
  { name: 'Warm Artisan', system: 'Sage', desc: 'Handmade, approachable, naturally premium.', accent: '#6B7C6A', bg: '#F4F7F4', preview: 'font-serif italic', fit: 'Artisan · Floral · Events' },
  { name: 'Editorial Premium', system: 'Milano', desc: 'Luxury, story-driven, high perceived value.', accent: '#1A1A1A', bg: '#F9F8F6', preview: 'font-serif italic', fit: 'Retail · Fashion · Lifestyle' },
  { name: 'Professional Authority', system: 'Ocean', desc: 'Trusted authority with clean hierarchy.', accent: '#0891B2', bg: '#F0F9FF', preview: 'font-sans', fit: 'Services · Coaching · B2B' },
  { name: 'Bold Commercial', system: 'Sunlit', desc: 'Fast, promotional, conversion-forward.', accent: '#F59E0B', bg: '#FFFBF0', preview: 'font-sans', fit: 'Food · Retail · Events' },
]

const STEPS = [
  { n: '01', title: 'Tell us about your business', desc: 'Products, services, goals, and buying behavior.' },
  { n: '02', title: 'Edge recommends the right storefront system', desc: 'Layouts, conversion flows, and brand direction are generated automatically.' },
  { n: '03', title: 'Customize and launch', desc: 'Edit anything visually. Connect Stripe. Publish instantly.' },
]

export default function LandingPage() {
  const [activeDirection, setActiveDirection] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setActiveDirection(v => (v + 1) % DIRECTIONS.length)
    }, 3000)
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
            Launch a storefront built for how your business sells
          </h1>

          <p className="text-xl md:text-2xl text-black/55 max-w-2xl mx-auto mb-10 leading-relaxed">
            Edge generates conversion-optimized storefronts for products, services, bookings, restaurants, events, and client-based businesses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/onboarding"
              className="bg-[#1A1A1A] text-white px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-lg shadow-black/20"
            >
              Launch Your Store →
            </Link>
            <Link
              href="/onboarding"
              className="border border-black/10 bg-white px-8 py-4 rounded-full text-lg font-bold hover:border-black/30 transition-colors"
            >
              See How Edge Works
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-black/40 mb-16">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Stripe-ready</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Mobile-optimized</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Edge-deployed globally</span>
          </div>

          {/* ── AI-Generated Direction Previews ── */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-black/35 mb-5">
              AI-generated storefront directions tailored to your business model
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {DIRECTIONS.map((d, i) => (
                <div
                  key={d.system}
                  className={`relative rounded-2xl overflow-hidden border transition-all duration-500 ${
                    activeDirection === i ? 'border-black/20 shadow-md scale-[1.02]' : 'border-black/5 shadow-sm'
                  }`}
                >
                  <div className="h-20 flex items-center justify-center" style={{ backgroundColor: d.bg }}>
                    <span className={`text-sm font-bold ${d.preview}`} style={{ color: d.accent }}>
                      {d.name}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2.5 border-t border-black/5">
                    <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-black/35">{d.system}</p>
                    <p className="text-[10px] text-black/40 mt-0.5">{d.fit}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Moat statement */}
            <p className="text-xs text-black/35 mt-4">Every storefront is generated around conversion behavior, not just visual style.</p>
          </div>
        </div>
      </section>

      {/* ── BUILT FOR HOW BUSINESSES ACTUALLY SELL ── */}
      <section className="px-6 py-12 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif italic">Built for how businesses actually sell</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-x-8 gap-y-6">
            {VERTICALS.map(v => (
              <div key={v.label} className="py-4">
                <h3 className="font-bold text-sm mb-1">{v.label}</h3>
                <p className="text-sm text-black/45">{v.microcopy}</p>
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
            <h2 className="text-3xl md:text-4xl font-serif italic">Three steps. Ready to launch.</h2>
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
            Launch a storefront designed around how your business converts.
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
          <p className="text-black/40 text-sm">© {new Date().getFullYear()} Edge. Built on Medusa. Stripe-ready. Mobile-optimized.</p>
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
