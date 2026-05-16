'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { SiteData, GeneratedSection, InventoryItem, TemplateFamily, PageData, SectionType, PublishValidation } from '@/lib/types';
import { TEMPLATES } from '@/lib/templates';
import { SECTION_LIBRARY, SECTION_CATEGORIES, TEMPLATE_MANIFESTS, validatePublish, PAGE_TEMPLATES } from '@/lib/section-library';

interface BuildPageProps {
  params: Promise<{ siteId: string }>;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Unsplash quick-load images by category
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

export default function BuildPage({ params }: BuildPageProps) {
  const [siteId, setSiteId] = useState<string>('');
  const [site, setSite] = useState<SiteData | null>(null);
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [pages, setPages] = useState<PageData[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'inventory' | 'pages'>('preview');
  const [stripeConnected, setStripeConnected] = useState(!!site?.stripe_account_id);

  // Section editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<GeneratedSection | null>(null);
  const [savingSection, setSavingSection] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Pages state
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editPageDraft, setEditPageDraft] = useState<Partial<PageData> | null>(null);
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');

  // Publish validation
  const [publishValidation, setPublishValidation] = useState<PublishValidation | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => { setStripeConnected(!!site?.stripe_account_id); }, [site]);
  useEffect(() => { params.then(({ siteId }) => setSiteId(siteId)); }, [params]);

  useEffect(() => {
    if (!siteId) return;
    loadSite();
    loadInventory();
    loadPages();
  }, [siteId]);

  async function loadSite() {
    try {
      const res = await fetch(`/api/sites/${siteId}`);
      if (!res.ok) throw new Error('Site not found');
      const data = await res.json();
      setSite(data);
      if (data.template_data?.sections) {
        const migrated = migrateSections(data.template_data.sections);
        setSections(migrated);
      }
    } catch (err: any) { setError(err.message); }
  }

  async function loadInventory() {
    try {
      const res = await fetch(`/api/sites/${siteId}/inventory`);
      if (!res.ok) throw new Error('Failed to load inventory');
      const data = await res.json();
      setInventory(data);
    } catch (err) { console.warn('Failed to load inventory:', err); }
  }

  async function loadPages() {
    try {
      const res = await fetch(`/api/sites/${siteId}/pages`);
      if (!res.ok) {
        console.warn('Pages API not available, table may not exist yet');
        setPages([]);
        return;
      }
      const data = await res.json();
      setPages(data);
    } catch (err) {
      console.warn('Failed to load pages:', err);
      setPages([]);
    }
  }

  function migrateSections(oldSections: any[]): GeneratedSection[] {
    return oldSections.map(s => {
      if (s.id && s.data) return s;
      const type = mapOldType(s.type);
      const def = SECTION_LIBRARY[type];
      return {
        id: genId(),
        type,
        data: def ? { ...def.defaultData, ...extractLegacyData(s) } : {},
      };
    });
  }

  function mapOldType(oldType: string): SectionType {
    const map: Record<string, SectionType> = {
      'hero': 'hero-visual', 'products': 'product-grid', 'about': 'brand-story', 'contact': 'footer-service',
    };
    return map[oldType] || 'hero-visual';
  }

  function extractLegacyData(s: any): Record<string, any> {
    if (s.type === 'hero') return { heading: s.heading, subheading: s.subheading, ctaText: s.ctaText, imageUrl: s.hero_image_url };
    if (s.type === 'products') return { title: s.title, items: s.items };
    if (s.type === 'about') return { headline: s.headline, body: s.body };
    if (s.type === 'contact') return { title: s.title, ctaText: s.ctaText };
    return {};
  }

  useEffect(() => {
    if (site && !sections.length && !generating) handleGenerate();
  }, [site, sections.length]);

