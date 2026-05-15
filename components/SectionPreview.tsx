'use client';

import type { GeneratedSection, TemplateDefinition } from '@/lib/types';
import { SECTION_LIBRARY } from '@/lib/section-library';

interface SectionPreviewProps {
  section: GeneratedSection;
  template: TemplateDefinition;
  inventory?: any[];
}

export default function SectionPreview({ section, template, inventory }: SectionPreviewProps) {
  const def = SECTION_LIBRARY[section.type];
  const data = section.data;
  const isHeader = section.type.startsWith('header-');
  const isFooter = section.type.startsWith('footer-');
  const isHero = section.type.startsWith('hero-');
  const isCommerce = ['product-grid', 'featured-collection', 'best-sellers', 'collection-carousel'].includes(section.type);
  const isService = ['service-list', 'packages', 'pricing-tiers'].includes(section.type);

  if (isHeader) {
    return (
      <div className="px-6 py-3 flex items-center justify-between border-b border-black/5">
        <span className="font-bold text-sm">{data.logoText || 'Your Brand'}</span>
        <div className="flex gap-4 text-xs text-black/50">{(data.links || []).slice(0, 3).map((l: any, i: number) => <span key={i}>{l.label}</span>)}</div>
        {data.ctaText && <span className="text-xs bg-black text-white px-3 py-1 rounded-full">{data.ctaText}</span>}
      </div>
    );
  }
  if (isFooter) {
    return (
      <div className="px-6 py-6 text-center text-xs text-black/40 border-t border-black/5">
        <p className="font-bold text-black/60 mb-1">{data.logoText || 'Your Brand'}</p>
        <p>© {new Date().getFullYear()} — Footer</p>
      </div>
    );
  }
  if (isHero) {
    return (
      <div className="px-8 py-12 text-center" style={data.imageUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,${data.overlayOpacity || 0.4}), rgba(0,0,0,${data.overlayOpacity || 0.4})), url(${data.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        <h2 className={`text-2xl font-serif italic mb-3 ${data.imageUrl ? 'text-white' : ''}`}>{data.heading || 'Your headline'}</h2>
        <p className={`text-sm mb-4 ${data.imageUrl ? 'text-white/80' : 'text-black/50'}`}>{data.subheading || 'Your subheading'}</p>
        {data.ctaText && <span className="inline-block px-5 py-2 rounded-full text-white text-sm font-bold" style={{ backgroundColor: template.primaryColor }}>{data.ctaText}</span>}
      </div>
    );
  }
  if (isCommerce) {
    const items = (data.items || inventory || []).slice(0, data.columns || 3);
    return (
      <div className="px-6 py-8">
        <h3 className="text-lg font-serif italic text-center mb-6">{data.title || 'Products'}</h3>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(data.columns || 3, 3)}, 1fr)` }}>
          {items.length > 0 ? items.map((item: any, i: number) => (
            <div key={i} className="bg-[#F9F8F6] rounded-xl p-4 text-center">
              {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-24 object-cover rounded-lg mb-2" /> : <div className="w-full h-24 bg-black/5 rounded-lg mb-2" />}
              <p className="font-bold text-sm">{item.name}</p>
              <p className="text-xs text-black/40">{item.price}</p>
            </div>
          )) : <div className="col-span-full text-center text-xs text-black/30 py-4">Add products in Inventory tab</div>}
        </div>
      </div>
    );
  }
  if (isService) {
    const items = (data.items || inventory || []).slice(0, 4);
    return (
      <div className="px-6 py-8">
        <h3 className="text-lg font-serif italic text-center mb-6">{data.title || 'Services'}</h3>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-[#F9F8F6] rounded-xl p-4">
                <div><p className="font-bold text-sm">{item.name}</p><p className="text-xs text-black/40">{item.description}</p></div>
                <p className="font-bold text-sm" style={{ color: template.primaryColor }}>{item.price}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-center text-xs text-black/30 py-4">Add services in Inventory tab</p>}
      </div>
    );
  }
  return (
    <div className="px-6 py-8 text-center">
      <p className="text-sm font-bold mb-1">{def?.label}</p>
      <p className="text-xs text-black/40">{def?.description}</p>
      {data.headline && <p className="text-lg font-serif italic mt-3">{data.headline}</p>}
      {data.body && <p className="text-sm text-black/50 mt-2 max-w-md mx-auto">{data.body}</p>}
      {data.ctaText && <span className="inline-block mt-3 px-4 py-1.5 rounded-full text-white text-xs font-bold" style={{ backgroundColor: template.primaryColor }}>{data.ctaText}</span>}
    </div>
  );
}
