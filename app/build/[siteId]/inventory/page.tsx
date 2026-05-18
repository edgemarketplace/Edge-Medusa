'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { InventoryCatalogRow, InventorySyncStatus, InventorySourceType } from '@/lib/inventory/types';

type InventoryItem = InventoryCatalogRow & {
  tax_rate?: number | null;
  shipping_class?: string;
};

type SiteMeta = {
  stripe_account_id?: string | null;
  printify_api_key?: string | null;
  printify_shop_id?: string | null;
};

const CATEGORIES = ['Shirts', 'Hoodies', 'Shorts', 'Accessories', 'Digital Products', 'Services', 'Other'];
const SHIPPING_CLASSES = ['standard', 'express', 'digital', 'heavy'];

const SOURCE_LABELS: Record<InventorySourceType, string> = {
  manual: 'Manual',
  stripe: 'Stripe',
  printify: 'Printify',
  hybrid: 'Hybrid',
};

const SYNC_LABELS: Record<InventorySyncStatus, string> = {
  idle: 'Idle',
  pending: 'Pending',
  synced: 'Synced',
  error: 'Needs attention',
};

function emptyItem(): InventoryItem {
  return {
    id: '',
    site_id: '',
    name: '',
    price: '',
    description: '',
    category: 'Other',
    enabled: true,
    source_type: 'manual',
    source_refs: {},
    sync_status: 'idle',
    sync_error: null,
    fulfillment_mode: 'manual',
    pricing_mode: 'manual',
    status: 'active',
    metadata: {},
    image_url: null,
    sku: null,
    stock: null,
    variants: null,
    external_updated_at: null,
    last_synced_at: null,
  };
}

function badgeClasses(kind: 'dark' | 'green' | 'amber' | 'red' | 'blue' | 'gray') {
  return {
    dark: 'bg-[#2D2D2D] text-white',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-black/5 text-black/55',
  }[kind];
}

function sourceBadgeKind(source: InventorySourceType) {
  if (source === 'printify') return 'blue';
  if (source === 'stripe') return 'amber';
  if (source === 'hybrid') return 'dark';
  return 'gray';
}

function syncBadgeKind(status: InventorySyncStatus) {
  if (status === 'synced') return 'green';
  if (status === 'pending') return 'amber';
  if (status === 'error') return 'red';
  return 'gray';
}

function getConflictRules(item: InventoryItem) {
  const rules: string[] = [];
  const hasStripe = Boolean(item.source_refs?.stripe_product_id) || item.pricing_mode === 'stripe';
  const hasPrintify = Boolean(item.source_refs?.printify_product_id) || item.fulfillment_mode === 'printify';
  const hasManual = item.source_type === 'manual' || item.source_type === 'hybrid';

  if (hasStripe) rules.push('Stripe owns price when pricing mode is Stripe-linked.');
  if (hasPrintify) rules.push('Printify owns fulfillment when fulfillment mode is Printify.');
  if (hasManual && (hasStripe || hasPrintify)) rules.push('Manual edits keep filled descriptive fields during provider imports.');
  if (item.enabled === false && (hasStripe || hasPrintify)) rules.push('Manual disabled state is preserved across imports.');
  if (item.source_type === 'hybrid') rules.push('Provider refs are merged into one hybrid catalog row.');

  return rules;
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not yet';
  return date.toLocaleString();
}

function parseQuickAddLines(input: string): InventoryItem[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, price, category, stock] = line.split('|').map((part) => part?.trim() || '');
      return {
        ...emptyItem(),
        name,
        price,
        category: category || 'Other',
        stock: stock ? Number(stock) : null,
      };
    })
    .filter((item) => item.name && item.price);
}

