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
  }, [siteId]);

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">Total Orders</p>
            <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">Revenue</p>
            <p className="text-3xl font-bold mt-2">${stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">Active Products</p>
            <p className="text-3xl font-bold mt-2">{stats.activeProducts}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm">Low Stock Alerts</p>
            <p className="text-3xl font-bold mt-2 text-red-600">{stats.lowStockItems}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/build/${siteId}/inventory`}
              className="p-4 border rounded-lg hover:bg-gray-50 text-center"
            >
              <p className="font-medium">Manage Inventory</p>
              <p className="text-sm text-gray-500 mt-1">Add products, update stock</p>
            </Link>
            <Link
              href={`/build/${siteId}/settings`}
              className="p-4 border rounded-lg hover:bg-gray-50 text-center"
            >
              <p className="font-medium">Store Settings</p>
              <p className="text-sm text-gray-500 mt-1">Fees, taxes, shipping</p>
            </Link>
            <Link
              href={`/build/${siteId}`}
              className="p-4 border rounded-lg hover:bg-gray-50 text-center"
            >
              <p className="font-medium">Edit Store</p>
              <p className="text-sm text-gray-500 mt-1">Update design, content</p>
            </Link>
          </div>
        </div>

        {/* Recent Orders Placeholder */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <p className="text-gray-500 text-center py-8">No orders yet. Share your store to start getting sales!</p>
        </div>
      </div>
    </div>
  );
}
