'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  customerEmail: string;
  customerName: string;
  total: number;
  currency: string;
  date: string;
  items: OrderItem[];
  stripeSessionId: string;
  shippingAddress: any;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  shipped: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-700',
  canceled: 'bg-red-100 text-red-700',
};

export default function OrdersPage({ params }: { params: Promise<{ siteId: string }> }) {
  const router = useRouter();
  const [siteId, setSiteId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    params.then(({ siteId }) => setSiteId(siteId));
  }, [params]);

  useEffect(() => {
    if (!siteId) return;
    loadOrders();
  }, [siteId]);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/orders`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: string) {
    try {
      const res = await fetch(`/api/sites/${siteId}/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) throw new Error('Update failed');
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A]">
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-black/5 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/build/${siteId}`)} className="text-sm font-bold text-black/40 hover:text-black">← Back to builder</button>
          <h1 className="font-bold text-lg">Orders</h1>
        </div>
        <button onClick={loadOrders} className="px-4 py-2 rounded-full border border-black/10 text-sm font-bold hover:border-black/30">
          🔄 Refresh
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-black/40">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-xl font-bold mb-2">No orders yet</h2>
            <p className="text-black/50 text-sm">When customers buy from your store, orders will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-2xl border border-black/5 p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                      {order.status}
                    </span>
                    <span className="text-sm text-black/40">{new Date(order.date).toLocaleDateString()}</span>
                  </div>
                  <span className="font-bold text-lg">
                    {order.total.toLocaleString('en-US', { style: 'currency', currency: order.currency })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{order.customerName || order.customerEmail || 'Guest'}</p>
                    <p className="text-black/40 text-xs">{order.items.length} item(s)</p>
                  </div>
                  <button className="text-sm font-bold text-black/40 hover:text-black">View details →</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-sm font-bold">✕</button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[selectedOrder.status] || 'bg-gray-100'}`}>
                  {selectedOrder.status}
                </span>
                <span className="text-sm text-black/40">{new Date(selectedOrder.date).toLocaleString()}</span>
              </div>

              <div>
                <p className="text-xs text-black/40 uppercase font-bold mb-1">Customer</p>
                <p className="font-bold">{selectedOrder.customerName || 'N/A'}</p>
                <p className="text-sm text-black/50">{selectedOrder.customerEmail || 'No email'}</p>
              </div>

              {selectedOrder.shippingAddress && (
                <div>
                  <p className="text-xs text-black/40 uppercase font-bold mb-1">Shipping Address</p>
                  <p className="text-sm text-black/60">
                    {selectedOrder.shippingAddress.line1 || ''}<br />
                    {selectedOrder.shippingAddress.city || ''}, {selectedOrder.shippingAddress.state || ''} {selectedOrder.shippingAddress.postal_code || ''}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-black/40 uppercase font-bold mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#F9F8F6] rounded-xl px-4 py-3">
                      <div>
                        <p className="font-bold text-sm">{it.name}</p>
                        <p className="text-xs text-black/40">Qty: {it.quantity}</p>
                      </div>
                      <p className="font-bold text-sm">{it.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/5 pt-4">
                <p className="font-bold">Total</p>
                <p className="font-bold text-xl">{selectedOrder.total.toLocaleString('en-US', { style: 'currency', currency: selectedOrder.currency })}</p>
              </div>
            </div>

            <div className="flex gap-3">
              {selectedOrder.status === 'pending' && (
                <button onClick={() => updateStatus(selectedOrder.id, 'paid')} className="flex-1 py-3 rounded-full bg-emerald-600 text-white font-bold text-sm hover:scale-[1.02] transition-transform">
                  Mark as Paid
                </button>
              )}
              {selectedOrder.status === 'paid' && (
                <button onClick={() => updateStatus(selectedOrder.id, 'shipped')} className="flex-1 py-3 rounded-full bg-blue-600 text-white font-bold text-sm hover:scale-[1.02] transition-transform">
                  Mark as Shipped
                </button>
              )}
              {selectedOrder.status === 'shipped' && (
                <button onClick={() => updateStatus(selectedOrder.id, 'completed')} className="flex-1 py-3 rounded-full bg-gray-800 text-white font-bold text-sm hover:scale-[1.02] transition-transform">
                  Mark Completed
                </button>
              )}
              {(selectedOrder.status === 'pending' || selectedOrder.status === 'paid') && (
                <button onClick={() => updateStatus(selectedOrder.id, 'canceled')} className="px-4 py-3 rounded-full border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
