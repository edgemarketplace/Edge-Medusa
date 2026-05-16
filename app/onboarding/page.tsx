'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TEMPLATES } from '@/lib/templates';
import type { TemplateFamily, TemplateDefinition } from '@/lib/types';
import { THEME_PRESETS } from '@/lib/types';

const templateEntries = Object.values(TEMPLATES);

export default function OnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedType, setSelectedType] = useState<TemplateFamily | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('milano');
  const [customColors, setCustomColors] = useState({ primary: '#2D2D2D', accent: '#B8860B', background: '#F9F8F6' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-select template from URL param (e.g., ?type=service-pro)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get('type');
      if (typeParam && Object.keys(TEMPLATES).includes(typeParam)) {
        setSelectedType(typeParam as TemplateFamily);
      }
    }
  }, []);

  const canSubmit = businessName.trim() && email.trim() && selectedType && !loading;

  const [generationStep, setGenerationStep] = useState(0);
  const generationSteps = [
    'Analyzing your business model...',
    'Writing high-converting copy...',
    'Sourcing imagery...',
    'Assembling your layout...',
    'Applying your theme...',
    'Finalizing your store...',
  ];

  useEffect(() => {
    if (!loading) { setGenerationStep(0); return; }
    const interval = setInterval(() => {
      setGenerationStep(prev => (prev < generationSteps.length - 1 ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, generationSteps.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      const body = {
        business_name: businessName.trim(),
        business_type: selectedType,
        contact_email: email.trim(),
        theme_id: selectedTheme,
      } as any;
      
      if (selectedTheme === 'custom') {
        body.custom_colors = customColors;
      }

      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
            <label htmlFor="businessName" className="block text-sm font-bold mb-2">Business name *</label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Bella's Blooms"
              className="w-full border border-black/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-black/30 bg-white"
              required
              autoComplete="organization"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold mb-2">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              className="w-full border border-black/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-black/30 bg-white"
              required
              autoComplete="email"
            />
          </div>

          {/* Template picker */}
          <div>
            <label className="block text-sm font-bold mb-4">Pick your business type *</label>
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

          {/* Theme picker */}
          <div>
            <label className="block text-sm font-bold mb-4">Pick your style *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEME_PRESETS.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`text-left rounded-2xl border p-4 transition-all ${
                    selectedTheme === theme.id
                      ? 'border-black bg-white shadow-md ring-1 ring-black'
                      : 'border-black/10 bg-white hover:border-black/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{theme.preview}</span>
                    <h3 className="font-bold text-sm">{theme.name}</h3>
                  </div>
                  <p className="text-[11px] text-black/50 leading-relaxed">{theme.description}</p>
                  <div className="flex gap-1 mt-2">
                    <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.tokens.primary }} />
                    <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.tokens.accent }} />
                    <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: theme.tokens.background }} />
                  </div>
                </button>
              ))}
            </div>
            
            {/* Custom Color Picker */}
            {selectedTheme === 'custom' && (
              <div className="mt-6 p-6 bg-white rounded-2xl border border-black/10">
                <p className="text-sm font-bold mb-4">Choose 3 brand colors</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-black/50 mb-1">Primary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors.primary}
                        onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-black/10 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColors.primary}
                        onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                        className="flex-1 px-3 py-2 border border-black/10 rounded-lg text-sm font-mono"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-black/50 mb-1">Accent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors.accent}
                        onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-black/10 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColors.accent}
                        onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                        className="flex-1 px-3 py-2 border border-black/10 rounded-lg text-sm font-mono"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-black/50 mb-1">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors.background}
                        onChange={(e) => setCustomColors({ ...customColors, background: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-black/10 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColors.background}
                        onChange={(e) => setCustomColors({ ...customColors, background: e.target.value })}
                        className="flex-1 px-3 py-2 border border-black/10 rounded-lg text-sm font-mono"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            {loading ? (
              <div className="flex flex-col items-center gap-1">
                <span>{generationSteps[generationStep]}</span>
                <div className="flex gap-1 mt-1">
                  {generationSteps.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= generationStep ? 'bg-white' : 'bg-white/30'}`} />
                  ))}
                </div>
              </div>
            ) : (
              'Get started today'
            )}
          </button>
          
          <p className="text-sm text-black/40 mt-4 text-center">
            Already have an account? <a href="/login" className="underline hover:text-black">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
}
