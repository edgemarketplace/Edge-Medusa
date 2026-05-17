'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const siteId = searchParams.get('site_id');

  const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId || !siteId) {
      setStatus('error');
      setError('Missing session or site information');
      return;
    }

    // Call checkout confirm API to create order + send emails
    fetch('/api/checkout/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, siteId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Order confirmation failed');
        }
        return res.json();
      })
      .then(() => {
        setStatus('success');
      })
      .catch((err) => {
        console.error('Checkout confirm error:', err);
        // Still show success page — webhook will handle it
        setStatus('success');
      });
  }, [sessionId, siteId]);

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === 'confirming' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-black/10 border-t-black/60 rounded-full animate-spin" />
            <h1 className="text-xl font-bold">Confirming your order...</h1>
            <p className="text-black/50 text-sm">Just a moment while we finalize everything.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center text-4xl">
              ✓
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Thank you for your order!</h1>
              <p className="text-black/50 text-sm">
                Your order has been confirmed. You will receive a confirmation email shortly.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-black/5 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-black/50">Order reference</span>
                <span className="font-mono font-bold">{sessionId?.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/50">Status</span>
                <span className="text-green-700 font-bold text-xs uppercase tracking-wider">Confirmed</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              {siteId && (
                <Link
                  href={`/store/${siteId}`}
                  className="px-6 py-3 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5"
                >
                  Back to store
                </Link>
              )}
              <Link
                href="/"
                className="px-6 py-3 rounded-full bg-black text-white text-sm font-bold hover:scale-[1.02] transition-transform"
              >
                Go home
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center text-4xl">
              ✕
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-black/50 text-sm">{error}</p>
            </div>
            <Link
              href="/"
              className="px-6 py-3 rounded-full bg-black text-white text-sm font-bold"
            >
              Go home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-black/10 border-t-black/60 rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
