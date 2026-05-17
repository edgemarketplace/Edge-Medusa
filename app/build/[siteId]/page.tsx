'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { SiteData, GeneratedSection, InventoryItem, TemplateFamily, PageData, SectionType, PublishValidation } from '@/lib/types';
import { TEMPLATES } from '@/lib/templates';
import { SECTION_LIBRARY, SECTION_CATEGORIES, TEMPLATE_MANIFESTS, validatePublish, PAGE_TEMPLATES } from '@/lib/section-library';
import InPlaceEditor from './InPlaceEditor';

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
  const [activeTab, setActiveTab] = useState<'onboarding' | 'design' | 'pages' | 'inventory' | 'settings' | 'orders' | 'clients' | 'mailbox' | 'marketing'>('onboarding');
  const [settingsName, setSettingsName] = useState('');
  const [settingsTagline, setSettingsTagline] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(!!site?.stripe_account_id);
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

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
      // Load pages from template_data (new multi-page format)
      if (data.template_data?.pages) {
        setPages(data.template_data.pages);
        // Extract all sections from pages for preview compatibility
        const allSections = data.template_data.pages.flatMap((p: any) => p.sections || []);
        setSections(allSections);
      } else if (data.template_data?.sections) {
        // Legacy: migrate old sections format
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
        console.warn('Pages API not available, keeping template pages');
        return;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setPages(data);
      }
    } catch (err) {
      console.warn('Failed to load pages, keeping template pages:', err);
    }
  }
  async function loadCommerceData() {
    if (!siteId) return;
    setLoadingData(true);
    try {
      const ordersRes = await fetch(`/api/sites/${siteId}/orders`);
      const ordersData = await ordersRes.json();
      setOrders(ordersData);

      const clientsRes = await fetch(`/api/sites/${siteId}/clients`);
      const clientsData = await clientsRes.json();
      setClients(clientsData);
    } catch (err) { console.warn('Commerce data failed'); }
    finally { setLoadingData(false); }
  }

  async function loadConversations() {
    if (!siteId) return;
    try {
      const res = await fetch(`/api/sites/${siteId}/conversations`);
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch (err) { console.warn('Conversations failed'); }
  }

  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'clients') {
      loadCommerceData();
    }
    if (activeTab === 'mailbox') {
      loadConversations();
    }
  }, [activeTab, siteId]);

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
    if (site && !pages.length && !generating) handleGenerate();
  }, [site, pages.length]);

  async function handleGenerate() {
    if (!siteId) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/sites/${siteId}/generate`, { method: 'POST' });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      if (data.pages) {
        const displayPages = data.allPages || data.pages;
        setPages(displayPages);
        // Extract sections from generated home page for the main editor
        const allSections = data.pages.flatMap((p: any) => p.sections || []);
        setSections(allSections);
      }
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
      const existingTemplateData = site?.template_data && typeof site.template_data === 'object' ? site.template_data : {};
      const existingPages = Array.isArray((existingTemplateData as any).pages) && (existingTemplateData as any).pages.length > 0
        ? (existingTemplateData as any).pages
        : [{ slug: 'home', title: 'Home', sections: [] }];
      const updatedPages = existingPages.map((page: any, index: number) => index === 0 ? { ...page, sections: updated } : page);

      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_data: {
            ...existingTemplateData,
            pages: updatedPages,
            sections: updated,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSections(updated);
      setPages(prev => prev.map((page, index) => index === 0 ? { ...page, sections: updated } : page));
      setSite(prev => prev ? { ...prev, template_data: { ...(prev.template_data || {}), pages: updatedPages, sections: updated } } : prev);
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
    // Auto-inject header/footer if missing (for backward compat + AI edge cases)
    let sectionsToValidate = sections;
    const hasHeader = sections.some(s => s.type.startsWith('header-'));
    const hasFooter = sections.some(s => s.type.startsWith('footer-'));
    if (!hasHeader || !hasFooter) {
      const patched = [...sectionsToValidate];
      if (!hasHeader) {
        patched.unshift({
          id: genId(),
          type: 'header-simple',
          data: {
            logoText: site.business_name || '',
            links: [{ label: 'Home', url: '/' }],
            ctaText: 'Shop now',
            ctaUrl: '#',
          },
        });
      }
      if (!hasFooter) {
        patched.push({
          id: genId(),
          type: 'footer-basic',
          data: {
            logoText: site.business_name || '',
            showContact: true,
            showHours: false,
            hours: '',
            copyright: `© ${new Date().getFullYear()} ${site.business_name || ''}. All rights reserved.`,
          },
        });
      }
      // save & update state without blocking
      setSections(patched);
      sectionsToValidate = patched;
      handleSaveSections(patched);
    }
    const manifest = TEMPLATE_MANIFESTS[site.business_type as TemplateFamily];
    const validation = validatePublish(sectionsToValidate, manifest);
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
      const params = new URLSearchParams();
      if (data.subdomain) params.set('subdomain', data.subdomain);
      if (data.url) params.set('url', data.url);
      params.set('siteId', data.siteId || siteId);
      window.location.href = `/success?${params.toString()}`;
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

  // --- Fetch Tab Data ---

  useEffect(() => {
    if (activeTab === 'orders' && stripeConnected) {
      fetchOrders();
    } else if (activeTab === 'clients' && stripeConnected) {
      fetchClients();
    }
  }, [activeTab, stripeConnected]);

  async function fetchOrders() {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/orders`);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) { console.error(err); }
    finally { setLoadingData(false); }
  }

  async function fetchClients() {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/clients`);
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (err) { console.error(err); }
    finally { setLoadingData(false); }
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

  async function handlePrintifySync() {
    if (!site) return;
    const apiKey = (site as any).printify_api_key;
    const shopId = (site as any).printify_shop_id;
    if (!apiKey || !shopId) {
      alert('Please configure Printify API Key and Shop ID in Settings first.');
      setActiveTab('settings');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/printify/sync`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to sync Printify');
      }
      const data = await res.json();
      setInventory(data.inventory);
      alert(`Successfully synced ${data.count} products from Printify!`);
    } catch (err: any) {
      console.error(err);
      alert(`Printify Sync Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
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

  const baseTemplate = TEMPLATES[site.business_type as TemplateFamily];
  const template = {
    ...baseTemplate,
    ...(site.template_data || {})
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] flex">
      {/* ── SIDEBAR ── */}
      <div className="w-72 fixed inset-y-0 left-0 bg-white border-r border-black/5 z-50 flex flex-col shadow-[10px_0_40px_-15px_rgba(0,0,0,0.03)]">
        <div className="p-8 pb-4">
          <Link href="/dashboard" className="flex items-center gap-2 group mb-8">
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white font-black text-lg group-hover:scale-105 transition-transform">E</div>
            <span className="font-bold tracking-tight text-xl">Edge Hub</span>
          </Link>
          
          <div className="space-y-1">
            {([
              { id: 'onboarding', label: 'Start here', icon: '✅', count: null },
              { id: 'design', label: 'Edit Page', icon: '✏️', count: null },
              { id: 'pages', label: 'Pages', icon: '📄', count: pages.length },
              { id: 'inventory', label: 'Inventory', icon: '📦', count: inventory.length },
              { id: 'mailbox', label: 'Mailbox', icon: '📨', count: conversations.length || null },
              { id: 'marketing', label: 'Marketing', icon: '📈', count: null },
              { id: 'orders', label: 'Orders', icon: '📊', count: orders.length || null },
              { id: 'clients', label: 'Clients', icon: '👥', count: null },
              { id: 'settings', label: 'Settings', icon: '⚙️', count: null },
            ] as const).map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-black text-white shadow-lg shadow-black/10' 
                    : 'text-black/50 hover:bg-black/5 hover:text-black'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </div>
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-black/5 text-black/40'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto p-6 space-y-3">
          <div className="bg-black/[0.02] rounded-2xl p-4 border border-black/5 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-black/30">Current Project</span>
            </div>
            <p className="text-sm font-bold truncate">{site.business_name}</p>
            <p className="text-[10px] text-black/40 font-medium">Ocean Theme Active</p>
          </div>

          <button 
            onClick={handleLaunch} 
            disabled={launching} 
            className="w-full py-4 rounded-2xl bg-black text-white font-bold text-sm shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {launching ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : site?.status === 'live' ? '↻ Update Site' : '🚀 Publish Site'}
          </button>

          {/* Validation errors */}
          {showValidation && publishValidation && !publishValidation.valid && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-red-800 mb-2">Cannot publish yet:</h4>
              <ul className="space-y-1">
                {publishValidation.errors.map((err, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                    <span>⚠️</span>
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
              {publishValidation.warnings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs font-bold text-red-800 mb-1">Warnings:</p>
                  <ul className="space-y-1">
                    {publishValidation.warnings.map((warn, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                        <span>💡</span>
                        <span>{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <Link href="/dashboard" className="w-full py-3 rounded-2xl border border-black/5 flex items-center justify-center gap-2 text-sm font-bold text-black/40 hover:text-black hover:bg-black/5 transition-all">
            Exit to Dashboard
          </Link>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 ml-72 min-h-screen flex flex-col">
        {/* Sub-header */}
        <div className="h-20 px-8 flex items-center justify-between sticky top-0 z-40 bg-[#F9F8F6]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            {saving && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-black/30 uppercase tracking-widest animate-pulse">
                <div className="w-1 h-1 rounded-full bg-black/30" />
                Saving Changes...
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(`/store/${site?.subdomain || siteId}${site?.status === 'live' ? '' : '?preview=true'}`, '_blank')}
              className="px-6 py-2.5 rounded-full bg-white border border-black/5 text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              👁 View Store
            </button>
            <button onClick={handleGenerate} disabled={generating} className="px-6 py-2.5 rounded-full bg-white border border-black/5 text-xs font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
              {generating ? '...' : '↻'} Regenerate
            </button>
          </div>
        </div>

        {/* Live status bar */}
        {site?.status === 'live' && (
          <div className="px-8 py-2" style={{ backgroundColor: '#ecfdf5' }}>
            <div className="flex items-center gap-2 max-w-7xl mx-auto">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-700">Your store is live</span>
              {site?.subdomain ? (
                <span className="text-xs text-green-600">
                  at <a href={`https://${site.subdomain}.edgemarketplacehub.com`} target="_blank" rel="noopener" className="underline">{site.subdomain}.edgemarketplacehub.com</a>
                </span>
              ) : (
                <span className="text-xs text-green-600">
                  at <a href={`https://www.edgemarketplacehub.com/store/${site.id}`} target="_blank" rel="noopener" className="underline">edgemarketplacehub.com/store/{site.id}</a>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex-1">

      {/* Main content */}
      <div className="max-w-7xl mx-auto">

        {/* ── ONBOARDING TAB ── */}
        {activeTab === 'onboarding' && (
          <div className="p-8 space-y-8">
            <div className="bg-[#1A1A1A] text-white rounded-3xl p-8">
              <p className="text-xs uppercase tracking-[0.25em] text-white/40 font-bold mb-3">Welcome to Edge</p>
              <h2 className="text-3xl md:text-4xl font-serif italic mb-3">Start here: get {site.business_name} ready to take real customers.</h2>
              <p className="text-white/60 max-w-2xl">This is the launch checklist. Work top to bottom: add your offers, connect payments if you sell online, edit the page copy, confirm pages, then publish.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                { icon: '📦', title: site.business_type === 'service-pro' ? 'Add your services' : 'Add products / services', desc: 'Create the offers customers can buy or request. For plumbers: leak repair, drain clearing, water heater service, fixture install.', action: 'Open inventory', tab: 'inventory' as const, done: inventory.length > 0 },
                { icon: '💳', title: 'Connect Stripe', desc: 'Required for checkout and paid orders. If you only take quote requests, you can publish before connecting.', action: site.stripe_account_id ? 'Stripe connected' : 'Connect in settings', tab: 'settings' as const, done: !!site.stripe_account_id },
                { icon: '🖨️', title: 'Optional: connect Printify', desc: 'Only needed for print-on-demand products. Add your API key and Shop ID, then sync inventory.', action: 'Printify settings', tab: 'settings' as const, done: !!(site as any).printify_api_key && !!(site as any).printify_shop_id },
                { icon: '✏️', title: 'Edit the page', desc: 'Use Edit Page to click text directly. Hover a section and press Edit for images, FAQs, reviews, services, and advanced fields.', action: 'Edit page', tab: 'design' as const, done: sections.length > 0 },
                { icon: '📄', title: 'Confirm pages', desc: 'Home, Products / Services, About, and Contact are prebuilt. Add any specialty pages you need.', action: 'Open pages', tab: 'pages' as const, done: pages.length >= 4 },
                { icon: '📨', title: 'Email / mailbox', desc: 'Customer form submissions and inquiries appear in Mailbox. Keep your contact email current in Settings.', action: 'Open mailbox', tab: 'mailbox' as const, done: false },
                { icon: '📈', title: 'Marketing & Social', desc: 'Google Business, Instagram, Facebook, and X are guidance links for now until direct account integrations are enabled.', action: 'Open marketing', tab: 'marketing' as const, done: false },
              ].map(item => (
                <div key={item.title} className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-black/[0.03] flex items-center justify-center text-xl">{item.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{item.title}</h3>
                        {item.done && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">Done</span>}
                      </div>
                      <p className="text-sm text-black/55 leading-relaxed mb-4">{item.desc}</p>
                      <button onClick={() => setActiveTab(item.tab)} className="text-xs font-bold px-4 py-2 rounded-full bg-black text-white hover:bg-black/80">{item.action} →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto py-10 px-6 space-y-8">
            <div>
              <h2 className="text-2xl font-serif italic mb-1">Store Settings</h2>
              <p className="text-black/50 text-sm">Update your business info and payment setup.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-black/5 space-y-5">
              <h3 className="font-bold text-sm uppercase tracking-widest text-black/40">Business Info</h3>
              <div>
                <label className="block text-sm font-bold mb-2">Business name</label>
                <input value={settingsName || site.business_name} onChange={e => setSettingsName(e.target.value)}
                  className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black/30" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Tagline</label>
                <input value={settingsTagline !== '' ? settingsTagline : (site as any).tagline || ''} onChange={e => setSettingsTagline(e.target.value)}
                  placeholder="What makes you unique?"
                  className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black/30" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Contact email</label>
                <input value={settingsEmail || site.contact_email} onChange={e => setSettingsEmail(e.target.value)}
                  className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black/30" />
              </div>
              <button
                disabled={settingsSaving}
                onClick={async () => {
                  setSettingsSaving(true);
                  await fetch(`/api/sites/${siteId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ business_name: settingsName || site.business_name, tagline: settingsTagline, contact_email: settingsEmail || site.contact_email }) });
                  await loadSite();
                  setSettingsSaving(false);
                }}
                className="bg-black text-white text-sm font-bold px-5 py-2.5 rounded-full disabled:opacity-50"
              >
                {settingsSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-black/5 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-black/40">Printify Integration</h3>
              <div>
                <label className="block text-sm font-bold mb-2">Printify API Key</label>
                <input 
                  type="password"
                  value={(site as any).printify_api_key || ''} 
                  onChange={e => setSite(prev => prev ? { ...prev, printify_api_key: e.target.value } as any : null)}
                  placeholder="pr_..."
                  className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black/30" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Shop ID</label>
                <input 
                  value={(site as any).printify_shop_id || ''} 
                  onChange={e => setSite(prev => prev ? { ...prev, printify_shop_id: e.target.value } as any : null)}
                  placeholder="123456"
                  className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black/30" 
                />
              </div>
              <button
                disabled={settingsSaving}
                onClick={async () => {
                  setSettingsSaving(true);
                  await fetch(`/api/sites/${siteId}`, { 
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      printify_api_key: (site as any).printify_api_key,
                      printify_shop_id: (site as any).printify_shop_id
                    }) 
                  });
                  await loadSite();
                  setSettingsSaving(false);
                }}
                className="bg-[#1A1A1A] text-white text-sm font-bold px-5 py-2.5 rounded-full disabled:opacity-50"
              >
                {settingsSaving ? 'Saving…' : 'Save Printify Config'}
              </button>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-black/5 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-black/40">Payments</h3>
              {site.stripe_account_id ? (
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-sm font-bold text-emerald-700">Stripe connected</p>
                  <a href="https://dashboard.stripe.com" target="_blank" className="text-xs text-black/40 underline ml-auto">Open Stripe →</a>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-black/60 mb-3">Connect Stripe to accept payments on your store.</p>
                  <a href={`/api/stripe/connect?siteId=${siteId}`}
                    className="inline-block bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-blue-700">
                    Connect Stripe
                  </a>
                </div>
              )}
            </div>
            {site.subdomain && (
              <div className="bg-white rounded-2xl p-6 border border-black/5">
                <h3 className="font-bold text-sm uppercase tracking-widest text-black/40 mb-3">Your store URL</h3>
                <a href={`/store/${site.subdomain}`} target="_blank"
                  className="text-sm font-mono text-blue-600 underline">
                  {site.subdomain}.edgemarketplacehub.com
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div className="max-w-4xl mx-auto py-10 px-6">
            <h2 className="text-2xl font-serif italic mb-1">Orders</h2>
            <p className="text-black/50 text-sm mb-8">Recent customer purchases from your store.</p>
            
            {!stripeConnected ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-black/5">
                <div className="text-4xl mb-4">💳</div>
                <h3 className="font-bold text-lg mb-2">Connect Stripe to see orders</h3>
                <p className="text-black/50 text-sm mb-6">Once connected, every order will appear here with customer details and revenue.</p>
                <a href={`/api/stripe/connect?siteId=${siteId}`}
                  className="inline-block bg-blue-600 text-white font-bold px-6 py-3 rounded-full hover:bg-blue-700">
                  Connect Stripe
                </a>
              </div>
            ) : loadingData ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full" />
              </div>
            ) : orders.length > 0 ? (
              <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#FAFAF9] border-b border-black/5">
                      <th className="px-6 py-4 font-bold">Order ID</th>
                      <th className="px-6 py-4 font-bold">Customer</th>
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-black/2 transition-colors">
                        <td className="px-6 py-4 font-mono text-[10px] text-black/40">{order.id}</td>
                        <td className="px-6 py-4 font-medium">{order.email}</td>
                        <td className="px-6 py-4 text-black/50">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'succeeded' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">${order.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-black/5">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-bold mb-1">No orders yet</h3>
                <p className="text-black/50 text-sm">Orders will appear here once customers start purchasing.</p>
              </div>
            )}
          </div>
        )}

        {/* ── CLIENTS TAB ── */}
        {activeTab === 'clients' && (
          <div className="max-w-4xl mx-auto py-10 px-6">
            <h2 className="text-2xl font-serif italic mb-1">Clients</h2>
            <p className="text-black/50 text-sm mb-8">People who have purchased from your store.</p>
            
            {!stripeConnected ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-black/5">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="font-bold text-lg mb-2">Connect Stripe to see clients</h3>
                <p className="text-black/50 text-sm mb-6">Your customer list builds automatically from orders.</p>
                <a href={`/api/stripe/connect?siteId=${siteId}`}
                  className="inline-block bg-blue-600 text-white font-bold px-6 py-3 rounded-full hover:bg-blue-700">
                  Connect Stripe
                </a>
              </div>
            ) : loadingData ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full" />
              </div>
            ) : clients.length > 0 ? (
              <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#FAFAF9] border-b border-black/5">
                      <th className="px-6 py-4 font-bold">Client Name</th>
                      <th className="px-6 py-4 font-bold">Email</th>
                      <th className="px-6 py-4 font-bold">First Purchase</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-black/2 transition-colors">
                        <td className="px-6 py-4 font-medium">{client.name}</td>
                        <td className="px-6 py-4 text-black/50">{client.email}</td>
                        <td className="px-6 py-4 text-black/40 text-xs">{new Date(client.created).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-xs font-bold text-blue-600 hover:underline">View History</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-black/5">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="font-bold mb-1">No clients yet</h3>
                <p className="text-black/50 text-sm">Clients will appear here once orders come in.</p>
              </div>
            )}
          </div>
        )}
        {/* ── MAILBOX TAB ── */}
        {activeTab === 'mailbox' && (
          <div className="max-w-4xl mx-auto py-10 px-6 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-serif italic mb-1">Mailbox</h2>
                <p className="text-black/50 text-sm">Unified inbox for site inquiries and customer messages.</p>
              </div>
              <button onClick={loadConversations} className="p-2 rounded-full hover:bg-black/5 text-black/30 transition-colors" title="Refresh">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
              </button>
            </div>
            
            {conversations.length === 0 ? (
              <div className="bg-white rounded-3xl border border-black/5 min-h-[400px] flex items-center justify-center text-center p-10">
                <div className="max-w-sm">
                  <div className="text-4xl mb-4">📨</div>
                  <h3 className="text-lg font-bold mb-2">No messages yet</h3>
                  <p className="text-sm text-black/50">
                    When customers contact you through your site forms or social channels, their messages will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
                <div className="divide-y divide-black/5">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="p-6 hover:bg-black/[0.01] transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center font-bold text-black/30">
                            {conv.customer_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{conv.customer_name}</h4>
                            <p className="text-xs text-black/40">{conv.customer_email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-black/30 font-medium uppercase tracking-wider">
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="ml-13 pl-13">
                        <p className="text-sm font-medium mb-1">{conv.subject}</p>
                        <p className="text-sm text-black/50 line-clamp-2">{conv.last_message}</p>
                      </div>
                      <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-xs font-bold text-blue-600 hover:underline">View full thread →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MARKETING TAB ── */}
        {activeTab === 'marketing' && (
          <div className="max-w-4xl mx-auto py-10 px-6 space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-serif italic mb-1">Marketing & Social</h2>
                <p className="text-black/50 text-sm">Manage your social presence and Google Business Profile.</p>
              </div>
              <button className="px-6 py-2.5 rounded-full bg-black text-white text-xs font-bold shadow-lg hover:scale-105 transition-all">
                + New Social Post
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { name: 'Google Business', icon: '🏪', status: 'Guided setup', description: 'Create or update your Google Business Profile so local customers can find you in Search & Maps.', url: 'https://www.google.com/business/' },
                { name: 'Instagram', icon: '📸', status: 'Guided setup', description: 'Add your Instagram handle and use this page as your posting checklist.', url: 'https://business.instagram.com/' },
                { name: 'X / Twitter', icon: '🐦', status: 'Guided setup', description: 'Set up real-time updates and announcements for your community.', url: 'https://business.x.com/' },
                { name: 'Facebook', icon: '👥', status: 'Guided setup', description: 'Create or update your local Facebook page and share launch posts.', url: 'https://www.facebook.com/business/pages' },
              ].map((platform) => (
                <div key={platform.name} className="bg-white rounded-3xl border border-black/5 p-6 hover:shadow-xl hover:shadow-black/5 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-3xl">{platform.icon}</div>
                    <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">{platform.status}</span>
                  </div>
                  <h3 className="font-bold mb-1">{platform.name}</h3>
                  <p className="text-sm text-black/50 mb-6">{platform.description}</p>
                  <a href={platform.url} target="_blank" rel="noreferrer" className="block text-center w-full py-3 rounded-2xl bg-black/5 text-black font-bold text-xs group-hover:bg-black group-hover:text-white transition-all">
                    Open setup guide →
                  </a>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-black/5 p-8">
              <h3 className="font-bold mb-4">Upcoming Schedule</h3>
              <div className="flex flex-col items-center justify-center py-12 text-center text-black/30">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-black/10 flex items-center justify-center mb-4">📅</div>
                <p className="text-sm font-medium">No posts scheduled yet.</p>
                <p className="text-xs">Connect an account to start planning your content.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="px-8 pb-8" style={{ minHeight: 'calc(100vh - 80px)' }}>
            {/* Canvas — live in-place editor. Add sections only inline between blocks. */}
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
              <div className="bg-[#FAFAF9] border-b border-black/5 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                </div>
                <span className="text-xs text-black/35 mx-auto">
                  Click any text to edit · Hover a section to move or delete it
                </span>
              </div>

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
                <InPlaceEditor
                  sections={sections}
                  inventory={inventory}
                  template={template}
                  siteId={siteId}
                  businessType={site.business_type as TemplateFamily}
                  onSave={handleSaveSections}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="p-8">
            <InventoryPanel 
              inventory={inventory} 
              onAdd={addInventoryItem} 
              onUpdate={updateInventoryItem} 
              onRemove={removeInventoryItem} 
              onGenerateStarters={generateStarterItems} 
              onSave={handleSaveInventory} 
              onImageUpload={handleInventoryImageUpload} 
              onPrintifySync={handlePrintifySync}
              site={site}
              saving={saving} 
            />
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="p-8">
            <PagesPanel pages={pages} site={site} showNewPage={showNewPage} newPageTitle={newPageTitle} newPageSlug={newPageSlug} editingPageId={editingPageId} editPageDraft={editPageDraft} onShowNewPage={() => setShowNewPage(true)} onNewPageTitleChange={setNewPageTitle} onNewPageSlugChange={setNewPageSlug} onCreatePage={handleCreatePage} onCancelNewPage={() => { setShowNewPage(false); setNewPageTitle(''); setNewPageSlug(''); }} onStartEdit={startPageEdit} onCancelEdit={cancelPageEdit} onSaveEdit={savePageEdit} onDelete={handleDeletePage} onDraftChange={setEditPageDraft} />
          </div>
        )}
      </div>
    </div>
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

function InventoryPanel({ inventory, onAdd, onUpdate, onRemove, onGenerateStarters, onSave, onImageUpload, onPrintifySync, site, saving }: {
  inventory: InventoryItem[]; onAdd: () => void; onUpdate: (i: number, f: keyof InventoryItem, v: string) => void;
  onRemove: (i: number) => void; onGenerateStarters: () => void; onSave: () => void; onImageUpload: (i: number, f: File) => void; 
  onPrintifySync: () => void; site: any; saving: boolean;
}) {
  const categoriesUsed = [...new Set(inventory.map(i => i.category).filter(Boolean))];
  const withStock = inventory.filter(i => i.stock != null).length;
  const activeCount = inventory.filter(i => i.enabled !== false).length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-black/50 text-sm mt-1">Manage your products and services.</p>
        </div>
        <div className="flex gap-2">
          {site?.printify_api_key && (
            <button onClick={onPrintifySync} className="px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 flex items-center gap-2">
              <span>🔄</span> Sync Printify
            </button>
          )}
          <Link
            href={`/build/${site?.id}/inventory`}
            className="px-5 py-2.5 rounded-full bg-[#2D2D2D] text-white text-sm font-bold hover:scale-[1.02] transition-transform flex items-center gap-1"
          >
            Open inventory editor ↗
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/5">
          <p className="text-sm text-black/40 mb-1">Total Products</p>
          <p className="text-2xl font-bold">{inventory.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/5">
          <p className="text-sm text-black/40 mb-1">Active</p>
          <p className="text-2xl font-bold">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/5">
          <p className="text-sm text-black/40 mb-1">Categories</p>
          <p className="text-2xl font-bold">{categoriesUsed.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/5">
          <p className="text-sm text-black/40 mb-1">With Stock</p>
          <p className="text-2xl font-bold">{withStock}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button onClick={onGenerateStarters} className="px-4 py-2 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5">✨ Generate starter items</button>
        <button onClick={onAdd} className="px-4 py-2 rounded-full bg-black text-white text-sm font-bold">+ Quick add</button>
      </div>

      {/* Empty State */}
      {inventory.length === 0 && (
        <div className="bg-white border border-dashed border-black/10 rounded-2xl p-12 text-center">
          <p className="text-black/40 mb-4">No products yet</p>
          <div className="flex gap-3 justify-center">
            <button onClick={onGenerateStarters} className="px-6 py-3 rounded-full bg-black text-white font-bold">✨ Generate starters</button>
            <Link
              href={`/build/${site?.id}/inventory`}
              className="px-6 py-3 rounded-full border border-black/10 font-bold hover:border-black/30"
            >
              Open full editor
            </Link>
          </div>
        </div>
      )}

      {/* Product Preview Grid (compact) */}
      {inventory.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((item, index) => (
            <div key={index} className={`bg-white rounded-2xl border overflow-hidden ${item.enabled === false ? 'border-black/5 opacity-50' : 'border-black/5'}`}>
              <div className="h-24 bg-[#F9F8F6] relative">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-black/20 text-sm">No image</div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <input
                    name={`inv-name-${index}`}
                    value={item.name}
                    onChange={e => onUpdate(index, 'name', e.target.value)}
                    placeholder="Name *"
                    className="flex-1 min-w-0 bg-transparent text-sm font-bold placeholder:font-normal focus:outline-none"
                  />
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${item.enabled === false ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700'}`}>
                    {item.enabled === false ? 'Off' : 'On'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    name={`inv-price-${index}`}
                    value={item.price}
                    onChange={e => onUpdate(index, 'price', e.target.value)}
                    placeholder="Price"
                    className="w-20 bg-transparent text-sm text-black/60 focus:outline-none"
                  />
                  <span className="text-xs text-black/30">|</span>
                  <input
                    name={`inv-stock-${index}`}
                    value={item.stock ?? ''}
                    onChange={e => onUpdate(index, 'stock', e.target.value)}
                    placeholder="Stock"
                    className="w-16 bg-transparent text-xs text-black/40 focus:outline-none"
                  />
                  <button
                    onClick={() => onRemove(index)}
                    className="ml-auto text-xs text-black/30 hover:text-red-500 px-2"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {inventory.length > 0 && (
        <div className="flex justify-end">
          <button onClick={onSave} disabled={saving} className="px-6 py-3 rounded-full border border-black/10 font-bold disabled:opacity-50">{saving ? 'Saving...' : 'Save quick edits'}</button>
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
