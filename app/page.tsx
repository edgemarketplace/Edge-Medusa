'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const VERTICALS = [
  { emoji: '🛍️', label: 'Retail & Shop', desc: 'Product grids, collections, cart & checkout', color: '#E8D5C4' },
  { emoji: '⚡', label: 'Service Business', desc: 'Booking CTAs, service packages, trust builders', color: '#D4E8D5' },
  { emoji: '🍽️', label: 'Food & Catering', desc: 'Menus, gallery, reservations, ordering', color: '#E8D4D4' },
  { emoji: '🎨', label: 'Artisan & Maker', desc: 'Editorial story, gallery, handcraft showcase', color: '#D4D4E8' },
  { emoji: '🌸', label: 'Events & Floral', desc: 'Lookbook, packages, inquiry forms', color: '#E8D4E4' },
]

const STEPS = [
  { n: '01', title: 'Tell us your story', desc: 'Business name, what you sell, your email. 30 seconds.' },
  { n: '02', title: 'AI builds your site', desc: 'AI drafts the storefront while Medusa handles the commerce foundation.' },
  { n: '03', title: 'Edit & launch', desc: 'Click any text to edit it. Add products. Go live instantly.' },
]

const STATS = [
  { value: '1,200+', label: 'Storefronts launched' },
  { value: '< 5 min', label: 'Average setup time' },
  { value: 'Medusa v2', label: 'Commerce engine' },
  { value: 'Stripe', label: 'Payments ready' },
]

export default function LandingPage() {
  const [activeVertical, setActiveVertical] = useState(0)
  const [tick, setTick] = useState(TickState)

  function TickState() { return 0 }

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
          <span className="font-bold tracking-tight">Edge Marketplace</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/marketplace" className="text-sm font-bold text-black/60 hover:text-black transition-colors">Marketplace</Link>
          <Link href="/solutions" className="text-sm font-bold text-black/60 hover:text-black transition-colors">Solutions</Link>
          <Link href="/channels" className="text-sm font-bold text-black/60 hover:text-black transition-colors">Channels</Link>
          <Link href="/pricing" className="text-sm font-bold text-black/60 hover:text-black transition-colors">Pricing</Link>
          <div className="h-5 w-px bg-black/10" />
          <Link
            href="/login?role=merchant"
            className="text-sm font-bold text-black/70 hover:text-black transition-colors border border-black/10 px-4 py-2 rounded-full hover:border-black/30"
          >
            Merchant Login
          </Link>
          <Link
            href="/login?role=operator"
            className="text-sm font-bold text-black/70 hover:text-black transition-colors border border-black/10 px-4 py-2 rounded-full hover:border-black/30"
          >
            Operator Login
          </Link>
          <Link
            href="/onboarding"
            className="bg-[#1A1A1A] text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-black/80 transition-colors"
          >
            Launch Store →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative px-6 pt-20 pb-16 md:pt-32 md:pb-24 text-center overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-black/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white border border-black/8 rounded-full px-4 py-1.5 text-sm text-black/60 mb-8 shadow-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Commerce orchestration platform for federated marketplaces
          </div>

          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight leading-[1.05] mb-6">
            Not just another<br />
            <span className="text-black/30">storefront builder.</span>
          </h1>

          <p className="text-xl md:text-2xl text-black/55 max-w-2xl mx-auto mb-10 leading-relaxed">
            Edge generates a conversion-optimized storefront based on how your business sells — whether that's products, bookings, inquiries, reservations, or client enrollment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/onboarding"
              className="bg-[#1A1A1A] text-white px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-lg shadow-black/20"
            >
              Launch Your Store →
            </Link>
            <Link
              href="/backend"
              className="border border-black/10 bg-white px-8 py-4 rounded-full text-lg font-bold hover:border-black/30 transition-colors"
            >
              Operator Console →
            </Link>
          </div>

          {/* Social proof bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-black/45 mb-12">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>1,200+ storefronts launched</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Average setup under 5 minutes</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Optimized for mobile conversion</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Stripe-ready checkout included</span>
          </div>

          {/* Role Communication */}
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { role: 'Merchants', desc: 'Launch and operate your business', icon: '🏪' },
              { role: 'Operators', desc: 'Run your marketplace network', icon: '⚙️' },
              { role: 'Customers', desc: 'Shop seamlessly across stores', icon: '🛒' },
            ].map(({ role, desc, icon }) => (
              <div key={role} className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="font-bold text-sm">{role}</p>
                <p className="text-xs text-black/45 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="px-6 py-12 md:py-24 bg-[#111111] text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.24em] font-bold text-emerald-300 mb-4">Platform capabilities</p>
            <h2 className="text-3xl md:text-4xl font-serif italic text-white/90">Not templates. Operating infrastructure.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📡', title: 'Channel Governance', desc: 'Control distribution networks, visibility policies, and moderation state for your marketplace.' },
              { icon: '⚡', title: 'Event Architecture', desc: 'Domain events power activity feeds, AI enrichment, and federation APIs.' },
              { icon: '🏢', title: 'Multi-Tenant', desc: 'Organizations, scoped permissions, and capability-based access control.' },
              { icon: '🚀', title: 'Publication Workflows', desc: 'Draft → Pending → Published → Suspended. Governed lifecycle for every storefront.' },
              { icon: '🛍️', title: 'Medusa Commerce', desc: 'Catalog sync, orders, fulfillment, and Stripe payments via Medusa v2 backend.' },
              { icon: '🎨', title: 'Vertical OS', desc: 'Purpose-built funnels for retail, services, food, artisan, and events.' },
            ].map(f => (
              <div key={f.title} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/8 transition-colors">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-bold mb-2 text-white/90">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-6 text-center border border-black/5 shadow-sm">
              <p className="text-3xl font-bold font-serif italic mb-1">{s.value}</p>
              <p className="text-xs text-black/50 uppercase tracking-wider font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-6 py-12 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-black/35 mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-serif italic">Three steps. One click to launch.</h2>
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
            Join the commerce network. Launch your vertical-specific funnel in minutes.
          </p>
          <Link
            href="/onboarding"
            className="inline-block bg-[#1A1A1A] text-white px-10 py-5 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-xl shadow-black/15"
          >
            Start Building →
          </Link>
          <p className="text-black/35 text-sm mt-5">Merchant Login · Operator Login · Network Operations</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-black/5 px-6 py-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#1A1A1A] rounded flex items-center justify-center">
              <span className="font-serif italic font-bold text-white text-sm">E</span>
            </div>
            <span className="font-bold text-sm">Edge Marketplace</span>
          </div>
          <p className="text-black/40 text-sm">© {new Date().getFullYear()} Edge Marketplace. Commerce orchestration platform.</p>
          <div className="flex gap-6 text-sm text-black/40">
            <Link href="/login?role=merchant" className="hover:text-black transition-colors">Merchant Login</Link>
            <Link href="/login?role=operator" className="hover:text-black transition-colors">Operator Login</Link>
            <Link href="/onboarding" className="hover:text-black transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
