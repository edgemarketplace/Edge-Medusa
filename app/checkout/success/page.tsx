import { supabaseAdmin } from '@/lib/supabase';
import { redirect, notFound } from 'next/navigation';

interface CheckoutSuccessProps {
  searchParams: Promise<{ session_id?: string; site_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessProps) {
  const { session_id, site_id } = await searchParams;

  if (!site_id) {
    redirect('/');
  }

  // Look up the site
  const { data: site } = await supabaseAdmin
    .from('sites')
    .select('id, subdomain, business_name, status')
    .eq('id', site_id)
    .single();

  if (!site) {
    notFound();
  }

  // If the site has a subdomain and is live, redirect to the storefront
  if (site.status === 'live' && site.subdomain) {
    redirect(`/store/${site.subdomain}?success=true`);
  }

  // Otherwise redirect to the build page
  redirect(`/build/${site.id}`);
}
