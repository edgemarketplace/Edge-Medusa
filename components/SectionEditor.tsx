'use client';

import { useState } from 'react';
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

const UNSPLASH_COLLECTIONS: Record<string, string[]> = {
  retail: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200',
    'https://images.unsplash.com/photo-1560472355-536de3962603?w=1200',
  ],
  service: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200',
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200',
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200',
  ],
  artisan: [
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200',
    'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200',
  ],
  event: [
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200',
  ],
};

export default function SectionEditor({ draft, onChange, siteId, businessType }: SectionEditorProps) {
  const def = SECTION_LIBRARY[draft.type];
  const data = draft.data;
  const [uploading, setUploading] = useState(false);
  const [showUnsplash, setShowUnsplash] = useState(false);

  const unsplashKey = businessType === 'retail-core' ? 'retail' : businessType === 'service-pro' ? 'service' : businessType === 'food-catering' ? 'food' : businessType === 'artisan-market' ? 'artisan' : 'event';
  const unsplashImages = UNSPLASH_COLLECTIONS[unsplashKey] || UNSPLASH_COLLECTIONS.retail;

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/sites/${siteId}/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const result = await res.json();
    return result.url;
  }

  async function handleImage(field: string) {
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

  function ImageField({ label, field, currentUrl }: { label: string; field: string; currentUrl?: string }) {
    const fieldId = `img-${field}-${draft.id}`;
    const urlInputId = `url-${field}-${draft.id}`;
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
            <button onClick={() => handleImage(field)} disabled={uploading} className="flex items-center justify-center w-20 h-20 border border-dashed border-black/15 rounded-lg hover:border-black/30 text-black/25" id={fieldId} aria-label={`Upload ${label}`}>
              {uploading ? '...' : '+'}
            </button>
            <button onClick={() => setShowUnsplash(!showUnsplash)} className="px-3 h-20 border border-black/10 rounded-lg text-xs text-black/50 hover:bg-black/5" aria-label="Browse stock images">
              🖼 Browse
            </button>
          </div>
        )}
        <div className="flex gap-2 mb-2">
          <input id={urlInputId} name={urlInputId} type="url" placeholder="Or paste image URL..." className="flex-1 border border-black/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-black/30" onKeyDown={(e) => { if (e.key === 'Enter') { onChange(field, (e.target as HTMLInputElement).value); } }} />
          <button onClick={() => { const el = document.getElementById(urlInputId) as HTMLInputElement; if (el?.value) onChange(field, el.value); }} className="px-2 py-1 rounded-lg border border-black/10 text-xs font-bold hover:bg-black/5">Set</button>
        </div>
        {showUnsplash && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {unsplashImages.map((url, idx) => (
              <button key={idx} onClick={() => { onChange(field, url); setShowUnsplash(false); }} className="relative group">
                <img src={url} alt={`Stock image ${idx + 1}`} className="w-full h-16 object-cover rounded-lg border border-black/10 hover:border-black/30" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors" />
              </button>
            ))}
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
