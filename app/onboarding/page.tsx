'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TEMPLATES } from '@/lib/templates';
import type { TemplateFamily } from '@/lib/types';

const templateEntries = Object.values(TEMPLATES);

const PRIMARY_GOALS = [
  { id: 'sell-products', label: 'Sell products', desc: 'Optimized for catalogs, merchandising, and fast mobile checkout.' },
  { id: 'book-service', label: 'Book appointments', desc: 'Built for service businesses that need clear booking flows and trust signals.' },
  { id: 'get-quotes', label: 'Get quote requests', desc: 'Best for custom work, considered purchases, and higher-friction decisions.' },
  { id: 'take-orders', label: 'Take food orders', desc: 'Designed for restaurants, catering, and local ordering speed.' },
  { id: 'check-availability', label: 'Check availability', desc: 'Great for event-led and date-based inquiries where timing matters.' },
  { id: 'enroll-clients', label: 'Enroll students / clients', desc: 'Strong for coaching, courses, and authority-led offers.' },
];

const BUYING_BEHAVIORS = [
  { id: 'buy-now', label: 'Buy immediately online', desc: 'Push stronger product discovery, faster checkout, and higher CTA frequency.', group: 'fast' },
  { id: 'reserve-time', label: 'Reserve a date / time', desc: 'Prioritize date availability, urgency, and low-friction inquiry paths.', group: 'fast' },
  { id: 'compare-first', label: 'Compare options before purchasing', desc: 'Show more proof, explanation, and side-by-side offer structure.', group: 'considered' },
  { id: 'custom-pricing', label: 'Request custom pricing', desc: 'Lean into quote forms, proof, and trust before price commitment.', group: 'considered' },
  { id: 'contact-first', label: 'Contact before purchasing', desc: 'Use softer CTAs, stronger proof, and a guided decision flow.', group: 'considered' },
  { id: 'consult-first', label: 'Book a consultation first', desc: 'Route visitors into authority, qualification, and booking conversion.', group: 'relationship' },
];

