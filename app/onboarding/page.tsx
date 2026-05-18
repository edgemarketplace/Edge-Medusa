'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TEMPLATES } from '@/lib/templates';
import type { TemplateFamily } from '@/lib/types';

const templateEntries = Object.values(TEMPLATES);

const PRIMARY_GOALS = [
  { id: 'sell-products', label: 'Sell Products', microcopy: 'Fast checkout • Merchandising' },
  { id: 'book-service', label: 'Book Appointments', microcopy: 'Scheduling • Trust' },
  { id: 'get-quotes', label: 'Get Quote Requests', microcopy: 'Lead capture • Qualification' },
  { id: 'take-orders', label: 'Take Food Orders', microcopy: 'Local ordering • Speed' },
  { id: 'check-availability', label: 'Check Availability', microcopy: 'Date-based inquiries' },
  { id: 'enroll-clients', label: 'Enroll Students / Clients', microcopy: 'Programs • Conversion funnels' },
];

const STYLE_DIRECTIONS = [
  {
    id: 'milano',
    name: 'Editorial Premium',
    system: 'Milano',
    desc: 'Luxury, story-driven, high perceived value.',
    accent: '#1A1A1A',
    bg: '#F9F8F6',
    preview: ['font-serif italic', 'font-serif italic'],
  },
  {
    id: 'ocean',
    name: 'Professional Authority',
    system: 'Ocean',
    desc: 'Trusted authority with clean hierarchy and calm precision.',
    accent: '#0891B2',
    bg: '#F0F9FF',
    preview: ['text-sky-900', 'text-cyan-600'],
  },
  {
    id: 'sunlit',
    name: 'Bold High Energy',
    system: 'Sunlit',
    desc: 'Fast, promotional, conversion-forward.',
    accent: '#F59E0B',
    bg: '#FFFBF0',
    preview: ['text-amber-800', 'text-amber-600'],
  },
  {
    id: 'sage',
    name: 'Warm Artisan',
    system: 'Sage',
    desc: 'Handmade, approachable, naturally premium.',
    accent: '#6B7C6A',
    bg: '#F4F7F4',
    preview: ['text-green-900', 'text-green-700'],
  },
];

