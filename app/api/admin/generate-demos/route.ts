/**
 * API route to generate 6 demo sites for homepage showcase
 * Call ONCE: POST /api/admin/generate-demos
 * Requires service role key or admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateStorefront } from '@/lib/ai';
import type { TemplateFamily } from '@/lib/types';

interface DemoSite {
  brandName: string;
  businessType: TemplateFamily;
  subdomain: string;
  tagline: string;
  offerings: string;
  contactEmail: string;
}

const DEMO_SITES: DemoSite[] = [
  {
    brandName: 'Noir Atelier',
    businessType: 'retail-core',
    subdomain: 'noiratelier',
    tagline: 'Curated luxury for the modern wardrobe',
    offerings: 'Women\'s fashion, accessories, jewelry',
    contactEmail: 'hello@noiratelier.demo',
  },
  {
    brandName: 'Cedar & Forge',
    businessType: 'food-catering',
    subdomain: 'cedarandforge',
    tagline: 'Farm-to-table catering with rustic elegance',
    offerings: 'Wedding catering, corporate events, private dinners',
    contactEmail: 'events@cedarandforge.demo',
  },
  {
    brandName: 'Bloom & Lore',
    businessType: 'event-floral',
    subdomain: 'bloomandlore',
    tagline: 'Editorial florals for life\'s most beautiful moments',
    offerings: 'Wedding flowers, event decor, installations',
    contactEmail: 'studio@bloomandlore.demo',
  },
  {
    brandName: 'Earth & Ember',
    businessType: 'artisan-market',
    subdomain: 'earthandember',
    tagline: 'Hand-thrown ceramics for intentional living',
    offerings: 'Pottery, dinnerware, home decor, custom commissions',
    contactEmail: 'maker@earthandember.demo',
  },
  {
    brandName: 'Vantage Coaching',
    businessType: 'coach-educator',
    subdomain: 'vantagecoaching',
    tagline: 'Executive coaching for leaders ready to level up',
    offerings: 'Executive coaching, leadership development, career transitions',
    contactEmail: 'coach@vantagecoaching.demo',
  },
  {
    brandName: 'Apex Consulting',
    businessType: 'service-pro',
    subdomain: 'apexconsulting',
    tagline: 'Business transformation for high-growth companies',
    offerings: 'Strategy consulting, operations optimization, team scaling',
    contactEmail: 'team@apexconsulting.demo',
  },
];

export async function POST(req: NextRequest) {
  // Simple security check (can be enhanced later)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.DEMO_GENERATION_KEY || 'demo-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any[] = [];

  for (const site of DEMO_SITES) {
    try {
      // Check if site already exists
      const { data: existing } = await supabaseAdmin
        .from('sites')
        .select('id, subdomain')
        .eq('subdomain', site.subdomain)
        .single();

      if (existing) {
        results.push({ name: site.brandName, status: 'exists', subdomain: site.subdomain });
        continue;
      }

      // Create site
      const { data: newSite, error: createError } = await supabaseAdmin
        .from('sites')
        .insert({
          business_name: site.brandName,
          business_type: site.businessType,
          subdomain: site.subdomain,
          contact_email: site.contactEmail,
          tagline: site.tagline,
          published: false,
        })
        .select()
        .single();

      if (createError || !newSite) {
        results.push({ name: site.brandName, status: 'error', error: createError?.message });
        continue;
      }

      // Generate content
      const { pages } = await generateStorefront(
        site.brandName,
        site.businessType,
        site.offerings,
        site.contactEmail,
        site.tagline
      );

      // Save pages
      for (const page of pages) {
        await supabaseAdmin
          .from('pages')
          .insert({
            site_id: newSite.id,
            slug: page.slug,
            title: page.title,
            sections: page.sections,
            published: true,
          });
      }

      // Publish site
      await supabaseAdmin
        .from('sites')
        .update({
          published: true,
          published_at: new Date().toISOString(),
          status: 'live',
          template_data: { pages, version: 2 },
        })
        .eq('id', newSite.id);

      results.push({
        name: site.brandName,
        status: 'created',
        url: `https://${site.subdomain}.edgemarketplacehub.com`,
      });

      // Delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err: any) {
      results.push({ name: site.brandName, status: 'error', error: err.message });
    }
  }

  return NextResponse.json({ results });
}