const BEHAVIOR_GROUPS = [
  { id: 'fast' as const, label: 'FAST DECISION', desc: 'Customers know what they want', icon: '⚡', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'considered' as const, label: 'CONSIDERED DECISION', desc: 'Customers compare before committing', icon: '🔍', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'relationship' as const, label: 'RELATIONSHIP / TRUST LED', desc: 'Trust and consultation come first', icon: '🤝', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

const STYLE_PRESETS = [
  {
    id: 'milano',
    name: 'Editorial Premium',
    system: 'Milano',
    desc: 'Luxury, story-driven, and high perceived value.',
    detail: 'Controls typography, whitespace, and image-led merchandising for premium brands.',
    accent: '#1A1A1A',
    bg: '#F9F8F6',
    preview: ['font-serif italic', 'font-serif italic'],
  },
  {
    id: 'ocean',
    name: 'Professional Authority',
    system: 'Ocean',
    desc: 'Trusted expert energy with clean hierarchy and calm precision.',
    detail: 'Balances clarity, proof, and confident conversion structure for service-led businesses.',
    accent: '#0891B2',
    bg: '#F0F9FF',
    preview: ['text-sky-900', 'text-cyan-600'],
  },
  {
    id: 'sunlit',
    name: 'Bold High Energy',
    system: 'Sunlit',
    desc: 'Fast-moving, promotional, and conversion-forward.',
    detail: 'Adds stronger CTA contrast, tighter spacing, and faster merchandising behavior.',
    accent: '#F59E0B',
    bg: '#FFFBF0',
    preview: ['text-amber-800', 'text-amber-600'],
  },
  {
    id: 'sage',
    name: 'Warm Artisan',
    system: 'Sage',
    desc: 'Handmade, approachable, and naturally premium.',
    detail: 'Softens the storefront with warmer color rhythm and craft-forward presentation.',
    accent: '#6B7C6A',
    bg: '#F4F7F4',
    preview: ['text-green-900', 'text-green-700'],
  },
];

const BRAND_POSITIONING = [
  { id: 'approachable', label: 'Approachable', icon: '👋' },
  { id: 'premium', label: 'Premium', icon: '✨' },
  { id: 'luxury', label: 'Luxury', icon: '💎' },
  { id: 'playful', label: 'Playful', icon: '🎉' },
  { id: 'bold', label: 'Bold', icon: '🔥' },
  { id: 'minimal', label: 'Minimal', icon: '◻️' },
  { id: 'editorial', label: 'Editorial', icon: '📰' },
  { id: 'earthy', label: 'Earthy', icon: '🌿' },
  { id: 'modern', label: 'Modern', icon: '🏗️' },
];

const VISUAL_DENSITY = [
  { id: 'minimal', label: 'Clean / Minimal', desc: 'More whitespace, fewer elements per section' },
  { id: 'balanced', label: 'Balanced', desc: 'Standard layout with clear visual hierarchy' },
  { id: 'image-heavy', label: 'Image-heavy', desc: 'Gallery-forward with rich visual content' },
];

const EMOTIONAL_TONE = [
  { id: 'trustworthy', label: 'Trustworthy', icon: '🛡️' },
  { id: 'energetic', label: 'Energetic', icon: '⚡' },
  { id: 'calm', label: 'Calm', icon: '🧘' },
  { id: 'aspirational', label: 'Aspirational', icon: '🌟' },
  { id: 'romantic', label: 'Romantic', icon: '💕' },
  { id: 'authoritative', label: 'Authoritative', icon: '🎓' },
];

const PRICE_POSITIONING = [
  { id: 'budget', label: 'Budget-friendly', icon: '💵' },
  { id: 'mid-market', label: 'Mid-market', icon: '💰' },
  { id: 'premium', label: 'Premium', icon: '💎' },
  { id: 'luxury', label: 'Luxury', icon: '👑' },
];

const BUSINESS_TYPE_COPY: Record<TemplateFamily, { customerLabel: string; engineLabel: string }> = {
  'retail-core': { customerLabel: 'Retail & Product Store', engineLabel: 'Editorial Commerce Engine' },
  'service-pro': { customerLabel: 'Service Business', engineLabel: 'Trust-First Services Engine' },
  'food-catering': { customerLabel: 'Restaurant & Catering', engineLabel: 'Menus + Booking Engine' },
  'artisan-market': { customerLabel: 'Handmade & Artisan', engineLabel: 'Maker Storytelling Engine' },
  'event-floral': { customerLabel: 'Event & Floral', engineLabel: 'Gallery-Led Luxury Engine' },
  'coach-educator': { customerLabel: 'Coach & Educator', engineLabel: 'Authority Funnel Engine' },
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
  const [buyingBehavior, setBuyingBehavior] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('milano');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2 brand positioning state
  const [brandPositioning, setBrandPositioning] = useState<string[]>([]);
  const [visualDensity, setVisualDensity] = useState('');
  const [emotionalTone, setEmotionalTone] = useState<string[]>([]);
  const [pricePositioning, setPricePositioning] = useState('');

  // Pre-select vertical from URL if provided (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const vertical = params.get('vertical');
    if (vertical && vertical in TEMPLATES) {
      setSelectedType(vertical as TemplateFamily);
    }
  }, []);

  // Ensure step1Valid always reflects current state
  const step1Valid = useMemo(
    () => !!(businessName.trim() && offerings.trim() && email.trim() && selectedType && primaryGoal && buyingBehavior),
    [businessName, offerings, email, selectedType, primaryGoal, buyingBehavior]
  );

  const step2Valid = useMemo(
    () => !!(selectedStyle && brandPositioning.length > 0 && visualDensity && emotionalTone.length > 0 && pricePositioning),
    [selectedStyle, brandPositioning, visualDensity, emotionalTone, pricePositioning]
  );

  // Explicit selection handler with defensive fallback
  const handleSelectType = useCallback((family: TemplateFamily) => {
    setSelectedType(family);
  }, []);

  const toggleBrandPositioning = useCallback((id: string) => {
    setBrandPositioning(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }, []);

  const toggleEmotionalTone = useCallback((id: string) => {
    setEmotionalTone(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }, []);

  async function handleSubmit() {
    if (!step1Valid || loading) return;
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
          style_preset: selectedStyle,
          onboarding_profile: {
            primary_goal: primaryGoal,
            primary_goal_label: PRIMARY_GOALS.find((goal) => goal.id === primaryGoal)?.label || primaryGoal,
            buying_behavior: buyingBehavior,
            buying_behavior_label: BUYING_BEHAVIORS.find((item) => item.id === buyingBehavior)?.label || buyingBehavior,
            recommended_engine: BUSINESS_TYPE_COPY[selectedType!].engineLabel,
            recommended_style: STYLE_PRESETS.find((preset) => preset.id === selectedStyle)?.name || selectedStyle,
            brand_positioning: brandPositioning,
            visual_density: visualDensity,
            emotional_tone: emotionalTone,
            price_positioning: pricePositioning,
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
  const selectedBehaviorMeta = BUYING_BEHAVIORS.find((item) => item.id === buyingBehavior) || null;
  const selectedTemplateMeta = selectedType ? BUSINESS_TYPE_COPY[selectedType] : null;
  const selectedStyleMeta = STYLE_PRESETS.find((preset) => preset.id === selectedStyle) || STYLE_PRESETS[0];

  const recommendedSetup = useMemo(() => {
    if (!selectedType || !primaryGoal) return null;

    const engine = BUSINESS_TYPE_COPY[selectedType].engineLabel;
    const goalLabel = PRIMARY_GOALS.find((goal) => goal.id === primaryGoal)?.label || primaryGoal;
    let note = 'Optimized around your business model and primary conversion path.';

    if (primaryGoal === 'enroll-clients') note = 'Optimized for lead capture, authority, and consultation conversion.';
    if (primaryGoal === 'check-availability') note = 'Designed for premium visual inquiry businesses and date-based conversion.';
    if (primaryGoal === 'sell-products') note = 'Built for fast product discovery, stronger merchandising, and mobile conversion.';
    if (primaryGoal === 'take-orders') note = 'Designed for fast local ordering, menu clarity, and checkout speed.';
    if (primaryGoal === 'get-quotes') note = 'Structured for considered purchases, trust, and low-friction quote requests.';

    // Determine variant based on buying behavior
    let variant = '';
    if (buyingBehavior === 'buy-now') variant = 'Direct-Checkout Variant';
    else if (buyingBehavior === 'compare-first') variant = 'Comparison-Proof Variant';
    else if (buyingBehavior === 'custom-pricing') variant = 'Quote-First Variant';
    else if (buyingBehavior === 'consult-first') variant = 'Authority-Funnel Variant';
    else if (buyingBehavior === 'reserve-time') variant = 'Availability-First Variant';
    else if (buyingBehavior === 'contact-first') variant = 'Trust-Led Variant';

    return { engine, goalLabel, note, variant };
  }, [primaryGoal, selectedType, buyingBehavior]);

  // Dynamic recommendation intelligence
  const recommendationPreview = useMemo(() => {
    if (!selectedType || !primaryGoal || !buyingBehavior) return null;

    const engine = BUSINESS_TYPE_COPY[selectedType].engineLabel;
    const behaviorLabel = BUYING_BEHAVIORS.find(b => b.id === buyingBehavior)?.label || '';
    const goalLabel = PRIMARY_GOALS.find(g => g.id === primaryGoal)?.label || '';

    const reasons: string[] = [];
    const sectionOrder: string[] = [];
    let ctaStrategy = '';
    let proofStrategy = '';
    let pagePacing = '';
    let mobileDensity = '';
    let checkoutBehavior = '';

    // Business type → section order + reasons
    if (selectedType === 'retail-core') {
      reasons.push('Product catalog with fast mobile checkout');
      sectionOrder.push('Hero → Products → Social Proof → CTA → Footer');
      mobileDensity = 'High — thumb-friendly grids, sticky add-to-cart';
      checkoutBehavior = 'Streamlined 1-page checkout with Apple Pay / Google Pay';
    }
    if (selectedType === 'service-pro') {
      reasons.push('Service packaging with trust-first layout');
      sectionOrder.push('Hero → Services → Proof → FAQ → Booking CTA → Footer');
      mobileDensity = 'Medium — stacked service cards, click-to-call prominent';
      checkoutBehavior = 'Inquiry form → quote flow → booking confirmation';
    }
    if (selectedType === 'food-catering') {
      reasons.push('Menu-forward design with ordering speed');
      sectionOrder.push('Hero → Menu → Gallery → Order CTA → Footer');
      mobileDensity = 'High — large tap targets, minimal scroll to order';
      checkoutBehavior = 'Fast-path ordering with delivery/pickup toggle';
    }
    if (selectedType === 'artisan-market') {
      reasons.push('Story-driven product presentation');
      sectionOrder.push('Hero → Brand Story → Products → Maker Note → CTA → Footer');
      mobileDensity = 'Medium — editorial scroll, image-forward';
      checkoutBehavior = 'Standard cart with provenance details in checkout';
    }
    if (selectedType === 'event-floral') {
      reasons.push('Gallery-led visual inquiry flow');
      sectionOrder.push('Hero → Gallery → Packages → Testimonials → Inquiry CTA → Footer');
      mobileDensity = 'Low — immersive full-bleed imagery, minimal UI chrome';
      checkoutBehavior = 'Inquiry-first with date availability checker';
    }
    if (selectedType === 'coach-educator') {
      reasons.push('Authority-building conversion structure');
      sectionOrder.push('Hero → Authority → Offer → Testimonials → Enrollment CTA → Footer');
      mobileDensity = 'Medium — long-form scroll, video embed support';
      checkoutBehavior = 'Enrollment funnel with lead capture → payment plan';
    }

    // Goal → CTA strategy
    if (primaryGoal === 'sell-products') {
      reasons.push('Aggressive CTA placement for impulse conversion');
      ctaStrategy = 'High frequency — sticky bar, inline product CTAs, urgency signals';
      pagePacing = 'Fast — minimal friction between discovery and checkout';
    }
    if (primaryGoal === 'book-service') {
      reasons.push('Booking flow prioritized above the fold');
      ctaStrategy = 'Primary booking CTA above fold, secondary in sticky header';
      pagePacing = 'Medium — trust signals before booking commitment';
    }
    if (primaryGoal === 'get-quotes') {
      reasons.push('Quote form with trust scaffolding');
      ctaStrategy = 'Soft CTAs leading to quote form, proof-heavy mid-page';
      pagePacing = 'Slower — education before conversion ask';
    }
    if (primaryGoal === 'take-orders') {
      reasons.push('Fast-path ordering with minimal friction');
      ctaStrategy = 'Order now above fold, menu categories as navigation';
      pagePacing = 'Fast — get to menu in 1 scroll or less';
    }
    if (primaryGoal === 'check-availability') {
      reasons.push('Date-first inquiry with urgency signals');
      ctaStrategy = 'Date picker as primary CTA, availability calendar prominent';
      pagePacing = 'Medium — visual proof before date selection';
    }
    if (primaryGoal === 'enroll-clients') {
      reasons.push('Lead capture with authority positioning');
      ctaStrategy = 'Lead magnet → email sequence → enrollment page';
      pagePacing = 'Slower — authority building before ask';
    }

    // Behavior → proof strategy
    if (buyingBehavior === 'buy-now') {
      reasons.push('High CTA frequency, minimal decision steps');
      proofStrategy = 'Minimal — star ratings, trust badges, low-friction';
    }
    if (buyingBehavior === 'compare-first') {
      reasons.push('Side-by-side proof, detailed comparisons');
      proofStrategy = 'Heavy — comparison tables, detailed specs, reviews';
    }
    if (buyingBehavior === 'custom-pricing') {
      reasons.push('Quote-first flow, trust before price');
      proofStrategy = 'Heavy — case studies, ROI proof, client logos';
    }
    if (buyingBehavior === 'consult-first') {
      reasons.push('Consultation booking as primary conversion');
      proofStrategy = 'Authority-heavy — credentials, media, testimonials';
    }
    if (buyingBehavior === 'reserve-time') {
      reasons.push('Availability calendar with urgency');
      proofStrategy = 'Medium — recent bookings, popularity signals';
    }
    if (buyingBehavior === 'contact-first') {
      reasons.push('Soft CTAs with guided decision path');
      proofStrategy = 'Guided — progressive trust building, FAQ prominent';
    }

    // Determine variant
    let variant = '';
    if (buyingBehavior === 'buy-now') variant = 'Direct-Checkout Variant';
    else if (buyingBehavior === 'compare-first') variant = 'Comparison-Proof Variant';
    else if (buyingBehavior === 'custom-pricing') variant = 'Quote-First Variant';
    else if (buyingBehavior === 'consult-first') variant = 'Authority-Funnel Variant';
    else if (buyingBehavior === 'reserve-time') variant = 'Availability-First Variant';
    else if (buyingBehavior === 'contact-first') variant = 'Trust-Led Variant';

    return {
      engine,
      variant,
      behaviorLabel,
      goalLabel,
      reasons: reasons.slice(0, 4),
      sectionOrder: sectionOrder[0] || '',
      ctaStrategy,
      proofStrategy,
      pagePacing,
      mobileDensity,
      checkoutBehavior,
    };
  }, [selectedType, primaryGoal, buyingBehavior]);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans flex flex-col">

      {/* ── Top bar ── */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-black/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1A1A1A] rounded-md flex items-center justify-center">
            <span className="font-serif italic font-bold text-white text-base">E</span>
          </div>
          <span className="font-bold tracking-tight text-sm">Edge Medusa</span>
          <span className="hidden sm:inline-flex ml-2 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">Medusa commerce onboarding</span>
        </div>

        {/* Step indicator */}
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
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-black/35 mb-2">Step 1 of 3 • Business Profile</p>
                <h1 className="text-4xl md:text-5xl font-serif italic tracking-tight mb-3">
                  Launch a storefront built for how your business actually sells
                </h1>
                <p className="text-black/55 text-lg">Edge generates a conversion-optimized storefront based on how your business sells — whether that's products, bookings, inquiries, reservations, or client enrollment.</p>
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
                            { name: "Urban Grind Coffee", type: "retail-core", goal: 'sell-products', behavior: 'buy-now', desc: "Small-batch roasted coffee beans, brewing equipment, and artisanal syrups for home baristas.", tagline: "Fuel your daily ritual", email: "hello@urbangrind.com" },
                            { name: "Zenith Marketing", type: "service-pro", goal: 'get-quotes', behavior: 'custom-pricing', desc: "Full-service digital marketing agency specializing in SEO, PPC, and content strategy for B2B SaaS companies.", tagline: "Scale your growth with precision", email: "growth@zenith.com" },
                            { name: "The Pastry Box", type: "food-catering", goal: 'take-orders', behavior: 'buy-now', desc: "Custom cakes, cupcakes, and dessert tables for weddings, birthdays, and corporate events.", tagline: "Baking memories, one bite at a time", email: "orders@thepastrybox.com" },
                            { name: "Iron & Oak Furniture", type: "artisan-market", goal: 'sell-products', behavior: 'compare-first', desc: "Hand-crafted industrial furniture made from reclaimed wood and steel for modern homes.", tagline: "Timeless craftsmanship for modern living", email: "custom@ironandoak.com" },
                            { name: "Velvet Petals", type: "event-floral", goal: 'check-availability', behavior: 'reserve-time', desc: "Luxury floral design for weddings, galas, and upscale events. Specialized in rare blooms.", tagline: "Floral artistry for unforgettable moments", email: "studio@velvetpetals.com" }
                          ];
                          const random = samples[Math.floor(Math.random() * samples.length)];
                          setBusinessName(random.name);
                          setOfferings(random.desc);
                          setTagline(random.tagline);
                          setEmail(random.email);
                          setSelectedType(random.type as TemplateFamily);
                          setPrimaryGoal(random.goal);
                          setBuyingBehavior(random.behavior);
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
                  <label className="block text-sm font-bold mb-4">What type of business are you launching? *</label>
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
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/35 mb-1">{copy.engineLabel}</p>
                        <h3 className="font-bold mb-1">{copy.customerLabel}</h3>
                        <p className="text-sm text-black/50 leading-relaxed">{t.summary}</p>
                      </button>
                      )})}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">What do you want this storefront to do? *</label>
                  <p className="text-sm text-black/45 mb-4">This determines the conversion flow, layout structure, and checkout experience.</p>
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
                        <p className="text-sm text-black/50 leading-relaxed">{goal.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1">How do customers usually buy from you? *</label>
                  <p className="text-sm text-black/45 mb-4">This shapes CTA frequency, proof placement, and how aggressive the storefront should be.</p>

                  {BEHAVIOR_GROUPS.map(group => {
                    const groupBehaviors = BUYING_BEHAVIORS.filter(b => b.group === group.id);
                    return (
                      <div key={group.id} className={`rounded-2xl border ${group.border} ${group.bg} p-4`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm">{group.icon}</span>
                          <span className={`text-xs font-black uppercase tracking-[0.18em] ${group.color}`}>{group.label}</span>
                          <span className="text-xs text-black/30">— {group.desc}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groupBehaviors.map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setBuyingBehavior(item.id)}
                              className={`text-left rounded-xl border p-4 transition-all ${
                                buyingBehavior === item.id
                                  ? 'border-black bg-white shadow-md ring-2 ring-black'
                                  : 'border-black/10 bg-white hover:border-black/20'
                              }`}
                            >
                              <h3 className="font-bold text-sm mb-0.5">{item.label}</h3>
                              <p className="text-xs text-black/50 leading-relaxed">{item.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dynamic Recommendation Preview */}
                {recommendationPreview && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <p className="text-xs uppercase tracking-[0.2em] font-bold text-emerald-700">Recommended storefront system</p>
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif italic tracking-tight">{recommendationPreview.engine}</h3>
                      {recommendationPreview.variant && (
                        <p className="text-sm font-bold text-emerald-700 mt-1">{recommendationPreview.variant}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {recommendationPreview.reasons.map((reason, i) => (
                        <p key={i} className="text-sm text-black/60 flex items-start gap-2">
                          <span className="text-emerald-600 mt-0.5">•</span>
                          <span>{reason}</span>
                        </p>
                      ))}
                    </div>
                    {/* Architecture details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {recommendationPreview.sectionOrder && (
                        <div className="bg-white/60 rounded-xl p-3">
                          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-black/35 mb-1">Section order</p>
                          <p className="text-xs text-black/60">{recommendationPreview.sectionOrder}</p>
                        </div>
                      )}
                      {recommendationPreview.ctaStrategy && (
                        <div className="bg-white/60 rounded-xl p-3">
                          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-black/35 mb-1">CTA strategy</p>
                          <p className="text-xs text-black/60">{recommendationPreview.ctaStrategy}</p>
                        </div>
                      )}
                      {recommendationPreview.proofStrategy && (
                        <div className="bg-white/60 rounded-xl p-3">
                          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-black/35 mb-1">Proof strategy</p>
                          <p className="text-xs text-black/60">{recommendationPreview.proofStrategy}</p>
                        </div>
                      )}
                      {recommendationPreview.pagePacing && (
                        <div className="bg-white/60 rounded-xl p-3">
                          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-black/35 mb-1">Page pacing</p>
                          <p className="text-xs text-black/60">{recommendationPreview.pagePacing}</p>
                        </div>
                      )}
                      {recommendationPreview.mobileDensity && (
                        <div className="bg-white/60 rounded-xl p-3">
                          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-black/35 mb-1">Mobile density</p>
                          <p className="text-xs text-black/60">{recommendationPreview.mobileDensity}</p>
                        </div>
                      )}
                      {recommendationPreview.checkoutBehavior && (
                        <div className="bg-white/60 rounded-xl p-3">
                          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-black/35 mb-1">Checkout behavior</p>
                          <p className="text-xs text-black/60">{recommendationPreview.checkoutBehavior}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                  className="w-full bg-[#1A1A1A] text-white py-5 rounded-full text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
                >
                  Continue to Brand Positioning →
                </button>
                <p className="text-center text-xs text-black/35 mt-3">Typical setup: 3–5 minutes</p>
              </div>

              <div className="rounded-3xl border border-black/5 bg-white/70 px-5 py-4">
                <p className="text-sm font-bold mb-2">Edge automatically configures:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-black/55">
                  <p>• Storefront architecture</p>
                  <p>• Product or service page layouts</p>
                  <p>• Conversion-focused copy</p>
                  <p>• Checkout or booking flows</p>
                  <p>• Mobile optimization</p>
                  <p>• Payment onboarding</p>
                  <p>• SEO-ready page structure</p>
                </div>
              </div>

              {/* Social proof */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-black/40">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Generated for 1,200+ storefronts</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Average setup under 5 minutes</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Optimized for mobile conversion</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Stripe-ready checkout included</span>
              </div>
            </div>
          )}

          {/* ── STEP 2: Brand Positioning ── */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-black/35 mb-2">Step 2 of 3 • Brand Positioning</p>
                <h1 className="text-4xl md:text-5xl font-serif italic tracking-tight mb-3">
                  Define your brand positioning
                </h1>
                <p className="text-black/55 text-lg">These choices control typography, spacing, image density, and merchandising behavior — not just colors.</p>
              </div>

              {recommendedSetup && (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 space-y-3">
                  <p className="text-xs uppercase tracking-[0.2em] font-bold text-emerald-700 mb-1">Best match from Step 1</p>
                  <h3 className="text-2xl font-serif italic tracking-tight">{recommendedSetup.engine}{recommendedSetup.variant ? ` + ${recommendedSetup.variant}` : ''}</h3>
                  <p className="text-black/55">{recommendedSetup.note}</p>
                  {recommendationPreview?.sectionOrder && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-black/35">Section order:</span>
                      <span className="text-xs text-black/60">{recommendationPreview.sectionOrder}</span>
                    </div>
                  )}
                  {recommendationPreview?.ctaStrategy && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-black/35">CTA:</span>
                      <span className="text-xs text-black/60">{recommendationPreview.ctaStrategy}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Style preset */}
              <div>
                <label className="block text-sm font-bold mb-1">Visual style</label>
                <p className="text-sm text-black/45 mb-4">Choose the design system that best matches your brand.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {STYLE_PRESETS.map(preset => (
                    <button
                      key={preset.id} type="button"
                      onClick={() => setSelectedStyle(preset.id)}
                      className={`relative rounded-3xl overflow-hidden border-2 transition-all text-left ${
                        selectedStyle === preset.id ? 'border-black shadow-lg scale-[1.02]' : 'border-transparent hover:border-black/20'
                      }`}
                    >
                      {/* Preview swatch */}
                      <div
                        className="h-28 flex flex-col items-center justify-center gap-2 px-4"
                        style={{ backgroundColor: preset.bg }}
                      >
                        <div className={`text-lg font-serif italic ${preset.preview[0]}`} style={{ color: preset.accent }}>
                          {businessName || 'Your Business'}
                        </div>
                        <div className="flex gap-2 flex-wrap justify-center">
                          <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: preset.accent, color: preset.bg }}>
                            {selectedGoalMeta?.label || 'Shop now'}
                          </div>
                          <div className="px-3 py-1 rounded-full text-xs border" style={{ borderColor: preset.accent, color: preset.accent }}>
                            {selectedBehaviorMeta?.label || 'Learn more'}
                          </div>
                        </div>
                      </div>
                      {/* Label */}
                      <div className="bg-white px-4 py-3 border-t border-black/5">
                        <div className="flex items-center justify-between mb-0.5 gap-3">
                          <div>
                            <p className="font-bold">{preset.name}</p>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-black/35 mt-1">{preset.system}</p>
                          </div>
                          {selectedStyle === preset.id && (
                            <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">Selected</span>
                          )}
                        </div>
                        <p className="text-xs text-black/50">{preset.desc}</p>
                        <p className="text-xs text-black/35 mt-2">{preset.detail}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand positioning */}
              <div>
                <label className="block text-sm font-bold mb-1">Brand positioning</label>
                <p className="text-sm text-black/45 mb-3">Select all that apply. This controls the overall feel of your storefront.</p>
                <div className="flex flex-wrap gap-2">
                  {BRAND_POSITIONING.map(bp => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => toggleBrandPositioning(bp.id)}
                      className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                        brandPositioning.includes(bp.id)
                          ? 'border-black bg-black text-white'
                          : 'border-black/10 bg-white hover:border-black/25'
                      }`}
                    >
                      <span className="mr-1.5">{bp.icon}</span>{bp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual density */}
              <div>
                <label className="block text-sm font-bold mb-1">Visual density</label>
                <p className="text-sm text-black/45 mb-3">How much content should each section contain?</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {VISUAL_DENSITY.map(vd => (
                    <button
                      key={vd.id}
                      type="button"
                      onClick={() => setVisualDensity(vd.id)}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        visualDensity === vd.id
                          ? 'border-black bg-white shadow-md ring-2 ring-black'
                          : 'border-black/10 bg-white hover:border-black/20'
                      }`}
                    >
                      <h3 className="font-bold text-sm mb-0.5">{vd.label}</h3>
                      <p className="text-xs text-black/50">{vd.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emotional tone */}
              <div>
                <label className="block text-sm font-bold mb-1">Emotional tone</label>
                <p className="text-sm text-black/45 mb-3">Select all that apply. This influences copy, pacing, and CTA language.</p>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONAL_TONE.map(et => (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => toggleEmotionalTone(et.id)}
                      className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                        emotionalTone.includes(et.id)
                          ? 'border-black bg-black text-white'
                          : 'border-black/10 bg-white hover:border-black/25'
                      }`}
                    >
                      <span className="mr-1.5">{et.icon}</span>{et.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price positioning */}
              <div>
                <label className="block text-sm font-bold mb-1">Price positioning</label>
                <p className="text-sm text-black/45 mb-3">This affects proof density, CTA urgency, and layout complexity.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRICE_POSITIONING.map(pp => (
                    <button
                      key={pp.id}
                      type="button"
                      onClick={() => setPricePositioning(pp.id)}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        pricePositioning === pp.id
                          ? 'border-black bg-white shadow-md ring-2 ring-black'
                          : 'border-black/10 bg-white hover:border-black/20'
                      }`}
                    >
                      <span className="text-lg">{pp.icon}</span>
                      <h3 className="font-bold text-sm mt-1">{pp.label}</h3>
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
                  Generate Recommended Directions →
                </button>
              </div>
              <p className="text-center text-xs text-black/35">Typical setup: 3–5 minutes</p>
            </div>
          )}

          {/* ── STEP 3: Generating ── */}
          {step === 3 && (
            <GeneratingScreen
              businessName={businessName}
              vertical={selectedTemplateMeta?.customerLabel || templateEntries.find(t => t.family === selectedType)?.label || ''}
              style={selectedStyleMeta?.name || 'Editorial Premium'}
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
          Configuring {businessName}
        </h1>
        <p className="text-black/55 text-lg">Configuring your storefront architecture…</p>
      </div>

      {/* Animated loader */}
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

      {/* Step list */}
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
