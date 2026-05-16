'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TEMPLATES } from '@/lib/templates';

const templateEntries = Object.values(TEMPLATES);

export default function HomePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('');

  const handleStart = () => {
    if (selectedType) {
      router.push(`/onboarding?type=${selectedType}`);
    } else {
      router.push('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2D2D2D] rounded-sm flex items-center justify-center font-serif italic font-bold text-white text-xl">
            E
          </div>
          <span className="font-bold tracking-tight text-lg">Edge Marketplace Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#examples" className="text-sm font-medium text-black/60 hover:text-black transition-colors">
            Examples
          </a>
          <a href="#pricing" className="text-sm font-medium text-black/60 hover:text-black transition-colors">
            Pricing
          </a>
          <button
            onClick={() => router.push('/login')}
            className="text-sm font-bold px-5 py-2.5 border border-black/10 rounded-full hover:border-black/30 transition-colors"
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-serif italic tracking-tight leading-[1.1] mb-8">
            Launch your store in 15 minutes
          </h1>
          <p className="text-xl md:text-2xl text-black/60 mb-12 leading-relaxed">
            AI builds your entire storefront — from copy to layout — while you sip coffee. 
            Pick your business type, choose a theme, and go live today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStart}
              className="bg-[#2D2D2D] text-white px-8 py-5 rounded-full text-lg font-bold hover:scale-[1.02] transition-transform"
            >
              Start building →
            </button>
            <button
              onClick={() => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' })}
              className="border border-black/10 px-8 py-5 rounded-full text-lg font-bold hover:border-black/30 transition-colors"
            >
              See examples
            </button>
          </div>
          <p className="text-sm text-black/40 mt-6">
            No credit card required · Free 14-day trial · 5% platform fee on sales
          </p>
        </div>
      </section>

      {/* Vertical Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <h2 className="text-3xl font-serif italic text-center mb-16">Built for how you do business</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templateEntries.map((template) => (
              <button
                key={template.family}
                onClick={() => router.push(`/onboarding?type=${template.family}`)}
                className="text-left bg-white rounded-3xl p-8 border border-black/5 hover:border-black/20 hover:shadow-lg transition-all group"
              >
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/35 mb-2">
                {template.kicker}
              </p>
              <h3 className="font-bold text-xl mb-3 group-hover:text-[#2D2D2D] transition-colors">
                {template.label}
              </h3>
              <p className="text-sm text-black/50 leading-relaxed mb-4">
                {template.summary}
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-[#2D2D2D]">
                View Site →
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}

      {/* Pricing Preview */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif italic mb-4">Simple, transparent pricing</h2>
          <p className="text-black/60 max-w-2xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees, no surprises.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-3xl p-8 border border-black/5">
            <h3 className="font-bold text-2xl mb-2">Free</h3>
            <p className="text-black/50 mb-6">For businesses getting started</p>
            <div className="mb-6">
              <span className="text-5xl font-bold">5%</span>
              <span className="text-black/50 ml-2">platform fee</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-sm text-black/70">Unlimited products</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-sm text-black/70">AI store builder</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-sm text-black/70">Stripe Connect integration</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-sm text-black/70">Email support</span>
              </li>
            </ul>
            <button
              onClick={handleStart}
              className="w-full border border-black/10 py-4 rounded-full font-bold hover:border-black/30 transition-colors"
            >
              Start free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-[#2D2D2D] text-white rounded-3xl p-8 border border-black/5 relative overflow-hidden">
            <div className="absolute top-6 right-6 bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full">
              RECOMMENDED
            </div>
            <h3 className="font-bold text-2xl mb-2">Pro</h3>
            <p className="text-white/50 mb-6">For growing businesses</p>
            <div className="mb-6">
              <span className="text-5xl font-bold">$99</span>
              <span className="text-white/50 ml-2">/month + 1% fee</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <span className="text-white/70">Everything in Free</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <span className="text-white/70">Printify integration</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <span className="text-white/70">Google My Business sync</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <span className="text-white/70">Priority support + CRM</span>
              </li>
            </ul>
            <button
              onClick={handleStart}
              className="w-full bg-white text-[#2D2D2D] py-4 rounded-full font-bold hover:bg-white/90 transition-colors"
            >
              Start Pro trial
            </button>
          </div>
        </div>
      </section>

      {/* Editorial commerce - Demo Links */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-black/5">
        <p className="text-center text-sm text-black/40 mb-6">Editorial commerce platform · Retail Core: Built for shops and product businesses that need strong catalog presentation and fast conversion paths.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://cedarandforge.edgemarketplacehub.com" className="text-sm text-black/60 hover:text-black transition-colors">Cedar & Forge</a>
          <span className="text-black/20">·</span>
          <a href="https://bloomandlore.edgemarketplacehub.com" className="text-sm text-black/60 hover:text-black transition-colors">Bloom & Lore</a>
          <span className="text-black/20">·</span>
          <a href="https://earthandember.edgemarketplacehub.com" className="text-sm text-black/60 hover:text-black transition-colors">Earth & Ember</a>
          <span className="text-black/20">·</span>
          <a href="https://vantagecoaching.edgemarketplacehub.com" className="text-sm text-black/60 hover:text-black transition-colors">Vantage Coaching</a>
          <span className="text-black/20">·</span>
          <a href="https://apexconsulting.edgemarketplacehub.com" className="text-sm text-black/60 hover:text-black transition-colors">Apex Consulting</a>
        </div>
      </section>

      {/* Email Signup */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="font-bold text-2xl mb-2">Get started today</h3>
          <p className="text-black/60 mb-6 text-sm">
            No password needed. We'll email you a magic link.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="email"
              placeholder="pembertonventures@gmail.com"
              className="flex-1 px-4 py-3 border border-black/10 rounded-full text-sm focus:outline-none focus:border-black/30"
            />
            <button
              type="button"
              onClick={() => handleStart()}
              className="bg-[#2D2D2D] text-white px-6 py-3 rounded-full text-sm font-bold hover:scale-[1.02] transition-transform whitespace-nowrap"
            >
              Create account & send login link
            </button>
          </div>
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full border border-black/10 py-3 rounded-full text-sm font-medium hover:border-black/30 transition-colors"
          >
            Continue as guest →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#2D2D2D] rounded-sm flex items-center justify-center font-serif italic font-bold text-white text-sm">
              E
            </div>
            <span className="font-bold text-sm">Edge Marketplace Hub</span>
          </div>
          <div className="flex gap-6 text-sm text-black/40">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Contact</a>
          </div>
          <p className="text-sm text-black/40">
            © {new Date().getFullYear()} Edge Marketplace Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
