'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TEMPLATES } from '@/lib/templates';
import type { TemplateFamily, TemplateDefinition } from '@/lib/types';

const templateEntries = Object.values(TEMPLATES);

export default function OnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [offerings, setOfferings] = useState('');
  const [tagline, setTagline] = useState('');
  const [email, setEmail] = useState('');
  const [selectedType, setSelectedType] = useState<TemplateFamily | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = businessName.trim() && offerings.trim() && email.trim() && selectedType && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName.trim(),
          business_type: selectedType,
          offerings: offerings.trim(),
          tagline: tagline.trim(),
          contact_email: email.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create site');
      }

      const site = await res.json();
      router.push(`/build/${site.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center font-serif italic font-bold text-white text-xl">
              E
            </div>
            <span className="font-bold tracking-tight text-xl">Edge Marketplace Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif italic tracking-tight mb-4">
            Tell us about your business
          </h1>
          <p className="text-black/60 text-lg">
            This takes about 30 seconds. We&apos;ll handle the rest.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-bold mb-2">Business name *</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Bella's Blooms"
              className="w-full border border-black/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-black/30 bg-white"
              required
            />
          </div>

          {/* What you sell */}
          <div>
            <label htmlFor="offerings" className="block text-sm font-bold mb-2">What do you sell? *</label>
            <textarea
              id="offerings"
              name="offerings"
              value={offerings}
              onChange={(e) => setOfferings(e.target.value)}
              placeholder="e.g. Handmade ceramics and home decor for modern living"
              rows={3}
              className="w-full border border-black/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-black/30 bg-white resize-none"
              required
            />
          </div>

          {/* Tagline */}
          <div>
            <label htmlFor="tagline" className="block text-sm font-bold mb-2">Your tagline <span className="text-black/30 font-normal">(optional)</span></label>
            <input
              id="tagline"
              name="tagline"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Handcrafted with love in Portland, OR"
              className="w-full border border-black/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-black/30 bg-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold mb-2">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              className="w-full border border-black/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-black/30 bg-white"
              required
            />
          </div>

          {/* Template picker */}
          <div>
            <label className="block text-sm font-bold mb-4">Pick your style *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templateEntries.map((template) => (
                <button
                  key={template.family}
                  type="button"
                  onClick={() => setSelectedType(template.family)}
                  className={`text-left rounded-2xl border p-5 transition-all ${
                    selectedType === template.family
                      ? 'border-black bg-white shadow-md'
                      : 'border-black/10 bg-white hover:border-black/20'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/35 mb-1">
                    {template.kicker}
                  </p>
                  <h3 className="font-bold text-lg mb-1">{template.label}</h3>
                  <p className="text-sm text-black/50 leading-relaxed">{template.summary}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-black text-white py-5 rounded-full text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
          >
            {loading ? 'Creating your store...' : 'Generate my store →'}
          </button>
        </form>
      </div>
    </div>
  );
}
