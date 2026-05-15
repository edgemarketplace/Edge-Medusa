'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Connecting...');
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`Stripe connection failed: ${errorParam}`);
      return;
    }

    if (!code) {
      setError('No authorization code received');
      return;
    }

    // Exchange the code for a Stripe account ID
    fetch('/api/stripe/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('Stripe connected successfully!');
          // Redirect back to build page after a moment
          try {
            const decoded = JSON.parse(Buffer.from(state || '', 'base64').toString());
            if (decoded.siteId) {
              setTimeout(() => {
                window.location.href = `/build/${decoded.siteId}`;
              }, 1500);
            }
          } catch {
            // ignore
          }
        } else {
          setError(data.error || 'Connection failed');
        }
      })
      .catch((err) => {
        setError(err.message || 'Connection failed');
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Connection Failed</h1>
            <p className="text-red-600">{error}</p>
          </>
        ) : (
          <>
            <div className="h-10 w-10 border-2 border-black/10 border-t-black rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">{status}</h1>
            <p className="text-black/50">Please wait...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function StripeCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-black/10 border-t-black rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Connecting...</h1>
          <p className="text-black/50">Please wait...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
