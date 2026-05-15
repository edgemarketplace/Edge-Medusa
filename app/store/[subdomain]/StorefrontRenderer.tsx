'use client';

import { useState } from 'react';
import type { SiteData, GeneratedSection, InventoryItem, TemplateDefinition, SectionType } from '@/lib/types';
import { SECTION_LIBRARY } from '@/lib/section-library';
import { THEME_PRESETS } from '@/lib/types';

interface StorefrontRendererProps {
  site: SiteData;
  sections: GeneratedSection[];
  inventory: InventoryItem[];
  template: TemplateDefinition;
}

export default function StorefrontRenderer({
  site,
  sections,
  inventory,
  template,
}: StorefrontRendererProps) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkingOut, setCheckingOut] = useState(false);

  // Merge inventory into commerce sections
  const mergedSections = sections.map((section) => {
    const isCommerce = ['product-grid', 'featured-collection', 'best-sellers', 'hero-products', 'collection-carousel'].includes(section.type);
    const isService = ['service-list', 'packages', 'pricing-tiers'].includes(section.type);

    if ((isCommerce || isService) && inventory.length > 0) {
      return { ...section, data: { ...section.data, items: inventory } };
    }
    return section;
  });

  function addToCart(itemName: string) {
    setCart((prev) => ({ ...prev, [itemName]: (prev[itemName] || 0) + 1 }));
  }

  const [showContactModal, setShowContactModal] = useState(false);
  const [showTestBanner, setShowTestBanner] = useState(false);

  async function handleCheckout() {
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([name, qty]) => {
        const item = inventory.find((i) => i.name === name);
        return { name, price: item?.price || '0', description: item?.description || '', quantity: qty };
      });
    if (items.length === 0) return;
    setCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: site.id, items }),
      });
      const data = await res.json();
      if (data.url) {
        if (data.testMode) setShowTestBanner(true);
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch (err) { alert('Checkout failed. Please try again.'); }
    finally { setCheckingOut(false); }
  }

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  // Get theme tokens
  const themePreset = THEME_PRESETS.find(t => t.id === (site.theme_id || 'milano')) || THEME_PRESETS[0];
  const tokens = themePreset.tokens;

  // Build CSS variables for the theme
  const themeStyles: Record<string, string> = {
    '--color-primary': tokens.primary,
    '--color-primary-hover': tokens.primaryHover,
    '--color-secondary': tokens.secondary,
    '--color-accent': tokens.accent,
    '--color-background': tokens.background,
    '--color-surface': tokens.surface,
    '--color-text': tokens.text,
    '--color-text-muted': tokens.textMuted,
    '--color-text-inverse': tokens.textInverse,
    '--color-border': tokens.border,
    '--font-heading': tokens.headingFont,
    '--font-body': tokens.bodyFont,
    '--radius-sm': tokens.radiusSm,
    '--radius-md': tokens.radiusMd,
    '--radius-lg': tokens.radiusLg,
    '--radius-full': tokens.radiusFull,
    '--shadow-sm': tokens.shadowSm,
    '--shadow-md': tokens.shadowMd,
  };

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeStyles,
        fontFamily: tokens.bodyFont,
        backgroundColor: tokens.background,
        color: tokens.text,
      }}
    >

      {/* Test mode banner */}
      {showTestBanner && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-bold">
          🧪 Test mode — use card <span className="font-mono bg-white/20 px-1 rounded">4242 4242 4242 4242</span> with any future date and CVC
        </div>
      )}

      {/* Stripe not connected modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💐</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Ready to order?</h2>
            <p className="text-black/60 text-sm mb-6">
              {site.business_name} hasn't set up online payments yet. Contact them directly to place your order.
            </p>
            <a href={`mailto:${site.contact_email}`} className="block w-full px-4 py-3 rounded-full bg-black text-white font-bold mb-3">
              ✉️ Email {site.business_name}
            </a>
            <button onClick={() => setShowContactModal(false)} className="w-full px-4 py-3 rounded-full border border-black/10 font-bold text-sm">
              Continue browsing
            </button>
          </div>
        </div>
      )}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button onClick={handleCheckout} disabled={checkingOut}
            className="bg-black text-white px-6 py-4 rounded-full font-bold shadow-lg flex items-center gap-3 hover:scale-105 transition-transform disabled:opacity-50">
            <span>🛒 {cartCount} item{cartCount > 1 ? 's' : ''}</span>
            <span className="bg-white text-black px-3 py-1 rounded-full text-sm">{checkingOut ? 'Processing...' : 'Checkout'}</span>
          </button>
        </div>
      )}

      {mergedSections.map((section, i) => (
        <SectionRenderer key={section.id || i} section={section} template={template} inventory={inventory} onAddToCart={addToCart} site={site} />
      ))}

      <footer className="border-t border-black/5 py-8 px-8 text-center text-sm text-black/40">
        <p>© {new Date().getFullYear()} {site.business_name}. Powered by Edge Marketplace Hub.</p>
      </footer>
    </div>
  );
}

// --- Section Renderer ---

function SectionRenderer({ section, template, inventory, onAddToCart, site }: {
  section: GeneratedSection; template: TemplateDefinition; inventory: InventoryItem[]; onAddToCart: (name: string) => void; site: SiteData;
}) {
  const { type, data } = section;
  const primary = template.primaryColor;

  // Headers
  if (type.startsWith('header-')) {
    return (
      <div className="bg-white border-b border-black/5 px-8 py-4 flex items-center justify-between">
        <span className="font-bold">{data.logoText || 'Your Brand'}</span>
        <div className="flex gap-6 text-sm text-black/60">
          {(data.links || []).slice(0, 5).map((l: any, i: number) => (
            <a key={i} href={l.url || '#'} className="hover:text-black">{l.label}</a>
          ))}
        </div>
        {data.ctaText && (
          <a href={data.ctaUrl || '#'} className="px-4 py-2 rounded-full text-white text-sm font-bold" style={{ backgroundColor: primary }}>
            {data.ctaText}
          </a>
        )}
        {data.announcement && (
          <div className="absolute top-0 left-0 right-0 bg-black text-white text-xs text-center py-1">{data.announcement}</div>
        )}
      </div>
    );
  }

  // Heroes
  if (type.startsWith('hero-')) {
    const hasImage = !!data.imageUrl;
    return (
      <div className={`px-8 py-20 text-center relative overflow-hidden ${hasImage ? 'min-h-[400px] flex flex-col items-center justify-center' : ''}`}
        style={hasImage ? { backgroundImage: `linear-gradient(rgba(0,0,0,${data.overlayOpacity || 0.4}), rgba(0,0,0,${data.overlayOpacity || 0.4})), url(${data.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        <h1 className={`text-4xl md:text-6xl font-serif italic tracking-tight mb-6 ${hasImage ? 'text-white' : ''}`}>
          {data.heading || 'Your headline'}
        </h1>
        <p className={`text-xl max-w-2xl mx-auto mb-8 ${hasImage ? 'text-white/80' : 'text-black/60'}`}>
          {data.subheading || 'Your subheading goes here.'}
        </p>
        {data.ctaText && (
          <a href={data.ctaUrl || '#'} className="inline-block px-8 py-4 rounded-full text-white font-bold text-lg" style={{ backgroundColor: primary }}>
            {data.ctaText}
          </a>
        )}
        {data.trustBadges && (
          <div className="flex gap-6 mt-8 justify-center">
            {(data.trustBadges as string[]).map((badge, i) => (
              <span key={i} className={`text-sm ${hasImage ? 'text-white/70' : 'text-black/40'}`}>✓ {badge}</span>
            ))}
          </div>
        )}
        {data.showEmailCapture && (
          <div className="mt-6 flex gap-2 justify-center">
            <input type="email" placeholder="Enter your email" className="px-4 py-2 rounded-full border border-black/10 text-sm w-64" />
            <button className="px-4 py-2 rounded-full text-white text-sm font-bold" style={{ backgroundColor: primary }}>Subscribe</button>
          </div>
        )}
      </div>
    );
  }

  // Commerce sections
  if (['product-grid', 'featured-collection', 'best-sellers', 'hero-products'].includes(type)) {
    const items = (data.items || inventory).slice(0, data.itemCount || 12);
    const columns = data.columns || 3;
    if (items.length === 0) return null;
    return (
      <div className="px-8 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-serif italic text-center mb-12">{data.title || 'Products'}</h2>
        <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {items.map((item: any, j: number) => (
            <div key={j} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-[#F9F8F6] flex items-center justify-center text-4xl">📦</div>
              )}
              <div className="p-6">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-black/50 text-sm mt-1">{item.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <p className="font-bold text-xl" style={{ color: primary }}>{item.price}</p>
                  <button onClick={() => onAddToCart(item.name)} className="px-4 py-2 rounded-full text-white text-sm font-bold" style={{ backgroundColor: primary }}>
                    Add to cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Service sections
  if (['service-list', 'packages', 'pricing-tiers'].includes(type)) {
    const items = (data.items || data.tiers || data.packages || inventory);
    if (!items || items.length === 0) return null;
    const isPricing = type === 'pricing-tiers';
    return (
      <div className="px-8 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-serif italic text-center mb-12">{data.title || 'Services'}</h2>
        {isPricing ? (
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)` }}>
            {items.map((tier: any, j: number) => (
              <div key={j} className={`rounded-2xl p-8 text-center ${tier.highlighted ? 'bg-black text-white ring-2 ring-black' : 'bg-white'}`}>
                <h3 className="font-bold text-lg mb-2">{tier.name}</h3>
                <p className="text-3xl font-bold mb-4">{tier.price}</p>
                <ul className="space-y-2 mb-6">
                  {(tier.features || []).map((f: string, k: number) => (
                    <li key={k} className={`text-sm ${tier.highlighted ? 'text-white/70' : 'text-black/50'}`}>{f}</li>
                  ))}
                </ul>
                <button className="px-6 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: tier.highlighted ? 'white' : primary, color: tier.highlighted ? 'black' : 'white' }}>
                  Get started
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item: any, j: number) => (
              <div key={j} className="bg-white rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-black/50 text-sm mt-1">{item.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl" style={{ color: primary }}>{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Storytelling
  if (['brand-story', 'editorial-split', 'founder-note'].includes(type)) {
    return (
      <div className="px-8 py-20 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          {data.imageUrl && <img src={data.imageUrl} alt="" className="w-full h-64 object-cover rounded-2xl mb-8" />}
          <h2 className="text-3xl font-serif italic mb-6">{data.headline || data.title || 'Our Story'}</h2>
          <p className="text-black/60 leading-relaxed text-lg">{data.body || data.quote || 'Tell your story here.'}</p>
          {data.founderName && <p className="mt-4 font-bold text-sm">{data.founderName} — {data.founderTitle}</p>}
        </div>
      </div>
    );
  }

  // Value icons
  if (type === 'value-icons') {
    return (
      <div className="px-8 py-16">
        <h2 className="text-2xl font-serif italic text-center mb-10">{data.title || 'Why choose us'}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {(data.values || []).map((v: any, i: number) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-3">{v.icon || '✦'}</div>
              <h3 className="font-bold text-sm mb-1">{v.title}</h3>
              <p className="text-xs text-black/50">{v.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Social proof
  if (['testimonials', 'reviews'].includes(type)) {
    const items = data.testimonials || data.reviews || [];
    if (items.length === 0) return null;
    return (
      <div className="px-8 py-16 bg-white">
        <h2 className="text-2xl font-serif italic text-center mb-10">{data.title || 'What customers say'}</h2>
        <div className="grid gap-6 max-w-4xl mx-auto" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)` }}>
          {items.map((t: any, i: number) => (
            <div key={i} className="bg-[#F9F8F6] rounded-2xl p-6">
              {t.rating && <div className="text-amber-500 text-sm mb-2">{'★'.repeat(t.rating)}</div>}
              <p className="text-sm text-black/70 italic">"{t.quote || t.text}"</p>
              <p className="mt-3 font-bold text-xs">{t.name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Logo bar
  if (type === 'logo-bar') {
    return (
      <div className="px-8 py-12 text-center">
        <p className="text-xs text-black/30 uppercase tracking-wider mb-6">{data.title || 'Trusted by'}</p>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          {(data.logos || []).map((logo: any, i: number) => (
            <div key={i} className="w-20 h-10 bg-black/5 rounded-lg flex items-center justify-center text-xs text-black/30">{logo.name || 'Logo'}</div>
          ))}
          {(!data.logos || data.logos.length === 0) && (
            <p className="text-xs text-black/20">Add logos in the editor</p>
          )}
        </div>
      </div>
    );
  }

  // Stats
  if (type === 'stats') {
    return (
      <div className="px-8 py-16 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {(data.stats || []).map((s: any, i: number) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold" style={{ color: primary }}>{s.value}</p>
              <p className="text-sm text-black/50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Quote CTA / Booking CTA
  if (['quote-cta', 'booking-cta'].includes(type)) {
    return (
      <div className="px-8 py-16 text-center">
        <h2 className="text-3xl font-serif italic mb-4">{data.headline || 'Get in touch'}</h2>
        <p className="text-black/60 mb-8 max-w-lg mx-auto">{data.subheading || 'Tell us about your project.'}</p>
        <button className="px-8 py-4 rounded-full text-white font-bold text-lg" style={{ backgroundColor: primary }}>
          {data.ctaText || 'Contact us'}
        </button>
      </div>
    );
  }

  // FAQ
  if (type === 'faq') {
    return (
      <div className="px-8 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-serif italic text-center mb-10">{data.title || 'Frequently Asked Questions'}</h2>
        <div className="space-y-4">
          {(data.questions || []).map((q: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl p-5">
              <h3 className="font-bold text-sm mb-2">{q.question}</h3>
              <p className="text-sm text-black/60">{q.answer}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Newsletter
  if (type === 'newsletter') {
    return (
      <div className="px-8 py-16 bg-white text-center">
        <h2 className="text-2xl font-serif italic mb-3">{data.headline || 'Stay in the loop'}</h2>
        <p className="text-black/50 mb-6">{data.subheading || 'Get updates and exclusive offers.'}</p>
        <div className="flex gap-2 justify-center">
          <input type="email" placeholder="Enter your email" className="px-4 py-2 rounded-full border border-black/10 text-sm w-64" />
          <button className="px-6 py-2 rounded-full text-white text-sm font-bold" style={{ backgroundColor: primary }}>{data.ctaText || 'Subscribe'}</button>
        </div>
      </div>
    );
  }

  // Promo banner
  if (type === 'promo-banner') {
    return (
      <div className="px-8 py-4 text-center" style={{ backgroundColor: data.backgroundColor || '#1A1A1A', color: data.textColor || '#FFFFFF' }}>
        <p className="text-sm font-bold">{data.text || 'Special offer!'}</p>
        {data.ctaText && (
          <a href="#" className="inline-block mt-2 px-4 py-1 rounded-full text-xs font-bold border border-current">{data.ctaText}</a>
        )}
      </div>
    );
  }

  // Media
  if (type === 'gallery') {
    return (
      <div className="px-8 py-16">
        <h2 className="text-2xl font-serif italic text-center mb-8">{data.title || 'Gallery'}</h2>
        <div className="grid grid-cols-3 gap-4">
          {(data.images || []).map((img: any, i: number) => (
            <img key={i} src={typeof img === 'string' ? img : img.url} alt="" className="w-full h-48 object-cover rounded-xl" />
          ))}
          {(!data.images || data.images.length === 0) && (
            <div className="col-span-3 text-center text-xs text-black/20 py-8">Add images in the editor</div>
          )}
        </div>
      </div>
    );
  }

  // Video
  if (type === 'video') {
    return (
      <div className="px-8 py-16">
        {data.title && <h2 className="text-2xl font-serif italic text-center mb-8">{data.title}</h2>}
        {data.videoUrl ? (
          <div className="max-w-4xl mx-auto">
            <video src={data.videoUrl} controls className="w-full rounded-2xl" poster={data.thumbnailUrl} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-black/5 rounded-2xl h-64 flex items-center justify-center text-black/20">
            Add video URL in editor
          </div>
        )}
      </div>
    );
  }

  // Before & After
  if (type === 'before-after') {
    return (
      <div className="px-8 py-16">
        <h2 className="text-2xl font-serif italic text-center mb-8">{data.title || 'Before & After'}</h2>
        <div className="max-w-4xl mx-auto space-y-8">
          {(data.pairs || []).map((pair: any, i: number) => (
            <div key={i} className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-black/40 mb-2 text-center">Before</p>
                <img src={pair.beforeUrl} alt="Before" className="w-full h-48 object-cover rounded-xl" />
              </div>
              <div>
                <p className="text-xs text-black/40 mb-2 text-center">After</p>
                <img src={pair.afterUrl} alt="After" className="w-full h-48 object-cover rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Social gallery
  if (type === 'social-gallery') {
    return (
      <div className="px-8 py-16">
        <h2 className="text-2xl font-serif italic text-center mb-8">{data.title || 'Follow us'}</h2>
        <div className="grid grid-cols-4 gap-3 max-w-4xl mx-auto">
          {(data.images || []).map((img: any, i: number) => (
            <img key={i} src={typeof img === 'string' ? img : img.url} alt="" className="w-full aspect-square object-cover rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Press
  if (type === 'press') {
    return (
      <div className="px-8 py-16 bg-white">
        <h2 className="text-2xl font-serif italic text-center mb-8">{data.title || 'As seen in'}</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {(data.mentions || []).map((m: any, i: number) => (
            <div key={i} className="text-center">
              <p className="font-bold text-sm mb-1">{m.outlet}</p>
              <p className="text-sm text-black/60 italic">"{m.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Collection carousel
  if (type === 'collection-carousel') {
    return (
      <div className="px-8 py-16">
        <h2 className="text-2xl font-serif italic text-center mb-8">{data.title || 'Shop by Category'}</h2>
        <div className="flex gap-6 overflow-x-auto pb-4 max-w-5xl mx-auto">
          {(data.collections || []).map((c: any, i: number) => (
            <div key={i} className="flex-shrink-0 w-48 bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="w-full h-32 bg-[#F9F8F6]" />
              <div className="p-4 text-center">
                <p className="font-bold text-sm">{c.name || `Collection ${i + 1}`}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sticky CTA
  if (type === 'sticky-cta') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black text-white px-6 py-3 flex items-center justify-between z-40">
        <span className="text-sm font-bold">{data.text || 'Ready to get started?'}</span>
        <button className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundColor: primary }}>{data.ctaText || 'Shop now'}</button>
      </div>
    );
  }

  // Footers
  if (type.startsWith('footer-')) {
    return (
      <footer className="bg-white border-t border-black/5 px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <span className="font-bold text-lg">{data.logoText || 'Your Brand'}</span>
            <div className="flex gap-6 text-sm text-black/50">
              {(data.links || []).map((l: any, i: number) => (
                <a key={i} href={l.url || '#'} className="hover:text-black">{l.label}</a>
              ))}
            </div>
          </div>
          {data.showContact && (
            <div className="text-sm text-black/50 mb-4">
              <p>📧 {site.contact_email}</p>
              {data.showHours && <p className="mt-1">🕐 {data.hours}</p>}
            </div>
          )}
          {data.newsletter && (
            <div className="mb-6">
              <p className="text-sm font-bold mb-2">Stay updated</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email" className="px-3 py-1.5 rounded-full border border-black/10 text-sm flex-1" />
                <button className="px-4 py-1.5 rounded-full text-white text-xs font-bold" style={{ backgroundColor: primary }}>Subscribe</button>
              </div>
            </div>
          )}
          <p className="text-xs text-black/30">{data.copyright || `© ${new Date().getFullYear()} ${site.business_name}`}</p>
        </div>
      </footer>
    );
  }

  // Fallback for unknown sections
  return (
    <div className="px-8 py-12 text-center">
      <p className="text-sm text-black/30">[{type}]</p>
    </div>
  );
}
