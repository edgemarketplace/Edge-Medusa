'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface InventoryItem {
  id?: string;
  name: string;
  price: string;
  description: string;
  category: string;
  image_url?: string;
  variants?: Array<{ name: string; value: string; price_adjustment?: string }>;
  stock?: number | null;
  sku?: string;
  tax_rate?: number | null;
  shipping_class?: string;
  enabled: boolean;
}

const CATEGORIES = [
  'Shirts',
  'Hoodies',
  'Shorts',
  'Accessories',
  'Digital Products',
  'Services',
  'Other',
];

const SHIPPING_CLASSES = ['standard', 'express', 'digital', 'heavy'];

export default function InventoryPage({ params }: { params: Promise<{ siteId: string }> }) {
  const router = useRouter();
  const [siteId, setSiteId] = useState<string>('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    params.then(({ siteId }) => setSiteId(siteId));
  }, [params]);

  useEffect(() => {
    if (!siteId) return;
    loadInventory();
  }, [siteId]);

  async function loadInventory() {
    try {
      const res = await fetch(`/api/sites/${siteId}/inventory`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveItem(item: InventoryItem) {
    setSaving(true);
    try {
      const updatedItems = item.id
        ? items.map(i => i.id === item.id ? item : i)
        : [...items, { ...item, id: `temp-${Date.now()}` }];
      
      setItems(updatedItems);
      
      // Save to API
      const res = await fetch(`/api/sites/${siteId}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems.map(({ id, ...rest }) => rest) }),
      });

      if (!res.ok) throw new Error('Save failed');
      
      // Reload to get real IDs
      await loadInventory();
      setEditingItem(null);
      setShowAddModal(false);
    } catch (err: any) {
      console.error(err);
      alert('Failed to save item');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Delete this item?')) return;
    
    const updatedItems = items.filter(i => i.id !== id);
    setItems(updatedItems);
    
    await fetch(`/api/sites/${siteId}/inventory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updatedItems.map(({ id, ...rest }) => rest) }),
    });
  }

  function handleToggleEnabled(item: InventoryItem) {
    const updated = { ...item, enabled: !item.enabled };
    handleSaveItem(updated);
  }

  const filteredItems = items.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const categoriesUsed = [...new Set(items.map(i => i.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <div className="bg-white border-b border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/build/${siteId}`)}
              className="text-sm text-black/40 hover:text-black transition-colors"
            >
              ← Back to builder
            </button>
            <h1 className="font-bold text-xl">Inventory</h1>
            <span className="text-sm text-black/40">{items.length} items</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingItem({
                  name: '',
                  price: '',
                  description: '',
                  category: categoriesUsed[0] || 'Other',
                  enabled: true,
                });
                setShowAddModal(true);
              }}
              className="bg-[#2D2D2D] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:scale-[1.02] transition-transform"
            >
              + Add product
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-black/30 bg-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterCategory === 'all'
                  ? 'bg-[#2D2D2D] text-white'
                  : 'bg-white border border-black/10 text-black/60 hover:border-black/20'
              }`}
            >
              All ({items.length})
            </button>
            {categoriesUsed.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === cat
                    ? 'bg-[#2D2D2D] text-white'
                    : 'bg-white border border-black/10 text-black/60 hover:border-black/20'
                }`}
              >
                {cat} ({items.filter(i => i.category === cat).length})
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-black/5">
            <p className="text-sm text-black/40 mb-1">Total Products</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-black/5">
            <p className="text-sm text-black/40 mb-1">Active</p>
            <p className="text-2xl font-bold">{items.filter(i => i.enabled).length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-black/5">
            <p className="text-sm text-black/40 mb-1">Categories</p>
            <p className="text-2xl font-bold">{categoriesUsed.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-black/5">
            <p className="text-sm text-black/40 mb-1">With Stock</p>
            <p className="text-2xl font-bold">{items.filter(i => i.stock).length}</p>
          </div>
        </div>

        {/* Inventory Grid */}
        {loading ? (
          <div className="text-center py-20 text-black/40">Loading inventory...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl font-bold mb-2">No products yet</p>
            <p className="text-black/60 mb-6">Add your first product to start selling</p>
            <button
              onClick={() => {
                setEditingItem({
                  name: '',
                  price: '',
                  description: '',
                  category: 'Other',
                  enabled: true,
                });
                setShowAddModal(true);
              }}
              className="bg-[#2D2D2D] text-white px-6 py-3 rounded-full font-bold hover:scale-[1.02] transition-transform"
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md ${
                  item.enabled ? 'border-black/5' : 'border-black/5 opacity-50'
                }`}
              >
                {/* Product Image */}
                <div className="aspect-video bg-[#F9F8F6] rounded-t-2xl flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-t-2xl" />
                  ) : (
                    <span className="text-black/20 text-sm">No image</span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <button
                      onClick={() => handleToggleEnabled(item)}
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.enabled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {item.enabled ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                  
                  <p className="text-sm text-black/60 mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold">${item.price}</span>
                    {item.category && (
                      <span className="text-xs bg-[#F9F8F6] px-2 py-1 rounded-full text-black/40">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {item.variants && item.variants.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-black/40 mb-1">Variants:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.variants.map((v, idx) => (
                          <span key={idx} className="text-xs bg-[#F9F8F6] px-2 py-1 rounded">
                            {v.name}: {v.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setShowAddModal(true);
                      }}
                      className="flex-1 border border-black/10 py-2 rounded-full text-sm font-medium hover:border-black/30 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id!)}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <InventoryModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          saving={saving}
          siteId={siteId}
        />
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
  item: InventoryItem | null;
  onSave: (item: InventoryItem) => void;
  onClose: () => void;
  saving: boolean;
  siteId: string;
}) {
  const [form, setForm] = useState<InventoryItem>(
    item || {
      name: '',
      price: '',
      description: '',
      category: 'Other',
      enabled: true,
    }
  );
  const [variantName, setVariantName] = useState('');
  const [variantValue, setVariantValue] = useState('');

  function handleAddVariant() {
    if (!variantName || !variantValue) return;
    setForm({
      ...form,
      variants: [...(form.variants || []), { name: variantName, value: variantValue }],
    });
    setVariantName('');
    setVariantValue('');
  }

  function handleRemoveVariant(idx: number) {
    setForm({
      ...form,
      variants: (form.variants || []).filter((_, i) => i !== idx),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {item?.id ? 'Edit Product' : 'Add Product'}
        </h2>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold mb-2">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Classic Cotton T-Shirt"
              className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-black/30"
              required
            />
          </div>

          {/* Price & SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Price *</label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="29.99"
                className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-black/30"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">SKU</label>
              <input
                type="text"
                value={form.sku || ''}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="SKU-001"
                className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-black/30"
              />
            </div>
          </div>

          {/* Category & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-black/30 bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Stock (optional)</label>
              <input
                type="number"
                value={form.stock ?? ''}
                onChange={(e) => setForm({ ...form, stock: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="100"
                className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-black/30"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your product..."
              rows={3}
              className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-black/30 resize-none"
            />
          </div>

          {/* Variants */}
          <div>
            <label className="block text-sm font-bold mb-2">Variants (Size, Color, etc.)</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="Size"
                className="flex-1 border border-black/10 rounded-xl px-4 py-2 text-sm"
              />
              <input
                type="text"
                value={variantValue}
                onChange={(e) => setVariantValue(e.target.value)}
                placeholder="Large"
                className="flex-1 border border-black/10 rounded-xl px-4 py-2 text-sm"
              />
              <button
                onClick={handleAddVariant}
                className="px-4 py-2 bg-[#F9F8F6] rounded-xl text-sm font-bold hover:bg-[#F0F0F0]"
              >
                + Add
              </button>
            </div>
            {(form.variants || []).length > 0 && (
              <div className="space-y-2">
                {form.variants!.map((v, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#F9F8F6] px-4 py-2 rounded-xl">
                    <span className="text-sm"><strong>{v.name}:</strong> {v.value}</span>
                    <button onClick={() => handleRemoveVariant(idx)} className="text-red-500 text-sm">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold mb-2">Product Image</label>
            {form.image_url && (
              <div className="mb-3 relative">
                <img src={form.image_url} alt={form.name} className="w-full h-48 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setForm({ ...form, image_url: '' }); }}
                  className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                formData.append('siteId', siteId);
                try {
                  const res = await fetch(`/api/upload`, { method: 'POST', body: formData });
                  if (!res.ok) throw new Error('Upload failed');
                  const { url } = await res.json();
                  setForm({ ...form, image_url: url });
                } catch (err) {
                  alert('Image upload failed. Try URL instead.');
                }
              }}
              className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#F9F8F6] hover:file:bg-[#F0F0F0]"
            />
            <p className="text-xs text-black/40 mt-1">Or enter URL below</p>
            <input
              type="text"
              value={form.image_url || ''}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
              className="mt-2 w-full border border-black/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-black/30"
            />
          </div>

          {/* Shipping & Tax */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Shipping Class</label>
              <select
                value={form.shipping_class || 'standard'}
                onChange={(e) => setForm({ ...form, shipping_class: e.target.value })}
                className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-black/30 bg-white"
              >
                {SHIPPING_CLASSES.map(sc => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Tax Rate (%)</label>
              <input
                type="number"
                value={form.tax_rate ?? ''}
                onChange={(e) => setForm({ ...form, tax_rate: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="8.25"
                className="w-full border border-black/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-black/30"
              />
            </div>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              id="enabled"
            />
            <label htmlFor="enabled" className="text-sm font-medium">Product is active and visible</label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name || !form.price}
            className="flex-1 bg-[#2D2D2D] text-white py-3 rounded-full font-bold text-sm disabled:opacity-40 hover:scale-[1.02] transition-transform"
          >
            {saving ? 'Saving...' : 'Save Product'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-black/10 rounded-full text-sm font-medium hover:border-black/30 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
