'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function EmailGatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId') || '';
  const email = searchParams.get('email') || '';
  const businessName = searchParams.get('business') || 'Your Store';

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [emailValue, setEmailValue] = useState(email);

  async function handleSendLink() {
    if (!emailValue.trim() || !emailValue.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue.trim() }),
      });
      if (!res.ok) throw new Error('Failed to send link');
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleContinueLater() {
    router.push(`/build/${siteId}`);
  }

  function handleSkip() {
    // Set a session flag so we don't ask again immediately
    sessionStorage.setItem(`skipped_email_${siteId}`, 'true');
    router.push(`/build/${siteId}`);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">Check your email</h1>
          <p className="text-black/60 mb-6">
            We sent a login link to <strong>{emailValue}</strong>. Click it to access your account and manage your store.
          </p>
          <button onClick={handleContinueLater} className="w-full px-4 py-3 rounded-full bg-black text-white font-bold">
            Continue to builder →
          </button>
          <p className="text-xs text-black/30 mt-3">
            You can always sign in later from the builder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{businessName} is ready!</h1>
          <p className="text-black/60">
            Create an account to save your progress and manage your store.
          </p>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl p-6 mb-4">
          <label htmlFor="gate-email" className="block text-sm font-bold mb-2">Email address</label>
          <input
            id="gate-email"
            name="email"
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            placeholder="you@yourbusiness.com"
            className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black/30 mb-3"
            autoComplete="email"
          />
          {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
          <button
            onClick={handleSendLink}
            disabled={loading || !emailValue.trim()}
            className="w-full bg-black text-white py-3 rounded-full text-sm font-bold disabled:opacity-40 hover:scale-[1.02] transition-transform"
          >
            {loading ? 'Sending...' : 'Create account & send login link'}
          </button>
          <p className="text-[11px] text-black/40 text-center mt-2">
            No password needed. We'll email you a magic link.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleContinueLater}
            className="w-full px-4 py-3 rounded-full border border-black/10 text-sm font-bold hover:bg-black/5 transition-colors"
          >
            Continue for later
          </button>
          <button
            onClick={handleSkip}
            className="w-full px-4 py-2 text-xs text-black/40 hover:text-black transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
