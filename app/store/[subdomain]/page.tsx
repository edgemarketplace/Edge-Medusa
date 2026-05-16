import { supabaseAdmin } from '@/lib/supabase';
import { notFound, redirect } from 'next/navigation';
import type { SiteData, GeneratedSection, InventoryItem } from '@/lib/types';
import { TEMPLATES } from '@/lib/templates';
import StorefrontRenderer from './StorefrontRenderer';

interface StorePageProps {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ success?: string; canceled?: string; session_id?: string }>;
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { subdomain: subdomainOrId } = await params;
  const { success, canceled } = await searchParams;

  // Try to find by subdomain first
  let { data: site } = await supabaseAdmin
    .from('sites')
    .select('*')
    .eq('subdomain', subdomainOrId)
    .eq('status', 'live')
    .single();

  // If not found by subdomain, try by site ID (UUID format — from old Stripe URLs)
  if (!site && subdomainOrId.includes('-')) {
    const { data: siteById } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', subdomainOrId)
      .single();

    if (siteById) {
      if (siteById.subdomain && siteById.status === 'live') {
        redirect(`/store/${siteById.subdomain}`);
      }
      site = siteById;
    }
  }

  if (!site) notFound();

  const { data: inventory } = await supabaseAdmin
    .from('inventory_items')
    .select('*')
    .eq('site_id', site.id)
    .order('created_at', { ascending: true });

  // Extract sections from pages (new format) or fallback to legacy sections
  let sections: GeneratedSection[] = [];
  if (site.template_data?.pages) {
    // New multi-page format: extract all sections from all pages
    sections = site.template_data.pages.flatMap((p: any) => p.sections || []);
  } else if (site.template_data?.sections) {
    // Legacy format
    sections = site.template_data.sections;
  }

  const template = TEMPLATES[site.business_type as keyof typeof TEMPLATES];

  return (
    <StorefrontRenderer
      site={site}
      sections={sections}
      inventory={inventory || []}
      template={template}
    />
  );
}
