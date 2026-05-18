'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ReadinessCheck {
  id: string;
  label: string;
  done: boolean;
  detail: string;
}

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  lowStockItems: number;
  inventoryHealth: {
    totalItems: number;
    missingPrices: number;
    missingImages: number;
    syncErrors: number;
    stripeConnected: boolean;
    printifyConnected: boolean;
  };
  launchReadiness: {
    completed: number;
    total: number;
    checks: ReadinessCheck[];
  };
}

const EMPTY_STATS: DashboardStats = {
  totalOrders: 0,
  totalRevenue: 0,
  activeProducts: 0,
  lowStockItems: 0,
  inventoryHealth: {
    totalItems: 0,
    missingPrices: 0,
    missingImages: 0,
    syncErrors: 0,
    stripeConnected: false,
    printifyConnected: false,
  },
  launchReadiness: {
    completed: 0,
    total: 0,
    checks: [],
  },
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId') || '';
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!siteId) return;

    fetch(`/api/sites/${siteId}/dashboard`)
      .then((res) => res.json())
      .then((data) => {
        setStats({ ...EMPTY_STATS, ...data });
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/sites/${siteId}/orders`)
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setRecentOrders(data.orders.slice(0, 5));
      })
      .catch(() => {});
  }, [siteId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="flex items-center gap-3 text-black/40">
          <div className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!siteId) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-black/40 mb-4">No store selected</p>
          <Link href="/dashboard" className="px-6 py-3 rounded-full bg-black text-white font-bold text-sm">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif italic">Store overview</h1>
            <p className="text-sm text-black/45 mt-1">Track launch readiness, inventory health, and early sales.</p>
          </div>
          <Link href={`/build/${siteId}`} className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-bold hover:scale-[1.02] transition-transform">
            Open Builder →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Orders" value={String(stats.totalOrders)} />
          <StatCard label="Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} />
          <StatCard label="Active Products" value={String(stats.activeProducts)} />
          <StatCard label="Low Stock Alerts" value={String(stats.lowStockItems)} accent={stats.lowStockItems > 0 ? 'text-red-600' : undefined} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-black/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">Launch readiness</h2>
                <p className="text-sm text-black/45">Get the core commerce pieces fully ready before you push traffic.</p>
              </div>
              <span className="text-sm font-bold text-black/55">
                {stats.launchReadiness.completed}/{stats.launchReadiness.total} complete
              </span>
            </div>

            <div className="space-y-3">
              {stats.launchReadiness.checks.map((check) => (
                <div key={check.id} className="flex items-start gap-3 rounded-2xl border border-black/5 px-4 py-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${check.done ? 'bg-emerald-500 text-white' : 'bg-black/10 text-black/40'}`}>
                    {check.done ? '✓' : '•'}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{check.label}</p>
                    <p className="text-sm text-black/50">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-black/5">
            <h2 className="font-bold text-lg mb-4">Inventory health</h2>
            <div className="space-y-3 text-sm">
              <HealthRow label="Total catalog items" value={String(stats.inventoryHealth.totalItems)} />
              <HealthRow label="Items missing prices" value={String(stats.inventoryHealth.missingPrices)} />
              <HealthRow label="Items missing images" value={String(stats.inventoryHealth.missingImages)} />
              <HealthRow label="Sync issues" value={String(stats.inventoryHealth.syncErrors)} />
              <HealthRow label="Stripe connected" value={stats.inventoryHealth.stripeConnected ? 'Yes' : 'No'} tone={stats.inventoryHealth.stripeConnected ? 'good' : 'warn'} />
              <HealthRow label="Printify connected" value={stats.inventoryHealth.printifyConnected ? 'Yes' : 'No'} tone={stats.inventoryHealth.printifyConnected ? 'good' : 'neutral'} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-black/5">
          <h2 className="font-bold mb-4">Quick actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/build/${siteId}/inventory`} className="p-4 border border-black/10 rounded-2xl hover:border-black/20 hover:shadow-sm transition-all text-center group">
              <p className="font-bold text-sm">Master Inventory</p>
              <p className="text-xs text-black/40 mt-1 group-hover:text-black/60">Manual items, Stripe import, Printify import</p>
            </Link>
            <Link href={`/build/${siteId}/settings`} className="p-4 border border-black/10 rounded-2xl hover:border-black/20 hover:shadow-sm transition-all text-center group">
              <p className="font-bold text-sm">Store Settings</p>
              <p className="text-xs text-black/40 mt-1 group-hover:text-black/60">Fees, taxes, shipping, payment setup</p>
            </Link>
            <Link href={`/build/${siteId}`} className="p-4 border border-black/10 rounded-2xl hover:border-black/20 hover:shadow-sm transition-all text-center group">
              <p className="font-bold text-sm">Edit Store</p>
              <p className="text-xs text-black/40 mt-1 group-hover:text-black/60">Update design, content, pages</p>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-black/5">
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
                    <p className="text-xs text-black/40">{new Date(order.created_at).toLocaleDateString()} · {order.status}</p>
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

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-black/5">
      <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent || ''}`}>{value}</p>
    </div>
  );
}

function HealthRow({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'good' | 'warn' }) {
  const color = tone === 'good' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : 'text-black/65';
  return (
    <div className="flex items-center justify-between border-b border-black/5 pb-3 last:border-0 last:pb-0">
      <span className="text-black/50">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
