'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GeneratedSection, SectionType, TemplateFamily } from '@/lib/types';
import { SECTION_LIBRARY } from '@/lib/section-library';

interface SectionEditorProps {
  draft: GeneratedSection;
  onChange: (field: string, value: any) => void;
  siteId: string;
  businessType: TemplateFamily;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Default search queries per business type for Unsplash
const DEFAULT_QUERIES: Record<string, string> = {
  'retail-core': 'boutique store interior',
  'service-pro': 'professional service work',
  'food-catering': 'food catering event',
  'artisan-market': 'handmade artisan craft',
  'event-floral': 'wedding floral arrangement',
};

export default function SectionEditor({ draft, onChange, siteId, businessType }: SectionEditorProps) {
  const def = SECTION_LIBRARY[draft.type];
  const data = draft.data;
  const [uploading, setUploading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState<string | null>(null);
  const [unsplashImages, setUnsplashImages] = useState<Array<{ url: string; thumb: string; alt: string }>>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const defaultQuery = DEFAULT_QUERIES[businessType] || 'business';

  // Search Unsplash
  const searchUnsplash = useCallback(async (query: string) => {
    setUnsplashLoading(true);
    try {
      const res = await fetch(`/api/images/search?q=${encodeURIComponent(query)}&count=9`);
      if (res.ok) {
        const results = await res.json();
        setUnsplashImages(results);
      }
    } catch (err) {
      console.error('Unsplash search failed:', err);
    } finally {
      setUnsplashLoading(false);
    }
  }, []);

  // Load default images when picker opens
  useEffect(() => {
    if (showImagePicker && unsplashImages.length === 0) {
      searchUnsplash(defaultQuery);
    }
  }, [showImagePicker, unsplashImages.length, defaultQuery, searchUnsplash]);

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/sites/${siteId}/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const result = await res.json();
    return result.url;
  }

  async function handleImageUpload(field: string) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try { const url = await uploadImage(file); onChange(field, url); }
      catch (err) { console.error(err); }
      finally { setUploading(false); }
    };
    input.click();
  }

  async function handleAiGenerate(field: string) {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, siteId }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.url) {
          onChange(field, result.url);
          setShowImagePicker(null);
          setAiPrompt('');
        }
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setAiGenerating(false);
    }
  }

  function ImageField({ label, field, currentUrl }: { label: string; field: string; currentUrl?: string }) {
    const fieldId = `img-${field}-${draft.id}`;
    const urlInputId = `url-${field}-${draft.id}`;
    const isOpen = showImagePicker === field;

    return (
      <div>
        <label htmlFor={fieldId} className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-wider">{label}</label>
        {currentUrl ? (
          <div className="relative group inline-block mb-2">
            <img src={currentUrl} alt={label} className="h-20 rounded-lg object-cover border border-black/10" />
            <button onClick={() => onChange(field, '')} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center" aria-label="Remove image">✕</button>
          </div>
        ) : (
          <div className="flex gap-2 mb-2">
            <button onClick={() => handleImageUpload(field)} disabled={uploading} className="flex items-center justify-center w-20 h-20 border border-dashed border-black/15 rounded-lg hover:border-black/30 text-black/25" id={fieldId} aria-label={`Upload ${label}`}>
              {uploading ? '...' : '+'}
            </button>
            <button onClick={() => setShowImagePicker(isOpen ? null : field)} className={`px-3 h-20 border rounded-lg text-xs transition-colors ${isOpen ? 'border-black bg-black/5 text-black' : 'border-black/10 text-black/50 hover:bg-black/5'}`} aria-label="Browse images">
              🖼 Browse
            </button>
          </div>
        )}

        {/* URL input */}
        <div className="flex gap-2 mb-2">
          <input id={urlInputId} name={urlInputId} type="url" placeholder="Or paste image URL..." className="flex-1 border border-black/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-black/30" onKeyDown={(e) => { if (e.key === 'Enter') { onChange(field, (e.target as HTMLInputElement).value); } }} />
          <button onClick={() => { const el = document.getElementById(urlInputId) as HTMLInputElement; if (el?.value) onChange(field, el.value); }} className="px-2 py-1 rounded-lg border border-black/10 text-xs font-bold hover:bg-black/5">Set</button>
        </div>

        {/* Image picker panel */}
        {isOpen && (
          <div className="border border-black/10 rounded-xl p-3 mb-2 bg-[#FAFAF9]">
            {/* Search */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={unsplashQuery}
                onChange={e => setUnsplashQuery(e.target.value)}
                placeholder="Search free photos..."
                className="flex-1 border border-black/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black/30"
                onKeyDown={(e) => { if (e.key === 'Enter' && unsplashQuery.trim()) searchUnsplash(unsplashQuery); }}
              />
              <button onClick={() => unsplashQuery.trim() && searchUnsplash(unsplashQuery)} disabled={unsplashLoading} className="px-3 py-2 rounded-lg bg-black text-white text-xs font-bold disabled:opacity-50">
                {unsplashLoading ? '...' : 'Search'}
              </button>
            </div>

            {/* Unsplash results */}
            {unsplashImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {unsplashImages.map((img, idx) => (
                  <button key={idx} onClick={() => { onChange(field, img.url); setShowImagePicker(null); }} className="relative group">
                    <img src={img.thumb} alt={img.alt} className="w-full h-16 object-cover rounded-lg border border-black/10 hover:border-black/30" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* AI generation */}
            <div className="border-t border-black/5 pt-3">
              <p className="text-[10px] font-bold text-black/40 uppercase tracking-wider mb-2">✨ Or generate with AI</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Describe the image you want..."
                  className="flex-1 border border-black/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black/30"
                  onKeyDown={(e) => { if (e.key === 'Enter' && aiPrompt.trim()) handleAiGenerate(field); }}
                />
                <button onClick={() => handleAiGenerate(field)} disabled={aiGenerating || !aiPrompt.trim()} className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold disabled:opacity-50 whitespace-nowrap">
                  {aiGenerating ? '...' : '✨ Generate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      {(data.heading !== undefined) && <EditField label="Heading" name={`heading-${draft.id}`} value={data.heading} onChange={v => onChange('heading', v)} />}
      {(data.subheading !== undefined) && <EditField label="Subheading" name={`subheading-${draft.id}`} value={data.subheading} onChange={v => onChange('subheading', v)} multiline />}
      {(data.title !== undefined) && <EditField label="Title" name={`title-${draft.id}`} value={data.title} onChange={v => onChange('title', v)} />}
      {(data.headline !== undefined) && <EditField label="Headline" name={`headline-${draft.id}`} value={data.headline} onChange={v => onChange('headline', v)} />}
      {(data.body !== undefined) && <EditField label="Body" name={`body-${draft.id}`} value={data.body} onChange={v => onChange('body', v)} multiline />}
      {(data.ctaText !== undefined) && <EditField label="Button text" name={`ctaText-${draft.id}`} value={data.ctaText} onChange={v => onChange('ctaText', v)} />}
      {(data.ctaUrl !== undefined) && <EditField label="Button URL" name={`ctaUrl-${draft.id}`} value={data.ctaUrl} onChange={v => onChange('ctaUrl', v)} />}
      {(data.text !== undefined) && <EditField label="Text" name={`text-${draft.id}`} value={data.text} onChange={v => onChange('text', v)} />}
      {(data.quote !== undefined) && <EditField label="Quote" name={`quote-${draft.id}`} value={data.quote} onChange={v => onChange('quote', v)} multiline />}
      {(data.name !== undefined && data.founderName === undefined) && <EditField label="Name" name={`name-${draft.id}`} value={data.name} onChange={v => onChange('name', v)} />}
      {(data.founderName !== undefined) && <><EditField label="Founder name" name={`founderName-${draft.id}`} value={data.founderName} onChange={v => onChange('founderName', v)} /><EditField label="Founder title" name={`founderTitle-${draft.id}`} value={data.founderTitle || ''} onChange={v => onChange('founderTitle', v)} /></>}
      {(data.announcement !== undefined) && <EditField label="Announcement text" name={`announcement-${draft.id}`} value={data.announcement} onChange={v => onChange('announcement', v)} />}
      {(data.collectionName !== undefined) && <EditField label="Collection name" name={`collectionName-${draft.id}`} value={data.collectionName} onChange={v => onChange('collectionName', v)} />}
      {(data.price !== undefined) && <EditField label="Price" name={`price-${draft.id}`} value={data.price} onChange={v => onChange('price', v)} />}
      {(data.videoUrl !== undefined) && <EditField label="Video URL" name={`videoUrl-${draft.id}`} value={data.videoUrl} onChange={v => onChange('videoUrl', v)} />}
      {(data.thumbnailUrl !== undefined) && <EditField label="Video thumbnail URL" name={`thumbnailUrl-${draft.id}`} value={data.thumbnailUrl} onChange={v => onChange('thumbnailUrl', v)} />}

      {/* Color fields */}
      {(data.background !== undefined) && <ColorField label="Background color" field="background" value={data.background} onChange={(v) => onChange('background', v)} />}
      {(data.textColor !== undefined) && <ColorField label="Text color" field="textColor" value={data.textColor} onChange={(v) => onChange('textColor', v)} />}
      {(data.backgroundColor !== undefined) && <ColorField label="Background color" field="backgroundColor" value={data.backgroundColor} onChange={(v) => onChange('backgroundColor', v)} />}

      {/* Image fields */}
      {(data.imageUrl !== undefined) && <ImageField label="Image" field="imageUrl" currentUrl={data.imageUrl} />}
      {(data.hero_image_url !== undefined) && <ImageField label="Background image" field="hero_image_url" currentUrl={data.hero_image_url} />}

      {/* Array fields */}
      {(data.testimonials !== undefined) && <ArrayEditor items={data.testimonials} onChange={items => onChange('testimonials', items)} itemFields={['name', 'quote', 'rating']} label="Testimonials" />}
      {(data.questions !== undefined) && <ArrayEditor items={data.questions} onChange={items => onChange('questions', items)} itemFields={['question', 'answer']} label="FAQs" />}
      {(data.services !== undefined) && <ArrayEditor items={data.services} onChange={items => onChange('services', items)} itemFields={['name', 'description', 'price']} label="Services" />}
      {(data.tiers !== undefined) && <ArrayEditor items={data.tiers} onChange={items => onChange('tiers', items)} itemFields={['name', 'price', 'highlighted']} label="Pricing Tiers" />}
      {(data.packages !== undefined) && <ArrayEditor items={data.packages} onChange={items => onChange('packages', items)} itemFields={['name', 'description', 'price']} label="Packages" />}
      {(data.values !== undefined) && <ArrayEditor items={data.values} onChange={items => onChange('values', items)} itemFields={['icon', 'title', 'description']} label="Values" />}
      {(data.stats !== undefined) && <ArrayEditor items={data.stats} onChange={items => onChange('stats', items)} itemFields={['value', 'label']} label="Stats" />}
      {(data.trustBadges !== undefined) && <ArrayEditor items={data.trustBadges} onChange={items => onChange('trustBadges', items)} itemFields={['text']} label="Trust Badges" addLabel="Add badge" />}
      {(data.logos !== undefined) && <ArrayEditor items={data.logos} onChange={items => onChange('logos', items)} itemFields={['name', 'url']} label="Logos" addLabel="Add logo" />}
      {(data.images !== undefined) && <ArrayEditor items={data.images} onChange={items => onChange('images', items)} itemFields={['url', 'alt']} label="Images" addLabel="Add image" />}
      {(data.pairs !== undefined) && <ArrayEditor items={data.pairs} onChange={items => onChange('pairs', items)} itemFields={['beforeUrl', 'afterUrl', 'label']} label="Before/After" addLabel="Add pair" />}
      {(data.mentions !== undefined) && <ArrayEditor items={data.mentions} onChange={items => onChange('mentions', items)} itemFields={['outlet', 'quote']} label="Press Mentions" addLabel="Add mention" />}
      {(data.collections !== undefined) && <ArrayEditor items={data.collections} onChange={items => onChange('collections', items)} itemFields={['name', 'url']} label="Collections" addLabel="Add collection" />}
      {(data.features !== undefined) && <ArrayEditor items={data.features} onChange={items => onChange('features', items)} itemFields={['text']} label="Features" addLabel="Add feature" />}
      {(data.links !== undefined) && <ArrayEditor items={data.links} onChange={items => onChange('links', items)} itemFields={['label', 'url']} label="Links" addLabel="Add link" />}

      {/* Select fields */}
      {(data.columns !== undefined && typeof data.columns === 'number') && (
        <div>
          <label htmlFor={`gridColumns-${draft.id}`} className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-wider">Grid columns</label>
          <select id={`gridColumns-${draft.id}`} name={`gridColumns-${draft.id}`} value={data.columns} onChange={e => onChange('columns', parseInt(e.target.value))} className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm">
            <option value={2}>2 columns</option>
            <option value={3}>3 columns</option>
            <option value={4}>4 columns</option>
          </select>
        </div>
      )}
      {(data.itemCount !== undefined) && (
        <div>
          <label htmlFor={`itemCount-${draft.id}`} className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-wider">Items to show</label>
          <select id={`itemCount-${draft.id}`} name={`itemCount-${draft.id}`} value={data.itemCount} onChange={e => onChange('itemCount', parseInt(e.target.value))} className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm">
            <option value={3}>3 items</option>
            <option value={4}>4 items</option>
            <option value={6}>6 items</option>
            <option value={8}>8 items</option>
            <option value={12}>12 items</option>
          </select>
        </div>
      )}

      {/* Boolean fields */}
      {(data.showEmailCapture !== undefined) && (
        <div className="flex items-center gap-2">
          <input id={`showEmail-${draft.id}`} name={`showEmail-${draft.id}`} type="checkbox" checked={data.showEmailCapture} onChange={e => onChange('showEmailCapture', e.target.checked)} className="w-4 h-4" />
          <label htmlFor={`showEmail-${draft.id}`} className="text-xs font-bold text-black/50">Show email capture form</label>
        </div>
      )}
      {(data.showFilters !== undefined) && (
        <div className="flex items-center gap-2">
          <input id={`showFilters-${draft.id}`} name={`showFilters-${draft.id}`} type="checkbox" checked={data.showFilters} onChange={e => onChange('showFilters', e.target.checked)} className="w-4 h-4" />
          <label htmlFor={`showFilters-${draft.id}`} className="text-xs font-bold text-black/50">Show filters</label>
        </div>
      )}
      {(data.showContact !== undefined) && (
        <div className="flex items-center gap-2">
          <input id={`showContact-${draft.id}`} name={`showContact-${draft.id}`} type="checkbox" checked={data.showContact} onChange={e => onChange('showContact', e.target.checked)} className="w-4 h-4" />
          <label htmlFor={`showContact-${draft.id}`} className="text-xs font-bold text-black/50">Show contact info</label>
        </div>
      )}
      {(data.showHours !== undefined) && (
        <div className="flex items-center gap-2">
          <input id={`showHours-${draft.id}`} name={`showHours-${draft.id}`} type="checkbox" checked={data.showHours} onChange={e => onChange('showHours', e.target.checked)} className="w-4 h-4" />
          <label htmlFor={`showHours-${draft.id}`} className="text-xs font-bold text-black/50">Show business hours</label>
        </div>
      )}
      {(data.imageLeft !== undefined) && (
        <div className="flex items-center gap-2">
          <input id={`imageLeft-${draft.id}`} name={`imageLeft-${draft.id}`} type="checkbox" checked={data.imageLeft} onChange={e => onChange('imageLeft', e.target.checked)} className="w-4 h-4" />
          <label htmlFor={`imageLeft-${draft.id}`} className="text-xs font-bold text-black/50">Image on left</label>
        </div>
      )}

      {/* Info for inventory-bound sections */}
      {['product-grid', 'featured-collection', 'best-sellers', 'hero-products', 'collection-carousel'].includes(draft.type) && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">ℹ️ This section displays products from your Inventory tab.</p>
      )}
      {['service-list', 'packages', 'pricing-tiers'].includes(draft.type) && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">ℹ️ This section displays services from your Inventory tab.</p>
      )}
    </div>
  );
  }

  function ColorField({ label, field, value, onChange }: { label: string; field: string; value: string; onChange: (field: string, value: string) => void }) {
    const fieldId = `color-${field}-${draft.id}`;
    return (
      <div>
        <label htmlFor={fieldId} className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-wider">{label}</label>
        <div className="flex gap-2 items-center">
          <input
            id={fieldId}
            type="color"
            value={value || '#000000'}
            onChange={e => onChange(field, e.target.value)}
            className="w-10 h-8 rounded border border-black/10 cursor-pointer"
          />
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(field, e.target.value)}
            placeholder="#000000"
            className="flex-1 border border-black/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-black/30"
          />
          {value && (
            <button onClick={() => onChange(field, '')} className="text-xs text-black/40 hover:text-red-500" aria-label="Clear color">✕</button>
          )}
        </div>
      </div>
    );
  }

  function EditField({ label, name, value, onChange, multiline }: { label: string; name: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const id = name;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-wider">{label}</label>
      {multiline ? (
        <textarea id={id} name={id} value={value} onChange={e => onChange(e.target.value)} rows={3} className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black/30 resize-none" />
      ) : (
        <input type="text" id={id} name={id} value={value} onChange={e => onChange(e.target.value)} className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black/30" />
      )}
    </div>
  );
}

function ArrayEditor({ items, onChange, itemFields, label, addLabel }: {
  items: any[]; onChange: (items: any[]) => void; itemFields: string[]; label: string; addLabel?: string;
}) {
  function addItem() {
    const newItem: any = {};
    itemFields.forEach(f => { newItem[f] = f === 'rating' ? 5 : f === 'highlighted' ? false : ''; });
    onChange([...items, newItem]);
  }
  function updateItem(index: number, field: string, value: any) {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item);
    onChange(updated);
  }
  function removeItem(index: number) { onChange(items.filter((_, i) => i !== index)); }

  return (
    <div>
      <label className="block text-xs font-bold text-black/50 mb-2 uppercase tracking-wider">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-[#F9F8F6] rounded-lg p-3 relative">
            <button onClick={() => removeItem(i)} className="absolute top-2 right-2 text-black/30 hover:text-red-500 text-xs" aria-label={`Remove ${label} item`}>✕</button>
            <div className="space-y-1.5 pr-6">
              {itemFields.map(field => (
                <input key={field} name={`${label}-${i}-${field}`} value={item[field] || ''} onChange={e => updateItem(i, field, e.target.value)} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} className="w-full border border-black/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-black/30" />
              ))}
            </div>
          </div>
        ))}
        <button onClick={addItem} className="w-full py-2 rounded-lg border border-dashed border-black/15 text-xs text-black/40 hover:text-black/60 hover:border-black/30">
          + {addLabel || `Add ${label.slice(0, -1)}`}
        </button>
      </div>
    </div>
  );
}
