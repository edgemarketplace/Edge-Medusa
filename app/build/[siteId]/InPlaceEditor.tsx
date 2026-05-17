'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { GeneratedSection, InventoryItem, TemplateDefinition, SectionType, TemplateFamily } from '@/lib/types';
import { SECTION_LIBRARY, SECTION_CATEGORIES } from '@/lib/section-library';
import SectionEditor from '@/components/SectionEditor';

interface InPlaceEditorProps {
  sections: GeneratedSection[];
  inventory: InventoryItem[];
  template: TemplateDefinition;
  siteId: string;
  businessType: TemplateFamily;
  onSave: (sections: GeneratedSection[]) => Promise<void>;
}

function genId() { return Math.random().toString(36).slice(2, 10); }

export default function InPlaceEditor({ sections, inventory, template, siteId, businessType, onSave }: InPlaceEditorProps) {
  const [local, setLocal] = useState(sections);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [showAddAt, setShowAddAt] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<GeneratedSection | null>(null);
  const [saving, setSaving] = useState(false);
  const primary = template.primaryColor || '#1A1A1A';

  useEffect(() => {
    setLocal(sections);
  }, [sections]);

  async function persist(updated: GeneratedSection[]) {
    setLocal(updated);
    setSaving(true);
    await onSave(updated).finally(() => setSaving(false));
  }

  function updateField(id: string, field: string, value: any) {
    const updated = local.map(s => s.id === id ? { ...s, data: { ...s.data, [field]: value } } : s);
    persist(updated);
  }

  function updateEditingField(field: string, value: any) {
    setEditingSection(prev => prev ? { ...prev, data: { ...prev.data, [field]: value } } : prev);
  }

  async function saveEditingSection() {
    if (!editingSection) return;
    const updated = local.map(s => s.id === editingSection.id ? editingSection : s);
    await persist(updated);
    setEditingSection(null);
  }

  function startEditingSection(section: GeneratedSection) {
    setEditingSection({ ...section, data: { ...section.data } });
  }

  function removeSection(id: string) {
    persist(local.filter(s => s.id !== id));
  }

  function moveSection(id: string, dir: -1 | 1) {
    const idx = local.findIndex(s => s.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= local.length) return;
    const arr = [...local];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    persist(arr);
  }

  function addSection(type: SectionType, afterIndex: number) {
    const def = SECTION_LIBRARY[type];
    if (!def) return;
    const arr = [...local];
    arr.splice(afterIndex + 1, 0, { id: genId(), type, data: { ...def.defaultData } });
    persist(arr);
    setShowAddAt(null);
  }

  return (
    <div className="relative font-sans" style={{ fontFamily: template.fontFamily }}>
      {saving && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
          Saving…
        </div>
      )}

      {local.map((section, i) => (
        <div
          key={section.id}
          className="relative group"
          onMouseEnter={() => setHoverId(section.id)}
          onMouseLeave={() => setHoverId(null)}
        >
          {/* Section controls */}
          {hoverId === section.id && (
            <div className="absolute top-2 right-2 z-30 flex items-center gap-1 bg-white/95 backdrop-blur border border-black/10 rounded-xl shadow-lg px-2 py-1">
              <button
                onClick={() => startEditingSection(section)}
                title="Edit section content, images, FAQs, reviews"
                className="px-2 py-1 hover:bg-black/5 rounded-lg text-xs font-bold transition-colors"
              >Edit</button>
              <div className="w-px h-4 bg-black/10 mx-0.5" />
              <button
                onClick={() => moveSection(section.id, -1)}
                disabled={i === 0}
                title="Move up"
                className="p-1 hover:bg-black/5 rounded-lg text-xs disabled:opacity-30 transition-colors"
              >↑</button>
              <button
                onClick={() => moveSection(section.id, 1)}
                disabled={i === local.length - 1}
                title="Move down"
                className="p-1 hover:bg-black/5 rounded-lg text-xs disabled:opacity-30 transition-colors"
              >↓</button>
              <div className="w-px h-4 bg-black/10 mx-0.5" />
              <button
                onClick={() => removeSection(section.id)}
                title="Remove section"
                className="p-1 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs transition-colors"
              >✕</button>
            </div>
          )}

          {/* Editable section */}
          <EditableSection
            section={section}
            template={template}
            inventory={inventory}
            onUpdate={(field, val) => updateField(section.id, field, val)}
            primary={primary}
          />

          {/* Add section zone */}
          <div className="relative h-4 flex items-center justify-center group/add">
            <div className="absolute inset-x-0 h-full opacity-0 group-hover/add:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => setShowAddAt(showAddAt === i ? null : i)}
                className="bg-[#1A1A1A] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md hover:scale-105 transition-transform z-10"
              >
                + Add section
              </button>
            </div>
          </div>

          {/* Section picker popover */}
          {showAddAt === i && (
            <SectionPicker
              onSelect={type => addSection(type as SectionType, i)}
              onClose={() => setShowAddAt(null)}
            />
          )}
        </div>
      ))}

      {/* Full section editor drawer for arrays/images/FAQs/reviews */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/25 backdrop-blur-sm" onClick={() => setEditingSection(null)}>
          <div className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-black/35">Editing section</p>
                <h3 className="font-bold">{SECTION_LIBRARY[editingSection.type]?.label || editingSection.type}</h3>
              </div>
              <button onClick={() => setEditingSection(null)} className="text-black/40 hover:text-black text-xl">✕</button>
            </div>
            <SectionEditor
              draft={editingSection}
              onChange={updateEditingField}
              siteId={siteId}
              businessType={businessType}
            />
            <div className="sticky bottom-0 bg-white border-t border-black/5 p-4 flex gap-3 justify-end">
              <button onClick={() => setEditingSection(null)} className="px-5 py-2.5 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5">Cancel</button>
              <button onClick={saveEditingSection} disabled={saving} className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-bold disabled:opacity-50">{saving ? 'Saving…' : 'Save section'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add section at end */}
      <div className="py-6 flex justify-center">
        <button
          onClick={() => setShowAddAt(showAddAt === local.length ? null : local.length - 1)}
          className="flex items-center gap-2 border border-dashed border-black/20 rounded-full px-5 py-2.5 text-sm text-black/50 hover:border-black/40 hover:text-black transition-all"
        >
          + Add section
        </button>
      </div>
    </div>
  );
}

