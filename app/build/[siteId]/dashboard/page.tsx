'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  lowStockItems: number;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId') || '';
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!siteId) return;

    // Fetch dashboard stats
    fetch(`/api/sites/${siteId}/dashboard`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch recent orders
    fetch(`/api/sites/${siteId}/orders`)
      .then(res => res.json())
      .then(data => {
        if (data.orders) setRecentOrders(data.orders.slice(0, 5));
      })
      .catch(() => {});
  }, [siteId]);

  if (loading) return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      <div className="flex items-center gap-3 text-black/40">
        <div className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
        Loading...
      </div>
    </div>
  );

  if (!siteId) return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      <div className="text-center">
        <p className="text-black/40 mb-4">No store selected</p>
        <Link href="/dashboard" className="px-6 py-3 rounded-full bg-black text-white font-bold text-sm">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F8F6] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif italic">Store Overview</h1>
          <Link
            href={`/build/${siteId}`}
            className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-bold hover:scale-[1.02] transition-transform"
          >
            Open Builder →
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-black/5">
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-2">Total Orders</p>
            <p className="text-3xl font-bold">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-black/5">
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-2">Revenue</p>
            <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-black/5">
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-2">Active Products</p>
            <p className="text-3xl font-bold">{stats.activeProducts}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-black/5">
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-2">Low Stock Alerts</p>
            <p className="text-3xl font-bold text-red-600">{stats.lowStockItems}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl border border-black/5 mb-8">
          <h2 className="font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/build/${siteId}/inventory`}
              className="p-4 border border-black/10 rounded-2xl hover:border-black/20 hover:shadow-sm transition-all text-center group"
            >
              <p className="font-bold text-sm">Manage Inventory</p>
              <p className="text-xs text-black/40 mt-1 group-hover:text-black/60">Add products, update stock</p>
            </Link>
            <Link
              href={`/build/${siteId}/settings`}
              className="p-4 border border-black/10 rounded-2xl hover:border-black/20 hover:shadow-sm transition-all text-center group"
            >
              <p className="font-bold text-sm">Store Settings</p>
              <p className="text-xs text-black/40 mt-1 group-hover:text-black/60">Fees, taxes, shipping</p>
            </Link>
            <Link
              href={`/build/${siteId}`}
              className="p-4 border border-black/10 rounded-2xl hover:border-black/20 hover:shadow-sm transition-all text-center group"
            >
              <p className="font-bold text-sm">Edit Store</p>
              <p className="text-xs text-black/40 mt-1 group-hover:text-black/60">Update design, content</p>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-2xl border border-black/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Recent Orders</h2>
            <Link href={`/build/${siteId}/orders`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-black/40">No orders yet. Share your store to start getting sales!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
                  <div>
                    <p className="font-bold text-sm">{order.customer_email || 'Anonymous'}</p>
                    <p className="text-xs text-black/40">
                      {new Date(order.created_at).toLocaleDateString()} · {order.status}
                    </p>
                  </div>
                  <p className="font-bold text-sm">${(order.total_cents / 100).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