const BUSINESS_TYPE_COPY: Record<TemplateFamily, { customerLabel: string; engineLabel: string; microcopy: string }> = {
  'retail-core': { customerLabel: 'Retail & Product Store', engineLabel: 'Editorial Commerce Engine', microcopy: 'Catalogs • Merchandising • Checkout' },
  'service-pro': { customerLabel: 'Service Business', engineLabel: 'Trust-First Services Engine', microcopy: 'Quotes • Bookings • Proof' },
  'food-catering': { customerLabel: 'Restaurant & Catering', engineLabel: 'Menus + Booking Engine', microcopy: 'Menus • Ordering • Reservations' },
  'artisan-market': { customerLabel: 'Handmade & Artisan', engineLabel: 'Maker Storytelling Engine', microcopy: 'Storytelling • Provenance • Craft' },
  'event-floral': { customerLabel: 'Event & Floral', engineLabel: 'Gallery-Led Luxury Engine', microcopy: 'Galleries • Luxury • Inquiries' },
  'coach-educator': { customerLabel: 'Coach & Educator', engineLabel: 'Authority Funnel Engine', microcopy: 'Funnels • Programs • Enrollment' },
};

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [businessName, setBusinessName] = useState('');
  const [offerings, setOfferings] = useState('');
  const [tagline, setTagline] = useState('');
  const [email, setEmail] = useState('');
  const [selectedType, setSelectedType] = useState<TemplateFamily | null>(null);
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [selectedDirection, setSelectedDirection] = useState<string>('milano');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-select vertical from URL if provided
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const vertical = params.get('vertical');
    if (vertical && vertical in TEMPLATES) {
      setSelectedType(vertical as TemplateFamily);
    }
  }, []);

  const step1Valid = useMemo(
    () => !!(businessName.trim() && offerings.trim() && email.trim() && selectedType && primaryGoal),
    [businessName, offerings, email, selectedType, primaryGoal]
  );

  const step2Valid = useMemo(
    () => !!selectedDirection,
    [selectedDirection]
  );

  const handleSelectType = useCallback((family: TemplateFamily) => {
    setSelectedType(family);
  }, []);

  async function handleSubmit() {
    if (!step1Valid || loading) return;
    setLoading(true);
    setError('');
    try {
      // Infer buying behavior from business type + primary goal
      const inferredBehavior = inferBuyingBehavior(selectedType!, primaryGoal);
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName.trim(),
          business_type: selectedType,
          offerings: offerings.trim(),
          tagline: tagline.trim(),
          contact_email: email.trim(),
          style_preset: selectedDirection,
          onboarding_profile: {
            primary_goal: primaryGoal,
            primary_goal_label: PRIMARY_GOALS.find((goal) => goal.id === primaryGoal)?.label || primaryGoal,
            buying_behavior: inferredBehavior.id,
            buying_behavior_label: inferredBehavior.label,
            recommended_engine: BUSINESS_TYPE_COPY[selectedType!].engineLabel,
            recommended_style: STYLE_DIRECTIONS.find((d) => d.id === selectedDirection)?.name || selectedDirection,
          },
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
      setLoading(false);
      setStep(1);
    }
  }

  const selectedGoalMeta = PRIMARY_GOALS.find((goal) => goal.id === primaryGoal) || null;
  const selectedTemplateMeta = selectedType ? BUSINESS_TYPE_COPY[selectedType] : null;
  const selectedDirectionMeta = STYLE_DIRECTIONS.find((d) => d.id === selectedDirection) || STYLE_DIRECTIONS[0];

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans flex flex-col">

      {/* ── Top bar ── */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-black/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1A1A1A] rounded-md flex items-center justify-center">
            <span className="font-serif italic font-bold text-white text-base">E</span>
          </div>
          <span className="font-bold tracking-tight text-sm">Edge</span>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === n ? 'bg-[#1A1A1A] text-white' :
                step > n ? 'bg-emerald-500 text-white' :
                'bg-black/10 text-black/40'
              }`}>
                {step > n ? '✓' : n}
              </div>
              {n < 3 && <div className={`w-8 h-0.5 transition-all ${step > n ? 'bg-emerald-500' : 'bg-black/10'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-12 md:py-16">
        <div className="w-full max-w-2xl">

          {/* ── STEP 1: Business basics ── */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-black/35 mb-2">Step 1 of 3 • Your Business</p>
                <h1 className="text-4xl md:text-5xl font-serif italic tracking-tight mb-3">
                  Launch a storefront built for how your business sells
                </h1>
                <p className="text-black/55 text-lg">30 seconds. We handle the rest.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-bold mb-2">Business name *</label>
                  <input
                    id="businessName" name="businessName" type="text"
                    value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Bella's Blooms"
                    className="w-full border border-black/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-black/30 bg-white"
                    autoFocus autoComplete="organization"
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="offerings" className="block text-sm font-bold">What do you sell or offer? *</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const samples = [
                            { name: "Urban Grind Coffee", type: "retail-core", goal: 'sell-products', desc: "Small-batch roasted coffee beans, brewing equipment, and artisanal syrups for home baristas.", tagline: "Fuel your daily ritual", email: "hello@urbangrind.com" },
                            { name: "Zenith Marketing", type: "service-pro", goal: 'get-quotes', desc: "Full-service digital marketing agency specializing in SEO, PPC, and content strategy for B2B SaaS companies.", tagline: "Scale your growth with precision", email: "growth@zenith.com" },
                            { name: "The Pastry Box", type: "food-catering", goal: 'take-orders', desc: "Custom cakes, cupcakes, and dessert tables for weddings, birthdays, and corporate events.", tagline: "Baking memories, one bite at a time", email: "orders@thepastrybox.com" },
                            { name: "Iron & Oak Furniture", type: "artisan-market", goal: 'sell-products', desc: "Hand-crafted industrial furniture made from reclaimed wood and steel for modern homes.", tagline: "Timeless craftsmanship for modern living", email: "custom@ironandoak.com" },
                            { name: "Velvet Petals", type: "event-floral", goal: 'check-availability', desc: "Luxury floral design for weddings, galas, and upscale events. Specialized in rare blooms.", tagline: "Floral artistry for unforgettable moments", email: "studio@velvetpetals.com" }
                          ];
                          const random = samples[Math.floor(Math.random() * samples.length)];
                          setBusinessName(random.name);
                          setOfferings(random.desc);
                          setTagline(random.tagline);
                          setEmail(random.email);
                          setSelectedType(random.type as TemplateFamily);
                          setPrimaryGoal(random.goal);
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                      >
                        🎲 Random
                      </button>
                      <button
                        type="button"
                        disabled={!offerings.trim() || loading}
                        onClick={async () => {
                          if (!offerings.trim()) return;
                          setLoading(true);
                          try {
                            const res = await fetch('/api/ai/expand', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ prompt: offerings, businessName, businessType: selectedType })
                            });
                            const data = await res.json();
                            if (data.expanded) setOfferings(data.expanded);
                          } catch (err) {
                            console.error('Expansion failed', err);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-30"
                      >
                        {loading ? '...' : '✨ Expand with AI'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="offerings" name="offerings"
                    value={offerings} onChange={e => setOfferings(e.target.value)}
                    placeholder="e.g. Custom floral arrangements for weddings and events in Portland, OR"
                    rows={3}
                    className="w-full border border-black/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-black/30 bg-white resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="tagline" className="block text-sm font-bold mb-2">
                    Tagline <span className="text-black/30 font-normal">(optional)</span>
                  </label>
                  <input
                    id="tagline" name="tagline" type="text"
                    value={tagline} onChange={e => setTagline(e.target.value)}
                    placeholder="e.g. Where every bloom tells your story"
                    className="w-full border border-black/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-black/30 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold mb-2">Your email *</label>
                  <input
                    id="email" name="email" type="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    className="w-full border border-black/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-black/30 bg-white"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-4">What type of business? *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templateEntries.map(t => {
                      const copy = BUSINESS_TYPE_COPY[t.family];
                      return (
                      <button
                        key={t.family}
                        type="button"
                        data-template={t.family}
                        data-selected={selectedType === t.family}
                        aria-pressed={selectedType === t.family}
                        onClick={() => handleSelectType(t.family)}
                        className={`text-left rounded-2xl border p-5 transition-all ${
                          selectedType === t.family
                            ? 'border-black bg-white shadow-md ring-2 ring-black'
                            : 'border-black/10 bg-white hover:border-black/20'
                        }`}
                      >
                        <h3 className="font-bold mb-1">{copy.customerLabel}</h3>
                        <p className="text-sm text-black/50 leading-relaxed">{copy.microcopy}</p>
                      </button>
                      )})}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-4">What should this storefront optimize for? *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PRIMARY_GOALS.map(goal => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setPrimaryGoal(goal.id)}
                        className={`text-left rounded-2xl border p-5 transition-all ${
                          primaryGoal === goal.id
                            ? 'border-black bg-white shadow-md ring-2 ring-black'
                            : 'border-black/10 bg-white hover:border-black/20'
                        }`}
                      >
                        <h3 className="font-bold mb-1">{goal.label}</h3>
                        <p className="text-sm text-black/50 leading-relaxed">{goal.microcopy}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                  className="w-full bg-[#1A1A1A] text-white py-5 rounded-full text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
                >
                  Continue →
                 </button>
               </div>

              <div className="rounded-3xl border border-black/5 bg-white/70 px-5 py-4">
                <p className="text-sm font-bold mb-2">Includes:</p>
                <p className="text-sm text-black/55">AI-generated layouts, copy, checkout flows, mobile optimization, and payment setup.</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-black/40">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Stripe-ready</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Mobile-optimized</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Built on Medusa</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Edge-deployed globally</span>
              </div>
            </div>
          )}

          {/* ── STEP 2: Brand Direction ── */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-black/35 mb-2">Step 2 of 3 • Brand Direction</p>
                <h1 className="text-4xl md:text-5xl font-serif italic tracking-tight mb-3">
                  Choose the direction that feels closest to your business
                </h1>
              </div>

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {STYLE_DIRECTIONS.map(direction => (
                    <button
                      key={direction.id} type="button"
                      onClick={() => setSelectedDirection(direction.id)}
                      className={`relative rounded-3xl overflow-hidden border-2 transition-all text-left ${
                        selectedDirection === direction.id ? 'border-black shadow-lg scale-[1.02]' : 'border-transparent hover:border-black/20'
                      }`}
                    >
                      <div
                        className="h-28 flex flex-col items-center justify-center gap-2 px-4"
                        style={{ backgroundColor: direction.bg }}
                      >
                        <div className={`text-lg font-serif italic ${direction.preview[0]}`} style={{ color: direction.accent }}>
                          {businessName || 'Your Business'}
                        </div>
                        <div className="flex gap-2 flex-wrap justify-center">
                          <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: direction.accent, color: direction.bg }}>
                            {selectedGoalMeta?.label || 'Shop now'}
                          </div>
                          <div className="px-3 py-1 rounded-full text-xs border" style={{ borderColor: direction.accent, color: direction.accent }}>
                            Learn more
                          </div>
                        </div>
                      </div>
                      <div className="bg-white px-4 py-3 border-t border-black/5">
                        <div className="flex items-center justify-between mb-0.5 gap-3">
                          <div>
                            <p className="font-bold">{direction.name}</p>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-black/35 mt-1">{direction.system}</p>
                          </div>
                          {selectedDirection === direction.id && (
                            <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">Selected</span>
                          )}
                        </div>
                        <p className="text-xs text-black/50">{direction.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-full border border-black/15 text-sm font-bold hover:border-black/30 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!step2Valid}
                  className="flex-1 bg-[#1A1A1A] text-white py-4 rounded-full text-lg font-bold hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Generate My Storefront →
                </button>
              </div>
              <p className="text-center text-xs text-black/35">Built on Medusa + Stripe. Edge-deployed globally.</p>
            </div>
          )}

          {/* ── STEP 3: Generating ── */}
          {step === 3 && (
            <GeneratingScreen
              businessName={businessName}
              vertical={selectedTemplateMeta?.customerLabel || templateEntries.find(t => t.family === selectedType)?.label || ''}
              style={selectedDirectionMeta?.name || 'Editorial Premium'}
              goal={PRIMARY_GOALS.find(goal => goal.id === primaryGoal)?.label || 'Launching your storefront'}
              onReady={handleSubmit}
            />
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Infer buying behavior from business type + primary goal */
function inferBuyingBehavior(businessType: TemplateFamily, primaryGoal: string): { id: string; label: string } {
  // Service/coach + enrollment → consult first
  if (primaryGoal === 'enroll-clients') return { id: 'consult-first', label: 'Book a consultation first' };
  // Event/floral + availability → reserve time
  if (primaryGoal === 'check-availability') return { id: 'reserve-time', label: 'Reserve a date / time' };
  // Food + orders → buy now
  if (primaryGoal === 'take-orders') return { id: 'buy-now', label: 'Buy immediately online' };
  // Service + quotes → custom pricing
  if (primaryGoal === 'get-quotes') return { id: 'custom-pricing', label: 'Request custom pricing' };
  // Service + booking → reserve
  if (primaryGoal === 'book-service') return { id: 'reserve-time', label: 'Reserve a date / time' };
  // Artisan → compare first
  if (businessType === 'artisan-market') return { id: 'compare-first', label: 'Compare options' };
  // Default: buy now for retail, contact-first for services
  if (businessType === 'service-pro') return { id: 'contact-first', label: 'Contact before purchasing' };
  return { id: 'buy-now', label: 'Buy immediately online' };
}

function GeneratingScreen({ businessName, vertical, style, goal, onReady }: {
  businessName: string; vertical: string; style: string; goal: string; onReady: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Analyzing your business model', duration: 1200 },
    { label: `Routing for ${goal.toLowerCase()}`, duration: 1200 },
    { label: `Mapping your ${vertical.toLowerCase()} conversion flow`, duration: 1400 },
    { label: `Applying ${style} positioning`, duration: 1000 },
    { label: 'Writing conversion-focused copy', duration: 1600 },
    { label: 'Configuring sections, checkout, and CTAs', duration: 1200 },
    { label: 'Finalizing your storefront architecture', duration: 800 },
  ];

  useEffect(() => {
    let i = 0;
    function advance() {
      if (i < steps.length) {
        setCurrentStep(i);
        setTimeout(() => { i++; advance(); }, steps[i]?.duration || 1000);
      } else {
        onReady();
      }
    }
    const timeout = setTimeout(advance, 100);
    return () => clearTimeout(timeout);
  }, [onReady]);

  return (
    <div className="text-center py-8 space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] font-bold text-black/35 mb-2">Step 3 of 3 • Generation</p>
        <h1 className="text-4xl md:text-5xl font-serif italic tracking-tight mb-3">
          Building {businessName}
        </h1>
        <p className="text-black/55 text-lg">Creating your storefront…</p>
      </div>

      <div className="w-20 h-20 mx-auto relative">
        <div className="absolute inset-0 border-4 border-black/5 rounded-full" />
        <div
          className="absolute inset-0 border-4 border-[#1A1A1A] rounded-full border-t-transparent animate-spin"
          style={{ animationDuration: '0.8s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {['🤖', '✨', '🎨', '✍️', '🧩', '🚀'][currentStep] || '🚀'}
        </div>
      </div>

      <div className="space-y-3 max-w-sm mx-auto text-left">
        {steps.map((s, i) => (
          <div key={s.label} className={`flex items-center gap-3 transition-all duration-300 ${
            i < currentStep ? 'opacity-100' : i === currentStep ? 'opacity-100' : 'opacity-25'
          }`}>
            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs transition-all ${
              i < currentStep ? 'bg-emerald-500 text-white' :
              i === currentStep ? 'bg-[#1A1A1A] text-white animate-pulse' :
              'bg-black/10'
            }`}>
              {i < currentStep ? '✓' : i === currentStep ? '●' : ''}
            </div>
            <span className={`text-sm ${i === currentStep ? 'font-bold' : 'text-black/50'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <p className="text-black/35 text-xs">This usually takes 10–15 seconds</p>
    </div>
  );
}