// ── Contenteditable text helper ──
function Editable({ value, onChange, className, style, tag = 'span', placeholder }: {
  value: string; onChange: (v: string) => void;
  className?: string; style?: React.CSSProperties;
  tag?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
  placeholder?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  const handleBlur = useCallback(() => {
    if (ref.current) onChange(ref.current.innerText);
  }, [onChange]);

  const Tag = tag as any;
  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={`outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 rounded cursor-text transition-all ${className || ''}`}
      style={style}
      data-placeholder={placeholder}
      dangerouslySetInnerHTML={{ __html: value || '' }}
    />
  );
}

// ── Per-section editable renderers ──
function EditableSection({ section, template, inventory, onUpdate, primary }: {
  section: GeneratedSection;
  template: TemplateDefinition;
  inventory: InventoryItem[];
  onUpdate: (field: string, val: string) => void;
  primary: string;
}) {
  const { type, data } = section;

  // ── Header ──
  if (type.startsWith('header-')) {
    return (
      <div className="bg-white border-b border-black/5 px-8 py-4 flex items-center justify-between">
        <Editable value={data.logoText || 'Your Brand'} onChange={v => onUpdate('logoText', v)}
          className="font-bold text-base" placeholder="Brand name" />
        <div className="flex gap-6 text-sm text-black/60">
          {(data.links || []).slice(0, 5).map((l: any, i: number) => (
            <Editable key={i} value={l.label} onChange={v => {
              const links = [...(data.links || [])];
              links[i] = { ...links[i], label: v };
              onUpdate('links', links as any);
            }} className="hover:text-black" />
          ))}
        </div>
        {data.ctaText && (
          <Editable value={data.ctaText} onChange={v => onUpdate('ctaText', v)}
            className="px-4 py-2 rounded-full text-white text-sm font-bold"
            style={{ backgroundColor: primary } as any} />
        )}
      </div>
    );
  }

  // ── Hero ──
  if (type.startsWith('hero-')) {
    const hasImage = !!data.imageUrl;
    const bgStyle: React.CSSProperties = {};
    if (data.background) bgStyle.backgroundColor = data.background;
    if (hasImage) {
      bgStyle.backgroundImage = `linear-gradient(rgba(0,0,0,${data.overlayOpacity || 0.45}), rgba(0,0,0,${data.overlayOpacity || 0.45})), url(${data.imageUrl})`;
      bgStyle.backgroundSize = 'cover';
      bgStyle.backgroundPosition = 'center';
    }
    if (data.textColor) bgStyle.color = data.textColor;
    
    const handleImageClick = () => {
      const url = prompt('Enter image URL:', data.imageUrl || '');
      if (url !== null && url !== data.imageUrl) onUpdate('imageUrl', url);
    };
    
    return (
      <div
        className={`px-8 py-20 text-center relative ${hasImage ? 'min-h-[420px] flex flex-col items-center justify-center' : 'bg-[#F9F8F6]'}`}
        style={Object.keys(bgStyle).length > 0 ? bgStyle : undefined}
        onClick={hasImage ? handleImageClick : undefined}
        title={hasImage ? 'Click to change background image' : undefined}
      >
        <Editable tag="h1" value={data.heading || data.headline || 'Your headline'} onChange={v => onUpdate('heading', v)}
          className={`text-4xl md:text-6xl font-serif italic tracking-tight mb-6 block ${hasImage ? 'text-white' : ''}`}
          placeholder="Headline" />
        <Editable tag="p" value={data.subheading || 'Your subheading'} onChange={v => onUpdate('subheading', v)}
          className={`text-xl max-w-2xl mx-auto mb-8 block ${hasImage ? 'text-white/80' : 'text-black/60'}`}
          placeholder="Subheading" />
        {data.ctaText && (
          <Editable value={data.ctaText} onChange={v => onUpdate('ctaText', v)}
            className="inline-block px-8 py-4 rounded-full text-white font-bold text-lg cursor-text"
            style={{ backgroundColor: primary } as any} />
        )}
        {hasImage && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-auto cursor-pointer" onClick={handleImageClick}>
              🖼 Change image
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Product grid ──
  if (['product-grid', 'featured-collection', 'best-sellers', 'hero-products'].includes(type)) {
    const items = inventory.slice(0, data.columns || 3);
    return (
      <div className="px-8 py-16 max-w-6xl mx-auto">
        <Editable tag="h2" value={data.title || 'Products'} onChange={v => onUpdate('title', v)}
          className="text-3xl font-serif italic text-center mb-12 block" />
        {items.length > 0 ? (
          <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${Math.min(data.columns || 3, 3)}, 1fr)` }}>
            {items.map((item, j) => (
              <div key={j} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
                  : <div className="w-full h-48 bg-[#F9F8F6] flex items-center justify-center text-4xl">📦</div>}
                <div className="p-6">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-black/50 text-sm mt-1">{item.description}</p>
                  <p className="font-bold text-xl mt-3" style={{ color: primary }}>{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#F9F8F6] rounded-2xl text-black/40 text-sm">
            Add products in the Inventory tab to populate this section
          </div>
        )}
      </div>
    );
  }

  // ── Service list ──
  if (['service-list', 'packages', 'pricing-tiers'].includes(type)) {
    const items = data.services || data.items || data.tiers || data.packages || inventory;
    return (
      <div className="px-8 py-16 max-w-5xl mx-auto">
        <Editable tag="h2" value={data.title || 'Services'} onChange={v => onUpdate('title', v)}
          className="text-3xl font-serif italic text-center mb-12 block" />
        <div className="space-y-4">
          {(items || []).map((item: any, j: number) => (
            <div key={j} className="bg-white rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">{item.name}</p>
                <p className="text-black/50 text-sm mt-1">{item.description}</p>
              </div>
              <p className="font-bold text-xl" style={{ color: primary }}>{item.price}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Brand story / editorial ──
  if (['brand-story', 'editorial-split', 'founder-note'].includes(type)) {
    return (
      <div className="px-8 py-20 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <Editable tag="h2" value={data.headline || data.title || 'Our Story'} onChange={v => onUpdate('headline', v)}
            className="text-3xl font-serif italic mb-6 block" />
          <Editable tag="p" value={data.body || data.quote || ''} onChange={v => onUpdate('body', v)}
            className="text-black/60 leading-relaxed text-lg block"
            placeholder="Tell your story here…" />
        </div>
      </div>
    );
  }

  // ── Testimonials ──
  if (['testimonials', 'reviews'].includes(type)) {
    const items = data.testimonials || data.reviews || [];
    return (
      <div className="px-8 py-16 bg-white">
        <Editable tag="h2" value={data.title || 'What customers say'} onChange={v => onUpdate('title', v)}
          className="text-2xl font-serif italic text-center mb-10 block" />
        <div className="grid gap-6 max-w-4xl mx-auto" style={{ gridTemplateColumns: `repeat(${Math.min(items.length || 1, 3)}, 1fr)` }}>
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

  // ── Quote / Booking CTA ──
  if (['quote-cta', 'booking-cta'].includes(type)) {
    return (
      <div className="px-8 py-16 text-center">
        <Editable tag="h2" value={data.headline || 'Get in touch'} onChange={v => onUpdate('headline', v)}
          className="text-3xl font-serif italic mb-4 block" />
        <Editable tag="p" value={data.subheading || ''} onChange={v => onUpdate('subheading', v)}
          className="text-black/60 mb-8 max-w-lg mx-auto block" placeholder="Tell us about your project." />
        <Editable value={data.ctaText || 'Contact us'} onChange={v => onUpdate('ctaText', v)}
          className="inline-block px-8 py-4 rounded-full text-white font-bold text-lg"
          style={{ backgroundColor: primary } as any} />
      </div>
    );
  }

  // ── FAQ ──
  if (type === 'faq') {
    return (
      <div className="px-8 py-16 max-w-3xl mx-auto">
        <Editable tag="h2" value={data.title || 'FAQ'} onChange={v => onUpdate('title', v)}
          className="text-2xl font-serif italic text-center mb-10 block" />
        <div className="space-y-4">
          {(data.questions || []).map((q: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl p-5">
              <p className="font-bold text-sm mb-2">{q.question}</p>
              <p className="text-sm text-black/60">{q.answer}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Stats ──
  if (type === 'stats') {
    return (
      <div className="px-8 py-16">
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

  // ── Newsletter ──
  if (type === 'newsletter') {
    return (
      <div className="px-8 py-16 bg-white text-center">
        <Editable tag="h2" value={data.headline || 'Stay in the loop'} onChange={v => onUpdate('headline', v)}
          className="text-2xl font-serif italic mb-3 block" />
        <Editable tag="p" value={data.subheading || ''} onChange={v => onUpdate('subheading', v)}
          className="text-black/50 mb-6 block" placeholder="Get updates and exclusive offers." />
        <div className="flex gap-2 justify-center">
          <input type="email" placeholder="Enter your email" className="px-4 py-2 rounded-full border border-black/10 text-sm w-64" readOnly />
          <div className="px-6 py-2 rounded-full text-white text-sm font-bold" style={{ backgroundColor: primary }}>
            Subscribe
          </div>
        </div>
      </div>
    );
  }

  // ── Promo banner ──
  if (type === 'promo-banner') {
    return (
      <div className="px-8 py-4 text-center" style={{ backgroundColor: data.backgroundColor || '#1A1A1A', color: data.textColor || '#FFFFFF' }}>
        <Editable value={data.text || 'Special offer!'} onChange={v => onUpdate('text', v)}
          className="text-sm font-bold" />
      </div>
    );
  }

  // ── Footer ──
  if (type.startsWith('footer-')) {
    return (
      <footer className="bg-white border-t border-black/5 px-8 py-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Editable value={data.logoText || 'Your Brand'} onChange={v => onUpdate('logoText', v)}
            className="font-bold text-lg" />
          <p className="text-xs text-black/30">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    );
  }

  // ── Fallback ──
  return (
    <div className="px-8 py-12 text-center">
      <p className="text-xs text-black/30 bg-black/5 rounded-full px-3 py-1 inline-block">{type}</p>
      {data.headline && (
        <Editable tag="h2" value={data.headline} onChange={v => onUpdate('headline', v)}
          className="text-2xl font-serif italic mt-4 block" />
      )}
    </div>
  );
}

// ── Section Picker popover ──
function SectionPicker({ onSelect, onClose }: { onSelect: (type: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">Add a section</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black text-xl">✕</button>
        </div>
        {SECTION_CATEGORIES.map(cat => (
          <div key={cat.category} className="mb-5">
            <p className="text-xs uppercase tracking-widest font-bold text-black/35 mb-2">{cat.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {cat.types.map(type => {
                const def = SECTION_LIBRARY[type];
                return def ? (
                  <button
                    key={type}
                    onClick={() => onSelect(type)}
                    className="text-left p-3 rounded-xl border border-black/8 hover:border-black/20 hover:bg-black/2 transition-all"
                  >
                    <p className="font-bold text-sm">{def.label}</p>
                    <p className="text-xs text-black/45 mt-0.5 leading-tight">{def.description}</p>
                  </button>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
