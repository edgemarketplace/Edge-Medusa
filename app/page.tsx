'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const VERTICALS = [
  { emoji: '🛍️', label: 'Retail & Shop', desc: 'Product grids, collections, cart & checkout', color: '#E8D5C4' },
  { emoji: '⚡', label: 'Service Business', desc: 'Booking CTAs, service packages, trust builders', color: '#D4E8D5' },
  { emoji: '🍽️', label: 'Food & Catering', desc: 'Menus, gallery, reservations, ordering', color: '#E8D4D4' },
  { emoji: '🎨', label: 'Artisan & Maker', desc: 'Editorial story, gallery, handcraft showcase', color: '#D4D4E8' },
  { emoji: '🌸', label: 'Events & Floral', desc: 'Lookbook, packages, inquiry forms', color: '#E8D4E4' },
];

const STEPS = [
  { n: '01', title: 'Tell us your story', desc: 'Business name, what you sell, your email. 30 seconds.' },
  { n: '02', title: 'AI builds your site', desc: 'GPT-4o writes copy, picks sections, designs your layout. ~15 seconds.' },
  { n: '03', title: 'Edit & launch', desc: 'Click any text to edit it. Add products. Go live instantly.' },
];

const STATS = [
  { value: '< 15 min', label: 'Average time to launch' },
  { value: '5', label: 'Business verticals' },
  { value: '35+', label: 'Page section types' },
  { value: '100%', label: 'You own your data' },
];