export default function InventoryPage({ params }: { params: Promise<{ siteId: string }> }) {
  const router = useRouter();
  const [siteId, setSiteId] = useState('');
  const [siteMeta, setSiteMeta] = useState<SiteMeta | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<'stripe' | 'printify' | null>(null);
  const [medusaSyncing, setMedusaSyncing] = useState(false);
  const [resyncingItemId, setResyncingItemId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [quickAddInput, setQuickAddInput] = useState('');

  useEffect(() => {
    params.then(({ siteId }) => setSiteId(siteId));
  }, [params]);

  useEffect(() => {
    if (!siteId) return;
    void Promise.all([loadInventory(siteId), loadSite(siteId)]);
  }, [siteId]);

  async function loadSite(currentSiteId: string) {
    try {
      const res = await fetch(`/api/sites/${currentSiteId}`);
      if (!res.ok) throw new Error('Failed to load site');
      const data = await res.json();
      setSiteMeta(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadInventory(currentSiteId = siteId) {
    try {
      setLoading(true);
      const res = await fetch(`/api/sites/${currentSiteId}/inventory`);
      if (!res.ok) throw new Error('Failed to load inventory');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setStatusMessage('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }

  async function saveItems(nextItems: InventoryItem[], successMessage?: string) {
    setSaving(true);
    setStatusMessage('');

    try {
      const res = await fetch(`/api/sites/${siteId}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: nextItems }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Save failed');
      }

      const saved = await res.json();
      setItems(saved);
      if (successMessage) setStatusMessage(successMessage);
      return saved as InventoryItem[];
    } catch (error: any) {
      console.error(error);
      setStatusMessage(error.message || 'Failed to save inventory.');
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveItem(item: InventoryItem) {
    const nextItems = item.id
      ? items.map((current) => (current.id === item.id ? item : current))
      : [...items, item];

    await saveItems(nextItems, item.id ? 'Item updated.' : 'Item added.');
    setEditingItem(null);
    setShowModal(false);
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Delete this item?')) return;
    await saveItems(items.filter((item) => item.id !== id), 'Item deleted.');
  }

  async function handleToggleEnabled(item: InventoryItem) {
    await handleSaveItem({ ...item, enabled: !item.enabled });
  }

  async function handleProviderSync(source: 'stripe' | 'printify') {
    setSyncing(source);
    setStatusMessage('');
    try {
      const res = await fetch(`/api/sites/${siteId}/${source}/sync`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to import from ${source}`);
      setStatusMessage(`${data.synced || 0} ${source} products imported into master inventory.`);
      await loadInventory();
      await loadSite(siteId);
    } catch (error: any) {
      console.error(error);
      setStatusMessage(error.message || `Failed to import from ${source}.`);
    } finally {
      setSyncing(null);
    }
  }

  async function handleMedusaResync(itemIds?: string[], label?: string) {
    setStatusMessage('');
    setMedusaSyncing(!itemIds?.length);
    setResyncingItemId(itemIds?.length === 1 ? itemIds[0] : null);

    try {
      const res = await fetch(`/api/sites/${siteId}/inventory/resync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: itemIds || [] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to resync Medusa');

      if (Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        await loadInventory();
      }

      const changed = typeof data.updated === 'number'
        ? data.updated
        : (typeof data.created === 'number' ? data.created : 0);
      const existing = typeof data.existing === 'number' ? data.existing : 0;
      setStatusMessage(`${label || 'Medusa sync'} complete. ${changed} changed, ${existing} unchanged.`);
    } catch (error: any) {
      console.error(error);
      setStatusMessage(error.message || 'Failed to resync Medusa.');
    } finally {
      setMedusaSyncing(false);
      setResyncingItemId(null);
    }
  }

  async function handleQuickAdd() {
    const parsed = parseQuickAddLines(quickAddInput);
    if (parsed.length === 0) {
      setStatusMessage('Add lines as Name | Price | Category | Stock');
      return;
    }

    await saveItems([...items, ...parsed], `${parsed.length} products added.`);
    setQuickAddInput('');
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (searchTerm && !`${item.name} ${item.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [filterCategory, items, searchTerm]);

  const categoriesUsed = useMemo(() => [...new Set(items.map((item) => item.category).filter(Boolean))], [items]);
  const sourceCounts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const key = item.source_type || 'manual';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [items]);
  const syncErrors = items.filter((item) => item.sync_status === 'error').length;
  const activeItems = items.filter((item) => item.enabled !== false).length;
  const pricedItems = items.filter((item) => Number(item.price) > 0).length;

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <div className="bg-white border-b border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/build/${siteId}`)} className="text-sm text-black/40 hover:text-black transition-colors">
              ← Back to builder
            </button>
            <div>
              <h1 className="font-bold text-xl">Master inventory</h1>
              <p className="text-sm text-black/40">One catalog for manual items, Stripe imports, and Printify imports.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleProviderSync('stripe')}
              disabled={syncing !== null || medusaSyncing || !siteMeta?.stripe_account_id}
              className="border border-black/10 bg-white px-4 py-2.5 rounded-full text-sm font-bold hover:border-black/20 disabled:opacity-40"
            >
              {syncing === 'stripe' ? 'Importing Stripe…' : 'Import Stripe'}
            </button>
            <button
              onClick={() => handleProviderSync('printify')}
              disabled={syncing !== null || medusaSyncing || !siteMeta?.printify_api_key || !siteMeta?.printify_shop_id}
              className="border border-black/10 bg-white px-4 py-2.5 rounded-full text-sm font-bold hover:border-black/20 disabled:opacity-40"
            >
              {syncing === 'printify' ? 'Importing Printify…' : 'Import Printify'}
            </button>
            <button
              onClick={() => handleMedusaResync(undefined, 'Full Medusa resync')}
              disabled={syncing !== null || medusaSyncing || items.length === 0}
              className="border border-black/10 bg-white px-4 py-2.5 rounded-full text-sm font-bold hover:border-black/20 disabled:opacity-40"
            >
              {medusaSyncing ? 'Resyncing Medusa…' : 'Resync Medusa'}
            </button>
            <button
              onClick={() => {
                setEditingItem(emptyItem());
                setShowModal(true);
              }}
              className="bg-[#2D2D2D] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:scale-[1.02] transition-transform"
            >
              + Add product
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {statusMessage && (
          <div className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-black/70">
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-black/5 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-bold text-lg">Rapid input</h2>
                <p className="text-sm text-black/45">Paste one item per line as Name | Price | Category | Stock</p>
              </div>
              <button
                onClick={handleQuickAdd}
                disabled={saving}
                className="bg-[#2D2D2D] text-white px-4 py-2 rounded-full text-sm font-bold disabled:opacity-40"
              >
                Add lines
              </button>
            </div>
            <textarea
              value={quickAddInput}
              onChange={(e) => setQuickAddInput(e.target.value)}
              rows={5}
              placeholder={['Classic Tee | 29.99 | Shirts | 50', 'VIP Consultation | 150 | Services |', 'Garden Bouquet | 85 | Floral | 12'].join('\n')}
              className="w-full border border-black/10 rounded-2xl px-5 py-4 text-sm resize-none focus:outline-none focus:border-black/30"
            />
          </div>

          <div className="bg-white rounded-3xl border border-black/5 p-6">
            <h2 className="font-bold text-lg mb-4">Connection state</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Stripe catalog</span>
                <span className={`px-2.5 py-1 rounded-full ${badgeClasses(siteMeta?.stripe_account_id ? 'green' : 'gray')}`}>
                  {siteMeta?.stripe_account_id ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Printify catalog</span>
                <span className={`px-2.5 py-1 rounded-full ${badgeClasses(siteMeta?.printify_api_key && siteMeta?.printify_shop_id ? 'green' : 'gray')}`}>
                  {siteMeta?.printify_api_key && siteMeta?.printify_shop_id ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sync issues</span>
                <span className={`px-2.5 py-1 rounded-full ${badgeClasses(syncErrors > 0 ? 'red' : 'green')}`}>
                  {syncErrors}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <StatCard label="Total items" value={String(items.length)} />
          <StatCard label="Active" value={String(activeItems)} />
          <StatCard label="Priced" value={String(pricedItems)} />
          <StatCard label="Manual" value={String(sourceCounts.manual || 0)} />
          <StatCard label="Stripe" value={String(sourceCounts.stripe || 0)} />
          <StatCard label="Printify" value={String(sourceCounts.printify || 0)} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border border-black/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-black/30 bg-white"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${filterCategory === 'all' ? 'bg-[#2D2D2D] text-white' : 'bg-white border border-black/10 text-black/60'}`}
            >
              All ({items.length})
            </button>
            {categoriesUsed.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${filterCategory === category ? 'bg-[#2D2D2D] text-white' : 'bg-white border border-black/10 text-black/60'}`}
              >
                {category} ({items.filter((item) => item.category === category).length})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-black/40">Loading inventory...</div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/5 p-12 text-center">
            <p className="text-xl font-bold mb-2">No items yet</p>
            <p className="text-black/60 mb-6">Add products manually or pull them in from Stripe / Printify.</p>
            <button
              onClick={() => {
                setEditingItem(emptyItem());
                setShowModal(true);
              }}
              className="bg-[#2D2D2D] text-white px-6 py-3 rounded-full font-bold hover:scale-[1.02] transition-transform"
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id || item.name} className={`bg-white rounded-3xl border p-5 transition-all hover:shadow-md ${item.enabled === false ? 'opacity-60 border-black/5' : 'border-black/5'}`}>
                <div className="aspect-video bg-[#F9F8F6] rounded-2xl flex items-center justify-center overflow-hidden mb-4">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-black/20 text-sm">No image</span>}
                </div>

                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                    <p className="text-sm text-black/45">{item.category || 'Uncategorized'}</p>
                  </div>
                  <button
                    onClick={() => handleToggleEnabled(item)}
                    className={`text-xs px-2.5 py-1 rounded-full ${badgeClasses(item.enabled === false ? 'gray' : 'green')}`}
                  >
                    {item.enabled === false ? 'Disabled' : 'Active'}
                  </button>
                </div>

                <p className="text-sm text-black/60 mb-4 line-clamp-2 min-h-[40px]">{item.description || 'No description yet.'}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-bold">${item.price || '0.00'}</span>
                  <span className="text-xs text-black/40">{item.stock == null ? 'Stock not tracked' : `${item.stock} in stock`}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${badgeClasses(sourceBadgeKind(item.source_type || 'manual'))}`}>
                    {SOURCE_LABELS[item.source_type || 'manual']}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${badgeClasses(syncBadgeKind(item.sync_status || 'idle'))}`}>
                    {SYNC_LABELS[item.sync_status || 'idle']}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${badgeClasses(item.pricing_mode === 'stripe' ? 'amber' : 'gray')}`}
                    title={item.pricing_mode === 'stripe' ? 'Stripe remains the source of truth for price on this item.' : 'Price is manually managed in master inventory.'}
                  >
                    {item.pricing_mode === 'stripe' ? 'Stripe pricing' : 'Manual pricing'}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${badgeClasses(item.fulfillment_mode === 'printify' ? 'blue' : 'gray')}`}
                    title={item.fulfillment_mode === 'printify' ? 'Printify remains the source of truth for fulfillment on this item.' : 'Fulfillment is manually managed.'}
                  >
                    {item.fulfillment_mode === 'printify' ? 'Printify fulfillment' : 'Manual fulfillment'}
                  </span>
                  {getConflictRules(item).length > 0 && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${badgeClasses(item.source_type === 'hybrid' ? 'dark' : 'gray')}`}
                      title={getConflictRules(item).join(' ')}
                    >
                      {item.source_type === 'hybrid' ? 'Hybrid rules' : 'Import rules'}
                    </span>
                  )}
                </div>

                {item.sync_error && <p className="text-xs text-red-600 mb-2">{item.sync_error}</p>}
                {getConflictRules(item).length > 0 && (
                  <p className="text-xs text-black/45 mb-4">{getConflictRules(item)[0]}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="flex-1 border border-black/10 py-2 rounded-full text-sm font-medium hover:border-black/30 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleMedusaResync(item.id ? [item.id] : undefined, `${item.name} resync`)}
                    disabled={medusaSyncing || resyncingItemId === item.id || syncing !== null}
                    className="border border-black/10 px-3 py-2 rounded-full text-sm font-medium hover:border-black/30 disabled:opacity-40"
                    title="Reconcile this item back into Medusa"
                  >
                    {resyncingItemId === item.id ? 'Syncing…' : 'Resync'}
                  </button>
                  <button
                    onClick={() => handleSaveItem({ ...item, id: '', name: `${item.name} (Copy)`, source_type: 'manual', source_refs: {}, pricing_mode: 'manual', fulfillment_mode: 'manual' })}
                    className="px-3 py-2 text-sm text-black/50 hover:text-black"
                    title="Duplicate"
                  >
                    ⧉
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="px-4 py-2 text-sm text-red-600 hover:text-red-700">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && editingItem && (
        <InventoryModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          saving={saving}
          siteId={siteId}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/5">
      <p className="text-sm text-black/40 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function InventoryStatusPanel({ item }: { item: InventoryItem }) {
  const medusaProductId = item.source_refs?.medusa_product_id;
  const medusaVariantIds = Array.isArray(item.source_refs?.medusa_variant_ids) ? item.source_refs?.medusa_variant_ids : [];
  const providerRefs = [
    item.source_refs?.stripe_product_id ? `Stripe product: ${item.source_refs.stripe_product_id}` : null,
    item.source_refs?.stripe_price_id ? `Stripe price: ${item.source_refs.stripe_price_id}` : null,
    item.source_refs?.printify_product_id ? `Printify product: ${item.source_refs.printify_product_id}` : null,
    item.source_refs?.printify_shop_id ? `Printify shop: ${item.source_refs.printify_shop_id}` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-3xl border border-black/5 bg-[#F9F8F6] p-5">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`text-xs px-2.5 py-1 rounded-full ${badgeClasses(syncBadgeKind(item.sync_status || 'idle'))}`}>
          {SYNC_LABELS[item.sync_status || 'idle']}
        </span>
        {medusaProductId && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-white text-black/60 border border-black/10">
            Medusa linked
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-black/40 mb-1">Last synced</p>
          <p className="font-medium">{formatDateTime(item.last_synced_at)}</p>
        </div>
        <div>
          <p className="text-black/40 mb-1">External source updated</p>
          <p className="font-medium">{formatDateTime(item.external_updated_at)}</p>
        </div>
        <div>
          <p className="text-black/40 mb-1">Medusa product</p>
          <p className="font-medium break-all">{medusaProductId || 'Not linked yet'}</p>
        </div>
        <div>
          <p className="text-black/40 mb-1">Medusa variants</p>
          <p className="font-medium break-all">{medusaVariantIds.length ? medusaVariantIds.join(', ') : 'None yet'}</p>
        </div>
      </div>

      {providerRefs.length > 0 && (
        <div className="mt-4">
          <p className="text-black/40 mb-2 text-sm">Provider refs</p>
          <div className="flex flex-wrap gap-2">
            {providerRefs.map((ref) => (
              <span key={ref} className="text-xs px-2.5 py-1 rounded-full bg-white border border-black/10 text-black/60">
                {ref}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.sync_error && (
        <div className="mt-4 rounded-2xl bg-red-50 text-red-700 px-4 py-3 text-sm">
          {item.sync_error}
        </div>
      )}
    </div>
  );
}

function InventoryModal({
  item,
  onSave,
  onClose,
  saving,
  siteId,
}: {
  item: InventoryItem;
  onSave: (item: InventoryItem) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  siteId: string;
}) {
  const [form, setForm] = useState<InventoryItem>({ ...emptyItem(), ...item, metadata: item.metadata || {}, source_refs: item.source_refs || {} });
  const [variantName, setVariantName] = useState('');
  const [variantValue, setVariantValue] = useState('');
  const conflictRules = getConflictRules(form);

  function handleAddVariant() {
    if (!variantName || !variantValue) return;
    setForm({
      ...form,
      variants: [...(form.variants || []), { name: variantName, value: variantValue }],
    });
    setVariantName('');
    setVariantValue('');
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">{form.id ? 'Edit inventory item' : 'Add inventory item'}</h2>
            <p className="text-sm text-black/45">Editing the master catalog record used by checkout, storefront, Stripe, and Printify.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full ${badgeClasses(sourceBadgeKind(form.source_type || 'manual'))}`}>
              {SOURCE_LABELS[form.source_type || 'manual']}
            </span>
            {conflictRules.length > 0 && (
              <div className="max-w-xs rounded-2xl bg-[#F9F8F6] border border-black/5 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-black/45 mb-2">Resolution rules</p>
                <ul className="space-y-1 text-xs text-black/60 list-disc pl-4">
                  {conflictRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <InventoryStatusPanel item={form} />

          <div>
            <label className="block text-sm font-bold mb-2">Product name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Price *</label>
              <input type="text" value={String(form.price || '')} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="29.99" className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">SKU</label>
              <input type="text" value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Category</label>
              <select value={form.category || 'Other'} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm bg-white">
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Stock</label>
              <input type="number" value={form.stock ?? ''} onChange={(e) => setForm({ ...form, stock: e.target.value ? Number(e.target.value) : null })} className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Variants</label>
            <div className="flex gap-2 mb-3">
              <input type="text" value={variantName} onChange={(e) => setVariantName(e.target.value)} placeholder="Size" className="flex-1 border border-black/10 rounded-xl px-4 py-2 text-sm" />
              <input type="text" value={variantValue} onChange={(e) => setVariantValue(e.target.value)} placeholder="Large" className="flex-1 border border-black/10 rounded-xl px-4 py-2 text-sm" />
              <button onClick={handleAddVariant} className="px-4 py-2 bg-[#F9F8F6] rounded-xl text-sm font-bold">+ Add</button>
            </div>
            {(form.variants || []).length > 0 && (
              <div className="space-y-2">
                {form.variants!.map((variant, index) => (
                  <div key={`${variant.name}-${variant.value}-${index}`} className="flex items-center justify-between bg-[#F9F8F6] px-4 py-2 rounded-xl">
                    <span className="text-sm"><strong>{variant.name}:</strong> {variant.value}</span>
                    <button onClick={() => setForm({ ...form, variants: (form.variants || []).filter((_, idx) => idx !== index) })} className="text-red-500 text-sm">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Product image</label>
            {form.image_url && <img src={form.image_url} alt={form.name} className="w-full h-48 object-cover rounded-xl mb-3" />}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                formData.append('siteId', siteId);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) return;
                const data = await res.json();
                setForm({ ...form, image_url: data.url });
              }}
              className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#F9F8F6]"
            />
            <input type="text" value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="mt-2 w-full border border-black/10 rounded-2xl px-5 py-3 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Shipping class</label>
              <select value={form.shipping_class || 'standard'} onChange={(e) => setForm({ ...form, shipping_class: e.target.value })} className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm bg-white">
                {SHIPPING_CLASSES.map((shippingClass) => (
                  <option key={shippingClass} value={shippingClass}>{shippingClass}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Tax rate (%)</label>
              <input type="number" value={form.tax_rate ?? ''} onChange={(e) => setForm({ ...form, tax_rate: e.target.value ? Number(e.target.value) : null })} className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Pricing mode</label>
              <select value={form.pricing_mode || 'manual'} onChange={(e) => setForm({ ...form, pricing_mode: e.target.value as any })} className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm bg-white">
                <option value="manual">Manual</option>
                <option value="stripe">Stripe-linked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Fulfillment</label>
              <select value={form.fulfillment_mode || 'manual'} onChange={(e) => setForm({ ...form, fulfillment_mode: e.target.value as any })} className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm bg-white">
                <option value="manual">Manual</option>
                <option value="printify">Printify</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.enabled !== false} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} id="enabled" />
            <label htmlFor="enabled" className="text-sm font-medium">Product is active and visible</label>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={() => onSave(form)} disabled={saving || !form.name || !form.price} className="flex-1 bg-[#2D2D2D] text-white py-3 rounded-full font-bold text-sm disabled:opacity-40">
            {saving ? 'Saving...' : 'Save product'}
          </button>
          <button onClick={onClose} className="px-6 py-3 border border-black/10 rounded-full text-sm font-medium">Cancel</button>
        </div>
      </div>
    </div>
  );
}
