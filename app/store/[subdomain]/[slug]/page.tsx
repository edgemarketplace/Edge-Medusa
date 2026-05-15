import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { SiteData, GeneratedSection } from '@/lib/types';
import { TEMPLATES } from '@/lib/templates';
import StorefrontRenderer from '../StorefrontRenderer';

interface SubPageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

export default async function SubPage({ params }: SubPageProps) {
  const { subdomain, slug } = await params;

  // Get the site
  const { data: site } = await supabaseAdmin
    .from('sites')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('status', 'live')
    .single();

  if (!site) notFound();

  // Get the page
  const { data: page } = await supabaseAdmin
    .from('pages')
    .select('*')
    .eq('site_id', site.id)
    .eq('slug', slug)
    .single();

  if (!page) notFound();

  const sections: GeneratedSection[] = page.sections || [];
  const template = TEMPLATES[site.business_type as keyof typeof TEMPLATES];

  return (
    <div>
      {/* Sub-page nav bar */}
      <div className="bg-white border-b border-black/5 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href={`/${subdomain}`} className="font-bold text-sm hover:underline">
            ← {site.business_name}
          </a>
          <span className="text-black/20">|</span>
          <span className="text-sm text-black/60">{page.title}</span>
        </div>
        <a
          href={`/${subdomain}`}
          className="text-xs text-black/40 hover:text-black"
        >
          Home
        </a>
      </div>
      <StorefrontRenderer
        site={site}
        sections={sections}
        inventory={[]}
        template={template}
      />
    </div>
  );
}
