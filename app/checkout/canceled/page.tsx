'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CanceledContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('site_id');

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-black/5 rounded-full flex items-center justify-center text-4xl">
          ✕
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Order not completed</h1>
          <p className="text-black/50 text-sm">
            You can come back anytime to complete your order. Your items are still available.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          {siteId && (
            <button
              onClick={() => window.open(`/store/${siteId}`, '_self')}
              className="px-6 py-3 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5"
            >
              Back to store
            </button>
          )}
          <Link
            href="/"
            className="px-6 py-3 rounded-full bg-black text-white text-sm font-bold hover:scale-[1.02] transition-transform"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCanceledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-black/10 border-t-black/60 rounded-full animate-spin" />
      </div>
    }>
      <CanceledContent />
    </Suspense>
  );
}
