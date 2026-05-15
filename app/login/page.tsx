'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const urlError = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('error')
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send login link');
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            We sent a login link to <strong>{email}</strong>. Click the link to access your account.
          </p>
          <p className="text-sm text-black/40">
            The link expires in 30 minutes. Check your spam folder if you don&apos;t see it.
          </p>
          <button onClick={() => { setSent(false); setEmail(''); }} className="mt-6 text-sm text-black/60 underline hover:text-black">
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center font-serif italic font-bold text-white text-xl">E</div>
            <span className="font-bold tracking-tight text-xl">Edge Marketplace Hub</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Access your account</h1>
          <p className="text-black/60">Enter your email to receive a login link</p>
        </div>

        {urlError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm mb-4">
            {urlError === 'expired' && 'This login link has expired. Please request a new one.'}
            {urlError === 'used' && 'This login link has already been used. Please request a new one.'}
            {urlError === 'invalid' && 'Invalid login link. Please request a new one.'}
            {urlError === 'server' && 'Something went wrong. Please try again.'}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold mb-2">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              className="w-full border border-black/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-black/30 bg-white"
              required
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-black text-white py-4 rounded-full text-lg font-bold disabled:opacity-40 hover:scale-[1.02] transition-transform"
          >
            {loading ? 'Sending...' : 'Send login link →'}
          </button>
        </form>

        <p className="text-center text-sm text-black/40 mt-6">
          We&apos;ll email you a magic link to access your stores. No password needed.
        </p>
      </div>
    </div>
  );
}
