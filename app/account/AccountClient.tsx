'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SiteSummary } from './page';

interface AccountClientProps {
  email: string;
  sites: SiteSummary[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-amber-100 text-amber-700' },
  ready: { label: 'Ready', color: 'bg-blue-100 text-blue-700' },
  live: { label: 'Live', color: 'bg-green-100 text-green-700' },
};

const TYPE_LABELS: Record<string, string> = {
  'retail-core': 'Retail Core',
  'service-pro': 'Service Pro',
  'food-catering': 'Food & Catering',
  'artisan-market': 'Artisan Market',
  'event-floral': 'Event & Floral',
};

export default function AccountClient({ email, sites }: AccountClientProps) {
  const [showLogout, setShowLogout] = useState(false);

  function handleLogout() {
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'auth_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <div className="bg-white border-b border-black/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center font-serif italic font-bold text-white text-xl">E</div>
            <span className="font-bold tracking-tight text-xl">Edge Marketplace Hub</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-black/60">{email}</span>
            <button onClick={() => setShowLogout(true)} className="text-sm text-black/40 hover:text-black">
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Logout confirmation */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowLogout(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">Sign out?</h2>
            <p className="text-black/60 text-sm mb-6">You&apos;ll need to request a new login link to access your account again.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)} className="flex-1 px-4 py-3 rounded-full border border-black/10 font-bold text-sm">Cancel</button>
              <button onClick={handleLogout} className="flex-1 px-4 py-3 rounded-full bg-black text-white font-bold text-sm">Sign out</button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your stores</h1>
            <p className="text-black/50 mt-1">{sites.length} store{sites.length !== 1 ? 's' : ''} linked to {email}</p>
          </div>
          <Link href="/onboarding" className="px-6 py-3 rounded-full bg-black text-white text-sm font-bold hover:scale-105 transition-transform">
            + Create new store
          </Link>
        </div>

        {sites.length === 0 ? (
          <div className="bg-white border border-dashed border-black/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏪</span>
            </div>
            <h2 className="text-xl font-bold mb-2">No stores yet</h2>
            <p className="text-black/50 mb-6">Create your first store to get started.</p>
            <Link href="/onboarding" className="inline-block px-8 py-4 rounded-full bg-black text-white font-bold hover:scale-105 transition-transform">
              Create your first store
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sites.map(site => {
              const status = STATUS_LABELS[site.status] || STATUS_LABELS.draft;
              const typeLabel = TYPE_LABELS[site.business_type] || site.business_type;
              const liveUrl = site.subdomain ? `https://${site.subdomain}.edgemarketplacehub.com` : null;

              return (
                <div key={site.id} className="bg-white border border-black/5 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{site.business_name}</h3>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-black/50">{typeLabel}</p>
                      <p className="text-xs text-black/30 mt-1">
                        Created {new Date(site.created_at).toLocaleDateString()} · Updated {new Date(site.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {liveUrl && (
                        <a href={liveUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5">
                          View live
                        </a>
                      )}
                      <Link href={`/build/${site.id}`} className="px-4 py-2 rounded-full bg-black text-white text-sm font-bold hover:bg-black/80">
                        Edit store
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
