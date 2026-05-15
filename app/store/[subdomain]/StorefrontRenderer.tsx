'use client';

import { useState } from 'react';
import type { SiteData, GeneratedSection, InventoryItem, TemplateDefinition } from '@/lib/types';

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

  // Merge AI-generated product items with real inventory
  const mergedSections = sections.map((section) => {
    if (section.type === 'products' && inventory.length > 0) {
      return {
        ...section,
        items: inventory.map((item) => ({
          name: item.name,
          price: item.price,
          description: item.description,
          id: item.id,
        })),
      };
    }
    return section;
  });

  function addToCart(itemName: string) {
    setCart((prev) => ({ ...prev, [itemName]: (prev[itemName] || 0) + 1 }));
  }

  async function handleCheckout() {
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([name, qty]) => {
        const item = inventory.find((i) => i.name === name);
        return {
          name,
          price: item?.price || '0',
          description: item?.description || '',
          quantity: qty,
        };
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
        window.location.href = data.url;
      } else if (data.error?.includes('Stripe not connected')) {
        alert('This merchant has not set up payments yet. Please contact them directly.');
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch (err) {
      alert('Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  }

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div
      className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A]"
      style={{ fontFamily: template.fontFamily }}
    >
      {/* Floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleCheckout}
            disabled={checkingOut}
            className="bg-black text-white px-6 py-4 rounded-full font-bold shadow-lg flex items-center gap-3 hover:scale-105 transition-transform disabled:opacity-50"
          >
            <span>🛒 {cartCount} item{cartCount > 1 ? 's' : ''}</span>
            <span className="bg-white text-black px-3 py-1 rounded-full text-sm">
              {checkingOut ? 'Processing...' : 'Checkout'}
            </span>
          </button>
        </div>
      )}

      {mergedSections.map((section, i) => {
        if (section.type === 'hero') {
          return (
            <div key={i} className="px-8 py-24 text-center">
              <h1 className="text-4xl md:text-6xl font-serif italic tracking-tight mb-6">
                {section.heading}
              </h1>
              <p className="text-xl text-black/60 max-w-2xl mx-auto mb-8">
                {section.subheading}
              </p>
              {section.ctaText && (
                <a
                  href="#products"
                  className="inline-block px-8 py-4 rounded-full text-white font-bold text-lg"
                  style={{ backgroundColor: template.primaryColor }}
                >
                  {section.ctaText}
                </a>
              )}
            </div>
          );
        }

        if (section.type === 'products') {
          const items = section.items || [];
          if (items.length === 0) return null;

          return (
            <div key={i} id="products" className="px-8 py-16 max-w-6xl mx-auto">
              <h2 className="text-3xl font-serif italic text-center mb-12">
                {section.title || 'Our Products'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item, j) => (
                  <div
                    key={j}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm"
                  >
                    <div className="w-full h-48 bg-[#F9F8F6] flex items-center justify-center text-4xl">
                      📦
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-black/50 text-sm mt-1">{item.description}</p>
                      <div className="flex items-center justify-between mt-4">
                        <p
                          className="font-bold text-xl"
                          style={{ color: template.primaryColor }}
                        >
                          {item.price}
                        </p>
                        <button
                          onClick={() => addToCart(item.name)}
                          className="px-4 py-2 rounded-full text-white text-sm font-bold"
                          style={{ backgroundColor: template.primaryColor }}
                        >
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

        if (section.type === 'about') {
          return (
            <div key={i} className="px-8 py-20 bg-white">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-serif italic mb-6">{section.headline}</h2>
                <p className="text-black/60 leading-relaxed text-lg">{section.body}</p>
              </div>
            </div>
          );
        }

        if (section.type === 'contact') {
          return (
            <div key={i} className="px-8 py-16 text-center">
              <h2 className="text-3xl font-serif italic mb-8">
                {section.title || 'Get in touch'}
              </h2>
              {section.ctaText && (
                <a
                  href={`mailto:${site.contact_email}`}
                  className="inline-block px-8 py-4 rounded-full text-white font-bold"
                  style={{ backgroundColor: template.primaryColor }}
                >
                  {section.ctaText}
                </a>
              )}
            </div>
          );
        }

        return null;
      })}

      {/* Footer */}
      <footer className="border-t border-black/5 py-8 px-8 text-center text-sm text-black/40">
        <p>© {new Date().getFullYear()} {site.business_name}. Powered by Edge Marketplace Hub.</p>
      </footer>
    </div>
  );
}
