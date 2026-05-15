import Link from 'next/link';

interface SuccessPageProps {
  searchParams: Promise<{ subdomain?: string; url?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { subdomain, url } = await searchParams;
  const storeUrl = url || (subdomain ? `https://${subdomain}.edgemarketplacehub.com` : null);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans flex items-center justify-center">
      <div className="max-w-lg mx-auto text-center px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-serif italic tracking-tight mb-4">
          Your store is live! 🎉
        </h1>
        <p className="text-black/60 text-lg mb-8">
          Your storefront is now live and ready to accept customers.
        </p>
        {storeUrl && (
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-black text-white font-bold text-lg hover:scale-105 transition-transform mb-6"
          >
            Visit your store
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
        <div className="mt-8">
          <Link href="/" className="text-black/40 hover:text-black text-sm">
            ← Back to Edge Marketplace Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