export default function LandingPage() {
  const [activeVertical, setActiveVertical] = useState(0);
  const [tick, setTick] = useState(TickState);

  // We need to initialize this with a stable value for SSR
  function TickState() { return 0; }

  useEffect(() => {
    const t = setInterval(() => {
      setActiveVertical(v => (v + 1) % VERTICALS.length);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-[#F9F8F6]/90 backdrop-blur border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
            <span className="font-serif italic font-bold text-white text-lg">E</span>
          </div>
          <span className="font-bold tracking-tight">Edge Marketplace Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-black/50 hover:text-black transition-colors">Sign in</Link>
          <Link
            href="/onboarding"
            className="bg-[#1A1A1A] text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-black/80 transition-colors"
          >
            Start free →
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
            AI-powered · No code · Live in minutes
          </div>

          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight leading-[1.05] mb-6">
            Your business online
            <br />
            <span className="text-black/30">in 15 minutes.</span>
          </h1>

          <p className="text-xl md:text-2xl text-black/55 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tell us what you sell. AI writes your copy, designs your storefront,
            and sets up payments. You edit. You launch.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/onboarding"
              className="bg-[#1A1A1A] text-white px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-lg shadow-black/20"
            >
              Build my store →
            </Link>
            <span className="text-black/40 text-sm">Free to start · No credit card</span>
          </div>

          {/* Animated vertical badges */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {VERTICALS.map((v, i) => (
              <Link
                key={v.label}
                href={`/onboarding?vertical=${encodeURIComponent(['retail-core','service-pro','food-catering','artisan-market','event-floral'][i] || 'retail-core')}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeVertical === i
                    ? 'bg-[#1A1A1A] text-white shadow-md scale-105'
                    : 'bg-white border border-black/10 text-black/60 hover:border-black/20'
                }`}
                onClick={() => setActiveVertical(i)}
              >
                <span>{v.emoji}</span>
                <span>{v.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO PREVIEW ── */}
      <section className="px-6 py-8 md:py-16">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl overflow-hidden shadow-2xl border border-black/5 transition-all duration-500"
            style={{ backgroundColor: VERTICALS[activeVertical].color }}
          >
            {/* Browser chrome */}
            <div className="bg-white/80 backdrop-blur px-4 py-3 flex items-center gap-2 border-b border-black/5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <div className="flex-1 bg-black/5 rounded-full px-4 py-1 text-xs text-black/40 mx-4">
                {VERTICALS[activeVertical].label.toLowerCase().replace(/ & /g, '-').replace(/ /g, '')}.edgemarketplacehub.com
              </div>
            </div>

            <div className="p-8 md:p-12 min-h-[240px] flex flex-col items-center justify-center text-center">
              <span className="text-5xl mb-4 block">{VERTICALS[activeVertical].emoji}</span>
              <h2 className="text-2xl font-serif italic mb-2">
                {['Bella\'s Blooms', 'Peak Performance Studio', 'La Casa Kitchen', 'Clay & Thread', 'Petal & Pine Events'][activeVertical]}
              </h2>
              <p className="text-black/60 text-sm max-w-xs">
                {VERTICALS[activeVertical].desc}
              </p>
              <div className="mt-6 flex gap-3">
                <div className="bg-white/60 rounded-full px-4 py-1.5 text-xs font-medium text-black/60 border border-black/10">Shop Now</div>
                <div className="bg-[#1A1A1A]/80 rounded-full px-4 py-1.5 text-xs font-medium text-white">Book a Call</div>
              </div>
            </div>

            {/* Product row */}
            <div className="bg-white/40 px-8 py-4 flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 bg-white/70 rounded-2xl p-3 w-32">
                  <div className="w-full h-16 bg-black/5 rounded-xl mb-2" style={{ backgroundColor: VERTICALS[activeVertical].color }} />
                  <div className="h-2 bg-black/10 rounded w-3/4 mb-1" />
                  <div className="h-2 bg-black/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-black/35 mt-4">
            ↑ Your store, AI-generated, fully editable. Built in under 15 minutes.
          </p>
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

      {/* ── VERTICALS DEEP DIVE ── */}
      <section className="px-6 py-12 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-black/35 mb-3">Built for your industry</p>
            <h2 className="text-3xl md:text-4xl font-serif italic">Every vertical. Every workflow.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {VERTICALS.map((v, i) => (
              <Link
                key={v.label}
                href={`/onboarding?vertical=${encodeURIComponent(['retail-core','service-pro','food-catering','artisan-market','event-floral'][i] || 'retail-core')}`}
                className="group bg-white rounded-3xl p-6 border border-black/5 hover:border-black/15 transition-all cursor-pointer hover:shadow-md block"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{v.emoji}</div>
                  <div>
                    <h3 className="font-bold mb-1">{v.label}</h3>
                    <p className="text-sm text-black/55">{v.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="px-6 py-12 md:py-24 bg-[#1A1A1A] text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif italic text-white/90">Everything included.</h2>
            <p className="text-white/50 mt-3 text-lg">No plugins. No add-ons. No surprises.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'AI copywriting', desc: 'GPT-4o writes headlines, product descriptions, and CTAs tuned to your vertical.' },
              { icon: '🎨', title: 'Smart layout system', desc: '35+ section types arranged by proven conversion patterns for your business type.' },
              { icon: '✏️', title: 'In-place editing', desc: 'Click any text on your page to edit it. No forms. No modals. Just type.' },
              { icon: '💳', title: 'Stripe payments', desc: 'Accept cards, Apple Pay, Google Pay. Connect your Stripe account in seconds.' },
              { icon: '📦', title: 'Inventory manager', desc: 'Add products or services with prices, photos, and descriptions from your dashboard.' },
              { icon: '📊', title: 'Orders & clients', desc: 'See every order, every customer, total revenue — all inside your dashboard.' },
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

      {/* ── CTA BOTTOM ── */}
      <section className="px-6 py-20 md:py-32 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight mb-6">
            Your store is waiting.
          </h2>
          <p className="text-black/55 text-xl mb-10">
            Join thousands of small businesses who launched in under 15 minutes.
          </p>
          <Link
            href="/onboarding"
            className="inline-block bg-[#1A1A1A] text-white px-10 py-5 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-xl shadow-black/15"
          >
            Build my store — it&apos;s free →
          </Link>
          <p className="text-black/35 text-sm mt-5">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-black/5 px-6 py-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#1A1A1A] rounded flex items-center justify-center">
              <span className="font-serif italic font-bold text-white text-sm">E</span>
            </div>
            <span className="font-bold text-sm">Edge Marketplace Hub</span>
          </div>
          <p className="text-black/40 text-sm">© {new Date().getFullYear()} Edge Marketplace Hub. Built for real businesses.</p>
          <div className="flex gap-6 text-sm text-black/40">
            <Link href="/onboarding" className="hover:text-black transition-colors">Get started</Link>
            <Link href="/login" className="hover:text-black transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
