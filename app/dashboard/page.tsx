'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SiteData } from '@/lib/types';

const STATUS_CONFIG = {
  draft:  { label: 'Draft',  dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  ready:  { label: 'Ready',  dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  live:   { label: 'Live',   dot: 'bg-emerald-500 animate-pulse', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const VERTICAL_EMOJI: Record<string, string> = {
  'retail-core': '🛍️',
  'service-pro': '⚡',
  'food-catering': '🍽️',
  'artisan-market': '🎨',
  'event-floral': '🌸',
};

const TIPS = [
  '💡 Click any text on your store page to edit it in place.',
  '📦 Add products to your Inventory tab to populate your store sections.',
  '💳 Connect Stripe in Settings → Payments to start accepting orders.',
  '🚀 Hit "Publish" when you\'re ready — your store goes live instantly.',
  '🎨 Try regenerating sections with the ✨ button for fresh AI-written copy.',
  '📊 Check your Orders tab after connecting Stripe to track revenue.',
];

export default function DashboardPage() {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    fetch('/api/sites')
      .then(r => r.json())
      .then(data => {
        setSites(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const liveSites = sites.filter(s => s.status === 'live');
  const draftSites = sites.filter(s => s.status !== 'live');

  async function deleteSite(id: string) {
    if (!confirm('Are you sure you want to delete this store? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/sites/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSites(prev => prev.filter(s => s.id !== id));
      } else {
        alert('Failed to delete store');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting store');
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 bg-[#F9F8F6]/90 backdrop-blur border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
            <span className="font-serif italic font-bold text-white text-lg">E</span>
          </div>
          <span className="font-bold tracking-tight">Edge Medusa</span>
          <span className="hidden sm:inline-flex ml-2 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">Backend console live</span>
          <span className="ml-2 text-black/30 text-sm">/</span>
          <span className="text-sm text-black/50 ml-1">Dashboard</span>
        </div>
        <Link
          href="/onboarding"
          className="flex items-center gap-2 bg-[#1A1A1A] text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-black/80 transition-colors"
        >
          <span>+</span> New Store
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* ── GREETING ── */}
        <div>
          <h1 className="text-3xl font-serif italic mb-1">Your Stores</h1>
          <p className="text-black/50">Manage, edit, and launch your Medusa-backed storefronts.</p>
        </div>

        <div className="bg-[#111113] text-white rounded-3xl p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300 mb-2">Medusa backend is separate from this store list</p>
            <h2 className="text-2xl font-serif italic">Open the commerce-ops console for products, orders, channels, and backend health.</h2>
          </div>
          <Link href="/backend" className="shrink-0 rounded-full bg-white text-black px-5 py-3 text-sm font-black hover:bg-emerald-50 transition-colors">Open Medusa Backend →</Link>
        </div>

        {/* ── TIP BANNER ── */}
        <div className="bg-white border border-black/8 rounded-2xl px-5 py-4 flex items-start gap-3 shadow-sm">
          <span className="text-lg flex-shrink-0 mt-0.5">💡</span>
          <div>
            <p className="text-sm font-bold mb-0.5">Quick tip</p>
            <p className="text-sm text-black/60">{tip.slice(2)}</p>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        {!loading && sites.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total stores', value: sites.length },
              { label: 'Live', value: liveSites.length },
              { label: 'In draft', value: draftSites.length },
              { label: 'Total inventory', value: '—' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-black/45 uppercase tracking-wider font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-black/5 animate-pulse h-48" />
            ))}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && sites.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-black/5">
            <div className="text-5xl mb-5">🏪</div>
            <h2 className="text-2xl font-serif italic mb-3">No stores yet</h2>
            <p className="text-black/50 mb-8 max-w-sm mx-auto">
              Build your first AI-powered storefront in under 15 minutes.
            </p>
            <Link
              href="/onboarding"
              className="inline-block bg-[#1A1A1A] text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Build my first store →
            </Link>
          </div>
        )}

        {/* ── SITE CARDS ── */}
        {!loading && sites.length > 0 && (
          <div className="space-y-6">

            {/* Live stores */}
            {liveSites.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-4">Live stores</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {liveSites.map(site => <SiteCard key={site.id} site={site} onDelete={deleteSite} />)}
                </div>
              </div>
            )}

            {/* Draft / In progress */}
            {draftSites.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-4">In progress</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {draftSites.map(site => <SiteCard key={site.id} site={site} onDelete={deleteSite} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CREATE NEW ── */}
        {!loading && sites.length > 0 && (
          <Link
            href="/onboarding"
            className="flex items-center justify-center gap-3 w-full py-5 rounded-3xl border-2 border-dashed border-black/15 text-black/45 hover:border-black/30 hover:text-black/70 transition-all font-medium"
          >
            <span className="text-xl">+</span>
            <span>Create another store</span>
          </Link>
        )}

        {/* ── HOW TO EDIT ── */}
        {!loading && sites.length > 0 && (
          <div className="bg-[#1A1A1A] text-white rounded-3xl p-8">
            <h3 className="text-xl font-serif italic mb-6">How to edit your store</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: '✏️', title: 'Edit in place', desc: 'Click any text or image directly on your storefront to edit it. No forms, no modals.' },
                { icon: '🧩', title: 'Add sections', desc: 'Click the + button between sections to add new content blocks from the library.' },
                { icon: '🚀', title: 'Publish live', desc: 'Hit Publish when ready. Your store goes live instantly at your unique URL.' },
              ].map(item => (
                <div key={item.title}>
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <h4 className="font-bold mb-1 text-white/90">{item.title}</h4>
                  <p className="text-sm text-white/55 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SiteCard({ site, onDelete }: { site: SiteData, onDelete: (id: string) => void }) {
  const status = STATUS_CONFIG[site.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  const emoji = VERTICAL_EMOJI[site.business_type] || '🏪';

  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      {/* Header band */}
      <div className="h-20 bg-gradient-to-br from-black/3 to-black/8 flex items-center px-6 gap-4 relative">
        <span className="text-3xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg leading-tight truncate">{site.business_name}</h3>
          {site.tagline && (
            <p className="text-sm text-black/45 truncate">{site.tagline}</p>
          )}
        </div>
        <button 
          onClick={(e) => {
            e.preventDefault();
            onDelete(site.id);
          }}
          className="absolute top-2 right-2 p-2 text-black/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
          title="Delete project"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Status + meta */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${status.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <span className="text-xs text-black/35 capitalize">
            {site.business_type?.replace('-', ' ')}
          </span>
        </div>

        {/* URL if live */}
        {site.subdomain && (
          <a
            href={`/store/${site.subdomain}`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs text-black/45 hover:text-black transition-colors font-mono"
          >
            <span>🔗</span>
            <span className="truncate">{site.subdomain}.edgemarketplacehub.com</span>
          </a>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link
            href={`/build/${site.id}`}
            className="flex-1 text-center bg-[#1A1A1A] text-white text-sm font-bold py-2.5 rounded-full hover:bg-black/80 transition-colors"
          >
            ✏️ Edit store
          </Link>
          {site.subdomain && (
            <a
              href={`/store/${site.subdomain}`}
              target="_blank"
              className="px-4 text-sm font-bold py-2.5 rounded-full border border-black/10 hover:border-black/25 transition-colors"
            >
              View →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