  async function handleGenerate() {
    if (!siteId) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/sites/${siteId}/generate`, { method: 'POST' });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      const migrated = migrateSections(data.sections || []);
      setSections(migrated);
      const siteRes = await fetch(`/api/sites/${siteId}`);
      const siteData = await siteRes.json();
      setSite(siteData);
    } catch (err: any) { setError(err.message); }
    finally { setGenerating(false); }
  }

  async function handleSaveSections(updated: GeneratedSection[]) {
    if (!siteId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_data: { sections: updated } }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSections(updated);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleSaveInventory() {
    if (!siteId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: inventory }),
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleLaunch() {
    if (!siteId || !site) return;
    const manifest = TEMPLATE_MANIFESTS[site.business_type as TemplateFamily];
    const validation = validatePublish(sections, manifest);
    setPublishValidation(validation);
    setShowValidation(true);
    if (!validation.valid) return;
    setLaunching(true);
    setError('');
    try {
      await handleSaveInventory();
      const res = await fetch(`/api/sites/${siteId}/launch`, { method: 'POST' });
      if (!res.ok) throw new Error('Launch failed');
      const data = await res.json();
      window.location.href = `/success?subdomain=${data.subdomain}&url=${encodeURIComponent(data.url)}&siteId=${data.siteId || siteId}`;
    } catch (err: any) { setError(err.message); }
    finally { setLaunching(false); }
  }

  // --- Section CRUD ---

  function addSection(type: SectionType, afterIndex: number) {
    const def = SECTION_LIBRARY[type];
    if (!def) return;
    const newSection: GeneratedSection = { id: genId(), type, data: { ...def.defaultData } };
    const updated = [...sections];
    updated.splice(afterIndex + 1, 0, newSection);
    setSections(updated);
    handleSaveSections(updated);
    setShowAddMenu(null);
  }

  function removeSection(id: string) {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    handleSaveSections(updated);
    if (editingId === id) { setEditingId(null); setEditDraft(null); }
  }

  function duplicateSection(index: number) {
    const original = sections[index];
    const dup: GeneratedSection = { id: genId(), type: original.type, data: { ...original.data } };
    const updated = [...sections];
    updated.splice(index + 1, 0, dup);
    setSections(updated);
    handleSaveSections(updated);
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setSections(updated);
    handleSaveSections(updated);
  }

  function startEditing(id: string) {
    const section = sections.find(s => s.id === id);
    if (!section) return;
    setEditingId(id);
    setEditDraft({ ...section, data: { ...section.data } });
  }

  function cancelEditing() { setEditingId(null); setEditDraft(null); }

  async function saveEditing() {
    if (!editingId || !editDraft) return;
    setSavingSection(true);
    const updated = sections.map(s => s.id === editingId ? editDraft : s);
    await handleSaveSections(updated);
    setEditingId(null);
    setEditDraft(null);
    setSavingSection(false);
  }

  function updateDraftData(field: string, value: any) {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, data: { ...editDraft.data, [field]: value } });
  }

  // --- Image upload ---

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/sites/${siteId}/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  }

  async function handleInventoryImageUpload(index: number, file: File) {
    try {
      const url = await uploadImage(file);
      updateInventoryItem(index, 'image_url', url);
    } catch (err: any) { setError(err.message); }
  }

  // --- Inventory ---

  function addInventoryItem() {
    setInventory(prev => [...prev, { name: '', price: '', description: '', category: '' }]);
  }

  function updateInventoryItem(index: number, field: keyof InventoryItem, value: string) {
    setInventory(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function removeInventoryItem(index: number) {
    setInventory(prev => prev.filter((_, i) => i !== index));
  }

  function generateStarterItems() {
    if (!site) return;
    const starters: InventoryItem[] = [];
    if (site.business_type === 'service-pro') {
      starters.push(
        { name: 'Initial Consultation', price: '150', description: 'Site visit and needs assessment', category: 'Consulting' },
        { name: 'Standard Package', price: '500', description: 'Complete service delivery', category: 'Packages' },
        { name: 'Premium Package', price: '1200', description: 'White-glove full service', category: 'Packages' },
      );
    } else if (site.business_type === 'food-catering') {
      starters.push(
        { name: 'Starter Menu', price: '25', description: 'Perfect for small gatherings', category: 'Menus' },
        { name: 'Event Package', price: '45', description: 'Full catering per person', category: 'Events' },
        { name: 'Premium Feast', price: '85', description: 'Luxury dining experience', category: 'Premium' },
      );
    } else {
      starters.push(
        { name: 'Best Seller', price: '45', description: 'Our most popular item', category: 'Featured' },
        { name: 'New Arrival', price: '65', description: 'Just added to the collection', category: 'New' },
        { name: 'Premium Pick', price: '95', description: 'Top-tier quality', category: 'Premium' },
      );
    }
    setInventory(prev => [...prev, ...starters]);
  }

  // --- Pages ---

  async function handleCreatePage() {
    const slug = newPageSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const title = newPageTitle.trim();
    if (!slug || !title) return;
    try {
      // Check if we have a matching template
      const templates = PAGE_TEMPLATES[site?.business_type as TemplateFamily] || [];
      const matchedTemplate = templates.find(t => t.slug === slug);
      
      let sections: GeneratedSection[];
      if (matchedTemplate) {
        // Use template sections
        sections = matchedTemplate.sections.map(s => ({
          id: genId(),
          type: s.type,
          data: { ...s.data, logoText: s.data.logoText || site?.business_name || '' },
        }));
      } else {
        // Default blank page with hero
        sections = [{ id: genId(), type: 'hero-visual' as SectionType, data: { heading: title, subheading: 'Add your content here' } }];
      }

      const res = await fetch(`/api/sites/${siteId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title, sections }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create page');
      }
      setNewPageSlug(''); setNewPageTitle(''); setShowNewPage(false);
      await loadPages();
    } catch (err: any) { setError(err.message); }
  }

  async function handleDeletePage(pageId: string) {
    if (!confirm('Delete this page?')) return;
    try {
      const res = await fetch(`/api/sites/${siteId}/pages/${pageId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete page');
      await loadPages();
    } catch (err: any) { setError(err.message); }
  }

  function startPageEdit(page: PageData) { setEditingPageId(page.id); setEditPageDraft({ title: page.title, slug: page.slug }); }
  function cancelPageEdit() { setEditingPageId(null); setEditPageDraft(null); }

  async function savePageEdit(pageId: string) {
    if (!editPageDraft) return;
    try {
      const res = await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPageDraft),
      });
      if (!res.ok) throw new Error('Failed to save page');
      setEditingPageId(null); setEditPageDraft(null);
      await loadPages();
    } catch (err: any) { setError(err.message); }
  }

  // --- Render ---

  if (error && !site) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/onboarding" className="text-black underline">Start over</Link>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  const template = TEMPLATES[site.business_type as TemplateFamily];

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/account" className="text-sm text-black/60 hover:text-black font-medium">
            ← My account
          </Link>
          <span className="text-black/20">|</span>
          <span className="font-bold">{site.business_name}</span>
          <span className="text-xs text-black/30 bg-black/5 px-2 py-0.5 rounded-full">{template.label}</span>
          {saving && <span className="text-xs text-black/40 ml-2">Saving...</span>}
        </div>
        <div className="flex items-center gap-3">
          {!stripeConnected && (
            <a href={`/api/stripe/connect?siteId=${siteId}`} className="px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100">
              Connect Stripe
            </a>
          )}
          <button
            onClick={() => window.open(`/store/${site?.subdomain || siteId}?preview=true`, '_blank')}
            className="px-6 py-2 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5 flex items-center gap-2"
          >
            👁 Preview Shop
          </button>
          <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5 disabled:opacity-50">
            {generating ? 'Generating...' : '↻ Regenerate'}
          </button>
          <button onClick={handleLaunch} disabled={launching || !inventory.length} className="px-6 py-2 rounded-full bg-black text-white text-sm font-bold disabled:opacity-40 hover:scale-105 transition-transform">
            {launching ? 'Launching...' : '🚀 Launch store'}
          </button>
        </div>
      </div>

      {/* Publish validation modal */}
      {showValidation && publishValidation && !publishValidation.valid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowValidation(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Cannot launch yet</h2>
            <div className="space-y-2 mb-6">
              {publishValidation.errors.map((err, i) => (
                <p key={i} className="text-sm text-red-600 flex items-start gap-2"><span className="mt-0.5">✕</span> {err}</p>
              ))}
              {publishValidation.warnings.map((warn, i) => (
                <p key={i} className="text-sm text-amber-600 flex items-start gap-2"><span className="mt-0.5">⚠</span> {warn}</p>
              ))}
            </div>
            <button onClick={() => setShowValidation(false)} className="w-full px-4 py-3 rounded-full bg-black text-white font-bold">Got it</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          {(['preview', 'inventory', 'pages'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-bold border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-black text-black' : 'border-transparent text-black/40'}`}>
              {tab === 'preview' ? 'Edit page' : tab} {tab === 'inventory' ? `(${inventory.length})` : tab === 'pages' ? `(${pages.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'preview' && (
          <div className="flex">
            {/* Left rail — Section library */}
            <div className="w-64 shrink-0 border-r border-black/5 bg-white min-h-[calc(100vh-120px)] overflow-y-auto sticky top-[120px]">
              <div className="p-4">
                <h3 className="text-xs font-bold text-black/40 uppercase tracking-wider mb-3">Add sections</h3>
                <div className="space-y-1">
                  {SECTION_CATEGORIES.map(cat => (
                    <div key={cat.category}>
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 text-sm font-medium text-left"
                        aria-expanded={expandedCategory === cat.category}
                      >
                        <span>{cat.icon}</span>
                        <span className="flex-1">{cat.label}</span>
                        <span className="text-black/30 text-xs">{expandedCategory === cat.category ? '−' : '+'}</span>
                      </button>
                      {expandedCategory === cat.category && (
                        <div className="ml-4 mt-1 space-y-0.5">
                          {cat.types.map(type => {
                            const def = SECTION_LIBRARY[type];
                            return (
                              <button
                                key={type}
                                onClick={() => { addSection(type, sections.length - 1); setExpandedCategory(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-black/5 text-xs text-left text-black/70"
                              >
                                <span>{def.icon}</span>
                                <span>{def.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 p-8">
              {generating && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="h-10 w-10 border-2 border-black/10 border-t-black rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-serif italic text-xl">Building your store...</p>
                  </div>
                </div>
              )}

              {!generating && sections.length === 0 && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <p className="text-black/40 mb-4">No store generated yet</p>
                    <button onClick={handleGenerate} className="px-6 py-3 rounded-full bg-black text-white font-bold">Generate my store</button>
                  </div>
                </div>
              )}

              {!generating && sections.length > 0 && (
                <div className="space-y-3">
                  {sections.map((section, i) => {
                    const def = SECTION_LIBRARY[section.type];
                    const isEditing = editingId === section.id;
                    return (
                      <div key={section.id}>
                        <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${isEditing ? 'border-black/30 shadow-lg' : 'border-black/5 hover:border-black/15'}`}>
                          {/* Toolbar */}
                          <div className="flex items-center justify-between px-3 py-1.5 border-b border-black/5 bg-[#FAFAF9]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-black/30 uppercase tracking-wider">{def?.icon} {def?.label || section.type}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {isEditing ? (
                                <>
                                  <button onClick={saveEditing} disabled={savingSection} className="px-2.5 py-1 rounded-full bg-black text-white text-xs font-bold disabled:opacity-50">
                                    {savingSection ? '...' : '✓ Save'}
                                  </button>
                                  <button onClick={cancelEditing} className="px-2.5 py-1 rounded-full border border-black/10 text-xs font-bold hover:bg-black/5">Cancel</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-black/5 text-black/40 disabled:opacity-30 text-xs" aria-label="Move up">↑</button>
                                  <button onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} className="p-1 rounded hover:bg-black/5 text-black/40 disabled:opacity-30 text-xs" aria-label="Move down">↓</button>
                                  <button onClick={() => duplicateSection(i)} className="p-1 rounded hover:bg-black/5 text-black/40 text-xs" title="Duplicate" aria-label="Duplicate">⧉</button>
                                  <button onClick={() => startEditing(section.id)} className="px-2.5 py-1 rounded-full border border-black/10 text-xs font-bold hover:bg-black/5">Edit</button>
                                  <button onClick={() => removeSection(section.id)} className="p-1 rounded hover:bg-red-50 text-black/40 hover:text-red-600 text-xs" aria-label="Remove section">✕</button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          {isEditing && editDraft ? (
                            <SectionEditor draft={editDraft} onChange={updateDraftData} onImageUpload={uploadImage} siteId={siteId} businessType={site.business_type} />
                          ) : (
                            <SectionPreview section={section} template={template} inventory={inventory} />
                          )}
                        </div>

                        {/* Add between */}
                        <div className="flex justify-center py-1 relative">
                          <button onClick={() => setShowAddMenu(showAddMenu === i ? null : i)} className="px-3 py-1 rounded-full border border-dashed border-black/15 text-[10px] text-black/30 hover:text-black/60 hover:border-black/30">
                            + Add section
                          </button>
                          {showAddMenu === i && (
                            <div className="absolute top-full mt-1 bg-white border border-black/10 rounded-xl shadow-xl p-2 z-10 max-h-64 overflow-y-auto">
                              {SECTION_CATEGORIES.map(cat => (
                                <div key={cat.category}>
                                  <p className="text-[10px] font-bold text-black/30 uppercase tracking-wider px-2 py-1">{cat.label}</p>
                                  {cat.types.map(type => {
                                    const d = SECTION_LIBRARY[type];
                                    return (
                                      <button key={type} onClick={() => addSection(type, i)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-black/5 text-xs flex items-center gap-1.5">
                                        <span>{d.icon}</span> {d.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="p-8">
            <InventoryPanel inventory={inventory} onAdd={addInventoryItem} onUpdate={updateInventoryItem} onRemove={removeInventoryItem} onGenerateStarters={generateStarterItems} onSave={handleSaveInventory} onImageUpload={handleInventoryImageUpload} saving={saving} />
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="p-8">
            <PagesPanel pages={pages} site={site} showNewPage={showNewPage} newPageTitle={newPageTitle} newPageSlug={newPageSlug} editingPageId={editingPageId} editPageDraft={editPageDraft} onShowNewPage={() => setShowNewPage(true)} onNewPageTitleChange={setNewPageTitle} onNewPageSlugChange={setNewPageSlug} onCreatePage={handleCreatePage} onCancelNewPage={() => { setShowNewPage(false); setNewPageTitle(''); setNewPageSlug(''); }} onStartEdit={startPageEdit} onCancelEdit={cancelPageEdit} onSaveEdit={savePageEdit} onDelete={handleDeletePage} onDraftChange={setEditPageDraft} />
          </div>
        )}
      </div>
    </div>
  );
}

// --- Section Editor ---

function SectionEditor({ draft, onChange, onImageUpload, siteId, businessType }: {
  draft: GeneratedSection; onChange: (field: string, value: any) => void;
  onImageUpload: (file: File) => Promise<string>; siteId: string; businessType: TemplateFamily;
}) {
  const def = SECTION_LIBRARY[draft.type];
  const data = draft.data;
  const [uploading, setUploading] = useState(false);
  const [showUnsplash, setShowUnsplash] = useState(false);

  // Get Unsplash images based on business type
  const unsplashKey = businessType === 'retail-core' ? 'retail' : businessType === 'service-pro' ? 'service' : businessType === 'food-catering' ? 'food' : businessType === 'artisan-market' ? 'artisan' : 'event';
  const unsplashImages = UNSPLASH_COLLECTIONS[unsplashKey] || UNSPLASH_COLLECTIONS.retail;

  async function handleImage(field: string) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try { const url = await onImageUpload(file); onChange(field, url); }
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
        {/* URL input for quick paste */}
        <div className="flex gap-2 mb-2">
          <input
            id={urlInputId}
            name={urlInputId}
            type="url"
            placeholder="Or paste image URL..."
            className="flex-1 border border-black/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-black/30"
            onKeyDown={(e) => { if (e.key === 'Enter') { onChange(field, (e.target as HTMLInputElement).value); } }}
          />
          <button onClick={() => { const el = document.getElementById(urlInputId) as HTMLInputElement; if (el?.value) onChange(field, el.value); }} className="px-2 py-1 rounded-lg border border-black/10 text-xs font-bold hover:bg-black/5">Set</button>
        </div>
        {/* Unsplash quick-pick */}
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
      {(data.overlayOpacity !== undefined) && (
        <div>
          <label htmlFor={`overlayOpacity-${draft.id}`} className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-wider">Overlay opacity</label>
          <input id={`overlayOpacity-${draft.id}`} name={`overlayOpacity-${draft.id}`} type="range" min={0} max={80} value={data.overlayOpacity * 100 || 40} onChange={e => onChange('overlayOpacity', parseInt(e.target.value) / 100)} className="w-full" />
        </div>
      )}

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
      {(data.columns !== undefined) && <ArrayEditor items={data.columns} onChange={items => onChange('columns', items)} itemFields={['title', 'links']} label="Footer Columns" addLabel="Add column" />}

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
      {(data.position !== undefined) && (
        <div>
          <label htmlFor={`position-${draft.id}`} className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-wider">Position</label>
          <select id={`position-${draft.id}`} name={`position-${draft.id}`} value={data.position} onChange={e => onChange('position', e.target.value)} className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm">
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      )}
      {(data.backgroundColor !== undefined) && (
        <div>
          <label htmlFor={`bgColor-${draft.id}`} className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-wider">Background color</label>
          <input id={`bgColor-${draft.id}`} name={`bgColor-${draft.id}`} type="color" value={data.backgroundColor} onChange={e => onChange('backgroundColor', e.target.value)} className="w-full h-10 border border-black/10 rounded-xl cursor-pointer" />
        </div>
      )}
      {(data.textColor !== undefined) && (
        <div>
          <label htmlFor={`textColor-${draft.id}`} className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-wider">Text color</label>
          <input id={`textColor-${draft.id}`} name={`textColor-${draft.id}`} type="color" value={data.textColor} onChange={e => onChange('textColor', e.target.value)} className="w-full h-10 border border-black/10 rounded-xl cursor-pointer" />
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
      {(data.newsletter !== undefined && typeof data.newsletter === 'boolean') && (
        <div className="flex items-center gap-2">
          <input id={`newsletter-${draft.id}`} name={`newsletter-${draft.id}`} type="checkbox" checked={data.newsletter} onChange={e => onChange('newsletter', e.target.checked)} className="w-4 h-4" />
          <label htmlFor={`newsletter-${draft.id}`} className="text-xs font-bold text-black/50">Show newsletter signup</label>
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

// --- Section Preview ---

function SectionPreview({ section, template, inventory }: { section: GeneratedSection; template: any; inventory: InventoryItem[] }) {
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
    const items = inventory.slice(0, data.columns || 3);
    return (
      <div className="px-6 py-8">
        <h3 className="text-lg font-serif italic text-center mb-6">{data.title || 'Products'}</h3>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(data.columns || 3, 3)}, 1fr)` }}>
          {items.length > 0 ? items.map((item, i) => (
            <div key={i} className="bg-[#F9F8F6] rounded-xl p-4">
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
    const items = inventory.slice(0, 4);
    return (
      <div className="px-6 py-8">
        <h3 className="text-lg font-serif italic text-center mb-6">{data.title || 'Services'}</h3>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, i) => (
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

// --- Reusable Components ---

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

// --- Inventory Panel ---

function InventoryPanel({ inventory, onAdd, onUpdate, onRemove, onGenerateStarters, onSave, onImageUpload, saving }: {
  inventory: InventoryItem[]; onAdd: () => void; onUpdate: (i: number, f: keyof InventoryItem, v: string) => void;
  onRemove: (i: number) => void; onGenerateStarters: () => void; onSave: () => void; onImageUpload: (i: number, f: File) => void; saving: boolean;
}) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-black/50 text-sm mt-1">Add your products or services. These appear on your store.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onGenerateStarters} className="px-4 py-2 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5">✨ Generate starters</button>
          <button onClick={onAdd} className="px-4 py-2 rounded-full bg-black text-white text-sm font-bold">+ Add item</button>
        </div>
      </div>
      {inventory.length === 0 && (
        <div className="bg-white border border-dashed border-black/10 rounded-2xl p-12 text-center">
          <p className="text-black/40 mb-4">No items yet</p>
          <button onClick={onGenerateStarters} className="px-6 py-3 rounded-full bg-black text-white font-bold">Generate starter items</button>
        </div>
      )}
      <div className="space-y-3">
        {inventory.map((item, index) => {
          const imgId = `inv-img-${index}`;
          return (
            <div key={index} className="bg-white border border-black/5 rounded-2xl p-4">
              <div className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-3 md:col-span-1">
                  {item.image_url ? (
                    <div className="relative group">
                      <img src={item.image_url} alt={item.name} className="w-full aspect-square object-cover rounded-lg" />
                      <button onClick={() => onUpdate(index, 'image_url', '')} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100" aria-label="Remove image">✕</button>
                    </div>
                  ) : (
                    <label htmlFor={imgId} className="flex items-center justify-center w-full aspect-square border border-dashed border-black/15 rounded-lg cursor-pointer hover:border-black/30">
                      <input id={imgId} name={imgId} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onImageUpload(index, f); }} />
                      <span className="text-black/25 text-lg">+</span>
                    </label>
                  )}
                </div>
                <label className="col-span-9 md:col-span-3">
                  <span className="sr-only">Name</span>
                  <input name={`inv-name-${index}`} value={item.name} onChange={e => onUpdate(index, 'name', e.target.value)} placeholder="Name *" className="w-full border border-black/10 rounded-xl px-3 py-2.5 text-sm" />
                </label>
                <label className="col-span-6 md:col-span-2">
                  <span className="sr-only">Price</span>
                  <input name={`inv-price-${index}`} value={item.price} onChange={e => onUpdate(index, 'price', e.target.value)} placeholder="Price" className="w-full border border-black/10 rounded-xl px-3 py-2.5 text-sm" />
                </label>
                <label className="col-span-6 md:col-span-2">
                  <span className="sr-only">Category</span>
                  <input name={`inv-cat-${index}`} value={item.category} onChange={e => onUpdate(index, 'category', e.target.value)} placeholder="Category" className="w-full border border-black/10 rounded-xl px-3 py-2.5 text-sm" />
                </label>
                <label className="col-span-10 md:col-span-3">
                  <span className="sr-only">Description</span>
                  <input name={`inv-desc-${index}`} value={item.description} onChange={e => onUpdate(index, 'description', e.target.value)} placeholder="Description" className="w-full border border-black/10 rounded-xl px-3 py-2.5 text-sm" />
                </label>
                <button onClick={() => onRemove(index)} className="col-span-2 md:col-span-1 flex items-center justify-center rounded-xl border border-black/10 hover:bg-red-50 py-2.5 text-xs" aria-label="Remove item">✕</button>
              </div>
            </div>
          );
        })}
      </div>
      {inventory.length > 0 && (
        <div className="flex justify-end">
          <button onClick={onSave} disabled={saving} className="px-6 py-3 rounded-full border border-black/10 font-bold disabled:opacity-50">{saving ? 'Saving...' : 'Save inventory'}</button>
        </div>
      )}
    </div>
  );
}

// --- Pages Panel ---

function PagesPanel({ pages, site, showNewPage, newPageTitle, newPageSlug, editingPageId, editPageDraft, onShowNewPage, onNewPageTitleChange, onNewPageSlugChange, onCreatePage, onCancelNewPage, onStartEdit, onCancelEdit, onSaveEdit, onDelete, onDraftChange }: {
  pages: PageData[]; site: SiteData | null; showNewPage: boolean; newPageTitle: string; newPageSlug: string;
  editingPageId: string | null; editPageDraft: Partial<PageData> | null;
  onShowNewPage: () => void; onNewPageTitleChange: (v: string) => void; onNewPageSlugChange: (v: string) => void;
  onCreatePage: () => void; onCancelNewPage: () => void; onStartEdit: (p: PageData) => void; onCancelEdit: () => void;
  onSaveEdit: (id: string) => void; onDelete: (id: string) => void; onDraftChange: (d: Partial<PageData> | null) => void;
}) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pages</h2>
          <p className="text-black/50 text-sm mt-1">Add additional pages to your store.</p>
        </div>
        <button onClick={onShowNewPage} className="px-4 py-2 rounded-full bg-black text-white text-sm font-bold">+ Add page</button>
      </div>
      {showNewPage && (
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <h3 className="font-bold mb-3">Create new page</h3>
          {/* Template picker */}
          <div className="mb-4">
            <p className="text-xs font-bold text-black/50 mb-2 uppercase tracking-wider">Choose a template</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAGE_TEMPLATES[site?.business_type as TemplateFamily]?.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onNewPageTitleChange(tmpl.title);
                    onNewPageSlugChange(tmpl.slug);
                  }}
                  className={`text-left rounded-xl border p-3 transition-all ${
                    newPageSlug === tmpl.slug ? 'border-black bg-black/5' : 'border-black/10 hover:border-black/20'
                  }`}
                >
                  <p className="font-bold text-sm">{tmpl.title}</p>
                  <p className="text-xs text-black/50 mt-0.5">{tmpl.description}</p>
                  <p className="text-[10px] text-black/30 mt-1">{tmpl.sections.length} sections · /{tmpl.slug}</p>
                </button>
              ))}
              <button
                onClick={() => { onNewPageTitleChange(''); onNewPageSlugChange(''); }}
                className={`text-left rounded-xl border p-3 transition-all ${
                  !newPageSlug ? 'border-black bg-black/5' : 'border-black/10 hover:border-black/20'
                }`}
              >
                <p className="font-bold text-sm">Blank page</p>
                <p className="text-xs text-black/50 mt-0.5">Start from scratch</p>
              </button>
            </div>
          </div>
          {/* Custom title/slug */}
          <div className="grid grid-cols-12 gap-3">
            <label className="col-span-12 md:col-span-5">
              <span className="sr-only">Page title</span>
              <input id="new-page-title" name="newPageTitle" value={newPageTitle} onChange={e => onNewPageTitleChange(e.target.value)} placeholder="Page title" className="w-full border border-black/10 rounded-xl px-3 py-2.5 text-sm" />
            </label>
            <label className="col-span-8 md:col-span-4">
              <span className="sr-only">URL slug</span>
              <input id="new-page-slug" name="newPageSlug" value={newPageSlug} onChange={e => onNewPageSlugChange(e.target.value)} placeholder="URL slug" className="w-full border border-black/10 rounded-xl px-3 py-2.5 text-sm" />
            </label>
            <div className="col-span-4 md:col-span-3 flex gap-2">
              <button onClick={onCreatePage} disabled={!newPageTitle.trim() || !newPageSlug.trim()} className="flex-1 px-4 py-2 rounded-full bg-black text-white text-sm font-bold disabled:opacity-40">Create</button>
              <button onClick={onCancelNewPage} className="px-4 py-2 rounded-full border border-black/10 text-sm font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {pages.length === 0 && !showNewPage && (
        <div className="bg-white border border-dashed border-black/10 rounded-2xl p-12 text-center">
          <p className="text-black/40 mb-4">No additional pages yet</p>
          <button onClick={onShowNewPage} className="px-6 py-3 rounded-full bg-black text-white font-bold">Create your first page</button>
        </div>
      )}
      <div className="space-y-3">
        {pages.map(page => (
          <div key={page.id} className="bg-white border border-black/5 rounded-2xl p-4">
            {editingPageId === page.id ? (
              <div className="grid grid-cols-12 gap-3">
                <label className="col-span-12 md:col-span-5">
                  <span className="sr-only">Page title</span>
                  <input name={`edit-title-${page.id}`} value={editPageDraft?.title || ''} onChange={e => onDraftChange({ ...editPageDraft, title: e.target.value })} placeholder="Page title" className="w-full border border-black/10 rounded-xl px-3 py-2.5 text-sm" />
                </label>
                <label className="col-span-8 md:col-span-4">
                  <span className="sr-only">URL slug</span>
                  <input name={`edit-slug-${page.id}`} value={editPageDraft?.slug || ''} onChange={e => onDraftChange({ ...editPageDraft, slug: e.target.value })} placeholder="URL slug" className="w-full border border-black/10 rounded-xl px-3 py-2.5 text-sm" />
                </label>
                <div className="col-span-4 md:col-span-3 flex gap-2">
                  <button onClick={() => onSaveEdit(page.id)} className="flex-1 px-4 py-2 rounded-full bg-black text-white text-sm font-bold">Save</button>
                  <button onClick={onCancelEdit} className="px-4 py-2 rounded-full border border-black/10 text-sm font-bold">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{page.title}</h3>
                  <p className="text-xs text-black/40">/{page.slug} · {page.sections?.length || 0} sections</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/build/${site?.id}/page/${page.id}`} className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-bold hover:bg-black/80">
                    Edit sections
                  </Link>
                  <a href={`https://${site?.subdomain}.edgemarketplacehub.com/${page.slug}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full border border-black/10 text-xs font-bold hover:bg-black/5">Visit</a>
                  <button onClick={() => onStartEdit(page)} className="px-3 py-1.5 rounded-full border border-black/10 text-xs font-bold hover:bg-black/5">Rename</button>
                  <button onClick={() => onDelete(page.id)} className="px-3 py-1.5 rounded-full border border-black/10 text-xs font-bold hover:bg-red-50 text-black/40 hover:text-red-600">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
