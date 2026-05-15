import Link from 'next/link';

interface CheckoutCanceledProps {
  searchParams: Promise<{ site_id?: string }>;
}

export default async function CheckoutCanceledPage({ searchParams }: CheckoutCanceledProps) {
  const { site_id } = await searchParams;

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">↩️</span>
        </div>
        <h1 className="text-2xl font-bold mb-3">Payment canceled</h1>
        <p className="text-black/60 mb-6">
          Your payment was canceled. No charges were made.
        </p>
        {site_id && (
          <Link href={`/build/${site_id}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white font-bold hover:scale-105 transition-transform">
            ← Back to editor
          </Link>
        )}
      </div>
    </div>
  );
}
