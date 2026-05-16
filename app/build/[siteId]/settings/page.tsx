'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';

interface SiteSettings {
  id: string;
  business_name: string;
  contact_email: string;
  platform_fee_pct: number;
  stripe_fee_pct: number;
  tax_rate: number;
  shipping_rate: number;
  shipping_handling: string;
  stripe_account_id: string | null;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId') || '';
  
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!siteId) return;
    fetch(`/api/sites/${siteId}`)
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [siteId]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(`/api/sites/${siteId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform_fee_pct: settings.platform_fee_pct,
          tax_rate: settings.tax_rate,
          shipping_rate: settings.shipping_rate,
          shipping_handling: settings.shipping_handling,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      setMessage('Settings saved successfully!');
    } catch (err: any) {
      setMessage(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!settings) return <div className="p-8">Site not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-serif mb-8">Store Settings</h1>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white p-8 rounded-xl shadow-sm space-y-6">
          {/* Stripe Connect */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Processing</h2>
            {settings.stripe_account_id ? (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-700">✓ Stripe Connected</p>
                <p className="text-sm text-green-600 mt-1">Account: {settings.stripe_account_id}</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">Connect your Stripe account to accept payments</p>
                <button
                  onClick={() => {
                    window.location.href = `/api/stripe/connect?siteId=${siteId}`;
                  }}
                  className="bg-[#635BFF] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4B44F7]"
                >
                  Connect Stripe
                </button>
              </div>
            )}
          </div>

          {/* Cost Control */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Cost Control</h2>
            <p className="text-gray-600 mb-4">Control how costs are split between you and your customers</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Platform Fee (% charged to customers)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.platform_fee_pct}
                  onChange={(e) => setSettings({...settings, platform_fee_pct: Number(e.target.value)})}
                  className="w-full p-3 border rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-1">This is your revenue. 5% is default for Free plan.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.tax_rate}
                  onChange={(e) => setSettings({...settings, tax_rate: Number(e.target.value)})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Shipping Rate ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.shipping_rate}
                  onChange={(e) => setSettings({...settings, shipping_rate: Number(e.target.value)})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Shipping Handling
                </label>
                <select
                  value={settings.shipping_handling}
                  onChange={(e) => setSettings({...settings, shipping_handling: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="merchant">Merchant pays shipping</option>
                  <option value="customer">Customer pays shipping</option>
                  <option value="split">Split costs</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
