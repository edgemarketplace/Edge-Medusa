'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { SiteData, GeneratedSection, InventoryItem, TemplateFamily } from '@/lib/types';
import { TEMPLATES } from '@/lib/templates';

interface BuildPageProps {
  params: Promise<{ siteId: string }>;
}

export default function BuildPage({ params }: BuildPageProps) {
  const [siteId, setSiteId] = useState<string>('');
  const [site, setSite] = useState<SiteData | null>(null);
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'inventory'>('preview');

  // Resolve params
  useEffect(() => {
    params.then(({ siteId }) => setSiteId(siteId));
  }, [params]);

  // Load site data
  useEffect(() => {
    if (!siteId) return;

    async function loadSite() {
      try {
        const res = await fetch(`/api/sites/${siteId}`);
        if (!res.ok) throw new Error('Site not found');
        const data = await res.json();
        setSite(data);
        if (data.template_data?.sections) {
          setSections(data.template_data.sections);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }

    async function loadInventory() {
      try {
        const res = await fetch(`/api/sites/${siteId}/inventory`);
        if (!res.ok) throw new Error('Failed to load inventory');
        const data = await res.json();
        setInventory(data);
      } catch (err) {
        console.warn('Failed to load inventory:', err);
      }
    }

    loadSite();
    loadInventory();
  }, [siteId]);

  // Auto-generate if no sections yet
  useEffect(() => {
    if (site && !sections.length && !generating) {
      handleGenerate();
    }
  }, [site, sections.length]);

  async function handleGenerate() {
    if (!siteId) return;
    setGenerating(true);
    setError('');

    try {
      const res = await fetch(`/api/sites/${siteId}/generate`, { method: 'POST' });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setSections(data.sections || []);

      // Reload site to get updated data
      const siteRes = await fetch(`/api/sites/${siteId}`);
      const siteData = await siteRes.json();
      setSite(siteData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLaunch() {
    if (!siteId) return;
    setLaunching(true);
    setError('');

    try {
      // Save inventory first
      await handleSaveInventory();

      const res = await fetch(`/api/sites/${siteId}/launch`, { method: 'POST' });
      if (!res.ok) throw new Error('Launch failed');
      const data = await res.json();

      // Redirect to live store
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLaunching(false);
    }
  }

  function addInventoryItem() {
    setInventory((prev) => [
      ...prev,
      { name: '', price: '', description: '', category: '' },
    ]);
  }

  function updateInventoryItem(index: number, field: keyof InventoryItem, value: string) {
    setInventory((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeInventoryItem(index: number) {
    setInventory((prev) => prev.filter((_, i) => i !== index));
  }

  function generateStarterItems() {
    if (!site) return;
    const template = TEMPLATES[site.business_type as TemplateFamily];
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

    setInventory((prev) => [...prev, ...starters]);
  }

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
          <Link href="/" className="font-bold text-sm">← Edge</Link>
          <span className="text-black/20">|</span>
          <span className="font-bold">{site.business_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5 disabled:opacity-50"
          >
            {generating ? 'Generating...' : '↻ Regenerate'}
          </button>
          <button
            onClick={handleLaunch}
            disabled={launching || !inventory.length}
            className="px-6 py-2 rounded-full bg-black text-white text-sm font-bold disabled:opacity-40 hover:scale-105 transition-transform"
          >
            {launching ? 'Launching...' : '🚀 Launch store'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-black/5 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex gap-6">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'preview' ? 'border-black text-black' : 'border-transparent text-black/40'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'inventory' ? 'border-black text-black' : 'border-transparent text-black/40'
            }`}
          >
            Inventory ({inventory.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'preview' && (
          <div className="bg-white border border-black/5 rounded-3xl overflow-hidden">
            {generating && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="h-10 w-10 border-2 border-black/10 border-t-black rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-serif italic text-xl">Building your store...</p>
                </div>
              </div>
            )}

            {!generating && sections.length > 0 && (
              <div>
                {sections.map((section, i) => (
                  <div key={i}>
                    {section.type === 'hero' && (
                      <div
                        className="px-12 py-20 text-center"
                        style={{ fontFamily: template.fontFamily }}
                      >
                        <h1 className="text-4xl md:text-6xl font-serif italic tracking-tight mb-6">
                          {section.heading}
                        </h1>
                        <p className="text-xl text-black/60 max-w-2xl mx-auto mb-8">
                          {section.subheading}
                        </p>
                        {section.ctaText && (
                          <button
                            className="px-8 py-4 rounded-full text-white font-bold"
                            style={{ backgroundColor: template.primaryColor }}
                          >
                            {section.ctaText}
                          </button>
                        )}
                      </div>
                    )}

                    {section.type === 'products' && (
                      <div className="px-12 py-16">
                        <h2 className="text-3xl font-serif italic text-center mb-12">
                          {section.title || 'Our Products'}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(section.items || []).map((item, j) => (
                            <div key={j} className="bg-[#F9F8F6] rounded-2xl p-6">
                              <div className="w-full h-40 bg-black/5 rounded-xl mb-4" />
                              <h3 className="font-bold text-lg">{item.name}</h3>
                              <p className="text-black/50 text-sm mt-1">{item.description}</p>
                              <p className="font-bold text-lg mt-3" style={{ color: template.primaryColor }}>
                                {item.price}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'about' && (
                      <div className="px-12 py-16 bg-[#F9F8F6]">
                        <div className="max-w-2xl mx-auto text-center">
                          <h2 className="text-3xl font-serif italic mb-6">{section.headline}</h2>
                          <p className="text-black/60 leading-relaxed text-lg">{section.body}</p>
                        </div>
                      </div>
                    )}

                    {section.type === 'contact' && (
                      <div className="px-12 py-16 text-center">
                        <h2 className="text-3xl font-serif italic mb-6">{section.title || 'Get in touch'}</h2>
                        {section.ctaText && (
                          <button
                            className="px-8 py-4 rounded-full text-white font-bold"
                            style={{ backgroundColor: template.primaryColor }}
                          >
                            {section.ctaText}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!generating && sections.length === 0 && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <p className="text-black/40 mb-4">No store generated yet</p>
                  <button
                    onClick={handleGenerate}
                    className="px-6 py-3 rounded-full bg-black text-white font-bold"
                  >
                    Generate my store
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Inventory</h2>
                <p className="text-black/50 text-sm mt-1">
                  Add your products or services. These will appear on your store.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={generateStarterItems}
                  className="px-4 py-2 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5"
                >
                  ✨ Generate starters
                </button>
                <button
                  onClick={addInventoryItem}
                  className="px-4 py-2 rounded-full bg-black text-white text-sm font-bold"
                >
                  + Add item
                </button>
              </div>
            </div>

            {inventory.length === 0 && (
              <div className="bg-white border border-dashed border-black/10 rounded-2xl p-12 text-center">
                <p className="text-black/40 mb-4">No items yet</p>
                <button
                  onClick={generateStarterItems}
                  className="px-6 py-3 rounded-full bg-black text-white font-bold"
                >
                  Generate starter items
                </button>
              </div>
            )}

            <div className="space-y-4">
              {inventory.map((item, index) => (
                <div key={index} className="bg-white border border-black/5 rounded-2xl p-5">
                  <div className="grid grid-cols-12 gap-3">
                    <input
                      value={item.name}
                      onChange={(e) => updateInventoryItem(index, 'name', e.target.value)}
                      placeholder="Name *"
                      className="col-span-12 md:col-span-4 border border-black/10 rounded-xl px-4 py-3"
                    />
                    <input
                      value={item.price}
                      onChange={(e) => updateInventoryItem(index, 'price', e.target.value)}
                      placeholder="Price"
                      className="col-span-6 md:col-span-2 border border-black/10 rounded-xl px-4 py-3"
                    />
                    <input
                      value={item.category}
                      onChange={(e) => updateInventoryItem(index, 'category', e.target.value)}
                      placeholder="Category"
                      className="col-span-6 md:col-span-2 border border-black/10 rounded-xl px-4 py-3"
                    />
                    <input
                      value={item.description}
                      onChange={(e) => updateInventoryItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="col-span-10 md:col-span-3 border border-black/10 rounded-xl px-4 py-3"
                    />
                    <button
                      onClick={() => removeInventoryItem(index)}
                      className="col-span-2 md:col-span-1 flex items-center justify-center rounded-xl border border-black/10 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {inventory.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleSaveInventory}
                  disabled={saving}
                  className="px-6 py-3 rounded-full border border-black/10 font-bold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save inventory'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
