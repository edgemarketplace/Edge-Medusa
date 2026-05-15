import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { SiteData, GeneratedSection, InventoryItem } from '@/lib/types';
import { TEMPLATES } from '@/lib/templates';
import StorefrontRenderer from './StorefrontRenderer';

interface StorePageProps {
  params: Promise<{ subdomain: string }>;
}

async function getSite(subdomain: string): Promise<{ site: SiteData; inventory: InventoryItem[] } | null> {
  const { data: site } = await supabaseAdmin
    .from('sites')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('status', 'live')
    .single();

  if (!site) return null;

  const { data: inventory } = await supabaseAdmin
    .from('inventory_items')
    .select('*')
    .eq('site_id', site.id)
    .order('created_at', { ascending: true });

  return { site, inventory: inventory || [] };
}

export default async function StorePage({ params }: StorePageProps) {
  const { subdomain } = await params;
  const data = await getSite(subdomain);

  if (!data) notFound();

  const { site, inventory } = data;
  const sections: GeneratedSection[] = site.template_data?.sections || [];
  const template = TEMPLATES[site.business_type as keyof typeof TEMPLATES];

  return (
    <StorefrontRenderer
      site={site}
      sections={sections}
      inventory={inventory}
      template={template}
    />
  );
}
