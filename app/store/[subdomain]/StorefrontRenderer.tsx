'use client';

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
  // Merge AI-generated product items with real inventory
  const mergedSections = sections.map((section) => {
    if (section.type === 'products' && inventory.length > 0) {
      return {
        ...section,
        items: inventory.map((item) => ({
          name: item.name,
          price: item.price,
          description: item.description,
        })),
      };
    }
    return section;
  });

  return (
    <div
      className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A]"
      style={{ fontFamily: template.fontFamily }}
    >
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
                <button
                  className="px-8 py-4 rounded-full text-white font-bold text-lg"
                  style={{ backgroundColor: template.primaryColor }}
                >
                  {section.ctaText}
                </button>
              )}
            </div>
          );
        }

        if (section.type === 'products') {
          const items = section.items || [];
          if (items.length === 0) return null;

          return (
            <div key={i} className="px-8 py-16 max-w-6xl mx-auto">
              <h2 className="text-3xl font-serif italic text-center mb-12">
                {section.title || 'Our Products'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item, j) => (
                  <div
                    key={j}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm"
                  >
                    <div className="w-full h-48 bg-[#F9F8F6]" />
                    <div className="p-6">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-black/50 text-sm mt-1">{item.description}</p>
                      <p
                        className="font-bold text-xl mt-4"
                        style={{ color: template.primaryColor }}
                      >
                        {item.price}
                      </p>
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
